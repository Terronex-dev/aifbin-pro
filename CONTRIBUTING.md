# Contributing to AIF-BIN Pro

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/Terronex-dev/aifbin-pro.git
   cd aifbin-pro
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Project Structure

```
aifbin-pro/
├── cli/                # Python CLI tools
│   ├── aifbin_pro.py   # Main CLI
│   └── aifbin_spec_v2.py # v2 format library
├── inspector/          # React web inspector
└── docs/               # Documentation
```

## Development

### CLI (Python)

```bash
# Run tests
python3 -m pytest tests/

# Format code
black cli/

# Type checking
mypy cli/
```

### Inspector (React/TypeScript)

```bash
cd inspector
npm install
npm run dev     # Development server
npm run build   # Production build
npm run lint    # Lint code
```

## Code Style

### Python
- Use [Black](https://github.com/psf/black) for formatting
- Follow PEP 8 guidelines
- Add type hints where possible
- Write docstrings for public functions

### TypeScript
- Use ESLint + Prettier
- Follow React best practices
- Use functional components with hooks

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and add tests

3. Commit with a clear message:
   ```bash
   git commit -m "feat: Add new feature X"
   ```

4. Push and create a Pull Request

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `test:` Adding tests
- `refactor:` Code refactoring
- `chore:` Maintenance

## Reporting Issues

When reporting bugs, please include:

- Python/Node version
- Operating system
- Minimal reproduction steps
- Expected vs actual behavior

## Feature Requests

We welcome feature requests! Please:

- Check existing issues first
- Describe the use case
- Explain why existing features don't solve it

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

- Be respectful and inclusive
- No harassment or discrimination
- Focus on constructive feedback

## Questions?

- Open a GitHub issue
- Email: support@terronex.dev

Thank you for helping make AIF-BIN better!
