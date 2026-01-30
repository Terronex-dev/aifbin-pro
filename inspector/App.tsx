
import React, { useState, useCallback } from 'react';
import { AIFBINParser } from './services/parser';
import { AIFBINFile, ChunkType } from './types';
import HexViewer from './components/HexViewer';
import PythonExporter from './components/PythonExporter';

const App: React.FC = () => {
  const [fileData, setFileData] = useState<AIFBINFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'metadata' | 'chunks' | 'hex' | 'tool'>('overview');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
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
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-emerald-400">File Integrity</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Magic Signature</span>
                  <span className="font-mono text-emerald-300">AIFBIN\x00\x01 (Valid)</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Spec Version</span>
                  <span className="font-mono">{fileData.header.version}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                  <span className="text-slate-400">Total File Size</span>
                  <span className="font-mono">{fileData.header.totalSize.toString()} bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Footer Checksum</span>
                  <span className="font-mono text-blue-400">0x{fileData.footer.checksum.toString(16).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h3 className="text-lg font-bold mb-4 text-emerald-400">Section Offsets</h3>
              <div className="space-y-2 font-mono text-xs">
                {/* Cast filtered entries to [string, bigint][] to allow bigint operations on 'val' */}
                {(Object.entries(fileData.header).filter(([k]) => k.includes('Offset')) as [string, bigint][]).map(([key, val]) => (
                  <div key={key} className="flex justify-between p-2 bg-slate-950 rounded">
                    <span className="text-slate-500 uppercase">{key.replace('Offset', '')}</span>
                    <span className={val === 0xFFFFFFFFFFFFFFFFn ? "text-red-500" : "text-slate-300"}>
                      0x{val.toString(16).padStart(8, '0').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-full bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-emerald-400">Original Raw Source</h3>
              {fileData.originalRaw ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 font-medium">Binary Payload Detected</p>
                    <p className="text-slate-500 text-sm">{fileData.originalRaw.length} bytes of raw source data.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const blob = new Blob([fileData.originalRaw!]);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `extracted_raw_source.bin`;
                      a.click();
                    }}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition-colors text-sm"
                  >
                    Extract Payload
                  </button>
                </div>
              ) : (
                <p className="text-slate-500 italic">No original raw section found in this archive.</p>
              )}
            </div>
          </div>
        );
      case 'metadata':
        return (
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-xl font-bold mb-4">MessagePack Metadata</h3>
            <pre className="bg-slate-950 p-6 rounded-lg font-mono text-sm overflow-auto text-emerald-300 custom-scrollbar border border-slate-900">
              {JSON.stringify(fileData.metadata, null, 2)}
            </pre>
          </div>
        );
      case 'chunks':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold px-2">Knowledge Chunks ({fileData.chunks.length})</h3>
            {fileData.chunks.map((chunk) => (
              <div key={chunk.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between bg-slate-700/50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-900 text-emerald-400 text-xs font-bold rounded border border-emerald-900/50">
                      ID {chunk.id}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      {ChunkType[chunk.type] || 'UNKNOWN'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Offset: 0x{chunk.byteRange[0].toString(16).toUpperCase()}
                  </span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Metadata</h4>
                    <pre className="text-xs bg-slate-950 p-2 rounded text-slate-300 border border-slate-900">
                      {JSON.stringify(chunk.metadata, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Data Fragment ({chunk.dataLength.toString()} bytes)</h4>
                    <div className="font-mono text-[10px] bg-slate-950 p-2 rounded text-emerald-500/80 border border-slate-900 break-all h-24 overflow-y-auto custom-scrollbar">
                      {new TextDecoder().decode(chunk.data.slice(0, 200)) + (chunk.data.length > 200 ? "..." : "")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'hex':
        return (
          <div className="space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold mb-4">Binary Section Analysis</h3>
              <p className="text-slate-400 text-sm mb-4">Direct hex dump of the first 4KB of the loaded AIF-BIN file.</p>
              <HexViewer data={fileData.binary} maxBytes={4096} />
            </div>
          </div>
        );
      case 'tool':
        return <PythonExporter />;
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <span className="bg-emerald-600 p-1.5 rounded-lg shadow-lg shadow-emerald-900/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </span>
            AIF-BIN Forensic Suite
          </h1>
          <p className="text-slate-400 mt-1">Deep analysis & extraction tool for AI-Interchange Binary format</p>
        </div>
        <div className="flex gap-2">
          {fileData && (
            <button 
              onClick={() => setFileData(null)}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
            >
              Close Archive
            </button>
          )}
          <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Open .aif-bin
            <input type="file" className="hidden" accept=".aif-bin,.bin" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      {!fileData ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`flex-1 mt-10 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl transition-all duration-300 ${
            isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800/50'
          }`}
        >
          <div className="p-8 bg-slate-900 rounded-full mb-6 border border-slate-700 shadow-xl">
            <svg className={`w-16 h-16 ${isDragging ? 'text-emerald-400 scale-110' : 'text-slate-600'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-200 mb-2">Drop your .aif-bin here</h2>
          <p className="text-slate-500 max-w-xs text-center">Analyze structure, inspect chunks, and extract original raw content instantly.</p>
          
          {error && (
            <div className="mt-8 px-6 py-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm animate-pulse">
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <nav className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 w-fit">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'metadata', label: 'Metadata' },
              { id: 'chunks', label: 'Chunks' },
              { id: 'hex', label: 'Byte Inspector' },
              { id: 'tool', label: 'CLI Tool' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <main className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </main>
        </>
      )}

      <footer className="text-center text-slate-600 text-[10px] uppercase tracking-widest py-8 border-t border-slate-800 mt-auto">
        AIF-BIN Forensic Specification v1.0.4 • SECURE ENCLAVE ACTIVE
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default App;
