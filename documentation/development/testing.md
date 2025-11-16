---
title: Testing Guide
description: Comprehensive testing guide with strategies, patterns, and best practices for Voice Transcriber
tags:
  - expert
  - guide
  - development
  - testing
keywords: testing, tests, bun, unit, integration, mocks, tdd, coverage, quality, patterns
---

# Voice Transcriber - Testing Guide

## Testing Overview

The Voice Transcriber application uses Bun's built-in test runner with a comprehensive test suite covering all services. The testing strategy emphasizes simplicity, reliability, and maintainability following the project's core principles.

## Test Strategy

### Testing Philosophy

- **Keep It Simple**: Test core functionality, not edge cases
- **Focus on Behavior**: Test what the service does, not how it does it
- **Simple Mocks**: Use straightforward mocks, avoid complex scenarios
- **Maximum Coverage**: 5-6 tests per service focusing on critical paths
- **Fast Execution**: Tests should run quickly for TDD workflow

### Test Categories

1. **Unit Tests**: Individual service functionality
2. **Integration Tests**: Service interaction and full workflow
3. **Error Handling Tests**: Validation of error scenarios
4. **Mock Tests**: External dependency simulation

## Test Structure

### Current Test Coverage

```
Total Tests: 37 tests across all services
├── src/config/config.test.ts          (6 tests)
├── src/services/audio-recorder.test.ts (5 tests)
├── src/services/clipboard.test.ts      (5 tests)
├── src/services/formatter.test.ts      (6 tests)
├── src/services/system-tray.test.ts    (6 tests)
├── src/services/transcription.test.ts  (3 tests)
├── src/utils/logger.test.ts            (3 tests)
└── src/index.test.ts                   (3 tests)
```

### Test Organization Pattern

Each service follows a consistent test structure:

```typescript
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { ServiceClass } from "./service-name";

describe("ServiceClass", () => {
  let service: ServiceClass;
  let config: ServiceConfig;

  beforeEach(() => {
    // Reset mocks
    // Setup test configuration
    // Initialize service
  });

  describe("methodName", () => {
    it("should handle success case", async () => {
      // Test primary functionality
    });

    it("should handle error case", async () => {
      // Test error scenarios
    });

    it("should validate input", async () => {
      // Test input validation
    });
  });
});
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
make test

# Run tests in watch mode (for TDD)
make test-watch

# Run specific test file
make test-file FILE=src/services/system-tray.test.ts

# Run tests with verbose output
bun test --verbose

# Run tests with coverage analysis
bun test --coverage
```

### Test Output Interpretation

```bash
# Successful test run example
$ make test
✓ Config should load default configuration
✓ Config should handle missing config file
✓ SystemTrayService should initialize successfully
✓ TranscriptionService should handle API errors

37 tests passed
0 tests failed
```

**Test Status Indicators**:
- ✓ Test passed
- ✗ Test failed
- ⏸ Test skipped
- ⚠ Test had warnings

## Test Examples

### Unit Test Example - SystemTrayService

```typescript
// File: src/services/system-tray.test.ts

import { beforeEach, describe, expect, it, mock } from "bun:test";

// Mock external dependency
const mockSystray = {
  onClick: mock(),
  onReady: mock(),
  sendAction: mock(),
  kill: mock(),
};

const mockSysTrayConstructor = mock(() => mockSystray);

// Mock the module before importing
mock.module("node-systray-v2", () => ({
  SysTray: mockSysTrayConstructor,
}));

import { SystemTrayService, TrayState } from "./system-tray";

describe("SystemTrayService", () => {
  let service: SystemTrayService;
  let config: TrayConfig;

  beforeEach(() => {
    // Reset all mocks
    mockSysTrayConstructor.mockReset();
    mockSystray.onClick.mockReset();

    // Setup test configuration
    config = {
      callbacks: {
        onRecordingStart: mock(),
        onRecordingStop: mock(),
        onQuit: mock(),
      },
    };

    // Create service with mocked constructor
    service = new SystemTrayService(config, mockSysTrayConstructor);
  });

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      // Setup mock behavior
      mockSysTrayConstructor.mockReturnValue(mockSystray);
      mockSystray.onReady.mockImplementation(callback => callback());

      // Execute test
      const result = await service.initialize();

      // Verify results
      expect(result.success).toBe(true);
      expect(mockSysTrayConstructor).toHaveBeenCalled();
    });

    it("should handle constructor errors", async () => {
      // Setup error scenario
      mockSysTrayConstructor.mockImplementation(() => {
        throw new Error("Mock constructor failed");
      });

      // Execute test
      const result = await service.initialize();

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to initialize");
    });
  });
});
```

### Integration Test Example - Main Application

```typescript
// File: src/index.test.ts

import { describe, expect, it, mock } from "bun:test";
import { VoiceTranscriberApp } from "./index";

describe("VoiceTranscriberApp", () => {
  it("should fail to initialize without API key", async () => {
    const app = new VoiceTranscriberApp("/tmp/empty-config.json");
    const result = await app.initialize();

    expect(result.success).toBe(false);
    expect(result.error).toContain("API key not configured");
  });
});
```

### Mock Strategy Example - TranscriptionService

```typescript
// File: src/services/transcription.test.ts

import { beforeEach, describe, expect, it, mock } from "bun:test";
import { writeFileSync } from "node:fs";
import { TranscriptionService } from "./transcription";

// Create simple mock for OpenAI
const mockOpenAI = {
  audio: {
    transcriptions: {
      create: mock(),
    },
  },
};

describe("TranscriptionService", () => {
  let service: TranscriptionService;

  beforeEach(() => {
    // Reset mock between tests
    mockOpenAI.audio.transcriptions.create.mockReset();

    // Create service
    service = new TranscriptionService({
      apiKey: "test-key",
    });

    // Inject mock (bypassing private field)
    (service as any).openai = mockOpenAI;
  });

  describe("transcribe", () => {
    it("should handle API errors", async () => {
      // Create temp test file
      const tempFile = "/tmp/test-transcription.txt";
      writeFileSync(tempFile, "test audio content");

      // Setup mock to throw error
      mockOpenAI.audio.transcriptions.create.mockRejectedValueOnce(
        new Error("API Error")
      );

      // Execute test
      const result = await service.transcribe(tempFile);

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toContain("API Error");
    });
  });
});
```

## Testing Patterns

### Mock Setup Pattern

```typescript
// 1. Create mock objects
const mockDependency = {
  method1: mock(),
  method2: mock(),
};

// 2. Mock module before importing
mock.module("external-library", () => ({
  ExternalClass: mock(() => mockDependency),
}));

// 3. Import after mocking
import { ServiceToTest } from "./service";

// 4. Reset mocks in beforeEach
beforeEach(() => {
  mockDependency.method1.mockReset();
  mockDependency.method2.mockReset();
});
```

### Error Testing Pattern

```typescript
it("should handle service errors", async () => {
  // Setup error scenario
  mockDependency.method.mockRejectedValueOnce(new Error("Test Error"));

  // Execute operation
  const result = await service.doSomething();

  // Verify error handling
  expect(result.success).toBe(false);
  expect(result.error).toContain("Test Error");
});
```

### File System Testing Pattern

```typescript
it("should handle file operations", async () => {
  // Create temporary test file
  const tempFile = "/tmp/test-file.txt";
  writeFileSync(tempFile, "test content");

  // Test file operation
  const result = await service.processFile(tempFile);

  // Verify results
  expect(result.success).toBe(true);

  // Cleanup handled by OS (/tmp)
});
```

### Async Testing Pattern

```typescript
it("should handle async operations", async () => {
  // Setup async mock
  mockDependency.asyncMethod.mockResolvedValueOnce({
    data: "test result"
  });

  // Execute async operation
  const result = await service.asyncOperation();

  // Verify async result
  expect(result.success).toBe(true);
  expect(result.data).toBe("test result");
});
```

## Test Data Management

### Configuration Testing

```typescript
// Test configuration objects
const validConfig = {
  apiKey: "test-key",
  enabled: true
};

const invalidConfig = {
  apiKey: "", // Invalid empty key
  enabled: true
};

// Use in tests
it("should validate configuration", () => {
  expect(() => new Service(validConfig)).not.toThrow();
  expect(() => new Service(invalidConfig)).toThrow();
});
```

### File Testing

```typescript
// Create test files in /tmp
const createTestFile = (content: string): string => {
  const tempFile = `/tmp/test-${Date.now()}.txt`;
  writeFileSync(tempFile, content);
  return tempFile;
};

// Use in tests
it("should process files", async () => {
  const testFile = createTestFile("test audio data");
  const result = await service.processFile(testFile);
  expect(result.success).toBe(true);
});
```

## Test Development Workflow

### Test-Driven Development (TDD)

```bash
# 1. Start test watcher
make test-watch

# 2. Write failing test
it("should do something new", async () => {
  const result = await service.newMethod();
  expect(result.success).toBe(true);
});

# 3. Implement minimum code to pass
public async newMethod(): Promise<ServiceResult> {
  return { success: true };
}

# 4. Refactor while keeping tests green
# 5. Repeat cycle
```

### Adding New Tests

```bash
# 1. Create test file alongside source
touch src/services/new-service.test.ts

# 2. Follow test structure pattern
# 3. Run specific test during development
make test-file FILE=src/services/new-service.test.ts

# 4. Run full suite to ensure no regressions
make test
```

### Debugging Test Failures

```typescript
// Add debug logging to tests
it("should debug test issue", async () => {
  console.log("Debug: service state", service);

  const result = await service.doSomething();

  console.log("Debug: result", result);
  expect(result.success).toBe(true);
});
```

```bash
# Run single test with verbose output
bun test src/services/service.test.ts --verbose

# Add temporary console.log statements
# Remove debug code before committing
```

## Common Testing Issues

### Mock Issues

**Problem**: Mock not working as expected
```typescript
// Wrong - mock after import
import { Service } from "./service";
mock.module("dependency", () => ({ Mock: mock() }));

// Right - mock before import
mock.module("dependency", () => ({ Mock: mock() }));
import { Service } from "./service";
```

**Solution**: Always mock modules before importing the service under test.

### Async Issues

**Problem**: Test fails intermittently
```typescript
// Wrong - not awaiting async operation
it("should handle async", () => {
  service.asyncMethod(); // Missing await
  expect(mockDependency.method).toHaveBeenCalled();
});

// Right - properly await async operations
it("should handle async", async () => {
  await service.asyncMethod();
  expect(mockDependency.method).toHaveBeenCalled();
});
```

### File System Issues

**Problem**: Tests interfere with each other
```typescript
// Wrong - using same file names
const testFile = "/tmp/test.txt";

// Right - unique file names
const testFile = `/tmp/test-${Date.now()}.txt`;
```

### Mock Reset Issues

**Problem**: Mocks retain state between tests
```typescript
// Wrong - no reset between tests
describe("Service", () => {
  it("test 1", () => { /* uses mock */ });
  it("test 2", () => { /* mock still has state from test 1 */ });
});

// Right - reset in beforeEach
beforeEach(() => {
  mockDependency.method.mockReset();
});
```

## Performance Testing

### Test Execution Speed

```bash
# Measure test execution time
time make test

# Profile individual test files
time bun test src/services/system-tray.test.ts
```

### Memory Usage Testing

```typescript
// Basic memory usage check
it("should not leak memory", async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  // Perform operations
  for (let i = 0; i < 100; i++) {
    await service.doSomething();
  }

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;

  // Should not increase significantly
  expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
});
```

## Test Maintenance

### Keeping Tests Updated

1. **Update tests when APIs change**
2. **Remove tests for deleted functionality**
3. **Add tests for new features**
4. **Refactor tests when refactoring code**

### Test Quality Checklist

- [ ] Tests are focused and test one thing
- [ ] Tests have descriptive names
- [ ] Tests use appropriate mocks
- [ ] Tests clean up after themselves
- [ ] Tests are deterministic (no random failures)
- [ ] Tests run quickly (< 100ms each)

### Common Maintenance Tasks

```bash
# Update all test dependencies
bun update

# Check for unused test files
find src -name "*.test.ts" -exec grep -L "describe\|it\|test" {} \;

# Validate test naming conventions
grep -r "it\|test" src --include="*.test.ts" | grep -v "should"
```

This testing guide provides comprehensive information for understanding, writing, and maintaining tests in the Voice Transcriber application. Follow these patterns to ensure robust and maintainable test coverage.

## Related Pages

- [Development Guide](development-guide.md) - Development workflow and setup
- [API Reference](api-reference.md) - Service interfaces and methods to test
- [Technical Architecture](architecture.md) - System architecture and components
- [Contributing Guide](../contributing.md) - Contributing guidelines and testing requirements