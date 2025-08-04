# Transcriber Voice Application Makefile

.PHONY: help install run dev test test-watch test-file clean build check-deps lint format format-check audit release-patch release-minor release-major tag-list tag-push

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
	@echo "  make lint        - Run Biome linting only"
	@echo "  make format      - Format code with Biome"
	@echo "  make format-check - Check both linting and formatting"
	@echo "  make audit       - Run security audit"
	@echo "  make release-patch - Create patch release (x.x.X)"
	@echo "  make release-minor - Create minor release (x.X.0)"
	@echo "  make release-major - Create major release (X.0.0)"
	@echo "  make tag-list    - List all git tags"
	@echo "  make tag-push    - Push tags to remote repository"

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

# Run Biome linting only
lint:
	@echo "Running Biome linting..."
	bunx --bun biome lint "./src"

# Format code with Biome
format:
	@echo "Formatting code with Biome..."
	bunx --bun biome format --write "./src"

# Check both linting and formatting
format-check:
	@echo "Checking code with Biome (lint + format)..."
	bunx --bun biome check "./src"

# Run security audit
audit:
	@echo "Running security audit..."
	bun audit

# Get current version from git tags
get-version:
	$(eval CURRENT_VERSION := $(shell git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"))
	$(eval VERSION_NUMBERS := $(subst v,,$(CURRENT_VERSION)))
	$(eval MAJOR := $(word 1,$(subst ., ,$(VERSION_NUMBERS))))
	$(eval MINOR := $(word 2,$(subst ., ,$(VERSION_NUMBERS))))
	$(eval PATCH := $(word 3,$(subst ., ,$(VERSION_NUMBERS))))

# Create patch release (x.x.X)
release-patch: get-version
	$(eval NEW_PATCH := $(shell echo $$(($(PATCH) + 1))))
	$(eval NEW_VERSION := v$(MAJOR).$(MINOR).$(NEW_PATCH))
	@echo "Creating patch release: $(CURRENT_VERSION) → $(NEW_VERSION)"
	@git tag -a $(NEW_VERSION) -m "Release $(NEW_VERSION)"
	@echo "✅ Created tag $(NEW_VERSION)"
	@echo "💡 Push with: make tag-push"

# Create minor release (x.X.0)
release-minor: get-version  
	$(eval NEW_MINOR := $(shell echo $$(($(MINOR) + 1))))
	$(eval NEW_VERSION := v$(MAJOR).$(NEW_MINOR).0)
	@echo "Creating minor release: $(CURRENT_VERSION) → $(NEW_VERSION)"
	@git tag -a $(NEW_VERSION) -m "Release $(NEW_VERSION)"
	@echo "✅ Created tag $(NEW_VERSION)"
	@echo "💡 Push with: make tag-push"

# Create major release (X.0.0)
release-major: get-version
	$(eval NEW_MAJOR := $(shell echo $$(($(MAJOR) + 1))))
	$(eval NEW_VERSION := v$(NEW_MAJOR).0.0)
	@echo "Creating major release: $(CURRENT_VERSION) → $(NEW_VERSION)"
	@git tag -a $(NEW_VERSION) -m "Release $(NEW_VERSION)"
	@echo "✅ Created tag $(NEW_VERSION)"
	@echo "💡 Push with: make tag-push"

# List all git tags
tag-list:
	@echo "All git tags:"
	@git tag -l --sort=-version:refname

# Push tags to remote repository
tag-push:
	@echo "Pushing tags to remote..."
	@git push origin --tags
	@echo "✅ Tags pushed to remote repository"