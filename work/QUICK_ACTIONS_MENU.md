# Quick Actions Menu Feature

**Feature**: Dynamic Quick Actions in System Tray Menu
**Created**: 2025-10-21
**Updated**: 2025-10-23
**Status**: ✅ Phase 1 Complete / 🚧 Phase 2-3 Pending
**Priority**: Medium
**Estimated Effort**: 2h completed / 3h remaining

---

## 📝 Sessions de Troubleshooting

### Session 2025-10-23 (PM) : Gestion des Personalities & Configuration

**Commits récents** :
- `26896d3` - feat: streamline click handling and remove debug logs in system tray
- `38c8989` - feat: enhance system tray menu with personality management and routing
- `040520b` - feat: add support for multiple active personalities in audio processing
- `dad0fdb` - feat: add formatter state management and click routing for system tray actions
- `b0bf175` - feat: add tests for loading and saving formatter personality settings in config
- `534c7ca` - feat: add formatter personality settings and dynamic prompt management

**Implémentation Phase 2 - Personalities** : ✅ COMPLETE

**Fonctionnalités ajoutées** :
1. ✅ **Support multi-personalities dans Config** - Sauvegarde/chargement de `customPersonalities`, `selectedPersonalities` et `activePersonalities`
2. ✅ **Menu dynamique des personalities** - Sous-menu avec checkmarks sur les items actifs
3. ✅ **Routing des clics** - Gestion des événements pour sélectionner une personality
4. ✅ **Propagation du prompt** - AudioProcessor utilise les personalities actives pour formater
5. ✅ **Tests complets** - Coverage des nouvelles fonctionnalités config

**Décisions prises** :
- ✅ **Système à namespace (2 niveaux)** : Séparation claire entre personalities builtin et custom
  - **Builtin personalities** : `builtin:default`, `builtin:professional`, etc.
  - **Custom personalities** : `custom:my-style`, `custom:meeting-notes`, etc.
  - **Avantages** :
    - ✅ Aucune collision possible (namespaces séparés)
    - ✅ Clarté visuelle dans le menu : "Default (builtin)" vs "My Style (custom)"
    - ✅ Évolutivité : Ajout de builtins sans risque de casser les configs users
    - ✅ Prévisibilité : L'utilisateur sait ce qui est modifiable

**Architecture du système** :

```typescript
// Constantes de namespace
const BUILTIN_PREFIX = 'builtin:';
const CUSTOM_PREFIX = 'custom:';

// Deux maps séparées
private readonly builtinPersonalities: Record<string, PersonalityConfig>
public customPersonalities: Record<string, PersonalityConfig>

// Menu avec séparation visuelle
Personalities →
  ✓ Default (builtin)
  ⬜ Professional (builtin)
  ⬜ Technical (builtin)
  ───────────────────
  ⬜ Meeting Notes (custom)
  ⬜ Blog Post (custom)
```

**Migration** :
- Les personalities existantes sans préfixe doivent être normalisées en `builtin:` au moment du chargement si nécessaire
- Les personalities dans `config.json` pour des personnalisations utilisateurs utilisent le préfixe `custom:` (cf. `customPersonalities`)
- L'ensemble des choix d'active/selected est contrôlé via `activePersonalities` / `selectedPersonalities`

### Session 2025-10-23 (AM) : Refactoring Menu State

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
4. ✅ **Méthode `updatePersonalityState()` ajoutée** - Pour mettre à jour le check des personalities dynamiquement
5. ✅ **Méthode `shutdown()` restaurée** - Corrige l'erreur au exit

**Résultats des Tests** :
- ✅ Start Recording active correctement Stop Recording
- ✅ Stop Recording désactive correctement et retourne à IDLE
- ✅ Toggle de la personality (check/uncheck) fonctionne
- ✅ Reload Config correctement désactivé pendant Recording
- ✅ Exit fonctionne sans erreur

**Code Quality** :
- **Avant** : 112 lignes dans `setState()` avec duplication massive
- **Après** : 50 lignes factorisées avec structure dictionnaire
- **Amélioration** : -55% lignes, maintenabilité haute, aucune duplication

---

## 🎯 Motivation

Le but est d'exposer les capacités de formatage depuis le tray en s'appuyant uniquement sur le système de personalities (builtin + custom). Le runtime n'expose plus un toggle "global formatter" : le comportement est déterminé par les personalities actives et sélectionnées.

### Use Cases Principaux

1. **Sélectionner les personalities actives** : Permettre au système de formatage d'utiliser un ou plusieurs prompts
2. **Changer la personality par défaut via le menu** : Choisir rapidement un style sans éditer le fichier

---

## ✨ Features Proposées (ajustées)

### 1. Personnalities (MVP)

**Description** : Le menu expose un sous-menu "Personality" où l'utilisateur peut :
- cocher/décocher des personalities (activePersonalities)
- sélectionner la personality par défaut (selectedPersonalities / ordre)

**Menu Item** :
```
🎤 Voice Transcriber
├── 🎙️ Start Recording
├── ⏹️ Stop Recording
├── ─────────────────
├── 🎭 Personality  ← NOUVEAU (submenu)
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

**Comportement** :
- Les personalities cochées dans `activePersonalities` seront utilisées pour le post-traitement
- L'utilisateur peut changer la personnalité par défaut via `selectedPersonalities` ou en cochant une seule personality
- Les changes sont appliqués en runtime (non persistés automatiquement)

---

## 🏗️ Architecture Technique

### État en Mémoire (Runtime State)

```typescript
interface RuntimeState {
  selectedPersonalities: string[]; // ordre/choix visibles
  activePersonalities: string[];   // lesquelles sont actives (checkbox)
}
```

**Principe** :
- État runtime séparé de la config fichier (pas de persist automatique)
- Le système prend le prompt à partir de la personality (builtin ou custom) pour le formatage

---

## 📊 Plan d'Implémentation (ajusté)

### Phase 1: Menu Personalities - ✅ COMPLETE
- [x] Ajouter structure pour personalities dans `Config`
- [x] Exposer `customPersonalities`, `selectedPersonalities`, `activePersonalities`
- [x] Ajouter sous-menu Personality avec checkboxes
- [x] Tests unitaires pour la gestion des personalities

### Phase 2: Propagation des prompts - 1.5h
- [ ] Faire en sorte que `AudioProcessor` transmette le(s) prompt(s) correspondant(s) aux personalities actives
- [ ] Ajouter tests unitaires d'intégration pour vérifier que le prompt envoyé à l'API correspond à la personality sélectionnée

### Phase 3: UX & polish - 1h
- [ ] Ajouter tooltips et libellés clairs
- [ ] Option future "Save as default" (persist)

---

## 📚 Documentation Utilisateur (mise à jour)

**Changer les personalities** :
1. Right-click system tray icon
2. Open "Personality" submenu
3. Check/Uncheck the personalities to enable/disable them
4. The next transcription(s) will use the active personalities' prompts

---

## ✅ Checklist de Validation

- [x] Les personalities builtin sont présentes
- [x] Les custom personalities peuvent être ajoutées via `config.json`
- [x] Les active/selected personalities sont chargées au démarrage
- [x] Le menu reflète correctement l'état runtime

---

**Status** : ✅ **Prêt pour implémentation**
**Dépendances** : Aucune (feature standalone)
**Related** : Voir `work/QUICK_ACTIONS_MENU.md` pour les détails d'implémentation
