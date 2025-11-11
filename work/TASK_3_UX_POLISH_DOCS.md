# Tâche 3 : UX Polish & Documentation

**Date**: 2025-10-28
**Priorité**: Moyenne
**Estimation**: 30 min
**Status**: 🚧 À faire

---

## ⚠️ DIRECTIVES QUALITÉ - À LIRE AVANT DE COMMENCER

**📖 Lire d'abord** : `work/DIRECTIVES_QUALITE.md` pour les règles générales

### Règles spécifiques pour cette tâche

1. **NE PAS halluciner** :
   - ✅ Vérifier les capacités RÉELLES de node-systray-v2 (tooltips supportés ?)
   - ✅ Vérifier que les icônes/emojis s'affichent sur la plateforme cible
   - ✅ Lire la doc existante AVANT de la modifier
   - ✅ Ne pas inventer de nouvelles fonctionnalités dans la doc

2. **ZÉRO régression** :
   - ✅ Le menu DOIT rester fonctionnel après modifications
   - ✅ Aucune documentation existante ne doit être cassée
   - ✅ Les exemples de config DOIVENT être valides
   - ✅ Tester le menu visuellement après chaque changement

3. **Code MINIMAL** :
   - ❌ Pas de refonte complète du menu
   - ❌ Pas de nouvelles fonctionnalités non demandées
   - ✅ Modifier UNIQUEMENT les labels et l'ordre
   - ✅ Ajouter des séparateurs si ça améliore la lisibilité

4. **Documentation COHÉRENTE** :
   - ✅ Code et docs DOIVENT être synchronisés
   - ✅ Exemples de code DOIVENT être testables
   - ✅ Screenshots SEULEMENT si faciles à maintenir
   - ✅ Pas de promesses de features non implémentées

5. **Validation systématique** :
   ```bash
   # Tests ne doivent pas casser
   bun test                    # DOIT être 100% ✅
   make lint                   # DOIT être 0 errors
   
   # Test manuel du menu
   bun run src/index.ts        # Vérifier visuellement le menu
   
   # Documentation doit être buildable
   make docs-build             # DOIT réussir sans warning
   ```

### Risques à éviter

- ❌ Icônes qui ne s'affichent pas sur certains OS
- ❌ Documentation qui promet des features non implémentées
- ❌ Exemples de config invalides ou obsolètes
- ❌ Over-design du menu (rester simple et fonctionnel)

### Approche recommandée

**Partie UX (15 min)** :
1. Tester le menu actuel - noter ce qui peut être amélioré
2. Modifier labels/ordre dans `buildMenuItems()`
3. Tester visuellement sur la plateforme de dev
4. Garder simple - pas de sophistication inutile

**Partie Docs (15 min)** :
1. Lire la doc existante complète
2. Identifier les sections à mettre à jour
3. Ajouter exemples concrets et testables
4. Build la doc pour vérifier qu'il n'y a pas d'erreur
5. Relire pour cohérence avec le code

---

## Objectif

Améliorer l'expérience utilisateur du menu Quick Actions et mettre à jour la documentation pour refléter les nouvelles fonctionnalités.

---

## Partie A : UX Polish (15 min)

### Labels et libellés

**Audit des labels actuels** :
- [ ] Vérifier cohérence des noms (Start/Stop Recording)
- [ ] Vérifier que "Personalities" est clair
- [ ] S'assurer que les custom personalities ont un préfixe visible

**Améliorations proposées** :

1. **Séparateurs visuels**
   - Ajouter séparateurs clairs entre sections du menu
   - Grouper logiquement : Recording / Personalities / Settings / Exit

2. **Icônes ou émojis** (optionnel)
   - ● / ○ pour Start/Stop Recording
   - ☑ / ☐ pour personalities checked/unchecked
   - 💾 pour Save as Default
   - ⚙️ pour Open Config
   - 🔄 pour Reload
   - ❌ pour Quit

3. **Tooltips** (si supporté par node-systray-v2)
   - Ajouter tooltip descriptif pour chaque action
   - Ex: "Start Recording" → "Begin voice recording (Ctrl+Shift+R)"

4. **Ordre des items**
   ```
   ● Start/Stop Recording
   ───────────────────
   Personalities ▸
   💾 Save Personalities as Default
   ───────────────────
   ⚙️ Open Config Folder
   🔄 Reload Config
   ───────────────────
   ❌ Quit
   ```

### Fichiers à modifier

- `src/services/system-tray.ts` : ajuster `buildMenuItems()`
- Vérifier support tooltips dans node-systray-v2

---

## Partie B : Documentation (15 min)

### Fichiers à mettre à jour

#### 1. **`README.md`** - Section Features

Ajouter mention explicite de Quick Actions :

```markdown
## Features

- 🎙️ **Voice Recording**: Record audio with system tray control
- 🤖 **AI Transcription**: Support for multiple backends (Whisper, Groq, OpenAI, Speaches)
- ✨ **Personality Formatting**: Apply different writing styles to your transcriptions
  - Built-in personalities: Professional, Creative, Technical, etc.
  - Custom personalities: Define your own prompts
  - **Quick Actions Menu**: Toggle personalities on-the-fly from system tray
- 📋 **Clipboard Integration**: Automatic copy of formatted text
- ⚙️ **Flexible Configuration**: JSON-based config with hot-reload
```

#### 2. **`documentation/user-guide/basic-usage.md`**

Ajouter section "Using Quick Actions Menu" :

```markdown
## Using the Quick Actions Menu

The system tray icon provides quick access to common actions:

### Recording Control
- **Start Recording**: Begin capturing audio
- **Stop Recording**: End recording and process transcription

### Personalities
1. Click "Personalities" to see available formatting styles
2. Check/uncheck personalities to toggle them
3. Active personalities (✓) will be applied during transcription
4. Click "Save Personalities as Default" to persist your selection

### Configuration
- **Open Config Folder**: Quick access to config files
- **Reload Config**: Apply changes without restarting
- **Quit**: Exit the application

**Tip**: You can have multiple personalities active simultaneously. They will be applied sequentially.
```

#### 3. **`documentation/user-guide/transcription-backends.md`**

Ajouter note sur personalities et backends :

```markdown
## Personalities and Backends

Personalities are backend-agnostic. The transcription backend produces raw text, then personalities are applied via your configured LLM (formatterBackend).

**Flow**: Audio → Transcription Backend → Raw Text → Formatter Backend (with personalities) → Formatted Text → Clipboard
```

#### 4. **`documentation/getting-started/configuration.md`**

Documenter les nouveaux champs de config :

```markdown
### Personalities Configuration

```json
{
  "selectedPersonalities": ["builtin:professional", "custom:email"],
  "activePersonalities": ["builtin:professional"],
  "customPersonalities": [
    {
      "id": "email",
      "name": "Email Style",
      "prompt": "Format as professional email"
    }
  ],
  "maxPromptLength": 4000,
  "logTruncateThreshold": 1000
}
```

- `selectedPersonalities`: Personalities shown in menu
- `activePersonalities`: Personalities enabled by default
- `customPersonalities`: Your custom formatting styles
- `maxPromptLength`: Max combined prompt length (chars)
- `logTruncateThreshold`: Truncate logs above this length
```

---

## Critères d'acceptation

### UX Polish
- [ ] Labels clairs et cohérents
- [ ] Séparateurs visuels entre sections
- [ ] Ordre logique des items
- [ ] Icônes/émojis ajoutés (si pertinent)
- [ ] Tooltips implémentés (si supporté)

### Documentation
- [ ] README.md mis à jour avec Quick Actions
- [ ] basic-usage.md documente le menu
- [ ] configuration.md liste tous les nouveaux champs
- [ ] transcription-backends.md explique le flow
- [ ] Exemples clairs et concis

---

## Checklist d'exécution

1. [ ] Audit du menu actuel - noter améliorations possibles
2. [ ] Vérifier support tooltips dans node-systray-v2 docs
3. [ ] Modifier `system-tray.ts` - améliorer labels et ordre
4. [ ] Tester visuellement le menu (run app)
5. [ ] Mettre à jour `README.md`
6. [ ] Mettre à jour `documentation/user-guide/basic-usage.md`
7. [ ] Mettre à jour `documentation/user-guide/transcription-backends.md`
8. [ ] Mettre à jour `documentation/getting-started/configuration.md`
9. [ ] Relire toute la doc pour cohérence
10. [ ] Commit avec message descriptif

---

## Notes

- Garder la doc concise et pratique
- Privilégier exemples visuels (code blocks, menu structures)
- Liens croisés entre pages de doc quand pertinent
- Screenshots optionnels (si faisable facilement)

---

## Exemple de structure menu améliorée

```typescript
// Dans buildMenuItems()
const items: any[] = [
  // RECORDING
  {
    title: recording ? '⏹ Stop Recording' : '⏺ Start Recording',
    tooltip: recording ? 'Stop and transcribe' : 'Begin voice recording',
    enabled: true,
  },
  { title: '---' }, // Séparateur
  
  // PERSONALITIES
  {
    title: '✨ Personalities',
    submenu: personalityItems,
  },
  {
    title: '💾 Save Personalities as Default',
    tooltip: 'Persist current selection to config.json',
    enabled: true,
  },
  { title: '---' },
  
  // SETTINGS
  {
    title: '⚙️ Open Config Folder',
    tooltip: 'Open configuration directory',
    enabled: true,
  },
  {
    title: '🔄 Reload Config',
    tooltip: 'Apply config changes without restart',
    enabled: true,
  },
  { title: '---' },
  
  // EXIT
  {
    title: '❌ Quit',
    tooltip: 'Exit Transcriber',
    enabled: true,
  },
];
```

