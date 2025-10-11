# First Run Guide

This guide walks you through your first experience with Voice Transcriber.

## Prerequisites

Before starting, ensure you have:

- ✅ [Installed Voice Transcriber](installation.md)
- ✅ Obtained an [OpenAI API key](https://platform.openai.com/api-keys)
- ✅ Verified system dependencies with `make check-system-deps`

## Step 1: Launch the Application

Start Voice Transcriber for the first time:

=== "Global Installation"

    ```bash
    voice-transcriber
    ```

=== "Local Installation"

    ```bash
    cd voice-transcriber
    make run
    ```

## Step 2: Configuration Wizard

If this is your first run, you'll see the **Configuration Wizard**:

```
🎤 Voice Transcriber - First Run Setup

No configuration found. Let's set up your OpenAI API key.

📝 Get your API key at: https://platform.openai.com/api-keys

Enter your OpenAI API key: _
```

Enter your API key when prompted. The wizard will:

1. Validate your API key
2. Create configuration file at `~/.config/voice-transcriber/config.json`
3. Set default language to English
4. Enable text formatting by default

!!! success "Setup Complete"
    Once configured, you'll see: "✅ Configuration saved successfully!"

## Step 3: Locate the System Tray Icon

Look for the **green circle** icon in your system tray:

<div class="grid cards" markdown>

-   :material-circle:{ .lg .middle style="color: green" } **IDLE (Green)**

    ---

    Ready to record. Click to start recording.

-   :material-circle:{ .lg .middle style="color: red" } **RECORDING (Red)**

    ---

    Currently recording audio. Click to stop.

-   :material-circle:{ .lg .middle style="color: purple" } **PROCESSING (Purple)**

    ---

    Transcribing audio. Wait for completion.

</div>

!!! tip "System Tray Location"
    - **GNOME**: Top-right corner (may need "AppIndicator Support" extension)
    - **KDE Plasma**: Bottom-right panel
    - **XFCE/MATE**: Top or bottom panel (near clock)

## Step 4: Your First Recording

### Record Audio

1. **Click** the system tray icon (or select "Start Recording" from menu)
2. Icon changes to **red circle** 🔴
3. **Speak** into your microphone
4. **Click** again to stop recording

!!! example "Example Recording"
    "Hello, this is my first test recording with Voice Transcriber."

### Processing

1. Icon changes to **purple circle** 🟣
2. Audio is transcribed by OpenAI Whisper
3. Text is formatted by GPT (if enabled)
4. Result is copied to your clipboard automatically

### Paste Result

1. Open any text editor (e.g., gedit, VS Code, browser)
2. **Paste** (Ctrl+V) the transcribed text

!!! success "Expected Result"
    "Hello, this is my first test recording with Voice Transcriber."

## Step 5: Test Different Languages (Optional)

### Configure French

Edit your configuration:

```bash
nano ~/.config/voice-transcriber/config.json
```

Change language to French:

```json
{
  "openaiApiKey": "sk-...",
  "language": "fr",
  "formatterEnabled": true
}
```

**Restart the application** and try a French recording:

!!! example "French Recording"
    "Bonjour, ceci est un test de transcription en français."

Expected paste result:
```
Bonjour, ceci est un test de transcription en français.
```

## Step 6: Explore Menu Options

Right-click the system tray icon to see available options:

```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ⚙️ Settings
└── ❌ Quit
```

### Menu Actions

- **Start Recording**: Begin audio capture
- **Stop Recording**: End recording and transcribe
- **Settings**: Opens config file in default text editor
- **Quit**: Exit the application gracefully

## Common First-Run Issues

### Icon Not Visible

!!! warning "System Tray Not Showing"
    **GNOME Users**: Install "AppIndicator Support" extension

    ```bash
    # Install extension
    sudo apt-get install gnome-shell-extension-appindicator

    # Restart GNOME Shell
    # Press Alt+F2, type 'r', press Enter
    ```

### Audio Recording Fails

!!! error "arecord: device not found"
    **Solution**: Check audio devices

    ```bash
    # List audio devices
    arecord -l

    # Test recording manually
    arecord -d 5 test.wav
    play test.wav
    ```

### API Key Invalid

!!! error "OpenAI API Error: Invalid API key"
    **Solutions**:

    1. Verify your API key at [OpenAI Platform](https://platform.openai.com/api-keys)
    2. Check for extra spaces in config file
    3. Ensure key starts with `sk-`
    4. Verify API key has Whisper API access

### Transcription in Wrong Language

!!! warning "French recorded but English transcribed"
    **Solution**: Set language explicitly in config

    ```json
    {
      "language": "fr"
    }
    ```

    Restart the application after config changes.

## Debug Mode

Enable debug mode for detailed logging:

```bash
# Global installation
voice-transcriber --debug

# Local installation
make run ARGS="--debug"
```

**Debug output example**:

```
2025-10-11T10:30:15.123Z [DEBUG] WAV file size: 2.45 MB
2025-10-11T10:30:15.234Z [DEBUG] MP3 compression: 74.7% reduction
2025-10-11T10:30:16.789Z [INFO] OpenAI transcription completed in 1.55s
2025-10-11T10:30:16.789Z [DEBUG]   └─ Transcription: 142 characters
```

## Next Steps

Now that you've completed your first recording, explore more features:

- [Basic Usage](../user-guide/basic-usage.md) - Learn all recording options
- [Language Support](../user-guide/language-support.md) - Multilingual transcription
- [Configuration](configuration.md) - Advanced settings and custom prompts
- [Self-Hosted Setup](../advanced/speaches-integration.md) - Run 100% offline

## Quick Reference Card

### Essential Commands

```bash
# Run application
voice-transcriber              # or: make run

# Enable debug mode
voice-transcriber --debug

# Edit configuration
nano ~/.config/voice-transcriber/config.json

# Check system dependencies
make check-system-deps

# Test audio devices
arecord -l
```

### Recording Workflow

```
1. Click tray icon → 🟢 to 🔴
2. Speak into microphone
3. Click again → 🔴 to 🟣
4. Wait for processing
5. Paste result (Ctrl+V)
```

---

!!! question "Need Help?"
    - [Troubleshooting Guide](../user-guide/troubleshooting.md)
    - [GitHub Issues](https://github.com/Nouuu/voice-transcriber/issues)
