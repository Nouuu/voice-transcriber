# Voice Transcriber - Troubleshooting Guide

## Quick Diagnostics

### First Steps for Any Issue

```bash
# 1. Check system dependencies
make check-deps

# 2. Verify configuration
cat ~/.config/voice-transcriber/config.json

# 3. Check recent logs
make dev  # Watch console output

# 4. Test with minimal setup
make test
```

### Health Check Commands

```bash
# System Dependencies
which arecord    # Should return /usr/bin/arecord
which xsel       # Should return /usr/bin/xsel
arecord -l       # List audio devices

# Application Status
make run         # Check startup logs
ls -la ~/.config/voice-transcriber/  # Check config directory
ls -la /tmp/transcriber/  # Check temp files
```

## Common Issues and Solutions

### 🚨 Application Won't Start

#### Symptom
```bash
$ make run
Failed to start: OpenAI API key not configured
```

**Solution 1: Missing API Key**
```bash
# Check configuration
cat ~/.config/voice-transcriber/config.json

# If file missing or empty, add API key:
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

# Get API key from: https://platform.openai.com/api-keys
```

**Solution 2: Invalid Configuration Format**
```bash
# Validate JSON format
cat ~/.config/voice-transcriber/config.json | jq .

# If JSON is invalid, recreate:
rm ~/.config/voice-transcriber/config.json
make run  # Will trigger setup wizard
```

**Solution 3: Permission Issues**
```bash
# Check directory permissions
ls -la ~/.config/voice-transcriber/

# Fix permissions if needed
chmod 755 ~/.config/voice-transcriber/
chmod 600 ~/.config/voice-transcriber/config.json
```

### 🔇 System Tray Not Visible

#### Symptom
App starts successfully but no tray icon appears.

**Solution 1: Desktop Environment Check**
```bash
# Check desktop environment
echo $XDG_CURRENT_DESKTOP

# Known working environments:
# - GNOME (with gnome-shell-extension-appindicator)
# - KDE Plasma
# - XFCE with xfce4-indicator-plugin
# - MATE
```

**Solution 2: Install System Tray Support**
```bash
# GNOME - Install AppIndicator extension
# Via GNOME Extensions website or:
sudo apt install gnome-shell-extension-appindicator

# XFCE - Install indicator plugin
sudo apt install xfce4-indicator-plugin

# After installation, restart desktop session
```

**Solution 3: Alternative Desktop Environments**
```bash
# Some minimal window managers don't support system trays
# Try running with stalonetray or similar:
sudo apt install stalonetray
stalonetray &  # Run in background
make run       # Then start voice transcriber
```

**Solution 4: Check Tray Area**
- Look in different corners of your screen
- Try right-clicking in the system tray area
- Check if icons are hidden in an overflow menu
- Some desktop themes hide the system tray by default

### 🎤 Audio Recording Issues

#### Symptom
```bash
Recording failed: Failed to start recording: spawn arecord ENOENT
```

**Solution 1: Install ALSA Utils**
```bash
# Install required audio tools
sudo apt-get update
sudo apt-get install alsa-utils

# Verify installation
which arecord  # Should return /usr/bin/arecord
arecord --version
```

**Solution 2: Audio Device Configuration**
```bash
# List available audio devices
arecord -l

# Test recording manually
arecord -D default -f cd -t wav /tmp/test.wav
# Speak for a few seconds, then Ctrl+C

# Play back to verify
aplay /tmp/test.wav
```

**Solution 3: Permission Issues**
```bash
# Add user to audio group
sudo usermod -a -G audio $USER

# Logout and login again for changes to take effect
# Or run: newgrp audio

# Verify group membership
groups | grep audio
```

**Solution 4: PulseAudio Configuration**
```bash
# If using PulseAudio, check status
pulseaudio --check -v

# Restart PulseAudio if needed
pulseaudio -k
pulseaudio --start

# Test with PulseAudio-specific device
arecord -D pulse -f cd -t wav /tmp/test-pulse.wav
```

#### Symptom
Recording starts but no audio is captured (empty/silent files).

**Solution 1: Microphone Level**
```bash
# Open audio mixer
alsamixer

# Navigate to microphone/capture controls
# Press Tab to switch to capture view
# Use arrow keys to adjust levels
# Ensure microphone is not muted (no MM indicator)
```

**Solution 2: Default Input Device**
```bash
# Check default input device
cat /proc/asound/cards

# Set specific device in arecord command
# Edit src/services/audio-recorder.ts if needed:
# Change "-D", "default" to "-D", "hw:1,0" (for example)
```

### 🌐 API Connection Issues

#### Symptom
```bash
Transcription failed: Failed to transcribe audio: Request failed with status 401
```

**Solution 1: Invalid API Key**
```bash
# Test API key manually
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.openai.com/v1/models

# Should return list of models, not error
# If error, get new API key from: https://platform.openai.com/api-keys
```

**Solution 2: Rate Limiting**
```bash
# Check OpenAI usage dashboard
# Visit: https://platform.openai.com/usage

# Wait for rate limit reset or upgrade plan
# Monitor usage to avoid limits
```

**Solution 3: Network Issues**
```bash
# Test connectivity
curl -I https://api.openai.com

# Check proxy settings if behind corporate firewall
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Configure proxy in environment if needed
export HTTPS_PROXY=http://proxy.company.com:8080
```

#### Symptom
```bash
Transcription failed: Network timeout
```

**Solution: Network Configuration**
```bash
# Increase timeout (if needed, modify transcription service)
# Check network stability
ping -c 4 api.openai.com

# Test with smaller audio files first
# Large files may timeout on slow connections
```

### 📋 Clipboard Issues

#### Symptom
```bash
Clipboard failed: Failed to write to clipboard: xsel: command not found
```

**Solution 1: Install Clipboard Tools**
```bash
# Install xsel (preferred) or xclip
sudo apt-get install xsel

# Or alternative:
sudo apt-get install xclip

# Verify installation
which xsel
```

**Solution 2: Display Environment**
```bash
# Ensure DISPLAY is set for X11
echo $DISPLAY  # Should show :0 or similar

# For Wayland, some clipboard tools need special handling
# Try wl-clipboard instead:
sudo apt-get install wl-clipboard
```

**Solution 3: Permission Issues**
```bash
# Test clipboard manually
echo "test" | xsel -ib  # Copy to clipboard
xsel -ob               # Paste from clipboard

# Should echo "test" if working correctly
```

### 🔄 System Performance Issues

#### Symptom
High memory usage or slow performance.

**Solution 1: Monitor Resource Usage**
```bash
# Monitor while running
htop
# Look for voice-transcriber process

# Check memory usage
ps aux | grep voice-transcriber

# Monitor disk I/O
iotop
```

**Solution 2: Cleanup Temporary Files**
```bash
# Clean temp directory
rm -rf /tmp/transcriber/*

# Set cleanup cron job if needed
crontab -e
# Add: 0 2 * * * rm -rf /tmp/transcriber/*
```

**Solution 3: Reduce Resource Usage**
```bash
# Disable text formatting to reduce API calls
# Edit ~/.config/voice-transcriber/config.json:
{
  "formatterEnabled": false,
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "your-key"
    }
  }
}
```

### 🔧 Development Issues

#### Symptom
```bash
$ make test
Command not found: bun
```

**Solution 1: Install Bun**
```bash
# Install Bun runtime
curl -fsSL https://bun.sh/install | bash

# Reload shell
source ~/.bashrc  # or restart terminal

# Verify installation
bun --version
```

**Solution 2: Use Node.js Alternative**
```bash
# If Bun unavailable, use Node.js
npm install
npm test
npm run dev
```

#### Symptom
```bash
Tests failing with mock errors
```

**Solution: Reset Development Environment**
```bash
# Clean and reinstall
make clean
rm -rf node_modules
make install

# Run tests individually to isolate issues
make test-file FILE=src/services/system-tray.test.ts
```

### 📦 Build and Distribution Issues

#### Symptom
```bash
Build fails with missing dependencies
```

**Solution 1: Dependency Issues**
```bash
# Verify all dependencies installed
bun install

# Check for peer dependency warnings
bun install --production=false

# Update dependencies if needed
bun update
```

**Solution 2: Asset Loading Issues**
```bash
# Verify assets are included in build
ls -la dist/
cat dist/index.js | grep -i icon

# Check asset paths in production
node dist/index.js
```

## Configuration Management Issues

### 🔧 "Open Config" Button Does Nothing

#### Symptom
Clicking "Open Config" in the system tray menu has no visible effect.

**Solution 1: Default Text Editor Not Configured**
```bash
# Check if xdg-open is working
xdg-open ~/.config/voice-transcriber/config.json

# If it fails, set default text editor
xdg-mime default org.gnome.gedit.desktop text/plain
# Or for other editors:
xdg-mime default code.desktop text/plain  # VS Code
```

**Solution 2: Configuration File Missing**
```bash
# Check if file exists
ls -la ~/.config/voice-transcriber/config.json

# If missing, run setup wizard
rm -rf ~/.config/voice-transcriber/
make run  # Triggers first-run setup
```

**Solution 3: File Permissions**
```bash
# Check file permissions
ls -la ~/.config/voice-transcriber/

# Fix if needed
chmod 644 ~/.config/voice-transcriber/config.json
chmod 755 ~/.config/voice-transcriber/
```

### 🔄 "Reload Config" Button Always Disabled

#### Symptom
The "Reload Config" menu item is always grayed out.

**Solution: Application Not in Idle State**

The reload button is **only enabled when idle** (green icon). It's disabled during:

- **Recording** (🔴): Would interrupt audio capture
- **Processing** (🟣): Would interfere with transcription

**How to enable reload**:
1. Wait for current operation to complete
2. Ensure tray icon is green (idle)
3. Right-click and check if "Reload Config" is now enabled

**Check application state**:
```bash
# Run in debug mode to see state changes
voice-transcriber --debug
# Watch for: "State changed from X to idle"
```

### ❌ Reload Failed: Invalid Configuration

#### Symptom
```
Failed to reload configuration: API key not configured for openai backend
```

**Solution: Validate Configuration Before Reload**

**Validation Checklist**:
```json
{
  "language": "en",              // ✅ Required
  "formatterEnabled": true,      // ✅ Required
  "transcription": {             // ✅ Required
    "backend": "openai",         // ✅ Required: "openai" or "speaches"
    "openai": {
      "apiKey": "sk-proj-..."    // ✅ Required if backend=openai
    }
  }
}
```

**Common validation errors**:

1. **Missing API Key**
   ```json
   // ❌ Wrong
   { "transcription": { "backend": "openai" } }
   
   // ✅ Correct
   {
     "transcription": {
       "backend": "openai",
       "openai": { "apiKey": "sk-proj-..." }
     }
   }
   ```

2. **Invalid Backend**
   ```json
   // ❌ Wrong
   { "transcription": { "backend": "whisper" } }
   
   // ✅ Correct
   { "transcription": { "backend": "openai" } }
   // or
   { "transcription": { "backend": "speaches" } }
   ```

3. **Invalid JSON Syntax**
   ```bash
   # Validate JSON before reload
   cat ~/.config/voice-transcriber/config.json | jq .
   # If it shows errors, fix syntax
   ```

### 🔁 Configuration Reloaded But Changes Not Taking Effect

#### Symptom
Changed configuration and reloaded, but application still uses old settings.

**Solution 1: Check Configuration Syntax**
```bash
# Verify your changes were saved
cat ~/.config/voice-transcriber/config.json

# Validate JSON
jq . ~/.config/voice-transcriber/config.json
```

**Solution 2: Invalid Configuration Values**

Some values may be ignored if invalid:
```json
// ❌ Invalid language (will use default "en")
{ "language": "japanese" }

// ✅ Supported languages only
{ "language": "fr" }  // fr, en, es, de, it
```

**Solution 3: Service Initialization Failed**

Check console for errors:
```bash
# Run in debug mode
voice-transcriber --debug

# Look for error messages like:
# "Failed to reload configuration: ..."
# "Rolling back to previous configuration..."
```

**Solution 4: Reload Was Rolled Back**

If configuration validation failed, the reload was automatically rolled back:

1. Check console logs for error message
2. Fix the configuration issue
3. Save the file
4. Try reload again

### 💥 Application Crashes After Reload

#### Symptom
Application exits unexpectedly after clicking "Reload Config".

**Solution 1: Check Recent Changes**

Reload automatically rolls back on error, but if crash persists:

```bash
# Restore backup if you have one
cp ~/.config/voice-transcriber/config.json.bak \
   ~/.config/voice-transcriber/config.json

# Or reset to defaults
rm ~/.config/voice-transcriber/config.json
make run  # Triggers setup wizard
```

**Solution 2: Debug the Crash**
```bash
# Run with debug logging
voice-transcriber --debug 2>&1 | tee crash.log

# Try reload
# After crash, check crash.log for error details
```

**Solution 3: Report the Bug**

If crash persists with valid configuration:

1. Save your configuration file
2. Save debug logs
3. Report issue at: [GitHub Issues](https://github.com/yourusername/transcriber/issues)
4. Include:
   - Configuration file (remove API keys!)
   - Debug logs
   - Steps to reproduce

### 📝 Best Practices for Configuration Changes

To avoid issues when modifying configuration:

1. **Test Changes Incrementally**
   ```bash
   # Change one setting at a time
   # Reload and test
   # If works, change next setting
   ```

2. **Validate JSON Before Reload**
   ```bash
   # Always validate after editing
   jq . ~/.config/voice-transcriber/config.json
   ```

3. **Keep Backups**
   ```bash
   # Backup before major changes
   cp ~/.config/voice-transcriber/config.json \
      ~/.config/voice-transcriber/config.json.bak
   ```

4. **Use Reload During Idle**
   - Wait for green icon (idle state)
   - Don't reload during recording or processing
   - Check console for reload success message

5. **Monitor Logs**
   ```bash
   # Watch logs during reload
   voice-transcriber --debug
   # Look for: "✅ Configuration reloaded successfully"
   ```

## Advanced Troubleshooting

### Debug Mode

Enable detailed logging for debugging:

```typescript
// Temporary debug logging in services
console.log("Debug: service state", { variable, state });

// Or modify logger to show debug messages
// In src/utils/logger.ts, add debug level
```

### System Integration Testing

```bash
# Test each component independently

# 1. Test audio recording
arecord -D default -f cd -t wav /tmp/manual-test.wav
# Speak for 5 seconds, then Ctrl+C

# 2. Test API connection
curl -X POST https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file="@/tmp/manual-test.wav" \
  -F model="whisper-1"

# 3. Test clipboard
echo "test clipboard" | xsel -ib
xsel -ob  # Should output "test clipboard"
```

### Log Analysis

```bash
# Capture detailed logs
make dev 2>&1 | tee debug.log

# Analyze patterns
grep -i error debug.log
grep -i failed debug.log
grep -i timeout debug.log

# Monitor in real-time
tail -f debug.log | grep -E "(error|failed|timeout)"
```

### Network Debugging

```bash
# Monitor network traffic
sudo tcpdump -i any host api.openai.com

# Check DNS resolution
nslookup api.openai.com

# Test with verbose curl
curl -v https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Error Codes Reference

### Application Error Codes

- `OpenAI API key not configured`: Missing or empty API key in config
- `System tray failed`: Desktop environment doesn't support system tray
- `Recording failed`: Audio system not available or misconfigured
- `Transcription failed`: API error or network issue
- `Clipboard failed`: Clipboard tools not installed or display issue

### Exit Codes

- `0`: Normal exit
- `1`: Configuration error or initialization failure
- `130`: Interrupted by user (Ctrl+C)

### Log Message Patterns

```bash
# Normal operation
[INFO] Voice Transcriber initialized successfully
[INFO] Starting recording...
[INFO] Transcribing audio...
[INFO] Text copied to clipboard successfully

# Error patterns
[ERROR] Recording failed: ...
[ERROR] Transcription failed: ...
[ERROR] Clipboard failed: ...
[ERROR] System tray failed: ...
```

## Getting Help

### Before Reporting Issues

1. **Check Known Issues**: Review this troubleshooting guide
2. **Test Basic Functionality**: Run `make test` and `make check-deps`
3. **Gather System Information**:
   ```bash
   # System info
   uname -a
   lsb_release -a
   echo $XDG_CURRENT_DESKTOP

   # Audio info
   arecord -l
   pactl info  # If using PulseAudio

   # Application info
   bun --version
   make get-version
   ```

### Issue Reporting Template

When reporting issues, include:

```markdown
**Environment:**
- OS: Ubuntu 22.04
- Desktop: GNOME 42
- Bun version: 1.2.0
- Audio system: PulseAudio

**Issue:**
Brief description of the problem

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Logs:**
```
Paste relevant log output here
```

**System Check:**
```
Output of: make check-deps
```
```

### Community Resources

- **GitHub Issues**: https://github.com/Nouuu/voice-transcriber/issues
- **Documentation**: https://github.com/Nouuu/voice-transcriber#readme
- **npm Package**: https://www.npmjs.com/package/voice-transcriber

This troubleshooting guide covers the most common issues encountered with Voice Transcriber. Most problems can be resolved by following these step-by-step solutions.