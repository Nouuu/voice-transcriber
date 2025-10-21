# Quick Actions Feature Specification

**Feature**: Dynamic Quick Actions in System Tray Menu
**Created**: 2025-10-21
**Status**: 📋 Planning / Future Enhancement
**Priority**: Medium
**Estimated Effort**: 4-6 hours

---

## 🎯 Motivation

Les utilisateurs doivent actuellement éditer `config.json` et recharger la configuration pour changer des paramètres courants. Cette feature permettrait de **toggle des fonctionnalités à la volée** directement depuis le menu du system tray, sans édition de fichier.

### Use Cases Principaux

1. **Toggle Formatter** : Activer/désactiver le formatage GPT rapidement
2. **Switch Formatter Personalities** : Changer entre différents prompts de formatage prédéfinis
3. **Switch Backend** : Basculer entre OpenAI et Ollama pour le formatage
4. **Toggle Benchmark Mode** : Comparer les performances et qualité des backends

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

### 2. Formatter Personalities (Phase 2) 🎭

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

### 3. Backend Selector (Phase 3) 🔄

**Description** : Switch rapide entre OpenAI et Ollama pour le formatage

**Menu Item** :
```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ─────────────────
├── ✍️ Formatter: ON
├──── 🎭 Personality: Professional
├──── 🤖 Backend
│     ├── ✓ OpenAI GPT
│     └── ☐ Ollama LLM (if available)
├── ─────────────────
├── ⚙️ Open Config
├── 🔄 Reload Config
└── ❌ Exit
```

**Comportement** :
- Détection automatique si Ollama est disponible
- Si Ollama indisponible, griser l'option
- Changement instantané du backend de formatage
- Fallback sur OpenAI si Ollama fail

### 4. Toggle Benchmark Mode (Phase 4) 📊

**Description** : Activer le mode benchmark pour comparer les backends côte à côte

**Menu Item** :
```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ─────────────────
├── ✍️ Formatter: ON
├──── 🎭 Personality: Professional
├──── 🤖 Backend: OpenAI GPT
├──── 📊 Benchmark Mode: OFF  ← NOUVEAU (checkable)
├── ─────────────────
├── ⚙️ Open Config
├── 🔄 Reload Config
└── ❌ Exit
```

**Comportement** :
- Quand activé : exécute TOUS les backends disponibles en parallèle
- Copie le résultat du backend principal dans le clipboard
- Affiche une notification comparative avec :
  - Temps de réponse de chaque backend
  - Taille des résultats (caractères)
  - Backend le plus rapide
- Log détaillé dans la console pour analyse

**Exemple de notification** :
```
🏁 Benchmark Results (3.2s total):
✅ OpenAI GPT: 1.8s - 145 chars
✅ Ollama (tinyllama): 2.1s - 142 chars
⭐ Fastest: OpenAI GPT
📋 Copied: OpenAI GPT result
```

**Avantages** :
- Compare qualité et vitesse des backends
- Aide à choisir le meilleur backend pour son usage
- Utile pour tester de nouveaux modèles Ollama
- Données objectives pour optimiser la config

---

## 🏗️ Architecture Technique

### Architecture Globale

```
┌─────────────────┐
│  Audio Input    │
└────────┬────────┘
         │
    ┌────▼────────────────────┐
    │ Speaches (Whisper)      │  ← Transcription uniquement
    │ faster-whisper-base     │
    └────┬────────────────────┘
         │ Raw Transcription
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
    ┌────▼──────┐   ┌──────▼───────┐   ┌─────▼────────┐
    │ OpenAI    │   │   Ollama     │   │ Pas de       │
    │ GPT-3.5   │   │  TinyLlama   │   │ formatage    │
    └────┬──────┘   └──────┬───────┘   └─────┬────────┘
         │                 │                  │
         └─────────────────┴──────────────────┘
                           │
                      Formatted Text
                           ▼
                       Clipboard
```

**Séparation claire** :
- **Speaches** = Backend de transcription Whisper (déjà implémenté)
- **OpenAI** = Backend de formatage LLM (déjà implémenté)
- **Ollama** = Backend de formatage LLM local (nouveau)

### État en Mémoire (Runtime State)

```typescript
interface RuntimeState {
  formatterEnabled: boolean;        // Toggle ON/OFF
  formatterPersonality: string;     // "default" | "professional" | ...
  formatterBackend: "openai" | "ollama";  // Backend de FORMATAGE uniquement
  benchmarkMode: boolean;           // Toggle benchmark mode
}
```

**Principe** :
- État runtime séparé de la config fichier
- Priorité : Runtime State > config.json
- Pas de sauvegarde automatique (reset au redémarrage)
- Option future : "Save as default" pour persister dans config.json


---

## 🤖 Ollama LLM pour le Formatage Local

### Pourquoi Ollama ?

**Ollama** est l'outil de référence pour exécuter des LLM localement :
- ✅ Simple à installer (`curl https://ollama.ai/install.sh | sh`)
- ✅ API compatible OpenAI (`/v1/chat/completions`)
- ✅ Gestion automatique des modèles
- ✅ Optimisations CPU/GPU intégrées
- ✅ Large communauté et support

**Speaches** reste dédié à Whisper (transcription), ce qui simplifie l'architecture.

### Modèles LLM Recommandés pour CPU

#### 1. **TinyLlama-1.1B** ⭐ (Recommandé pour démarrer)
- **Taille** : 1.1B paramètres (~1.4GB)
- **Performance CPU** : Très rapide (inference <1s sur CPU moderne)
- **Usage mémoire** : ~2GB RAM
- **Qualité** : Suffisant pour formatage basique (grammaire, ponctuation)
- **Installation** : `ollama pull tinyllama`

#### 2. **Phi-2 (2.7B)** (Alternative plus puissante)
- **Taille** : 2.7B paramètres (~1.7GB)
- **Performance CPU** : Acceptable (inference 2-3s)
- **Usage mémoire** : ~4GB RAM
- **Qualité** : Meilleure compréhension du contexte
- **Installation** : `ollama pull phi`

#### 3. **Gemma-2B** (Alternative Google performante)
- **Taille** : 2B paramètres (~1.7GB)
- **Performance CPU** : Rapide (inference ~1.5s)
- **Usage mémoire** : ~3GB RAM
- **Qualité** : Bon équilibre qualité/vitesse
- **Installation** : `ollama pull gemma:2b`

### Comparaison vs OpenAI GPT

| Aspect | TinyLlama (CPU) | Phi-2 (CPU) | OpenAI GPT-3.5 |
|--------|-----------------|-------------|----------------|
| **Latence** | ~0.5-1s | ~2-3s | ~1-2s |
| **Coût** | Gratuit | Gratuit | ~$0.0005/req |
| **Qualité** | Basique | Bonne | Excellente |
| **Privacy** | 100% local | 100% local | Cloud |
| **RAM requise** | 2GB | 4GB | N/A |
| **Setup** | 1 commande | 1 commande | API key |

### Configuration étendue

```json
{
  "language": "en",
  "formatterEnabled": true,
  "transcription": {
    "backend": "speaches",  // Pour Whisper (transcription)
    "speaches": {
      "url": "http://localhost:8000/v1",
      "apiKey": "none",
      "model": "Systran/faster-whisper-base"
    }
  },
  "formatting": {
    "backend": "openai",  // ← NOUVEAU : "openai" ou "ollama"
    "openai": {
      "apiKey": "sk-...",
      "model": "gpt-3.5-turbo"
    },
    "ollama": {
      "url": "http://localhost:11434/v1",  // Port standard Ollama
      "model": "tinyllama"
    },
    "personalities": {
      "default": {
        "name": "Default",
        "prompt": "Fix grammar and punctuation. Keep original style."
      }
      // ... autres personalities
    }
  }
}
```

### Vérification de Disponibilité

```typescript
// src/services/formatter.ts
public async checkOllamaAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${this.ollamaUrl}/api/tags`);
    const data = await response.json();
    return data.models && data.models.length > 0;
  } catch {
    return false;
  }
}
```

### Setup Rapide Ollama

```bash
# 1. Installer Ollama
curl https://ollama.ai/install.sh | sh

# 2. Démarrer Ollama (démarre automatiquement en arrière-plan)
ollama serve

# 3. Télécharger un modèle
ollama pull tinyllama

# 4. Tester
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tinyllama",
    "messages": [{"role": "user", "content": "Fix: i gone to store"}]
  }'

# 5. Dans Voice Transcriber: Backend → Ollama LLM
```

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

### Phase 3: Ollama LLM Backend - 2h
- [ ] Installer et tester Ollama avec TinyLlama
- [ ] Ajouter FormatterService.checkOllamaAvailability()
- [ ] Ajouter submenu "Backend" (OpenAI/Ollama)
- [ ] Implémenter FormatterService avec backend switch
- [ ] Documentation Ollama setup
- [ ] Tests unitaires (4-5 tests)

### Phase 4: Benchmark Mode - 2h
- [ ] Ajouter benchmarkMode dans RuntimeState
- [ ] Ajouter menu item checkbox "Benchmark Mode ON/OFF"
- [ ] Implémenter exécution parallèle de tous les backends
- [ ] Créer notification comparative avec timings et stats
- [ ] Logger détaillé des résultats pour analyse
- [ ] Tests unitaires (3-4 tests)

### Phase 5: Polish & Documentation - 1h
- [ ] Icônes différentes selon état (✍️/✏️)
- [ ] Messages de feedback clairs
- [ ] Mise à jour documentation utilisateur (Quick Actions)
- [ ] Guide de setup Ollama pour formatage
- [ ] Documentation Benchmark Mode (utilisation, interprétation des résultats)
- [ ] Guide de troubleshooting (Ollama, submenus, état runtime)

**Total estimé** : 9 heures

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

### Ollama Local Backend
- ✅ **Zero cost** pour formatage (après setup)
- ✅ **100% privacy** - tout en local
- ✅ **Pas de latence réseau** - plus rapide sur bon CPU
- ✅ **Pas de limites** - formatage illimité
- ✅ **Setup en 2 commandes** - Installation simple
- ✅ **API compatible OpenAI** - Intégration facile
- ✅ **Fallback automatique** si Ollama indisponible

### Benchmark Mode
- ✅ **Comparaison objective** - Mesures précises de performance
- ✅ **Aide à la décision** - Choisir le meilleur backend pour son usage
- ✅ **Test de modèles** - Évaluer rapidement de nouveaux modèles Ollama
- ✅ **Optimisation** - Données concrètes pour ajuster sa config
- ✅ **Transparence** - Voir la différence de qualité/vitesse entre backends

---

## 🚧 Limitations & Considérations

### Limitations Techniques
- État runtime non persisté (reset au redémarrage)
- Personalities limitées à 4-5 prédéfinies
- Ollama nécessite 2-6GB RAM selon le modèle
- Qualité formatage Ollama < OpenAI GPT (mais acceptable)

### Décisions de Design
- **Pas de sauvegarde auto dans config.json** : Évite conflits avec fichier config
- **État mémoire prioritaire** : Plus simple à gérer qu'un système de merge
- **Speaches = Whisper uniquement** : Séparation claire transcription/formatage
- **Ollama = Formatage local** : Outil dédié pour LLM locaux
- **Option "Save as default" future** : Si besoin de persistance

### UX
- Menu peut devenir long avec submenu (5-6 items)
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

**Use Ollama for Local Formatting** :
1. Install Ollama: `curl https://ollama.ai/install.sh | sh`
2. Pull a model: `ollama pull tinyllama`
3. Right-click → "Backend" → "Ollama LLM"
4. Formatage local, zero cost, 100% private

### Ollama Setup Détaillé

```bash
# Installation (Linux)
curl https://ollama.ai/install.sh | sh

# Installation (macOS)
brew install ollama

# Démarrer le service
ollama serve  # Ou démarre automatiquement

# Télécharger des modèles
ollama pull tinyllama    # Rapide, 2GB RAM
ollama pull phi          # Plus puissant, 4GB RAM
ollama pull gemma:2b     # Alternative Google

# Vérifier les modèles installés
ollama list

# Tester un modèle
ollama run tinyllama "Fix grammar: i gone to store yesterday"
```

### Configuration Voice Transcriber

```json
{
  "formatting": {
    "backend": "ollama",
    "ollama": {
      "url": "http://localhost:11434/v1",
      "model": "tinyllama"
    }
  }
}
```

---

## 🔄 Intégration dans la Roadmap

**Ajout dans Phase 7 : User Interface & Platform** :

```markdown
### Phase 7: User Interface & Platform 🖥️
- **🎯 Quick Actions Menu**: Toggle formatter, switch personalities, change backend on-the-fly
  - ✍️ Formatter toggle (ON/OFF)
  - 🎭 Formatter personalities (Default, Professional, Technical, Creative)
  - 🤖 Backend selector (OpenAI GPT / Ollama LLM)
  - 📊 Benchmark mode (Compare backends performance)
- 💻 CLI Interface: Command-line interface for automation
- 🪟 Windows Support: Replace arecord with Windows audio
- 🍎 macOS Support: Add macOS audio and system tray
- ⌨️ Keyboard Shortcuts: Global shortcuts for transcription
- 🖼️ Graphical Interface: Desktop GUI for configuration
```

---

## ✅ Checklist de Validation

Avant de démarrer l'implémentation :

- [ ] Valider les 4 personalities avec des tests utilisateur
- [ ] Installer et tester Ollama avec TinyLlama (qualité formatage acceptable ?)
- [ ] Vérifier node-systray-v2 supporte les submenus
- [ ] Confirmer que l'état runtime est suffisant (pas besoin de persistence)
- [ ] Définir le comportement lors du reload config (merge ou reset ?)
- [ ] Tester la latence Ollama vs OpenAI sur différents CPU

---


**Status** : ✅ **Cohérent et prêt pour implémentation**

