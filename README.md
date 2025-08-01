# 🎤 Voice Transcriber

A lightweight desktop voice transcription application that records audio from your microphone and transcribes it using OpenAI's Whisper API, with optional GPT-based text formatting.

## ✨ Features

- **🎯 System Tray Integration**: Click to record, visual state feedback (green=idle, red=recording, purple=processing)
- **🎙️ High-Quality Recording**: Audio capture using arecord on Linux
- **🌍 Multilingual Support**: French/English auto-detection via Whisper API
- **✍️ Text Formatting**: Optional GPT-based grammar improvement
- **📋 Clipboard Integration**: Automatic result copying to clipboard
- **🧪 Full Test Coverage**: 35/35 tests passing
- **🔐 Secure Configuration**: API key protection with gitignore

## 🚀 Quick Start

### Prerequisites

```bash
# Install system dependencies (Ubuntu/Linux)
sudo apt-get update
sudo apt-get install alsa-utils

# Verify system dependencies
make check-deps
```

### Installation & Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd transcriber
make install
```

### Configuration

1. Copy the example configuration:
```bash
cp config.example.json config.json
```

2. Add your OpenAI API key to `config.json`:
```json
{
  "openaiApiKey": "your-openai-api-key-here",  
  "formatterEnabled": true
}
```

### Usage

```bash
# Run the application
make run

# Or run in development mode
make dev
```

1. Look for the system tray icon (green circle when idle)
2. Click the tray icon or menu to start/stop recording  
3. Transcribed text is automatically copied to your clipboard

## 🛠️ Development

### Available Make Commands

```bash
make help          # Show all available commands
make install       # Install dependencies
make run          # Run the application
make dev          # Run in development mode with watch
make test         # Run all tests
make test-watch   # Run tests in watch mode
make test-file    # Run specific test (usage: make test-file FILE=path/to/test.ts)
make clean        # Clean build artifacts and temporary files
make build        # Build for production
make check-deps   # Check system dependencies
```

### Project Structure

```
transcriber/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── config/
│   │   ├── config.ts         # Configuration management
│   │   └── config.test.ts
│   ├── services/
│   │   ├── audio-recorder.ts # Audio recording service
│   │   ├── transcription.ts  # OpenAI Whisper integration
│   │   ├── formatter.ts      # OpenAI GPT formatting
│   │   ├── clipboard.ts      # Cross-platform clipboard
│   │   └── system-tray.ts    # System tray management
│   └── utils/
│       └── logger.ts         # Simple logging utility
├── assets/
│   ├── icon-idle.png         # Tray icon (idle state)
│   ├── icon-recording.png    # Tray icon (recording)
│   └── icon-processing.png   # Tray icon (processing)  
├── Makefile                  # Development commands
├── config.example.json       # Configuration template
└── package.json
```

### Development Workflow

```bash
# Install dependencies
make install

# Check system requirements
make check-deps

# Run tests (recommended before development)
make test

# Start development with auto-reload
make dev

# Run specific test file
make test-file FILE=src/services/system-tray.test.ts

# Clean up temporary files
make clean
```

### Architecture Guidelines

**🎯 Keep It Simple - No Overengineering**

- ✅ Basic error handling (`{ success: boolean, error?: string }`)
- ✅ Simple configuration loading from JSON
- ✅ Direct API calls to OpenAI (Whisper + GPT)
- ✅ Basic audio recording (start/stop/save)
- ✅ Simple system tray with 3 states
- ✅ Console logging (info/error only)

**❌ What We Avoid:**
- Complex retry logic with exponential backoff
- Advanced statistics tracking and usage metrics
- Batch processing capabilities
- Complex validation with detailed error messages
- Advanced logging with rotation and file management

Each service has 3-5 core methods maximum, following single responsibility principle.

## 🧪 Testing

All services have comprehensive test coverage with simple mocks:

```bash
# Run all tests
make test

# Run tests in watch mode during development
make test-watch

# Run specific test file
make test-file FILE=src/services/system-tray.test.ts
```

**Testing Philosophy:**
- Test core functionality, not edge cases
- Use simple mocks, avoid complex scenarios
- Maximum 5-6 tests per service
- Focus on: success cases, basic error handling, input validation

## 🔧 Current Status

### ✅ Completed (Phase 1-4)
- **Configuration & Logging**: JSON config with API key management
- **Audio Recording & OpenAI Integration**: Whisper transcription + GPT formatting
- **System Tray & Clipboard**: Native tray integration with state management
- **Main Application**: Complete workflow implementation
- **All 35 tests passing**
- **French/English multilingual support**
- **System tray icon updates** (recreation workaround)

### 🚧 Known Issues

#### High Priority
1. **Config.json deletion**: Unit tests may be deleting the config.json file - needs investigation

#### Medium Priority  
2. **Test coverage**: May need assessment and improvement
3. **Audio compression**: Current audio files are heavy - needs compression
4. **Long audio handling**: Need proper handling for long audio files

## 🛣️ Future Roadmap

### Phase 5: Core Enhancements
- **File saving**: Add option to save transcriptions to file
- **Audio optimization**: Implement audio compression
- **Long audio support**: Handle files longer than API limits

### Phase 6: User Interface Improvements
- **CLI interface**: Command-line interface for automation
- **Keyboard shortcuts**: Global shortcuts to trigger transcription
- **Graphical interface**: Desktop GUI for easier configuration

### Phase 7: Technical Improvements
- **Enhanced logging**: More detailed logging with file output
- **Usage statistics**: Track and display transcription stats
- **Better error handling**: More robust error recovery

## 🤝 Contributing

### Git Commit Guidelines

Use **Conventional Commits** with minimal descriptions:

```bash
git commit -m "feat: add system tray icon updates"
git commit -m "fix: resolve menu actions not working"
git commit -m "refactor: simplify clipboard service"
git commit -m "test: add system tray state tests"
git commit -m "docs: update README with roadmap"
```

**Rules:**
- Keep descriptions under 50 characters
- Use present tense ("add" not "added")
- No capitalization after colon
- No period at the end

### Development Workflow

1. `make install` - Install dependencies
2. `make check-deps` - Verify system requirements
3. `make test` - Run tests before development
4. Follow the simplification guidelines
5. Write tests first (TDD approach)
6. Keep services under 100 lines each
7. Use simple interfaces and avoid overengineering
8. `make test` - Run tests before committing

## 📄 License

This project was created using `bun init` with [Bun](https://bun.sh) runtime.

## 🔗 Tech Stack

- **Runtime**: Bun with TypeScript
- **Audio**: node-audiorecorder (arecord backend)  
- **AI**: OpenAI SDK (Whisper + GPT)
- **System Tray**: systray2
- **Clipboard**: clipboardy
- **Testing**: Bun test runner
- **Build**: Makefile with development commands
