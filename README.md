# AIF-BIN Pro

**Professional AI Memory Management — v2 Binary Format**

AIF-BIN Pro is the full-featured toolkit for managing AI-ready memories with semantic search, batch processing, and a visual inspector.

## What's Included

```
aifbin-pro/
├── cli/
│   ├── aifbin_pro.py      # Full CLI with all features
│   └── aifbin_spec_v2.py  # v2 binary format library
├── inspector/              # Web-based file inspector
├── docs/                   # Documentation
└── requirements.txt        # Python dependencies
```

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Test the CLI
python3 cli/aifbin_pro.py --help
```

## CLI Commands

```bash
# Convert files to AIF-BIN (v2 binary)
python3 cli/aifbin_pro.py migrate notes/ -o memories/ --parallel

# Semantic search
python3 cli/aifbin_pro.py search "pricing decisions" -d memories/

# File info
python3 cli/aifbin_pro.py info file.aif-bin

# Extract original content
python3 cli/aifbin_pro.py extract file.aif-bin

# Watch mode (auto-sync)
python3 cli/aifbin_pro.py watch notes/ -o memories/

# Compare files
python3 cli/aifbin_pro.py diff file1.aif-bin file2.aif-bin

# Export to other formats
python3 cli/aifbin_pro.py export file.aif-bin -o out.html -f html

# List embedding models
python3 cli/aifbin_pro.py models
```

## Embedding Models

| Model | Key | Dimensions | Description |
|-------|-----|------------|-------------|
| MiniLM | `minilm` | 384 | Fast, good quality (default) |
| MPNet | `mpnet` | 768 | Higher quality, slower |
| BGE Small | `bge-small` | 384 | Optimized for retrieval |
| BGE Base | `bge-base` | 768 | Best quality retrieval |
| E5 Small | `e5-small` | 384 | Microsoft E5, fast |

```bash
# Use a specific model
python3 cli/aifbin_pro.py migrate notes/ -o memories/ -m bge-base
```

## Web Inspector

The inspector is a browser-based tool for analyzing AIF-BIN files.

```bash
cd inspector
npm install
npm run dev
# Open http://localhost:3000
```

**Features:**
- Parse and validate v2 binary format
- View metadata and chunks
- Hex byte inspector
- Extract original content
- Export analysis scripts

## v2 Binary Format

Pro uses v2 binary format with MessagePack encoding:
- ~50% smaller than JSON
- Faster parsing
- Embedded checksums
- Compatible with Web Inspector

## Pro vs Lite

| Feature | Lite (Free) | Pro |
|---------|:-----------:|:---:|
| Single file migrate | ✅ | ✅ |
| File info/extract | ✅ | ✅ |
| **Semantic search** | ❌ | ✅ |
| **Batch processing** | ❌ | ✅ |
| **Watch mode** | ❌ | ✅ |
| **v2 binary format** | ❌ | ✅ |
| **Web Inspector** | ❌ | ✅ |
| **5 embedding models** | ❌ | ✅ |
| **Diff/export tools** | ❌ | ✅ |

## License

Commercial License — See LICENSE file.

## Support

- 📧 Email: support@terronex.dev
- 🐛 Issues: Report via email
- 📖 Docs: See `/docs` folder

---

Made with 🐾 by [Terronex.dev](https://terronex.dev)
