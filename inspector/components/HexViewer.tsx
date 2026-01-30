
import React from 'react';

interface HexViewerProps {
  data: Uint8Array;
  maxBytes?: number;
}

const HexViewer: React.FC<HexViewerProps> = ({ data, maxBytes = 256 }) => {
  const displayData = data.slice(0, maxBytes);
  const rows = [];
  
  for (let i = 0; i < displayData.length; i += 16) {
    const chunk = displayData.slice(i, i + 16);
    // Explicitly type 'b' as number to allow toString(radix) and numeric comparisons
    const hex = Array.from(chunk).map((b: number) => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(chunk).map((b: number) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
    
    rows.push(
      <div key={i} className="flex font-mono text-xs gap-4 hover:bg-slate-800 transition-colors p-1">
        <span className="text-slate-500 w-16 text-right">0x{i.toString(16).padStart(4, '0')}</span>
        <span className="text-slate-300 flex-1">{hex.padEnd(47, ' ')}</span>
        <span className="text-emerald-400 w-24 overflow-hidden">{ascii}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 shadow-inner max-h-96 overflow-y-auto custom-scrollbar">
      {rows}
      {data.length > maxBytes && (
        <div className="text-center text-slate-500 text-xs mt-2 italic">
          --- {data.length - maxBytes} more bytes hidden ---
        </div>
      )}
    </div>
  );
};

export default HexViewer;
