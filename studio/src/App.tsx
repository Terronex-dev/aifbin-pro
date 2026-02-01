import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { encode as msgpackEncode, decode as msgpackDecode } from '@msgpack/msgpack';
import { 
  isTauri, 
  listLibrary, 
  saveToLibrary, 
  readFromLibrary, 
  deleteFromLibrary,
  getLibraryFolder,
  type LibraryFile 
} from './lib/library';

// ============================================================
// TERRONEX DESIGN SYSTEM - Styles
// ============================================================

const styles = `
  :root {
    --bg-primary: #050505;
    --bg-secondary: #0a0f1d;
    --bg-panel: #12121a;
    --bg-glass: rgba(15, 23, 42, 0.8);
    --bg-elevated: #1e1e2e;
    
    --border-subtle: rgba(255, 255, 255, 0.05);
    --border-default: rgba(255, 255, 255, 0.1);
    --border-accent: rgba(255, 255, 255, 0.2);
    
    --text-primary: #e4e4e7;
    --text-secondary: #a1a1aa;
    --text-tertiary: #52525b;
    
    --accent-cyan: #22d3ee;
    --accent-emerald: #10b981;
    --accent-amber: #f59e0b;
    --accent-red: #ef4444;
    --accent-purple: #a855f7;
    
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  }
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: var(--font-sans);
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    overflow: hidden;
  }
  
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  
  /* Title Bar */
  .titlebar {
    height: 40px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    -webkit-app-region: drag;
    user-select: none;
  }
  
  .titlebar-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.02em;
  }
  
  .titlebar-logo svg { width: 18px; height: 18px; color: var(--accent-cyan); }
  
  .titlebar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    -webkit-app-region: no-drag;
  }
  
  .titlebar-btn {
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 500;
    background: var(--bg-panel);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
  }
  
  .titlebar-btn:hover {
    background: var(--bg-elevated);
    border-color: var(--accent-cyan);
    color: var(--text-primary);
  }
  
  .titlebar-btn svg { width: 14px; height: 14px; }
  
  /* Main Tabs */
  .tabs {
    display: flex;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-subtle);
    padding: 0 16px;
    gap: 4px;
    -webkit-app-region: no-drag;
  }
  
  .tab {
    padding: 12px 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-tertiary);
    background: transparent;
    border: none;
    cursor: pointer;
    position: relative;
    transition: color 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .tab svg { width: 14px; height: 14px; }
  .tab:hover { color: var(--text-secondary); }
  .tab.active { color: var(--accent-cyan); }
  .tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent-cyan);
  }
  
  /* Sub Tabs */
  .sub-tabs {
    display: flex;
    gap: 2px;
    background: var(--bg-panel);
    padding: 4px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .sub-tab {
    padding: 8px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .sub-tab svg { width: 12px; height: 12px; }
  .sub-tab:hover { color: var(--text-secondary); background: var(--bg-elevated); }
  .sub-tab.active { color: var(--text-primary); background: var(--bg-elevated); }
  
  /* Main Content */
  .main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  
  /* Sidebar */
  .sidebar {
    width: 300px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
  }
  
  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-subtle);
  }
  
  .sidebar-title {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-tertiary);
    margin-bottom: 12px;
  }
  
  .sidebar-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  
  .file-item {
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background 0.15s;
  }
  
  .file-item:hover { background: var(--bg-panel); }
  .file-item.active { background: var(--bg-elevated); border: 1px solid var(--border-default); }
  
  .file-item-icon {
    width: 32px;
    height: 32px;
    background: var(--bg-panel);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-cyan);
  }
  
  .file-item-info { flex: 1; min-width: 0; }
  .file-item-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .file-item-meta {
    font-size: 11px;
    color: var(--text-tertiary);
    font-family: var(--font-mono);
  }
  
  /* Content Panel */
  .content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }
  
  .content-centered {
    max-width: 900px;
    margin: 0 auto;
  }
  
  .panel {
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  
  .panel-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-tertiary);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .panel-title svg { width: 14px; height: 14px; color: var(--accent-cyan); }
  
  .panel-actions { display: flex; gap: 8px; }
  
  /* Drop Zone */
  .dropzone {
    border: 2px dashed var(--border-default);
    border-radius: 12px;
    padding: 48px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--bg-glass);
  }
  
  .dropzone:hover, .dropzone.active {
    border-color: var(--accent-cyan);
    background: rgba(34, 211, 238, 0.05);
  }
  
  .dropzone-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    color: var(--accent-cyan);
    background: var(--bg-panel);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dropzone-icon svg { width: 28px; height: 28px; }
  .dropzone-text { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
  .dropzone-hint { font-size: 12px; color: var(--text-tertiary); }
  
  .dropzone-files {
    margin-top: 16px;
    text-align: left;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .dropzone-file {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-panel);
    border-radius: 6px;
    margin-bottom: 4px;
    font-size: 12px;
  }
  
  .dropzone-file-icon { color: var(--accent-cyan); }
  .dropzone-file-icon svg { width: 14px; height: 14px; }
  .dropzone-file-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dropzone-file-size { color: var(--text-tertiary); font-family: var(--font-mono); font-size: 11px; }
  .dropzone-file-remove { color: var(--text-tertiary); cursor: pointer; padding: 2px; }
  .dropzone-file-remove:hover { color: var(--accent-red); }
  .dropzone-file-remove svg { width: 14px; height: 14px; }
  
  /* Buttons */
  .btn {
    padding: 10px 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  
  .btn svg { width: 14px; height: 14px; }
  .btn-primary { background: var(--accent-emerald); color: white; }
  .btn-primary:hover { background: #0d9668; }
  .btn-primary:disabled { background: var(--bg-panel); color: var(--text-tertiary); cursor: not-allowed; }
  .btn-secondary { background: var(--bg-panel); border: 1px solid var(--border-default); color: var(--text-primary); }
  .btn-secondary:hover { background: var(--bg-elevated); border-color: var(--accent-cyan); }
  .btn-sm { padding: 6px 12px; font-size: 10px; }
  .btn-icon { color: var(--accent-cyan); }
  
  /* Input */
  .input {
    width: 100%;
    padding: 12px 16px;
    font-family: var(--font-mono);
    font-size: 13px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s;
  }
  
  .input:focus { border-color: var(--accent-cyan); }
  .input::placeholder { color: var(--text-tertiary); }
  .input-password { -webkit-text-security: disc; }
  
  /* Select */
  .select {
    padding: 10px 16px;
    font-size: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-primary);
    outline: none;
    cursor: pointer;
  }
  
  .select:focus { border-color: var(--accent-cyan); }
  
  /* Data Display */
  .data-row {
    display: flex;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-subtle);
  }
  
  .data-row:last-child { border-bottom: none; }
  
  .data-label {
    width: 140px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
  }
  
  .data-value {
    flex: 1;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-primary);
  }
  
  .data-value.cyan { color: var(--accent-cyan); }
  .data-value.emerald { color: var(--accent-emerald); }
  .data-value.amber { color: var(--accent-amber); }
  
  /* Code Block */
  .code-block {
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 16px;
    font-family: var(--font-mono);
    font-size: 12px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 500px;
    overflow-y: auto;
    line-height: 1.6;
  }
  
  /* Hex View */
  .hex-view { font-family: var(--font-mono); font-size: 11px; line-height: 1.6; }
  .hex-row { display: flex; gap: 16px; }
  .hex-offset { color: var(--text-tertiary); min-width: 60px; }
  .hex-bytes { color: var(--accent-cyan); letter-spacing: 0.5px; }
  .hex-ascii { color: var(--text-secondary); }
  
  /* Chunks View */
  .chunk-item {
    background: var(--bg-panel);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .chunk-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .chunk-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent-cyan);
  }
  
  .chunk-type {
    font-size: 10px;
    padding: 3px 8px;
    background: var(--bg-elevated);
    border-radius: 4px;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .chunk-content {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
  }
  
  /* Entity badge */
  .entity-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--bg-panel);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    font-size: 11px;
    margin-right: 6px;
    margin-bottom: 6px;
  }
  
  .entity-badge-type {
    color: var(--accent-purple);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 9px;
  }
  
  .entity-badge-value {
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }
  
  /* Status Bar */
  .statusbar {
    height: 28px;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-size: 11px;
    color: var(--text-tertiary);
    gap: 16px;
  }
  
  .status-item { display: flex; align-items: center; gap: 6px; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-emerald); }
  .status-dot.warning { background: var(--accent-amber); }
  .status-dot.error { background: var(--accent-red); }
  
  /* Form Group */
  .form-group { margin-bottom: 16px; }
  .form-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-tertiary);
    margin-bottom: 8px;
  }
  .form-row { display: flex; gap: 8px; }
  .form-hint { font-size: 11px; color: var(--text-tertiary); margin-top: 6px; }
  
  /* Hidden file input */
  .hidden-input { display: none; }
  
  /* Progress */
  .progress-container { margin: 16px 0; }
  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-tertiary);
    margin-bottom: 6px;
  }
  .progress-bar {
    height: 6px;
    background: var(--bg-panel);
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald));
    border-radius: 3px;
    transition: width 0.3s;
  }
  
  /* Search Results */
  .search-result {
    background: var(--bg-panel);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  
  .search-result:hover {
    border-color: var(--accent-cyan);
    background: var(--bg-elevated);
  }
  
  .search-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .search-result-file {
    font-weight: 600;
    color: var(--accent-cyan);
    font-size: 13px;
  }
  
  .search-result-score {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--accent-emerald);
    background: var(--bg-secondary);
    padding: 2px 8px;
    border-radius: 4px;
  }
  
  .search-result-snippet {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  
  /* Settings Grid */
  .settings-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .settings-card {
    background: var(--bg-panel);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 20px;
  }
  
  .settings-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .settings-card-icon {
    width: 32px;
    height: 32px;
    background: var(--bg-elevated);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-cyan);
  }
  
  .settings-card-icon svg { width: 16px; height: 16px; }
  
  .settings-card-title {
    font-size: 14px;
    font-weight: 600;
  }
  
  .settings-card-desc {
    font-size: 11px;
    color: var(--text-tertiary);
  }
  
  .settings-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    margin-top: 12px;
  }
  
  .settings-status.configured { color: var(--accent-emerald); }
  .settings-status.not-configured { color: var(--text-tertiary); }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: var(--bg-secondary);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    padding: 24px;
    width: 480px;
    max-width: 90vw;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .modal-title {
    font-size: 16px;
    font-weight: 600;
  }
  
  .modal-close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 4px;
  }
  
  .modal-close:hover { color: var(--text-primary); }
  .modal-close svg { width: 20px; height: 20px; }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
  
  /* Toast */
  .toast {
    position: fixed;
    bottom: 48px;
    right: 24px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    z-index: 1000;
    animation: slideIn 0.2s ease;
  }
  
  .toast.success { border-color: var(--accent-emerald); }
  .toast.error { border-color: var(--accent-red); }
  
  .toast-icon { width: 18px; height: 18px; }
  .toast.success .toast-icon { color: var(--accent-emerald); }
  .toast.error .toast-icon { color: var(--accent-red); }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes glow {
    from { box-shadow: 0 0 5px var(--accent-cyan), 0 0 10px var(--accent-cyan); }
    to { box-shadow: 0 0 10px var(--accent-cyan), 0 0 20px var(--accent-cyan), 0 0 30px var(--accent-cyan); }
  }
`;

// ============================================================
// Icons
// ============================================================

const Icons = {
  Logo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6M9 12h6M9 15h4" />
    </svg>
  ),
  File: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17,8 12,3 7,8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Folder: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  FileText: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Binary: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="15" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12,2 2,7 12,12 22,7" />
      <polyline points="2,17 12,22 22,17" />
      <polyline points="2,12 12,17 22,12" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Database: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Key: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Cpu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  ),
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
    </svg>
  ),
  Globe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17,21 17,13 7,13 7,21" />
      <polyline points="7,3 7,8 15,8" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
};

// ============================================================
// Types
// ============================================================

interface AifBinFile {
  path: string;
  name: string;
  size: number;
  rawBytes?: Uint8Array;
  format?: string;
  created?: string;
  source?: string;
  sourceContent?: string;
  model?: string;
  chunks?: Array<{ label: string; type: string; content: string }>;
  entities?: Record<string, string[]>;
  metadata?: Record<string, any>;
  hasRaw?: boolean;
}

interface IngestFile {
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
}

interface ProviderConfig {
  id: string;
  name: string;
  description: string;
  apiKey: string;
  configured: boolean;
  icon: React.FC;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

type TabType = 'inspector' | 'ingestor' | 'settings';
type InspectorSubTab = 'overview' | 'source' | 'chunks' | 'metadata' | 'hex';

// ============================================================
// Utility Functions
// ============================================================

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function bytesToHex(bytes: Uint8Array, maxBytes = 512): { rows: Array<{ offset: string; hex: string; ascii: string }> } {
  const rows = [];
  const len = Math.min(bytes.length, maxBytes);
  
  for (let i = 0; i < len; i += 16) {
    const slice = bytes.slice(i, Math.min(i + 16, len));
    const offset = i.toString(16).padStart(8, '0').toUpperCase();
    const hex = Array.from(slice).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    const ascii = Array.from(slice).map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
    rows.push({ offset, hex: hex.padEnd(47, ' '), ascii });
  }
  
  return { rows };
}

// Parse AIF-BIN v2 binary format (MessagePack)
async function parseAifBinV2(bytes: Uint8Array): Promise<Partial<AifBinFile>> {
  const result: Partial<AifBinFile> = {
    format: 'Unknown',
    chunks: [],
    entities: {},
    metadata: {},
    hasRaw: false,
    sourceContent: '',
  };
  
  // Try to detect format and extract data
  try {
    const text = new TextDecoder().decode(bytes);
    
    // Check if it's JSON (v1)
    if (text.trimStart().startsWith('{')) {
      result.format = 'v1 JSON';
      const json = JSON.parse(text);
      result.metadata = json.metadata || {};
      result.source = json.source || json.metadata?.source;
      result.model = json.model || json.metadata?.model;
      result.created = json.created || json.metadata?.created;
      result.sourceContent = json.raw || json.original || json.content || '';
      result.hasRaw = !!result.sourceContent;
      
      if (json.chunks) {
        result.chunks = json.chunks.map((c: any, i: number) => ({
          label: c.label || c.title || `Chunk ${i + 1}`,
          type: c.type || 'text',
          content: c.content || c.text || '',
        }));
      }
      
      if (json.entities) {
        result.entities = json.entities;
      }
      
      return result;
    }
    
    // Binary v2 format detection - check for "AIFBIN\x00\x01" magic
    const magic = String.fromCharCode(...bytes.slice(0, 6));
    if (magic === 'AIFBIN' && bytes[6] === 0x00 && bytes[7] === 0x01) {
      result.format = 'v2 Binary';
      
      // Parse v2 header
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const version = view.getUint32(8, true);
      const metadataOffset = Number(view.getBigUint64(16, true));
      const rawOffset = view.getBigUint64(24, true);
      const chunksOffset = Number(view.getBigUint64(32, true));
      
      // Read metadata section
      if (metadataOffset < bytes.length) {
        const metadataLen = Number(view.getBigUint64(metadataOffset, true));
        if (metadataLen > 0 && metadataOffset + 8 + metadataLen <= bytes.length) {
          const metadataBytes = bytes.slice(metadataOffset + 8, metadataOffset + 8 + metadataLen);
          try {
            // Decode msgpack metadata
            const { decode } = await import('@msgpack/msgpack');
            const meta = decode(metadataBytes) as Record<string, any>;
            result.metadata = meta;
            result.source = meta.source || meta.originalName;
            result.model = meta.model || meta.provider;
            result.created = meta.created || meta.convertedAt;
            if (meta.entities) {
              result.entities = meta.entities;
            }
          } catch (e) {
            console.error('Failed to decode metadata:', e);
          }
        }
      }
      
      // Read raw content section
      const ABSENT = BigInt('0xFFFFFFFFFFFFFFFF');
      if (rawOffset !== ABSENT && Number(rawOffset) < bytes.length) {
        const rawPos = Number(rawOffset);
        const rawLen = Number(view.getBigUint64(rawPos, true));
        if (rawLen > 0 && rawPos + 8 + rawLen <= bytes.length) {
          const rawBytes = bytes.slice(rawPos + 8, rawPos + 8 + rawLen);
          result.sourceContent = new TextDecoder().decode(rawBytes);
          result.hasRaw = true;
        }
      }
      
      // Read chunks section
      if (chunksOffset < bytes.length) {
        const chunkCount = view.getUint32(chunksOffset, true);
        let pos = chunksOffset + 4;
        const parsedChunks: Array<{ label: string; type: string; content: string }> = [];
        
        for (let i = 0; i < chunkCount && pos < bytes.length; i++) {
          const chunkType = view.getUint32(pos, true);
          const dataLen = Number(view.getBigUint64(pos + 4, true));
          const metaLen = Number(view.getBigUint64(pos + 12, true));
          pos += 20;
          
          let label = `Chunk ${i + 1}`;
          let type = 'text';
          
          // Decode chunk metadata
          if (metaLen > 0 && pos + metaLen <= bytes.length) {
            try {
              const { decode } = await import('@msgpack/msgpack');
              const chunkMeta = decode(bytes.slice(pos, pos + metaLen)) as Record<string, any>;
              label = chunkMeta.label || label;
              type = chunkMeta.type || type;
            } catch {}
          }
          pos += metaLen;
          
          // Read chunk data
          let content = '';
          if (dataLen > 0 && pos + dataLen <= bytes.length) {
            content = new TextDecoder().decode(bytes.slice(pos, pos + dataLen));
          }
          pos += dataLen;
          
          parsedChunks.push({ label, type, content });
        }
        
        result.chunks = parsedChunks;
      }
      
      return result;
    }
    
    // Legacy binary detection (msgpack without header)
    if (bytes[0] === 0x82 || bytes[0] === 0x83 || bytes[0] === 0x84 || bytes[0] === 0x85) {
      result.format = 'v1 Binary (legacy)';
      
      // Extract any readable text for display
      const readableText = extractReadableText(bytes);
      if (readableText.length > 50) {
        result.sourceContent = readableText;
        result.hasRaw = true;
      }
    }
    
    // Check for raw content embedded in binary
    if (!result.sourceContent) {
      // Look for markdown-like content
      const mdContent = extractReadableText(bytes);
      if (mdContent.includes('#') || mdContent.includes('- ') || mdContent.length > 100) {
        result.sourceContent = mdContent;
        result.hasRaw = true;
      }
    }
    
  } catch (e) {
    console.error('Parse error:', e);
  }
  
  return result;
}

function findBinaryString(bytes: Uint8Array, search: string): number {
  const searchBytes = new TextEncoder().encode(search);
  outer: for (let i = 0; i < bytes.length - searchBytes.length; i++) {
    for (let j = 0; j < searchBytes.length; j++) {
      if (bytes[i + j] !== searchBytes[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function extractAfterMarker(bytes: Uint8Array, marker: string): string {
  const pos = findBinaryString(bytes, marker);
  if (pos === -1) return '';
  
  const start = pos + marker.length;
  const slice = bytes.slice(start, Math.min(start + 500, bytes.length));
  return new TextDecoder('utf-8', { fatal: false }).decode(slice);
}

function extractReadableText(bytes: Uint8Array): string {
  // Find runs of printable ASCII + common UTF-8
  let result = '';
  let current = '';
  
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    // Printable ASCII or common UTF-8 continuation
    if ((b >= 32 && b < 127) || b === 10 || b === 13 || b === 9) {
      current += String.fromCharCode(b);
    } else if (b >= 0xC0 && b < 0xF8) {
      // UTF-8 multi-byte start
      let char = '';
      let len = b < 0xE0 ? 2 : b < 0xF0 ? 3 : 4;
      if (i + len <= bytes.length) {
        try {
          char = new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(i, i + len));
          current += char;
          i += len - 1;
        } catch {}
      }
    } else {
      if (current.length > 20) {
        result += current + '\n';
      }
      current = '';
    }
  }
  
  if (current.length > 20) {
    result += current;
  }
  
  return result.trim();
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================
// AIF-BIN v2 Binary Format Encoder
// ============================================================

const AIFBIN_MAGIC = new Uint8Array([0x41, 0x49, 0x46, 0x42, 0x49, 0x4E, 0x00, 0x01]); // "AIFBIN\x00\x01"
const HEADER_SIZE = 64;
const ABSENT_OFFSET = BigInt('0xFFFFFFFFFFFFFFFF');
const CHUNK_TYPE = { TEXT: 1, TABLE_JSON: 2, IMAGE: 3, AUDIO: 4, VIDEO: 5, CODE: 6 };

function encodeAifBinV2(options: {
  metadata: Record<string, any>;
  rawContent?: string;
  chunks: Array<{ label: string; type: string; content: string }>;
}): Uint8Array {
  const { metadata, rawContent, chunks } = options;
  
  // Encode metadata with msgpack
  const metadataBytes = msgpackEncode(metadata);
  
  // Encode raw content if present
  const rawBytes = rawContent ? new TextEncoder().encode(rawContent) : null;
  
  // Encode chunks
  const encodedChunks: Uint8Array[] = [];
  for (const chunk of chunks) {
    const chunkMeta = msgpackEncode({ label: chunk.label, type: chunk.type });
    const chunkData = new TextEncoder().encode(chunk.content);
    
    // Chunk format: type(u32) + dataLen(u64) + metaLen(u64) + meta + data
    const chunkBuffer = new ArrayBuffer(4 + 8 + 8 + chunkMeta.length + chunkData.length);
    const chunkView = new DataView(chunkBuffer);
    const chunkArray = new Uint8Array(chunkBuffer);
    
    // Determine chunk type
    let typeNum = CHUNK_TYPE.TEXT;
    if (chunk.type === 'code') typeNum = CHUNK_TYPE.CODE;
    else if (chunk.type === 'table') typeNum = CHUNK_TYPE.TABLE_JSON;
    else if (chunk.type === 'image') typeNum = CHUNK_TYPE.IMAGE;
    
    chunkView.setUint32(0, typeNum, true);
    chunkView.setBigUint64(4, BigInt(chunkData.length), true);
    chunkView.setBigUint64(12, BigInt(chunkMeta.length), true);
    chunkArray.set(chunkMeta, 20);
    chunkArray.set(chunkData, 20 + chunkMeta.length);
    
    encodedChunks.push(chunkArray);
  }
  
  // Calculate total chunks section size
  const chunksSectionSize = 4 + encodedChunks.reduce((sum, c) => sum + c.length, 0); // count(u32) + all chunks
  
  // Calculate offsets
  const metadataOffset = BigInt(HEADER_SIZE);
  const metadataSectionSize = 8 + metadataBytes.length; // length(u64) + data
  
  const rawOffset = rawBytes ? metadataOffset + BigInt(metadataSectionSize) : ABSENT_OFFSET;
  const rawSectionSize = rawBytes ? 8 + rawBytes.length : 0; // length(u64) + data
  
  const chunksOffset = rawBytes 
    ? rawOffset + BigInt(rawSectionSize)
    : metadataOffset + BigInt(metadataSectionSize);
  
  const footerOffset = chunksOffset + BigInt(chunksSectionSize);
  
  // Footer: indexCount(u32) + checksum(u64)
  const footerSize = 4 + 8;
  const totalSize = footerOffset + BigInt(footerSize);
  
  // Build the file
  const buffer = new ArrayBuffer(Number(totalSize));
  const view = new DataView(buffer);
  const array = new Uint8Array(buffer);
  
  // Write header (64 bytes)
  array.set(AIFBIN_MAGIC, 0);                        // Magic (8 bytes)
  view.setUint32(8, 2, true);                        // Version = 2 (4 bytes)
  // 4 bytes padding (12-15)
  view.setBigUint64(16, metadataOffset, true);       // metadataOffset
  view.setBigUint64(24, rawOffset, true);            // originalRawOffset
  view.setBigUint64(32, chunksOffset, true);         // contentChunksOffset
  view.setBigUint64(40, ABSENT_OFFSET, true);        // versionsOffset (not used)
  view.setBigUint64(48, footerOffset, true);         // footerOffset
  view.setBigUint64(56, totalSize, true);            // totalSize
  
  // Write metadata section
  let pos = Number(metadataOffset);
  view.setBigUint64(pos, BigInt(metadataBytes.length), true);
  pos += 8;
  array.set(metadataBytes, pos);
  pos += metadataBytes.length;
  
  // Write raw section (if present)
  if (rawBytes) {
    view.setBigUint64(pos, BigInt(rawBytes.length), true);
    pos += 8;
    array.set(rawBytes, pos);
    pos += rawBytes.length;
  }
  
  // Write chunks section
  view.setUint32(pos, chunks.length, true);
  pos += 4;
  for (const chunk of encodedChunks) {
    array.set(chunk, pos);
    pos += chunk.length;
  }
  
  // Write footer
  view.setUint32(pos, 0, true); // indexCount = 0
  pos += 4;
  
  // Simple checksum (sum of all bytes)
  let checksum = BigInt(0);
  for (let i = 0; i < array.length - 8; i++) {
    checksum += BigInt(array[i]);
  }
  view.setBigUint64(pos, checksum, true);
  
  return array;
}

// ============================================================
// Local Storage for Settings
// ============================================================

const STORAGE_KEY = 'aifbin-studio-settings';

function loadSettings(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveSettings(settings: Record<string, string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ============================================================
// Components
// ============================================================

const TitleBar: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => (
  <div className="titlebar">
    <div className="titlebar-logo">
      <Icons.Logo />
      <span>AIF-BIN Studio</span>
    </div>
    <div className="titlebar-actions">
      <button className="titlebar-btn" onClick={onOpenSettings}>
        <Icons.Settings />
        Settings
      </button>
    </div>
  </div>
);

const Tabs: React.FC<{ active: TabType; onChange: (tab: TabType) => void }> = ({ active, onChange }) => (
  <div className="tabs">
    <button className={`tab ${active === 'inspector' ? 'active' : ''}`} onClick={() => onChange('inspector')}>
      <Icons.Eye /> Inspector
    </button>
    <button className={`tab ${active === 'ingestor' ? 'active' : ''}`} onClick={() => onChange('ingestor')}>
      <Icons.Upload /> Ingestor
    </button>
    <button className={`tab ${active === 'settings' ? 'active' : ''}`} onClick={() => onChange('settings')}>
      <Icons.Settings /> Settings
    </button>
  </div>
);

// ============================================================
// Library Sidebar (Persistent across all tabs)
// ============================================================

const LibrarySidebar: React.FC<{
  files: AifBinFile[];
  selectedFile: AifBinFile | null;
  onSelectFile: (f: AifBinFile) => void;
  onFilesAdded: (files: AifBinFile[]) => void;
  onDeleteFile?: (name: string) => Promise<boolean>;
  isDesktop: boolean;
  libraryPath: string;
  highlightedFiles?: Set<string>;
}> = ({ files, selectedFile, onSelectFile, onFilesAdded, onDeleteFile, isDesktop, libraryPath, highlightedFiles = new Set() }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process dropped/selected .aif-bin files
  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const aifbinFiles: AifBinFile[] = [];
    
    for (const file of Array.from(fileList)) {
      if (file.name.endsWith('.aif-bin')) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const parsed = await parseAifBinV2(bytes);
        
        aifbinFiles.push({
          path: file.name,
          name: file.name,
          size: file.size,
          rawBytes: bytes,
          ...parsed,
        });
      }
    }
    
    if (aifbinFiles.length > 0) {
      onFilesAdded(aifbinFiles);
    }
  }, [onFilesAdded]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  // Filter files by search query
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.sourceContent?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'size') cmp = (a.size || 0) - (b.size || 0);
    else if (sortBy === 'date') cmp = (a.created || '').localeCompare(b.created || '');
    return sortAsc ? cmp : -cmp;
  });

  const handleDelete = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    if (onDeleteFile && confirm(`Delete ${fileName}?`)) {
      await onDeleteFile(fileName);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          {isDesktop ? '📁 Library' : '📄 Loaded Files'}
        </div>
        
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            className="input"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 32, fontSize: 12, padding: '8px 12px 8px 32px' }}
          />
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
            <Icons.Search />
          </span>
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          <select 
            className="select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
          >
            <option value="date">Sort: Date</option>
            <option value="name">Sort: Name</option>
            <option value="size">Sort: Size</option>
          </select>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setSortAsc(!sortAsc)}
            style={{ padding: '6px 8px' }}
          >
            {sortAsc ? '↑' : '↓'}
          </button>
        </div>

        {/* Open Files Button */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden-input"
          multiple
          accept=".aif-bin"
          onChange={handleFileInput}
        />
        <button 
          className="btn btn-secondary" 
          onClick={() => fileInputRef.current?.click()} 
          style={{ width: '100%', fontSize: 11 }}
        >
          <Icons.Folder /> Open .aif-bin Files
        </button>
      </div>

      <div className="sidebar-list">
        {sortedFiles.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
            {searchQuery ? 'No matches found.' : (isDesktop ? 'Library empty. Ingest files to get started.' : 'No files loaded yet.')}
          </div>
        ) : (
          sortedFiles.map((file, i) => {
            const isHighlighted = highlightedFiles.has(file.name);
            return (
              <div 
                key={i} 
                className={`file-item ${selectedFile?.path === file.path ? 'active' : ''}`}
                onClick={() => onSelectFile(file)}
                style={isHighlighted ? {
                  animation: 'glow 1s ease-in-out infinite alternate',
                  boxShadow: '0 0 10px var(--accent-cyan), 0 0 20px var(--accent-cyan)',
                  borderColor: 'var(--accent-cyan)',
                } : undefined}
              >
                <div className="file-item-icon" style={isHighlighted ? { color: 'var(--accent-cyan)' } : undefined}>
                  <Icons.File />
                </div>
                <div className="file-item-info">
                  <div className="file-item-name" style={isHighlighted ? { color: 'var(--accent-cyan)' } : undefined}>
                    {file.name}
                  </div>
                  <div className="file-item-meta">{formatBytes(file.size)} • {file.format}</div>
                </div>
                {isDesktop && onDeleteFile && (
                  <button 
                    className="btn btn-sm"
                    onClick={(e) => handleDelete(e, file.name)}
                    style={{ padding: 4, background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}
                    title="Delete"
                  >
                    <Icons.X />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Library path (desktop only) */}
      {isDesktop && libraryPath && (
        <div style={{ 
          padding: '8px 12px', 
          fontSize: 10, 
          color: 'var(--text-tertiary)', 
          borderTop: '1px solid var(--border-subtle)',
          wordBreak: 'break-all'
        }}>
          📂 {libraryPath}
        </div>
      )}
    </div>
  );
};

const StatusBar: React.FC<{ fileCount: number; message?: string; providers: ProviderConfig[] }> = ({ fileCount, message, providers }) => {
  const configuredCount = providers.filter(p => p.configured).length;
  
  return (
    <div className="statusbar">
      <div className="status-item">
        <div className={`status-dot ${configuredCount === 0 ? 'warning' : ''}`} />
        {message || 'Ready'}
      </div>
      <div className="status-item">
        {fileCount} file{fileCount !== 1 ? 's' : ''} loaded
      </div>
      <div className="status-item">
        {configuredCount}/{providers.length} AI providers configured
      </div>
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => (
  <>
    {toasts.map((toast) => (
      <div key={toast.id} className={`toast ${toast.type}`} onClick={() => onRemove(toast.id)}>
        <span className="toast-icon">
          {toast.type === 'success' ? <Icons.Check /> : <Icons.AlertCircle />}
        </span>
        {toast.message}
      </div>
    ))}
  </>
);

// Inspector Sub-Components
const OverviewPanel: React.FC<{ file: AifBinFile }> = ({ file }) => (
  <div className="panel">
    <div className="panel-header">
      <div className="panel-title"><Icons.Info /> File Overview</div>
    </div>
    <div className="data-row">
      <div className="data-label">Filename</div>
      <div className="data-value">{file.name}</div>
    </div>
    <div className="data-row">
      <div className="data-label">Size</div>
      <div className="data-value cyan">{formatBytes(file.size)}</div>
    </div>
    <div className="data-row">
      <div className="data-label">Format</div>
      <div className="data-value emerald">{file.format || 'Detecting...'}</div>
    </div>
    {file.source && (
      <div className="data-row">
        <div className="data-label">Source</div>
        <div className="data-value">{file.source}</div>
      </div>
    )}
    {file.model && (
      <div className="data-row">
        <div className="data-label">Model</div>
        <div className="data-value">{file.model}</div>
      </div>
    )}
    {file.created && (
      <div className="data-row">
        <div className="data-label">Created</div>
        <div className="data-value">{file.created}</div>
      </div>
    )}
    {file.chunks && (
      <div className="data-row">
        <div className="data-label">Chunks</div>
        <div className="data-value cyan">{file.chunks.length}</div>
      </div>
    )}
    <div className="data-row">
      <div className="data-label">Has Raw Source</div>
      <div className={`data-value ${file.hasRaw ? 'emerald' : 'amber'}`}>
        {file.hasRaw ? 'Yes' : 'No'}
      </div>
    </div>
  </div>
);

const SourcePanel: React.FC<{ file: AifBinFile; onToast: (msg: string, type: 'success' | 'error') => void }> = ({ file, onToast }) => {
  const handleCopy = () => {
    if (file.sourceContent) {
      navigator.clipboard.writeText(file.sourceContent);
      onToast('Content copied to clipboard', 'success');
    }
  };
  
  const handleExport = (format: 'txt' | 'md') => {
    if (file.sourceContent) {
      const ext = format === 'md' ? '.md' : '.txt';
      const filename = file.name.replace('.aif-bin', ext);
      downloadText(filename, file.sourceContent);
      onToast(`Exported as ${filename}`, 'success');
    }
  };
  
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title"><Icons.FileText /> Original Source Content</div>
        <div className="panel-actions">
          {file.sourceContent && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                <Icons.Copy /> Copy
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleExport('md')}>
                <Icons.Download /> Export .md
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleExport('txt')}>
                <Icons.Download /> Export .txt
              </button>
            </>
          )}
        </div>
      </div>
      
      {file.sourceContent ? (
        <div className="code-block">{file.sourceContent}</div>
      ) : (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 20, textAlign: 'center' }}>
          <Icons.AlertCircle />
          <p style={{ marginTop: 8 }}>No raw source content embedded in this file.</p>
          <p style={{ marginTop: 4, fontSize: 11 }}>The original source may not have been preserved during ingestion.</p>
        </div>
      )}
    </div>
  );
};

const ChunksPanel: React.FC<{ file: AifBinFile }> = ({ file }) => (
  <div className="panel">
    <div className="panel-header">
      <div className="panel-title"><Icons.Layers /> Content Chunks ({file.chunks?.length || 0})</div>
    </div>
    
    {file.chunks && file.chunks.length > 0 ? (
      file.chunks.map((chunk, i) => (
        <div key={i} className="chunk-item">
          <div className="chunk-header">
            <span className="chunk-label">{chunk.label || `Chunk ${i + 1}`}</span>
            <span className="chunk-type">{chunk.type || 'text'}</span>
          </div>
          <div className="chunk-content">
            {chunk.content?.slice(0, 800)}
            {(chunk.content?.length || 0) > 800 && '...'}
          </div>
        </div>
      ))
    ) : (
      <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: 20, textAlign: 'center' }}>
        No chunks found. The file may need re-parsing or was created without chunking.
      </div>
    )}
  </div>
);

const MetadataPanel: React.FC<{ file: AifBinFile }> = ({ file }) => (
  <div className="panel">
    <div className="panel-header">
      <div className="panel-title"><Icons.Database /> Metadata & Entities</div>
    </div>
    
    {file.entities && Object.keys(file.entities).length > 0 && (
      <div style={{ marginBottom: 20 }}>
        <div className="form-label" style={{ marginBottom: 10 }}>Extracted Entities</div>
        <div>
          {Object.entries(file.entities).map(([type, values]) => (
            values.map((val, i) => (
              <span key={`${type}-${i}`} className="entity-badge">
                <span className="entity-badge-type">{type}</span>
                <span className="entity-badge-value">{val}</span>
              </span>
            ))
          ))}
        </div>
      </div>
    )}
    
    {file.metadata && Object.keys(file.metadata).length > 0 ? (
      <>
        <div className="form-label" style={{ marginBottom: 10 }}>File Metadata</div>
        {Object.entries(file.metadata).map(([key, value]) => (
          <div key={key} className="data-row">
            <div className="data-label">{key}</div>
            <div className="data-value">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </div>
          </div>
        ))}
      </>
    ) : (
      <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
        No additional metadata found in this file.
      </div>
    )}
  </div>
);

const HexPanel: React.FC<{ file: AifBinFile }> = ({ file }) => {
  const hexData = file.rawBytes ? bytesToHex(file.rawBytes, 1024) : { rows: [] };
  
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title"><Icons.Binary /> Hex View (first 1KB)</div>
      </div>
      
      {hexData.rows.length > 0 ? (
        <div className="code-block hex-view">
          {hexData.rows.map((row, i) => (
            <div key={i} className="hex-row">
              <span className="hex-offset">{row.offset}</span>
              <span className="hex-bytes">{row.hex}</span>
              <span className="hex-ascii">{row.ascii}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
          Raw bytes not available
        </div>
      )}
    </div>
  );
};

// Inspector Tab (Content Only - Sidebar is now global)
const InspectorTab: React.FC<{ 
  selectedFile: AifBinFile | null; 
  onToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ selectedFile, onToast }) => {
  const [subTab, setSubTab] = useState<InspectorSubTab>('overview');

  return (
    <div className="content">
      {!selectedFile ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'var(--text-tertiary)',
          padding: 48
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>No file selected</div>
          <div style={{ fontSize: 13 }}>Select a file from the library or ingest new files</div>
        </div>
      ) : (
        <>
          <div className="sub-tabs">
            <button className={`sub-tab ${subTab === 'overview' ? 'active' : ''}`} onClick={() => setSubTab('overview')}>
              <Icons.Info /> Overview
            </button>
            <button className={`sub-tab ${subTab === 'source' ? 'active' : ''}`} onClick={() => setSubTab('source')}>
              <Icons.FileText /> Source
            </button>
            <button className={`sub-tab ${subTab === 'chunks' ? 'active' : ''}`} onClick={() => setSubTab('chunks')}>
              <Icons.Layers /> Chunks
            </button>
            <button className={`sub-tab ${subTab === 'metadata' ? 'active' : ''}`} onClick={() => setSubTab('metadata')}>
              <Icons.Database /> Metadata
            </button>
            <button className={`sub-tab ${subTab === 'hex' ? 'active' : ''}`} onClick={() => setSubTab('hex')}>
              <Icons.Binary /> Hex
            </button>
          </div>
          
          {subTab === 'overview' && <OverviewPanel file={selectedFile} />}
          {subTab === 'source' && <SourcePanel file={selectedFile} onToast={onToast} />}
          {subTab === 'chunks' && <ChunksPanel file={selectedFile} />}
          {subTab === 'metadata' && <MetadataPanel file={selectedFile} />}
          {subTab === 'hex' && <HexPanel file={selectedFile} />}
        </>
      )}
    </div>
  );
};

// Ingestor Tab
interface ConvertedFile {
  name: string;
  blob: Blob;
  size: number;
  data?: Uint8Array;
}

const IngestorTab: React.FC<{ 
  providers: ProviderConfig[]; 
  onToast: (msg: string, type: 'success' | 'error') => void;
  onFilesIngested?: (files: AifBinFile[]) => void;
  saveToLibrary?: (name: string, data: Uint8Array) => Promise<boolean>;
  isDesktop?: boolean;
}> = ({ providers, onToast, onFilesIngested, saveToLibrary: saveToLib, isDesktop }) => {
  const [files, setFiles] = useState<IngestFile[]>([]);
  const [provider, setProvider] = useState('none');
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [autoDownload, setAutoDownload] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const configuredProviders = providers.filter(p => p.configured);

  // Helper: Convert ArrayBuffer to base64 (handles large files)
  const arrayBufferToBase64 = (buffer: ArrayBuffer): Promise<string> => {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer]);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove the data:...;base64, prefix
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Helper: Extract text from image using Gemini Vision API
  const extractWithGeminiVision = async (base64Data: string, mimeType: string, apiKey: string, prompt: string, retries = 3): Promise<string> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64Data } }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
          })
        });
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          console.warn(`Gemini rate limited, attempt ${attempt}/${retries}. Waiting...`);
          await new Promise(r => setTimeout(r, 2000 * attempt)); // Exponential backoff
          continue;
        }
        
        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${error}`);
        }
        
        const result = await response.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || 'No text extracted';
      } catch (err: any) {
        if (attempt === retries) throw err;
        console.warn(`Gemini attempt ${attempt} failed:`, err.message);
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    throw new Error('Max retries exceeded');
  };

  // Convert a file to AIF-BIN format
  const convertToAifBin = async (file: File): Promise<Blob> => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Get Gemini API key
    const geminiProvider = providers.find(p => p.id === 'gemini');
    const geminiKey = geminiProvider?.apiKey;
    
    let extractedContent = '';
    let chunks: any[] = [];
    let extractionMethod = 'text';
    
    if ((isPdf || isImage) && geminiKey) {
      // Use Gemini Vision for PDFs and images
      extractionMethod = 'gemini-vision';
      try {
        const base64 = await arrayBufferToBase64(arrayBuffer);
        const mimeType = isPdf ? 'application/pdf' : file.type;
        const prompt = isPdf 
          ? 'Extract ALL text and information from this PDF document. Include: titles, headings, paragraphs, tables, property IDs, names, addresses, measurements, dates, and any other visible text. Format clearly with sections.'
          : 'Extract ALL text and information from this image. Describe what you see and transcribe any visible text.';
        
        extractedContent = await extractWithGeminiVision(base64, mimeType, geminiKey, prompt);
        chunks = [{
          label: 'Gemini Vision Extraction',
          type: 'vision-extraction',
          content: extractedContent,
        }];
      } catch (err: any) {
        console.error('Gemini extraction failed:', err);
        extractedContent = `Error extracting with Gemini: ${err.message}`;
        chunks = [{
          label: 'Extraction Error',
          type: 'error',
          content: extractedContent,
        }];
      }
    } else if (isPdf || isImage) {
      // Binary file without AI - can't extract
      extractionMethod = 'none';
      extractedContent = '';
      chunks = [{
        label: 'Notice',
        type: 'info',
        content: `This is a ${isPdf ? 'PDF' : 'image'} file. Configure Gemini API key in Settings to enable vision extraction.`,
      }];
    } else {
      // Text file - read directly
      extractionMethod = 'text';
      extractedContent = await file.text().catch(() => '');
      if (extractedContent && !extractedContent.startsWith('%PDF')) {
        chunks = [{
          label: 'Main Content',
          type: 'text',
          content: extractedContent,
        }];
      }
    }
    
    // Create AIF-BIN v2 binary format
    const metadata = {
      version: '2.0.0',
      format: 'aif-bin',
      created: new Date().toISOString(),
      source: file.name,
      originalName: file.name,
      originalSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      convertedAt: new Date().toISOString(),
      provider: extractionMethod === 'gemini-vision' ? 'gemini' : provider,
      extractionMethod,
      entities: {
        dates: (extractedContent.match(/\d{4}-\d{2}-\d{2}/g) || []).slice(0, 10),
      },
    };
    
    const v2Binary = encodeAifBinV2({
      metadata,
      rawContent: extractedContent || undefined,
      chunks,
    });
    
    return new Blob([v2Binary], { type: 'application/octet-stream' });
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).map(file => ({
      file,
      name: file.name,
      size: file.size,
      status: 'pending' as const,
      progress: 0,
    }));
    
    setFiles(prev => [...prev, ...droppedFiles]);
    setStatus('idle');
    setConvertedFiles([]);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        size: file.size,
        status: 'pending' as const,
        progress: 0,
      }));
      setFiles(prev => [...prev, ...newFiles]);
      setStatus('idle');
      setConvertedFiles([]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setConvertedFiles([]);
    setStatus('idle');
    setOverallProgress(0);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setStatus('running');
    setOverallProgress(0);
    setConvertedFiles([]);
    
    const converted: ConvertedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Mark as processing
      setFiles(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing', progress: 0 } : f
      ));
      
      try {
        // Add delay between files to avoid API rate limiting
        if (i > 0) {
          await new Promise(r => setTimeout(r, 1000)); // 1 second delay between files
        }
        
        // Simulate some processing time with progress updates
        for (let p = 0; p <= 50; p += 10) {
          await new Promise(r => setTimeout(r, 30));
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress: p } : f
          ));
        }
        
        // Actually convert the file
        console.log(`Converting file ${i + 1}/${files.length}: ${file.name}`);
        const blob = await convertToAifBin(file.file);
        console.log(`Converted ${file.name}: ${blob.size} bytes`);
        const outputName = file.name.replace(/\.[^.]+$/, '') + '.aif-bin';
        
        // More progress
        for (let p = 50; p <= 90; p += 10) {
          await new Promise(r => setTimeout(r, 20));
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress: p } : f
          ));
        }
        
        // Get the binary data
        const blobData = new Uint8Array(await blob.arrayBuffer());
        
        converted.push({ name: outputName, blob, size: blob.size, data: blobData });
        
        // Save to library if in desktop mode
        if (isDesktop && saveToLib) {
          await saveToLib(outputName, blobData);
        }
        
        // Auto-download if enabled (browser mode or user preference)
        if (autoDownload && !isDesktop) {
          downloadFile(blob, outputName);
        }
        
        // Mark as done
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'done', progress: 100 } : f
        ));
        
      } catch (err: any) {
        console.error(`Error converting ${file.name}:`, err);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', progress: 0 } : f
        ));
        // Show error toast for this specific file
        onToast(`Failed to convert ${file.name}: ${err.message || 'Unknown error'}`, 'error');
      }
      
      setOverallProgress(Math.round(((i + 1) * 100) / files.length));
    }
    
    setConvertedFiles(converted);
    setStatus('done');
    
    // Notify parent of new files (for library sidebar)
    if (onFilesIngested && converted.length > 0) {
      const ingestedFiles: AifBinFile[] = [];
      for (const cf of converted) {
        if (cf.data) {
          const parsed = await parseAifBinV2(cf.data);
          ingestedFiles.push({
            path: cf.name,
            name: cf.name,
            size: cf.size,
            rawBytes: cf.data,
            ...parsed,
          });
        }
      }
      onFilesIngested(ingestedFiles);
    }
    
    const savedTo = isDesktop ? 'library' : 'downloads';
    onToast(`Converted ${converted.length} file(s) to AIF-BIN (${savedTo})`, 'success');
  };

  const downloadAllConverted = () => {
    convertedFiles.forEach(cf => downloadFile(cf.blob, cf.name));
    onToast(`Downloaded ${convertedFiles.length} file(s)`, 'success');
  };

  return (
    <div className="content content-centered">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><Icons.Upload /> Convert Files to AIF-BIN</div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Source Files</label>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden-input"
            multiple
            onChange={handleFileInput}
          />
          <div
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: files.length > 0 ? '24px' : '48px' }}
          >
            <div className="dropzone-icon">
              <Icons.Upload />
            </div>
            <div className="dropzone-text">
              {files.length === 0 ? 'Drop files here to convert' : `${files.length} file(s) ready`}
            </div>
            <div className="dropzone-hint">
              PDF, DOCX, TXT, MD, images, and more
            </div>
            
            {files.length > 0 && (
              <div className="dropzone-files" onClick={(e) => e.stopPropagation()}>
                {files.map((f, i) => (
                  <div key={i} className="dropzone-file">
                    <span className="dropzone-file-icon"><Icons.FileText /></span>
                    <span className="dropzone-file-name">{f.name}</span>
                    <span className="dropzone-file-size">
                      {f.status === 'processing' ? `${f.progress}%` : formatBytes(f.size)}
                    </span>
                    {f.status === 'pending' && (
                      <span className="dropzone-file-remove" onClick={() => removeFile(i)}>
                        <Icons.X />
                      </span>
                    )}
                    {f.status === 'done' && (
                      <span style={{ color: 'var(--accent-emerald)' }}><Icons.Check /></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">AI Provider (for intelligent extraction)</label>
          <select 
            className="select" 
            value={provider} 
            onChange={(e) => setProvider(e.target.value)} 
            style={{ width: '100%' }}
          >
            <option value="none">None — Basic text extraction</option>
            {configuredProviders.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.description}</option>
            ))}
          </select>
          {configuredProviders.length === 0 && (
            <div className="form-hint" style={{ color: 'var(--accent-amber)' }}>
              Configure AI providers in Settings to enable intelligent extraction
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoDownload} 
              onChange={(e) => setAutoDownload(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-cyan)' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Auto-download files after conversion
            </span>
          </label>
          <div className="form-hint">
            Files will be saved to your browser's Downloads folder
          </div>
        </div>
        
        {status === 'running' && (
          <div className="progress-container">
            <div className="progress-label">
              <span>Converting files...</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-primary" 
            onClick={handleConvert}
            disabled={files.length === 0 || status === 'running'}
            style={{ flex: 1 }}
          >
            <Icons.Zap />
            {status === 'running' ? 'Converting...' : 'Convert to AIF-BIN'}
          </button>
          {files.length > 0 && (
            <button 
              className="btn btn-secondary" 
              onClick={clearAll}
              disabled={status === 'running'}
            >
              <Icons.X /> Clear
            </button>
          )}
        </div>
      </div>
      
      {/* Converted Files Panel */}
      {convertedFiles.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Icons.Check /> Converted Files ({convertedFiles.length})
            </div>
            <div className="panel-actions">
              {!autoDownload && (
                <button className="btn btn-secondary btn-sm" onClick={downloadAllConverted}>
                  <Icons.Download /> Download All
                </button>
              )}
            </div>
          </div>
          
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 12 }}>
            {autoDownload ? (
              <>Files have been downloaded to your browser's <strong>Downloads</strong> folder</>
            ) : (
              <>Click to download individual files or use "Download All"</>
            )}
          </div>
          
          {convertedFiles.map((cf, i) => (
            <div 
              key={i} 
              className="dropzone-file" 
              style={{ cursor: 'pointer' }}
              onClick={() => downloadFile(cf.blob, cf.name)}
            >
              <span className="dropzone-file-icon" style={{ color: 'var(--accent-emerald)' }}>
                <Icons.File />
              </span>
              <span className="dropzone-file-name">{cf.name}</span>
              <span className="dropzone-file-size">{formatBytes(cf.size)}</span>
              <span style={{ color: 'var(--accent-cyan)' }}>
                <Icons.Download />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Search Tab
const SearchTab: React.FC<{ onToast: (msg: string, type: 'success' | 'error') => void }> = ({ onToast }) => {
  const [query, setQuery] = useState('');
  const [directory, setDirectory] = useState('./memory/aifbin');
  const [results, setResults] = useState<Array<{ file: string; score: number; snippet: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    
    setSearching(true);
    setHasSearched(true);
    
    // Simulate search with mock results
    await new Promise(r => setTimeout(r, 800));
    
    setResults([
      { 
        file: '2026-01-30.aif-bin', 
        score: 0.847, 
        snippet: 'AIF-BIN CLI Finalized: Debugged and fixed aifbin_cli.py for migrate, info, search, extract, parse commands...' 
      },
      { 
        file: 'MEMORY.aif-bin', 
        score: 0.723, 
        snippet: 'CEO directive: Focus all efforts on AIF-BIN until launch. This is Terronex.dev\'s flagship product...' 
      },
      { 
        file: '2026-01-29.aif-bin', 
        score: 0.654, 
        snippet: 'AIF-BIN Perfection Loop: Continued outlining the specific code needed for the embedding and indexing functions...' 
      },
    ]);
    
    setSearching(false);
    onToast(`Found ${3} results for "${query}"`, 'success');
  };

  return (
    <div className="content content-centered">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><Icons.Search /> Semantic Search</div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Search Query</label>
          <input 
            className="input" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What decisions did we make about pricing?"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div className="form-hint">Search by meaning, not just keywords</div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Search Directory</label>
          <input 
            className="input" 
            value={directory}
            onChange={(e) => setDirectory(e.target.value)}
            placeholder="./memory/aifbin"
          />
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={handleSearch}
          disabled={!query || searching}
          style={{ width: '100%' }}
        >
          <Icons.Search />
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {hasSearched && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              Results {results.length > 0 && `(${results.length})`}
            </div>
          </div>
          
          {results.length > 0 ? (
            results.map((result, i) => (
              <div key={i} className="search-result">
                <div className="search-result-header">
                  <span className="search-result-file">{result.file}</span>
                  <span className="search-result-score">{(result.score * 100).toFixed(1)}% match</span>
                </div>
                <div className="search-result-snippet">{result.snippet}</div>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: 20 }}>
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// AI Chat Sidebar
// ============================================================

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{ type: string; filename?: string }>;
}

const AIChatSidebar: React.FC<{
  files: AifBinFile[];
  providers: ProviderConfig[];
  onHighlightFile: (filename: string) => void;
  onCreateFile: (name: string, content: string) => Promise<void>;
  onRenameFile: (oldName: string, newName: string) => Promise<boolean>;
  onClearHighlights: () => void;
  hasHighlights: boolean;
  onToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ files, providers, onHighlightFile, onCreateFile, onRenameFile, onClearHighlights, hasHighlights, onToast }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get configured providers
  const configuredProviders = providers.filter(p => p.configured);

  // Auto-select first configured provider
  useEffect(() => {
    if (!selectedProvider && configuredProviders.length > 0) {
      setSelectedProvider(configuredProviders[0].id);
    }
  }, [configuredProviders, selectedProvider]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!selectedProvider) {
      onToast('Please configure an AI provider in Settings', 'error');
      return;
    }

    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Dynamic import to avoid issues in browser-only mode
      const aiProvider = await import('./lib/ai-provider');
      
      // Build message history
      const aiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      aiMessages.push({ role: 'user', content: userMessage.content });

      // Call AI
      const response = await aiProvider.callAI(provider, aiMessages, files);

      if (response.error) {
        throw new Error(response.error);
      }

      // Process actions
      for (const action of response.actions) {
        if (action.type === 'highlight' && action.filename) {
          onHighlightFile(action.filename);
        } else if (action.type === 'create' && action.filename && action.content) {
          await onCreateFile(action.filename, action.content);
        } else if (action.type === 'rename' && action.filename && action.newFilename) {
          const success = await onRenameFile(action.filename, action.newFilename);
          if (!success) {
            onToast(`Failed to rename: ${action.filename}`, 'error');
          }
        }
      }

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        actions: response.actions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('AI Chat error:', err);
      onToast(`AI Error: ${err.message}`, 'error');
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Focus input after sending
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  return (
    <div className="sidebar" style={{ borderLeft: '1px solid var(--border-subtle)', borderRight: 'none' }}>
      <div className="sidebar-header">
        <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14 }}><Icons.Cpu /></span> AI Assistant</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {hasHighlights && (
              <button 
                className="btn btn-sm" 
                onClick={onClearHighlights}
                style={{ padding: '4px 8px', fontSize: 10, background: 'var(--accent-cyan)', color: 'white', border: 'none', borderRadius: 4 }}
                title="Clear highlighted files"
              >
                Clear Results
              </button>
            )}
            {messages.length > 0 && (
              <button 
                className="btn btn-sm" 
                onClick={clearChat}
                style={{ padding: '4px 8px', fontSize: 10, background: 'transparent', border: 'none', color: 'var(--text-tertiary)' }}
                title="Clear chat"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Provider selector */}
        {configuredProviders.length > 0 ? (
          <select
            className="select"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            style={{ width: '100%', fontSize: 11, marginBottom: 8 }}
          >
            {configuredProviders.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--accent-amber)', marginBottom: 8, padding: 8, background: 'var(--bg-panel)', borderRadius: 6 }}>
            <span style={{ width: 12, height: 12, display: 'inline-block' }}><Icons.AlertCircle /></span> Configure an AI provider in Settings
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="sidebar-list" style={{ flex: 1, padding: 8 }}>
        {messages.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
            <div style={{ marginBottom: 8, width: 20, height: 20, margin: '0 auto 8px' }}><Icons.Search /></div>
            <div>Ask about your files</div>
            <div style={{ marginTop: 8, fontSize: 11 }}>
              Try: "Summarize all documents" or "Find property deeds"
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                background: msg.role === 'user' ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ 
                fontSize: 10, 
                color: 'var(--text-tertiary)', 
                marginBottom: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {msg.role === 'user' ? <><span style={{ width: 10, height: 10 }}><Icons.Eye /></span> You</> : <><span style={{ width: 10, height: 10 }}><Icons.Cpu /></span> Assistant</>}
                </span>
                <span>{msg.timestamp.toLocaleTimeString()}</span>
              </div>
              <div style={{ 
                fontSize: 13, 
                lineHeight: 1.5, 
                whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)'
              }}>
                {msg.content}
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11 }}>
                  {msg.actions.map((a, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 6px', 
                        background: a.type === 'create' ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                        color: 'white',
                        borderRadius: 4,
                        marginRight: 4,
                        marginTop: 4,
                      }}
                    >
                      {a.type === 'create' && <><span style={{ width: 10, height: 10 }}><Icons.File /></span> Created: {a.filename}</>}
                      {a.type === 'highlight' && <><span style={{ width: 10, height: 10 }}><Icons.Search /></span> Found: {a.filename}</>}
                      {a.type === 'rename' && <><span style={{ width: 10, height: 10 }}><Icons.Save /></span> Renamed: {a.filename} → {a.newFilename}</>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: 13 }}>Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 8, borderTop: '1px solid var(--border-subtle)' }}>
        <textarea
          ref={inputRef}
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={configuredProviders.length > 0 ? "Ask about your files..." : "Configure AI in Settings"}
          disabled={isLoading || configuredProviders.length === 0}
          style={{ 
            width: '100%',
            resize: 'none', 
            minHeight: 60, 
            fontSize: 12,
            fontFamily: 'var(--font-sans)'
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={isLoading || !input.trim() || configuredProviders.length === 0}
          style={{ width: '100%', marginTop: 4, fontSize: 11 }}
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
        <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center' }}>
          {files.length} file(s) in context
        </div>
      </div>
    </div>
  );
};

// Settings Tab
const SettingsTab: React.FC<{ providers: ProviderConfig[]; onUpdateProvider: (id: string, apiKey: string) => void; onToast: (msg: string, type: 'success' | 'error') => void }> = ({ providers, onUpdateProvider, onToast }) => {
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSave = (providerId: string) => {
    onUpdateProvider(providerId, apiKeyInput);
    setEditingProvider(null);
    setApiKeyInput('');
    onToast(`${providers.find(p => p.id === providerId)?.name} configured successfully`, 'success');
  };

  return (
    <div className="content content-centered">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><Icons.Key /> AI Provider Configuration</div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Configure your AI providers to enable intelligent document extraction. 
          API keys are stored locally in your browser and never sent to our servers.
        </p>
        
        <div className="settings-grid">
          {providers.map(provider => (
            <div key={provider.id} className="settings-card">
              <div className="settings-card-header">
                <div className="settings-card-icon">
                  <provider.icon />
                </div>
                <div>
                  <div className="settings-card-title">{provider.name}</div>
                  <div className="settings-card-desc">{provider.description}</div>
                </div>
              </div>
              
              {editingProvider === provider.id ? (
                <div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <div className="form-row">
                      <input
                        className={`input ${showKey ? '' : 'input-password'}`}
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={`Enter ${provider.name} API key`}
                      />
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setShowKey(!showKey)}
                        title={showKey ? 'Hide' : 'Show'}
                      >
                        {showKey ? <Icons.EyeOff /> : <Icons.Eye />}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSave(provider.id)}>
                      <Icons.Save /> Save
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditingProvider(null); setApiKeyInput(''); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`settings-status ${provider.configured ? 'configured' : 'not-configured'}`}>
                    {provider.configured ? (
                      <><Icons.Check /> Configured</>
                    ) : (
                      <><Icons.AlertCircle /> Not configured</>
                    )}
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ marginTop: 12 }}
                    onClick={() => { setEditingProvider(provider.id); setApiKeyInput(provider.apiKey); }}
                  >
                    <Icons.Key /> {provider.configured ? 'Update Key' : 'Add Key'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><Icons.Info /> About AIF-BIN Studio</div>
        </div>
        <div className="data-row">
          <div className="data-label">Version</div>
          <div className="data-value">1.0.0</div>
        </div>
        <div className="data-row">
          <div className="data-label">Developer</div>
          <div className="data-value cyan">Terronex.dev</div>
        </div>
        <div className="data-row">
          <div className="data-label">License</div>
          <div className="data-value">Commercial</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// App
// ============================================================

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inspector');
  const [files, setFiles] = useState<AifBinFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AifBinFile | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [libraryPath, setLibraryPath] = useState<string>('');
  const [isDesktop, setIsDesktop] = useState(false);

  // Load library files on startup (Tauri only)
  useEffect(() => {
    const loadLibrary = async () => {
      if (!isTauri()) {
        console.log('Running in browser mode (no local library)');
        return;
      }
      
      setIsDesktop(true);
      
      try {
        // Get library path for display
        const path = await getLibraryFolder();
        setLibraryPath(path);
        console.log('Library folder:', path);
        
        // Load all files from library
        const libraryFiles = await listLibrary();
        console.log(`Found ${libraryFiles.length} files in library`);
        
        // Load each file's content
        const loadedFiles: AifBinFile[] = [];
        for (const libFile of libraryFiles) {
          try {
            const bytes = await readFromLibrary(libFile.name);
            const parsed = await parseAifBinV2(bytes);
            loadedFiles.push({
              path: libFile.name,
              name: libFile.name,
              size: libFile.size,
              rawBytes: bytes,
              ...parsed,
            });
          } catch (err) {
            console.error(`Failed to load ${libFile.name}:`, err);
          }
        }
        
        setFiles(loadedFiles);
        if (loadedFiles.length > 0) {
          setSelectedFile(loadedFiles[0]);
        }
      } catch (err) {
        console.error('Failed to load library:', err);
      }
    };
    
    loadLibrary();
  }, []);

  // Save file to library (Tauri only)
  const saveFileToLibrary = useCallback(async (name: string, data: Uint8Array): Promise<boolean> => {
    if (!isTauri()) {
      console.log('Browser mode: skipping library save');
      return false;
    }
    
    try {
      await saveToLibrary(name, data);
      console.log(`Saved to library: ${name}`);
      return true;
    } catch (err) {
      console.error(`Failed to save ${name} to library:`, err);
      return false;
    }
  }, []);

  // Delete file from library
  const deleteFileFromLibrary = useCallback(async (name: string): Promise<boolean> => {
    if (!isTauri()) return false;
    
    try {
      await deleteFromLibrary(name);
      setFiles(prev => prev.filter(f => f.name !== name));
      if (selectedFile?.name === name) {
        setSelectedFile(null);
      }
      return true;
    } catch (err) {
      console.error(`Failed to delete ${name}:`, err);
      return false;
    }
  }, [selectedFile]);
  
  // Load providers from localStorage
  const [providers, setProviders] = useState<ProviderConfig[]>(() => {
    const saved = loadSettings();
    return [
      { id: 'anthropic', name: 'Anthropic', description: 'Claude (best for documents)', apiKey: saved.anthropic || '', configured: !!saved.anthropic, icon: Icons.Cpu },
      { id: 'openai', name: 'OpenAI', description: 'GPT-4 (good all-around)', apiKey: saved.openai || '', configured: !!saved.openai, icon: Icons.Zap },
      { id: 'gemini', name: 'Google Gemini', description: 'Best for images', apiKey: saved.gemini || '', configured: !!saved.gemini, icon: Icons.Globe },
      { id: 'ollama', name: 'Ollama', description: 'Local models (free)', apiKey: saved.ollama || 'localhost:11434', configured: !!saved.ollama, icon: Icons.Database },
    ];
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now() + Math.random(); // Unique ID
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleFilesAdded = (newFiles: AifBinFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    if (newFiles.length > 0 && !selectedFile) {
      setSelectedFile(newFiles[0]);
    }
  };

  const handleUpdateProvider = (id: string, apiKey: string) => {
    setProviders(prev => prev.map(p => 
      p.id === id ? { ...p, apiKey, configured: !!apiKey } : p
    ));
    
    // Save to localStorage
    const settings = loadSettings();
    settings[id] = apiKey;
    saveSettings(settings);
  };

  // State for highlighted files
  const [highlightedFiles, setHighlightedFiles] = useState<Set<string>>(new Set());

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    setHighlightedFiles(new Set());
  }, []);

  // Highlight a file (bring to top, add glow) - persists until cleared
  const handleHighlightFile = useCallback((filename: string) => {
    // Find the file
    const file = files.find(f => f.name.toLowerCase().includes(filename.toLowerCase()));
    if (file) {
      // Add to highlighted set
      setHighlightedFiles(prev => new Set([...prev, file.name]));
      
      // Move file to top of list
      setFiles(prev => {
        const index = prev.findIndex(f => f.name === file.name);
        if (index > 0) {
          const newFiles = [...prev];
          const [removed] = newFiles.splice(index, 1);
          newFiles.unshift(removed);
          return newFiles;
        }
        return prev;
      });
    }
  }, [files]);

  // Create a new .aif-bin file from AI-generated content
  const handleCreateFileFromAI = useCallback(async (filename: string, content: string) => {
    // Ensure filename ends with .aif-bin
    const name = filename.endsWith('.aif-bin') ? filename : `${filename}.aif-bin`;
    
    // Create metadata
    const metadata = {
      version: '2.0.0',
      format: 'aif-bin',
      created: new Date().toISOString(),
      source: 'AI Generated',
      originalName: name,
      originalSize: content.length,
      mimeType: 'text/plain',
      convertedAt: new Date().toISOString(),
      provider: 'ai-assistant',
      extractionMethod: 'ai-generated',
      entities: {
        dates: (content.match(/\d{4}-\d{2}-\d{2}/g) || []).slice(0, 10),
      },
    };
    
    // Create chunks
    const chunks = [{
      label: 'AI Generated Content',
      type: 'text',
      content: content,
    }];
    
    // Encode to v2 binary
    const v2Binary = encodeAifBinV2({ metadata, rawContent: content, chunks });
    
    // Always save to library (desktop mode saves to folder, browser mode downloads)
    if (isDesktop) {
      await saveFileToLibrary(name, v2Binary);
    } else {
      // Browser mode: auto-download the file
      const blob = new Blob([v2Binary], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    // Parse and add to files list
    const parsed = await parseAifBinV2(v2Binary);
    const newFile: AifBinFile = {
      path: name,
      name: name,
      size: v2Binary.length,
      rawBytes: v2Binary,
      ...parsed,
    };
    
    // Add to files and select it
    setFiles(prev => [newFile, ...prev]);
    setSelectedFile(newFile);
    setActiveTab('inspector');
    
    // Highlight the new file (persists until cleared)
    setHighlightedFiles(prev => new Set([...prev, name]));
  }, [isDesktop, saveFileToLibrary]);

  // Rename a file in the library
  const handleRenameFile = useCallback(async (oldName: string, newName: string): Promise<boolean> => {
    // Ensure newName ends with .aif-bin
    const newFileName = newName.endsWith('.aif-bin') ? newName : `${newName}.aif-bin`;
    
    // Find the file
    const file = files.find(f => f.name.toLowerCase().includes(oldName.toLowerCase().replace('.aif-bin', '')));
    if (!file) {
      console.error(`File not found: ${oldName}`);
      return false;
    }
    
    // Rename in library (Tauri only)
    if (isDesktop) {
      try {
        const { renameInLibrary } = await import('./lib/library');
        await renameInLibrary(file.name, newFileName);
      } catch (err) {
        console.error(`Failed to rename ${file.name}:`, err);
        return false;
      }
    }
    
    // Update file in state
    setFiles(prev => prev.map(f => 
      f.name === file.name 
        ? { ...f, name: newFileName, path: newFileName }
        : f
    ));
    
    // Update selected file if it was renamed
    if (selectedFile?.name === file.name) {
      setSelectedFile(prev => prev ? { ...prev, name: newFileName, path: newFileName } : null);
    }
    
    // Highlight the renamed file
    setHighlightedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(file.name);
      newSet.add(newFileName);
      return newSet;
    });
    
    return true;
  }, [files, selectedFile, isDesktop]);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <TitleBar onOpenSettings={() => setActiveTab('settings')} />
        <Tabs active={activeTab} onChange={setActiveTab} />
        
        {/* Main layout with persistent sidebars */}
        <div className="main">
          {/* Left: Persistent Library Sidebar */}
          <LibrarySidebar
            files={files}
            selectedFile={selectedFile}
            onSelectFile={(file) => {
              setSelectedFile(file);
              setActiveTab('inspector'); // Auto-switch to inspector when file selected
            }}
            onFilesAdded={handleFilesAdded}
            onDeleteFile={deleteFileFromLibrary}
            isDesktop={isDesktop}
            libraryPath={libraryPath}
            highlightedFiles={highlightedFiles}
          />
          
          {/* Center: Tab Content */}
          {activeTab === 'inspector' && (
            <InspectorTab 
              selectedFile={selectedFile}
              onToast={showToast}
            />
          )}
          {activeTab === 'ingestor' && (
            <IngestorTab 
              providers={providers} 
              onToast={showToast}
              onFilesIngested={handleFilesAdded}
              saveToLibrary={saveFileToLibrary}
              isDesktop={isDesktop}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab 
              providers={providers} 
              onUpdateProvider={handleUpdateProvider}
              onToast={showToast}
            />
          )}
          
          {/* Right: AI Chat Sidebar */}
          <AIChatSidebar
            files={files}
            providers={providers}
            onHighlightFile={handleHighlightFile}
            onCreateFile={handleCreateFileFromAI}
            onRenameFile={handleRenameFile}
            onClearHighlights={clearHighlights}
            hasHighlights={highlightedFiles.size > 0}
            onToast={showToast}
          />
        </div>
        
        <StatusBar fileCount={files.length} message={statusMessage} providers={providers} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </>
  );
};

// ============================================================
// Mount
// ============================================================

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;
