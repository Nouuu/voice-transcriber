---
title: Configuration Guide
description: Complete configuration reference for Voice Transcriber settings and options
tags:
  - intermediate
  - reference
  - configuration
keywords: config, settings, json, personalities, backends, languages, prompts, formatter, transcription
---

# Configuration Guide

## Overview

Voice Transcriber uses a simple JSON configuration file located at:
```
~/.config/voice-transcriber/config.json
```

## Configuration Settings

### Required Settings

#### `transcription.backend` (string)
The transcription backend to use: `"openai"` or `"speaches"`.

**Default**: `"openai"`

#### `transcription.openai.apiKey` (string)
Your OpenAI API key for accessing Whisper and GPT services (required when using OpenAI backend).

**How to get one**: https://platform.openai.com/api-keys

**Example**:
```json
{
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123..."
    }
  }
}
```

### Optional Settings

#### `language` (string)
The primary language for transcription and formatting.

**Supported languages**:
- `"fr"` - French
- `"en"` - English (default)
- `"es"` - Spanish
- `"de"` - German
- `"it"` - Italian

**Default**: `"en"`

**How it works**:
- Whisper API uses this as the primary transcription language
- A strong language-specific prompt prevents Whisper from switching languages mid-transcription
- Formatter (GPT) maintains this language when formatting text

**Example**:
```json
{
  "language": "fr"
}
```

#### `transcriptionPrompt` (string or null)
Custom prompt for Whisper transcription.

**Default**: `null` (uses automatic language-specific prompt)

**When to use**: Only if you need very specific transcription behavior that differs from the built-in prompts.

**Built-in prompt (when null)**:
```
This is a [Language] audio recording. Transcribe the entire audio in [Language] only.
Do NOT switch to English or translate. Keep all content in [Language], preserving
[Language] sentence structure and grammar throughout the entire transcription.
```

**Example**:
```json
{
  "transcriptionPrompt": "Transcribe this technical French presentation, keeping technical English terms but French grammar."
}
```


#### `benchmarkMode` (boolean)

**NEW FEATURE** - Compare OpenAI and Speaches side-by-side.

**Default**: `false`

**When enabled**:
- Transcribes audio with BOTH OpenAI Whisper and Speaches
- Displays detailed comparison (speed, accuracy, text differences)
- Automatically selects best result based on similarity score
- Requires `--debug` flag to see comparison output
- **Requires both backends configured** (OpenAI API key AND Speaches URL)

**Example**:
```json
{
  "benchmarkMode": true,
  "transcription": {
    "backend": "speaches",
    "openai": {
      "apiKey": "sk-...",
      "model": "whisper-1"
    },
    "speaches": {
      "url": "http://localhost:8000/v1",
      "apiKey": "none",
      "model": "Systran/faster-whisper-base"
    }
  }
}
```

**Usage**:
```bash
voice-transcriber --debug
# Records audio, then shows:
# - OpenAI transcription time
# - Speaches transcription time
# - Speed comparison
# - Text similarity percentage
# - Differences analysis
```

!!! tip "Best Use Cases"
    - Testing different Speaches models
    - Comparing cloud vs self-hosted performance
    - Validating Speaches accuracy for your use case
    - Optimizing your transcription setup

#### `transcription` (object)

Backend configuration for transcription service.

**Structure**:
```json
{
  "transcription": {
    "backend": "openai" | "speaches",
    "openai": {
      "apiKey": "string",
      "model": "string"
    },
    "speaches": {
      "url": "string",
      "apiKey": "string",
      "model": "string"
    }
  }
}
```

**Fields**:

- `backend` (required): `"openai"` or `"speaches"` - which backend to use
- `openai.apiKey` (required for OpenAI): Your OpenAI API key
- `openai.model` (optional): Whisper model, default `"whisper-1"`
- `speaches.url` (required for Speaches): Speaches server URL
- `speaches.apiKey` (optional): API key for Speaches, default `"none"`
- `speaches.model` (optional): Whisper model, default `"Systran/faster-whisper-base"`

**Note**: For `benchmarkMode`, both `openai` and `speaches` sections must be configured.

#### `formatter` (object)

Backend configuration for text formatting service.

**Structure**:
```json
{
  "formatter": {
    "backend": "openai" | "ollama",
    "openai": {
      "apiKey": "string",
      "model": "string"
    },
    "ollama": {
      "url": "string",
      "model": "string"
    }
  }
}
```

**Fields**:

- `backend` (required): `"openai"` or `"ollama"` - which backend to use for formatting
- `openai.apiKey` (required for OpenAI): Your OpenAI API key
- `openai.model` (optional): GPT model, default `"gpt-4o-mini"`
- `ollama.url` (optional): Ollama server URL, default `"http://localhost:11434"`
- `ollama.model` (optional): Model name, default `"llama3.1:8b"`

#### `activePersonalities` (array of strings)

List of personalities to apply during formatting. Multiple personalities can be active simultaneously, and their prompts will be concatenated into a single request.

**Default**: `["builtin:default"]`

**Format**: `"builtin:<name>"` for built-in personalities, `"custom:<id>"` for custom ones

**Built-in personalities**:
- `builtin:default` - Minimal formatting, fix grammar only
- `builtin:professional` - Business communication style
- `builtin:technical` - Technical documentation style
- `builtin:creative` - Expressive and natural style
- `builtin:emojify` - Add context-appropriate emojis

**Example**:
```json
{
  "activePersonalities": [
    "builtin:professional",
    "builtin:emojify",
    "custom:myStyle"
  ]
}
```

#### `customPersonalities` (object)

Define your own custom formatting styles.

**Structure**:
```json
{
  "customPersonalities": {
    "myStyleId": {
      "name": "Display Name",
      "description": "Optional description",
      "prompt": "Formatting instructions for GPT"
    }
  }
}
```

**Example**:
```json
{
  "customPersonalities": {
    "technical-french": {
      "name": "Technical French",
      "description": "French technical documentation style",
      "prompt": "Format as French technical documentation. Keep technical English terms. Use formal tone."
    },
    "email-style": {
      "name": "Email Style",
      "description": "Professional email format",
      "prompt": "Format as a professional email: greeting, body, closing signature."
    }
  }
}
```

#### `maxPromptLength` (number)

Maximum total length (in characters) when concatenating multiple personality prompts.

**Default**: `4000`

**How it works**:
- When multiple personalities are active, their prompts are concatenated with `\n\n---\n\n` separator
- If adding a new prompt would exceed `maxPromptLength`, concatenation stops
- Helps prevent exceeding LLM token limits while using multiple personalities

**Example**:
```json
{
  "maxPromptLength": 4000,
  "activePersonalities": [
    "builtin:professional",
    "builtin:technical",
    "custom:myLongPrompt"
  ]
}
```

!!! tip "Personality Concatenation"
    When using multiple personalities, they are combined into a single formatting request rather than applied sequentially. This is faster and more cost-effective, but means personalities should be complementary rather than contradictory.

#### `selectedPersonalities` (array of strings)

List of personalities that appear in the system tray menu. This controls **which** personalities are visible, while `activePersonalities` controls **which** ones are checked/enabled by default.

**Default**: All built-in personalities

**Format**: `"builtin:<name>"` for built-in personalities, `"custom:<id>"` for custom ones

**Example**:
```json
{
  "selectedPersonalities": [
    "builtin:default",
    "builtin:professional",
    "custom:myStyle"
  ]
}
```

**Use cases**:
- Hide personalities you never use to keep the menu clean
- Show only personalities relevant to your workflow
- Add custom personalities to the menu

!!! tip "Menu Organization"
    Keep `selectedPersonalities` short (3-5 items) for a cleaner menu. You can always add personalities when needed by editing the config and reloading.

## Managing Configuration

### Save as Default (System Tray)

**NEW in v1.x** - You can now save your current configuration directly from the system tray menu, eliminating the need to manually edit `config.json` for common changes.

#### How It Works

1. **Adjust Settings**: Use the system tray menu to check/uncheck personalities
2. **Save**: Click "💾 Save as Default" in the menu
3. **Persist**: Your current settings are saved to `config.json`
4. **Restart**: Next time you start the app, your preferences are restored

#### What Gets Saved

When you click "💾 Save as Default", the **entire configuration** is saved:

- ✅ Active personalities (`activePersonalities`)
- ✅ Selected personalities (menu visibility)
- ✅ Custom personalities
- ✅ Language setting
- ✅ Transcription backend and settings
- ✅ Formatter backend and settings
- ✅ All other configuration parameters

!!! warning "Complete Save"
    "Save as Default" saves **everything**, not just personalities. Any changes made via the config file and reloaded are included in the save.

#### When to Use

**Perfect for**:
- Saving your preferred personality combinations
- Quick workflow adjustments
- Testing different setups before committing

**Not ideal for**:
- Complex configuration changes (use config file directly)
- Temporary testing (changes will persist)

#### Example Workflow

```bash
# 1. Start the application
voice-transcriber

# 2. Via system tray menu:
#    ☑ Professional
#    ☑ Emojify
#    ☐ Default (uncheck)

# 3. Click "💾 Save as Default"

# 4. Restart → Professional + Emojify are active by default ✅
```

![Save as Default Feature](../../assets/screenshots/save-as-default.png)
*Using "Save as Default" to persist personality preferences*

#### Safety Features

- **State check**: Only available when app is IDLE (not during recording/processing)
- **Confirmation**: Logs confirm successful save with details
- **Rollback**: Edit `config.json` and reload if needed

#### Logs

When you save, you'll see:
```
[INFO] ✅ Configuration saved to file successfully
[INFO] Config file: /home/user/.config/voice-transcriber/config.json
[INFO] Active personalities saved: builtin:professional, builtin:emojify
```

### Change Detection (Debug Mode)

**NEW in v1.x** - When reloading configuration in debug mode, the application detects and displays all changes between the live configuration and the file.

#### How to See Change Detection

1. **Start in debug mode**:
   ```bash
   voice-transcriber --debug
   # or
   voice-transcriber -d
   ```

2. **Modify** `config.json` manually

3. **Reload** via "🔄 Reload Config" in system tray

4. **See changes** in the terminal output

#### What Is Detected

The system detects **15+ types of changes**:

**Transcription**:
- Backend (openai ↔ speaches)
- Model changes
- Speaches URL changes

**Formatter**:
- Backend (openai ↔ ollama)
- Model changes
- Ollama URL changes

**Personalities**:
- Active personalities added/removed
- Custom personalities added
- Custom personalities removed
- Custom personalities modified
- Selected personalities (menu visibility)

**General**:
- Language changes
- Benchmark mode toggled

#### Example Output

**No changes**:
```
[INFO] Reloading configuration...
[DEBUG] ✓ No configuration changes detected (config file matches live state)
[INFO] ✅ Configuration reloaded successfully
```
## Complete Configuration Examples

### Minimal Configuration (OpenAI Backend)
```json
{
  "language": "en",
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123..."
    }
  },
  "formatter": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123...",
      "model": "gpt-4o-mini"
    }
  },
  "activePersonalities": ["builtin:default"]
}
```

### Full Configuration with All Options
```json
{
  "language": "en",
  "transcriptionPrompt": null,
  "benchmarkMode": false,
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123...",
      "model": "whisper-1"
    },
    "speaches": {
      "url": "http://localhost:8000/v1",
      "apiKey": "none",
      "model": "Systran/faster-whisper-base"
    }
  },
  "formatter": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123...",
      "model": "gpt-4o-mini"
    },
    "ollama": {
      "url": "http://localhost:11434",
      "model": "llama3.1:8b"
    }
  },
  "activePersonalities": ["builtin:default"],
  "selectedPersonalities": [
    "builtin:default",
    "builtin:professional",
    "builtin:technical",
    "builtin:creative",
    "builtin:emojify"
  ],
  "customPersonalities": {},
  "maxPromptLength": 4000,
  "logTruncateThreshold": 1000
}
```

### Speaches Backend Configuration (No Formatting)
```json
{
  "language": "fr",
  "transcription": {
    "backend": "speaches",
    "speaches": {
      "url": "http://localhost:8000/v1",
      "apiKey": "none",
      "model": "Systran/faster-whisper-base"
    }
  },
  "activePersonalities": []
}
```

### Multiple Personalities Configuration
```json
{
  "language": "fr",
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123..."
    }
  },
  "formatter": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123...",
      "model": "gpt-4o-mini"
    }
  },
  "activePersonalities": [
    "builtin:professional",
    "builtin:emojify",
    "custom:myStyle"
  ],
  "customPersonalities": {
    "myStyle": {
      "name": "My Custom Style",
      "description": "My personal formatting style",
      "prompt": "Format text in my personal style with..."
    }
  },
  "maxPromptLength": 4000
}
```

### Benchmark Mode Configuration
```json
{
  "language": "fr",
  "benchmarkMode": true,
  "transcription": {
    "backend": "speaches",
    "openai": {
      "apiKey": "sk-proj-abc123...",
      "model": "whisper-1"
    },
    "speaches": {
      "url": "http://localhost:8000/v1",
      "apiKey": "none",
      "model": "Systran/faster-whisper-medium"
    }
  },
  "formatter": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123...",
      "model": "gpt-4o-mini"
    }
  },
  "activePersonalities": ["builtin:default"]
}
```

### Custom Prompts Configuration
```json
{
  "language": "fr",
  "transcriptionPrompt": "Transcribe this French audio with proper names and technical terms.",
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123..."
    }
  },
  "formatter": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-proj-abc123..."
    }
  },
  "activePersonalities": ["builtin:professional"],
  "customPersonalities": {
    "myStyle": {
      "name": "My Custom Style",
      "description": "Concise professional style",
      "prompt": "Format this French text in a concise, professional style."
    }
  }
}
```

## Configuration Architecture

The configuration system uses a **centralized, single-source-of-truth** design:

1. **User Config** (`~/.config/voice-transcriber/config.json`)
   - Simple JSON file with core settings
   - Easy to understand and modify

2. **Config Class** (`src/config/config.ts`)
   - Loads and validates user configuration
   - Generates service-specific configurations
   - Provides strong language-specific prompts

3. **Service Configuration**
   - Services receive fully-configured objects
   - No configuration logic in services
   - Services focus only on their core functionality

### Flow Diagram
```
config.json
    ↓
Config.load()
    ↓
Config.getTranscriptionConfig() → TranscriptionService
Config.getFormatterConfig()     → FormatterService
```

## Troubleshooting

### French Transcriptions Switching to English

**Problem**: Long French transcriptions switch to English mid-way.

**Solution**: The new configuration system includes strong language-specific prompts that prevent this. Make sure:
1. Your config has `"language": "fr"`
2. You're not using a custom `transcriptionPrompt` (use `null` for default)
3. Restart the application after config changes

**How it works**:
- The `language` setting triggers a strong prompt like: "This is a French audio recording. Transcribe the entire audio in French only. Do NOT switch to English..."

## Live Configuration Management

You can now reload configuration changes **without restarting the application** using the system tray menu.

### How It Works

The live reload process follows these steps:

1. **Open Configuration**: Right-click tray icon → "Open Config"
2. **Edit Settings**: Make changes in your default text editor
3. **Save File**: Save the configuration file
4. **Reload**: Right-click tray icon → "Reload Config" (when application is idle)

### State Validation

**Reload Config** is only available when the application is **idle** (green icon):

- ✅ **Available**: When idle and ready
- ❌ **Blocked**: During recording (would interrupt audio capture)
- ❌ **Blocked**: During processing (would interfere with transcription)

This safety mechanism prevents configuration changes from corrupting ongoing operations.

### What Gets Reloaded

When you reload configuration, the following services are reinitialized:

- **TranscriptionService**: Updated with new API key, language, model, backend
- **FormatterService**: Updated with new API key, enabled state, prompts
- **AudioProcessor**: Reinitialized with updated service dependencies

### Safety Features

The reload process includes automatic protections:

| Feature | Description |
|---------|-------------|
| **Validation** | Configuration is validated before applying changes |
| **Rollback** | Previous configuration is automatically restored on failure |
| **Error Handling** | Clear error messages guide you to fix issues |
| **Service Cleanup** | Old services are properly disposed to prevent memory leaks |

### Common Use Cases

**Testing Language Settings**
```json
// Try different languages without restarting
{ "language": "fr" }  // Test French
→ Reload Config
{ "language": "en" }  // Back to English
→ Reload Config
```

**Switching Backends**
```json
// Switch between OpenAI and Speaches
{
  "transcription": {
    "backend": "speaches"  // Use local Speaches
  }
}
→ Reload Config
```

**Updating API Keys**
```json
{
  "transcription": {
    "openai": {
      "apiKey": "sk-proj-new-key-here"
    }
  }
}
→ Reload Config
```

### Reload vs Restart

| Aspect | Reload Config | Restart Application |
|--------|---------------|---------------------|
| **Speed** | Instant (< 1 second) | Slow (3-5 seconds) |
| **System Tray** | Stays in tray | Disappears briefly |
| **Safety** | Automatic rollback | Manual recovery |
| **When to Use** | Quick config changes | Major troubleshooting |

!!! tip "Best Practice"
    Use **Reload Config** for configuration changes during development or testing. Only restart the application if reload fails or you encounter unexpected behavior.

### Configuration File Not Found

**Problem**: Application can't find config file.

**Solution**: Run the setup wizard:
```bash
rm -rf ~/.config/voice-transcriber/config.json
make run  # Will trigger first-run setup
```

### Invalid JSON Format

**Problem**: Config file has syntax errors.

**Solution**: Validate JSON:
```bash
cat ~/.config/voice-transcriber/config.json | jq .
```

If invalid, use one of the complete examples above or recreate the file.

## Next Steps

- [First Run Guide](first-run.md) - Complete setup walkthrough
- [Transcription Backends](../user-guide/transcription-backends.md) - OpenAI vs Speaches
- [Language Support](../user-guide/language-support.md) - Multilingual transcription
