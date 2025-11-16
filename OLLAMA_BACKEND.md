# Ollama LLM Backend Feature

**Feature**: Local LLM Backend for Text Formatting using Ollama
**Created**: 2025-10-21
**Status**: 📋 Planning / Future Enhancement
**Priority**: Medium
**Estimated Effort**: 4-5 hours

---

## 🎯 Motivation

Actuellement, le formatage de texte dépend exclusivement d'OpenAI GPT-3.5, ce qui implique :
- Coûts récurrents (~$0.0005 par transcription)
- Dépendance à une connexion Internet
- Envoi des données dans le cloud

Cette feature ajoute **Ollama** comme backend alternatif pour permettre un **formatage 100% local**, gratuit et privé.

---

## 🤖 Pourquoi Ollama ?

**Ollama** est l'outil de référence pour exécuter des LLM localement :
- ✅ Simple à installer (`curl https://ollama.ai/install.sh | sh`)
- ✅ API compatible OpenAI (`/v1/chat/completions`)
- ✅ Gestion automatique des modèles
- ✅ Optimisations CPU/GPU intégrées
- ✅ Large communauté et support

**Speaches** reste dédié à Whisper (transcription), ce qui simplifie l'architecture.

---

## ✨ Features Proposées

### 1. Backend Selector 🔄

**Description** : Switch rapide entre OpenAI et Ollama pour le formatage

**Menu Item** :
```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ─────────────────
├── ✍️ Formatter: ON
├──── 🤖 Backend  ← NOUVEAU
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

### 2. Toggle Benchmark Mode 📊

**Description** : Activer le mode benchmark pour comparer les backends côte à côte

**Menu Item** :
```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ─────────────────
├── ✍️ Formatter: ON
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
  formatterBackend: "openai" | "ollama";  // Backend de FORMATAGE uniquement
  benchmarkMode: boolean;                  // Toggle benchmark mode
}
```

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
    "formattingPrompt": "Fix grammar and punctuation. Keep original style."
  }
}
```

---

## 🤖 Modèles LLM Recommandés pour CPU

### 1. **TinyLlama-1.1B** ⭐ (Recommandé pour démarrer)
- **Taille** : 1.1B paramètres (~1.4GB)
- **Performance CPU** : Très rapide (inference <1s sur CPU moderne)
- **Usage mémoire** : ~2GB RAM
- **Qualité** : Suffisant pour formatage basique (grammaire, ponctuation)
- **Installation** : `ollama pull tinyllama`

### 2. **Phi-2 (2.7B)** (Alternative plus puissante)
- **Taille** : 2.7B paramètres (~1.7GB)
- **Performance CPU** : Acceptable (inference 2-3s)
- **Usage mémoire** : ~4GB RAM
- **Qualité** : Meilleure compréhension du contexte
- **Installation** : `ollama pull phi`

### 3. **Gemma-2B** (Alternative Google performante)
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

---

## 📊 Plan d'Implémentation

### Phase 1: Ollama Integration - 2h
- [ ] Installer et tester Ollama avec TinyLlama
- [ ] Ajouter FormatterService.checkOllamaAvailability()
- [ ] Étendre FormatterService pour supporter backend "ollama"
- [ ] Implémenter formatWithOllama() avec API compatible OpenAI
- [ ] Tests unitaires (3-4 tests)

### Phase 2: Backend Selector Menu - 1h
- [ ] Ajouter formatterBackend dans RuntimeState
- [ ] Ajouter submenu "Backend" (OpenAI/Ollama)
- [ ] Implémenter handleBackendChange()
- [ ] Griser l'option Ollama si indisponible
- [ ] Tests unitaires (2-3 tests)

### Phase 3: Benchmark Mode - 2h
- [ ] Ajouter benchmarkMode dans RuntimeState
- [ ] Ajouter menu item checkbox "Benchmark Mode ON/OFF"
- [ ] Implémenter exécution parallèle de tous les backends
- [ ] Créer notification comparative avec timings et stats
- [ ] Logger détaillé des résultats pour analyse
- [ ] Tests unitaires (3-4 tests)

### Phase 4: Documentation & Polish - 1h
- [ ] Documentation Ollama setup détaillé
- [ ] Documentation Benchmark Mode (utilisation, interprétation des résultats)
- [ ] Guide de troubleshooting (Ollama connection, modèles)
- [ ] Exemples de configuration pour différents modèles
- [ ] Messages d'erreur clairs si Ollama indisponible

**Total estimé** : 6 heures

---

## 🎯 Bénéfices Utilisateur

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
- Ollama nécessite 2-6GB RAM selon le modèle
- Qualité formatage Ollama < OpenAI GPT (mais acceptable)
- Performance CPU-dépendante (peut être lente sur vieux CPU)
- Nécessite installation séparée d'Ollama

### Décisions de Design
- **Speaches = Whisper uniquement** : Séparation claire transcription/formatage
- **Ollama = Formatage local** : Outil dédié pour LLM locaux
- **Benchmark en option** : Pas activé par défaut (overhead)

---

## 📚 Documentation Utilisateur

### Setup Rapide Ollama

```bash
# 1. Installer Ollama (Linux)
curl https://ollama.ai/install.sh | sh

# 2. Installer Ollama (macOS)
brew install ollama

# 3. Démarrer le service
ollama serve  # Ou démarre automatiquement

# 4. Télécharger un modèle
ollama pull tinyllama    # Rapide, 2GB RAM
ollama pull phi          # Plus puissant, 4GB RAM
ollama pull gemma:2b     # Alternative Google

# 5. Vérifier les modèles installés
ollama list

# 6. Tester un modèle
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

### Utilisation

**Switch Backend** :
1. Install Ollama and pull a model (see above)
2. Right-click system tray → "Backend" → "Ollama LLM"
3. Next transcription uses local formatting

**Compare Backends** :
1. Install Ollama with at least one model
2. Right-click → "Benchmark Mode: ON"
3. Record and transcribe as usual
4. See comparative notification with timings
5. Check console logs for detailed analysis

---

## ✅ Checklist de Validation

Avant de démarrer l'implémentation :

- [ ] Installer et tester Ollama avec TinyLlama (qualité formatage acceptable ?)
- [ ] Vérifier que l'API Ollama `/v1/chat/completions` fonctionne correctement
- [ ] Tester la latence Ollama vs OpenAI sur différents CPU
- [ ] Confirmer que le fallback OpenAI fonctionne si Ollama échoue
- [ ] Valider le format de notification benchmark (lisible, utile)

---

**Status** : ✅ **Prêt pour implémentation**
**Dépendances** : Ollama installé sur la machine (optionnel)
**Related** : Voir `QUICK_ACTIONS_MENU.md` pour le menu interactif

