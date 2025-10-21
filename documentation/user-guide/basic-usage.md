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
├── ⚙️ Open Config
├── 🔄 Reload Config
└── ❌ Exit
```

### Menu Actions

**Start Recording**
: Begin audio capture (disabled while recording)
: Same as left-click when idle

**Stop Recording**
: End recording and transcribe (enabled only while recording)
: Same as left-click when recording

**Open Config**
: Opens configuration file in your default text editor
: Always available

**Reload Config**
: Reloads configuration without restarting the application
: Only available when idle (not recording or processing)

**Exit**
: Exit the application gracefully

!!! note "Menu Behavior"
    Menu items automatically enable/disable based on state:
    
    | Menu Item | Idle (🟢) | Recording (🔴) | Processing (🟣) |
    |-----------|-----------|----------------|-----------------|
    | Start Recording | ✅ Enabled | ❌ Disabled | ❌ Disabled |
    | Stop Recording | ❌ Disabled | ✅ Enabled | ❌ Disabled |
    | Open Config | ✅ Enabled | ✅ Enabled | ✅ Enabled |
    | Reload Config | ✅ Enabled | ❌ Disabled | ❌ Disabled |
    | Exit | ✅ Enabled | ✅ Enabled | ✅ Enabled |

## Configuration Management

You can now manage configuration directly from the system tray menu without restarting the application.

### Quick Configuration Workflow

1. **Open Config**: Right-click tray icon → "Open Config"
2. **Edit**: Make your changes in the text editor
3. **Save**: Save the configuration file
4. **Reload**: Right-click tray icon → "Reload Config" (when idle)

### When to Use Reload Config

**Reload Config** is useful when you want to:

- Switch between transcription backends (OpenAI ↔ Speaches)
- Test different language settings
- Update API keys
- Change transcription or formatting prompts
- Enable/disable the formatter

!!! success "Live Configuration Updates"
    Changes take effect immediately after reload - no need to restart the application!

!!! warning "Reload Restrictions"
    **Reload Config** is disabled during:
    
    - **Recording** (🔴): Would interrupt audio capture
    - **Processing** (🟣): Would interfere with transcription
    
    Wait for the icon to turn green (idle) before reloading configuration.

### Configuration Reload Safety

The reload process includes automatic safety checks:

- **Validation**: Configuration is validated before applying
- **Rollback**: Previous configuration is restored if reload fails
- **Service reinitialization**: All services are properly restarted with new settings

If reload fails, you'll see an error message and the previous configuration will be restored automatically.

## Debug Mode

Enable debug mode for detailed logging and performance metrics:

```bash
voice-transcriber --debug
```

### What Debug Mode Shows

Debug mode provides detailed information about:

- **File sizes**: WAV and MP3 file sizes with compression ratios
- **Audio format**: Sample rate, channels, conversion details
- **Processing times**: Breakdown of upload, processing, and response times
- **Transcription details**: Character count, duration metrics

### Example Debug Output

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

### When to Use Debug Mode

!!! tip "Debug Mode Use Cases"
    - **Troubleshooting**: Identify where delays occur in the transcription pipeline
    - **Performance analysis**: Understand audio compression effectiveness
    - **Quality verification**: Check audio format and processing details
    - **Benchmarking**: Compare different backends or configurations

### Disabling Debug Mode

Simply run without the `--debug` flag:

```bash
voice-transcriber
```

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
