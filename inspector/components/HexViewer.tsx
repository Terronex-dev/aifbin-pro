import React, { useState } from 'react';

interface HexViewerProps {
  data: Uint8Array;
}

const HexViewer: React.FC<HexViewerProps> = ({ data }) => {
  const [bytesPerRow] = useState(16);
  const [maxRows] = useState(256);

  const displayData = data.slice(0, maxRows * bytesPerRow);
  const rows: number[][] = [];
  
  for (let i = 0; i < displayData.length; i += bytesPerRow) {
    rows.push(Array.from(displayData.slice(i, i + bytesPerRow)));
  }

  const isHeaderByte = (offset: number) => offset < 64;
  const isMagicByte = (offset: number) => offset < 8;

  return (
    <div className="hex-viewer">
      <div className="hex-header">
        <div className="section-title">Byte Inspector</div>
        <div className="hex-info">
          Showing {displayData.length.toLocaleString()} of {data.length.toLocaleString()} bytes
        </div>
      </div>

      <div className="hex-legend">
        <span className="legend-item">
          <span className="legend-dot magic"></span>
          Magic Signature
        </span>
        <span className="legend-item">
          <span className="legend-dot header"></span>
          Header
        </span>
        <span className="legend-item">
          <span className="legend-dot data"></span>
          Data
        </span>
      </div>

      <div className="hex-content">
        <div className="hex-table">
          {/* Column Headers */}
          <div className="hex-row header-row">
            <span className="hex-offset">OFFSET</span>
            <div className="hex-bytes">
              {Array.from({ length: bytesPerRow }).map((_, i) => (
                <span key={i} className="hex-col-header">
                  {i.toString(16).toUpperCase().padStart(2, '0')}
                </span>
              ))}
            </div>
            <span className="hex-ascii-header">ASCII</span>
          </div>

          {/* Data Rows */}
          {rows.map((row, rowIndex) => {
            const offset = rowIndex * bytesPerRow;
            return (
              <div key={rowIndex} className="hex-row">
                <span className="hex-offset">
                  {offset.toString(16).toUpperCase().padStart(8, '0')}
                </span>
                <div className="hex-bytes">
                  {row.map((byte, byteIndex) => {
                    const absoluteOffset = offset + byteIndex;
                    let className = 'hex-byte';
                    if (isMagicByte(absoluteOffset)) className += ' magic';
                    else if (isHeaderByte(absoluteOffset)) className += ' header';
                    
                    return (
                      <span key={byteIndex} className={className}>
                        {byte.toString(16).toUpperCase().padStart(2, '0')}
                      </span>
                    );
                  })}
                  {/* Fill empty cells */}
                  {row.length < bytesPerRow && Array.from({ length: bytesPerRow - row.length }).map((_, i) => (
                    <span key={`empty-${i}`} className="hex-byte empty">  </span>
                  ))}
                </div>
                <span className="hex-ascii">
                  {row.map(byte => {
                    const char = byte >= 32 && byte < 127 ? String.fromCharCode(byte) : '.';
                    return char;
                  }).join('')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .hex-viewer {
          background: var(--bg-glass, rgba(15, 23, 42, 0.8));
          backdrop-filter: blur(12px);
          border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
          border-radius: 12px;
          overflow: hidden;
        }

        .hex-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
        }

        .section-title {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-tertiary, #52525b);
          margin: 0;
        }

        .hex-info {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-tertiary, #52525b);
        }

        .hex-legend {
          display: flex;
          gap: 24px;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
          background: var(--bg-secondary, #0a0f1d);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text-secondary, #a1a1aa);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 2px;
        }

        .legend-dot.magic {
          background: var(--accent-emerald, #10b981);
        }

        .legend-dot.header {
          background: var(--accent-cyan, #22d3ee);
        }

        .legend-dot.data {
          background: var(--text-tertiary, #52525b);
        }

        .hex-content {
          overflow-x: auto;
          padding: 16px;
        }

        .hex-table {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          min-width: max-content;
        }

        .hex-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 4px 0;
        }

        .hex-row.header-row {
          border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
          padding-bottom: 12px;
          margin-bottom: 8px;
        }

        .hex-offset {
          color: var(--text-tertiary, #52525b);
          min-width: 72px;
        }

        .hex-bytes {
          display: flex;
          gap: 8px;
        }

        .hex-col-header {
          width: 20px;
          text-align: center;
          color: var(--text-tertiary, #52525b);
          font-size: 10px;
        }

        .hex-byte {
          width: 20px;
          text-align: center;
          color: var(--text-secondary, #a1a1aa);
          transition: color 0.1s ease;
        }

        .hex-byte.magic {
          color: var(--accent-emerald, #10b981);
          font-weight: 500;
        }

        .hex-byte.header {
          color: var(--accent-cyan, #22d3ee);
        }

        .hex-byte.empty {
          opacity: 0.3;
        }

        .hex-ascii,
        .hex-ascii-header {
          color: var(--text-tertiary, #52525b);
          min-width: 140px;
          letter-spacing: 0.5px;
        }

        .hex-row:hover .hex-byte:not(.empty) {
          color: var(--text-primary, #e4e4e7);
        }

        .hex-row:hover .hex-ascii {
          color: var(--text-secondary, #a1a1aa);
        }
      `}</style>
    </div>
  );
};

export default HexViewer;
