use std::fs;
use std::io::{self, Cursor};
use std::path::{Path, PathBuf};
use std::time::Duration;

use reqwest::Client;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter, Manager};

const BASE_URL: &str = "https://github.com/angelo-francisco/SecureIT/releases/latest/download";

#[derive(Deserialize, Clone)]
pub struct PayloadEntry {
    pub version: String,
    pub url: String,
    pub sha256: String,
}

#[derive(Deserialize)]
pub struct Payload {
    pub api: PayloadEntry,
    pub models: PayloadEntry,
}

#[derive(Clone)]
pub struct BootstrapPaths {
    pub api_dir: PathBuf,
    pub models_dir: PathBuf,
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    pub component: String,
    pub downloaded: u64,
    pub total: Option<u64>,
    pub message: String,
}

fn platform_target() -> String {
    format!("{}-{}", std::env::consts::OS, std::env::consts::ARCH)
}

fn user_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .home_dir()
        .map(|home| home.join(".secureit"))
        .map_err(|e| e.to_string())
}

fn emit(app: &AppHandle, component: &str, downloaded: u64, total: Option<u64>, message: &str) {
    let _ = app.emit(
        "bootstrap-progress",
        Progress {
            component: component.to_string(),
            downloaded,
            total,
            message: message.to_string(),
        },
    );
}

async fn fetch_json<T: for<'de> Deserialize<'de>>(client: &Client, url: &str) -> Result<T, String> {
    let resp = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {} ao buscar {}", resp.status(), url));
    }
    resp.json().await.map_err(|e| e.to_string())
}

async fn download_verified(
    client: &Client,
    app: &AppHandle,
    component: &str,
    entry: &PayloadEntry,
) -> Result<Vec<u8>, String> {
    let mut resp = client
        .get(&entry.url)
        .send()
        .await
        .map_err(|e| format!("falha ao descarregar {}: {}", component, e))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {} ao descarregar {}", resp.status(), component));
    }

    let total = resp.content_length();
    let mut buf: Vec<u8> = Vec::new();
    let mut hasher = Sha256::new();
    let mut downloaded: u64 = 0;

    while let Some(chunk) = resp.chunk().await.map_err(|e| e.to_string())? {
        downloaded += chunk.len() as u64;
        hasher.update(&chunk);
        buf.extend_from_slice(&chunk);
        emit(app, component, downloaded, total, "a descarregar");
    }

    let digest = format!("{:x}", hasher.finalize());
    if !digest.eq_ignore_ascii_case(&entry.sha256) {
        return Err(format!(
            "checksum inválido para {}: esperado {}, obtido {}",
            component, entry.sha256, digest
        ));
    }
    Ok(buf)
}

fn extract_zip(data: &[u8], dest: &Path) -> Result<(), String> {
    let mut archive = zip::ZipArchive::new(Cursor::new(data)).map_err(|e| e.to_string())?;
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.mangled_name().to_string_lossy().replace('\\', "/");
        let out_path = dest.join(&name);

        if entry.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
            continue;
        }
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let mut file = fs::File::create(&out_path).map_err(|e| e.to_string())?;
        io::copy(&mut entry, &mut file).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(unix)]
fn make_executable(root: &Path) {
    use std::os::unix::fs::PermissionsExt;

    fn walk(dir: &Path) {
        let Ok(entries) = fs::read_dir(dir) else {
            return;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                walk(&path);
            } else {
                let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o755));
            }
        }
    }
    walk(root);
}

#[cfg(not(unix))]
fn make_executable(_root: &Path) {}

async fn ensure_component(
    client: &Client,
    app: &AppHandle,
    root: &Path,
    component: &str,
    entry: &PayloadEntry,
) -> Result<PathBuf, String> {
    let dir = root.join(component).join(&entry.version);
    let marker = dir.join(".sha256");

    if let Ok(existing) = fs::read_to_string(&marker) {
        if existing.trim().eq_ignore_ascii_case(&entry.sha256) {
            emit(app, component, 0, Some(0), "pronto");
            return Ok(dir);
        }
    }

    let tmp = root.join(component).join(format!(".tmp-{}", entry.version));
    if dir.exists() {
        fs::remove_dir_all(&dir).map_err(|e| format!("falha ao limpar {} antigo: {}", component, e))?;
    }
    if tmp.exists() {
        fs::remove_dir_all(&tmp).map_err(|e| format!("falha ao limpar {} temporário: {}", component, e))?;
    }
    fs::create_dir_all(&tmp).map_err(|e| format!("falha ao criar {}: {}", component, e))?;

    emit(app, component, 0, None, "a descarregar");
    let bytes = download_verified(client, app, component, entry).await?;

    emit(app, component, 0, Some(0), "a instalar");
    extract_zip(&bytes, &tmp)?;
    make_executable(&tmp);

    fs::rename(&tmp, &dir).map_err(|e| format!("falha ao instalar {}: {}", component, e))?;
    fs::write(&marker, entry.sha256.as_bytes())
        .map_err(|e| format!("falha ao gravar marcador {}: {}", component, e))?;

    emit(app, component, 0, Some(0), "pronto");
    Ok(dir)
}

pub async fn ensure_payload(app: &AppHandle) -> Result<BootstrapPaths, String> {
    let client = Client::builder()
        .connect_timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let payload_url = format!("{}/payload-{}.json", BASE_URL, platform_target());
    let payload: Payload = fetch_json(&client, &payload_url).await?;

    let root = user_data_dir(app)?;
    let api_dir = ensure_component(&client, app, &root, "api", &payload.api).await?;
    let models_dir = ensure_component(&client, app, &root, "models", &payload.models).await?;

    Ok(BootstrapPaths { api_dir, models_dir })
}
