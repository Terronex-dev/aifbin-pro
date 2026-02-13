# AIF-BIN Pro CLI

**Professional command-line toolkit for semantic document memory.**

[![PyPI version](https://img.shields.io/pypi/v/aifbin-pro.svg)](https://pypi.org/project/aifbin-pro/)
[![CI](https://github.com/terronex-dev/aifbin-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/terronex-dev/aifbin-pro/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Patent Pending](https://img.shields.io/badge/Patent-Pending-blue.svg)](https://www.terronex.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)

---

## What is AIF-BIN Pro?

AIF-BIN Pro is a command-line tool for converting documents into searchable AI memory files. It generates real vector embeddings for semantic search — find content by meaning, not just keywords.

**Key Features:**
- **Semantic Search** — Query your documents by meaning
- **Real Embeddings** — 384/768-dimension vectors with 5 model options
- **Batch Processing** — Parallel conversion of entire directories
- **Watch Mode** — Auto-sync on file changes
- **AI Extraction** — Use Claude, GPT-4, Gemini, or Ollama for intelligent parsing
- **Multiple Exports** — JSON, CSV, Markdown, HTML

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/Terronex-dev/aifbin-pro.git
cd aifbin-pro
```

### Using the Wrapper Script

For convenience, a wrapper script is provided. Make it executable first:

```bash
chmod +x aifbin-pro
```

Now you can run the CLI directly:

```bash
# Verify installation
./aifbin-pro --help
```

The examples below will use this wrapper. If you prefer, you can still run `python3 cli/aifbin_pro.py` or `python cli/aifbin_pro.py`.

### Optional: Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate      # Linux/macOS/WSL
.venv\Scripts\activate         # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Run
python cli/aifbin_pro.py --help
```

---

## Quick Start

A `sample.md` file is included for testing.

```bash
# Convert the sample file to AIF-BIN with embeddings
./aifbin-pro migrate sample.md -o output/

# Search your memories semantically
./aifbin-pro search "project decisions" -d output/

# View file info
./aifbin-pro info output/sample.aif-bin

# Extract original content
./aifbin-pro extract output/sample.aif-bin
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

## Command Examples

### Migrate (Convert Files)

```bash
# Single file
./aifbin-pro migrate document.md -o output/

# Entire directory
./aifbin-pro migrate notes/ -o output/

# Recursive with parallel processing
./aifbin-pro migrate notes/ -o output/ -r -p

# Use a different embedding model
./aifbin-pro migrate notes/ -o output/ -m bge-small
```

### Search (Semantic Query)

```bash
# Basic search
./aifbin-pro search "budget decisions" -d output/

# Get more results
./aifbin-pro search "project timeline" -d output/ -k 10

# Filter by date
./aifbin-pro search "meeting notes" -d output/ --after 2026-01-01
```

### Watch (Auto-Sync)

```bash
# Watch a directory and auto-convert changes
./aifbin-pro watch notes/ -o output/

# Custom check interval (seconds)
./aifbin-pro watch notes/ -o output/ -i 10
```

### Export (Convert to Other Formats)

```bash
./aifbin-pro export file.aif-bin -o output.json -f json
./aifbin-pro export file.aif-bin -o output.csv -f csv
./aifbin-pro export file.aif-bin -o output.md -f markdown
./aifbin-pro export file.aif-bin -o output.html -f html
```

### Ingest (AI-Powered Extraction)

```bash
# Configure an AI provider first
./aifbin-pro config --provider anthropic --api-key sk-ant-...

# Ingest files with AI extraction
./aifbin-pro ingest documents/ -o output/ -p anthropic

# Use local Ollama (no API key needed)
./aifbin-pro ingest documents/ -o output/ -p ollama
```

---

## Embedding Models

| Model | Dimensions | Speed | Description |
|-------|------------|-------|-------------|
| `minilm` | 384 | Fast | Good quality (default) |
| `mpnet` | 768 | Slow | Higher quality |
| `bge-small` | 384 | Fast | Optimized for retrieval |
| `bge-base` | 768 | Slow | Best quality retrieval |
| `e5-small` | 384 | Fast | Microsoft E5 |

List available models:

```bash
./aifbin-pro models
```

---

## AI Providers (for `ingest` command)

| Provider | API Key Required | Best For |
|----------|------------------|----------|
| `anthropic` | Yes | Documents, analysis |
| `openai` | Yes | General purpose |
| `gemini` | Yes | Images, PDFs (vision) |
| `ollama` | No (local) | Privacy, offline use |
| `none` | No | Basic text extraction |

Configure providers:

```bash
# Set API key
./aifbin-pro config --provider anthropic --api-key sk-ant-...

# Set default provider
./aifbin-pro config --default anthropic

# View current config
./aifbin-pro config
```

List available providers:

```bash
./aifbin-pro providers
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

## Troubleshooting

### `error: externally-managed-environment` (Debian/Ubuntu/WSL)

```bash
# Option 1: Use --break-system-packages
pip3 install -r requirements.txt --break-system-packages

# Option 2: Use a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### `ModuleNotFoundError: No module named 'sentence_transformers'`

You may need to install the project's dependencies.

```bash
pip install -r requirements.txt
```

### Ollama connection refused

Make sure Ollama is running:
```bash
# Start Ollama server
ollama serve

# Pull a model if needed
ollama pull llama3.1:8b
```

---

## Related Projects

| Project | Description |
|---------|-------------|
| [AIF-BIN Lite](https://github.com/Terronex-dev/aifbin-lite) | Free CLI (format conversion only, no embeddings) |

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
