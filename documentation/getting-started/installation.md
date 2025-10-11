# Installation Guide

This guide will help you install Voice Transcriber on your Linux system.

## Prerequisites

Before installing Voice Transcriber, ensure you have the following:

### 1. Bun Runtime

Voice Transcriber requires **Bun ≥1.2.0**:

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version  # Should output ≥1.2.0
```

**Bun documentation**: [https://bun.sh](https://bun.sh)

### 2. System Dependencies

Install required system packages:

```bash
sudo apt-get update
sudo apt-get install alsa-utils xsel
```

**Package purposes**:

- `alsa-utils`: Provides `arecord` for audio recording
- `xsel`: Cross-platform clipboard integration

**Verify installation**:

```bash
which arecord  # Should output: /usr/bin/arecord
which xsel     # Should output: /usr/bin/xsel
```

!!! tip "Quick Check"
    You can verify all prerequisites at once with:
    ```bash
    make check-system-deps
    ```

## Installation Methods

### Automated Setup (Recommended)

The fastest way to get started - one command does everything:

```bash
# Step 1: Clone the repository
git clone https://github.com/Nouuu/voice-transcriber.git
cd voice-transcriber

# Step 2: Run automated setup
make setup
```

**What `make setup` does**:

- ✅ Checks all system dependencies (Bun, arecord, xsel)
- ✅ Installs Bun dependencies
- ✅ Creates configuration file at `~/.config/voice-transcriber/config.json`
- ✅ Displays next steps

### Manual Setup

If you prefer step-by-step installation:

```bash
# Step 1: Clone repository
git clone https://github.com/Nouuu/voice-transcriber.git
cd voice-transcriber

# Step 2: Check system dependencies
make check-system-deps

# Step 3: Install Bun dependencies
make install

# Step 4: Initialize configuration file
make init-config
```

## Configuration

After installation, configure your OpenAI API key:

```bash
# Edit configuration file
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

**Get your OpenAI API key**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

!!! tip "Configuration Options"
    See the [Configuration Guide](configuration.md) for detailed configuration options including language settings, custom prompts, and self-hosted backends.

## Global Installation (Optional)

Install the `voice-transcriber` command globally:

```bash
make install-global
```

This allows you to run the application from anywhere:

```bash
# Run from any directory
voice-transcriber

# Enable debug mode
voice-transcriber --debug
```

### Uninstall Global Command

To remove the global command:

```bash
make uninstall-global
```

## Running the Application

### Production Mode

Run the application normally:

```bash
# If installed globally
voice-transcriber

# Or from project directory
make run
```

### Development Mode

Run with auto-reload for development:

```bash
make dev
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Global installation
voice-transcriber --debug

# Or from project directory
make run ARGS="--debug"
```

**Debug output includes**:

- File sizes (WAV and MP3 compression ratios)
- Audio format details (sample rate, channels)
- Processing times (upload, processing, response)
- Transcription metrics (character count, duration)

## Verification

Verify your installation:

```bash
# 1. Check all system dependencies at once
make check-system-deps

# 2. Verify configuration exists
cat ~/.config/voice-transcriber/config.json

# 3. Test audio recording
arecord -l  # Should list your audio devices

# 4. Run the application
make run
```

Look for the **green circle** system tray icon indicating the app is ready.

## Platform-Specific Notes

### Ubuntu 22.04+

Fully supported with default installation steps.

### Other Linux Distributions

- **Debian/Mint**: Same as Ubuntu instructions
- **Arch/Manjaro**: Use `pacman -S alsa-utils xsel`
- **Fedora/RHEL**: Use `dnf install alsa-utils xsel`

### Wayland vs X11

Works on both Wayland and X11 desktop environments. System tray integration tested on:

- GNOME (Wayland and X11)
- KDE Plasma
- XFCE
- MATE

!!! warning "Windows and macOS Support"
    Currently, Voice Transcriber only supports Linux. Windows and macOS support is planned for future releases.

## Troubleshooting Installation

### Bun Installation Fails

If Bun installation fails:

```bash
# Try alternative installation method
npm install -g bun

# Or download binary directly
curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.0"
```

### System Dependencies Not Found

If `arecord` or `xsel` are not found:

```bash
# Verify package manager
which apt-get  # Debian/Ubuntu
which pacman   # Arch
which dnf      # Fedora

# Update package cache
sudo apt-get update  # Ubuntu
```

### Permission Issues

If you encounter permission errors:

```bash
# Ensure user is in audio group
sudo usermod -a -G audio $USER

# Log out and log back in for changes to take effect
```

### Config File Not Created

If config file isn't created automatically:

```bash
# Create directory and initialize config manually
make init-config
```

## Available Make Commands

Voice Transcriber includes many helpful make commands:

```bash
# View all available commands
make help

# Setup & Installation
make setup              # Complete automated setup
make check-system-deps  # Verify system dependencies
make install            # Install Bun dependencies only
make init-config        # Create config file

# Running
make run                # Run the application
make dev                # Development mode with watch

# Testing & Quality
make test               # Run all tests
make lint               # Run ESLint linting
make format             # Format code with Prettier

# Documentation
make docs-serve         # Serve documentation locally
```

## Next Steps

- [Configuration Guide](configuration.md) - Configure languages and backends
- [First Run](first-run.md) - First-time setup walkthrough
- [Basic Usage](../user-guide/basic-usage.md) - Learn how to use the app

---

!!! question "Need Help?"
    - [Troubleshooting Guide](../user-guide/troubleshooting.md) - Common issues and solutions
    - [GitHub Issues](https://github.com/Nouuu/voice-transcriber/issues) - Report bugs or request features
