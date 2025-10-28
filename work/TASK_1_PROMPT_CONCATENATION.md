# Tâche 1 : Gestion des prompts longs / Concatenation

**Date**: 2025-10-28
**Priorité**: Haute
**Estimation**: 30-60 min
**Status**: 🚧 À faire

---

## ⚠️ DIRECTIVES QUALITÉ - À LIRE AVANT DE COMMENCER

**📖 Lire d'abord** : `work/DIRECTIVES_QUALITE.md` pour les règles générales

### Règles spécifiques pour cette tâche

1. **NE PAS halluciner** :
   - ✅ Vérifier que `config.maxPromptLength` existe vraiment
   - ✅ Vérifier la signature exacte de `FormatterService.getPersonalityPrompt()`
   - ✅ Lire `src/services/formatter.ts` EN ENTIER avant de modifier

2. **ZÉRO régression** :
   - ✅ Tous les tests `formatter.test.ts` existants DOIVENT passer
   - ✅ Tous les tests `audio-processor.test.ts` existants DOIVENT passer
   - ✅ Exécuter `bun test` après CHAQUE modification

3. **Code MINIMAL** :
   - ❌ Pas de refactoring de FormatterService non demandé
   - ❌ Pas de modification de la logique existante de formatage
   - ✅ Ajouter UNIQUEMENT la méthode `buildCompositePrompt()`
   - ✅ Modifier AudioProcessor pour utiliser cette nouvelle méthode

4. **Tests OBLIGATOIRES** :
   - ✅ Test : 1 personality (cas nominal)
   - ✅ Test : plusieurs personalities sous la limite
   - ✅ Test : truncation quand dépassement
   - ✅ Test : array vide
   - ✅ Test : personalities avec prompts vides
   - ✅ Vérifier que le warning est loggé lors de truncation

5. **Validation systématique** :
   ```bash
   bun test                    # DOIT être 100% ✅
   make lint                   # DOIT être 0 errors
   bun run src/index.ts --help # DOIT démarrer sans erreur
   ```

### Risques à éviter

- ❌ Modifier `FormatterService.formatText()` existant
- ❌ Changer la structure de `config.json` sans migration
- ❌ Ajouter des dépendances externes non nécessaires
- ❌ Over-engineer avec de la priorisation complexe (YAGNI)

### Approche recommandée

1. Lire `src/config/config.ts` - chercher où ajouter `maxPromptLength`
2. Lire `src/services/formatter.ts` - comprendre la structure existante
3. Lire `src/services/audio-processor.ts` - voir comment formatter est appelé
4. Implémenter la solution la PLUS SIMPLE qui fonctionne
5. Tester exhaustivement
6. Commit atomique avec message clair

---

## Objectif

Implémenter une stratégie robuste pour gérer la concaténation de plusieurs prompts de personalities actives, avec protection contre les prompts trop longs.

## Problématique

Actuellement, lorsque plusieurs personalities sont actives, leurs prompts pourraient être concaténés sans limite de taille, ce qui pourrait :
- Dépasser les limites de tokens des LLM backends
- Ralentir les requêtes
- Générer des coûts excessifs
- Causer des erreurs avec certains services

## Solution proposée

### Option 1 : Limite stricte avec truncation intelligente (RECOMMANDÉ)
- Définir une limite max (ex: 4000 caractères)
- Concaténer les prompts avec séparateurs
- Si dépassement : tronquer en gardant les N premières personalities
- Logger un warning si truncation appliquée

### Option 2 : Priorisation explicite
- Permettre à l'utilisateur de définir un ordre de priorité
- Appliquer les prompts par ordre de priorité jusqu'à limite

### Option 3 : Limite configurable avec erreur
- Rejeter la transcription si total > limite
- Demander à l'utilisateur de désactiver des personalities

**Décision** : Option 1 (simple, sûr, transparent)

---

## Implémentation

### Fichiers à modifier

1. **`src/config/config.ts`**
   - Ajouter `maxPromptLength: number` (default: 4000)
   - Ajouter au schema de validation

2. **`src/services/formatter.ts`**
   - Créer méthode `buildCompositePrompt(personalities: string[]): string`
   - Logique de concaténation avec séparateurs
   - Logique de truncation si dépassement
   - Logging approprié

3. **`src/services/audio-processor.ts`**
   - Utiliser `buildCompositePrompt()` au lieu de concat simple
   - Passer le prompt composite au formatter

4. **Tests**
   - `src/services/formatter.test.ts` : tester buildCompositePrompt
     - Cas nominal (1 personality)
     - Cas multiple personalities (< limite)
     - Cas truncation (> limite)
     - Cas personalities vides

---

## Pseudo-code

```typescript
// Dans FormatterService
public buildCompositePrompt(personalities: string[]): string {
  const maxLength = this.config.maxPromptLength;
  const separator = '\n\n---\n\n';
  
  const prompts: string[] = [];
  let totalLength = 0;
  
  for (const personality of personalities) {
    const prompt = this.getPersonalityPrompt(personality);
    const lengthWithSep = prompt.length + (prompts.length > 0 ? separator.length : 0);
    
    if (totalLength + lengthWithSep > maxLength) {
      logger.warn(`Prompt length limit reached (${maxLength} chars). Truncating personalities. Applied: ${prompts.length}/${personalities.length}`);
      break;
    }
    
    prompts.push(prompt);
    totalLength += lengthWithSep;
  }
  
  return prompts.join(separator);
}
```

---

## Critères d'acceptation

- [ ] Config contient `maxPromptLength` avec valeur par défaut
- [ ] `buildCompositePrompt()` implémentée et testée
- [ ] Truncation fonctionne correctement (tests unitaires)
- [ ] Warning loggé quand truncation appliquée
- [ ] AudioProcessor utilise la nouvelle méthode
- [ ] Tests passent : `bun test`
- [ ] Lint passe : `make lint`

---

## Notes

- Séparateur visible `\n\n---\n\n` pour délimiter clairement les prompts
- La truncation garde les PREMIÈRES personalities (ordre d'activation)
- Alternative future : permettre réordonnancement manuel des personalities

---

## Checklist d'exécution

1. [ ] Modifier `src/config/config.ts` - ajouter `maxPromptLength`
2. [ ] Modifier `src/services/formatter.ts` - implémenter `buildCompositePrompt()`
3. [ ] Modifier `src/services/audio-processor.ts` - utiliser nouvelle méthode
4. [ ] Créer tests dans `src/services/formatter.test.ts`
5. [ ] Exécuter `bun test` et corriger erreurs
6. [ ] Exécuter `make lint` et corriger warnings
7. [ ] Commit avec message descriptif

