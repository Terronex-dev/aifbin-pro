use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

// Library file metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryFile {
    pub name: String,
    pub size: u64,
    pub modified: u64,
}

// Get the library folder path
fn get_library_path() -> PathBuf {
    let home = dirs::document_dir().unwrap_or_else(|| PathBuf::from("."));
    home.join("AIF-BIN Studio").join("library")
}

// Ensure library folder exists
fn ensure_library_exists() -> Result<PathBuf, String> {
    let path = get_library_path();
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| format!("Failed to create library: {}", e))?;
    }
    Ok(path)
}

// List all .aif-bin files in library
#[tauri::command]
fn list_library() -> Result<Vec<LibraryFile>, String> {
    let path = ensure_library_exists()?;
    
    let mut files = Vec::new();
    let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read library: {}", e))?;
    
    for entry in entries.flatten() {
        let entry_path = entry.path();
        if entry_path.extension().map(|e| e == "aif-bin").unwrap_or(false) {
            if let Ok(metadata) = entry.metadata() {
                let modified = metadata
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                
                files.push(LibraryFile {
                    name: entry_path.file_name().unwrap().to_string_lossy().to_string(),
                    size: metadata.len(),
                    modified,
                });
            }
        }
    }
    
    // Sort by modified time, newest first
    files.sort_by(|a, b| b.modified.cmp(&a.modified));
    Ok(files)
}

// Save file to library
#[tauri::command]
fn save_to_library(name: String, data: Vec<u8>) -> Result<String, String> {
    let path = ensure_library_exists()?;
    let file_path = path.join(&name);
    
    fs::write(&file_path, data).map_err(|e| format!("Failed to save file: {}", e))?;
    
    Ok(file_path.to_string_lossy().to_string())
}

// Read file from library
#[tauri::command]
fn read_from_library(name: String) -> Result<Vec<u8>, String> {
    let path = get_library_path().join(&name);
    
    if !path.exists() {
        return Err(format!("File not found: {}", name));
    }
    
    fs::read(&path).map_err(|e| format!("Failed to read file: {}", e))
}

// Delete file from library
#[tauri::command]
fn delete_from_library(name: String) -> Result<(), String> {
    let path = get_library_path().join(&name);
    
    if !path.exists() {
        return Err(format!("File not found: {}", name));
    }
    
    fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))
}

// Get library folder path (for display/debugging)
#[tauri::command]
fn get_library_folder() -> Result<String, String> {
    let path = ensure_library_exists()?;
    Ok(path.to_string_lossy().to_string())
}

// Rename file in library
#[tauri::command]
fn rename_in_library(old_name: String, new_name: String) -> Result<(), String> {
    let path = get_library_path();
    let old_path = path.join(&old_name);
    let new_path = path.join(&new_name);
    
    if !old_path.exists() {
        return Err(format!("File not found: {}", old_name));
    }
    
    if new_path.exists() {
        return Err(format!("File already exists: {}", new_name));
    }
    
    fs::rename(old_path, new_path).map_err(|e| format!("Failed to rename: {}", e))
}

// Export file from library to a specific location
#[tauri::command]
fn export_from_library(name: String, destination: String) -> Result<(), String> {
    let source = get_library_path().join(&name);
    
    if !source.exists() {
        return Err(format!("File not found: {}", name));
    }
    
    fs::copy(&source, &destination).map_err(|e| format!("Failed to export: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            // Ensure library exists on startup
            let _ = ensure_library_exists();
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_library,
            save_to_library,
            read_from_library,
            delete_from_library,
            get_library_folder,
            rename_in_library,
            export_from_library,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
