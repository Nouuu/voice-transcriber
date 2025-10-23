# Quick Actions Menu Feature

**Feature**: Dynamic Quick Actions in System Tray Menu
**Created**: 2025-10-21
**Updated**: 2025-10-23
**Status**: ✅ Phase 1 Complete / 🚧 Phase 2-3 Pending
**Priority**: Medium
**Estimated Effort**: 2h completed / 3h remaining

---

## 📝 Session de Troubleshooting (2025-10-23)

### 🐛 Bugs Identifiés et Corrigés

**Problème Initial** :
- Menu items ne se mettaient pas à jour lors du changement d'état
- Boutons restaient grisés/activés incorrectement après Start/Stop Recording
- Méthode `shutdown()` manquante causant une erreur au exit

**Root Cause** :
- L'approche simplifiée avec `update-menu` seul ne mettait pas à jour les états `enabled/disabled` des items
- Le code qui fonctionnait utilisait `update-menu` + `update-item` pour chaque item

**Solutions Appliquées** :
1. ✅ **Structure dictionnaire `MENU_ITEMS`** - Single source of truth pour tous les menu items avec configuration centralisée
2. ✅ **Approche hybride `update-menu` + `update-item`** - Garantit la mise à jour correcte des états
3. ✅ **Méthode `buildMenuItems()` refactorisée** - Utilise le dictionnaire pour construire les items
4. ✅ **Méthode `updateFormatterState()` ajoutée** - Pour mettre à jour le toggle formatter dynamiquement
5. ✅ **Méthode `shutdown()` restaurée** - Corrige l'erreur au exit

**Résultats des Tests** :
- ✅ Start Recording active correctement Stop Recording
- ✅ Stop Recording désactive correctement et retourne à IDLE
- ✅ Toggle Formatter fonctionne (⬜ ↔ ✅)
- ✅ Reload Config correctement désactivé pendant Recording
- ✅ Exit fonctionne sans erreur

**Code Quality** :
- **Avant** : 112 lignes dans `setState()` avec duplication massive
- **Après** : 50 lignes factorisées avec structure dictionnaire
- **Amélioration** : -55% lignes, maintenabilité haute, aucune duplication

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

### Phase 1: Toggle Formatter (MVP) - ✅ COMPLETE (2h)
- [x] Ajouter RuntimeState dans VoiceTranscriberApp
- [x] Ajouter menu item checkbox "Formatter ON/OFF" (✅/⬜)
- [x] Implémenter handleFormatterToggle()
- [x] Mettre à jour processAudioFile() pour respecter runtimeState
- [x] Créer structure dictionnaire MENU_ITEMS pour factorisation
- [x] Corriger update-menu + update-item pour états enabled/disabled
- [x] Ajouter méthode updateFormatterState()
- [x] Tests unitaires (3 tests) - Runtime toggle override (2025-10-23)
- [x] Debug logging dans FormatterService (2025-10-23)
- [x] Debug logging dans AudioProcessor pour formatter state (2025-10-23)

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

## 🗺️ Roadmap détaillée & Étape suivante (Phase 2)

L'étape suivante est la Phase 2 : "Formatter Personalities" — implémentation d'un sous-menu de personnalités pour le formateur, permettant de changer dynamiquement le prompt utilisé par le FormatterService sans recharger la configuration.

Qu'est-ce que c'est ?
- C'est une extension du toggle actuel qui ajoute un sous-menu "Personality" contenant plusieurs styles de formatage (Default, Professional, Technical, Creative, Custom).
- L'utilisateur peut sélectionner une personnalité (radio-style) et la prochaine transcription utilisera le prompt correspondant.

Objectifs de la Phase 2
- Permettre la sélection instantanée d'un prompt de formatage dans le menu système.
- Faire en sorte que `AudioProcessor` et `FormatterService` puissent accepter/propager la personnalité choisie.
- Ajouter tests unitaires et d'intégration pour couvrir le nouveau flux.

Tâches techniques (décomposées)
1. Modèle de données & runtime
   - Ajouter `formatterPersonality: string` dans `RuntimeState` (valeurs: `default|professional|technical|creative|custom`).
   - Étendre l'initialisation pour charger la personnalité par défaut depuis `config.getFormatterConfig()` si présente.
   - Estimé : 0.5h

2. Menu système (node-systray-v2)
   - Ajouter sous-menu "Personality" avec éléments radio et check mark pour l'item actif.
   - Implémenter `handlePersonalityChange(personality: string)` pour mettre à jour le runtime state et appeler `updateMenu`/`updateItem`.
   - Tester visuellement que la sélection change d'état et est reflétée dans le menu.
   - Estimé : 1h

3. Propagation du prompt au FormatterService
   - Modifier `AudioProcessor.processAudioFile()` pour accepter un paramètre `personality?: string` (ou lire depuis `runtimeState`) et transmettre la prompt correspondante au `FormatterService` (ou à son appelant) lors de `formatText()`.
   - Étendre `FormatterService` pour accepter un override de prompt à l'appel (ex: `formatText(text, { promptOverride?: string })`).
   - Estimé : 1h

4. Prompts prédéfinis & Custom
   - Ajouter structure contenant les prompts prédéfinis dans `work/QUICK_ACTIONS_MENU.md` (déjà documenté) et exposer ces prompts via `Config.getFormatterConfig()` ou une nouvelle source interne du runtime.
   - Implémenter la personnalité `custom` qui utilise `config.formattingPrompt` si sélectionnée.
   - Estimé : 0.5h

5. Tests unitaires et d'intégration
   - Tests unitaires :
     - `FormatterService.formatText` respecte l'override de prompt si fourni.
     - `AudioProcessor.processAudioFile` transmet correctement la personnalité/runtime override.
   - Tests d'intégration :
     - Simuler sélection de personnalité + enregistrement/transcription → vérifier que `openai.chat.completions.create` reçoit le prompt attendu.
   - Estimé : 1h

6. Documentation & UX
   - Mettre à jour `work/QUICK_ACTIONS_MENU.md` (ce fichier) pour expliquer l'usage.
   - Mettre à jour README utilisateur si besoin.
   - Estimé : 0.5h

Livrables et critères d'acceptation (Definition of Done)
- [ ] Sous-menu "Personality" visible et navigable dans le system tray.
- [ ] La sélection change l'état runtime et l'item actif est affiché comme cochée.
- [ ] Les transcriptions ultérieures utilisent le prompt associé à la personnalité choisie.
- [ ] Tests unitaires couvrant la propagation du prompt : 100% pass localement.
- [ ] Pas de régression sur les tests existants (suite complète verte).

Plan de test minimal
- Tests unitaires : lancer `bun test src/services/formatter.test.ts` et `bun test src/services/audio-processor.test.ts`.
- Test d'intégration rapide : démarrer l'app en mode debug, sélectionner une personnalité différente, enregistrer une phrase courte et vérifier dans les logs que le prompt envoyé à OpenAI contient la personnalité choisie.

Dépendances & risques
- `node-systray-v2` : vérifier le support des submenus / radio items sur toutes les plateformes ciblées. (Risque faible mais à valider.)
- Augmentation potentielle des appels à l'API si les users testent plusieurs personalities rapidement (coût). On recommande une notice UX avertissant l'utilisateur.

Calendrier proposé (itératif)
- Jour J (T0) : Implémentation du runtime + menu (tâches 1+2) — 1.5h
- Jour J+1 (T1) : Propagation du prompt + prompts prédéfinis (tâches 3+4) — 1.5h
- Jour J+2 (T2) : Tests, docs et polish (tâche 5+6) — 1h

Prochaine action immédiate (que je peux faire pour vous maintenant)
- Implémenter la Phase 2 : créer le code pour le sous-menu, ajouter le champ `formatterPersonality` dans le runtime et modifier `FormatterService` pour accepter un override de prompt. Je peux appliquer ces changements et exécuter les tests unitaires/integration ci-après.

Souhaitez-vous que je commence l'implémentation technique de Phase 2 maintenant ?
- Répondez "Oui, commence" et je lancerai les modifications de code (création/modification des fichiers nécessaires) et j'exécuterai la suite de tests.
- Répondez "Document only" si vous voulez seulement la documentation et un plan, sans code.

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
