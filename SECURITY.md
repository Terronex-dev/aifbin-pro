# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in AIF-BIN Pro, please report it responsibly.

**DO NOT** open a public GitHub issue for security vulnerabilities.

### How to Report

1. Email: **security@terronex.dev**
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 7 days
- **Resolution Timeline:** Depends on severity
  - Critical: ASAP
  - High: 30 days
  - Medium: 90 days
- **Credit:** We will credit you in the release notes (unless you prefer anonymity)

### Scope

Security issues we care about:

- Code execution vulnerabilities
- Path traversal / file access issues
- Malformed input causing crashes or data corruption
- API key exposure risks
- Checksum/integrity bypass

### Out of Scope

- Issues in dependencies (report to upstream)
- Social engineering
- Physical attacks
- Issues requiring unlikely user interaction

## Security Best Practices

When using AIF-BIN Pro:

1. **Protect your API keys** — Store in environment variables, not code
2. **Use local mode** for sensitive documents
3. **Verify checksums** when receiving .aif-bin files from untrusted sources
4. **Keep updated** — Pull the latest version regularly

---

Thank you for helping keep AIF-BIN secure.
