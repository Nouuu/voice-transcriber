# Voice Transcriber Documentation

This directory contains the source files for the Voice Transcriber documentation website built with MkDocs Material.

## Documentation Structure

```
documentation/
├── index.md                    # Landing page
├── getting-started/
│   ├── installation.md         # Installation guide
│   ├── configuration.md        # Configuration reference
│   └── first-run.md           # First-time setup
├── user-guide/
│   ├── basic-usage.md         # Usage instructions
│   ├── language-support.md    # Multilingual features
│   ├── transcription-backends.md  # OpenAI vs Speaches
│   └── troubleshooting.md     # Common issues
├── development/
│   ├── architecture.md        # System architecture
│   ├── development-guide.md   # Development workflow
│   ├── testing.md            # Testing guide
│   └── api-reference.md      # API documentation
├── advanced/
│   ├── speaches-integration.md  # Self-hosted setup
│   ├── whisper-models.md      # Model comparison
│   └── local-inference.md     # Roadmap
└── contributing.md            # Contribution guide
```

## Working with Documentation

### Install MkDocs

```bash
make docs-install
```

This installs:
- MkDocs Material theme
- MkDocs minify plugin
- Git revision date plugin
- Awesome pages plugin

### Build Documentation Locally

```bash
make docs-build
```

Builds the static site in `site/` directory.

### Preview Documentation

```bash
make docs-serve
```

Serves documentation at [http://127.0.0.1:8000](http://127.0.0.1:8000)

**Hot reload**: Changes to documentation files are automatically reflected in the browser.

### Deploy to GitHub Pages

```bash
make docs-deploy
```

!!! warning "Manual Deployment"
    This command is primarily for testing. Automatic deployment happens via GitHub Actions when pushing to `main` branch.

## Writing Documentation

### Style Guide

- **Use clear, concise language** - Write for users at different technical levels
- **Include code examples** - Practical examples help understanding
- **Cross-reference related pages** - Use relative links between pages
- **Use admonitions** - Highlight important information with tip, warning, info boxes

### Admonitions

```markdown
!!! tip "Recommendation"
    This is a helpful tip for users.

!!! warning "Important Notice"
    This is something users should be aware of.

!!! info "Additional Information"
    This provides extra context.

!!! question "Need Help?"
    This directs users to support resources.
```

### Code Blocks

Use language-specific syntax highlighting:

````markdown
```bash
make docs-serve
```

```json
{
  "openaiApiKey": "sk-..."
}
```

```typescript
interface Config {
  openaiApiKey: string;
}
```
````

### Linking

**Internal links** (relative to current file):
```markdown
[Installation Guide](installation.md)
[Configuration](../getting-started/configuration.md)
```

**External links**:
```markdown
[OpenAI Platform](https://platform.openai.com/)
```

### Images

Place images in `documentation/assets/` and reference:

```markdown
![System Tray](assets/system-tray.png)
```

## MkDocs Configuration

**File**: `mkdocs.yml` (project root)

**Key sections**:

- `site_name`: Documentation title
- `theme`: Material theme configuration
- `plugins`: Search, minify, git-revision-date
- `markdown_extensions`: Enhanced markdown features
- `nav`: Documentation navigation structure

## GitHub Actions CI/CD

**Workflow**: `.github/workflows/docs.yml`

**Triggers**:
- Push to `main` branch (deploys to GitHub Pages)
- Pull requests (builds for validation)
- Manual workflow dispatch

**Deployment**:
- Automatic deployment to [https://nouuu.github.io/voice-transcriber](https://nouuu.github.io/voice-transcriber)
- Uses `gh-pages` branch for hosting
- Includes git history for revision dates

## Contributing

See [Contributing Guide](contributing.md) for guidelines on improving documentation.

## License

Documentation is licensed under the same [MIT License](../LICENSE) as the project.
