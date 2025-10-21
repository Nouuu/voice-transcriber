# 🎤 Voice Transcriber

Lightweight desktop voice-to-text transcription with OpenAI Whisper and system tray integration

[![Build](https://github.com/Nouuu/voice-transcriber/actions/workflows/build.yml/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/build.yml)
[![Test](https://github.com/Nouuu/voice-transcriber/actions/workflows/test.yml/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Nouuu/voice-transcriber/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.2.0-black)](https://bun.sh)

## 📚 Documentation

**Complete documentation available at: [nouuu.github.io/voice-transcriber](https://nouuu.github.io/voice-transcriber/)**

- [Installation Guide](https://nouuu.github.io/voice-transcriber/latest/getting-started/installation/)
- [Configuration](https://nouuu.github.io/voice-transcriber/latest/getting-started/configuration/)
- [User Guide](https://nouuu.github.io/voice-transcriber/latest/user-guide/basic-usage/)
- [Development Guide](https://nouuu.github.io/voice-transcriber/latest/development/development-guide/)
- [Speaches Self-Hosting](https://nouuu.github.io/voice-transcriber/latest/advanced/speaches-integration/)

## ✨ Features

- **🎯 System Tray Integration**: Click to record, visual state feedback (green=idle, red=recording, purple=processing)
- **⚙️ Live Configuration Management**: Edit config and reload without restart - switch backends, languages, API keys on-the-fly
- **🎙️ High-Quality Recording**: Audio capture using arecord on Linux
- **🌍 Multilingual Support**: French, English, Spanish, German, Italian with strong language enforcement
- **✍️ Text Formatting**: Optional GPT-based grammar improvement
- **📋 Clipboard Integration**: Automatic result copying to clipboard
- **🏠 Self-Hosted Option**: Run 100% offline with [Speaches](https://github.com/speaches-ai/speaches) - same quality as OpenAI Whisper, zero cost, complete privacy
- **🔄 Smart Reload**: Configuration validation with automatic rollback on errors

## 🚀 Quick Start

### Prerequisites

Before installing, ensure you have:

1. **Bun runtime** (≥1.2.0)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **System dependencies** (Ubuntu/Linux)
   ```bash
   sudo apt-get update
   sudo apt-get install alsa-utils xsel
   ```

### Installation

**One-Command Setup (Recommended)**

```bash
# Clone and setup everything
git clone https://github.com/Nouuu/voice-transcriber.git
cd voice-transcriber
make setup
```

This command will:
- ✅ Check all system dependencies (Bun, arecord, xsel)
- ✅ Install Bun dependencies
- ✅ Create configuration file at `~/.config/voice-transcriber/config.json`

**Configure OpenAI API key**
```bash
nano ~/.config/voice-transcriber/config.json
```

Add your OpenAI API key:
```json
{
  "language": "en",
  "formatterEnabled": true,
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-your-api-key-here"
    }
  }
}
```

**Get your OpenAI API key:** https://platform.openai.com/api-keys

**For detailed configuration options**, see the [Configuration Guide](https://nouuu.github.io/voice-transcriber/latest/getting-started/configuration/)

### Global Installation (Optional)

Install the `voice-transcriber` command globally:

```bash
make install-global
```

This allows you to run the application from anywhere.

### Running the Application

```bash
# If installed globally
voice-transcriber

# Or from project directory
make run

# Enable debug mode for detailed logging (benchmarks, file sizes, timings)
voice-transcriber --debug
# or
make run ARGS="--debug"
```

### Debug Mode

Enable debug mode to see detailed information about:
- **File sizes**: WAV and MP3 file sizes with compression ratios
- **Audio format**: Sample rate, channels, conversion details
- **Processing times**: Breakdown of upload, processing, and response times
- **Transcription details**: Character count, duration metrics

**Example debug output:**
```
2025-10-11T10:30:15.123Z [DEBUG] WAV file size: 2.45 MB (2569216 bytes)
2025-10-11T10:30:15.125Z [DEBUG] WAV format: 2 channel(s), 44100 Hz sample rate
2025-10-11T10:30:15.234Z [DEBUG] MP3 file size: 0.62 MB (650240 bytes)
2025-10-11T10:30:15.234Z [DEBUG] Compression ratio: 74.7% size reduction
2025-10-11T10:30:15.234Z [DEBUG] WAV to MP3 conversion completed in 0.11 seconds
2025-10-11T10:30:16.789Z [INFO] OpenAI transcription completed in 1.55s
2025-10-11T10:30:16.789Z [DEBUG]   └─ Estimated breakdown: upload ~0.47s, processing ~0.93s, receive ~0.16s
2025-10-11T10:30:16.789Z [DEBUG]   └─ Transcription length: 142 characters
```

### Usage

1. Look for the system tray icon (green circle when idle)
2. Click the tray icon or menu to start/stop recording
3. Transcribed text is automatically copied to your clipboard

### Uninstall

To remove the global command:
```bash
make uninstall-global
```

## How It Works

### Visual Flow

```
🟢 Idle/Ready State    →    🔴 Recording    →    🟣 Processing
   Click to start              Speaking...          AI transcribing
```

### System Tray Menu

Right-click the tray icon for menu options:

```
🎤 Voice Transcriber
├── ⚙️ Open Config     - Open configuration in default editor
├── 🔄 Reload Config   - Reload config without restart (idle only)
├── 🎙️ Start Recording - Begin voice capture
├── ⏹️ Stop Recording  - End recording and transcribe
└── ❌ Exit           - Exit the application
```
- When **idle** (🟢): Start/Open/Reload/Exit enabled, Stop disabled
- When **recording** (🔴): Stop/Open/Exit enabled, Start/Reload disabled
- When **processing** (🟣): Open/Exit enabled, Start/Stop/Reload disabled

**New: Live Configuration Management** - Edit your config file and reload without restarting the app. Perfect for testing different languages, switching backends, or updating API keys.
- When **recording** (🔴): "Start Recording" is disabled, "Stop Recording" is enabled
- When **processing** (🟣): Both recording options are disabled

**For detailed configuration**, language support, backends (OpenAI vs Speaches), and benchmark mode, see the [Configuration Guide](https://nouuu.github.io/voice-transcriber/latest/getting-started/configuration/)

## 🛠️ Development

### Available Make Commands

```bash
make help          # Show all available commands

# 🚀 Setup & Installation
make install-global     # Install voice-transcriber command globally
make uninstall-global   # Uninstall global voice-transcriber command
make setup              # Complete setup (system deps + bun deps + config)
make check-system-deps  # Check system dependencies (Bun, arecord, xsel)
make init-config        # Initialize config file in ~/.config/voice-transcriber/
make install            # Install bun dependencies only

# ▶️ Running
make run                # Run the application
make dev                # Run in development mode with watch
make test-file FILE=... # Run specific test file
# 🧪 Testing & Quality
make test               # Run all tests
make test-watch         # Run tests in watch mode
make test-file          # Run specific test (usage: make test-file FILE=path/to/test.ts)
# 📚 Documentation
make docs-install       # Install MkDocs and required plugins
make docs-build         # Build documentation site
make docs-serve         # Serve documentation locally at http://127.0.0.1:8000
make docs-deploy        # Deploy documentation to GitHub Pages

make lint               # Run ESLint linting
make format             # Format code with Prettier
make format-check       # Check code formatting and linting
# 🛠️ Utilities
make clean              # Clean build artifacts and temporary files
make build              # Build for production
make check-deps         # Alias for check-system-deps (legacy)
make audit              # Run security audit on dependencies
make release-patch      # Create patch release (x.x.X) - Bug fixes
make release-minor      # Create minor release (x.X.0) - New features
make release-major      # Create major release (X.0.0) - Breaking changes
make get-version        # Show current version from package.json
make pre-release        # Validate code before release (linting, tests, git status)
```

### Project Structure

```
voice-transcriber/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── config/
│   │   ├── config.ts         # Configuration management
│   │   └── config.test.ts
│   ├── services/
│   │   ├── audio-recorder.ts # Audio recording service
│   │   ├── transcription.ts  # OpenAI Whisper integration
│       ├── logger.ts         # Simple logging utility
│       └── mp3-encoder.ts    # MP3 audio compression
│   │   ├── clipboard.ts      # Cross-platform clipboard
│   │   └── system-tray.ts    # System tray management
│   └── utils/
│       └── logger.ts         # Simple logging utility
├── documentation/            # MkDocs documentation source
│   ├── icon-recording.png    # Tray icon (recording)
│   └── icon-processing.png   # Tray icon (processing)
├── dist/                     # Built application (generated)
│   └── index.js              # Bundled application
├── Makefile                  # Development commands
├── config.example.json       # Configuration template
└── package.json
```
# First-time setup
### Development Workflow

```bash
# First-time setup (if not done already)
make setup

# Check system requirements
make check-system-deps

# Run tests (recommended before development)
make test

# Start development with auto-reload
make dev

# Run specific test file
make test-file FILE=src/services/system-tray.test.ts

# Format and lint code
make format-check

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
- Live configuration management with validation and rollback
- **All 93 tests passing** with comprehensive coverage (including config management tests)
- Cross-platform clipboard service (66 lines, simplified from 460)

**Phase 4: Main Application** ✅
- Complete workflow: Record → Transcribe → Format → Clipboard
- Graceful shutdown handling and error management
- **All 49 tests passing** with comprehensive coverage (including MP3 encoder tests)

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
5. ✅ **Asset resolution**: FIXED - Modern import.meta.dirname-based asset paths for development and npm package compatibility
6. ✅ **npm version workflow**: FIXED - Automated release workflow with npm version, pre-release validation, and conventional commit messages
13. ✅ **Live Configuration Management**: FIXED - Open and reload configuration from system tray menu without restart (with validation and rollback)
7. ✅ **Linting Migration**: FIXED - Successfully migrated from Biome to ESLint + Prettier with updated CI workflows
8. ✅ **Mixed Language Transcription**: FIXED - Enhanced Whisper prompt to better preserve French/English mixed speech
9. ✅ **System Tray Library**: FIXED - Migrated from systray2 to node-systray-v2 for better reliability and distribution
10. ✅ **Config Wizard**: FIXED - Improved first-run setup with better guidance for API key configuration
11. ✅ **French→English Language Switching**: FIXED - Strong language-specific prompts prevent Whisper from switching languages during long transcriptions
12. ✅ **Configuration Architecture**: FIXED - Centralized config system with single source of truth and clear documentation

#### Low Priority (✅ Recently Addressed)
1. ✅ **Audio compression**: WAV to MP3 conversion implemented with lamejs (mono 16kHz at 64kbps for voice optimization)
2. **Long audio handling**: Need proper handling for long audio files (still pending)

## 🛣️ Future Roadmap

### Phase 5: Production Ready 🚀 ✅ COMPLETED
- ✅ **⚙️ Live Config Management**: Open and reload configuration from system tray without restart
- ✅ **🔄 Config Validation**: Automatic validation and rollback on configuration errors
- ✅ **🏠 User Config Directory**: Config now uses ~/.config/voice-transcriber/ with first-run setup wizard
- ✅ **🔧 Local Installation**: Streamlined local-only Bun installation with automated setup
- ✅ **📁 Dynamic Asset Resolution**: Modern import.meta.dirname-based asset resolution
- ✅ **🚀 Automated Setup**: Complete `make setup` command for one-step installation
- ✅ **🌍 Multilingual Support**: Spanish, German, Italian support with strong language enforcement
- ✅ **✏️ Custom Prompts**: User-configurable transcription and formatting prompts
- ✅ **📚 Configuration System**: Centralized config with comprehensive documentation

### Phase 6: Core Improvements 🔧
- ✅ **🖥️ System Tray Library**: COMPLETED - Migrated from systray2 to node-systray-v2 for better reliability and binary distribution
- ✅ **🌍 Mixed Language Support**: COMPLETED - Enhanced Whisper prompt for better French/English mixed speech preservation
- ✅ **🗜️ Audio Optimization**: COMPLETED - WAV to MP3 conversion with lamejs (mono 16kHz, 64kbps voice optimization)
- **🚀 Local Inference Support**: Add faster-whisper integration for offline transcription (4x faster, no API costs)
- **💾 File Saving**: Add option to save transcriptions to file instead of just clipboard
- **⏳ Long Audio Support**: Handle audio files longer than API limits

### Phase 7: User Interface & Platform 🖥️
- **🎯 Quick Actions Menu**: Toggle features and switch modes on-the-fly without config reload
  - ✍️ **Formatter Toggle**: Enable/disable GPT formatting instantly
  - 🎭 **Formatter Personalities**: Quick switch between formatting styles (Professional, Technical, Creative)
  - 🤖 **Backend Selector**: Choose between OpenAI GPT or Speaches LLM for formatting
- **💻 CLI Interface**: Command-line interface for automation and scripting
- **🪟 Windows Support**: Replace arecord with Windows-compatible audio recording
- **🍎 macOS Support**: Add macOS audio recording and system tray integration
- **⌨️ Keyboard Shortcuts**: Global shortcuts to trigger transcription
- **🖼️ Graphical Interface**: Desktop GUI for easier configuration and usage

### Phase 8: Technical Enhancements 📊
- **🔧 System Dependencies Elimination**: Replace system dependencies (alsa-utils, xsel) with pure JS alternatives or bundled binaries for zero-dependency npm installation
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

- **Runtime**: Bun (≥1.2.0) with TypeScript
- **Audio**: node-audiorecorder (arecord backend)
- **AI**: OpenAI SDK (Whisper + GPT)
- **System Tray**: node-systray-v2 (native binary distribution)
- **Clipboard**: clipboardy
- **Testing**: Bun test runner
- **Build**: Makefile with development commands
- **Linting**: ESLint + Prettier
- **CI/CD**: GitHub Actions with APT and Bun dependency caching
- **Distribution**: Local installation with automated setup
