# Documentation Migration Guide

## Summary of Changes

This document tracks the migration from inline README documentation to structured MkDocs documentation.

### What Was Done

1. **Created MkDocs Structure** (`documentation/` directory)
   - Getting Started (3 pages)
   - User Guide (4 pages)
   - Development (4 pages)
   - Advanced (3 pages)
   - Contributing (1 page)

2. **Migrated Existing Documentation**
   - Copied from `docs/` (gitignored, local-only)
   - Adapted for MkDocs Material theme
   - Added cross-references and navigation

3. **Setup CI/CD**
   - GitHub Actions workflow (`.github/workflows/docs.yml`)
   - Automatic deployment to GitHub Pages on `main` push
   - Build validation on pull requests

4. **Added Makefile Commands**
   - `make docs-install` - Install MkDocs dependencies
   - `make docs-build` - Build documentation site
   - `make docs-serve` - Preview locally at http://127.0.0.1:8000
   - `make docs-deploy` - Manual deployment (CI handles this)

5. **Updated `.gitignore`**
   - Added `site/` (MkDocs build artifacts)
   - Added `.cache/` (MkDocs cache)
   - Kept `docs/` (local-only development documentation)

### What Needs To Be Done

#### 1. Simplify Main README.md

The main README should become a **concise landing page** that directs users to the comprehensive documentation:

**Recommended structure**:

```markdown
# 🎤 Voice Transcriber

[Badges here]

Lightweight desktop voice-to-text transcription with OpenAI Whisper and system tray integration.

## ✨ Features

- 🎯 System Tray Integration
- 🌍 Multilingual Support (5 languages)
- 🏠 Self-Hosted Option (Speaches)
- 📋 Automatic Clipboard Copy

## 🚀 Quick Start

```bash
git clone https://github.com/Nouuu/voice-transcriber.git
cd voice-transcriber
make setup
nano ~/.config/voice-transcriber/config.json  # Add API key
make run
```

## 📚 Documentation

**Comprehensive documentation available at: https://nouuu.github.io/voice-transcriber**

- [Installation Guide](https://nouuu.github.io/voice-transcriber/getting-started/installation/)
- [Configuration](https://nouuu.github.io/voice-transcriber/getting-started/configuration/)
- [User Guide](https://nouuu.github.io/voice-transcriber/user-guide/basic-usage/)
- [Development Guide](https://nouuu.github.io/voice-transcriber/development/development-guide/)

## 🤝 Contributing

See [Contributing Guide](https://nouuu.github.io/voice-transcriber/contributing/) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file.
```

**What to remove from README**:

- ❌ Detailed installation steps (move to docs)
- ❌ Complete configuration reference (move to docs)
- ❌ Extensive usage examples (move to docs)
- ❌ Full troubleshooting guide (move to docs)
- ❌ Detailed development workflow (move to docs)
- ❌ Complete roadmap (move to docs)

**What to keep in README**:

- ✅ Project overview and features
- ✅ Quick start command sequence
- ✅ Links to comprehensive documentation
- ✅ Badges and basic metadata
- ✅ License information

#### 2. Enable GitHub Pages

In your repository settings:

1. Go to **Settings** > **Pages**
2. Source: **Deploy from a branch**
3. Branch: **gh-pages** (will be created by CI)
4. Wait for first deployment from CI

#### 3. Test Documentation Locally

```bash
# Install dependencies
make docs-install

# Preview locally
make docs-serve
```

Open http://127.0.0.1:8000 and verify:

- Navigation works correctly
- All pages load without errors
- Code examples are properly formatted
- Internal links resolve correctly
- Search functionality works

#### 4. Deploy to GitHub Pages

**Option 1: Automatic (Recommended)**

Push to `main` branch:

```bash
git add .
git commit -m "docs: setup MkDocs documentation with CI/CD"
git push origin main
```

GitHub Actions will automatically deploy to GitHub Pages.

**Option 2: Manual**

```bash
make docs-deploy
```

#### 5. Update Repository Links

After documentation is live, update:

- **README.md**: Add documentation URL
- **package.json**: Update `homepage` field
- **GitHub repository description**: Add documentation link

## Files Created/Modified

### Created Files

```
documentation/
├── index.md
├── README.md
├── getting-started/
│   ├── installation.md
│   ├── configuration.md
│   └── first-run.md
├── user-guide/
│   ├── basic-usage.md
│   ├── language-support.md
│   ├── transcription-backends.md
│   └── troubleshooting.md
├── development/
│   ├── architecture.md
│   ├── development-guide.md
│   ├── testing.md
│   └── api-reference.md
├── advanced/
│   ├── speaches-integration.md
│   ├── whisper-models.md
│   └── local-inference.md
└── contributing.md

mkdocs.yml
.github/workflows/docs.yml
```

### Modified Files

```
Makefile (added docs-* commands)
.gitignore (added site/ and .cache/)
```

### Unchanged Files

```
docs/ (still gitignored, local-only)
README.md (to be simplified by user)
CLAUDE.md (local-only, no changes needed)
```

## Rollback Plan

If needed, documentation migration can be rolled back:

```bash
# Remove MkDocs files
rm -rf documentation/ site/ mkdocs.yml

# Restore Makefile (remove docs commands)
git checkout main -- Makefile

# Restore .gitignore
git checkout main -- .gitignore

# Remove GitHub Actions workflow
rm .github/workflows/docs.yml
```

## Benefits of Migration

### Before (Inline README)

- ❌ Single 650-line README file
- ❌ No search functionality
- ❌ No version history for docs
- ❌ Difficult to navigate
- ❌ No syntax highlighting in examples

### After (MkDocs)

- ✅ Organized, paginated documentation
- ✅ Full-text search across all pages
- ✅ Git-tracked version history
- ✅ Clear navigation with sections
- ✅ Syntax highlighting and admonitions
- ✅ Mobile-friendly responsive design
- ✅ Automatic deployment with CI/CD

## Next Steps

1. **Review all documentation pages** for accuracy
2. **Simplify main README.md** as described above
3. **Test local documentation preview** with `make docs-serve`
4. **Push to main** to trigger automatic deployment
5. **Verify GitHub Pages deployment** at https://nouuu.github.io/voice-transcriber
6. **Update repository links** to documentation site

## Questions?

- Check [MkDocs Material Documentation](https://squidfunk.github.io/mkdocs-material/)
- Review [Speaches Documentation](https://speaches.ai/) for inspiration
- Ask on [GitHub Discussions](https://github.com/Nouuu/voice-transcriber/discussions)
