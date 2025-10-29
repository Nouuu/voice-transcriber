---
title: Language Support
description: Multilingual transcription with strong language enforcement for French, English, Spanish, German, and Italian
tags:
  - intermediate
  - guide
  - languages
  - transcription
keywords: languages, multilingual, french, english, spanish, german, italian, fr, en, es, de, it, language enforcement
---

# Language Support

Voice Transcriber supports multiple languages with strong language enforcement to prevent unwanted language switching during transcription.

## Supported Languages

| Language | Code | Quality | Notes |
|----------|------|---------|-------|
| English | `en` | ⭐⭐⭐⭐⭐ | Default, excellent accuracy |
| French | `fr` | ⭐⭐⭐⭐⭐ | Excellent, strong enforcement |
| Spanish | `es` | ⭐⭐⭐⭐⭐ | Excellent support |
| German | `de` | ⭐⭐⭐⭐⭐ | Excellent support |
| Italian | `it` | ⭐⭐⭐⭐⭐ | Excellent support |

## Configuring Language

Edit your configuration file:

```bash
nano ~/.config/voice-transcriber/config.json
```

Set the `language` field:

```json
{
  "language": "fr",
  "activePersonalities": ["builtin:default"],
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-..."
    }
  },
  "formatter": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-..."
    }
  }
}
```

**Restart the application** for changes to take effect.

## Language Enforcement

Voice Transcriber uses **strong language-specific prompts** to prevent Whisper from switching languages mid-transcription.

### How It Works

When you set a language (e.g., French):

1. **Transcription prompt** explicitly instructs Whisper:
   ```
   This is a French audio recording. Transcribe the entire audio in French only.
   Do NOT switch to English or translate. Keep all content in French.
   ```

2. **Formatting prompt** maintains the language:
   ```
   Format this French text with proper grammar and punctuation.
   Keep the text in French. Do not translate.
   ```

This dual-layer enforcement ensures your transcriptions stay in the configured language.

## Examples by Language

### English

**Recording**: "Hello, this is a test of the transcription system"

**Result**: "Hello, this is a test of the transcription system."

### French

**Recording**: "Bonjour, ceci est un test du système de transcription"

**Result**: "Bonjour, ceci est un test du système de transcription."

### Spanish

**Recording**: "Hola, esta es una prueba del sistema de transcripción"

**Result**: "Hola, esta es una prueba del sistema de transcripción."

## Mixed-Language Content

For recordings with **technical English terms in French sentences** (common in tech contexts):

**Configuration**:
```json
{
  "language": "fr",
  "transcriptionPrompt": "Transcribe this French audio. Keep technical English terms but preserve French grammar.",
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-..."
    }
  }
}
```

**Recording**: "J'utilise React avec TypeScript pour développer l'application"

**Result**: "J'utilise React avec TypeScript pour développer l'application."

!!! info "Custom Prompts"
    See [Configuration Guide](../getting-started/configuration.md) for advanced mixed-language scenarios.

## Troubleshooting Language Issues

### French Transcription Switches to English

**Problem**: Long French recordings switch to English mid-way

**Solution**: Ensure language is set explicitly:

```json
{
  "language": "fr",
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-..."
    }
  }
}
```

Restart the application after config changes.

### Technical Terms Not Recognized

**Problem**: Technical English terms in French speech are poorly transcribed

**Solution**: Use custom transcription prompt:

```json
{
  "language": "fr",
  "transcriptionPrompt": "Transcribe this French technical audio. Keep common English technical terms as-is.",
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-..."
    }
  }
}
```

### Accent Not Recognized Well

**Problem**: Strong accent reduces accuracy

**Solutions**:
- **Speak slightly slower** and more clearly
- **Reduce background noise** for better recognition
- **Try self-hosted Speaches** with different models (see [Speaches Integration](../advanced/speaches-integration.md))

## Language-Specific Tips

### French

- Accents (é, è, à, ç) are generally recognized well
- Homophones (ou/où, a/à) may need manual correction
- Long compound sentences benefit from formatting

### Spanish

- Accents and ñ are well recognized
- Regional variations (Spain vs Latin America) work well
- Inverted question marks may need manual addition

### German

- Umlauts (ä, ö, ü, ß) are recognized accurately
- Compound words are usually transcribed correctly
- Formal/informal you (Sie/du) preserved correctly

### Italian

- Accents (à, è, ì, ò, ù) are well recognized
- Double consonants are usually correct
- Regional variations work well

## Performance by Language

All supported languages have similar processing times:

| Language | Avg Processing Time | Accuracy |
|----------|-------------------|----------|
| English | 1.5-2.5s per 30s | 95-98% |
| French | 1.5-2.5s per 30s | 93-97% |
| Spanish | 1.5-2.5s per 30s | 93-97% |
| German | 1.5-2.5s per 30s | 92-96% |
| Italian | 1.5-2.5s per 30s | 93-97% |

## Adding More Languages

While only 5 languages have strong enforcement prompts, Whisper supports many more:

**Other supported codes**: `ja`, `zh`, `pt`, `ru`, `ko`, `ar`, `nl`, `pl`, `tr`, etc.

**To use unsupported language**:

```json
{
  "language": "pt",
  "transcriptionPrompt": "Transcribe this Portuguese audio completely in Portuguese. Do not switch languages.",
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-..."
    }
  }
}
```

!!! warning "Community Contributions"
    If you use Voice Transcriber in other languages and develop effective prompts, please contribute them via [GitHub Pull Request](https://github.com/Nouuu/voice-transcriber/pulls)!

## Next Steps

- [Basic Usage](basic-usage.md) - Learn recording workflow
- [Configuration Guide](../getting-started/configuration.md) - Custom prompts and settings
- [Transcription Backends](transcription-backends.md) - OpenAI vs Speaches

---

!!! question "Need Help?"
    - [Troubleshooting Guide](troubleshooting.md)
    - [GitHub Issues](https://github.com/Nouuu/voice-transcriber/issues)
