# Debug Mode

Comprehensive guide to Voice Transcriber's debug mode for troubleshooting, performance analysis, and development.

---

## Overview

Debug mode provides detailed logging and metrics about the entire transcription pipeline, from audio capture to clipboard copying.

### Enabling Debug Mode

```bash
voice-transcriber --debug
# or
voice-transcriber -d
```

---

## What Debug Mode Shows

### 1. Audio Recording Details

**File Information**:
```
[DEBUG] Starting audio recording to: /tmp/transcriber/recording-2025-10-29T10-30-00-000Z.wav
[DEBUG] Stopping audio recording (duration: 15.42s)
```

**File Sizes**:
```
[DEBUG] WAV file size: 2.75 MB (2888332 bytes)
[DEBUG] WAV format: 2 channel(s), 44100 Hz sample rate
```

**Audio Conversion**:
```
[DEBUG] Converting WAV to MP3: /tmp/transcriber/recording-2025-10-29T10-30-00-000Z.wav
[DEBUG] Audio downsampled from 44100 Hz to 16000 Hz
[DEBUG] MP3 file size: 0.13 MB (131616 bytes)
[DEBUG] Compression ratio: 95.4% size reduction
[DEBUG] WAV to MP3 conversion completed in 2.20 seconds
```

---

### 2. Transcription Backend Details

**OpenAI Whisper**:
```
[DEBUG] Starting OpenAI Whisper transcription for file: /tmp/transcriber/recording.mp3
[DEBUG] File size: 0.13 MB (131616 bytes)
[DEBUG] Model: whisper-1
[INFO] OpenAI transcription completed in 4.25s
[DEBUG]   └─ Estimated breakdown: upload ~1.28s, processing ~2.55s, receive ~0.43s
[DEBUG]   └─ Transcription length: 247 characters
```

**Speaches**:
```
[DEBUG] Speaches client initialized with URL: https://speaches.example.com/v1/
[DEBUG] Preloading Speaches model: Systran/faster-whisper-medium
[INFO] Speaches model preloaded successfully: Systran/faster-whisper-medium
[DEBUG] Starting Speaches transcription for file: /tmp/transcriber/recording.mp3
[DEBUG] File size: 0.13 MB (131616 bytes)
[DEBUG] Model: Systran/faster-whisper-medium
[INFO] Speaches transcription completed in 2.18s
[DEBUG]   └─ Estimated breakdown: upload ~0.65s, processing ~1.31s, receive ~0.22s
[DEBUG]   └─ Transcription length: 247 characters
```

---

### 3. Formatting Details

**Personality Information**:
```
[INFO] Formatting text with personalities: builtin:professional, builtin:emojify
[DEBUG] Using Professional personality prompt
[DEBUG] Using Emojify personality prompt
```

**Processing Metrics**:
```
[DEBUG] Formatting text (247 chars)
[DEBUG] Language: fr
[DEBUG] Model: gpt-4o-mini
[DEBUG] Formatting completed in 1245ms
```

**Results**:
```
[INFO] Original: "le projet avance bien on a fait de bons progrès"
[INFO] Formatted: "Le projet avance bien! 🎯 Nous avons réalisé de bons progrès. ✨"
```

---

### 4. Configuration Changes (Reload)

When reloading configuration:
```
[INFO] Reloading configuration...
[DEBUG] 🔄 Configuration changes detected:
[DEBUG]   └─ Transcription backend: openai → speaches
[DEBUG]   └─ Transcription model: whisper-1 → Systran/faster-whisper-medium
[DEBUG]   └─ Active personalities: builtin:default → builtin:professional, builtin:emojify
[DEBUG]   └─ Language: en → fr
[INFO] ✅ Configuration reloaded successfully
```

---

## Use Cases

### 1. Performance Analysis

**Identify Bottlenecks**:
```
[DEBUG] WAV to MP3 conversion completed in 2.20 seconds  ← Conversion time
[INFO] OpenAI transcription completed in 4.25s           ← Transcription time
[DEBUG] Formatting completed in 1245ms                   ← Formatting time
```

**Total pipeline time** = 2.20s + 4.25s + 1.25s = ~7.7s

**Optimization targets**:
- If conversion is slow (>3s): Check CPU usage, consider different encoder
- If transcription is slow (>10s): Check network, try different backend
- If formatting is slow (>3s): Try faster model (gpt-3.5-turbo), reduce personalities

---

### 2. Audio Quality Verification

**Check Compression**:
```
[DEBUG] WAV file size: 2.75 MB
[DEBUG] MP3 file size: 0.13 MB
[DEBUG] Compression ratio: 95.4% size reduction
```

**Expectations**:
- Good compression: 90-96% reduction
- Poor compression: <85% reduction (check audio quality settings)

**Check Format**:
```
[DEBUG] WAV format: 2 channel(s), 44100 Hz sample rate
[DEBUG] Audio downsampled from 44100 Hz to 16000 Hz
```

**Verify**:
- Channels: Should be 1 (mono) or 2 (stereo)
- Sample rate: 44100 Hz is ideal for recording
- Downsample to 16000 Hz is normal (Whisper requirement)

---

### 3. Backend Comparison

**Test OpenAI**:
```bash
voice-transcriber -d
# Make recording
# Note transcription time: 4.25s
```

**Test Speaches**:
```bash
# Edit config: "backend": "speaches"
# Reload config
voice-transcriber -d
# Make same recording
# Note transcription time: 2.18s
```

**Compare**:
- Speed: Speaches 2.18s vs OpenAI 4.25s (48% faster)
- Quality: Compare transcription accuracy
- Cost: Speaches free vs OpenAI paid

---

### 4. Troubleshooting

**Problem**: Transcription takes too long

**Debug**:
```
[DEBUG] File size: 5.42 MB (5685248 bytes)  ← File too large?
[INFO] OpenAI transcription completed in 25.5s ← Upload bottleneck?
```

**Solutions**:
- Reduce recording length (split into chunks)
- Check internet speed
- Use Speaches locally (no upload time)

---

**Problem**: Low accuracy

**Debug**:
```
[DEBUG] WAV format: 1 channel(s), 16000 Hz sample rate  ← Low quality?
[DEBUG] Compression ratio: 82.3% size reduction          ← Bad compression?
```

**Solutions**:
- Increase recording quality (44100 Hz)
- Check microphone settings
- Reduce background noise

---

## Benchmark Mode

**NEW in v1.x** - Compare OpenAI and Speaches side-by-side.

### Enabling Benchmark Mode

In `config.json`:
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
      "model": "Systran/faster-whisper-medium"
    }
  }
}
```

### Benchmark Output

```
[INFO] 🔬 Benchmark Mode: Transcribing with both OpenAI and Speaches

[INFO] 📊 OpenAI Whisper Results:
[INFO]   └─ Time: 4.25s
[INFO]   └─ Text: "Le projet avance bien. Nous avons fait de bons progrès."

[INFO] 📊 Speaches Results:
[INFO]   └─ Time: 2.18s
[INFO]   └─ Text: "Le projet avance bien, nous avons fait de bons progrès."

[INFO] ⚡ Performance Comparison:
[INFO]   └─ Speaches was 48.7% faster (2.07s saved)

[INFO] 📝 Text Similarity:
[INFO]   └─ Similarity: 94.2%
[INFO]   └─ Differences found: 2
[INFO]     - Word 2: "bien." → "bien,"
[INFO]     - Word 4: "Nous avons" → "nous avons"

[INFO] 🎯 Selected Result: Speaches (higher similarity to combined text)
```

### Interpreting Results

**Speed**:
- **Faster is better** for responsiveness
- Speaches usually faster (local processing)
- OpenAI may be faster for very short audio (<5s)

**Similarity**:
- **>95%**: Virtually identical
- **90-95%**: Minor differences (punctuation, capitalization)
- **<90%**: Significant differences (review both)

**Differences**:
- Punctuation: Usually insignificant
- Capitalization: Can affect meaning
- Words: Review for accuracy

---

## Log Levels

Debug mode shows all log levels:

| Level | Color | When Shown | Use |
|-------|-------|------------|-----|
| DEBUG | Gray | Debug only | Technical details |
| INFO | White | Always | Important info |
| WARN | Yellow | Always | Warnings |
| ERROR | Red | Always | Errors |

### Example Log with All Levels

```
2025-10-29T10:30:00.000Z [INFO] Starting recording...
2025-10-29T10:30:00.005Z [DEBUG] Starting audio recording to: /tmp/transcriber/recording.wav
2025-10-29T10:30:15.420Z [DEBUG] Stopping audio recording (duration: 15.42s)
2025-10-29T10:30:15.425Z [INFO] Audio recording stopped and converted to MP3
2025-10-29T10:30:15.430Z [INFO] Transcribing audio...
2025-10-29T10:30:19.680Z [INFO] OpenAI transcription completed in 4.25s
2025-10-29T10:30:19.685Z [WARN] Transcription result is empty (silence detected?)
2025-10-29T10:30:19.690Z [ERROR] Failed to copy to clipboard: No text to copy
```

---

## Performance Metrics

### Expected Times

**Audio Recording** (real-time):
- 10s recording = 10s elapsed
- No processing time

**WAV to MP3 Conversion**:
- 10s audio → ~0.5-2s conversion
- Depends on CPU speed

**Transcription** (varies):
- OpenAI: ~2-6s for 10s audio
- Speaches (local): ~1-3s for 10s audio
- Network dependent for OpenAI

**Formatting**:
- Single personality: ~500ms-1.5s
- Multiple personalities: ~1-2s
- Depends on text length and LLM

### Total Pipeline

For 30 seconds of audio:

```
Recording:     30.0s (real-time)
Conversion:     1.5s
Transcription:  5.0s
Formatting:     1.5s
Clipboard:      0.1s
─────────────────────
Total:         38.1s
```

**Optimization**:
- Recording: Cannot optimize (real-time)
- Conversion: Use faster CPU or reduce quality
- Transcription: Use Speaches locally
- Formatting: Use faster model or fewer personalities

---

## Advanced Debugging

### Enable Extra Verbose Logging

For development or deep troubleshooting:

```bash
# Set log level via environment
LOG_LEVEL=debug voice-transcriber -d

# Or modify logger.ts temporarily
```

### Capture Logs to File

```bash
voice-transcriber -d 2>&1 | tee debug.log
```

**Analyze later**:
```bash
# Find slow operations
grep "completed in" debug.log

# Find errors
grep ERROR debug.log

# Find warnings
grep WARN debug.log
```

### Profile with timestamps

All logs include ISO timestamps:
```
2025-10-29T10:30:15.420Z [INFO] Transcribing audio...
2025-10-29T10:30:19.680Z [INFO] OpenAI transcription completed in 4.25s
```

Calculate exact durations between events.

---

## Common Debug Patterns

### Pattern 1: Slow Transcription

**Look for**:
```
[DEBUG] File size: 8.52 MB (8937472 bytes)  ← Large file
[INFO] OpenAI transcription completed in 45.2s ← Slow
```

**Likely cause**: Large file upload over slow connection

---

### Pattern 2: Empty Transcription

**Look for**:
```
[WARN] Transcription result is empty (silence detected?)
[DEBUG] Audio format: 1 channel(s), 44100 Hz
```

**Likely cause**: No speech detected or microphone issue

---

### Pattern 3: Format Mismatch

**Look for**:
```
[DEBUG] WAV format: 1 channel(s), 8000 Hz sample rate  ← Low quality
[INFO] Transcription accuracy may be reduced
```

**Likely cause**: Wrong recording device or settings

---

## Best Practices

### Do's ✅

- **Always use debug mode** when troubleshooting
- **Save logs** for complex issues
- **Compare metrics** across recordings
- **Check timestamps** to find bottlenecks
- **Use benchmark mode** to compare backends

### Don'ts ❌

- **Don't leave debug on** in production (verbose)
- **Don't ignore warnings** (they indicate issues)
- **Don't assume** (verify with logs)

---

## Related Documentation

- [Configuration Management](configuration-management.md) - Config reload and validation
- [Troubleshooting](../user-guide/troubleshooting.md) - Common issues
- [Speaches Integration](speaches-integration.md) - Local inference setup
- [Whisper Models](whisper-models.md) - Model selection guide

---

**Last updated**: 2025-10-29

