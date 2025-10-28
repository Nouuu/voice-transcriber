# Quick Actions Menu Feature

**Feature**: Dynamic Quick Actions in System Tray Menu
**Created**: 2025-10-21
**Updated**: 2025-10-23
**Status**: ✅ Phase 1 Complete / 🚧 Phase 2-3 Pending
**Priority**: Medium
**Estimated Effort**: 2h completed / 3h remaining (estimation initiale)

---

## Résumé actuel

La fonctionnalité « Quick Actions Menu » permet d'exposer des actions rapides dans l'icône de la tray système, dont un
sous-menu « Personalities » pour activer/désactiver des styles de formatage (builtin + custom). La Phase 1 (construction
du menu dynamique, routing des clics et gestion des états) est terminée et couverte par des tests unitaires. Les
comportements critiques (Start/Stop Recording, mise à jour visuelle des items, toggles des personalities, Reload/Exit)
sont fonctionnels.

Ce fichier documente l'avancement, les décisions d'architecture et ce qui reste à faire pour finaliser et stabiliser la
feature en production.

---

## Ce qui a été réalisé (Phase 1)

- ✅ Support multi-personalities dans `Config`
    - Sauvegarde / chargement de `customPersonalities`, `selectedPersonalities` et `activePersonalities`.
- ✅ Menu dynamique des personalities dans la tray
    - Sous-menu construit à partir de `selectedPersonalities` et `customPersonalities`.
- ✅ Routing des clics
    - Les clics sont routés par index (seq_id) vers les callbacks appropriés (start/stop/open/reload/quit/personality
      toggle).
- ✅ Propagation minimale du prompt vers l'AudioProcessor (structure prête, voir Phase 2 pour intégration complète)
- ✅ Tests unitaires
    - Tests de `Config` (load/save/migration)
    - Tests de `SystemTrayService` (initialize, setState, shutdown, click routing)
- ✅ Refactor `buildMenuItems()` et `setState()` pour assurer des updates fiables (`update-menu` + `update-item`).
- ✅ Méthode `shutdown()` implémentée et testée.

---

## Décisions d'architecture clés

- Namespace clair pour les personalities : `builtin:` vs `custom:`.
- Separation of concerns : la tray manipule l'état runtime (selected/active) mais ne persiste pas automatiquement les
  changements utilisateur dans `config.json` (par défaut). Cette séparation facilite les actions immédiates sans altérer
  la configuration persistée.
- Mise à jour visuelle fiable : combinaison `update-menu` + `update-item` pour assurer que `enabled`/`checked` soient
  reflétés correctement.

---

## Ce qui reste à faire (Phase 2 & 3)

Priorité élevée

1. Propagation complète des prompts actifs vers `AudioProcessor` (Phase 2) — 1.5h
    - Description : faire en sorte que, lors de la transcription, l'AudioProcessor récupère les prompts des
      personalities actives et les envoie correctement au formatter / backend.
    - Acceptation : tests d'intégration qui simulent une transcription avec plusieurs personalities actives et vérifient
      que le prompt envoyé contient la concaténation / composition attendue.
    - Risques : gestion du modèle de composition (ordre, conflit entre prompts), taille du prompt (trim si trop grand).

2. Tests d'intégration / E2E pour menu → transcription (Phase 2) — 1h
    - Description : tests qui couvrent : changement de personality dans la tray → déclenchement d'une transcription →
      vérification que le formatter reçoit la bonne instruction.
    - Acceptation : CI vert, couverture minimale pour le flux critique.

Priorité moyenne

3. Option "Save as default" / Persistance (Phase 3) — 1h
    - Description : ajouter une action dans le menu (ou checkbox longue-pression) pour enregistrer l'état runtime (
      selected/active) dans `config.json` (persistant). Nécessite UI pour confirmation et mise à jour de
      `Config.save()`.
    - Acceptation : lors de la sélection "save", `config.json` est mis à jour et une relance de l'app reflète le nouvel
      état.
    - Considérations : demander confirmation à l'utilisateur pour éviter persistance involontaire.

4. UX polish & tooltips (Phase 3) — 0.5h
    - Description : clarifier libellés, tooltips, séparation visuelle, ordre par défaut.
    - Acceptation : revue UX rapide et corrections mineures.

5. Cross-platform testing and packaging checks — 0.5h
    - Description : vérifier le comportement `node-systray-v2`/tray sur Linux/Mac/Windows (packaging via electron/tauri
      ou binaire) ; s'assurer que `copyDir` / icones fonctionnent.
    - Acceptation : smoke tests sur OS disponibles à portée.

Total estimé restant : ≈ 3.0 h

---

## Tâches techniques détaillées et checklist

- [x] Phase 1: Menu + routing + tests unitaires
- [ ] Phase 2.1: Implémenter propagation des prompts vers `AudioProcessor` (intégration runtime)
    - [ ] Ajouter API dans SystemTrayService pour exposer l'état runtime (
      getActivePersonalities/getSelectedPersonalities)
    - [ ] Adapter `AudioProcessor` pour accepter un tableau de prompts (ou un prompt composite)
    - [ ] Tests unitaires + tests d'intégration
- [ ] Phase 2.2: Tests d'intégration / E2E (menu -> transcription)
- [ ] Phase 3.1: Ajouter action "Save as default" et intégration dans `Config.save()`
- [ ] Phase 3.2: UX polish (tooltips, labels)
- [ ] Phase 3.3: Cross-platform smoke tests (Linux/Mac/Windows packaging)
- [ ] Documentation utilisateur: mettre à jour README et user-guide (transcription-backends.md et basic-usage.md)
- [ ] Revue de sécurité: valider la taille des prompts, éviter fuite d'API keys dans logs

---

## Critères d'acceptation (Definition of Done)

- Flux complet (menu → sélection personality → transcription) couvert par tests d'intégration.
- Comportements Start/Stop/Reload/Exit sont robustes et n'entraînent pas d'état invalide.
- Les prompts issus des personalities actives sont envoyés correctement au formatter / backend.
- Option de persistance (si activée) met à jour `config.json` de façon atomique et sûre.
- Documentation utilisateur et technique mise à jour.

---

## Risques et mitigations

- Prompt trop long : ajouter logique de truncation ou priorisation des personalities (ex: garder N premier prompts ou
  concat avec separators).
- Comportement platform-dépendant de la tray : isoler interactions dans `SystemTrayService` et stub/mock dans tests.
- Changement non désiré de la configuration user : exiger confirmation avant persistance.

---

## Proposition d'ordonnancement (Sprint court)

Sprint 1 (1 jour)

- Implémenter propagation des prompts vers `AudioProcessor` (2-3h)
- Ajouter tests d'intégration (1h)
- Revue PR et corrections (1h)

Sprint 2 (demi-journée)

- Ajouter persistance "Save as default" (1h)
- UX polish et docs (1h)
- Cross-platform smoke tests (0.5h)

---

## Exemples d'API / Pseudo-code

- Exposer l'état runtime depuis `SystemTrayService` :

```ts
// SystemTrayService
public
getRuntimeState()
{
    return {
        selectedPersonalities: this.selectedPersonalities.slice(),
        activePersonalities: this.activePersonalities.slice(),
    };
}
```

- Utiliser depuis `AudioProcessor` :

```ts
const {activePersonalities} = systemTrayService.getRuntimeState();
const prompts = activePersonalities.map(id => config.getPromptFor(id));
const compositePrompt = prompts.join('\n\n---\n\n');
```

---

## Notes additionnelles

- Les tests actuels couvrent les cas unitaires abordés pendant la phase 1 ; l'ajout d'un test d'intégration permettra de
  valider l'orchestration complète.
- Garder la logique de persistence optionnelle évite d'écraser la configuration de l'utilisateur sans confirmation.

---

## Mise à jour — Phase 2 (implémentation minimale)

Travail réalisé depuis la dernière mise à jour :

- ✅ Implémenté une API runtime dans `SystemTrayService` :
    - `getRuntimeState()` expose des copies de `selectedPersonalities` et `activePersonalities` pour que d'autres
      services lisent l'état courant.
    - Fichier modifié : `src/services/system-tray.ts`.
- ✅ Raccordement dans l'application principale :
    - `VoiceTranscriberApp` (dans `src/index.ts`) utilise désormais `systemTrayService.getRuntimeState()` lors de
      l'arrêt d'un enregistrement pour passer `activePersonalities` à l'`AudioProcessor`.
    - Fichier modifié : `src/index.ts`.
- ✅ AudioProcessor déjà compatible :
    - `AudioProcessor.processAudioFile(filePath, activePersonalities?)` applique chaque personality en appelant
      `FormatterService.getPersonalityPrompt(personality)` puis `formatText` séquentiellement.
    - Fichier existant : `src/services/audio-processor.ts` (aucune modification majeure requise pour la version
      minimale).
- ✅ Tests ajoutés :
    - Tests unitaires pour `SystemTrayService.getRuntimeState()` (initial state and after update).
    - Fichier modifié : `src/services/system-tray.test.ts`.

Preuves et commandes utiles

- Pour exécuter la suite de tests (local) :

```bash
# installer les dépendances si nécessaire
bun install
# lancer tous les tests
bun test
# ou via Makefile
make test
# Pour lancer ESLint (type-aware) et détecter les erreurs de style/typage :

```bash
# via Makefile (utilise bunx eslint)
make lint
# vérification TypeScript
bun run check
# (ou) make check si défini
make check
```

Qu'est‑ce que cela signifie concrètement ?

- Lorsque l'utilisateur arrête un enregistrement, l'application récupère l'état réél des personalities depuis le service
  de tray et le transmet à l'`AudioProcessor`.
- L'`AudioProcessor` applique chaque personality (via `FormatterService.getPersonalityPrompt`) et produit le texte final
  avant copie dans le presse‑papier.
- Le flux menu → toggle personality → stop recording → processing → formatting est donc connecté de bout en bout (Phase
  2 minimale).

Tâches restantes (affinées) — Phase 2 / Phase 3

- [x] Phase 2.0 : Exposer runtime state (fait - commit 54c4f9b)
- [x] Phase 2.1 : Raccorder runtime state à `AudioProcessor` (fait - commit 54c4f9b)
- [x] Phase 2.2 : Ajouter tests d'intégration minimalistes (fait - commit 58d9f69)
- [x] Phase 2.2b : Amélioration du logging avec truncation intelligente (fait - en attente commit)
    - Action : test d'intégration ajouté : `src/services/system-tray.integration.test.ts`.
    - Preuve d'exécution (résumé) :
        - Commande exécutée : `bun test src/services/system-tray.integration.test.ts --verbose`
        - Sortie (résumé) :

```
2025-10-23T21:04:04.800Z [INFO] Personality activated: builtin:creative
2025-10-23T21:04:04.800Z [INFO] Active personalities: builtin:creative
2025-10-23T21:04:04.801Z [INFO] Stopping recording...
2025-10-23T21:04:04.801Z [INFO] Transcribing audio...
2025-10-23T21:04:04.801Z [INFO] Transcription result: Raw transcription
2025-10-23T21:04:04.801Z [INFO] Formatting text with personalities: builtin:creative
2025-10-23T21:04:04.801Z [INFO] Final formatted text (28 chars):
2025-10-23T21:04:04.801Z [INFO] Formatted: Raw transcription
2025-10-23T21:04:04.801Z [INFO] Copying to clipboard...
2025-10-23T21:04:04.801Z [INFO] Text copied to clipboard successfully

✓ 1 test d'intégration exécuté — 1 pass, 0 fail
```

- Remarques : le test vérifie que `FormatterService.formatText` reçoit le `promptOverride` attendu (
  `prompt:builtin:creative`) et que le flux menu → stop → transcription → formatting → clipboard est bien exécuté.

- [ ] Phase 2.3 : Gestion des prompts long/concatenation
    - Action : définir et implémenter stratégie (concat simple, trim, priorisation ou limit tokens). Estimation : 30–60
      min.
- [ ] Phase 3.1 : Option "Save as default" (persist) — UX + confirmation + tests. Estimation : 1h
- [ ] Phase 3.2 : UX polish (libellés, tooltips) et documentation utilisateur. Estimation : 0.5h
- [ ] Phase 3.3 : Cross‑platform smoke tests / packaging. Estimation : 0.5h

## Travail en cours (non commité)

**Date**: 2025-10-28

### Modifications en attente de commit

- ✅ **Logger amélioré avec truncation intelligente** (`src/utils/logger.ts`)
    - Ajout de `logConditional()` : affiche le texte complet en DEBUG et une version tronquée en INFO si > threshold
    - Threshold configurable via `setTruncateThreshold()` / `getTruncateThreshold()`
    - Tests unitaires ajoutés dans `logger.test.ts`

- ✅ **Configuration du threshold de logging** (`src/config/config.ts`)
    - Nouveau champ `logTruncateThreshold` (par défaut: 1000 caractères)
    - Chargement et sauvegarde dans `config.json`

- ✅ **Application du logging conditionnel**
    - `audio-processor.ts` : utilise `logConditional()` pour transcription et texte formaté
    - `formatter.ts` : utilise `logConditional()` pour original et formatted
    - `transcription.ts` : utilise `logConditional()` pour le texte transcrit

- ✅ **Initialisation dans l'app** (`src/index.ts`)
    - Application du threshold depuis la config au démarrage

- 📝 **Tests étendus** (`src/services/transcription.test.ts`)
    - Réorganisation majeure des tests (338 lignes de changements)

### À faire avant commit

1. [x] Vérifier que tous les tests passent (`bun test`) - ✅ 112/112 tests
2. [x] Vérifier le linting (`make lint`) - ✅ 0 errors, 34 warnings acceptables
3. [x] Corriger les tests unitaires et la gestion des fichiers temporaires
4. [x] Améliorer la configuration ESLint pour être plus stricte et cohérente

Proposition concrète pour next sprint (court)

1. Écrire le test d'intégration minimal (Phase 2.2) :
    - Moquer `FormatterService.formatText` pour capturer `promptOverride`.
    - Simuler activation d'une personality via `SystemTrayService` (ou `VoiceTranscriberApp.handlePersonalityToggle`),
      puis simuler arrêt d'enregistrement en appelant `handleRecordingStop()` (moquer `AudioRecorder` pour retourner un
      fichier temporaire et `TranscriptionService` pour une transcription simple).
    - Vérifier que `formatText` est appelé avec `promptOverride` correspondant à la personality.
2. Ajouter une règle simple de protection sur la taille du prompt si la concaténation dépasse N caractères (ex : 4000
   char) — rejeter ou couper proprement.
3. Revue + merge : créer une branche `feat/quick-actions-phase2` et ouvrir PR contenant les petites modifications (api
   runtime, index wiring, tests). CI : lint + tests doivent passer.

Voulez‑vous que j'implémente le test d'intégration (Phase 2.2) maintenant ?

- Si oui, je :
    1. crée un test d'intégration sous `src/services/` (ex: `system-tray.integration.test.ts`),
    2. moque `FormatterService` + `TranscriptionService` + `AudioRecorder` pour simuler le flux,
    3. exécute `bun test` et corrige si nécessaire.

Choisissez : Oui — je m'en charge maintenant, ou Non — je génère la PR/patch et la checklist.

---

Fin de la mise à jour.
