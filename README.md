# AIF-BIN Pro CLI

**Professional command-line toolkit for semantic document memory.**

[![Patent Pending](https://img.shields.io/badge/Patent-Pending-blue.svg)](https://www.terronex.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)

---

## What is AIF-BIN Pro?

AIF-BIN Pro is a command-line tool for converting documents into searchable AI memory files. It generates real vector embeddings for semantic search — find content by meaning, not just keywords.

---

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Convert markdown to AIF-BIN
python3 cli/aifbin_pro.py migrate notes/ -o memories/

# Semantic search
python3 cli/aifbin_pro.py search "project decisions" -d memories/

# File info
python3 cli/aifbin_pro.py info file.aif-bin

# Extract original content
python3 cli/aifbin_pro.py extract file.aif-bin
```

---

## Commands

| Command | Description |
|---------|-------------|
| `migrate` | Convert files to AIF-BIN (v2 binary format) with embeddings |
| `search` | Semantic search across your memory files |
| `info` | Show file metadata, chunks, and model info |
| `extract` | Recover original content from AIF-BIN |
| `export` | Export to JSON, CSV, Markdown, or HTML |
| `watch` | Auto-sync directory on file changes |
| `diff` | Compare two AIF-BIN files |
| `models` | List available embedding models |
| `providers` | List AI providers for intelligent extraction |
| `ingest` | Convert any file with AI extraction |
| `config` | Configure AI provider API keys |

---

## Embedding Models

| Model | Dimensions | Description |
|-------|------------|-------------|
| `minilm` | 384 | Fast, good quality (default) |
| `mpnet` | 768 | Higher quality, slower |
| `bge-small` | 384 | Optimized for retrieval |
| `bge-base` | 768 | Best quality retrieval |
| `e5-small` | 384 | Microsoft E5, fast |

---

## AI Providers (for `ingest` command)

| Provider | Use Case |
|----------|----------|
| `anthropic` | Best for documents |
| `openai` | Good all-around |
| `gemini` | Good for images/PDFs |
| `ollama` | Local, free, private |
| `none` | Basic text extraction |

Configure with:
```bash
python3 cli/aifbin_pro.py config --provider anthropic --api-key sk-ant-...
```

---

## File Format

AIF-BIN v2 is a compact binary format with:
- MessagePack encoding (~50% smaller than JSON)
- Fixed-offset headers for fast parsing
- Embedded CRC64 checksums
- Vector embeddings for semantic search
- Original content preservation

```
[Header: 64 bytes]
  Magic: "AIFBIN\x00\x01"
  Version, Offsets, Size

[Metadata Section]
  MessagePack blob

[Original Raw Section]
  Preserved source file

[Content Chunks]
  Typed chunks with embeddings

[Footer]
  Index + Checksum
```

---

## Related Projects

| Project | Description |
|---------|-------------|
| [AIF-BIN Lite](https://github.com/terronexdev/aifbin-lite) | Free CLI (format conversion only, no embeddings) |
| [AIF-BIN Studio](https://github.com/terronexdev/aifbin-studio) | Desktop app with AI Chat and visual interface |

---

## Privacy & Security

- **Local-first:** All processing happens on your machine
- **No telemetry:** We don't collect usage data
- **BYO API keys:** Use your own AI provider credentials
- **Open format:** AIF-BIN files are portable, no vendor lock-in

---

## Legal

- **AIF-BIN™** is a trademark of Terronex.dev
- Licensed under the **MIT License** (see [LICENSE](LICENSE))
- See [NOTICE](NOTICE) for patent and trademark information

---

## Links

- **Website:** [terronex.dev/aifbin](https://terronex.dev/aifbin/)
- **Support:** support@terronex.dev
- **Twitter:** [@terronexdev](https://x.com/terronexdev)

---

© 2026 Terronex.dev. All rights reserved.
