---
title: Whisper Models Comparison
description: Compare different Faster-Whisper models for speed, accuracy, and resource usage
tags:
  - advanced
  - reference
  - transcription
  - backends
keywords: whisper, models, faster-whisper, comparison, performance, accuracy, speed, benchmarks
---

# Faster-Whisper Models Comparison

## Model Variants Overview

| Model | Parameters | Multilingual | English-Only | Distilled |
|-------|------------|--------------|--------------|-----------|
| **tiny** | 39M | ✅ | ✅ `.en` | ❌ |
| **base** | 74M | ✅ | ✅ `.en` | ❌ |
| **small** | 244M | ✅ | ✅ `.en` | ✅ `distil-*.en` |
| **medium** | 769M | ✅ | ✅ `.en` | ✅ `distil-*.en` |
| **large-v3** | 1550M | ✅ | ❌ | ✅ `distil-*` |

---

## Quick Selection Guide

### **Base** (recommended default) ⭐
- Good balance speed/accuracy
- 74M parameters
- Use for: voice dictation, development

### **Small** (better quality)
- Better accuracy
- 244M parameters
- Use for: production, professional apps

### **Medium** (high quality)
- High accuracy
- 769M parameters
- Use for: meetings, subtitling

### **Large-v3** (maximum quality)
- Best accuracy
- 1550M parameters
- Use for: critical apps (legal, medical)

### **Distilled** (`distil-*`)
- 30-50% faster
- Similar accuracy (~1-3% WER difference)
- Available: small.en, medium.en, large-v2, large-v3

### **English-only** (`.en`)
- English transcription only
- 20-30% faster than multilingual
- Better English accuracy

---

## Performance Comparison

| Model | CPU Time* | Memory (RAM) | Speed | Accuracy |
|-------|-----------|--------------|-------|----------|
| **tiny** | 1x | ~1 GB | ⚡⚡⚡⚡⚡ | ⭐⭐ |
| **base** | 2x | ~1 GB | ⚡⚡⚡⚡ | ⭐⭐⭐ |
| **small** | 5x | ~2 GB | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| **medium** | 12x | ~5 GB | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| **large-v3** | 30x | ~10 GB | ⚡ | ⭐⭐⭐⭐⭐⭐ |

*Relative to tiny model on 1 minute of audio

---

## Speaches Integration

**Dynamic model loading** (specify in API request):

```typescript
// In transcription.ts
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'base',  // or 'small', 'medium', 'large-v3', etc.
  language: 'en'
});
```

**Available models**:
- `tiny`, `tiny.en`
- `base`, `base.en`
- `small`, `small.en`
- `medium`, `medium.en`
- `large-v1`, `large-v2`, `large-v3`
- `distil-small.en`, `distil-medium.en`
- `distil-large-v2`, `distil-large-v3`

Models are **auto-downloaded** on first use.

---

## Recommendations by Use Case

| Use Case | Model | Why |
|----------|-------|-----|
| **Voice dictation** | `base` or `small` | Fast + good accuracy |
| **Meetings** | `medium` | High accuracy + multi-speaker |
| **Real-time** | `tiny.en` or `base.en` | Low latency |
| **Critical** | `large-v3` | Maximum accuracy |
| **Development** | `base` | Fast iteration |

---

## Language Support

**Multilingual** (99+ languages):
- Western European: en, fr, de, es, it, pt
- Eastern European: ru, pl, uk, cs
- Asian: zh, ja, ko, hi, ar

**English-only** (`.en` suffix):
- Cannot transcribe other languages
- 20-30% faster for English
- Smaller model size

---

## Configuration

```json
{
  "language": "en",
  "formatterEnabled": true,
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

---

## Related Pages

- [Speaches Integration](speaches-integration.md) - Setup guide for self-hosted transcription
- [Transcription Backends](../user-guide/transcription-backends.md) - Compare OpenAI vs Speaches
- [Configuration Guide](../getting-started/configuration.md) - How to configure models

## References

- [Faster-Whisper GitHub](https://github.com/SYSTRAN/faster-whisper)
- [Hugging Face Collection](https://huggingface.co/collections/Systran/faster-whisper-6867ecec0e757ee14896e2d3)
- [Speaches](https://github.com/speaches-ai/speaches)

**Version**: v2.0
**Last Updated**: 2025-10-11
