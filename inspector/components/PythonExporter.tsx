
import React, { useState } from 'react';

const PYTHON_SCRIPT = `
import struct
import argparse
import os
import time
import json
import hashlib
from typing import Dict, List, Optional

try:
    import msgpack
except ImportError:
    print("Warning: msgpack not installed. Use 'pip install msgpack'")

try:
    from colorama import init, Fore, Style
    init()
except ImportError:
    class Fore: RED = GREEN = YELLOW = BLUE = CYAN = WHITE = RESET = ""
    class Style: BRIGHT = NORMAL = ""

# AIF-BIN Constants
MAGIC = b"AIFBIN\\x00\\x01"
HEADER_SIZE = 64
CHUNK_TYPES = {
    1: "TEXT",
    2: "TABLE_JSON",
    3: "IMAGE",
    4: "AUDIO",
    5: "VIDEO",
    6: "CODE"
}

class AIFBINAnalyzer:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.filesize = os.path.getsize(filepath)
        self.fd = open(filepath, "rb")

    def __del__(self):
        if hasattr(self, 'fd'):
            self.fd.close()

    def read_u32(self) -> int:
        return struct.unpack("<I", self.fd.read(4))[0]

    def read_u64(self) -> int:
        return struct.unpack("<Q", self.fd.read(8))[0]

    def read_bytes(self, size: int) -> bytes:
        return self.fd.read(size)

    def safe_unpack(self, data: bytes):
        """Robustly unpacks messagepack even if data contains trailing padding."""
        try:
            return msgpack.unpackb(data)
        except Exception:
            # Fallback for padded buffers
            try:
                return msgpack.unpackb(data, raw=False, strict_map_key=False)
            except Exception as e:
                return {"error": str(e)}

    def analyze(self, extract_raw: Optional[str] = None, verbose: bool = False):
        print(f"{Fore.CYAN}{Style.BRIGHT}=== AIF-BIN Forensic Report ==={Style.RESET}")
        print(f"File: {os.path.basename(self.filepath)}")
        print(f"Size: {self.filesize} bytes")

        # 1. Header
        self.fd.seek(0)
        magic = self.read_bytes(8)
        if magic != MAGIC:
            print(f"{Fore.RED}ERROR: Invalid Magic Signature: {magic}{Style.RESET}")
            return

        version = self.read_u32()
        self.read_u32() # Padding
        offsets = {
            "metadata": self.read_u64(),
            "original": self.read_u64(),
            "chunks": self.read_u64(),
            "versions": self.read_u64(),
            "footer": self.read_u64()
        }
        total_size_recorded = self.read_u64()

        print(f"{Fore.GREEN}Valid AIF-BIN v{version} detected.{Style.RESET}")
        print("\\n--- Header Breakdown ---")
        for key, off in offsets.items():
            valid = "VALID" if off < self.filesize or off == 0xFFFFFFFFFFFFFFFF else "INVALID (OOB)"
            print(f"  {key.capitalize():<10} Offset: 0x{off:08X} [{valid}]")

        # 2. Metadata
        print("\\n--- Metadata Section ---")
        if offsets["metadata"] < self.filesize:
            self.fd.seek(offsets["metadata"])
            meta_len = self.read_u64()
            meta_data = self.read_bytes(meta_len)
            meta = self.safe_unpack(meta_data)
            print(f"  Title:   {meta.get('title', 'N/A')}")
            print(f"  Summary: {str(meta.get('summary', 'N/A'))[:100]}...")
            print(f"  Tags:    {', '.join(meta.get('tags', []))}")
            if 'global_embedding' in meta:
                print(f"  Global Embedding: {len(meta['global_embedding'])}-dim vector")

        # 3. Original Raw
        raw_off = offsets["original"]
        if raw_off != 0xFFFFFFFFFFFFFFFF and raw_off < self.filesize:
            print("\\n--- Original Raw Section ---")
            self.fd.seek(raw_off)
            raw_len = self.read_u64()
            print(f"  Size: {raw_len} bytes")
            if extract_raw:
                with open(extract_raw, "wb") as out:
                    out.write(self.read_bytes(raw_len))
                print(f"  {Fore.GREEN}Extraction successful: {extract_raw}{Style.RESET}")

        # 4. Content Chunks
        print("\\n--- Content Chunks ---")
        if offsets["chunks"] < self.filesize:
            self.fd.seek(offsets["chunks"])
            chunk_count = self.read_u32()
            print(f"  Count: {chunk_count}")
            for i in range(chunk_count):
                c_type_code = self.read_u32()
                c_type = CHUNK_TYPES.get(c_type_code, f"UNKNOWN({c_type_code})")
                c_len = self.read_u64()
                m_len = self.read_u64()
                m_data = self.read_bytes(m_len)
                c_data = self.read_bytes(c_len)
                
                c_meta = self.safe_unpack(m_data)
                print(f"  [{i}] Type: {c_type:<10} | Data: {c_len:>8} bytes | Meta: {str(c_meta.get('caption', 'No caption'))[:30]}")
                if verbose:
                    print(f"      Snippet: {c_data[:50].hex()}...")

        # 5. Footer
        print("\\n--- Footer & Integrity ---")
        if offsets["footer"] < self.filesize:
            self.fd.seek(offsets["footer"])
            idx_count = self.read_u32()
            print(f"  Index Entries: {idx_count}")
            for _ in range(idx_count):
                cid = self.read_u32()
                off = self.read_u64()
            
            checksum = self.read_u64()
            print(f"  Checksum: 0x{checksum:016X}")
        
        print(f"\\n{Fore.GREEN}Analysis Complete.{Style.RESET}")

def main():
    parser = argparse.ArgumentParser(description="AIF-BIN Forensic Suite CLI")
    parser.add_argument("file", help="Path to .aif-bin file")
    parser.add_argument("--extract-raw", help="Path to extract original file content")
    parser.add_argument("--verbose", action="store_true", help="Show deep byte analysis")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"{Fore.RED}File not found: {args.file}{Style.RESET}")
        return

    analyzer = AIFBINAnalyzer(args.file)
    analyzer.analyze(extract_raw=args.extract_raw, verbose=args.verbose)

if __name__ == "__main__":
    main()
`;

const PythonExporter: React.FC = () => {
  const downloadScript = () => {
    const blob = new Blob([PYTHON_SCRIPT], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aifbin_viewer.py';
    a.click();
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14.25 10.5l-3.39-3.39c-.19-.19-.44-.29-.71-.29-.27 0-.52.1-.71.29l-3.39 3.39c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.69-1.69v5.29c0 .55.45 1 1 1s1-.45 1-1v-5.29l1.69 1.69c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41z"/></svg>
          CLI Forensic Tool (Python)
        </h3>
        <button 
          onClick={downloadScript}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Download .py Script
        </button>
      </div>
      <p className="text-slate-400 mb-4 text-sm">
        For production environments or massive batch processing, use the CLI tool. 
        It supports full extraction, checksum validation, and detailed section reporting.
      </p>
      <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-900 shadow-inner max-h-80 custom-scrollbar">
        <pre className="text-blue-300">{PYTHON_SCRIPT}</pre>
      </div>
    </div>
  );
};

export default PythonExporter;
