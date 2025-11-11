# Task 2 - Examples: Save as Default & Reload Change Detection

Guide pratique avec exemples concrets d'utilisation de la fonctionnalité "Save as Default".

---

## 🎯 Exemples d'Utilisation

### Exemple 1 : Sauvegarder mes personnalités préférées

**Contexte** : Je veux toujours avoir "Professional" et "Emojify" actifs au démarrage.

**Étapes** :
1. Lancer l'application :
   ```bash
   bun start
   ```

2. Via le menu system tray :
   - ☑️ Cocher "Professional"
   - ☑️ Cocher "Emojify"  
   - ☐ Décocher les autres

3. Cliquer sur "💾 Save as Default"

4. Vérifier les logs :
   ```
   [INFO] ✅ Configuration saved to file successfully
   [INFO] Active personalities saved: builtin:professional, builtin:emojify
   ```

5. Redémarrer l'application → "Professional" et "Emojify" sont toujours actifs ✅

---

### Exemple 2 : Tester différentes combinaisons

**Contexte** : Je veux expérimenter avec différentes personnalités avant de sauvegarder.

**Workflow** :

```bash
# 1. Tester une combinaison
# Via menu : Default + Technical
# Faire une transcription test

# 2. Tester une autre combinaison  
# Via menu : Professional + Emojify
# Faire une transcription test

# 3. Garder la meilleure
# Cliquer "💾 Save as Default"
```

**Avantage** : Possibilité d'expérimenter sans affecter la config persistée.

---

### Exemple 3 : Configuration avancée avec personnalité custom

**Contexte** : J'ai créé une personnalité custom et je veux la sauvegarder comme défaut.

**Étape 1** : Créer une personnalité custom dans `config.json`

```json
{
  "customPersonalities": {
    "technical-fr": {
      "name": "Technical FR",
      "description": "Documentation technique en français",
      "prompt": "Formate en style documentation technique française. Utilise un vocabulaire précis et professionnel. Ne traduis pas le texte, garde-le dans sa langue d'origine."
    }
  },
  "selectedPersonalities": [
    "builtin:default",
    "builtin:professional",
    "custom:technical-fr"
  ]
}
```

**Étape 2** : Reload la configuration
```bash
# Via menu : 🔄 Reload Config
```

**Étape 3** : Activer via le menu
- ☑️ "Technical FR" (apparaît maintenant dans le menu)

**Étape 4** : Sauvegarder
```bash
# Via menu : 💾 Save as Default
```

**Résultat** : La personnalité custom est maintenant active par défaut ✅

---

## 🔄 Exemples de Détection de Changements

### Exemple 1 : Changement de langue

**Avant** :
```json
{
  "language": "en",
  "activePersonalities": ["builtin:default"]
}
```

**Modification manuelle** :
```json
{
  "language": "fr",
  "activePersonalities": ["builtin:default"]
}
```

**Reload avec mode debug** (`bun start -d`) :
```
[INFO] Reloading configuration...
[DEBUG] 🔄 Configuration changes detected:
[DEBUG]   └─ Language: en → fr
[INFO] ✅ Configuration reloaded successfully
```

---

### Exemple 2 : Ajout de personnalité custom

**Avant** :
```json
{
  "customPersonalities": {}
}
```

**Modification** :
```json
{
  "customPersonalities": {
    "casual-fr": {
      "name": "Casual FR",
      "prompt": "Style décontracté en français"
    }
  }
}
```

**Reload (debug)** :
```
[DEBUG] 🔄 Configuration changes detected:
[DEBUG]   └─ Custom personalities added: casual-fr
```

---

### Exemple 3 : Changements multiples

**Avant** :
```json
{
  "language": "en",
  "transcription": {
    "backend": "openai"
  },
  "activePersonalities": ["builtin:default"]
}
```

**Après** :
```json
{
  "language": "fr",
  "transcription": {
    "backend": "speaches"
  },
  "activePersonalities": ["builtin:professional", "builtin:emojify"]
}
```

**Reload (debug)** :
```
[DEBUG] 🔄 Configuration changes detected:
[DEBUG]   └─ Transcription backend: openai → speaches
[DEBUG]   └─ Language: en → fr
[DEBUG]   └─ Active personalities: builtin:default → builtin:professional, builtin:emojify
```

---

## 📋 Workflows Recommandés

### Workflow 1 : Development/Testing

**Objectif** : Tester différentes configs sans casser la config stable.

```bash
# 1. Sauvegarder la config actuelle (backup manuel)
cp ~/.config/voice-transcriber/config.json ~/.config/voice-transcriber/config.backup.json

# 2. Tester via le menu system tray
# Activer/désactiver personnalités
# PAS de Save as Default

# 3. Si satisfait, sauvegarder
# Via menu : 💾 Save as Default

# 4. Sinon, restaurer le backup
cp ~/.config/voice-transcriber/config.backup.json ~/.config/voice-transcriber/config.json
# Via menu : 🔄 Reload Config
```

---

### Workflow 2 : Configuration par Projet

**Objectif** : Différentes configs selon le type de travail.

**Setup** :
```bash
# Config 1 : Code reviews (Professional + Technical)
# Via menu : Activer Professional, Technical
# Via menu : 💾 Save as Default
cp ~/.config/voice-transcriber/config.json ~/configs/code-review.json

# Config 2 : Documentation (Default + Emojify)
# Via menu : Activer Default, Emojify
# Via menu : 💾 Save as Default
cp ~/.config/voice-transcriber/config.json ~/configs/docs.json

# Config 3 : Casual (Creative)
# Via menu : Activer Creative uniquement
# Via menu : 💾 Save as Default
cp ~/.config/voice-transcriber/config.json ~/configs/casual.json
```

**Utilisation** :
```bash
# Charger config code review
cp ~/configs/code-review.json ~/.config/voice-transcriber/config.json
# Via menu : 🔄 Reload Config

# Charger config docs
cp ~/configs/docs.json ~/.config/voice-transcriber/config.json
# Via menu : 🔄 Reload Config
```

---

### Workflow 3 : Synchronisation Multi-Machine

**Objectif** : Même config sur plusieurs machines.

```bash
# Machine A : Configurer et sauvegarder
# Via menu : Configuration des personnalités
# Via menu : 💾 Save as Default

# Copier vers repo Git privé
cp ~/.config/voice-transcriber/config.json ~/my-dotfiles/voice-transcriber/
cd ~/my-dotfiles && git add . && git commit -m "Update voice transcriber config" && git push

# Machine B : Récupérer la config
cd ~/my-dotfiles && git pull
cp ~/my-dotfiles/voice-transcriber/config.json ~/.config/voice-transcriber/
# Via menu : 🔄 Reload Config
```

**Logs sur Machine B** :
```
[DEBUG] 🔄 Configuration changes detected:
[DEBUG]   └─ Active personalities: builtin:default → builtin:professional, builtin:technical
[DEBUG]   └─ Custom personalities added: my-custom-style
```

---

## ⚙️ Configurations Recommandées

### Config 1 : Utilisateur Basique

**Objectif** : Simplicité, un seul style.

```json
{
  "language": "en",
  "activePersonalities": ["builtin:default"],
  "selectedPersonalities": [
    "builtin:default",
    "builtin:professional"
  ]
}
```

**Avantage** : Menu court, pas de confusion.

---

### Config 2 : Power User

**Objectif** : Maximum de flexibilité.

```json
{
  "language": "en",
  "activePersonalities": ["builtin:professional", "builtin:technical"],
  "selectedPersonalities": [
    "builtin:default",
    "builtin:professional",
    "builtin:technical",
    "builtin:creative",
    "builtin:emojify"
  ],
  "customPersonalities": {
    "code-review": {
      "name": "Code Review",
      "prompt": "Format for code review comments. Be concise and constructive."
    },
    "meeting-notes": {
      "name": "Meeting Notes",
      "prompt": "Format as structured meeting notes with action items."
    }
  },
  "maxPromptLength": 6000
}
```

**Avantage** : 7 personnalités disponibles, 2 actives par défaut.

---

### Config 3 : Multi-langue

**Objectif** : Travail en plusieurs langues.

```json
{
  "language": "fr",
  "activePersonalities": ["builtin:professional"],
  "customPersonalities": {
    "professional-fr": {
      "name": "Pro FR",
      "description": "Style professionnel adapté au français",
      "prompt": "Formate en style professionnel français. Utilise le vouvoiement. Structure claire avec ponctuation correcte. Ne traduis pas le texte."
    },
    "casual-fr": {
      "name": "Casual FR",
      "prompt": "Style décontracté français. Tutoiement OK. Garde le naturel."
    }
  },
  "selectedPersonalities": [
    "builtin:professional",
    "custom:professional-fr",
    "custom:casual-fr"
  ]
}
```

**Usage** :
- Transcription EN → builtin:professional
- Transcription FR → custom:professional-fr

---

## 🧪 Tests et Vérification

### Test 1 : Vérifier que Save fonctionne

```bash
# 1. Lancer avec config propre
bun start

# 2. Activer une personnalité via menu
# ☑️ Professional

# 3. Save
# Via menu : 💾 Save as Default

# 4. Vérifier le fichier
cat ~/.config/voice-transcriber/config.json | grep activePersonalities
# Devrait afficher : "activePersonalities": ["builtin:professional"]

# 5. Redémarrer
# Professional devrait être coché ✅
```

---

### Test 2 : Vérifier la détection de changements

```bash
# 1. Lancer en mode debug
bun start -d

# 2. Noter config actuelle
# Exemple : activePersonalities: ["builtin:default"]

# 3. Modifier manuellement
nano ~/.config/voice-transcriber/config.json
# Changer en : "activePersonalities": ["builtin:emojify"]

# 4. Reload
# Via menu : 🔄 Reload Config

# 5. Vérifier les logs
# [DEBUG] └─ Active personalities: builtin:default → builtin:emojify ✅
```

---

## 💡 Astuces et Bonnes Pratiques

### Astuce 1 : Backup automatique avant Save

Créer un script wrapper :

```bash
#!/bin/bash
# ~/bin/voice-transcriber-safe

CONFIG=~/.config/voice-transcriber/config.json
BACKUP=~/.config/voice-transcriber/config.backup.json

# Backup avant chaque lancement
cp "$CONFIG" "$BACKUP"

# Lancer l'app
cd ~/voice-transcriber && bun start

# Optionnel : Restaurer en cas de problème
# cp "$BACKUP" "$CONFIG"
```

---

### Astuce 2 : Versioning de la config

```bash
# Après chaque Save as Default, commit
cp ~/.config/voice-transcriber/config.json ~/my-configs/voice-transcriber/config.json
cd ~/my-configs
git add .
git commit -m "voice-transcriber: updated active personalities"

# Historique disponible avec git log
```

---

### Astuce 3 : Mode debug par défaut

Ajouter un alias dans `~/.zshrc` ou `~/.bashrc` :

```bash
alias vt-debug='cd ~/voice-transcriber && bun start -d'
```

Permet de toujours voir les changements détectés.

---

## ❓ FAQ

### Q: Que se passe-t-il si je sauvegarde avec 0 personnalités actives ?

**R** : C'est valide ! Le formatter sera désactivé.

```json
{
  "activePersonalities": []
}
```

Logs :
```
[INFO] Active personalities saved: none
```

---

### Q: Est-ce que Save modifie d'autres paramètres ?

**R** : Oui, Save sauvegarde **toute** la config, pas seulement les personnalités. C'est intentionnel pour la cohérence.

---

### Q: Puis-je annuler un Save ?

**R** : Pas directement. Solutions :
1. Modifier manuellement `config.json` puis Reload
2. Restaurer depuis backup si vous en avez un
3. `git checkout` si config est versionné

---

### Q: Les logs de détection s'affichent toujours ?

**R** : Non, uniquement en mode debug (`bun start -d`). En mode normal, seuls les logs INFO sont affichés.

---

## 📊 Comparaison Avant/Après

### AVANT (sans Save as Default)

**Pour sauvegarder préférences** :
1. Ouvrir éditeur de texte
2. Naviguer vers `~/.config/voice-transcriber/config.json`
3. Éditer JSON manuellement
4. Sauvegarder
5. Reload via menu

**Risques** :
- Syntaxe JSON invalide
- Oubli de virgules
- Écrasement d'autres paramètres

---

### APRÈS (avec Save as Default)

**Pour sauvegarder préférences** :
1. Ajuster via menu system tray
2. Cliquer "💾 Save as Default"

**Avantages** :
- ✅ 1 clic au lieu de 5 étapes
- ✅ Pas d'erreur de syntaxe possible
- ✅ Sauvegarde complète garantie
- ✅ Logs de confirmation

---

**Date** : 2025-10-29  
**Version** : 1.0

**Voir aussi** :
- [TASK_2_SUMMARY.md](TASK_2_SUMMARY.md) - Résumé technique
- [TASK_2_INDEX.md](TASK_2_INDEX.md) - Navigation complète

