# AIF-BIN Pro

Professional AI memory management toolkit with semantic search, batch processing, and visual inspection.

## What's Included

```
aifbin-pro/
├── cli/                    # Command-line tools
│   ├── aifbin_pro.py       # Main CLI
│   └── aifbin_spec_v2.py   # v2 binary format library
├── inspector/              # Web-based file analyzer
├── legal/                  # Terms, Privacy, License
└── docs/                   # Documentation
```

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Convert markdown to AIF-BIN
python3 cli/aifbin_pro.py migrate notes/ -o memories/ --parallel

# Semantic search
python3 cli/aifbin_pro.py search "query" -d memories/

# File info
python3 cli/aifbin_pro.py info file.aif-bin
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `migrate` | Convert files to AIF-BIN (v2 binary) |
| `search` | Semantic search across memories |
| `info` | Show file metadata |
| `extract` | Recover original content |
| `watch` | Auto-sync on file changes |
| `diff` | Compare two files |
| `export` | Export to JSON, CSV, HTML, Markdown |
| `models` | List available embedding models |

## Embedding Models

| Model | Dimensions | Description |
|-------|------------|-------------|
| minilm | 384 | Fast, good quality (default) |
| mpnet | 768 | Higher quality, slower |
| bge-small | 384 | Optimized for retrieval |
| bge-base | 768 | Best quality retrieval |
| e5-small | 384 | Microsoft E5, fast |

## Web Inspector

Visual tool for analyzing AIF-BIN files.

```bash
cd inspector
npm install
npm run dev
```

Features:
- Parse and validate v2 binary format
- View metadata and content chunks
- Hex byte inspector
- Extract embedded content
- Embedding visualization

## v2 Binary Format

Compact binary format with MessagePack encoding:
- ~50% smaller than JSON
- Fast parsing
- Embedded checksums
- Original content preservation

## License

Commercial License. See `legal/LICENSE_EULA.md` for terms.

## Links

- Website: [aifbin.com](https://aifbin.com)
- Documentation: [aifbin.com/docs](https://aifbin.com/docs)
- Support: support@terronex.dev

---

AIF-BIN™ © 2026 Terronex.dev. All rights reserved.
