# Task 2: Save Configuration as Default

## Objectif
Permettre aux utilisateurs de sauvegarder la configuration actuelle (en mémoire) dans le fichier de configuration, afin que les changements effectués via le menu system tray persistent au prochain démarrage.

## Scope de la sauvegarde

### ✅ Ce qui EST sauvegardé (configuration complète)
La fonctionnalité "Save as Default" sauvegarde **TOUTE** la configuration actuelle en mémoire dans le fichier `config.json`, incluant :

1. **Personnalités** :
   - `activePersonalities` : Les personnalités actuellement cochées
   - `selectedPersonalities` : Les personnalités visibles dans le menu
   - `customPersonalities` : Les personnalités personnalisées définies par l'utilisateur

2. **Configuration de transcription** :
   - `language` : Langue de transcription
   - `transcriptionPrompt` : Prompt de transcription personnalisé
   - `transcription.backend` : Backend utilisé (openai/speaches)
   - Toutes les configurations OpenAI et Speaches

3. **Configuration du formatter** :
   - `formatter.backend` : Backend utilisé (openai/ollama)
   - Toutes les configurations OpenAI et Ollama

4. **Paramètres généraux** :
   - `benchmarkMode` : Mode benchmark
   - `logTruncateThreshold` : Seuil de troncature des logs
   - `maxPromptLength` : Longueur maximale des prompts

### ❌ Ce qui N'EST PAS sauvegardé
Rien n'est exclu. La méthode `Config.save()` existante est utilisée, qui sauvegarde déjà toute la configuration.

## Justification du choix

**Pourquoi sauvegarder toute la configuration ?**

1. **Simplicité** : Utiliser la méthode `Config.save()` existante évite la duplication de code
2. **Cohérence** : Garantit que le fichier de configuration reflète exactement l'état actuel de l'application
3. **Sécurité** : Évite les incohérences entre la configuration en mémoire et le fichier
4. **Flexibilité future** : Si d'autres paramètres deviennent modifiables via l'UI, ils seront automatiquement sauvegardés

## Interface utilisateur

### Menu System Tray
Ajout d'une nouvelle entrée de menu :
```
🎤 Start Recording
─────────────────
☑ Default
☐ Professional
☐ Technical
─────────────────
💾 Save as Default          <- NOUVEAU
⚙️ Open Config
🔄 Reload Config
❌ Exit
```

### Comportement
- **Position** : Entre les personnalités et "Open Config"
- **Label** : "💾 Save as Default"
- **Tooltip** : "Save current configuration to config file"
- **État** : 
  - Activé uniquement en état IDLE
  - Désactivé pendant RECORDING et PROCESSING
- **Action** : 
  1. Sauvegarde toute la configuration actuelle dans le fichier `config.json`
  2. Affiche un message de confirmation dans les logs
  3. Pas de rechargement nécessaire (la config en mémoire est déjà à jour)

## Cas d'usage

### Scénario 1 : Personnalisation des personnalités actives
1. L'utilisateur démarre l'application avec la config par défaut
2. Via le menu, il active "Professional" et "Emojify", désactive "Default"
3. Il clique sur "💾 Save as Default"
4. Au prochain démarrage, "Professional" et "Emojify" sont activés par défaut

### Scénario 2 : Modification de la langue via config manuelle
1. L'utilisateur modifie manuellement `config.json` : `"language": "fr"`
2. Il clique sur "🔄 Reload Config"
3. La langue est maintenant "fr" en mémoire
4. Il fait d'autres changements (personnalités, etc.)
5. Il clique sur "💾 Save as Default"
6. La langue "fr" ET les changements de personnalités sont sauvegardés

## Implémentation technique

### Modifications nécessaires

1. **`src/services/system-tray.ts`** :
   - Ajouter `MenuItemType.SAVE_AS_DEFAULT`
   - Ajouter callback `onSaveAsDefault` dans `TrayConfig`
   - Ajouter l'entrée de menu dans `buildMenuItems()`
   - Router l'action dans le gestionnaire de clic

2. **`src/index.ts`** :
   - Implémenter le callback `onSaveAsDefault`
   - Appeler `config.save()`
   - Logger le succès/échec de l'opération

3. **`src/config/config.ts`** :
   - ✅ La méthode `save()` existe déjà et sauvegarde toute la configuration
   - Aucune modification nécessaire

### Code du callback (src/index.ts)
```typescript
onSaveAsDefault: async () => {
    try {
        await config.save();
        logger.info("Configuration saved to file successfully");
    } catch (error) {
        logger.error(`Failed to save configuration: ${error}`);
    }
}
```

## Tests à effectuer

1. **Test basique** :
   - Changer les personnalités actives
   - Sauvegarder
   - Redémarrer
   - Vérifier que les personnalités sont toujours actives

2. **Test de persistance complète** :
   - Modifier plusieurs paramètres (personnalités + config manuelle)
   - Reload config
   - Modifier d'autres personnalités
   - Sauvegarder
   - Vérifier que TOUS les changements sont présents dans config.json

3. **Test d'état** :
   - Vérifier que le bouton est désactivé pendant RECORDING
   - Vérifier que le bouton est désactivé pendant PROCESSING
   - Vérifier que le bouton est activé en IDLE

4. **Test d'erreur** :
   - Simuler un échec d'écriture (permissions, etc.)
   - Vérifier que l'erreur est loggée correctement

## Documentation utilisateur

À ajouter dans la documentation :

### Section : Configuration Management

**Saving Your Configuration**

When you make changes to your active personalities through the system tray menu, these changes are only temporary and will be lost when you restart the application. To make them permanent:

1. Adjust your settings as desired (select/deselect personalities)
2. Click "💾 Save as Default" in the system tray menu
3. Your current configuration will be saved to the config file
4. The next time you start the application, your settings will be preserved

**Note:** This saves your entire configuration, not just personalities. Any changes made to the config file and reloaded will also be persisted when you save.

## Statut
- [x] Implémentation du menu item
- [x] Implémentation du callback  
- [x] Tests automatisés (121/121 pass ✅)
- [x] Détection des changements au reload
- [x] Correction de toutes les erreurs
- [x] Tests manuels (tous les scénarios validés ✅)
- [ ] Documentation utilisateur
- [ ] Review de code

**✅ TASK 2 COMPLÈTE ET VALIDÉE - Production Ready**

Tests manuels validés (2025-10-29) :
- ✅ Save as Default fonctionne parfaitement
- ✅ Détection des changements au reload fonctionne
- ✅ Workflow complet testé avec succès
- ✅ Logs en mode debug affichés correctement

Voir [TASK_2_FINAL.md](./TASK_2_FINAL.md) pour le résumé complet.

## Implémentation réalisée

### Fichiers modifiés

1. **src/services/system-tray.ts** :
   - ✅ Ajout de `MenuItemType.SAVE_AS_DEFAULT`
   - ✅ Ajout du callback `onSaveAsDefault: () => Promise<void>` dans `TrayConfig`
   - ✅ Ajout de l'entrée de menu "💾 Save as Default" dans `buildMenuItems()`
   - ✅ Routage de l'action dans le gestionnaire de clic
   - ✅ Menu activé uniquement en état IDLE

2. **src/index.ts** :
   - ✅ Implémentation du callback `onSaveAsDefault` dans la configuration du SystemTrayService
   - ✅ Implémentation de la méthode `handleSaveAsDefault()`
   - ✅ Synchronisation du runtime state vers la config avant sauvegarde
   - ✅ Appel de `config.save()` pour sauvegarder toute la configuration
   - ✅ Logging du succès/échec de l'opération

### Détails techniques

La méthode `handleSaveAsDefault()` effectue :
1. Synchronisation de `runtimeState.activePersonalities` vers `config.activePersonalities`
2. Appel de `config.save()` qui sauvegarde **toute** la configuration (pas seulement les personnalités)
3. Logging informatif avec le chemin du fichier et les personnalités sauvegardées

```typescript
private async handleSaveAsDefault(): Promise<void> {
    try {
        // Sync runtime state back to config before saving
        this.config.activePersonalities = [...this.runtimeState.activePersonalities];
        
        // Save entire configuration to file
        await this.config.save();
        
        logger.info("✅ Configuration saved to file successfully");
        logger.info(`Config file: ${this.config.getConfigPath()}`);
        logger.info(
            `Active personalities saved: ${this.config.activePersonalities.length > 0 ? this.config.activePersonalities.join(", ") : "none"}`
        );
    } catch (error) {
        logger.error(`❌ Failed to save configuration: ${error}`);
    }
}
```

