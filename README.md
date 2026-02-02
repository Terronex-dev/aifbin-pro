# AIF-BIN Pro CLI

**Professional command-line toolkit for semantic document memory.**

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
git clone https://github.com/terronexdev/aifbin-pro.git
cd aifbin-pro
```

### Windows (PowerShell/CMD)

```powershell
# Install dependencies
pip install -r requirements.txt

# Verify installation
python cli/aifbin_pro.py --help
```

### Linux / macOS / WSL

```bash
# Install dependencies
pip3 install -r requirements.txt

# Or on Debian/Ubuntu/WSL with externally-managed-environment:
pip3 install -r requirements.txt --break-system-packages

# Verify installation
python3 cli/aifbin_pro.py --help
```

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

### Windows

```powershell
# Convert a markdown file to AIF-BIN with embeddings
python cli/aifbin_pro.py migrate notes/meeting.md -o memories/

# Search your memories semantically
python cli/aifbin_pro.py search "project decisions" -d memories/

# View file info
python cli/aifbin_pro.py info memories/meeting.aif-bin

# Extract original content
python cli/aifbin_pro.py extract memories/meeting.aif-bin
```

### Linux / macOS / WSL

```bash
# Convert a markdown file to AIF-BIN with embeddings
python3 cli/aifbin_pro.py migrate notes/meeting.md -o memories/

# Search your memories semantically
python3 cli/aifbin_pro.py search "project decisions" -d memories/

# View file info
python3 cli/aifbin_pro.py info memories/meeting.aif-bin

# Extract original content
python3 cli/aifbin_pro.py extract memories/meeting.aif-bin
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

**Windows:**
```powershell
# Single file
python cli/aifbin_pro.py migrate document.md -o output/

# Entire directory
python cli/aifbin_pro.py migrate notes/ -o memories/

# Recursive with parallel processing
python cli/aifbin_pro.py migrate notes/ -o memories/ -r -p

# Use a different embedding model
python cli/aifbin_pro.py migrate notes/ -o memories/ -m bge-small
```

**Linux / macOS / WSL:**
```bash
# Single file
python3 cli/aifbin_pro.py migrate document.md -o output/

# Entire directory
python3 cli/aifbin_pro.py migrate notes/ -o memories/

# Recursive with parallel processing
python3 cli/aifbin_pro.py migrate notes/ -o memories/ -r -p

# Use a different embedding model
python3 cli/aifbin_pro.py migrate notes/ -o memories/ -m bge-small
```

### Search (Semantic Query)

**Windows:**
```powershell
# Basic search
python cli/aifbin_pro.py search "budget decisions" -d memories/

# Get more results
python cli/aifbin_pro.py search "project timeline" -d memories/ -k 10

# Filter by date
python cli/aifbin_pro.py search "meeting notes" -d memories/ --after 2026-01-01
```

**Linux / macOS / WSL:**
```bash
# Basic search
python3 cli/aifbin_pro.py search "budget decisions" -d memories/

# Get more results
python3 cli/aifbin_pro.py search "project timeline" -d memories/ -k 10

# Filter by date
python3 cli/aifbin_pro.py search "meeting notes" -d memories/ --after 2026-01-01
```

### Watch (Auto-Sync)

**Windows:**
```powershell
# Watch a directory and auto-convert changes
python cli/aifbin_pro.py watch notes/ -o memories/

# Custom check interval (seconds)
python cli/aifbin_pro.py watch notes/ -o memories/ -i 10
```

**Linux / macOS / WSL:**
```bash
# Watch a directory and auto-convert changes
python3 cli/aifbin_pro.py watch notes/ -o memories/

# Custom check interval (seconds)
python3 cli/aifbin_pro.py watch notes/ -o memories/ -i 10
```

### Export (Convert to Other Formats)

**Windows:**
```powershell
python cli/aifbin_pro.py export file.aif-bin -o output.json -f json
python cli/aifbin_pro.py export file.aif-bin -o output.csv -f csv
python cli/aifbin_pro.py export file.aif-bin -o output.md -f markdown
python cli/aifbin_pro.py export file.aif-bin -o output.html -f html
```

**Linux / macOS / WSL:**
```bash
python3 cli/aifbin_pro.py export file.aif-bin -o output.json -f json
python3 cli/aifbin_pro.py export file.aif-bin -o output.csv -f csv
python3 cli/aifbin_pro.py export file.aif-bin -o output.md -f markdown
python3 cli/aifbin_pro.py export file.aif-bin -o output.html -f html
```

### Ingest (AI-Powered Extraction)

**Windows:**
```powershell
# Configure an AI provider first
python cli/aifbin_pro.py config --provider anthropic --api-key sk-ant-...

# Ingest files with AI extraction
python cli/aifbin_pro.py ingest documents/ -o memories/ -p anthropic

# Use local Ollama (no API key needed)
python cli/aifbin_pro.py ingest documents/ -o memories/ -p ollama
```

**Linux / macOS / WSL:**
```bash
# Configure an AI provider first
python3 cli/aifbin_pro.py config --provider anthropic --api-key sk-ant-...

# Ingest files with AI extraction
python3 cli/aifbin_pro.py ingest documents/ -o memories/ -p anthropic

# Use local Ollama (no API key needed)
python3 cli/aifbin_pro.py ingest documents/ -o memories/ -p ollama
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

**Windows:**
```powershell
python cli/aifbin_pro.py models
```

**Linux / macOS / WSL:**
```bash
python3 cli/aifbin_pro.py models
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

**Windows:**
```powershell
# Set API key
python cli/aifbin_pro.py config --provider anthropic --api-key sk-ant-...

# Set default provider
python cli/aifbin_pro.py config --default anthropic

# View current config
python cli/aifbin_pro.py config
```

**Linux / macOS / WSL:**
```bash
# Set API key
python3 cli/aifbin_pro.py config --provider anthropic --api-key sk-ant-...

# Set default provider
python3 cli/aifbin_pro.py config --default anthropic

# View current config
python3 cli/aifbin_pro.py config
```

List available providers:

**Windows:**
```powershell
python cli/aifbin_pro.py providers
```

**Linux / macOS / WSL:**
```bash
python3 cli/aifbin_pro.py providers
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

### `python3` not found on Windows

On Windows, use `python` instead of `python3`:
```powershell
python cli/aifbin_pro.py --help
```

### `ModuleNotFoundError: No module named 'sentence_transformers'`

Install dependencies:
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
