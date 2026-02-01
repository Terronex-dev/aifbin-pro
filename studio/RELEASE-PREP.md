# AIF-BIN Studio — Release Preparation

**Status:** PRIVATE (preparing for public release)
**Trademark:** Pending (Jason handling)
**Style Guide:** Terronex Design System (NO AI ICONS)

---

## Current State (as of 2026-02-01)

**Commit:** `940598e` — feat: Add rename functionality + UI polish
**Codebase:** ~3,700 lines TypeScript/React
**Platform:** Tauri (desktop), Vite (web)

### Existing Features
- [x] File ingestion (PDF, DOCX, images, text)
- [x] AIF-BIN v2 binary output
- [x] Inspector (view metadata, chunks, hex)
- [x] Library sidebar (persistent file list)
- [x] AI Chat sidebar (file operations)
- [x] Rename functionality
- [x] Multi-provider AI support (10 providers)
- [x] BYO API key model

### What's Working
- Ingest → creates valid .aif-bin files
- Inspector → reads and displays contents
- Search → semantic search across files
- Settings → configure AI providers

---

## Pre-Release Checklist

### Code Quality
- [ ] Remove console.logs / debug code
- [ ] Error handling audit
- [ ] Loading states for all async operations
- [ ] Keyboard accessibility
- [ ] Responsive design check

### Documentation
- [ ] README.md (professional, with screenshots)
- [ ] CHANGELOG.md
- [ ] LICENSE (MIT or proprietary?)
- [ ] Contributing guide (if open source)

### Branding (Terronex Style)
- [ ] App icon (no AI imagery)
- [ ] Splash screen
- [ ] Screenshots for store listings
- [ ] Demo GIF/video
- [ ] Landing page copy

### Legal
- [ ] Trademark "AIF-BIN" — IN PROGRESS (Jason)
- [ ] Privacy policy
- [ ] Terms of service

### Distribution
- [ ] Windows installer (.msi / .exe)
- [ ] macOS installer (.dmg)
- [ ] Linux package (.AppImage / .deb)
- [ ] Web version (Vercel)

### Marketing Prep (DO NOT PUBLISH YET)
- [ ] Product Hunt draft
- [ ] Hacker News "Show HN" draft
- [ ] Twitter/X announcement thread
- [ ] Reddit posts (r/AI, r/productivity)

---

## Feature Roadmap (Post-Launch)

### v1.1 — Versioning
- Version history panel
- Revert to previous versions
- Diff view between versions

### v1.2 — AI Editing
- Text selection + AI edit
- Quick actions (summarize, improve, etc.)
- Auto-version on edits

### v1.3 — Plugin System
- Plugin SDK
- Example plugins (Finance, Photos, Notes)
- Plugin marketplace prep

---

## Pricing Strategy

| Product | Price | Model |
|---------|-------|-------|
| Studio (Desktop) | $49 one-time | Pay once, own forever |
| Studio Pro | $4.99/mo | Freemium (advanced features) |
| CLI Converter | $19 one-time | Standalone tool |
| Enterprise | Custom | Volume licensing |

---

## Timeline (Target)

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Trademark filed | Feb 2026 | Jason handling |
| Code cleanup | Feb 2026 | Starting |
| Documentation | Feb 2026 | Starting |
| Branding assets | Feb 2026 | Starting |
| Private beta | Mar 2026 | After trademark |
| Public launch | TBD | After beta feedback |

---

*Last updated: 2026-02-01*
