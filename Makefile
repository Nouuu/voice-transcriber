# Transcriber Voice Application Makefile

.PHONY: help install run dev test test-watch test-file clean build check-deps lint format format-check audit release-patch release-minor release-major get-version

# Default target
help:
	@echo "Available commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make run         - Run the application"
	@echo "  make dev         - Run in development mode with watch"
	@echo "  make test        - Run all tests"
	@echo "  make test-watch  - Run tests in watch mode"
	@echo "  make test-file   - Run specific test file (usage: make test-file FILE=path/to/test.ts)"
	@echo "  make clean       - Clean build artifacts and temporary files"
	@echo "  make build       - Build for production"
	@echo "  make check-deps  - Check system dependencies"
	@echo "  make lint        - Run ESLint linting only"
	@echo "  make format      - Format code with Prettier"
	@echo "  make format-check - Check both linting and formatting"
	@echo "  make audit       - Run security audit on dependencies"
	@echo "  make release-patch - Create patch release (x.x.X) - Bug fixes"
	@echo "  make release-minor - Create minor release (x.X.0) - New features"
	@echo "  make release-major - Create major release (X.0.0) - Breaking changes"
	@echo "  make get-version   - Show current version from package.json"
	@echo "  make pre-release   - Validate code before release (linting, tests, git status)"

# Install dependencies
install:
	@echo "Installing dependencies..."
	bun install

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

# Check system dependencies
check-deps:
	@echo "Checking system dependencies..."
	@which arecord > /dev/null || (echo "❌ arecord not found. Install with: sudo apt-get install alsa-utils" && exit 1)
	@echo "✅ All system dependencies are installed"

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