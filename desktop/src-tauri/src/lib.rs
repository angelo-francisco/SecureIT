use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Manager, RunEvent, State};
use tauri_plugin_opener::OpenerExt;

/// The child API's stdout/stderr are captured into a log file so it can be
/// debugged without opening a terminal. A new timestamped file is written on
/// every app execution so logs from different runs never mix.
const API_LOG_PREFIX: &str = "api-";

/// Maximum number of per-run API log files kept on disk; older ones are
/// removed the next time the API is spawned.
const MAX_KEPT_LOGS: usize = 10;

#[derive(Default)]
struct ApiState {
    port: Mutex<Option<u16>>,
    child: Mutex<Option<Child>>,
    log_path: Mutex<Option<PathBuf>>,
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

/// Directory where the API log files are stored (per-user, platform-appropriate).
fn logs_dir(app: &AppHandle) -> PathBuf {
    app.path()
        .app_log_dir()
        .or_else(|_| app.path().app_data_dir().map(|d| d.join("logs")))
        .unwrap_or_else(|_| std::env::temp_dir())
}

/// Path of the log file for the current app execution (e.g. api-2026-08-01_14-30-05.log).
fn api_log_path(app: &AppHandle) -> PathBuf {
    let stamp = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();
    logs_dir(app).join(format!("{API_LOG_PREFIX}{stamp}.log"))
}

/// Remove old per-run log files, keeping only the `MAX_KEPT_LOGS` most recent.
fn prune_old_logs(app: &AppHandle) {
    let dir = logs_dir(app);
    let Ok(entries) = fs::read_dir(&dir) else {
        return;
    };
    let mut files: Vec<PathBuf> = entries
        .flatten()
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().into_owned();
            e.path().is_file().then_some((name, e.path()))
        })
        .filter(|(name, _)| name.starts_with(API_LOG_PREFIX) && name.ends_with(".log"))
        .map(|(_, path)| path)
        .collect();
    if files.len() <= MAX_KEPT_LOGS {
        return;
    }
    // Oldest first so we can drop the first `excess` entries.
    files.sort_by_key(|p| p.file_name().unwrap_or_default().to_os_string());
    let excess = files.len() - MAX_KEPT_LOGS;
    for path in files.into_iter().take(excess) {
        let _ = fs::remove_file(path);
    }
}

/// Path of the log file for this app execution, creating it (and recording it
/// in state) on first use. Both the API's stdout/stderr and the Tauri-side
/// log lines are written here, so one app run produces one log file.
fn current_log_path(app: &AppHandle, state: &ApiState) -> PathBuf {
    {
        let guard = state.log_path.lock().unwrap();
        if let Some(path) = guard.as_ref() {
            return path.clone();
        }
    }
    let dir = logs_dir(app);
    let _ = fs::create_dir_all(&dir);
    let path = api_log_path(app);
    *state.log_path.lock().unwrap() = Some(path.clone());
    path
}

/// Append a Tauri-side line to the current per-run log file.
fn log_line(app: &AppHandle, state: &ApiState, line: &str) {
    let path = current_log_path(app, state);
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&path) {
        let _ = writeln!(f, "[tauri] {}", line);
    }
}

fn spawn_api(app: &AppHandle, state: &ApiState) -> Option<u16> {
    let resource_dir = app.path().resource_dir().ok()?;
    let bin = api_bin(&resource_dir)?;
    let port = find_free_port();

    let mut cmd = Command::new(bin);
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // New process group so the whole tree (including the embedded
        // PostgreSQL) can be terminated together on app exit.
        cmd.process_group(0);
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // Run as a background process without any console window.
        // CREATE_NO_WINDOW = 0x08000000
        cmd.creation_flags(0x08000000);
    }

    // Capture stdout/stderr into a timestamped log file (one per app run).
    // This also tells the user where the file lives via open_logs_folder.
    let log_dir = logs_dir(app);
    fs::create_dir_all(&log_dir).ok()?;
    let log_path = current_log_path(app, state);
    let log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .ok()?;
    let err_file = log_file.try_clone().ok()?;
    prune_old_logs(app);

    cmd.env("PORT", port.to_string())
        .env("EMBEDDED_DB", "1")
        .env("DEBUG", "0");
    cmd.stdin(Stdio::null())
        .stdout(Stdio::from(log_file))
        .stderr(Stdio::from(err_file));

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
async fn get_api_url(app: AppHandle, state: State<'_, ApiState>) -> Result<String, String> {
    let port = match *state.port.lock().unwrap() {
        Some(p) => p,
        None => {
            spawn_api(&app, &state).ok_or_else(|| "desktop-api bundle not found".to_string())?
        }
    };

    let healthy = tauri::async_runtime::spawn_blocking(move || {
        wait_for_api(port, Duration::from_secs(120))
    })
    .await
    .map_err(|e| e.to_string())?;

    if healthy {
        log_line(
            &app,
            &state,
            &format!("API health check on port {}: ok", port),
        );
        return Ok(format!("http://127.0.0.1:{}", port));
    }

    // The API failed to become healthy (e.g. the embedded PostgreSQL was
    // blocked by a stale process or antivirus). Restart it once and retry.
    log_line(
        &app,
        &state,
        &format!("API on port {} not healthy, restarting", port),
    );
    if let Some(mut child) = state.child.lock().unwrap().take() {
        kill_process_tree(&mut child);
    }
    *state.port.lock().unwrap() = None;
    let port = spawn_api(&app, &state).ok_or_else(|| "desktop-api bundle not found".to_string())?;
    let healthy = tauri::async_runtime::spawn_blocking(move || {
        wait_for_api(port, Duration::from_secs(120))
    })
    .await
    .map_err(|e| e.to_string())?;

    log_line(
        &app,
        &state,
        &format!("API health check on port {} after restart: {}", port, healthy),
    );
    if healthy {
        Ok(format!("http://127.0.0.1:{}", port))
    } else {
        Err(format!("API failed to become healthy on port {}", port))
    }
}

/// Log the frontend's resolved API/WEB base URLs into the per-run log file so
/// the baked VITE_* values can be verified at runtime.
#[tauri::command]
fn log_frontend_config(
    app: AppHandle,
    state: State<'_, ApiState>,
    env_api_url: String,
    env_web_url: String,
    api_base: String,
    web_base: String,
) -> Result<(), String> {
    log_line(
        &app,
        &state,
        &format!("VITE_API_URL (build-time): {}", env_api_url),
    );
    log_line(
        &app,
        &state,
        &format!("VITE_WEB_URL (build-time): {}", env_web_url),
    );
    log_line(&app, &state, &format!("frontend API base URL: {}", api_base));
    log_line(&app, &state, &format!("frontend WEB base URL: {}", web_base));
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Open the folder that contains the per-run API log files in the OS file manager.
#[tauri::command]
fn open_logs_folder(app: AppHandle) -> Result<(), String> {
    let dir = logs_dir(&app);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    app.opener()
        .open_path(dir.to_string_lossy().into_owned(), None::<&str>)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .manage(ApiState::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_api_url,
            open_logs_folder,
            log_frontend_config
        ])
        .setup(|_app| {
            // Start warming up the bundled API as soon as the app boots.
            #[cfg(not(debug_assertions))]
            {
                let state = _app.state::<ApiState>();
                match spawn_api(_app.handle(), &state) {
                    Some(port) => {
                        log_line(_app.handle(), &state, &format!("API spawned on port {}", port));
                    }
                    None => log_line(
                        _app.handle(),
                        &state,
                        "API bundle not found (will retry on get_api_url)",
                    ),
                }
            }
            // Safety net: the window starts hidden (frontend calls show() once
            // the loader is rendered). If the webview never signals, reveal it
            // anyway so the app is never stuck invisible.
            let handle = _app.handle().clone();
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
