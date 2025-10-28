# Configuration Management

Advanced guide for managing Voice Transcriber configuration dynamically without restarting the application.

---

## Overview

Voice Transcriber supports **live configuration management**, allowing you to modify settings and reload them on-the-fly without restarting the application.

### Key Features

- **🔄 Hot Reload**: Changes take effect immediately
- **✅ Validation**: Configuration is validated before applying
- **🔙 Automatic Rollback**: Previous config restored on failure
- **🔍 Change Detection**: See exactly what changed (debug mode)
- **🛡️ Safety Checks**: Reload blocked during recording/processing

---

## Quick Configuration Workflow

### Basic Workflow

1. **Open Config**: Right-click tray icon → "⚙️ Open Config"
2. **Edit**: Make your changes in the text editor
3. **Save**: Save the configuration file
4. **Reload**: Right-click tray icon → "🔄 Reload Config" (when idle)

### Example: Switching Language

```json
// Before
{
  "language": "en"
}

// Edit config.json
{
  "language": "fr"
}

// Right-click tray → Reload Config
// ✅ Now transcribing in French
```

---

## Save as Default

**NEW in v1.x** - Save your current settings with one click from the system tray menu.

### How It Works

Instead of manually editing `config.json`, you can:

1. **Adjust** settings via the system tray menu (e.g., toggle personalities)
2. **Save** by clicking "💾 Save as Default"
3. **Persist** your preferences automatically

### What Gets Saved

When you click "💾 Save as Default", the **entire configuration** is saved:

- ✅ Active personalities
- ✅ Selected personalities (menu visibility)
- ✅ Custom personalities
- ✅ Language setting
- ✅ Backend configurations
- ✅ All other parameters

!!! warning "Complete Save"
    "Save as Default" saves **everything**, not just what you changed via the menu. Any manual config edits that were reloaded are also saved.

### Example Workflow

```bash
# 1. Start the application
voice-transcriber

# 2. Via system tray menu:
#    ☑ Professional
#    ☑ Emojify
#    ☐ Default (uncheck)

# 3. Click "💾 Save as Default"
#    Logs show:
#    [INFO] ✅ Configuration saved to file successfully
#    [INFO] Active personalities saved: builtin:professional, builtin:emojify

# 4. Restart → Professional + Emojify are active by default ✅
```

### When to Use

**Perfect for**:
- Saving your preferred personality combinations
- Quick workflow adjustments
- Testing different setups before committing

**Not ideal for**:
- Complex configuration changes (edit config file directly)
- One-time testing (changes persist)

### Safety Features

- **State Check**: Only available when IDLE (disabled during recording/processing)
- **Confirmation**: Logs confirm successful save with details
- **Rollback**: Edit `config.json` and reload if needed

---

## Change Detection (Debug Mode)

In debug mode, Voice Transcriber detects and displays all configuration changes when you reload.

### Enabling Change Detection

```bash
voice-transcriber --debug
# or
voice-transcriber -d
```

### What Is Detected

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

### Example Logs

**No changes**:
```
[INFO] Reloading configuration...
[DEBUG] ✓ No configuration changes detected (config file matches live state)
[INFO] ✅ Configuration reloaded successfully
```

**Single change**:
```
[INFO] Reloading configuration...
[DEBUG] 🔄 Configuration changes detected:
[DEBUG]   └─ Language: en → fr
[INFO] ✅ Configuration reloaded successfully
```

**Multiple changes**:
```
[INFO] Reloading configuration...
[DEBUG] 🔄 Configuration changes detected:
[DEBUG]   └─ Transcription backend: openai → speaches
[DEBUG]   └─ Transcription model: whisper-1 → Systran/faster-whisper-medium
[DEBUG]   └─ Active personalities: builtin:default → builtin:professional, builtin:emojify
[DEBUG]   └─ Custom personalities added: technical-fr
[INFO] ✅ Configuration reloaded successfully
```

### Use Cases

**Development & Testing**:
```bash
# Monitor all changes during development
voice-transcriber -d

# Test different configs, see what changed
# Perfect for iterating on personality combinations
```

**Troubleshooting**:
```bash
# Verify your changes are detected
voice-transcriber -d

# If "No changes detected" but you made changes:
# → Check JSON syntax (invalid JSON ignored)
# → Verify file was saved
# → Check file permissions
```

!!! tip "Production vs Debug"
    Change detection logs **only appear in debug mode**. In normal mode, reloads are silent except for success/error messages.

---

## Reload Safety & Validation

### State Restrictions

**Reload Config** is only available when the application is **IDLE** (green icon):

| State | Icon | Reload Available? | Why? |
|-------|------|-------------------|------|
| Idle | 🟢 | ✅ Yes | Safe to reload |
| Recording | 🔴 | ❌ No | Would interrupt audio capture |
| Processing | 🟣 | ❌ No | Would interfere with transcription |

### Automatic Validation

Before applying changes, the configuration is validated:

```
1. Load new config from file
2. Validate required fields
3. Check API keys format
4. Verify backend compatibility
5. ✅ If valid → Apply changes
6. ❌ If invalid → Show error, rollback
```

### Rollback on Failure

If reload fails, the previous configuration is automatically restored:

```
[INFO] Reloading configuration...
[ERROR] Failed to reload configuration: Invalid API key format
[INFO] Rolling back to previous configuration...
[INFO] Previous configuration restored
```

### Service Reinitialization

When you reload, these services are restarted with new settings:

- **TranscriptionService**: New API key, language, model, backend
- **FormatterService**: New API key, prompts, personalities
- **AudioProcessor**: Updated dependencies

Old services are properly disposed to prevent memory leaks.

---

## Advanced Workflows

### Workflow 1: Test Multiple Backends

```bash
# 1. Configure both backends in config.json
{
  "transcription": {
    "backend": "openai",
    "openai": { "apiKey": "sk-..." },
    "speaches": { "url": "http://localhost:8000/v1" }
  }
}

# 2. Test OpenAI
voice-transcriber
# Make recording, check quality

# 3. Switch to Speaches
# Edit config: "backend": "speaches"
# Right-click → Reload Config

# 4. Test Speaches  
# Make recording, compare quality

# 5. Choose best backend
# Edit config, Reload, Save as Default
```

### Workflow 2: Per-Project Configs

```bash
# Setup: Create config variants
~/configs/
├── code-review.json
├── documentation.json
└── casual.json

# Use: Load project-specific config
cp ~/configs/code-review.json ~/.config/voice-transcriber/config.json
# Right-click → Reload Config

# When done: Save if you made improvements
# Right-click → Save as Default
cp ~/.config/voice-transcriber/config.json ~/configs/code-review.json
```

### Workflow 3: Sync Across Machines

```bash
# Machine A: Configure and save
# Right-click → Save as Default

# Copy to dotfiles repo
cp ~/.config/voice-transcriber/config.json ~/dotfiles/voice-transcriber/
cd ~/dotfiles && git add . && git commit -m "Update config" && git push

# Machine B: Pull and reload
cd ~/dotfiles && git pull
cp ~/dotfiles/voice-transcriber/config.json ~/.config/voice-transcriber/
# Right-click → Reload Config
# See changes in debug mode
```

---

## Configuration File Location

The configuration file is located at:

```
~/.config/voice-transcriber/config.json
```

### Opening Quickly

**Via System Tray**:
```
Right-click → ⚙️ Open Config
```

**Via Terminal**:
```bash
# Open in default editor
xdg-open ~/.config/voice-transcriber/config.json

# Or with specific editor
nano ~/.config/voice-transcriber/config.json
code ~/.config/voice-transcriber/config.json
```

### Backup Strategies

**Manual Backup**:
```bash
cp ~/.config/voice-transcriber/config.json ~/.config/voice-transcriber/config.backup.json
```

**Git Versioning**:
```bash
cd ~/.config/voice-transcriber
git init
git add config.json
git commit -m "Initial config"
```

**Automatic Backup Script**:
```bash
#!/bin/bash
# ~/bin/backup-voice-config
DATE=$(date +%Y%m%d_%H%M%S)
cp ~/.config/voice-transcriber/config.json \
   ~/.config/voice-transcriber/backups/config_$DATE.json
```

---

## Troubleshooting

### Reload Fails Silently

**Problem**: Click Reload, nothing happens

**Solutions**:
1. Check application is IDLE (green icon)
2. Check logs for errors
3. Verify config file exists and is readable
4. Try in debug mode to see detailed logs

### Changes Not Detected

**Problem**: Made changes but "No changes detected"

**Check**:
1. File was actually saved (check timestamp)
2. JSON syntax is valid (`cat config.json | jq .`)
3. Changed the right file (check path)
4. Not running multiple instances

### Config Validation Fails

**Problem**: "Failed to reload configuration: ..."

**Solutions**:
1. Check error message for specific issue
2. Validate JSON syntax
3. Ensure required fields present (API keys, etc.)
4. Restore from backup if needed

### Rollback Not Working

**Problem**: Bad config persists after reload

**Solution**:
```bash
# Force restore from backup
cp ~/.config/voice-transcriber/config.backup.json \
   ~/.config/voice-transcriber/config.json

# Or recreate default
rm ~/.config/voice-transcriber/config.json
voice-transcriber  # Will trigger first-run setup
```

---

## Best Practices

### Do's ✅

- **Test changes** in debug mode first
- **Backup** before major config changes
- **Reload** after each logical change (don't batch too many)
- **Save as Default** after finding good settings
- **Use version control** for important configs

### Don'ts ❌

- **Don't reload during recording** (it's blocked anyway)
- **Don't edit while app is reloading** (race condition)
- **Don't skip validation** (invalid JSON breaks reload)
- **Don't forget to save** after editing (reload won't see changes)

---

## Related Documentation

- [Configuration Guide](../getting-started/configuration.md) - All configuration options
- [Formatting Personalities](../user-guide/formatting-personalities.md) - Personality management
- [Debug Mode](debug-mode.md) - Detailed debug information
- [Basic Usage](../user-guide/basic-usage.md) - Getting started

---

**Last updated**: 2025-10-29

