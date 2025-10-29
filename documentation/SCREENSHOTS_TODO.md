# Screenshots à Créer

Liste concise des captures d'écran nécessaires pour compléter la documentation.

## 📁 Emplacement des fichiers
Tous les screenshots doivent être placés dans: `assets/screenshots/`

## 📸 Liste des Captures Nécessaires

### System Tray Icons (États)
1. **tray-idle.png**
   - Description: Icône verte (état idle) dans la barre système
   - Contexte: Application prête à enregistrer
   - Utilisé dans: quickstart.md, basic-usage.md

2. **tray-recording.png**
   - Description: Icône rouge (état recording) dans la barre système
   - Contexte: Enregistrement en cours
   - Utilisé dans: quickstart.md, basic-usage.md

3. **tray-processing.png**
   - Description: Icône violette/sablier (état processing) dans la barre système
   - Contexte: Transcription en cours
   - Utilisé dans: quickstart.md, basic-usage.md

### System Tray Menu
4. **tray-menu.png**
   - Description: Menu contextuel complet (clic droit sur l'icône)
   - Contenu: Start Recording, Stop Recording, Personalities, Save as Default, Open Config, Reload Config, Exit
   - Utilisé dans: basic-usage.md

5. **multiple-personalities.png**
   - Description: Menu montrant plusieurs personalities cochées
   - Exemple: ☑ Professional, ☑ Emojify, ☐ Default
   - Utilisé dans: formatting-personalities.md

6. **save-as-default.png**
   - Description: Après avoir cliqué "💾 Save as Default" avec confirmation visuelle
   - Contexte: Sauvegarde des préférences utilisateur
   - Utilisé dans: configuration.md

### Configuration & Setup
7. **first-run-wizard.png**
   - Description: Wizard de configuration au premier lancement
   - Contenu: Prompt pour entrer l'API key OpenAI
   - Utilisé dans: first-run.md

8. **gnome-appindicator.png**
   - Description: Installation de l'extension AppIndicator dans Gnome Extensions
   - Contexte: Solution pour système tray sous Gnome
   - Utilisé dans: quickstart.md, troubleshooting.md

### Backends & Advanced Features
9. **speaches-setup.png**
   - Description: Docker container Speaches en cours d'exécution
   - Contenu: `docker ps` montrant le conteneur healthy, ou interface web Speaches
   - Utilisé dans: speaches-integration.md

10. **debug-output.png**
    - Description: Console avec output debug détaillé
    - Contenu: Logs montrant configuration loading, recording start/stop, API responses
    - Utilisé dans: troubleshooting.md

## 📝 Notes de Capture

### Format
- **Format**: PNG (compression optimale pour screenshots)
- **Résolution**: Suffisante pour être lisible (pas besoin de 4K)
- **Taille**: Garder < 500KB par image si possible

### Conseils
- **Captures claires**: Éviter le blur, utiliser des outils comme `gnome-screenshot` ou `flameshot`
- **Contexte visible**: Montrer assez de contexte pour que l'utilisateur comprenne où regarder
- **Annotations**: Possibilité d'ajouter des flèches ou surlignages pour guider l'œil
- **Mode sombre/clair**: Privilégier le mode qui contraste le mieux (généralement mode clair pour docs)

### Commandes Utiles
```bash
# Gnome Screenshot (sélection zone)
gnome-screenshot -a -f assets/screenshots/filename.png

# Flameshot (avec annotations)
flameshot gui

# Import (ImageMagick - fenêtre spécifique)
import assets/screenshots/filename.png
```

## ✅ Checklist de Complétion
- [ ] tray-idle.png
- [ ] tray-recording.png
- [ ] tray-processing.png
- [ ] tray-menu.png
- [ ] multiple-personalities.png
- [ ] save-as-default.png
- [ ] first-run-wizard.png
- [ ] gnome-appindicator.png
- [ ] speaches-setup.png
- [ ] debug-output.png

**Total**: 10 screenshots nécessaires