# Voice Transcriber - API Reference

## Overview

This document provides detailed API reference for all services and interfaces in the Voice Transcriber application. All services follow consistent patterns with simple interfaces and standardized error handling.

## Common Patterns

### Result Interface
All service methods return a consistent result interface:

```typescript
interface ServiceResult {
  success: boolean;
  error?: string;
  // Additional data fields specific to the operation
}
```

### Error Handling
- Services never throw exceptions in normal operation
- All errors are returned via the result interface
- Error messages are user-friendly and actionable
- Logging is handled internally by each service

## Core Application

### VoiceTranscriberApp

Main application class that orchestrates all services.

```typescript
class VoiceTranscriberApp {
  constructor(configPath?: string)

  // Lifecycle Methods
  initialize(): Promise<{ success: boolean; error?: string }>
  shutdown(): Promise<void>

  // Private Event Handlers (called by system tray)
  private handleRecordingStart(): Promise<void>
  private handleRecordingStop(): Promise<void>
  private handleQuit(): Promise<void>
  private processAudioFile(filePath: string): Promise<void>
}
```

#### Methods

**`initialize()`**
- Loads configuration with setup wizard if needed
- Initializes all services with proper dependency injection
- Sets up system tray with event callbacks
- Returns initialization result

**`shutdown()`**
- Stops any active recording
- Cleanly shuts down system tray
- Performs cleanup operations

## Configuration Service

### Config

Manages application configuration with user-friendly setup.

```typescript
interface ConfigData {
  openaiApiKey: string;
  formatterEnabled: boolean;
}

class Config {
  openaiApiKey: string;
  formatterEnabled: boolean;

  constructor(configPath?: string)

  // Configuration Methods
  load(): Promise<void>
  loadWithSetup(): Promise<void>
  save(): Promise<void>

  // Private Methods
  private setupWizard(): Promise<void>
  private promptForApiKey(): Promise<string>
  private getUserConfigPath(): string
  private getUserConfigDir(): string
}
```

#### Methods

**`load()`**
- Loads configuration from JSON file
- Uses defaults if file doesn't exist or is invalid
- Silent failure with default values

**`loadWithSetup()`**
- Loads configuration
- Runs setup wizard for first-time users
- Creates config directory and file as needed

**`save()`**
- Saves current configuration to JSON file
- Creates config directory if needed
- Overwrites existing configuration

**`setupWizard()`**
- Interactive first-run setup
- Prompts for OpenAI API key
- Creates initial configuration file

#### Configuration Paths
- **Default**: `~/.config/voice-transcriber/config.json`
- **Custom**: Provided via constructor parameter

## System Tray Service

### SystemTrayService

Manages system tray integration with visual state feedback.

```typescript
enum TrayState {
  IDLE = "idle",
  RECORDING = "recording",
  PROCESSING = "processing"
}

interface TrayConfig {
  callbacks: {
    onRecordingStart: () => void;
    onRecordingStop: () => void;
    onQuit: () => void;
  };
}

interface TrayResult {
  success: boolean;
  error?: string;
}

class SystemTrayService {
  constructor(config: TrayConfig, systrayConstructor?: typeof SysTray)

  // Public Methods
  initialize(): Promise<TrayResult>
  setState(state: TrayState): Promise<TrayResult>
  shutdown(): Promise<TrayResult>

  // Private Methods
  private getIconBase64(state: TrayState): string
  private getTooltip(state: TrayState): string
}
```

#### Methods

**`initialize()`**
- Creates system tray with menu items
- Sets up click event handlers
- Waits for tray to be ready
- Returns initialization result

**`setState(state: TrayState)`**
- Updates tray icon based on application state
- Modifies menu item availability
- Updates tooltip text
- Handles icon recreation for state changes

**`shutdown()`**
- Cleanly destroys system tray
- Releases system resources

#### States and Icons
- **IDLE**: Green circle - Ready to record
- **RECORDING**: Red circle - Actively recording
- **PROCESSING**: Purple circle - Transcribing audio

#### Menu Items
- **🎤 Start Recording**: Enabled when IDLE
- **⏹️ Stop Recording**: Enabled when RECORDING
- **❌ Exit**: Always enabled

## Audio Recording Service

### AudioRecorder

Handles system audio capture using Linux arecord.

```typescript
interface AudioRecorderConfig {
  tempDir?: string;
}

interface RecordingResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

class AudioRecorder {
  constructor(config?: AudioRecorderConfig)

  // Public Methods
  startRecording(): Promise<RecordingResult>
  stopRecording(): Promise<RecordingResult>
  isRecording(): boolean
}
```

#### Methods

**`startRecording()`**
- Creates temporary directory if needed
- Generates timestamped filename
- Spawns arecord process with CD quality settings
- Returns recording result with file path

**`stopRecording()`**
- Sends SIGTERM to arecord process
- Cleans up process references
- Returns result with final file path

**`isRecording()`**
- Returns true if recording process is active
- Used for state validation

#### Audio Format
- **Format**: WAV (CD quality)
- **Sample Rate**: 44.1kHz
- **Bit Depth**: 16-bit
- **Channels**: Stereo
- **Device**: ALSA default input

#### File Management
- **Location**: `/tmp/transcriber/recording-{timestamp}.wav`
- **Naming**: ISO timestamp with safe characters
- **Cleanup**: Manual cleanup required (handled by main app)

## Transcription Service

### TranscriptionService

Converts audio files to text using OpenAI Whisper API.

```typescript
interface TranscriptionConfig {
  apiKey: string;
  language?: string;
  prompt?: string;
}

interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
}

class TranscriptionService {
  constructor(config: TranscriptionConfig)

  // Public Methods
  transcribe(filePath: string): Promise<TranscriptionResult>
}
```

#### Methods

**`transcribe(filePath: string)`**
- Validates audio file exists
- Creates read stream for file upload
- Calls OpenAI Whisper API with optimized settings
- Returns transcribed text or error

#### Configuration

**Default Settings**:
```typescript
{
  language: undefined,  // Auto-detect French/English
  prompt: "Please transcribe this audio exactly as spoken, preserving the original language. The speaker may mix French and English in the same sentence. Keep technical terms in their original language (English), but preserve French sentence structure and grammar. Do not translate between languages."
}
```

**API Parameters**:
- **Model**: `whisper-1` (OpenAI's production model)
- **Language**: Auto-detect if undefined
- **Prompt**: Enhanced for French/English mixed speech

#### Multilingual Support
- **Auto-Detection**: Automatic language identification
- **Mixed Speech**: Preserves French/English code-switching
- **Technical Terms**: Keeps English technical vocabulary
- **Grammar**: Maintains original language sentence structure

## Text Formatting Service

### FormatterService

Optional text enhancement using ChatGPT API.

```typescript
interface FormatterConfig {
  apiKey: string;
  enabled: boolean;
  language: string;
  prompt?: string;
}

interface FormatResult {
  success: boolean;
  text?: string;
  error?: string;
}

class FormatterService {
  constructor(config: FormatterConfig)

  // Public Methods
  formatText(text: string, language: string): Promise<FormatResult>
}
```

#### Methods

**`formatText(text: string, language: string)`**
- Returns original text if formatting disabled
- Validates input text is not empty
- Calls ChatGPT API for text enhancement
- Uses language-specific prompt to preserve original language
- Returns formatted text or error

#### Configuration

**Default Settings**:
```typescript
{
  prompt: null,  // Uses auto-generated language-aware prompt
  enabled: true,
  language: "en" // Supported: en, fr, es, de, it
}
```

**Auto-generated prompts** (when prompt is null):
- Maintains the specified language
- Prevents translation to other languages
- Preserves original meaning and tone

**API Parameters**:
- **Model**: `gpt-3.5-turbo` (fast and cost-effective)
- **Temperature**: 0.3 (consistent, low-creativity output)
- **Max Tokens**: 1000 (sufficient for typical transcriptions)

#### Text Enhancement
- **Grammar**: Corrects grammatical errors
- **Punctuation**: Adds proper punctuation
- **Language Preservation**: Maintains original language (French/English/Spanish/German/Italian)
- **Structure**: Improves text structure and flow

## Clipboard Service

### ClipboardService

Cross-platform clipboard operations.

```typescript
interface ClipboardResult {
  success: boolean;
  error?: string;
}

class ClipboardService {
  // Public Methods
  writeText(text: string): Promise<ClipboardResult>
}
```

#### Methods

**`writeText(text: string)`**
- Validates input text is not empty
- Writes text to system clipboard
- Returns operation result

#### Platform Support
- **Linux**: Uses `clipboardy` with xsel/xclip backend
- **Windows**: Native Windows clipboard API
- **macOS**: Native macOS clipboard API

## Logging Service

### Logger

Simple console-based logging utility.

```typescript
interface Logger {
  info(message: string): void
  error(message: string): void
}

const logger: Logger
```

#### Methods

**`info(message: string)`**
- Logs informational messages to console
- Includes timestamp and formatted output

**`error(message: string)`**
- Logs error messages to console
- Includes timestamp and error formatting

#### Log Levels
- **INFO**: General application flow and status
- **ERROR**: Errors and exceptions

#### Output Format
```
[TIMESTAMP] [LEVEL] MESSAGE
```

## Error Codes and Messages

### Common Error Patterns

**Configuration Errors**:
- `"OpenAI API key not configured"`
- `"Config file could not be loaded"`

**Audio Recording Errors**:
- `"Already recording"`
- `"Not recording"`
- `"Failed to start recording: {details}"`

**Transcription Errors**:
- `"Audio file does not exist"`
- `"No transcription text received"`
- `"Failed to transcribe audio: {details}"`

**System Tray Errors**:
- `"System tray not initialized"`
- `"Failed to initialize: {details}"`

**Clipboard Errors**:
- `"Text cannot be empty"`
- `"Failed to write to clipboard: {details}"`

### API Rate Limiting

The application does not implement automatic retry logic. Rate limiting is handled by:
- Using conservative API call patterns
- Single transcription per recording session
- Optional formatting (can be disabled)

### Network Error Handling

Network errors are returned as operation failures:
- Connection timeouts
- Invalid API keys
- Service unavailable
- Rate limit exceeded

## Usage Examples

### Basic Application Lifecycle

```typescript
// Initialize application
const app = new VoiceTranscriberApp();
const result = await app.initialize();

if (!result.success) {
  console.error(result.error);
  process.exit(1);
}

// Application runs via system tray events
// Shutdown when needed
await app.shutdown();
```

### Custom Configuration

```typescript
// Load custom config path
const config = new Config('/path/to/custom/config.json');
await config.load();

// Modify settings
config.formatterEnabled = false;
await config.save();

// Use with application
const app = new VoiceTranscriberApp('/path/to/custom/config.json');
```

### Manual Service Usage

```typescript
// Direct transcription service usage
const transcriber = new TranscriptionService({
  apiKey: 'your-api-key'
});

const result = await transcriber.transcribe('/path/to/audio.wav');
if (result.success) {
  console.log('Transcription:', result.text);
}
```

### Error Handling Pattern

```typescript
// Consistent error handling across all services
const result = await service.someOperation();

if (!result.success) {
  logger.error(`Operation failed: ${result.error}`);
  // Handle error appropriately
  return;
}

// Use result.data if operation succeeded
console.log('Success:', result.data);
```