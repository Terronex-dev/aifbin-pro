# AIF-BIN Pro

**AI-Native File Format** — Professional toolkit for semantic search, batch processing, and visual inspection.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)

---

## What is AIF-BIN?

AIF-BIN is a binary file format that makes any document AI-native. A single `.aif-bin` file contains:

- **Original document** — The source file preserved
- **Extracted content** — Text, tables, code blocks
- **Embeddings** — Vector representations for semantic search
- **Metadata** — Title, tags, timestamps, checksums

One file. Fully portable. Works offline.

---

## What's Included

```
aifbin-pro/
├── cli/                    # Command-line tools
│   ├── aifbin_pro.py       # Main CLI with all commands
│   └── aifbin_spec_v2.py   # v2 binary format library
├── studio/                 # Desktop app (Tauri)
├── inspector/              # Web-based file analyzer (React)
├── releases/               # Pre-built binaries
├── legal/                  # Terms, Privacy Policy
└── docs/                   # Documentation
```

---

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

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `migrate` | Convert files to AIF-BIN (v2 binary format) |
| `search` | Semantic search across memories |
| `info` | Show file metadata and structure |
| `extract` | Recover original content |
| `watch` | Auto-sync on file changes |
| `diff` | Compare two AIF-BIN files |
| `export` | Export to JSON, CSV, HTML, Markdown |
| `models` | List available embedding models |

---

## Embedding Models

| Model | Dimensions | Description |
|-------|------------|-------------|
| minilm | 384 | Fast, good quality (default) |
| mpnet | 768 | Higher quality, slower |
| bge-small | 384 | Optimized for retrieval |
| bge-base | 768 | Best quality retrieval |
| e5-small | 384 | Microsoft E5, fast |

---

## Desktop App (Studio)

Native desktop app for inspecting and managing AIF-BIN files. Built with Tauri for maximum performance and minimal size.

**Downloads:**
- [Linux x64 Binary](releases/v1.0.0/aifbin-studio) (11MB)
- [Debian/Ubuntu .deb](releases/v1.0.0/AIF-BIN%20Studio_1.0.0_amd64.deb) (3.4MB)
- [Fedora/RHEL .rpm](releases/v1.0.0/AIF-BIN%20Studio-1.0.0-1.x86_64.rpm) (3.4MB)

**Features:**
- Full v2 binary format parser
- Hex byte inspector
- Content chunk viewer
- File library management
- Dark theme (Terronex design system)

**Build from source:**
```bash
cd studio
npm install
cargo tauri build
```

---

## Web Inspector

Visual tool for analyzing AIF-BIN files in the browser.

```bash
cd inspector
npm install
npm run dev
```

**Features:**
- Parse and validate v2 binary format
- View metadata and content chunks
- Hex byte inspector
- Extract embedded content
- Embedding visualization

---

## v2 Binary Format

Compact binary format with MessagePack encoding:

- ~50% smaller than JSON-based formats
- Fast parsing with fixed-offset headers
- Embedded CRC64 checksums
- Original content preservation
- Streaming support for large files

**Format Structure:**
```
[Header: 64 bytes]
  Magic: "AIFBIN\x00\x01"
  Version, Offsets, Size

[Metadata Section]
  MessagePack blob

[Original Raw Section] (optional)
  Preserved source file

[Content Chunks]
  Typed chunks: TEXT, TABLE, IMAGE, AUDIO, VIDEO, CODE
  Each with metadata + embeddings

[Footer]
  Index + Checksum
```

---

## Privacy & Security

- **Local-first:** All processing happens on your machine
- **No telemetry:** We don't collect usage data
- **BYO API keys:** Use your own AI provider credentials
- **Open format:** No vendor lock-in

---

## Legal Notices

- **AIF-BIN™** is a trademark of Terronex.dev.
- This software is provided under the **MIT License** (see [LICENSE](LICENSE)).
- See [NOTICE](NOTICE) file for additional copyright and trademark information.
- This is **beta software** — use at your own risk.

---

## Links

- **Website:** [terronex.dev/aifbin](https://terronex.dev/aifbin/)
- **GitHub:** [github.com/terronexdev/aifbin-pro](https://github.com/terronexdev/aifbin-pro)
- **Support:** support@terronex.dev
- **Twitter:** [@terronexdev](https://x.com/terronexdev)

---

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting PRs.

---

© 2026 Terronex.dev. All rights reserved.
