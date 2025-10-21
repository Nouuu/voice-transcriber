# Quick Actions Menu Feature

**Feature**: Dynamic Quick Actions in System Tray Menu
**Created**: 2025-10-21
**Status**: 📋 Planning / Future Enhancement
**Priority**: Medium
**Estimated Effort**: 4-5 hours

---

## 🎯 Motivation

Les utilisateurs doivent actuellement éditer `config.json` et recharger la configuration pour changer des paramètres courants. Cette feature permettrait de **toggle des fonctionnalités à la volée** directement depuis le menu du system tray, sans édition de fichier.

### Use Cases Principaux

1. **Toggle Formatter** : Activer/désactiver le formatage GPT rapidement
2. **Switch Formatter Personalities** : Changer entre différents prompts de formatage prédéfinis

---

## ✨ Features Proposées

### 1. Toggle Formatter (MVP) ⭐

**Description** : Activer/désactiver le formatage sans éditer la config

**Menu Item** :
```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ─────────────────
├── ✍️ Formatter: ON/OFF  ← NOUVEAU (checkable)
├── ─────────────────
├── ⚙️ Open Config
├── 🔄 Reload Config
└── ❌ Exit
```

**Comportement** :
- Menu item avec checkbox (✓ = ON, ☐ = OFF)
- Toggle instantané sans reload de config
- État sauvegardé en mémoire (pas dans le fichier config)
- Icône différente selon l'état : ✍️ (ON) / ✏️ (OFF)

**Avantages** :
- Utile pour tests rapides
- Économie d'API calls OpenAI GPT
- Feedback immédiat

### 2. Formatter Personalities 🎭

**Description** : Menu submenu avec différents prompts de formatage prédéfinis

**Menu Structure** :
```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ─────────────────
├── ✍️ Formatter: ON
├──── 🎭 Personality  ← NOUVEAU (submenu)
│     ├── ✓ Default (Minimal formatting)
│     ├── ☐ Professional (Business style)
│     ├── ☐ Technical (Code-friendly)
│     ├── ☐ Creative (Expressive style)
│     └── ☐ Custom (from config.json)
├── ─────────────────
├── ⚙️ Open Config
├── 🔄 Reload Config
└── ❌ Exit
```

**Prompts Prédéfinis** :

```json
{
  "formatterPersonalities": {
    "default": {
      "name": "Default",
      "description": "Minimal formatting - Fix grammar only",
      "prompt": "Fix grammar and punctuation. Keep the original style and tone."
    },
    "professional": {
      "name": "Professional",
      "description": "Business communication style",
      "prompt": "Format as professional business communication. Use formal tone, clear structure, proper punctuation. Suitable for emails and reports."
    },
    "technical": {
      "name": "Technical",
      "description": "Technical documentation style",
      "prompt": "Format for technical documentation. Preserve technical terms, code references, and precision. Use clear, concise language."
    },
    "creative": {
      "name": "Creative",
      "description": "Expressive and natural style",
      "prompt": "Format naturally with expressive language. Maintain personality and tone. Make it engaging and conversational."
    },
    "custom": {
      "name": "Custom",
      "description": "User-defined prompt from config",
      "prompt": null  // Uses formattingPrompt from config.json
    }
  }
}
```

**Comportement** :
- Selection radio-style (un seul actif à la fois)
- Changement instantané du prompt de formatage
- Sauvegarde en mémoire (pas dans config.json)
- Option "Custom" utilise le `formattingPrompt` du fichier config

---

## 🏗️ Architecture Technique

### État en Mémoire (Runtime State)

```typescript
interface RuntimeState {
  formatterEnabled: boolean;        // Toggle ON/OFF
  formatterPersonality: string;     // "default" | "professional" | "technical" | "creative" | "custom"
}
```

**Principe** :
- État runtime séparé de la config fichier
- Priorité : Runtime State > config.json
- Pas de sauvegarde automatique (reset au redémarrage)
- Option future : "Save as default" pour persister dans config.json

---

## 📊 Plan d'Implémentation

### Phase 1: Toggle Formatter (MVP) - 2h
- [ ] Ajouter RuntimeState dans VoiceTranscriberApp
- [ ] Ajouter menu item checkbox "Formatter ON/OFF"
- [ ] Implémenter handleFormatterToggle()
- [ ] Mettre à jour processAudioFile() pour respecter runtimeState
- [ ] Tests unitaires (2-3 tests)

### Phase 2: Formatter Personalities - 2h
- [ ] Définir les 4 personalities prédéfinies (default, professional, technical, creative)
- [ ] Ajouter submenu "Personality" avec radio buttons
- [ ] Implémenter handlePersonalityChange()
- [ ] Modifier FormatterService pour accepter personality
- [ ] Tests unitaires (3-4 tests)

### Phase 3: Polish & Documentation - 1h
- [ ] Icônes différentes selon état (✍️/✏️)
- [ ] Messages de feedback clairs
- [ ] Mise à jour documentation utilisateur (Quick Actions)
- [ ] Guide de troubleshooting (submenus, état runtime)

**Total estimé** : 5 heures

---

## 🎯 Bénéfices Utilisateur

### Toggle Formatter
- ✅ Économie d'API calls OpenAI (~$0.0005 par transcription)
- ✅ Tests rapides sans édition de config
- ✅ Transcriptions brutes pour analyse/debugging

### Personalities
- ✅ Adaptation rapide au contexte (meeting, email, notes)
- ✅ Pas besoin de mémoriser les bons prompts
- ✅ Résultats consistants par use case

---

## 🚧 Limitations & Considérations

### Limitations Techniques
- État runtime non persisté (reset au redémarrage)
- Personalities limitées à 4-5 prédéfinies

### Décisions de Design
- **Pas de sauvegarde auto dans config.json** : Évite conflits avec fichier config
- **État mémoire prioritaire** : Plus simple à gérer qu'un système de merge
- **Option "Save as default" future** : Si besoin de persistance

### UX
- Menu peut devenir long avec submenu (4-5 items)
- Besoin de tooltips clairs pour expliquer les personalities
- Icon feedback important pour état actuel

---

## 📚 Documentation Utilisateur

### Guide Rapide

**Toggle Formatter** :
1. Right-click system tray icon
2. Click "✍️ Formatter: ON" to toggle
3. Status changes immediately (no restart)

**Change Personality** :
1. Right-click → "Personality" submenu
2. Select desired style (Default, Professional, Technical, Creative)
3. Next transcription uses new style

---

## ✅ Checklist de Validation

Avant de démarrer l'implémentation :

- [ ] Valider les 4 personalities avec des tests utilisateur
- [ ] Vérifier node-systray-v2 supporte les submenus
- [ ] Confirmer que l'état runtime est suffisant (pas besoin de persistence)
- [ ] Définir le comportement lors du reload config (merge ou reset ?)

---

**Status** : ✅ **Prêt pour implémentation**
**Dépendances** : Aucune (feature standalone)
**Related** : Voir `OLLAMA_BACKEND.md` pour le support de formatage local

