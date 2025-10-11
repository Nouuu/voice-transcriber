# 🎤 Voice Transcriber

[![Build](https://github.com/Nouuu/voice-transcriber/actions/workflows/build.yml/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/build.yml)
[![Test](https://github.com/Nouuu/voice-transcriber/actions/workflows/test.yml/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.2.0-black)](https://bun.sh)

A lightweight desktop voice transcription application that records audio from your microphone and transcribes it using OpenAI's Whisper API, with optional GPT-based text formatting.

## ✨ Features

- **🎯 System Tray Integration**: Click to record, visual state feedback (green=idle, red=recording, purple=processing)
- **🎙️ High-Quality Recording**: Audio capture using arecord on Linux
- **🌍 Multilingual Support**: French, English, Spanish, German, Italian with strong language enforcement
- **✍️ Text Formatting**: Optional GPT-based grammar improvement
- **📋 Clipboard Integration**: Automatic result copying to clipboard

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

**Step 1: Clone the repository**
```bash
git clone https://github.com/Nouuu/voice-transcriber.git
cd voice-transcriber
```

**Step 2: Run automated setup**
```bash
make setup
```

This command will:
- Check all system dependencies (Bun, arecord, xsel)
- Install Bun dependencies
- Create configuration file at `~/.config/voice-transcriber/config.json`

**Step 3: Configure OpenAI API key**
```bash
nano ~/.config/voice-transcriber/config.json
```

Add your OpenAI API key and configure language:
```json
{
  "openaiApiKey": "sk-your-api-key-here",
  "language": "en",
  "formatterEnabled": true
}
```

**Get your OpenAI API key:** https://platform.openai.com/api-keys

**Supported languages**: `fr` (French), `en` (English), `es` (Spanish), `de` (German), `it` (Italian)

**For detailed configuration options**, see [Configuration Guide](docs/CONFIGURATION.md)

**Step 4: Install globally (optional)**
```bash
make install-global
```

This installs the `voice-transcriber` command globally, allowing you to run it from anywhere.

**Step 5: Run the application**
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

### Menu Options

Right-click the tray icon for additional options:
- **🎤 Start Recording** - Begin voice capture
- **⏹️ Stop Recording** - End recording and transcribe
- **⚙️ Settings** - Configuration via ~/.config/voice-transcriber/config.json
- **❌ Quit** - Exit the application

### Language Support

Configure your primary language in `config.json` with the `language` setting:

**Supported languages**:
- `"fr"` - French
- `"en"` - English (default)
- `"es"` - Spanish
- `"de"` - German
- `"it"` - Italian

**How it works**:
- Strong language-specific prompts prevent Whisper from switching languages mid-transcription
- Both transcription (Whisper) and formatting (GPT) maintain your configured language
- Perfect for long recordings where language consistency is crucial

**Example transcriptions**:
- **English**: "Can you please send me the meeting notes?"
- **French**: "Bonjour, j'aimerais prendre rendez-vous pour demain"
- **Spanish**: "Buenos días, necesito información sobre el producto"

**Note**: For mixed-language support or custom behavior, see [Configuration Guide](docs/CONFIGURATION.md)

### Text Formatting (Optional)

When `formatterEnabled: true`:

**Raw**: "um so basically the meeting went really well and uh we should schedule another one"
**Formatted**: "The meeting went really well, and we should schedule another one."

## 🛠️ Development

### Available Make Commands

```bash
make help          # Show all available commands

# 🚀 Setup & Installation
make setup              # Complete setup (system deps + bun deps + config)
make check-system-deps  # Check system dependencies (Bun, arecord, xsel)
make init-config        # Initialize config file in ~/.config/voice-transcriber/
make install            # Install bun dependencies only

# ▶️ Running
make run                # Run the application
make dev                # Run in development mode with watch

# 🧪 Testing & Quality
make test               # Run all tests
make test-watch         # Run tests in watch mode
make test-file          # Run specific test (usage: make test-file FILE=path/to/test.ts)
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
│   │   ├── formatter.ts      # OpenAI GPT formatting
│   │   ├── clipboard.ts      # Cross-platform clipboard
│   │   └── system-tray.ts    # System tray management
│   └── utils/
│       └── logger.ts         # Simple logging utility
├── assets/
│   ├── icon-idle.png         # Tray icon (idle state)
│   ├── icon-recording.png    # Tray icon (recording)
│   └── icon-processing.png   # Tray icon (processing)
├── dist/                     # Built application (generated)
│   └── index.js              # Bundled application
├── Makefile                  # Development commands
├── config.example.json       # Configuration template
└── package.json
```

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
- System tray with 3 states and recreation workaround (100 lines, simplified from 381)
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
