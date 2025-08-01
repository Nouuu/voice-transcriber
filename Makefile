# Transcriber Voice Application Makefile

.PHONY: help install run dev test test-watch test-file clean build check-deps lint format format-check audit

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
	@echo "  make lint        - Run TypeScript type checking"
	@echo "  make format      - Format code with Prettier"
	@echo "  make format-check - Check code formatting"
	@echo "  make audit       - Run security audit"

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

# Run TypeScript type checking
lint:
	@echo "Running TypeScript type checking..."
	bunx tsc --noEmit

# Format code with Prettier
format:
	@echo "Formatting code with Prettier..."
	bunx prettier --write "src/**/*.{ts,js,json}"

# Check code formatting
format-check:
	@echo "Checking code formatting..."
	bunx prettier --check "src/**/*.{ts,js,json}"

# Run security audit
audit:
	@echo "Running security audit..."
	bun audit