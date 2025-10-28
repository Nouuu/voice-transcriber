# Tâche 2 : Option "Save as Default" / Persistance

**Date**: 2025-10-28
**Priorité**: Moyenne
**Estimation**: 1h
**Status**: 🚧 À faire

---

## ⚠️ DIRECTIVES QUALITÉ - À LIRE AVANT DE COMMENCER

**📖 Lire d'abord** : `work/DIRECTIVES_QUALITE.md` pour les règles générales

### Règles spécifiques pour cette tâche

1. **NE PAS halluciner** :
   - ✅ Vérifier la structure exacte du menu dans `SystemTrayService.buildMenuItems()`
   - ✅ Vérifier comment les clics sont routés (seq_id pattern)
   - ✅ Vérifier que `Config.save()` existe et fonctionne
   - ✅ Lire les fichiers complets AVANT de modifier

2. **ZÉRO régression** :
   - ✅ Le toggle de personalities existant DOIT continuer à fonctionner
   - ✅ Reload config DOIT continuer à fonctionner
   - ✅ Tous les tests system-tray.test.ts existants DOIVENT passer
   - ✅ Aucune modification de config.json non demandée

3. **Code MINIMAL** :
   - ❌ Pas de dialog/notification complexe (MVP = simple log)
   - ❌ Pas de refactoring de SystemTrayService
   - ✅ Ajouter UNIQUEMENT le menu item + callback
   - ✅ Ajouter UNIQUEMENT la méthode `savePersonalitiesState()` dans Config

4. **Tests OBLIGATOIRES** :
   - ✅ Test : `savePersonalitiesState()` met à jour les bonnes propriétés
   - ✅ Test : click sur "Save as Default" appelle la bonne méthode
   - ✅ Test d'intégration : save → quit → reload → verify state
   - ✅ Test : gestion des erreurs IO lors du save

5. **Validation systématique** :
   ```bash
   bun test                    # DOIT être 100% ✅
   make lint                   # DOIT être 0 errors
   # Test manuel :
   # 1. Toggle personality
   # 2. Click "Save as Default"
   # 3. Quit app
   # 4. Restart app
   # 5. Vérifier que la personality est toujours active
   ```

### Risques à éviter

- ❌ Écraser involontairement d'autres champs de config.json
- ❌ Save qui échoue silencieusement (permissions, disk full)
- ❌ État runtime non synchronisé avec config
- ❌ Over-design avec confirmation dialog (pas nécessaire pour MVP)

### Approche recommandée

1. Lire `src/services/system-tray.ts` - comprendre buildMenuItems et routing
2. Lire `src/config/config.ts` - voir comment save() fonctionne
3. Ajouter le menu item avec bon seq_id
4. Implémenter callback simple (getRuntimeState → savePersonalitiesState → save)
5. Tester le cycle complet manuellement
6. Écrire tests automatisés
7. Commit atomique

---

## Objectif

Permettre à l'utilisateur de persister l'état actuel des personalities (selected/active) dans `config.json` pour qu'il soit restauré au prochain démarrage de l'application.

## Problématique actuelle

- Les toggles de personalities sont **runtime-only**
- À chaque redémarrage, l'app revient à l'état défini dans `config.json`
- Pas de moyen simple de "sauvegarder mes préférences actuelles"

## Solution proposée

Ajouter une action dans le menu système : **"Save Personalities as Default"**

Cette action :
1. Lit l'état runtime actuel (via `getRuntimeState()`)
2. Met à jour la config en mémoire
3. Sauvegarde dans `config.json`
4. Affiche une notification de confirmation (optionnel)

---

## Implémentation

### Fichiers à modifier

1. **`src/services/system-tray.ts`**
   - Ajouter nouvel item dans le menu : "Save Personalities as Default"
   - Ajouter callback `handleSaveAsDefault()`
   - Appeler `config.savePersonalitiesState()` puis `config.save()`

2. **`src/config/config.ts`**
   - Créer méthode `savePersonalitiesState(selected: string[], active: string[]): void`
   - Met à jour `selectedPersonalities` et `activePersonalities`
   - Optionnel : méthode de validation avant save

3. **`src/index.ts`**
   - Passer référence de `config` au `SystemTrayService` si pas déjà fait
   - Ou créer méthode dans `VoiceTranscriberApp` pour orchestrer

4. **Tests**
   - `src/services/system-tray.test.ts` : tester le routing vers save
   - `src/config/config.test.ts` : tester `savePersonalitiesState()`
   - Test d'intégration : vérifier que click → save → reload config = état persisté

---

## Design du menu

```
┌─────────────────────────────────┐
│ ● Start Recording             │
│ ───────────────────────────── │
│ Personalities ▸                │
│   ├─ ☑ Professional           │
│   ├─ ☐ Creative               │
│   └─ ☐ Custom: Email Style    │
│ ───────────────────────────── │
│ 💾 Save Personalities as Default│ ← NOUVEAU
│ ───────────────────────────── │
│ Open Config Folder             │
│ Reload Config                  │
│ Quit                           │
└─────────────────────────────────┘
```

---

## Pseudo-code

```typescript
// Dans SystemTrayService
private handleSaveAsDefault(): void {
  const { selectedPersonalities, activePersonalities } = this.getRuntimeState();
  
  // Option : demander confirmation (dialog ou log)
  logger.info('Saving current personalities state as default...');
  
  // Mettre à jour config
  this.config.savePersonalitiesState(selectedPersonalities, activePersonalities);
  
  // Persister sur disque
  this.config.save();
  
  logger.info('✅ Personalities saved as default');
  
  // Optionnel : afficher notification système
  // this.showNotification('Settings saved', 'Personality preferences saved successfully');
}

// Dans Config
public savePersonalitiesState(selected: string[], active: string[]): void {
  this.selectedPersonalities = [...selected];
  this.activePersonalities = [...active];
  // Note: ne pas appeler save() ici, laisser le caller décider
}
```

---

## UX Considerations

### Option A : Save immédiat (RECOMMANDÉ pour MVP)
- Clic → sauvegarde immédiate
- Log de confirmation
- Simple, direct

### Option B : Confirmation dialog
- Clic → afficher dialog natif "Sauvegarder l'état actuel ?"
- Boutons : OK / Cancel
- Plus safe mais complexe (nécessite dialog cross-platform)

**Décision** : Option A pour MVP, Option B pour future enhancement

---

## Critères d'acceptation

- [ ] Item "Save Personalities as Default" dans le menu
- [ ] Click sur l'item sauvegarde l'état runtime dans config.json
- [ ] Redémarrage de l'app restaure l'état sauvegardé
- [ ] Tests unitaires pour `savePersonalitiesState()`
- [ ] Tests d'intégration pour le flow complet
- [ ] Logging approprié (info au save, pas d'erreur silencieuse)
- [ ] `bun test` passe
- [ ] `make lint` passe

---

## Risques et mitigations

**Risque** : Écrasement involontaire de la config
- **Mitigation** : Logger clairement l'action, documenter dans README

**Risque** : Erreur lors du save (permissions, disk full)
- **Mitigation** : Catch errors, logger, informer l'utilisateur

**Risque** : État invalide sauvegardé (personalities inexistantes)
- **Mitigation** : Valider avant save, filtrer les IDs inconnus

---

## Checklist d'exécution

1. [ ] Modifier `src/config/config.ts` - ajouter `savePersonalitiesState()`
2. [ ] Modifier `src/services/system-tray.ts` - ajouter menu item + callback
3. [ ] Tester manuellement : toggle personalities → save → quit → restart → vérifier état
4. [ ] Créer tests unitaires dans `config.test.ts`
5. [ ] Créer tests dans `system-tray.test.ts`
6. [ ] Exécuter `bun test` et corriger
7. [ ] Exécuter `make lint` et corriger
8. [ ] Documenter dans README (section Usage)
9. [ ] Commit avec message descriptif

---

## Documentation à ajouter (README)

```markdown
### Saving Personality Preferences

By default, personality toggles are temporary (runtime-only). To save your current selection as the default:

1. Toggle personalities in the system tray menu
2. Click "Save Personalities as Default"
3. Your preferences will be restored on next app launch

**Note**: This overwrites the `selectedPersonalities` and `activePersonalities` in your `config.json`.
```

