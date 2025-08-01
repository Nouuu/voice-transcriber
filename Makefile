# Transcriber Voice Application Makefile

.PHONY: help install run dev test test-watch test-file clean build check-deps

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
	@bun run check-deps