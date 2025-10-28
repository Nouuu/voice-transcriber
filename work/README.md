# Work Directory - Quick Actions Menu Feature

Ce dossier contient les fichiers de travail pour la feature "Quick Actions Menu".

---

## ⚠️ IMPORTANT - À LIRE EN PREMIER

### 📋 DIRECTIVES_QUALITE.md

**LIRE OBLIGATOIREMENT avant de commencer toute tâche.**

Ce document contient :
- ✅ Principes fondamentaux (zéro hallucination, zéro régression)
- ✅ Checklist obligatoire par modification
- ✅ Interdictions strictes
- ✅ Bonnes pratiques code & tests
- ✅ Workflow recommandé
- ✅ Commandes de validation

**🔴 RÈGLE D'OR** : Qualité > Vitesse | Simple > Complexe | Testé > Non testé

---

## Fichiers principaux

### 📋 QUICK_ACTIONS_MENU.md
Document principal de suivi de la feature. Contient :
- Résumé de l'avancement
- Décisions d'architecture
- Historique des phases complétées
- État actuel

### 🎯 Tâches en cours (Phase 2-3)

Les tâches suivantes doivent être exécutées **dans l'ordre** :

1. **TASK_1_PROMPT_CONCATENATION.md** (30-60 min)
   - Gestion des prompts longs avec truncation intelligente
   - Protection contre dépassement de limites LLM
   - Fichiers : `config.ts`, `formatter.ts`, `audio-processor.ts`

2. **TASK_2_SAVE_AS_DEFAULT.md** (1h)
   - Ajout option "Save Personalities as Default"
   - Persistance de l'état runtime dans config.json
   - Fichiers : `system-tray.ts`, `config.ts`

3. **TASK_3_UX_POLISH_DOCS.md** (30 min)
   - Amélioration UX du menu (labels, séparateurs, icônes)
   - Mise à jour documentation utilisateur
   - Fichiers : `system-tray.ts`, `README.md`, `documentation/**`

## Utilisation

Chaque fichier de tâche contient :
- ✅ **Objectif** : description claire
- ✅ **Implémentation** : pseudo-code et fichiers à modifier
- ✅ **Critères d'acceptation** : checklist de validation
- ✅ **Checklist d'exécution** : étapes détaillées

## Progression

- ✅ Phase 1 : Menu dynamique + routing + tests (TERMINÉ)
- ✅ Phase 2 minimale : Propagation runtime state + logging amélioré (TERMINÉ)
- 🚧 Phase 2-3 : 4 tâches restantes (EN COURS)

## Estimation totale restante

**~2h-2h30** (30-60 min + 1h + 30 min)

---

**Dernière mise à jour** : 2025-10-28
# Tâche 1 : Gestion des prompts longs / Concatenation

**Date**: 2025-10-28
**Priorité**: Haute
**Estimation**: 30-60 min
**Status**: 🚧 À faire

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

