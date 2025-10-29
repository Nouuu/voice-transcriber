---
title: Contributing Guide
description: Guidelines and best practices for contributing to Voice Transcriber development
tags:
  - development
  - guide
  - contributing
keywords: contributing, pull requests, bugs, features, development, workflow, code style, testing, documentation
---

# Contributing Guide

Thank you for considering contributing to Voice Transcriber! This guide will help you get started.

## Code of Conduct

Be respectful, inclusive, and considerate in all interactions.

## How to Contribute

### Reporting Bugs

**Before submitting a bug report**:

1. Check [existing issues](https://github.com/Nouuu/voice-transcriber/issues)
2. Try the latest version
3. Enable debug mode: `voice-transcriber --debug`

**Bug report should include**:

- Voice Transcriber version
- Operating system and desktop environment
- Steps to reproduce
- Expected vs actual behavior
- Debug logs (if applicable)

**Submit at**: https://github.com/Nouuu/voice-transcriber/issues/new

### Suggesting Features

**Feature requests should include**:

- **Problem description**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: What other approaches did you think about?
- **Use cases**: Who benefits from this feature?

### Submitting Pull Requests

**Development workflow**:

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/voice-transcriber.git
cd voice-transcriber

# 2. Create feature branch
git checkout -b feat/your-feature-name

# 3. Setup development environment
make setup

# 4. Make changes
# Edit code...

# 5. Run tests and linting
make test
make format-check

# 6. Commit changes
git commit -m "feat: add your feature"

# 7. Push and create PR
git push origin feat/your-feature-name
```

**Pull request checklist**:

- [ ] Code follows project conventions
- [ ] Tests added for new functionality
- [ ] All tests pass (`make test`)
- [ ] Linting passes (`make format-check`)
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] Documentation updated if needed

## Development Guidelines

### Code Style

- **TypeScript**: Strict typing, no `any` types
- **Services**: 3-5 methods maximum, simple interfaces
- **Error handling**: Consistent `{ success: boolean, error?: string }` pattern
- **Testing**: Focus on core functionality, use simple mocks

### Commit Messages

Use **Conventional Commits** format:

```
type: description

feat: add new feature
fix: resolve bug in service
refactor: simplify code structure
test: add tests for component
docs: update documentation
chore: update dependencies
```

**Rules**:
- Keep descriptions under 50 characters
- Use present tense ("add" not "added")
- No capitalization after colon
- No period at end

### Project Principles

#### KEEP IT SIMPLE

✅ **Do**:
- Basic error handling
- Simple configuration
- Direct API calls
- Console logging (info/error)
- Single responsibility

❌ **Don't**:
- Complex retry logic
- Advanced statistics
- Batch processing (unless essential)
- Complex validation
- Advanced logging systems

Each service should be under 100 lines with 3-5 core methods.

### Testing

**Run tests**:

```bash
make test              # All tests
make test-watch        # Watch mode
make test-file FILE=   # Specific test
```

**Testing philosophy**:

- Test core functionality
- Use simple mocks
- Maximum 5-6 tests per service
- Focus on: success cases, basic errors, input validation

## Documentation

### Updating Documentation

Documentation uses **MkDocs Material**:

```bash
# Install dependencies
make docs-install

# Serve locally
make docs-serve

# Build
make docs-build
```

**Documentation structure**:

```
documentation/
├── getting-started/    # Installation, configuration, first run
├── user-guide/         # Usage, language support, troubleshooting
├── development/        # Architecture, development guide, API
└── advanced/          # Speaches, models, roadmap
```

### Writing Documentation

- **Clear language**: Write for users at different levels
- **Code examples**: Include practical examples
- **Cross-references**: Link related pages
- **Admonitions**: Use tips, warnings, and info boxes

**Example**:

```markdown
!!! tip "Recommendation"
    Use the base model for best speed/accuracy balance.

!!! warning "Known Issue"
    System tray may not work on all desktop environments.
```

## Community

- **GitHub Issues**: https://github.com/Nouuu/voice-transcriber/issues
- **GitHub Discussions**: https://github.com/Nouuu/voice-transcriber/discussions
- **Pull Requests**: https://github.com/Nouuu/voice-transcriber/pulls

## Recognition

All contributors will be recognized in the project's README and release notes.

---

Thank you for contributing to Voice Transcriber! 🎤

## Related Pages

- [Development Guide](development/development-guide.md) - Complete development workflow and setup
- [Technical Architecture](development/architecture.md) - System architecture overview
- [Testing Guide](development/testing.md) - Testing strategies and patterns
- [API Reference](development/api-reference.md) - API documentation for all services
