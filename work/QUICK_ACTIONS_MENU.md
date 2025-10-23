# Quick Actions Menu Feature

**Feature**: Dynamic Quick Actions in System Tray Menu
**Created**: 2025-10-21
**Updated**: 2025-10-23
**Status**: ✅ Phase 1 Complete / 🚧 Phase 2-3 Pending
**Priority**: Medium
**Estimated Effort**: 2h completed / 3h remaining (estimation initiale)

---

## Résumé actuel

La fonctionnalité « Quick Actions Menu » permet d'exposer des actions rapides dans l'icône de la tray système, dont un sous-menu « Personalities » pour activer/désactiver des styles de formatage (builtin + custom). La Phase 1 (construction du menu dynamique, routing des clics et gestion des états) est terminée et couverte par des tests unitaires. Les comportements critiques (Start/Stop Recording, mise à jour visuelle des items, toggles des personalities, Reload/Exit) sont fonctionnels.

Ce fichier documente l'avancement, les décisions d'architecture et ce qui reste à faire pour finaliser et stabiliser la feature en production.

---

## Ce qui a été réalisé (Phase 1)

- ✅ Support multi-personalities dans `Config`
  - Sauvegarde / chargement de `customPersonalities`, `selectedPersonalities` et `activePersonalities`.
- ✅ Menu dynamique des personalities dans la tray
  - Sous-menu construit à partir de `selectedPersonalities` et `customPersonalities`.
- ✅ Routing des clics
  - Les clics sont routés par index (seq_id) vers les callbacks appropriés (start/stop/open/reload/quit/personality toggle).
- ✅ Propagation minimale du prompt vers l'AudioProcessor (structure prête, voir Phase 2 pour intégration complète)
- ✅ Tests unitaires
  - Tests de `Config` (load/save/migration)
  - Tests de `SystemTrayService` (initialize, setState, shutdown, click routing)
- ✅ Refactor `buildMenuItems()` et `setState()` pour assurer des updates fiables (`update-menu` + `update-item`).
- ✅ Méthode `shutdown()` implémentée et testée.

---

## Décisions d'architecture clés

- Namespace clair pour les personalities : `builtin:` vs `custom:`.
- Separation of concerns : la tray manipule l'état runtime (selected/active) mais ne persiste pas automatiquement les changements utilisateur dans `config.json` (par défaut). Cette séparation facilite les actions immédiates sans altérer la configuration persistée.
- Mise à jour visuelle fiable : combinaison `update-menu` + `update-item` pour assurer que `enabled`/`checked` soient reflétés correctement.

---

## Ce qui reste à faire (Phase 2 & 3)

Priorité élevée
1. Propagation complète des prompts actifs vers `AudioProcessor` (Phase 2) — 1.5h
   - Description : faire en sorte que, lors de la transcription, l'AudioProcessor récupère les prompts des personalities actives et les envoie correctement au formatter / backend.
   - Acceptation : tests d'intégration qui simulent une transcription avec plusieurs personalities actives et vérifient que le prompt envoyé contient la concaténation / composition attendue.
   - Risques : gestion du modèle de composition (ordre, conflit entre prompts), taille du prompt (trim si trop grand).

2. Tests d'intégration / E2E pour menu → transcription (Phase 2) — 1h
   - Description : tests qui couvrent : changement de personality dans la tray → déclenchement d'une transcription → vérification que le formatter reçoit la bonne instruction.
   - Acceptation : CI vert, couverture minimale pour le flux critique.

Priorité moyenne
3. Option "Save as default" / Persistance (Phase 3) — 1h
   - Description : ajouter une action dans le menu (ou checkbox longue-pression) pour enregistrer l'état runtime (selected/active) dans `config.json` (persistant). Nécessite UI pour confirmation et mise à jour de `Config.save()`.
   - Acceptation : lors de la sélection "save", `config.json` est mis à jour et une relance de l'app reflète le nouvel état.
   - Considérations : demander confirmation à l'utilisateur pour éviter persistance involontaire.

4. UX polish & tooltips (Phase 3) — 0.5h
   - Description : clarifier libellés, tooltips, séparation visuelle, ordre par défaut.
   - Acceptation : revue UX rapide et corrections mineures.

5. Cross-platform testing and packaging checks — 0.5h
   - Description : vérifier le comportement `node-systray-v2`/tray sur Linux/Mac/Windows (packaging via electron/tauri ou binaire) ; s'assurer que `copyDir` / icones fonctionnent.
   - Acceptation : smoke tests sur OS disponibles à portée.

Total estimé restant : ≈ 3.0 h

---

## Tâches techniques détaillées et checklist

- [x] Phase 1: Menu + routing + tests unitaires
- [ ] Phase 2.1: Implémenter propagation des prompts vers `AudioProcessor` (intégration runtime)
  - [ ] Ajouter API dans SystemTrayService pour exposer l'état runtime (getActivePersonalities/getSelectedPersonalities)
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

- Prompt trop long : ajouter logique de truncation ou priorisation des personalities (ex: garder N premier prompts ou concat avec separators).
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
public getRuntimeState() {
  return {
    selectedPersonalities: this.selectedPersonalities.slice(),
    activePersonalities: this.activePersonalities.slice(),
  };
}
```

- Utiliser depuis `AudioProcessor` :

```ts
const { activePersonalities } = systemTrayService.getRuntimeState();
const prompts = activePersonalities.map(id => config.getPromptFor(id));
const compositePrompt = prompts.join('\n\n---\n\n');
```

---

## Notes additionnelles

- Les tests actuels couvrent les cas unitaires abordés pendant la phase 1 ; l'ajout d'un test d'intégration permettra de valider l'orchestration complète.
- Garder la logique de persistence optionnelle évite d'écraser la configuration de l'utilisateur sans confirmation.

---

## Prochaine action suggérée

Souhaitez-vous que j'implémente immédiatement la Phase 2 (propagation des prompts + tests d'intégration) ?
- Si oui, je peux :
  1. ajouter une petite API `getRuntimeState()` dans `SystemTrayService` et l'exposer pour tests ;
  2. adapter `AudioProcessor` pour accepter prompts multiples (ou un prompt composite) et écrire tests unitaires/integration minimalistes ;
  3. lancer la suite de tests et corriger les régressions.

Indiquez quelle option vous préférez (implémentation immédiate / planifier / autre) et je m'en charge.
