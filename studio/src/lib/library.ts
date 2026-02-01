/**
 * AIF-BIN Library API
 * Tauri commands for managing the local .aif-bin file library
 */

import { invoke } from '@tauri-apps/api/core';

export interface LibraryFile {
  name: string;
  size: number;
  modified: number; // Unix timestamp
}

/**
 * Check if running in Tauri (desktop) or browser
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * List all .aif-bin files in the library
 */
export async function listLibrary(): Promise<LibraryFile[]> {
  if (!isTauri()) {
    console.warn('listLibrary: Not running in Tauri');
    return [];
  }
  return invoke<LibraryFile[]>('list_library');
}

/**
 * Save a file to the library
 */
export async function saveToLibrary(name: string, data: Uint8Array): Promise<string> {
  if (!isTauri()) {
    throw new Error('saveToLibrary: Not running in Tauri');
  }
  return invoke<string>('save_to_library', { 
    name, 
    data: Array.from(data) // Convert Uint8Array to number[] for Tauri
  });
}

/**
 * Read a file from the library
 */
export async function readFromLibrary(name: string): Promise<Uint8Array> {
  if (!isTauri()) {
    throw new Error('readFromLibrary: Not running in Tauri');
  }
  const data = await invoke<number[]>('read_from_library', { name });
  return new Uint8Array(data);
}

/**
 * Delete a file from the library
 */
export async function deleteFromLibrary(name: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('deleteFromLibrary: Not running in Tauri');
  }
  return invoke('delete_from_library', { name });
}

/**
 * Get the library folder path
 */
export async function getLibraryFolder(): Promise<string> {
  if (!isTauri()) {
    return '(Browser - no local library)';
  }
  return invoke<string>('get_library_folder');
}

/**
 * Rename a file in the library
 */
export async function renameInLibrary(oldName: string, newName: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('renameInLibrary: Not running in Tauri');
  }
  return invoke('rename_in_library', { oldName, newName });
}

/**
 * Export a file from the library to a specific location
 */
export async function exportFromLibrary(name: string, destination: string): Promise<void> {
  if (!isTauri()) {
    throw new Error('exportFromLibrary: Not running in Tauri');
  }
  return invoke('export_from_library', { name, destination });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format timestamp for display
 */
export function formatModified(timestamp: number): string {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
