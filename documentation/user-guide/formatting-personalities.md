# Formatting Personalities

Voice Transcriber uses "personalities" to format transcribed text according to different styles. You can use multiple personalities simultaneously, and they can be quickly toggled from the system tray menu.

---

## 🎯 Overview

### What are Personalities?

Personalities are formatting styles that transform raw transcriptions into polished text. Each personality contains:

- **Name**: Display name in the menu
- **Description**: What the personality does
- **Prompt**: Instructions sent to the LLM (GPT/Ollama)

### How They Work

```
Raw Transcription
    ↓
Personality Prompts (concatenated)
    ↓
LLM (GPT-4o-mini / Ollama)
    ↓
Formatted Text
    ↓
Clipboard
```

!!! tip "Single Request"
    Multiple personalities are combined into **one LLM request** (not applied sequentially). This is faster and cheaper, but means personalities should be complementary.

---

## 📦 Built-in Personalities

Voice Transcriber includes 5 built-in personalities ready to use:

### Default
**ID**: `builtin:default`

**Style**: Minimal formatting - Fix grammar only

**Use cases**:
- Quick notes
- When you want minimal changes
- Preserving original speaking style

**Example**:
```
Input:  "um so basically I think we should uh maybe try the new approach"
Output: "I think we should try the new approach."
```

---

### Professional
**ID**: `builtin:professional`

**Style**: Business communication

**Use cases**:
- Work emails
- Business reports
- Meeting summaries
- Professional correspondence

**Example**:
```
Input:  "hey can you send me that report we talked about yesterday"
Output: "Could you please send me the report we discussed yesterday?"
```

---

### Technical
**ID**: `builtin:technical`

**Style**: Technical documentation

**Use cases**:
- Code documentation
- Technical specifications
- Bug reports
- API documentation

**Example**:
```
Input:  "so the function takes a string and returns um like a boolean"
Output: "The function accepts a string parameter and returns a boolean value."
```

---

### Creative
**ID**: `builtin:creative`

**Style**: Expressive and natural

**Use cases**:
- Blog posts
- Creative writing
- Social media
- Personal notes

**Example**:
```
Input:  "it was really amazing the sunset was beautiful"
Output: "It was truly amazing! The sunset painted the sky in beautiful colors."
```

---

### Emojify
**ID**: `builtin:emojify`

**Style**: Add context-appropriate emojis (max 3)

**Use cases**:
- Social media posts
- Casual messages
- Adding visual flair

**Rules**:
- Very short text (< 40 chars): max 1 emoji
- Medium text (40-120 chars): max 2 emojis
- Long text (> 120 chars): max 3 emojis

**Example**:
```
Input:  "the meeting went great we got approval for the project"
Output: "The meeting went great! 🎉 We got approval for the project. ✅"
```

---

## ⚙️ Configuration

### Basic Setup

Edit `~/.config/voice-transcriber/config.json`:

```json
{
  "activePersonalities": ["builtin:professional"],
  "selectedPersonalities": [
    "builtin:default",
    "builtin:professional",
    "builtin:technical"
  ]
}
```

- **`activePersonalities`**: Which personalities are **checked** (applied to transcriptions)
- **`selectedPersonalities`**: Which personalities **appear** in the menu

### Using the System Tray

**Quick Toggle** (no config editing needed):

1. Right-click system tray icon
2. Check/uncheck personalities
3. Click "💾 Save as Default" to persist
4. Restart → Your preferences are restored

!!! tip "Live Changes"
    Changes via the menu take effect immediately. No need to restart until you want to persist them with "Save as Default".

---

## 🎨 Custom Personalities

### Creating Custom Personalities

Add to `customPersonalities` in config:

```json
{
  "customPersonalities": {
    "code-review": {
      "name": "Code Review",
      "description": "Concise code review comments",
      "prompt": "Format as a concise code review comment. Be constructive and specific. Include suggestions for improvement. Do not translate the text; keep it in the original language."
    }
  },
  "selectedPersonalities": [
    "builtin:default",
    "custom:code-review"
  ]
}
```

### Custom Personality Template

```json
{
  "customPersonalities": {
    "YOUR_ID_HERE": {
      "name": "Display Name in Menu",
      "description": "What this personality does",
      "prompt": "Detailed instructions for the LLM..."
    }
  }
}
```

**Best practices for prompts**:
- Be specific about the desired output format
- Include examples if needed
- Specify tone (formal, casual, technical, etc.)
- Mention any constraints (length, structure)
- **Always end with**: "Do not translate the text; keep it in the original language."

### Real-World Examples

#### Email Response
```json
{
  "email-response": {
    "name": "Email Response",
    "description": "Professional email reply format",
    "prompt": "Format as a professional email response. Include greeting, body, and closing. Use polite and concise language. Maintain professional tone. Do not translate the text; keep it in the original language."
  }
}
```

#### Meeting Notes
```json
{
  "meeting-notes": {
    "name": "Meeting Notes",
    "description": "Structured meeting summary",
    "prompt": "Format as structured meeting notes with sections: Discussion Points, Decisions Made, Action Items. Use bullet points. Be concise and clear. Do not translate the text; keep it in the original language."
  }
}
```

#### Social Media
```json
{
  "social-media": {
    "name": "Social Media",
    "description": "Engaging social post",
    "prompt": "Format for social media. Make it engaging and conversational. Add relevant hashtags. Keep it concise (under 280 characters). Do not translate the text; keep it in the original language."
  }
}
```

#### French Technical
```json
{
  "technical-fr": {
    "name": "Technical FR",
    "description": "French technical documentation",
    "prompt": "Formate en style documentation technique française. Utilise un vocabulaire précis et professionnel. Garde les termes techniques anglais courants. Utilise le vouvoiement. Ne traduis pas le texte; garde-le dans sa langue d'origine."
  }
}
```

---

## 🔄 Multiple Personalities

### How Concatenation Works

When you activate multiple personalities, their prompts are combined with a separator:

```
Professional Prompt
---
Emojify Prompt
---
Your Text Here
```

**Result**: One LLM request with combined instructions

### Best Combinations

#### Work Mode
```json
{
  "activePersonalities": [
    "builtin:professional",
    "builtin:technical"
  ]
}
```
**Use for**: Technical work emails, documentation

---

#### Social Mode
```json
{
  "activePersonalities": [
    "builtin:creative",
    "builtin:emojify"
  ]
}
```
**Use for**: Social media, casual communication

---

#### Documentation Mode
```json
{
  "activePersonalities": [
    "builtin:technical",
    "custom:meeting-notes"
  ]
}
```
**Use for**: Meeting documentation, technical specs

---

### Combinations to Avoid

❌ **Conflicting styles**:
```json
{
  "activePersonalities": [
    "builtin:professional",  // Formal
    "builtin:creative"        // Expressive
  ]
}
```
**Problem**: Contradictory instructions may confuse the LLM

❌ **Too many personalities**:
```json
{
  "activePersonalities": [
    "builtin:default",
    "builtin:professional",
    "builtin:technical",
    "builtin:creative",
    "custom:style1",
    "custom:style2"
  ]
}
```
**Problem**: May exceed `maxPromptLength`, inconsistent output

---

## ⚡ Advanced Configuration

### Prompt Length Limit

Control maximum combined prompt length:

```json
{
  "maxPromptLength": 4000,
  "activePersonalities": [
    "builtin:professional",
    "builtin:technical",
    "custom:detailed-style"
  ]
}
```

**What happens**:
- Prompts are added one by one
- If adding a prompt exceeds `maxPromptLength`, concatenation stops
- Remaining personalities are skipped

**Default**: `4000` characters

**When to increase**:
- Using many custom personalities with long prompts
- Need very detailed instructions

**When to decrease**:
- Want to ensure faster processing
- Using simpler personality combinations

### Disable Formatting

To transcribe without formatting, use empty `activePersonalities`:

```json
{
  "activePersonalities": []
}
```

**Result**: Raw transcription only, no GPT/Ollama call

---

## 💡 Tips & Tricks

### Tip 1: Start Simple

Begin with one personality, test it, then add more:

```json
{
  "activePersonalities": ["builtin:professional"]
}
```

Test thoroughly before adding combinations.

### Tip 2: Keep Menu Clean

Only show personalities you actually use:

```json
{
  "selectedPersonalities": [
    "builtin:default",
    "builtin:professional"
  ]
}
```

Cleaner menu = faster selection

### Tip 3: Test Custom Personalities

Before saving permanently:
1. Add custom personality to config
2. Reload config (`🔄` in menu)
3. Test it
4. If good → "💾 Save as Default"
5. If not → Edit and reload again

### Tip 4: Debug Mode

See which personalities are being used:

```bash
voice-transcriber --debug
```

Logs show:
```
[INFO] Formatting text with personalities: builtin:professional, builtin:emojify
```

### Tip 5: Backup Custom Personalities

```bash
# Save your custom personalities
cp ~/.config/voice-transcriber/config.json ~/my-personalities-backup.json

# Or use Git
cd ~/.config/voice-transcriber
git init
git add config.json
git commit -m "My custom personalities"
```

---

## 🔍 Troubleshooting

### Formatting Not Applied

**Problem**: Text not formatted

**Check**:
1. `activePersonalities` not empty?
2. Formatter backend configured (OpenAI API key or Ollama)?
3. Check logs for errors

### Unexpected Results

**Problem**: Formatting doesn't match expectations

**Solutions**:
1. Test personality individually (disable others)
2. Refine custom personality prompt
3. Check for conflicting personality combinations
4. Verify `maxPromptLength` not being exceeded

### Custom Personality Not Showing

**Problem**: Custom personality not in menu

**Check**:
1. Added to `customPersonalities`?
2. Added to `selectedPersonalities` with `custom:` prefix?
3. Reloaded config after changes?

**Example**:
```json
{
  "customPersonalities": {
    "myStyle": { ... }
  },
  "selectedPersonalities": [
    "custom:myStyle"  // ← Must have "custom:" prefix
  ]
}
```

### Prompts Too Long

**Problem**: `[DEBUG] Stopped concatenating: would exceed maxPromptLength`

**Solutions**:
1. Increase `maxPromptLength`
2. Use fewer personalities
3. Shorten custom personality prompts
4. Prioritize: put most important personalities first in `activePersonalities`

---

## 📊 Personality Comparison

| Personality | Tone | Length | Use Case | Emoji |
|------------|------|--------|----------|-------|
| Default | Neutral | Same | General | No |
| Professional | Formal | Similar | Business | No |
| Technical | Precise | Structured | Documentation | No |
| Creative | Expressive | Variable | Content | No |
| Emojify | Same | Same | Social | Yes |

---

## 🚀 Quick Reference

### Via System Tray (Recommended)

```
1. Right-click tray icon
2. Check/uncheck personalities
3. Click "💾 Save as Default"
4. Done!
```

### Via Config File

```json
{
  "activePersonalities": ["builtin:professional"],
  "selectedPersonalities": [
    "builtin:default",
    "builtin:professional",
    "builtin:technical"
  ],
  "customPersonalities": {
    "myStyle": {
      "name": "My Style",
      "description": "...",
      "prompt": "..."
    }
  }
}
```

Then: `🔄 Reload Config` in system tray

---

## 📚 See Also

- [Configuration Guide](../getting-started/configuration.md) - Full configuration reference
- [Basic Usage](basic-usage.md) - How to use the application
- [Examples](../../work/TASK_2_EXAMPLES.md) - Real-world personality examples

---

**Last updated**: 2025-10-29

