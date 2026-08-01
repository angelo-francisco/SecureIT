mod bootstrap;

use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{Manager, RunEvent, State};
#[cfg(not(debug_assertions))]
use tauri::Emitter;

#[derive(Default)]
struct ApiState {
    port: Mutex<Option<u16>>,
    child: Mutex<Option<Child>>,
    api_dir: Mutex<Option<PathBuf>>,
    models_dir: Mutex<Option<PathBuf>>,
}

/// Ask the OS for a free ephemeral port — the standard approach for
/// background network services. Binding port 0 makes the kernel assign an
/// unused port, so the API never clashes with other services on the machine
/// (and it behaves the same on Linux and Windows).
fn pick_free_port() -> Option<u16> {
    TcpListener::bind(("127.0.0.1", 0))
        .ok()
        .and_then(|l| l.local_addr().ok())
        .map(|a| a.port())
}

fn api_bin(api_dir: Option<&Path>, resource_dir: &Path) -> Option<PathBuf> {
    let exe = if cfg!(target_os = "windows") {
        "desktop-api.exe"
    } else {
        "desktop-api"
    };
    let mut candidates = vec![
        resource_dir.join("resources/api/desktop-api").join(exe),
        resource_dir.join("api/desktop-api").join(exe),
    ];
    if let Some(dir) = api_dir {
        candidates.insert(0, dir.join("desktop-api").join(exe));
    }
    candidates.into_iter().find(|p| p.exists())
}

fn spawn_api(state: &ApiState, resource_dir: &Path) -> Result<u16, String> {
    let api_dir = state.api_dir.lock().unwrap().clone();
    let models_dir = state.models_dir.lock().unwrap().clone();
    let bin = api_bin(api_dir.as_deref(), resource_dir)
        .ok_or_else(|| "bundle da API não encontrado".to_string())?;
    let port = pick_free_port()
        .ok_or_else(|| "não foi possível obter uma porta livre para a API local".to_string())?;

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
        .env("DEBUG", "0")
        // The API watches this pid: when the desktop dies (even by a hard
        // kill), the API and the embedded PostgreSQL go down with it.
        .env("SECUREIT_PARENT_PID", std::process::id().to_string());
    if let Some(models) = models_dir {
        cmd.env("VGGFACE2_PATH", models.join("vggface2.pt"))
            .env("YOLO_PATH", models.join("yolo26n.pt"));
    }
    cmd.stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    let child = cmd
        .spawn()
        .map_err(|e| format!("falha ao iniciar a API local: {}", e))?;
    *state.port.lock().unwrap() = Some(port);
    *state.child.lock().unwrap() = Some(child);
    Ok(port)
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
    let port = *state.port.lock().unwrap();
    let port = match port {
        Some(p) => p,
        None => {
            let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;

            // The background bootstrap may not have finished (e.g. slow
            // network); resolve it on demand before spawning.
            let api_missing = state.api_dir.lock().unwrap().is_none();
            if api_missing {
                if let Ok(paths) = bootstrap::ensure_payload(&app).await {
                    *state.api_dir.lock().unwrap() = Some(paths.api_dir);
                    *state.models_dir.lock().unwrap() = Some(paths.models_dir);
                }
            }

            spawn_api(&state, &resource_dir)?
        }
    };

    let ready = tauri::async_runtime::spawn_blocking(move || wait_for_api(port, Duration::from_secs(120)))
        .await
        .map_err(|e| e.to_string())?;
    if !ready {
        return Err(format!("a API não respondeu na porta {}", port));
    }

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
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(ApiState::default())
        .invoke_handler(tauri::generate_handler![greet, get_api_url])
        .setup(|app| {
            // Download the split payload (API + models) and warm up the API
            // as soon as the app boots. Failures surface through the
            // `get_api_url` command / retry screen.
            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    match bootstrap::ensure_payload(&handle).await {
                        Ok(paths) => {
                            let state = handle.state::<ApiState>();
                            *state.api_dir.lock().unwrap() = Some(paths.api_dir);
                            *state.models_dir.lock().unwrap() = Some(paths.models_dir);
                            if let Ok(resource_dir) = handle.path().resource_dir() {
                                let _ = spawn_api(&state, &resource_dir);
                            }
                        }
                        Err(e) => {
                            let _ = handle.emit("bootstrap-error", e);
                        }
                    }
                });
            }
            // Safety net: the window starts hidden (frontend calls show() once
            // the loader is rendered). If the webview never signals, reveal it
            // anyway so the app is never stuck invisible.
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(20));
                if let Some(window) = handle.get_webview_window("main") {
                    let _ = window.show();
                }
            });
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
