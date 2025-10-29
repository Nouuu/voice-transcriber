---
title: Development Guide
description: Complete development guide for contributing to and extending Voice Transcriber
tags:
  - expert
  - guide
  - development
  - setup
keywords: development, contributing, workflow, setup, makefile, typescript, bun, patterns, debugging
---

# Voice Transcriber - Development Guide

## Quick Start

### Prerequisites

**System Requirements**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install alsa-utils xsel curl

# Verify installations
which arecord  # Should return /usr/bin/arecord
which xsel     # Should return /usr/bin/xsel
```

**Runtime Requirements**:
- **Bun**: ≥1.2.0 (development)
- **Node.js**: ≥22 (production/npm)
- **OpenAI API Key**: From https://platform.openai.com/api-keys

### Initial Setup

```bash
# Clone repository
git clone https://github.com/Nouuu/voice-transcriber.git
cd voice-transcriber

# Install dependencies
make install

# Verify system dependencies
make check-deps

# Setup configuration
cp config.example.json config.json
# Edit config.json and add your OpenAI API key
```

### First Run

```bash
# Run tests to verify setup
make test

# Start development mode
make dev

# The app will prompt for API key if not configured
# Look for green system tray icon
```

## Development Workflow

### Daily Development Loop

1. **Start Development Mode**
   ```bash
   make dev  # Auto-reload on file changes
   ```

2. **Code Changes**
   - Edit TypeScript files in `src/`
   - Bun automatically recompiles and restarts
   - Check console for errors/logs

3. **Test Changes**
   ```bash
   # Run all tests
   make test

   # Run specific test file
   make test-file FILE=src/services/system-tray.test.ts

   # Watch mode for TDD
   make test-watch
   ```

4. **Code Quality**
   ```bash
   # Check formatting and linting
   make format-check

   # Fix formatting issues
   make format
   ```

5. **Build & Verify**
   ```bash
   # Build for production
   make build

   # Test production build
   node dist/index.js
   ```

### Project Structure

```
voice-transcriber/
├── src/                    # Source code
│   ├── index.ts           # Main application entry
│   ├── config/            # Configuration management
│   │   ├── config.ts
│   │   └── config.test.ts
│   ├── services/          # Core services
│   │   ├── audio-recorder.ts
│   │   ├── system-tray.ts
│   │   ├── transcription.ts
│   │   ├── formatter.ts
│   │   ├── clipboard.ts
│   │   └── *.test.ts      # Unit tests
│   └── utils/             # Utilities
│       ├── logger.ts
│       └── logger.test.ts
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md
│   ├── API_REFERENCE.md
│   └── DEVELOPMENT_GUIDE.md
├── assets/                # Icons and resources
│   ├── icon-idle.png
│   ├── icon-recording.png
│   └── icon-processing.png
├── dist/                  # Built application
├── Makefile              # Development commands
└── package.json          # Dependencies and scripts
```

## Available Make Commands

### Core Commands
```bash
make help          # Show all available commands
make install       # Install bun dependencies
make run          # Run the application
make dev          # Run in development mode with watch
make build        # Build for production
make clean        # Clean build artifacts and temporary files
```

### Testing Commands
```bash
make test         # Run all tests with bun test
make test-watch   # Run tests in watch mode
make test-file    # Run specific test (usage: make test-file FILE=path/to/test.ts)
```

### Code Quality Commands
```bash
make lint         # Run ESLint linting
make format       # Format code with Prettier
make format-check # Check code formatting and linting
make check-deps   # Check system dependencies
```

### Release Commands
```bash
make release-patch  # Create patch release (x.x.X) - Bug fixes
make release-minor  # Create minor release (x.X.0) - New features
make release-major  # Create major release (X.0.0) - Breaking changes
make get-version   # Show current version from package.json
make pre-release   # Validate code before release
```

## Development Patterns

### Service Development Pattern

All services follow a consistent pattern:

```typescript
// 1. Define interfaces
export interface ServiceConfig {
  // Configuration options
}

export interface ServiceResult {
  success: boolean;
  error?: string;
  // Additional result data
}

// 2. Implement service class
export class MyService {
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  public async doSomething(): Promise<ServiceResult> {
    try {
      // Implementation logic
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Operation failed: ${error}`
      };
    }
  }
}
```

### Error Handling Pattern

```typescript
// Services never throw - always return result objects
const result = await service.doSomething();

if (!result.success) {
  logger.error(`Service failed: ${result.error}`);
  // Handle error appropriately
  return;
}

// Use result data
console.log('Success:', result.data);
```

### Testing Pattern

```typescript
import { describe, test, expect } from "bun:test";
import { MyService } from "./my-service";

describe("MyService", () => {
  test("should handle success case", async () => {
    const service = new MyService({ /* config */ });
    const result = await service.doSomething();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("should handle error case", async () => {
    const service = new MyService({ /* invalid config */ });
    const result = await service.doSomething();

    expect(result.success).toBe(false);
    expect(result.error).toContain("expected error message");
  });
});
```

## Code Quality Guidelines

### Simplicity Principles

**✅ What to Implement**:
- Basic error handling (try/catch, return success/error)
- Simple configuration loading from JSON
- Direct API calls to OpenAI (Whisper + GPT)
- Basic audio recording (start/stop/save)
- Simple system tray with 3 states
- Console logging (info/error only)

**❌ What to Avoid**:
- Complex retry logic with exponential backoff
- Advanced statistics tracking and usage metrics
- Batch processing capabilities
- Complex validation with detailed error messages
- Advanced logging with rotation and file management

### Service Guidelines

- **Size**: Keep services under 100 lines each
- **Methods**: 3-5 core methods maximum per service
- **Interfaces**: Use simple `{ success: boolean, error?: string }` pattern
- **Dependencies**: Minimize external dependencies
- **Single Responsibility**: Each service has one clear purpose

### TypeScript Guidelines

```typescript
// Use explicit interfaces
interface MyConfig {
  apiKey: string;
  enabled: boolean;
}

// Use type-safe result objects
interface MyResult {
  success: boolean;
  data?: MyData;
  error?: string;
}

// Use async/await consistently
public async doWork(): Promise<MyResult> {
  // Implementation
}

// Use proper error handling
try {
  const result = await externalService();
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: `Failed: ${error}` };
}
```

### File Organization

```typescript
// File: src/services/my-service.ts

// 1. Imports
import { external } from "external-package";
import { internal } from "../utils/internal";

// 2. Interfaces
export interface MyConfig { }
export interface MyResult { }

// 3. Implementation
export class MyService {
  // Private fields first
  private config: MyConfig;

  // Constructor
  constructor(config: MyConfig) { }

  // Public methods
  public async method(): Promise<MyResult> { }

  // Private methods last
  private helper(): void { }
}
```

## Testing Strategy

### Test Organization

```
src/services/
├── audio-recorder.ts
├── audio-recorder.test.ts    # Unit tests for audio recorder
├── system-tray.ts
├── system-tray.test.ts       # Unit tests for system tray
└── ...
```

### Testing Commands

```bash
# Run all tests (37 tests total)
make test

# Run specific service tests
make test-file FILE=src/services/system-tray.test.ts

# Watch mode for TDD
make test-watch

# Test with coverage (manual analysis)
bun test --coverage
```

### Test Categories

1. **Unit Tests**: Individual service functionality
2. **Integration Tests**: Service interaction (index.test.ts)
3. **Mock Tests**: External API simulation
4. **Error Tests**: Error handling validation

### Testing Best Practices

```typescript
describe("Service Tests", () => {
  test("success case - primary functionality", async () => {
    // Test main use case
  });

  test("error case - invalid input", async () => {
    // Test error handling
  });

  test("edge case - boundary conditions", async () => {
    // Test edge cases only if critical
  });
});

// Keep tests simple and focused
// Maximum 5-6 tests per service
// Test behavior, not implementation
```

### Mock Strategy

```typescript
// Simple mocks for external dependencies
const mockOpenAI = {
  audio: {
    transcriptions: {
      create: async () => ({ text: "mock transcription" })
    }
  }
};

// Inject mocks via constructor
const service = new TranscriptionService(config, mockOpenAI);
```

## Debugging

### Common Development Issues

**Application Won't Start**:
```bash
# Check system dependencies
make check-deps

# Verify API key in config
cat config.json | grep apiKey

# Check Bun installation
bun --version
```

**System Tray Not Visible**:
```bash
# Test different desktop environments
echo $XDG_CURRENT_DESKTOP

# Check system tray support
ps aux | grep -i tray

# Try manual icon update
# Restart window manager if needed
```

**Audio Recording Issues**:
```bash
# Test arecord directly
arecord -l  # List audio devices
arecord -D default -f cd -t wav test.wav  # Test recording

# Check ALSA configuration
cat /proc/asound/cards
```

**API Issues**:
```bash
# Test API key manually
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.openai.com/v1/models

# Check rate limits
# Monitor API usage in OpenAI dashboard
```

### Logging and Diagnostics

**Console Output**:
```bash
# Development mode shows all logs
make dev

# Production mode - minimal logging
make run
```

**Debug Mode**:
```typescript
// Add temporary debug logging
console.log("Debug:", { variable, state });

// Use logger for permanent logging
logger.info("Operation completed");
logger.error("Operation failed");
```

**File System Debugging**:
```bash
# Check temp files
ls -la /tmp/transcriber/

# Check config file
cat ~/.config/voice-transcriber/config.json

# Monitor file creation
watch -n 1 'ls -la /tmp/transcriber/'
```

## Building and Distribution

### Development Build

```bash
# Build for testing
make build

# Output: dist/index.js (single file)
# Test build
node dist/index.js
```

### Production Release Process

```bash
# 1. Validate code quality
make pre-release

# 2. Update version and create git tag
make release-patch  # or release-minor, release-major

# 3. Verify build
make build
make test

# 4. Publish to npm (manual step)
npm publish
```

### Build Configuration

```typescript
// bun build configuration (package.json)
{
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target node --format esm"
  }
}
```

### Asset Handling

- **Icons**: Embedded as Base64 in TypeScript files
- **Config**: Template provided as `config.example.json`
- **Dependencies**: Bundled in single output file

## Performance Optimization

### Development Performance

```bash
# Fast restart in development
make dev  # Uses --watch flag for instant reload

# Fast testing
make test-file FILE=specific-test.ts

# Parallel testing (automatic with bun)
bun test  # Runs tests in parallel by default
```

### Production Performance

- **Bundle Size**: ~2MB single file (including dependencies)
- **Memory Usage**: ~50MB base + 30MB during processing
- **Startup Time**: <1 second on modern hardware
- **API Latency**: Depends on OpenAI response times

### Optimization Tips

1. **Minimize API Calls**: Batch operations when possible
2. **Audio Compression**: Consider implementing before API upload
3. **Caching**: Cache successful configurations
4. **Error Recovery**: Implement graceful degradation

## Contributing Guidelines

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Keep commits small and focused
# Use conventional commit messages
```

### Commit Message Format

```bash
# Format: type: description
feat: add system tray icon updates
fix: resolve menu actions not working
refactor: simplify clipboard service
test: add system tray state tests
docs: update development guide
chore: update dependencies

# Keep under 50 characters
# Use present tense
# No capitalization after colon
# No period at end
```

### Code Review Checklist

- [ ] Follows simplicity principles
- [ ] Has unit tests for new functionality
- [ ] Uses consistent error handling pattern
- [ ] Maintains under 100 lines per service
- [ ] Includes appropriate logging
- [ ] Updates documentation if needed
- [ ] Passes all existing tests

### Pull Request Process

1. **Create Feature Branch**: `git checkout -b feature/description`
2. **Implement Changes**: Follow development patterns
3. **Add Tests**: Ensure new functionality is tested
4. **Update Docs**: If API or behavior changes
5. **Run Quality Checks**: `make format-check && make test`
6. **Create PR**: With clear description and testing notes
7. **Code Review**: Address feedback and iterate
8. **Merge**: Squash commits for clean history

## Advanced Topics

### Custom Icon Development

```bash
# Create new icons (128x128 PNG)
# Convert to Base64
base64 -w 0 icon.png > icon.base64

# Update src/services/system-tray.ts
# Add to iconsBase64 object
```

### API Integration Testing

```typescript
// Create integration test with real API
const integrationTest = process.env.TEST_WITH_REAL_API;

if (integrationTest) {
  // Test with real OpenAI API
  // Use test API key with low limits
} else {
  // Use mocks for regular testing
}
```

### Performance Profiling

```bash
# Profile memory usage
bun --heap-usage src/index.ts

# Profile startup time
time bun run src/index.ts

# Monitor system resources
htop  # CPU and memory usage
iotop # Disk I/O usage
```

### Cross-Platform Development

```typescript
// Platform detection
import { platform } from "node:os";

switch (platform()) {
  case 'linux':
    // Linux-specific code (arecord)
    break;
  case 'win32':
    // Windows-specific code (future)
    break;
  case 'darwin':
    // macOS-specific code (future)
    break;
}
```

This development guide provides comprehensive information for contributing to and extending the Voice Transcriber application. Follow these patterns and practices to maintain code quality and consistency.

## Related Pages

- [Technical Architecture](architecture.md) - System architecture and design principles
- [API Reference](api-reference.md) - Complete API documentation
- [Testing Guide](testing.md) - Testing strategies and best practices
- [Contributing Guide](../contributing.md) - Contributing guidelines and workflow