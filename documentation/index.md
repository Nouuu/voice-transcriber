# Voice Transcriber Documentation

<div align="center" markdown="1">

# 🎤 Voice Transcriber

Lightweight desktop voice-to-text transcription with OpenAI Whisper and system tray integration

[![Build](https://github.com/Nouuu/voice-transcriber/actions/workflows/build.yml/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/build.yml)
[![Test](https://github.com/Nouuu/voice-transcriber/actions/workflows/test.yml/badge.svg)](https://github.com/Nouuu/voice-transcriber/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Nouuu/voice-transcriber/blob/main/LICENSE)
[![Bun](https://img.shields.io/badge/bun-%3E%3D1.2.0-black)](https://bun.sh)

</div>

---

## Overview

Voice Transcriber is a **lightweight desktop application** that provides seamless voice-to-text conversion with **system tray integration**. Record audio with a single click, and transcribed text is automatically copied to your clipboard.

<div class="grid cards" markdown>

-   :material-microphone:{ .lg .middle } **System Tray Integration**

    ---

    Click to record, visual state feedback (green=idle, red=recording, purple=processing)

-   :material-earth:{ .lg .middle } **Multilingual Support**

    ---

    French, English, Spanish, German, Italian with strong language enforcement

-   :material-robot:{ .lg .middle } **AI-Powered**

    ---

    OpenAI Whisper transcription with optional GPT text formatting

-   :material-home:{ .lg .middle } **Self-Hosted Option**

    ---

    Run 100% offline with [Speaches](https://github.com/speaches-ai/speaches) - zero cost, complete privacy

</div>

## Key Features

- **🎯 System Tray Integration**: Click to record, visual state feedback
- **🎙️ High-Quality Recording**: Audio capture using arecord on Linux
- **🌍 Multilingual Support**: French, English, Spanish, German, Italian
- **✍️ Text Formatting**: Optional GPT-based grammar improvement
- **📋 Clipboard Integration**: Automatic result copying
- **🏠 Self-Hosted Option**: Run 100% offline with Speaches
- **🔒 Privacy-Focused**: No persistent audio storage, local processing

## Quick Start

Get started in under 5 minutes:

=== "Automated Setup"

    ```bash
    # Clone and setup
    git clone https://github.com/Nouuu/voice-transcriber.git
    cd voice-transcriber
    make setup

    # Configure API key
    nano ~/.config/voice-transcriber/config.json

    # Run
    make run
    ```

=== "Manual Setup"

    ```bash
    # Install Bun runtime
    curl -fsSL https://bun.sh/install | bash

    # Install system dependencies
    sudo apt-get install alsa-utils xsel

    # Clone repository
    git clone https://github.com/Nouuu/voice-transcriber.git
    cd voice-transcriber

    # Install dependencies
    bun install

    # Initialize config
    make init-config
    ```

!!! tip "Next Steps"
    - [Installation Guide](getting-started/installation/) - Detailed setup instructions
    - [Configuration](getting-started/configuration/) - Configure languages and backends
    - [Basic Usage](user-guide/basic-usage/) - Learn how to use the app

## How It Works

```mermaid
sequenceDiagram
    participant User
    participant SystemTray
    participant AudioRecorder
    participant Whisper as OpenAI Whisper
    participant GPT as OpenAI GPT
    participant Clipboard

    User->>SystemTray: Click tray icon
    SystemTray->>SystemTray: State: RECORDING (🔴)
    SystemTray->>AudioRecorder: Start recording
    AudioRecorder->>AudioRecorder: Capture audio (arecord)
    User->>SystemTray: Click again to stop
    SystemTray->>SystemTray: State: PROCESSING (🟣)
    AudioRecorder->>AudioRecorder: Save WAV file
    AudioRecorder->>Whisper: Upload audio
    Whisper->>Whisper: Transcribe audio
    Whisper-->>AudioRecorder: Return text
    opt Formatting Enabled
        AudioRecorder->>GPT: Format text
        GPT-->>AudioRecorder: Formatted text
    end
    AudioRecorder->>Clipboard: Copy text
    Clipboard-->>User: Paste transcription
    SystemTray->>SystemTray: State: IDLE (🟢)
```

## Popular Use Cases

<div class="grid cards" markdown>

-   **📝 Note Taking**

    Record meetings, lectures, or brainstorming sessions with automatic transcription

-   **💬 Message Dictation**

    Quickly dictate messages, emails, or social media posts

-   **🌐 Language Learning**

    Practice pronunciation and see transcriptions in multiple languages

-   **♿ Accessibility**

    Voice-to-text for users with typing difficulties

</div>

## Documentation Structure

<div class="grid cards" markdown>

-   [**Getting Started**](getting-started/installation/)

    Installation, configuration, and first-run setup

-   [**User Guide**](user-guide/basic-usage/)

    Basic usage, language support, and troubleshooting

-   [**Development**](development/architecture/)

    Architecture, development guide, and API reference

-   [**Advanced**](advanced/speaches-integration/)

    Self-hosted setup, whisper models, and local inference

</div>

## Community and Support

- **GitHub Repository**: [nouuu/voice-transcriber](https://github.com/Nouuu/voice-transcriber)
- **npm Package**: [voice-transcriber](https://www.npmjs.com/package/voice-transcriber)
- **Issues**: [Report a bug or request a feature](https://github.com/Nouuu/voice-transcriber/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Nouuu/voice-transcriber/discussions)

## License

This project is licensed under the [MIT License](https://github.com/Nouuu/voice-transcriber/blob/main/LICENSE).

---

<div align="center">
  <p>Built with ❤️ using <a href="https://bun.sh">Bun</a>, <a href="https://www.typescriptlang.org/">TypeScript</a>, and <a href="https://platform.openai.com/">OpenAI</a></p>
</div>
