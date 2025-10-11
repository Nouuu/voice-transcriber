# Transcription Backends

Voice Transcriber supports two transcription backends: **OpenAI Whisper** (cloud) and **Speaches** (self-hosted).

## Backend Comparison

| Feature | OpenAI Whisper ☁️ | Speaches 🏠 |
|---------|------------------|-------------|
| **Setup** | Zero setup | Docker required |
| **Cost** | ~$0.006/minute | Free (self-hosted) |
| **Privacy** | Audio sent to OpenAI | 100% offline |
| **Speed** | Very fast (1.5-2.5s/30s) | Comparable with base model |
| **Accuracy** | Excellent (95-98%) | Excellent (91-100%) |
| **Internet** | Required | Not required |

## OpenAI Whisper (Cloud)

**Best for**: Quick setup, occasional use, no local resources

### Configuration

```json
{
  "openaiApiKey": "sk-your-api-key-here",
  "language": "en",
  "transcription": {
    "backend": "openai"
  }
}
```

### Pros

- ✅ Zero setup required
- ✅ No local resources needed
- ✅ Consistently fast processing
- ✅ High accuracy across languages

### Cons

- ❌ Requires internet connection
- ❌ API costs ($0.006 per minute of audio)
- ❌ Audio data sent to OpenAI servers
- ❌ Subject to OpenAI API rate limits

## Speaches (Self-Hosted)

**Best for**: Privacy-conscious users, high-volume use, offline operation

> **Powered by [Speaches](https://github.com/speaches-ai/speaches)** - OpenAI-compatible speech-to-text server

### Quick Setup (3 commands)

```bash
# 1. Create docker-compose.speaches.yml
docker compose -f docker-compose.speaches.yml up -d

# 2. Update config
nano ~/.config/voice-transcriber/config.json
# Change "backend": "openai" to "backend": "speaches"

# 3. Done! First transcription downloads model (~140MB)
```

### Configuration

```json
{
  "language": "fr",
  "formatterEnabled": false,
  "transcription": {
    "backend": "speaches",
    "speaches": {
      "url": "http://localhost:8000/v1",
      "apiKey": "none",
      "model": "Systran/faster-whisper-base"
    }
  }
}
```

### Pros

- ✅ **Zero cost** - No API fees
- ✅ **Complete privacy** - Audio never leaves your machine
- ✅ **Offline operation** - No internet required after model download
- ✅ **Same speed** - Base model comparable to OpenAI (3.7s vs 3.8s)
- ✅ **High accuracy** - 91-100% similarity depending on model

### Cons

- ❌ Requires Docker setup
- ❌ Initial model download (~140MB-2.9GB depending on model)
- ❌ Requires local compute resources
- ❌ Larger models need more RAM/CPU

## Performance Comparison

**Benchmark**: 30s French audio, Remote server (8 CPU / 8GB RAM)

| Model | OpenAI | Speaches (CPU) | Speed Ratio | Accuracy |
|-------|--------|----------------|-------------|----------|
| **tiny** | 1.98s | 2.81s | 0.70x | 92.4% |
| **base** ⭐ | 3.70s | 3.81s | **0.97x** | 91.4% |
| **small** | 2.23s | 7.15s | 0.31x | 97.4% |
| **medium** | 3.70s | 25.82s | 0.14x | 96.1% |
| **large-v3** | 2.55s | 30.80s | 0.08x | 100.0% |

!!! success "Recommendation: Base Model"
    The **base model** offers the best balance: nearly identical speed to OpenAI, 91% accuracy, and zero cost.

## Choosing a Backend

### Use OpenAI Whisper if:

- 📱 You want zero setup and immediate use
- 🌐 You always have internet connection
- 💵 Cost is acceptable for your usage volume
- 🎯 You prioritize convenience over privacy

### Use Speaches if:

- 🔒 Privacy is important (audio never leaves your machine)
- 💰 You transcribe frequently (avoid API costs)
- 📴 You need offline operation
- 🏠 You have local compute resources (or can spin up a VPS)

## Switching Backends

### OpenAI → Speaches

```bash
# 1. Setup Speaches with Docker
docker compose -f docker-compose.speaches.yml up -d

# 2. Update config
nano ~/.config/voice-transcriber/config.json
```

Change:
```json
{
  "transcription": {
    "backend": "speaches"
  }
}
```

**Restart the application**.

### Speaches → OpenAI

```bash
# Update config
nano ~/.config/voice-transcriber/config.json
```

Change:
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

**Restart the application**.

## Benchmark Mode

Compare both backends side-by-side. Requires both OpenAI and Speaches configured.

### Configuration

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

### Running Benchmarks

Run with `--debug` flag to see detailed comparison:

```bash
voice-transcriber --debug
```

### Benchmark Output

**Example output**:
```
🔬 BENCHMARK: Comparing OpenAI and Speaches
⏱️  Performance:
   OpenAI Whisper:   2.45s
   Speaches:         0.87s
   Speedup:          2.82x faster

📏 Text Length:
   OpenAI:   142 chars
   Speaches: 145 chars
   Difference: 3 chars (2.1%)

🎯 Similarity: 97.2% match
```

### What Benchmark Mode Does

When enabled, the application:

1. **Transcribes with both backends** simultaneously
2. **Measures performance** - Processing time for each backend
3. **Compares accuracy** - Text similarity calculation between results
4. **Shows differences** - Character count and text length comparison
5. **Uses primary backend result** - The configured `backend` result is copied to clipboard

### Use Cases

!!! tip "When to Use Benchmark Mode"
    - **Evaluate models**: Test different Speaches models against OpenAI
    - **Verify accuracy**: Ensure Speaches meets your quality requirements
    - **Optimize performance**: Find the best speed/accuracy balance
    - **Document results**: Generate comparison data for your use case

### Disabling Benchmark Mode

Set to `false` in config:

```json
{
  "benchmarkMode": false
}
```

**Restart the application** for changes to take effect.

!!! warning "Benchmark Mode Costs"
    Benchmark mode calls both OpenAI and Speaches, so you'll incur OpenAI API costs even when using Speaches as your primary backend. Use only for testing and evaluation.

## Next Steps

- [Speaches Integration Guide](../advanced/speaches-integration.md) - Detailed setup
- [Whisper Models Comparison](../advanced/whisper-models.md) - Model selection
- [Configuration Guide](../getting-started/configuration.md) - Advanced settings

---

!!! question "Need Help?"
    - [Troubleshooting Guide](troubleshooting.md)
    - [GitHub Issues](https://github.com/Nouuu/voice-transcriber/issues)
