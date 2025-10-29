---
title: Quickstart Guide
description: Get started with Voice Transcriber in 5 minutes or less
tags:
  - beginner
  - guide
  - setup
  - tutorial
keywords: quickstart, getting started, setup, installation, first steps, 5 minutes
---

# Quickstart

Get started with Voice Transcriber in **5 minutes** or less.

## TL;DR - 3 Commands

```bash
# 1. Setup
make setup

# 2. Configure API key
nano ~/.config/voice-transcriber/config.json
# Add your OpenAI API key

# 3. Run
make run
```

Click the system tray icon to record. Click again to stop and transcribe.

!!! success "Ready in 5 Minutes"
    This guide will have you recording and transcribing in under 5 minutes. No complex configuration needed!

## Visual Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Setup                                              │
│  $ make setup                                               │
│    ✓ Check system dependencies (Bun, arecord, xsel)       │
│    ✓ Install Bun dependencies                              │
│    ✓ Create config file                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Configure                                          │
│  $ nano ~/.config/voice-transcriber/config.json            │
│    {                                                        │
│      "language": "en",                                      │
│      "transcription": {                                     │
│        "backend": "openai",                                 │
│        "openai": {                                          │
│          "apiKey": "sk-..."  ← ADD YOUR KEY HERE          │
│        }                                                    │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Run                                                │
│  $ make run                                                 │
│    ✓ App starts in system tray                             │
│    ⚫ Idle icon appears in tray                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Record                                             │
│  Click tray icon                                            │
│    🔴 Recording... (red icon)                              │
│    [Speak your message]                                     │
│  Click again to stop                                        │
│    ⏳ Processing... (hourglass icon)                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Result                                             │
│    ✅ Transcription copied to clipboard                    │
│    ⚫ Ready for next recording                             │
└─────────────────────────────────────────────────────────────┘
```

## Minimal Configuration

The absolute minimum config to get started:

```json
{
  "language": "en",
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-your-api-key-here"
    }
  }
}
```

**Save to**: `~/.config/voice-transcriber/config.json`

### Get Your OpenAI API Key

!!! info "API Key Required"
    You need an OpenAI API key to use Voice Transcriber. Don't have one? It takes 2 minutes to create.

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-`)
4. Paste it into your config file

## First Recording Walkthrough

### 1. Start the App

```bash
make run
```

Look for the **⚫ black circle icon** in your system tray (usually top-right corner).

![System Tray Idle State](../../assets/screenshots/tray-idle.png)
*System tray showing Voice Transcriber in idle state*

### 2. Click to Record

**Click the tray icon once** → Icon changes to **🔴 red** (recording in progress)

![System Tray Recording State](../../assets/screenshots/tray-recording.png)
*System tray showing active recording (red icon)*

**Speak clearly** into your microphone:

```
"Hello, this is a test of the voice transcription system."
```

### 3. Click to Stop

**Click the tray icon again** → Icon changes to **⏳ hourglass** (processing)

![System Tray Processing State](../../assets/screenshots/tray-processing.png)
*System tray showing processing state (hourglass icon)*

Processing usually takes **2-3 seconds** for a 30-second recording.

### 4. Get Result

**Icon returns to ⚫ black** → Transcription is now in your clipboard!

**Paste anywhere** (`Ctrl+V`):

```
Hello, this is a test of the voice transcription system.
```

### 5. Next Recording

Click the tray icon again to start a new recording. Repeat!

## Top 3 Beginner Issues

!!! warning "Common Problems & Quick Fixes"
    Most installation issues can be solved in under 2 minutes. Here are the top 3 problems beginners encounter.

### Issue 1: "No system tray icon appears"

**Check your desktop environment**:

```bash
echo $XDG_CURRENT_DESKTOP
```

**Solutions**:

- **Gnome**: Install [AppIndicator extension](https://extensions.gnome.org/extension/615/appindicator-support/)
- **KDE**: System tray should work out of the box
- **XFCE**: Install `xfce4-indicator-plugin`

![Gnome AppIndicator Extension](../../assets/screenshots/gnome-appindicator.png)
*Installing AppIndicator extension in Gnome Extensions*

### Issue 2: "Recording failed - arecord: command not found"

**Install ALSA utils**:

```bash
sudo apt-get update
sudo apt-get install alsa-utils
```

**Verify installation**:

```bash
arecord -l  # Should list your microphones
```

### Issue 3: "OpenAI API error: Invalid API key"

**Check your key format**:

- Should start with `sk-`
- Should be about 50 characters long
- No extra spaces or quotes in config file

**Verify in config**:

```bash
cat ~/.config/voice-transcriber/config.json | grep apiKey
```

Should show: `"apiKey": "sk-proj..."`

## Quick Tips

!!! tip "Pro Tips for Power Users"
    These optional configurations can enhance your transcription workflow.

### Change Language

Edit config to use French:

```json
{
  "language": "fr"
}
```

Supported: `en`, `fr`, `es`, `de`, `it`

**Reload config** from system tray menu (right-click icon → Reload Configuration)

### Use Formatting

Enable text formatting with personalities:

```json
{
  "activePersonalities": [
    "builtin:professional"
  ],
  "formatter": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-..."
    }
  }
}
```

### Debug Mode

See what's happening under the hood:

```bash
make run -- --debug
```

Shows:

- Configuration loading
- Recording start/stop
- Transcription progress
- API responses

### Stop the App

**From system tray**: Right-click icon → Quit

**From terminal**: Press `Ctrl+C`

## What's Next?

### For Basic Users

- [Basic Usage](../user-guide/basic-usage.md) - System tray controls, keyboard shortcuts
- [Language Support](../user-guide/language-support.md) - Multilingual transcription
- [Troubleshooting](../user-guide/troubleshooting.md) - Common issues and solutions

### For Advanced Users

- [Configuration Guide](configuration.md) - Complete configuration reference
- [Formatting Personalities](../user-guide/formatting-personalities.md) - Customize text formatting
- [Transcription Backends](../user-guide/transcription-backends.md) - OpenAI vs Speaches

### For Power Users

- [Speaches Integration](../advanced/speaches-integration.md) - Self-hosted, offline transcription
- [Contributing Guide](../contributing.md) - Build from source, contribute

## Common Workflows

### Quick Note Taking

1. Click tray icon
2. Dictate your note
3. Click to stop
4. Paste into your note app

**Average time**: ~5 seconds from recording to clipboard

### Email Drafting

1. Configure professional formatting:
   ```json
   {
     "activePersonalities": ["builtin:professional"]
   }
   ```
2. Dictate email content
3. Paste into email client
4. Minor edits if needed

### Multilingual Documentation

1. Switch language for each section:
   ```json
   { "language": "fr" }  // French section
   { "language": "en" }  // English section
   ```
2. Reload config between languages
3. Dictate in target language

## Performance Expectations

| Metric                 | Expected Value          |
|------------------------|-------------------------|
| Recording → Clipboard  | 2-3 seconds (30s audio) |
| First startup time     | 1-2 seconds             |
| Memory usage           | ~50-100MB               |
| CPU usage (recording)  | <5%                     |
| CPU usage (processing) | 15-30% (brief spike)    |

## Need Help?

**Didn't work?** Check:

1. ✅ System dependencies installed (`make check-system-deps`)
2. ✅ Config file exists (`cat ~/.config/voice-transcriber/config.json`)
3. ✅ OpenAI API key is valid (starts with `sk-`)
4. ✅ Microphone permissions granted
5. ✅ System tray is supported by your desktop environment

**Still stuck?**

- [Troubleshooting Guide](../user-guide/troubleshooting.md) - Detailed solutions
- [GitHub Issues](https://github.com/Nouuu/voice-transcriber/issues) - Report bugs or ask questions

---

**Ready to dive deeper?** Check out the [Complete Installation Guide](installation.md) for advanced setup options.

## Next Steps

- [Complete Installation Guide](installation.md) - Detailed installation with all options
- [Configuration Guide](configuration.md) - All configuration options and settings
- [First Run Guide](first-run.md) - Step-by-step first recording walkthrough
- [Basic Usage](../user-guide/basic-usage.md) - Learn all features and workflows
