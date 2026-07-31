use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{Manager, RunEvent, State};

#[derive(Default)]
struct ApiState {
    port: Mutex<Option<u16>>,
    child: Mutex<Option<Child>>,
}

/// Ports to try for the local API. The first free one wins.
const PORTS: [u16; 3] = [8000, 8001, 8002];

fn find_free_port() -> u16 {
    for port in PORTS {
        if TcpListener::bind(("127.0.0.1", port)).is_ok() {
            return port;
        }
    }
    TcpListener::bind(("127.0.0.1", 0))
        .ok()
        .and_then(|l| l.local_addr().ok())
        .map(|a| a.port())
        .unwrap_or(PORTS[0])
}

fn api_bin(resource_dir: &Path) -> Option<PathBuf> {
    let exe = if cfg!(target_os = "windows") {
        "desktop-api.exe"
    } else {
        "desktop-api"
    };
    [
        resource_dir.join("resources/api/desktop-api").join(exe),
        resource_dir.join("api/desktop-api").join(exe),
    ]
    .into_iter()
    .find(|p| p.exists())
}

fn spawn_api(state: &ApiState, resource_dir: &Path) -> Option<u16> {
    let bin = api_bin(resource_dir)?;
    let port = find_free_port();

    let mut cmd = Command::new(bin);
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // New process group so the whole tree (including the embedded
        // PostgreSQL) can be terminated together on app exit.
        cmd.process_group(0);
    }
    cmd.env("PORT", port.to_string())
        .env("EMBEDDED_DB", "1")
        .env("DEBUG", "0");
    cmd.stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    let child = cmd.spawn().ok()?;
    *state.port.lock().unwrap() = Some(port);
    *state.child.lock().unwrap() = Some(child);
    Some(port)
}

fn health_ok(port: u16) -> bool {
    let mut conn = match TcpStream::connect(("127.0.0.1", port)) {
        Ok(c) => c,
        Err(_) => return false,
    };
    let _ = conn.set_read_timeout(Some(Duration::from_secs(2)));
    let _ = conn.set_write_timeout(Some(Duration::from_secs(2)));
    if conn
        .write_all(b"GET /api/health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n")
        .is_err()
    {
        return false;
    }
    let mut buf = [0u8; 1024];
    let n = match conn.read(&mut buf) {
        Ok(n) if n > 0 => n,
        _ => return false,
    };
    let resp = String::from_utf8_lossy(&buf[..n]);
    resp.contains("200 OK")
}

fn wait_for_api(port: u16, timeout: Duration) -> bool {
    let deadline = std::time::Instant::now() + timeout;
    while std::time::Instant::now() < deadline {
        if health_ok(port) {
            return true;
        }
        std::thread::sleep(Duration::from_millis(500));
    }
    false
}

/// Terminate the API and its whole process tree (the embedded PostgreSQL).
/// On Unix the API runs as its own process-group leader, so a group kill
/// reaches the database too; on Windows taskkill recurses the tree.
fn kill_process_tree(child: &mut Child) {
    #[cfg(unix)]
    {
        let group = format!("-{}", child.id());
        let _ = Command::new("kill").args(["-TERM", &group]).status();
        for _ in 0..6 {
            if child.try_wait().ok().flatten().is_some() {
                return;
            }
            std::thread::sleep(Duration::from_millis(500));
        }
        let _ = Command::new("kill").args(["-KILL", &group]).status();
        let _ = child.wait();
    }
    #[cfg(windows)]
    {
        let _ = Command::new("taskkill")
            .args(["/PID", &child.id().to_string(), "/T", "/F"])
            .status();
        let _ = child.wait();
    }
}

#[tauri::command]
async fn get_api_url(app: tauri::AppHandle, state: State<'_, ApiState>) -> Result<String, String> {
    let port = match *state.port.lock().unwrap() {
        Some(p) => p,
        None => {
            let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
            spawn_api(&state, &resource_dir).ok_or_else(|| "desktop-api bundle not found".to_string())?
        }
    };

    let _ = tauri::async_runtime::spawn_blocking(move || {
        wait_for_api(port, Duration::from_secs(120))
    })
    .await
    .map_err(|e| e.to_string())?;

    Ok(format!("http://127.0.0.1:{}", port))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ApiState::default())
        .invoke_handler(tauri::generate_handler![greet, get_api_url])
        .setup(|_app| {
            // Start warming up the bundled API as soon as the app boots.
            #[cfg(not(debug_assertions))]
            {
                if let Ok(resource_dir) = _app.path().resource_dir() {
                    let state = _app.state::<ApiState>();
                    spawn_api(&state, &resource_dir);
                }
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::Exit = event {
            if let Some(mut child) = app_handle
                .state::<ApiState>()
                .child
                .lock()
                .unwrap()
                .take()
            {
                kill_process_tree(&mut child);
            }
        }
    });
}
