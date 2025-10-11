# Speaches Integration Guide

Complete guide for setting up self-hosted transcription with [Speaches](https://github.com/speaches-ai/speaches).

## Why Speaches?

<div class="grid cards" markdown>

-   💰 **Zero Cost**

    ---

    No API fees - unlimited transcriptions for free

-   🔒 **Complete Privacy**

    ---

    100% offline - audio never leaves your machine

-   ⚡ **Same Speed**

    ---

    Base model performs identically to OpenAI (3.7s vs 3.8s)

-   🎯 **High Accuracy**

    ---

    91-100% text similarity with OpenAI depending on model

</div>

## Quick Setup

### Step 1: Create Docker Compose File

Create `docker-compose.speaches.yml`:

```yaml
services:
  speaches:
    image: ghcr.io/speaches-ai/speaches:latest-cpu
    ports:
      - "8000:8000"
    volumes:
      - ./hf-cache:/home/ubuntu/.cache/huggingface/hub
    environment:
      - STT_MODEL_TTL=-1  # Keep model in memory
      - WHISPER__INFERENCE_DEVICE=cpu
      - WHISPER__COMPUTE_TYPE=int8
      - WHISPER__CPU_THREADS=8
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
```

### Step 2: Start Speaches

```bash
docker compose -f docker-compose.speaches.yml up -d
```

**First startup**: Downloads model (~140MB for base) - takes 1-2 minutes

### Step 3: Configure Voice Transcriber

Edit config:

```bash
nano ~/.config/voice-transcriber/config.json
```

Update:

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

### Step 4: Restart Application

```bash
# Restart Voice Transcriber
voice-transcriber
```

✅ **Done!** First transcription will auto-download the model.

## Available Models

| Model | Size | Memory | Speed | Accuracy | Use Case |
|-------|------|--------|-------|----------|----------|
| **tiny** | 75 MB | ~273 MB | ⚡⚡⚡ | ⭐⭐ | Quick testing |
| **base** ⭐ | 142 MB | ~388 MB | ⚡⚡ | ⭐⭐⭐ | **Recommended** |
| **small** | 466 MB | ~852 MB | ⚡ | ⭐⭐⭐⭐ | Better accuracy |
| **medium** | 1.5 GB | ~2.1 GB | 🐢 | ⭐⭐⭐⭐⭐ | High accuracy |
| **large-v3** | 2.9 GB | ~3.9 GB | 🐢🐢 | ⭐⭐⭐⭐⭐ | Maximum accuracy |

!!! success "Recommendation: Base Model"
    - Comparable speed to OpenAI (0.97x)
    - 91% accuracy - excellent for daily use
    - Low resource usage (~400MB RAM)
    - Zero cost

## Performance Comparison

**Benchmark**: 30s French audio, Remote server (8 CPU / 8GB RAM)

```
Model: base
OpenAI:   3.70s
Speaches: 3.81s
Speedup:  0.97x (nearly identical!)
Accuracy: 91.4%
```

## Changing Models

Edit config to use different model:

```json
{
  "transcription": {
    "backend": "speaches",
    "speaches": {
      "model": "Systran/faster-whisper-small"
    }
  }
}
```

**Available models**:
- `Systran/faster-whisper-tiny`
- `Systran/faster-whisper-base` ⭐
- `Systran/faster-whisper-small`
- `Systran/faster-whisper-medium`
- `Systran/faster-whisper-large-v3`

**Restart application** for changes to take effect.

## GPU Acceleration

For significantly faster processing with medium/large models:

```yaml
services:
  speaches:
    image: ghcr.io/speaches-ai/speaches:latest-cuda  # GPU image
    runtime: nvidia
    environment:
      - WHISPER__INFERENCE_DEVICE=cuda
      - WHISPER__COMPUTE_TYPE=float16
```

**Requirements**: NVIDIA GPU with CUDA support

## Troubleshooting

### Model Download Fails

```bash
# Check logs
docker compose -f docker-compose.speaches.yml logs -f speaches
```

**Solution**: Ensure internet connection for initial download

### Service Not Responding

```bash
# Check health
curl http://localhost:8000/health

# Restart service
docker compose -f docker-compose.speaches.yml restart
```

### Out of Memory

**Solution**: Use smaller model or increase Docker memory limit

```yaml
services:
  speaches:
    deploy:
      resources:
        limits:
          memory: 4G  # Increase memory
```

## Advanced Configuration

### Custom Whisper Parameters

```yaml
environment:
  - WHISPER__BEAM_SIZE=5
  - WHISPER__BEST_OF=5
  - WHISPER__TEMPERATURE=0.0
```

### Remote Speaches Server

Run Speaches on a VPS and connect remotely:

```json
{
  "transcription": {
    "backend": "speaches",
    "speaches": {
      "url": "https://your-server.com/v1",
      "apiKey": "your-api-key",
      "model": "Systran/faster-whisper-base"
    }
  }
}
```

## Cost Comparison

**OpenAI Whisper**:
- $0.006 per minute
- 100 hours = $36/month
- No local resources needed

**Speaches (Self-Hosted)**:
- $0 transcription cost
- VPS: ~$5-10/month (optional)
- Requires local/VPS resources

!!! success "Break-Even Point"
    After ~100 hours of transcription, Speaches becomes more cost-effective than OpenAI.

## Next Steps

- [Whisper Models Comparison](whisper-models.md) - Detailed model benchmarks
- [Transcription Backends](../user-guide/transcription-backends.md) - Backend comparison
- [Configuration Guide](../getting-started/configuration.md) - Advanced settings

---

!!! question "Need Help?"
    - [Speaches Documentation](https://github.com/speaches-ai/speaches)
    - [Voice Transcriber Issues](https://github.com/Nouuu/voice-transcriber/issues)
