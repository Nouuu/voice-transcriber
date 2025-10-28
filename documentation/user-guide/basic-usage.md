# Basic Usage Guide

Learn how to use Voice Transcriber effectively for everyday voice-to-text transcription.

## System Tray Interface

Voice Transcriber operates through a **system tray icon** with three visual states:

<div class="grid cards" markdown>

-   :material-circle:{ .lg style="color: green" } **IDLE**

    ---

    **Green circle** - Ready to record

    Click to start recording

-   :material-circle:{ .lg style="color: red" } **RECORDING**

    ---

    **Red circle** - Currently recording

    Speak into microphone, click to stop

-   :material-circle:{ .lg style="color: purple" } **PROCESSING**

    ---

    **Purple circle** - Transcribing audio

    Wait for completion, result copied to clipboard

</div>

## Recording Audio

### Start Recording

**Method 1: Click tray icon**

1. Left-click the system tray icon (green circle)
2. Icon changes to red
3. Start speaking into your microphone

**Method 2: Context menu**

1. Right-click the system tray icon
2. Select "Start Recording"
3. Icon changes to red
4. Start speaking

!!! tip "Microphone Position"
    For best results, position your microphone 15-30 cm from your mouth

### Stop Recording

**Method 1: Click tray icon again**

1. Left-click the system tray icon (red circle)
2. Icon changes to purple (processing)
3. Wait for transcription

**Method 2: Context menu**

1. Right-click the system tray icon
2. Select "Stop Recording"
3. Icon changes to purple (processing)

### Automatic Clipboard Copy

Once processing completes:

1. Icon returns to green (idle)
2. Transcribed text is **automatically copied to your clipboard**
3. Paste anywhere with `Ctrl+V` (Linux) or `Cmd+V` (macOS)

## Example Workflow

=== "Quick Note"

    ```
    1. Click tray icon (🟢 → 🔴)
    2. "Make a note to follow up with the client tomorrow"
    3. Click again (🔴 → 🟣)
    4. Wait 2-3 seconds
    5. Paste in your notes app: "Make a note to follow up with the client tomorrow."
    ```

=== "Email Dictation"

    ```
    1. Click tray icon
    2. "Hi team, I wanted to share an update on the project..."
    3. Click again
    4. Wait for processing
    5. Paste in email client: "Hi team, I wanted to share an update on the project..."
    ```

=== "Meeting Notes"

    ```
    1. Start recording at beginning of meeting
    2. Let meeting proceed naturally
    3. Stop recording at end
    4. Paste transcription in notes document
    5. Review and edit as needed
    ```

## Context Menu Options

Right-click the tray icon for available actions:

```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ─────────────────
├── ☑ Default
├── ☐ Professional
├── ☐ Technical
├── ☐ Creative
├── ☐ Emojify
├── ─────────────────
├── 💾 Save as Default
├── ⚙️ Open Config
├── 🔄 Reload Config
└── ❌ Exit
```

### Core Actions

**Start Recording**
: Begin audio capture (disabled while recording)
: Same as left-click when idle

**Stop Recording**
: End recording and transcribe (enabled only while recording)
: Same as left-click when recording

### Formatting Personalities

**Personality Checkboxes** (Default, Professional, Technical, Creative, Emojify)
: Toggle formatting styles on/off
: Multiple personalities can be active simultaneously
: See [Formatting Personalities](formatting-personalities.md) for details

**💾 Save as Default**
: Save your current personality preferences to config file
: No need to manually edit `config.json`
: Changes persist across restarts

!!! tip "Quick Personality Changes"
    1. Check/uncheck personalities to test different combinations
    2. Click "💾 Save as Default" when you find your favorite setup
    3. Restart → Your preferences are restored automatically

### Configuration Actions

**Open Config**
: Opens configuration file in your default text editor
: Always available

**Reload Config**
: Reloads configuration without restarting
: Only available when idle (not recording or processing)
: See [Configuration Management](../advanced/configuration-management.md) for details

**Exit**
: Exit the application gracefully

!!! note "Menu State Management"
    Menu items automatically enable/disable based on application state to prevent accidental errors.
    
    | Menu Item | Idle (🟢) | Recording (🔴) | Processing (🟣) |
    |-----------|-----------|----------------|-----------------|
    | Start Recording | ✅ Enabled | ❌ Disabled | ❌ Disabled |
    | Stop Recording | ❌ Disabled | ✅ Enabled | ❌ Disabled |
    | Personalities | ✅ Enabled | ✅ Enabled | ✅ Enabled |
    | Save as Default | ✅ Enabled | ❌ Disabled | ❌ Disabled |
    | Open Config | ✅ Enabled | ✅ Enabled | ✅ Enabled |
    | Reload Config | ✅ Enabled | ❌ Disabled | ❌ Disabled |
    | Exit | ✅ Enabled | ✅ Enabled | ✅ Enabled |

## Advanced Features

### Configuration Reload

You can modify your configuration and reload it without restarting:

1. Right-click → "⚙️ Open Config"
2. Edit settings (language, backend, etc.)
3. Save the file
4. Right-click → "🔄 Reload Config"

Changes take effect immediately!

!!! tip "For Advanced Users"
    See [Configuration Management](../advanced/configuration-management.md) for:
    
    - Change detection (debug mode)
    - Safety features and validation
    - Advanced workflows
    - Troubleshooting reload issues

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
voice-transcriber --debug
```

Shows performance metrics, file sizes, processing times, and more.

!!! tip "For Advanced Users"
    See [Debug Mode](../advanced/debug-mode.md) for:
    
    - Complete debug output reference
    - Performance analysis
    - Backend comparison
    - Benchmark mode


## Best Practices

### For Accuracy

!!! tip "Improve Transcription Quality"
    - **Speak clearly** at a moderate pace
    - **Minimize background noise** when possible
    - **Use a quality microphone** for best results
    - **Pause between sentences** for better formatting

### For Efficiency

!!! tip "Maximize Productivity"
    - **Use keyboard shortcuts** (if your desktop environment supports global hotkeys)
    - **Record in chunks** for long dictations (easier to review)
    - **Review transcriptions** before using (especially for technical content)
    - **Customize language settings** for consistent results

### For Multilingual Use

!!! tip "Language Consistency"
    - **Set primary language** in config file
    - **Restart after language changes** for prompts to take effect
    - **Avoid language mixing** for best accuracy
    - See [Language Support](language-support.md) for details

## Common Use Cases

### Note Taking

**Perfect for**: Meeting notes, lecture notes, brainstorming sessions

**Tips**:
- Record entire meeting or lecture
- Transcribe in segments for easier review
- Edit transcription afterward for clarity

### Message Dictation

**Perfect for**: Emails, chat messages, social media posts

**Tips**:
- Speak naturally but with clear punctuation
- Enable formatter for proper capitalization
- Review before sending

### Content Creation

**Perfect for**: Blog posts, articles, scripts

**Tips**:
- Outline first, then dictate sections
- Use short recordings for easier editing
- Transcribe ideas quickly without typing

### Accessibility

**Perfect for**: Users with typing difficulties, RSI, or mobility issues

**Tips**:
- Configure comfortable microphone position
- Use voice commands in conjunction with transcription
- Combine with accessibility tools in your OS

## Performance Expectations

### Transcription Speed

| Recording Length | Processing Time | Notes |
|-----------------|----------------|-------|
| 5-10 seconds | 1-2 seconds | Near-instant |
| 30 seconds | 2-4 seconds | Very fast |
| 1 minute | 3-6 seconds | Fast |
| 5 minutes | 10-20 seconds | Moderate |
| 10+ minutes | 20-40 seconds | Longer wait |

!!! info "Processing Time Factors"
    - OpenAI API response time
    - Audio file size and compression
    - Internet connection speed
    - GPT formatting (adds 1-2 seconds if enabled)

### Accuracy Expectations

| Content Type | Expected Accuracy | Notes |
|-------------|------------------|-------|
| Clear speech | 95-98% | Excellent |
| Technical terms | 85-95% | Good, may need review |
| Accented speech | 80-95% | Varies by accent |
| Noisy environment | 70-85% | Reduced accuracy |
| Mixed languages | 75-90% | See language support |

## Keyboard Shortcuts (Future Feature)

!!! warning "Coming Soon"
    Global keyboard shortcuts are planned for a future release. Currently, Wayland security restrictions prevent global hotkey registration. This feature will be available when Wayland adds proper hotkey support.

## Next Steps

- [Language Support](language-support.md) - Multilingual transcription
- [Transcription Backends](transcription-backends.md) - OpenAI vs Speaches
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

---

!!! question "Need Help?"
    - [Troubleshooting Guide](troubleshooting.md)
    - [GitHub Issues](https://github.com/Nouuu/voice-transcriber/issues)
