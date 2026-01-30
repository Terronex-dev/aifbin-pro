import React, { useState, useCallback } from 'react';
import { AIFBINParser } from './services/parser';
import { AIFBINFile, ChunkType } from './types';
import HexViewer from './components/HexViewer';
import PythonExporter from './components/PythonExporter';

/**
 * AIF-BIN Inspector
 * Terronex.dev Design System
 */

const App: React.FC = () => {
  const [fileData, setFileData] = useState<AIFBINFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'metadata' | 'chunks' | 'hex' | 'tool'>('overview');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const parser = new AIFBINParser(new Uint8Array(arrayBuffer));
      const parsed = parser.parse();
      setFileData(parsed);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse AIF-BIN file");
      setFileData(null);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const renderContent = () => {
    if (!fileData) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Integrity Panel */}
            <div className="panel">
              <div className="section-title">File Integrity</div>
              <div className="space-y-0">
                <div className="data-row">
                  <span className="data-label">Magic Signature</span>
                  <span className="data-value valid">AIFBIN\x00\x01</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Format Version</span>
                  <span className="data-value">{fileData.header.version}</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Total Size</span>
                  <span className="data-value">{fileData.header.totalSize.toLocaleString()} bytes</span>
                </div>
                <div className="data-row">
                  <span className="data-label">Checksum</span>
                  <span className="data-value">0x{fileData.footer.checksum.toString(16).toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Section Offsets Panel */}
            <div className="panel">
              <div className="section-title">Section Offsets</div>
              <div className="space-y-2">
                {(Object.entries(fileData.header).filter(([k]) => k.includes('Offset')) as [string, bigint][]).map(([key, val]) => (
                  <div key={key} className="offset-row">
                    <span className="offset-label">{key.replace('Offset', '')}</span>
                    <span className={`offset-value ${val === 0xFFFFFFFFFFFFFFFFn ? 'absent' : ''}`}>
                      0x{val.toString(16).padStart(8, '0').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Original Raw Panel */}
            <div className="panel col-span-full">
              <div className="section-title">Original Raw Source</div>
              {fileData.originalRaw ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary font-medium">Binary Payload Detected</p>
                    <p className="text-tertiary text-sm">{fileData.originalRaw.length.toLocaleString()} bytes of raw source data</p>
                  </div>
                  <button 
                    onClick={() => {
                      const blob = new Blob([fileData.originalRaw!]);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `extracted_raw_source.bin`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="btn btn-primary"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Extract Payload
                  </button>
                </div>
              ) : (
                <p className="text-tertiary">No raw source embedded in this file.</p>
              )}
            </div>
          </div>
        );

      case 'metadata':
        return (
          <div className="panel">
            <div className="section-title">Metadata</div>
            <pre className="code-block">{JSON.stringify(fileData.metadata, null, 2)}</pre>
          </div>
        );

      case 'chunks':
        return (
          <div className="space-y-4">
            <div className="section-title">Content Chunks ({fileData.chunks.length})</div>
            {fileData.chunks.map((chunk, i) => (
              <div key={i} className="panel chunk-card">
                <div className="chunk-header">
                  <div className="chunk-badge">
                    <span className="status-dot"></span>
                    Chunk {i}
                  </div>
                  <span className="chunk-type">{ChunkType[chunk.type] || `Type ${chunk.type}`}</span>
                </div>
                
                <div className="chunk-meta">
                  <div className="data-row">
                    <span className="data-label">Size</span>
                    <span className="data-value">{chunk.data.length.toLocaleString()} bytes</span>
                  </div>
                  {chunk.embedding && (
                    <div className="data-row">
                      <span className="data-label">Embedding</span>
                      <span className="data-value">{chunk.embedding.length} dimensions</span>
                    </div>
                  )}
                </div>

                <div className="chunk-preview">
                  <div className="section-title">Data Preview</div>
                  <pre className="code-block text-sm">
                    {new TextDecoder().decode(chunk.data.slice(0, 500))}
                    {chunk.data.length > 500 ? '\n...' : ''}
                  </pre>
                </div>

                {chunk.embedding && (
                  <div className="embedding-viz">
                    <div className="section-title">Embedding Visualization</div>
                    <div className="embedding-bars">
                      {chunk.embedding.slice(0, 64).map((val, j) => (
                        <div 
                          key={j}
                          className="embedding-bar"
                          style={{
                            backgroundColor: val > 0 ? '#10b981' : '#ef4444',
                            opacity: Math.max(0.2, Math.min(1, Math.abs(val)))
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'hex':
        return <HexViewer data={fileData.rawBytes} />;

      case 'tool':
        return <PythonExporter />;

      default:
        return null;
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-mark">A</div>
          <div className="logo-text">
            AIF-BIN <span>Inspector</span>
          </div>
        </div>

        <div className="header-actions">
          {fileData && (
            <div className="file-badge">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              {fileData.header.totalSize.toLocaleString()} bytes
            </div>
          )}
          
          <label className="btn btn-primary">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Open .aif-bin
            <input type="file" accept=".aif-bin" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {!fileData ? (
          <div 
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <div className="dropzone-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <h2 className="dropzone-title">Drop your .aif-bin file here</h2>
            <p className="dropzone-subtitle">
              Analyze structure, inspect chunks, and extract original content
            </p>
            {error && <p className="error-message">{error}</p>}
          </div>
        ) : (
          <div className="content">
            {/* Tabs */}
            <div className="tabs">
              {(['overview', 'metadata', 'chunks', 'hex', 'tool'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {renderContent()}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <span>AIF-BIN Inspector v1.0</span>
        <span>© 2026 Terronex.dev</span>
      </footer>

      <style>{`
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
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          line-height: 1.5;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
          background: var(--bg-glass);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-mark {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald));
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 14px;
          color: var(--bg-primary);
        }

        .logo-text {
          font-weight: 600;
          font-size: 15px;
        }

        .logo-text span {
          color: var(--text-tertiary);
          font-weight: 400;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .file-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-secondary);
        }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .btn-primary {
          background: var(--accent-emerald);
          color: white;
        }

        .btn-primary:hover {
          background: #0ea271;
        }

        .btn-secondary {
          background: var(--bg-panel);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
        }

        .hidden {
          display: none;
        }

        /* Main */
        .main {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }

        /* Dropzone */
        .dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          border: 2px dashed var(--border-default);
          border-radius: 16px;
          background: var(--bg-secondary);
          transition: all 0.2s ease;
        }

        .dropzone.dragging {
          border-color: var(--accent-cyan);
          background: rgba(34, 211, 238, 0.05);
        }

        .dropzone-icon {
          color: var(--text-tertiary);
          margin-bottom: 24px;
        }

        .dropzone-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .dropzone-subtitle {
          color: var(--text-secondary);
          font-size: 14px;
        }

        .error-message {
          margin-top: 16px;
          color: var(--accent-red);
          font-size: 13px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-panel);
          border-radius: 10px;
          width: fit-content;
          margin-bottom: 24px;
        }

        .tab {
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab:hover {
          color: var(--text-primary);
        }

        .tab.active {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        /* Panels */
        .panel {
          background: var(--bg-glass);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 20px;
        }

        .section-title {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-tertiary);
          margin-bottom: 16px;
        }

        /* Data Rows */
        .data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-subtle);
        }

        .data-row:last-child {
          border-bottom: none;
        }

        .data-label {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .data-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: var(--accent-cyan);
        }

        .data-value.valid {
          color: var(--accent-emerald);
        }

        /* Offset Rows */
        .offset-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border-radius: 6px;
        }

        .offset-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
        }

        .offset-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-primary);
        }

        .offset-value.absent {
          color: var(--accent-red);
        }

        /* Code Block */
        .code-block {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          padding: 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          line-height: 1.6;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Chunk Cards */
        .chunk-card {
          margin-bottom: 16px;
        }

        .chunk-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .chunk-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: var(--accent-emerald);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-emerald);
        }

        .chunk-type {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          padding: 4px 10px;
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.2);
          border-radius: 4px;
          color: var(--accent-cyan);
        }

        .chunk-meta {
          margin-bottom: 16px;
        }

        .chunk-preview {
          margin-bottom: 16px;
        }

        /* Embedding Visualization */
        .embedding-viz {
          margin-top: 16px;
        }

        .embedding-bars {
          display: flex;
          gap: 2px;
          height: 24px;
        }

        .embedding-bar {
          flex: 1;
          border-radius: 2px;
          transition: opacity 0.15s ease;
        }

        /* Utilities */
        .text-primary { color: var(--text-primary); }
        .text-secondary { color: var(--text-secondary); }
        .text-tertiary { color: var(--text-tertiary); }
        .text-sm { font-size: 12px; }
        .font-medium { font-weight: 500; }
        .col-span-full { grid-column: 1 / -1; }
        .space-y-4 > * + * { margin-top: 16px; }
        .space-y-2 > * + * { margin-top: 8px; }
        .space-y-0 > * + * { margin-top: 0; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
        .gap-6 { gap: 24px; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }

        @media (min-width: 768px) {
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        }

        /* Footer */
        .footer {
          display: flex;
          justify-content: space-between;
          padding: 12px 24px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-subtle);
          font-size: 11px;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
};

export default App;
