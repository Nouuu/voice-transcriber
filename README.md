# 🎤 Voice Transcriber

[![Build](https://github.com/Nouuu/voice-transcriber/workflows/Build/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/build.yml)
[![Test](https://github.com/Nouuu/voice-transcriber/workflows/Test/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/test.yml)
[![Lint](https://github.com/Nouuu/voice-transcriber/workflows/Lint/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/lint.yml)
[![Security](https://github.com/Nouuu/voice-transcriber/workflows/Security/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/security.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.2.0-black)](https://bun.sh)

A lightweight desktop voice transcription application that records audio from your microphone and transcribes it using OpenAI's Whisper API, with optional GPT-based text formatting.

## ✨ Features

- **🎯 System Tray Integration**: Click to record, visual state feedback (green=idle, red=recording, purple=processing)
- **🎙️ High-Quality Recording**: Audio capture using arecord on Linux
- **🌍 Multilingual Support**: French/English auto-detection via Whisper API
- **✍️ Text Formatting**: Optional GPT-based grammar improvement
- **📋 Clipboard Integration**: Automatic result copying to clipboard

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

The application now uses a user configuration directory for better system integration.

**First Run Setup:**
1. Run the application - it will automatically create the config directory and show setup instructions
2. The config file will be created at: `~/.config/voice-transcriber/config.json`
3. Edit the config file and add your OpenAI API key:

```json
{
  "openaiApiKey": "your-openai-api-key-here",  
  "formatterEnabled": true
}
```

**Get your OpenAI API key:** https://platform.openai.com/api-keys

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

## How It Works

### Visual Flow

```
🟢 Idle/Ready State    →    🔴 Recording    →    🟣 Processing
Click to start         Speaking...         AI transcribing
```

### Menu Options

Right-click the tray icon for additional options:
- **🎤 Start Recording** - Begin voice capture
- **⏹️ Stop Recording** - End recording and transcribe
- **⚙️ Settings** - Future configuration options
- **❌ Quit** - Exit the application

### Language Support

Supports French/English auto-detection and mixed languages:
- **English**: "Can you please send me the meeting notes?"
- **French**: "Bonjour, j'aimerais prendre rendez-vous pour demain"
- **Mixed**: "Hello, je voudrais dire something important"

### Text Formatting (Optional)

When `formatterEnabled: true`:

**Raw**: "um so basically the meeting went really well and uh we should schedule another one"
**Formatted**: "The meeting went really well, and we should schedule another one."

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
make lint         # Run Biome linting
make format       # Format code with Biome
make format-check # Check code formatting and linting

# Release Management (Semantic Versioning)
make release-patch  # Create patch release (v1.0.0 → v1.0.1)
make release-minor  # Create minor release (v1.0.0 → v1.1.0)  
make release-major  # Create major release (v1.0.0 → v2.0.0)
make get-version   # Show current version from latest git tag
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

## 🔧 Development Status

### ✅ Completed Phases (1-4)

**Phase 1: Foundation** ✅
- Configuration system with API key management (37 lines, simplified from 164)
- Logging system with console output (37 lines, simplified from 280)

**Phase 2: Core Services** ✅  
- Audio recording with arecord backend (80 lines, simplified from 280)
- OpenAI Whisper transcription service (73 lines, simplified from complex)
- OpenAI GPT formatting service (70 lines, simplified from complex)

**Phase 3: System Integration** ✅
- System tray with 3 states and recreation workaround (100 lines, simplified from 381)
- Cross-platform clipboard service (66 lines, simplified from 460)

**Phase 4: Main Application** ✅
- Complete workflow: Record → Transcribe → Format → Clipboard
- Graceful shutdown handling and error management
- **All 35 tests passing** with comprehensive coverage

### 🎯 Implementation Philosophy
- **KEEP IT SIMPLE** - No overengineering
- **Minimal viable functionality** only  
- **Simple interfaces**: `{ success: boolean, error?: string }`
- **Test-driven development** approach
- **French/English auto-detection** support

### 🚧 Known Issues

#### ✅ Recently Fixed
1. ✅ **Config.json deletion**: FIXED - Unit tests no longer delete production config.json
2. ✅ **System tray icon updates**: FIXED - Implemented systray recreation workaround with recreation method
3. ✅ **CI/CD workflows**: FIXED - GitHub Actions now work properly with optimized caching and semantic versioning
4. ✅ **Release automation**: FIXED - Automatic changelog generation for both PRs and direct commits

#### Medium Priority  
5. **Test coverage**: May need assessment and improvement
6. **Audio compression**: Current audio files are heavy - needs compression
7. **Long audio handling**: Need proper handling for long audio files

## 🛣️ Future Roadmap

### Phase 5: Production Ready 🚀 (MAX PRIORITY)
- ✅ **🏠 User Config Directory**: COMPLETED - Config now uses ~/.config/voice-transcriber/ with first-run setup wizard
- **📦 npm Package**: Publish as installable npm package with global CLI
- **🌍 Extended Multilingual**: Support Spanish, German, Italian, Portuguese, Chinese, Japanese, etc.
- **✏️ Custom Format Prompts**: User-configurable GPT formatting instructions

### Phase 6: Core Improvements 🔧
- **🖥️ System Tray Optimization**: Fix recreation workaround that causes brief double icons (2 second overlap)
- **💾 File Saving**: Add option to save transcriptions to file instead of just clipboard
- **🗜️ Audio Optimization**: Implement audio compression to reduce file sizes
- **⏳ Long Audio Support**: Handle audio files longer than API limits

### Phase 7: User Interface & Platform 🖥️
- **💻 CLI Interface**: Command-line interface for automation and scripting
- **🪟 Windows Support**: Replace arecord with Windows-compatible audio recording
- **🍎 macOS Support**: Add macOS audio recording and system tray integration
- **⌨️ Keyboard Shortcuts**: Global shortcuts to trigger transcription
- **🖼️ Graphical Interface**: Desktop GUI for easier configuration and usage

### Phase 8: Technical Enhancements 📊
- **📈 Enhanced Logging**: More detailed logging with file output and rotation
- **📊 Usage Statistics**: Track and display transcription stats  
- **🛡️ Better Error Handling**: More robust error recovery and user feedback

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
- **Linting**: Biome (unified linting and formatting)
- **CI/CD**: GitHub Actions with APT and Bun dependency caching
- **Release**: Automated semantic versioning with changelog generation
