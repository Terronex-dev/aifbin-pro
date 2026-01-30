# AIF-BIN Pro Documentation

## Quick Start

1. Install dependencies: `pip install -r requirements.txt`
2. Migrate files: `python3 cli/aifbin_pro.py migrate notes/ -o memories/`
3. Search: `python3 cli/aifbin_pro.py search "query" -d memories/`

## v2 Binary Format Specification

### File Structure

```
┌─────────────────────────────────────────┐
│ Header (64 bytes)                       │
├─────────────────────────────────────────┤
│ Magic: AIFBIN\x00\x01 (8 bytes)         │
│ Version: 2 (4 bytes, little-endian)     │
│ Padding (4 bytes)                       │
│ Metadata offset (8 bytes)               │
│ Original raw offset (8 bytes)           │
│ Chunks offset (8 bytes)                 │
│ Versions offset (8 bytes)               │
│ Footer offset (8 bytes)                 │
│ Total size (8 bytes)                    │
├─────────────────────────────────────────┤
│ Metadata Section                        │
│ - Length (8 bytes)                      │
│ - MessagePack encoded metadata          │
├─────────────────────────────────────────┤
│ Original Raw Section (optional)         │
│ - Length (8 bytes)                      │
│ - Raw source content                    │
├─────────────────────────────────────────┤
│ Chunks Section                          │
│ - Count (4 bytes)                       │
│ - For each chunk:                       │
│   - Type (4 bytes)                      │
│   - Data length (8 bytes)               │
│   - Metadata length (8 bytes)           │
│   - Metadata (MessagePack)              │
│   - Data (bytes)                        │
├─────────────────────────────────────────┤
│ Footer                                  │
│ - Chunk index                           │
│ - Checksum                              │
└─────────────────────────────────────────┘
```

### Chunk Types

| Type | Value | Description |
|------|-------|-------------|
| TEXT | 1 | Plain text content |
| TABLE_JSON | 2 | JSON table data |
| IMAGE | 3 | Image data |
| AUDIO | 4 | Audio data |
| VIDEO | 5 | Video data |
| CODE | 6 | Source code |

### Embedding Storage

Embeddings are stored in chunk metadata as a float array:
```python
{
    "chunk_id": 0,
    "embedding": [0.123, -0.456, ...]  # 384 or 768 floats
}
```

## CLI Reference

### migrate

Convert markdown files to AIF-BIN format.

```bash
aifbin_pro.py migrate <source> -o <output_dir> [options]

Options:
  -m, --model     Embedding model (default: minilm)
  -r, --recursive Process subdirectories
  -p, --parallel  Enable parallel processing
  -w, --workers   Number of workers (default: 4)
```

### search

Semantic search across AIF-BIN files.

```bash
aifbin_pro.py search <query> -d <directory> [options]

Options:
  -k              Number of results (default: 5)
  -m, --model     Embedding model (must match migration model)
  --after         Filter by date (YYYY-MM-DD)
```

### watch

Auto-sync files when they change.

```bash
aifbin_pro.py watch <source> -o <output_dir> [options]

Options:
  -m, --model     Embedding model
  -i, --interval  Check interval in seconds (default: 5)
```

### export

Export to other formats.

```bash
aifbin_pro.py export <file> -o <output> -f <format>

Formats: json, csv, markdown, html
```

## Integration Examples

### Python

```python
from cli.aifbin_spec_v2 import read_aifbin_v2, write_aifbin_v2, AIFBINFile

# Read
aifbin = read_aifbin_v2("memory.aif-bin")
print(aifbin.metadata)
for chunk in aifbin.chunks:
    print(chunk.data.decode())

# Write
aifbin = AIFBINFile(
    metadata={"source": "example"},
    chunks=[...],
    original_raw=b"original content"
)
write_aifbin_v2(aifbin, "output.aif-bin")
```

### JavaScript (Inspector)

```javascript
// See inspector/services/parser.ts for full implementation
import { parseAIFBIN } from './services/parser';

const file = await fetch('memory.aif-bin');
const buffer = await file.arrayBuffer();
const parsed = parseAIFBIN(buffer);
console.log(parsed.metadata);
```

## Troubleshooting

### "Model not found"

The embedding model downloads on first use. Ensure internet connection.

### "msgpack not installed"

```bash
pip install msgpack
```

### "File too large"

Increase chunk size or use a smaller embedding model (384-dim vs 768-dim).

## Support

Email: support@terronex.dev
