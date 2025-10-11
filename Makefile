# Transcriber Voice Application Makefile

.PHONY: help setup check-system-deps init-config install install-global uninstall-global run dev test test-watch test-file clean build check-deps lint format format-check audit release-patch release-minor release-major get-version docs-install docs-build docs-serve docs-deploy

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "🚀 Setup & Installation:"
	@echo "  make setup            - Complete setup (system deps + bun deps + config)"
	@echo "  make check-system-deps - Check system dependencies (Bun, arecord, xsel)"
	@echo "  make init-config      - Initialize config file in ~/.config/voice-transcriber/"
	@echo "  make install          - Install bun dependencies only"
	@echo "  make install-global   - Install voice-transcriber command globally (requires sudo)"
	@echo "  make uninstall-global - Uninstall global voice-transcriber command"
	@echo ""
	@echo "▶️ Running:"
	@echo "  make run              - Run the application"
	@echo "  make dev              - Run in development mode with watch"
	@echo ""
	@echo "🧪 Testing & Quality:"
	@echo "  make test             - Run all tests"
	@echo "  make test-watch       - Run tests in watch mode"
	@echo "  make test-file        - Run specific test (usage: make test-file FILE=path/to/test.ts)"
	@echo "  make lint             - Run ESLint linting only"
	@echo "  make format           - Format code with Prettier"
	@echo "  make format-check     - Check both linting and formatting"
	@echo ""
	@echo "📚 Documentation:"
	@echo "  make docs-install     - Install MkDocs and required plugins"
	@echo "  make docs-build       - Build documentation site"
	@echo "  make docs-serve       - Serve documentation locally at http://127.0.0.1:8000"
	@echo "  make docs-deploy      - Deploy documentation to GitHub Pages (CI only)"
	@echo ""
	@echo "🛠️ Utilities:"
	@echo "  make clean            - Clean build artifacts and temporary files"
	@echo "  make build            - Build for production"
	@echo "  make check-deps       - Alias for check-system-deps (legacy)"
	@echo "  make audit            - Run security audit on dependencies"
	@echo "  make release-patch    - Create patch release (x.x.X) - Bug fixes"
	@echo "  make release-minor    - Create minor release (x.X.0) - New features"
	@echo "  make release-major    - Create major release (X.0.0) - Breaking changes"
	@echo "  make get-version      - Show current version from package.json"
	@echo "  make pre-release      - Validate code before release (linting, tests, git status)"

# Complete setup: check system dependencies, install bun deps, initialize config
setup: check-system-deps install init-config
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "📝 Next steps:"
	@echo "  1. Edit your config: nano ~/.config/voice-transcriber/config.json"
	@echo "  2. Add your OpenAI API key"
	@echo "  3. Run the application: make run"

# Check system dependencies
check-system-deps:
	@echo "Checking system dependencies..."
	@echo ""
	@echo "Checking Bun runtime..."
	@which bun > /dev/null || (echo "❌ Bun not found. Install from: https://bun.sh" && exit 1)
	@bun --version | awk '{print "✅ Bun version: " $$1}'
	@echo ""
	@echo "Checking arecord (required for audio recording)..."
	@which arecord > /dev/null || (echo "❌ arecord not found. Install with: sudo apt-get install alsa-utils" && exit 1)
	@echo "✅ arecord found"
	@echo ""
	@echo "Checking xsel (optional for clipboard)..."
	@which xsel > /dev/null && echo "✅ xsel found" || echo "⚠️  xsel not found (optional). Install with: sudo apt-get install xsel"
	@echo ""
	@echo "✅ All required system dependencies are installed"

# Initialize config file
init-config:
	@echo "Initializing configuration..."
	@mkdir -p ~/.config/voice-transcriber
	@if [ -f ~/.config/voice-transcriber/config.json ]; then \
		echo "✅ Config file already exists at ~/.config/voice-transcriber/config.json"; \
	else \
		if [ -f config.example.json ]; then \
			cp config.example.json ~/.config/voice-transcriber/config.json; \
			echo "✅ Config file created at ~/.config/voice-transcriber/config.json"; \
			echo "⚠️  Remember to add your OpenAI API key!"; \
		else \
			echo "❌ config.example.json not found. Please create it first."; \
			exit 1; \
		fi \
	fi

# Install dependencies
install:
	@echo "Installing Bun dependencies..."
	bun install

# Install globally (create symlink in /usr/local/bin)
install-global:
	@echo "🔗 Installing voice-transcriber globally..."
	@if [ ! -f "$(PWD)/src/index.ts" ]; then \
		echo "❌ Error: Must be run from project directory"; \
		exit 1; \
	fi
	@echo '#!/bin/bash' > /tmp/voice-transcriber
	@echo 'cd "$(PWD)" && bun run src/index.ts "$$@"' >> /tmp/voice-transcriber
	@chmod +x /tmp/voice-transcriber
	@sudo mv /tmp/voice-transcriber /usr/local/bin/voice-transcriber
	@echo "✅ voice-transcriber installed globally"
	@echo "💡 You can now run 'voice-transcriber' from anywhere"

# Uninstall global command
uninstall-global:
	@echo "🗑️  Uninstalling voice-transcriber..."
	@sudo rm -f /usr/local/bin/voice-transcriber
	@echo "✅ voice-transcriber uninstalled"
	@echo "💡 You can still run with 'make run' from the project directory"

# Run the application
run:
	@echo "Starting application..."
	bun run start

# Development mode with watch
dev:
	@echo "Starting development mode..."
	bun run dev

# Run all tests
test:
	@echo "Running tests..."
	bun test

# Run tests in watch mode
test-watch:
	@echo "Running tests in watch mode..."
	bun run test:watch

# Run specific test file
test-file:
	@echo "Running test file: $(FILE)"
	bun test $(FILE)

# Clean build artifacts and temporary files
clean:
	@echo "Cleaning build artifacts..."
	bun run clean

# Build for production
build:
	@echo "Building for production..."
	bun run build

# Legacy alias for check-system-deps
check-deps: check-system-deps

# Run ESLint linting only
lint:
	@echo "Running ESLint linting..."
	bunx eslint "./src/**/*.ts"

# Format code with Prettier
format:
	@echo "Formatting code with Prettier..."
	bunx prettier --write "./src/**/*.ts"

# Check both linting and formatting
format-check:
	@echo "Checking code with ESLint and Prettier..."
	@echo "Checking formatting..."
	bunx prettier --check "./src/**/*.ts"
	@echo "Running linting..."
	bunx eslint "./src/**/*.ts"

# Run security audit on dependencies
audit:
	@echo "Running security audit..."
	bun audit

# Get current version from package.json
get-version:
	$(eval CURRENT_VERSION := $(shell grep '"version"' package.json | cut -d'"' -f4))
	@echo "Current version: $(CURRENT_VERSION)"

# Pre-release validation
pre-release:
	@echo "🔍 Pre-release validation..."
	@make format-check
	@make test
	@git status --porcelain | grep -q . && (echo "❌ Working directory not clean. Commit or stash changes first." && exit 1) || echo "✅ Working directory clean"
	@echo "✅ Ready for release"

# Create patch release (x.x.X) - Bug fixes
release-patch: pre-release
	@echo "Creating patch release..."
	$(eval OLD_VERSION := $(shell grep '"version"' package.json | cut -d'"' -f4))
	@npm version patch -m "chore: bump version to %s"
	$(eval NEW_VERSION := $(shell grep '"version"' package.json | cut -d'"' -f4))
	@echo "✅ Released $(OLD_VERSION) → $(NEW_VERSION)"
	@echo "🚀 Push with: git push --follow-tags"

# Create minor release (x.X.0) - New features
release-minor: pre-release
	@echo "Creating minor release..."
	$(eval OLD_VERSION := $(shell grep '"version"' package.json | cut -d'"' -f4))
	@npm version minor -m "chore: bump version to %s"
	$(eval NEW_VERSION := $(shell grep '"version"' package.json | cut -d'"' -f4))
	@echo "✅ Released $(OLD_VERSION) → $(NEW_VERSION)"
	@echo "🚀 Push with: git push --follow-tags"

# Create major release (X.0.0) - Breaking changes
release-major: pre-release
	@echo "Creating major release..."
	$(eval OLD_VERSION := $(shell grep '"version"' package.json | cut -d'"' -f4))
	@npm version major -m "chore: bump version to %s"
	$(eval NEW_VERSION := $(shell grep '"version"' package.json | cut -d'"' -f4))
	@echo "✅ Released $(OLD_VERSION) → $(NEW_VERSION)"
	@echo "🚀 Push with: git push --follow-tags"

# Documentation commands
docs-install:
	@echo "📚 Installing MkDocs and plugins..."
	@which pip3 > /dev/null || (echo "❌ pip3 not found. Install Python 3 first." && exit 1)
	pip3 install --upgrade pip
	pip3 install mkdocs-material \
	            mkdocs-minify-plugin \
	            mkdocs-git-revision-date-localized-plugin \
	            mkdocs-awesome-pages-plugin
	@echo "✅ MkDocs installation complete"

docs-build:
	@echo "📚 Building documentation..."
	@which mkdocs > /dev/null || (echo "❌ mkdocs not found. Run 'make docs-install' first." && exit 1)
	mkdocs build --strict
	@echo "✅ Documentation built in site/"

docs-serve:
	@echo "📚 Serving documentation locally..."
	@echo "🌐 Open http://127.0.0.1:8000 in your browser"
	@which mkdocs > /dev/null || (echo "❌ mkdocs not found. Run 'make docs-install' first." && exit 1)
	mkdocs serve

docs-deploy:
	@echo "📚 Deploying documentation to GitHub Pages..."
	@which mkdocs > /dev/null || (echo "❌ mkdocs not found. Run 'make docs-install' first." && exit 1)
	@git status --porcelain | grep -q . && (echo "⚠️  Warning: Uncommitted changes will not be deployed" && sleep 2) || true
	mkdocs gh-deploy --force --message "docs: deploy documentation [skip ci]"
	@echo "✅ Documentation deployed to GitHub Pages"