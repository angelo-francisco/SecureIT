use std::fs::{self, OpenOptions};
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager, RunEvent, State};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_updater::UpdaterExt;

/// Payload emitted to the frontend during the startup sequence so it can
/// display a meaningful status message in the loader screen.
#[derive(Clone, serde::Serialize)]
struct StartupPayload {
    phase: &'static str,
    message: String,
}

/// Response for app update checks.
#[derive(Clone, serde::Serialize)]
struct AppUpdateInfo {
    available: bool,
    current_version: String,
    remote_version: String,
    notes: String,
}

/// Response for API update checks.
#[derive(Clone, serde::Serialize)]
struct ApiUpdateInfo {
    available: bool,
    current_version: String,
    remote_version: String,
}

/// The child API's stdout/stderr are captured into a log file so it can be
/// debugged without opening a terminal. A new timestamped file is written on
/// every app execution so logs from different runs never mix.
const APP_LOG_PREFIX: &str = "app-";

/// Maximum number of per-run API log files kept on disk; older ones are
/// removed the next time the API is spawned.
const MAX_KEPT_LOGS: usize = 10;

/// GitHub repo for update checks.
const GITHUB_REPO: &str = "kiluzx/SecureIT";

/// Subdirectory under ~/.secureit/ where API updates are stored.
const API_UPDATE_SUBDIR: &str = "api";

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

/// Resolve the API binary path. Prefers an updated copy in ~/.secureit/api/
/// over the bundled resource, so the API can be updated independently of the
/// Tauri shell.
fn api_bin_prefer_updated(app: &AppHandle) -> Option<PathBuf> {
    let exe_name = if cfg!(target_os = "windows") {
        "desktop-api.exe"
    } else {
        "desktop-api"
    };

    // 1. Check for an updated API in user data dir.
    let user_api_dir = user_api_dir(app);
    let updated_bin = user_api_dir.join("desktop-api").join(exe_name);
    if updated_bin.exists() {
        return Some(updated_bin);
    }

    // 2. Fall back to bundled resource.
    let resource_dir = app.path().resource_dir().ok()?;
    [
        resource_dir.join("resources/api/desktop-api").join(exe_name),
        resource_dir.join("api/desktop-api").join(exe_name),
    ]
    .into_iter()
    .find(|p| p.exists())
}

/// Directory where API updates are stored (~/.secureit/api/).
fn user_api_dir(_app: &AppHandle) -> PathBuf {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| std::env::temp_dir().to_string_lossy().into_owned());
    PathBuf::from(home).join(".secureit").join(API_UPDATE_SUBDIR)
}

/// Read the locally installed API version from ~/.secureit/api/UPDATE_VERSION,
/// or return "unknown" if no update has been applied.
fn local_api_version(app: &AppHandle) -> String {
    let version_file = user_api_dir(app).join("UPDATE_VERSION");
    fs::read_to_string(&version_file)
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|_| "bundled".into())
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
    logs_dir(app).join(format!("{APP_LOG_PREFIX}{stamp}.log"))
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
        .filter(|(name, _)| name.starts_with(APP_LOG_PREFIX) && name.ends_with(".log"))
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
    let bin = api_bin_prefer_updated(app)?;
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

/// Ask the API to stop cleanly (POST /api/shutdown), ignoring failures.
/// The API stops the embedded PostgreSQL gracefully before exiting, so the
/// next launch does not need crash recovery. Only used on Windows, where a
/// force kill of the process tree would leave the database "interrupted".
#[cfg(windows)]
fn request_shutdown(port: u16) {
    use std::io::Write;
    if let Ok(mut conn) = TcpStream::connect(("127.0.0.1", port)) {
        let _ = conn.set_write_timeout(Some(Duration::from_secs(2)));
        let _ = conn.write_all(
            b"POST /api/shutdown HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
        );
    }
}

/// Terminate the API and its whole process tree (the embedded PostgreSQL).
/// On Unix the API runs as its own process-group leader, so a group kill
/// reaches the database too; on Windows it first asks the API to shut down
/// cleanly (stopping PostgreSQL gracefully) and force-kills only if it does
/// not exit in time.
#[cfg_attr(unix, allow(unused_variables))]
fn kill_process_tree(child: &mut Child, port: Option<u16>) {
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
        if let Some(port) = port {
            request_shutdown(port);
            for _ in 0..16 {
                if child.try_wait().ok().flatten().is_some() {
                    return;
                }
                std::thread::sleep(Duration::from_millis(500));
            }
        }
        let _ = Command::new("taskkill")
            .args(["/PID", &child.id().to_string(), "/T", "/F"])
            .status();
        let _ = child.wait();
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[tauri::command]
async fn get_api_url(app: AppHandle, state: State<'_, ApiState>) -> Result<String, String> {
    let port = match *state.port.lock().unwrap() {
        Some(p) => p,
        None => match spawn_api(&app, &state) {
            Some(p) => p,
            None => {
                log_line(&app, &state, "spawn_api failed: desktop-api bundle not found");
                return Err("desktop-api bundle not found".to_string());
            }
        },
    };

    let _ = app.emit(
        "startup-progress",
        StartupPayload {
            phase: "waiting_api",
            message: "Aguardando API...".into(),
        },
    );

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
        let _ = app.emit(
            "startup-progress",
            StartupPayload {
                phase: "api_ready",
                message: "API pronta".into(),
            },
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
    let _ = app.emit(
        "startup-progress",
        StartupPayload {
            phase: "restarting",
            message: "Reiniciando API...".into(),
        },
    );
    if let Some(mut child) = state.child.lock().unwrap().take() {
        let port = *state.port.lock().unwrap();
        kill_process_tree(&mut child, port);
    }
    *state.port.lock().unwrap() = None;
    let port = match spawn_api(&app, &state) {
        Some(p) => p,
        None => {
            log_line(&app, &state, "spawn_api failed after restart: desktop-api bundle not found");
            return Err("desktop-api bundle not found".to_string());
        }
    };

    let _ = app.emit(
        "startup-progress",
        StartupPayload {
            phase: "waiting_api",
            message: "Aguardando API...".into(),
        },
    );

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
        let _ = app.emit(
            "startup-progress",
            StartupPayload {
                phase: "api_ready",
                message: "API pronta".into(),
            },
        );
        Ok(format!("http://127.0.0.1:{}", port))
    } else {
        let _ = app.emit(
            "startup-progress",
            StartupPayload {
                phase: "failed",
                message: "Erro ao iniciar API".into(),
            },
        );
        Err(format!("API failed to become healthy on port {}", port))
    }
}

/// Check if a new version of the Tauri app (frontend + Rust) is available
/// on GitHub Releases via the configured updater endpoint.
#[tauri::command]
async fn check_for_app_update(app: AppHandle) -> Result<AppUpdateInfo, String> {
    let current_version = env!("CARGO_PKG_VERSION").to_string();

    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => Ok(AppUpdateInfo {
            available: true,
            current_version: current_version.clone(),
            remote_version: update.version.clone(),
            notes: update.body.clone().unwrap_or_default(),
        }),
        None => {
            let rv = current_version.clone();
            Ok(AppUpdateInfo {
                available: false,
                current_version,
                remote_version: rv,
                notes: String::new(),
            })
        }
    }
}

/// Download and install the available app update, then restart the process.
#[tauri::command]
async fn install_app_update(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => {
            let handle = app.clone();
            update
                .download_and_install(
                    |downloaded, total| {
                        let _ = handle.emit(
                            "app-update-progress",
                            serde_json::json!({
                                "downloaded": downloaded,
                                "total": total,
                            }),
                        );
                    },
                    || {},
                )
                .await
                .map_err(|e| e.to_string())?;
            app.restart();
        }
        None => return Err("No update available".into()),
    }
}

/// Check if a newer version of the Python API is available on GitHub Releases.
/// Compares the remote latest release tag against the locally installed API
/// version (stored in ~/.secureit/api/UPDATE_VERSION, or "bundled" for the
/// version shipped inside the installer).
#[tauri::command]
async fn check_api_update(app: AppHandle) -> Result<ApiUpdateInfo, String> {
    let current = local_api_version(&app);

    // Fetch the latest release from GitHub.
    let url = format!(
        "https://api.github.com/repos/{}/releases/latest",
        GITHUB_REPO
    );
    let client = reqwest::Client::builder()
        .user_agent("SecureIT-Updater")
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("GitHub API returned {}", resp.status()));
    }

    let release: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let remote_version = release["tag_name"]
        .as_str()
        .unwrap_or("0.0.0")
        .trim_start_matches('v')
        .to_string();

    let available = version_is_newer(&current, &remote_version);

    Ok(ApiUpdateInfo {
        available,
        current_version: current,
        remote_version,
    })
}

/// Download the API bundle from the latest GitHub release and extract it to
/// ~/.secureit/api/. The next time the app starts, Rust will use the updated
/// API binary instead of the bundled one.
#[tauri::command]
async fn install_api_update(app: AppHandle) -> Result<(), String> {
    let handle = app.clone();
    let api_dir = user_api_dir(&app);
    let _ = fs::create_dir_all(&api_dir);

    let _ = handle.emit(
        "api-update-progress",
        serde_json::json!({ "phase": "fetching_release" }),
    );

    // 1. Fetch latest release metadata.
    let url = format!(
        "https://api.github.com/repos/{}/releases/latest",
        GITHUB_REPO
    );
    let client = reqwest::Client::builder()
        .user_agent("SecureIT-Updater")
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("GitHub API returned {}", resp.status()));
    }

    let release: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let remote_version = release["tag_name"]
        .as_str()
        .unwrap_or("0.0.0")
        .trim_start_matches('v')
        .to_string();

    // 2. Find the platform-appropriate asset.
    let assets = release["assets"]
        .as_array()
        .ok_or("No assets in release")?;

    let asset_name = if cfg!(target_os = "linux") {
        "api-linux.tar.gz"
    } else if cfg!(target_os = "windows") {
        "api-windows.zip"
    } else {
        "api-macos.tar.gz"
    };

    let asset = assets
        .iter()
        .find(|a| a["name"].as_str() == Some(asset_name))
        .ok_or_else(|| format!("Asset {} not found in release", asset_name))?;

    let download_url = asset["browser_download_url"]
        .as_str()
        .ok_or("Missing download URL")?;

    let _ = handle.emit(
        "api-update-progress",
        serde_json::json!({ "phase": "downloading", "url": download_url }),
    );

    // 3. Download the asset.
    let resp = client.get(download_url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Download failed: {}", resp.status()));
    }

    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;

    let _ = handle.emit(
        "api-update-progress",
        serde_json::json!({ "phase": "extracting" }),
    );

    // 4. Extract to a temp directory, then move into place.
    let temp_dir = api_dir.join("update_temp");
    let _ = fs::remove_dir_all(&temp_dir);
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    if cfg!(target_os = "windows") {
        // ZIP extraction on Windows.
        let zip_path = temp_dir.join("update.zip");
        fs::write(&zip_path, &bytes).map_err(|e| e.to_string())?;
        // Use PowerShell to extract.
        let _ = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                &format!(
                    "Expand-Archive -Path '{}' -DestinationPath '{}' -Force",
                    zip_path.display(),
                    temp_dir.display()
                ),
            ])
            .status();
    } else {
        // TAR.GZ extraction on Linux/macOS.
        let tar_path = temp_dir.join("update.tar.gz");
        fs::write(&tar_path, &bytes).map_err(|e| e.to_string())?;
        let _ = Command::new("tar")
            .args([
                "xzf",
                &tar_path.to_string_lossy(),
                "-C",
                &temp_dir.to_string_lossy(),
            ])
            .status();
    }

    // 5. Move the extracted desktop-api/ into place.
    let extracted_api = temp_dir.join("desktop-api");
    let target_api = api_dir.join("desktop-api");

    // Remove old version, ignore errors.
    let _ = fs::remove_dir_all(&target_api);
    fs::rename(&extracted_api, &target_api).map_err(|e| {
        let _ = fs::remove_dir_all(&temp_dir);
        format!("Failed to move API into place: {}", e)
    })?;

    // 6. Write the version marker.
    fs::write(api_dir.join("UPDATE_VERSION"), &remote_version)
        .map_err(|e| e.to_string())?;

    let _ = fs::remove_dir_all(&temp_dir);

    let _ = handle.emit(
        "api-update-progress",
        serde_json::json!({ "phase": "complete", "version": remote_version }),
    );

    log_line(
        &app,
        &app.state::<ApiState>(),
        &format!("API updated to {} via updater", remote_version),
    );

    Ok(())
}

/// Simple semver comparison (major.minor.patch only, ignores pre-release).
fn version_is_newer(current: &str, remote: &str) -> bool {
    let parse = |v: &str| -> (u32, u32, u32) {
        let parts: Vec<u32> = v
            .split('.')
            .filter_map(|p| p.split('-').next()?.parse().ok())
            .collect();
        (
            parts.first().copied().unwrap_or(0),
            parts.get(1).copied().unwrap_or(0),
            parts.get(2).copied().unwrap_or(0),
        )
    };
    parse(remote) > parse(current)
}

/// Forward a log line produced by the frontend (webview) into the per-run log
/// file, so JS console output, uncaught errors and React crashes are captured
/// alongside the Tauri and API logs. Never blocks or fails the caller.
#[tauri::command]
fn log_frontend(
    app: AppHandle,
    state: State<'_, ApiState>,
    level: String,
    message: String,
    stack: Option<String>,
) -> Result<(), String> {
    let line = match stack {
        Some(stack) if !stack.trim().is_empty() => {
            format!("[frontend:{level}] {message} | {stack}")
        }
        _ => format!("[frontend:{level}] {message}"),
    };
    log_line(&app, &state, &line);
    Ok(())
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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .manage(ApiState::default())
        .invoke_handler(tauri::generate_handler![
            get_api_url,
            open_logs_folder,
            log_frontend,
            log_frontend_config,
            check_for_app_update,
            install_app_update,
            check_api_update,
            install_api_update,
        ])
        .setup(|_app| {
            // Always create the per-run log file and record run metadata, even
            // in dev where the API is not bundled. This guarantees both the
            // Tauri-side and (in release) API-side logs land in the same file.
            let state = _app.state::<ApiState>();
            log_line(
                _app.handle(),
                &state,
                &format!(
                    "==== SecureIT {} ({}) - {} ====",
                    env!("CARGO_PKG_VERSION"),
                    if cfg!(debug_assertions) { "dev" } else { "release" },
                    chrono::Local::now().format("%Y-%m-%d %H:%M:%S")
                ),
            );
            log_line(
                _app.handle(),
                &state,
                &format!(
                    "log file: {}",
                    current_log_path(_app.handle(), &state).display()
                ),
            );

            // Report which API binary will be used (updated or bundled).
            if let Some(bin) = api_bin_prefer_updated(_app.handle()) {
                log_line(
                    _app.handle(),
                    &state,
                    &format!("API binary: {}", bin.display()),
                );
            }

            // Start warming up the bundled API as soon as the app boots.
            #[cfg(not(debug_assertions))]
            {
                let _ = _app.handle().emit(
                    "startup-progress",
                    StartupPayload {
                        phase: "spawning",
                        message: "Iniciando API...".into(),
                    },
                );
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
            let api = app_handle.state::<ApiState>();
            log_line(app_handle, &api, "app exiting, stopping API");
            let child_and_port = {
                let child = api.child.lock().unwrap().take();
                let port = *api.port.lock().unwrap();
                (child, port)
            };
            if let Some(mut child) = child_and_port.0 {
                kill_process_tree(&mut child, child_and_port.1);
            }
        }
    });
}
