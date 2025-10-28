# 🎯 Directives de Qualité - Quick Actions Menu Feature

**Applicables à TOUTES les tâches de ce sprint**

---

## ⚠️ Principes Fondamentaux

### 1. **ZÉRO HALLUCINATION**
- Ne jamais inventer de fonctions, méthodes ou APIs qui n'existent pas
- Toujours vérifier le code existant AVANT de modifier
- Lire les fichiers concernés en entier pour comprendre le contexte
- Si incertain, DEMANDER plutôt que deviner

### 2. **ZÉRO RÉGRESSION**
- Tous les tests existants DOIVENT continuer à passer
- Ne jamais casser de fonctionnalité existante
- Tester manuellement après chaque modification
- Exécuter `bun test` systématiquement après chaque changement

### 3. **CODE MINIMAL ET SIMPLE**
- Privilégier la simplicité sur la sophistication
- Ne pas sur-engineer (YAGNI - You Ain't Gonna Need It)
- Éviter l'abstraction prématurée
- Code explicite > code clever

### 4. **TESTS OBLIGATOIRES**
- Tout nouveau code DOIT être testé
- Tests unitaires pour la logique métier
- Tests d'intégration pour les flux critiques
- Couverture minimale : 80% sur le nouveau code

### 5. **BONNES PRATIQUES GO/TS**
- Respecter les conventions de nommage TypeScript
- Types explicites, pas de `any` sauf justification
- Gestion d'erreurs complète et explicite
- Logging approprié (pas de console.log dans le code final)

---

## 📋 Checklist OBLIGATOIRE par Modification

### Avant de modifier un fichier

1. [ ] **Lire le fichier complet** pour comprendre sa structure
2. [ ] **Identifier les dépendances** (imports, types utilisés)
3. [ ] **Chercher les tests existants** pour ce fichier
4. [ ] **Comprendre le contexte** (où est appelé ce code ?)

### Pendant la modification

5. [ ] **Modifier le minimum nécessaire** (pas de refactoring non demandé)
6. [ ] **Conserver la structure existante** (pas de réorganisation gratuite)
7. [ ] **Utiliser les patterns existants** du codebase
8. [ ] **Typer correctement** toutes les nouvelles variables/fonctions

### Après la modification

9. [ ] **Exécuter les tests** : `bun test`
10. [ ] **Exécuter le linting** : `make lint`
11. [ ] **Vérifier les types** : `bun run check`
12. [ ] **Tester manuellement** la fonctionnalité modifiée
13. [ ] **Relire le diff** pour vérifier qu'il n'y a que ce qui est demandé

---

## 🚫 Interdictions Strictes

### ❌ Ne JAMAIS faire

1. **Modifier du code non lié à la tâche**
   - Pas de "cleanup" opportuniste
   - Pas de refactoring non demandé
   - Pas de changement de style/formatting

2. **Inventer des APIs ou méthodes**
   - Toujours vérifier qu'une méthode existe avant de l'appeler
   - Ne pas assumer qu'une fonction "devrait" exister

3. **Casser les tests existants**
   - Si un test casse, le fixer IMMÉDIATEMENT
   - Ne jamais committer avec des tests cassés
   - Ne jamais désactiver un test sans justification

4. **Ignorer les erreurs TypeScript**
   - Tout doit compiler sans erreur
   - Pas de `@ts-ignore` sauf cas exceptionnels documentés
   - Pas de `any` sans commentaire justificatif

5. **Utiliser console.log en production**
   - Toujours utiliser le logger configuré
   - Respecter les niveaux de log (debug, info, warn, error)

---

## ✅ Bonnes Pratiques à Suivre

### Code

```typescript
// ✅ BON : Types explicites, gestion d'erreur
public async processData(input: string): Promise<Result> {
  if (!input.trim()) {
    throw new Error("Input cannot be empty");
  }
  
  try {
    return await this.service.process(input);
  } catch (error) {
    logger.error("Failed to process data", { error });
    throw error;
  }
}

// ❌ MAUVAIS : any, pas de validation, erreur non gérée
public async processData(input: any) {
  return await this.service.process(input);
}
```

### Tests

```typescript
// ✅ BON : Arrange-Act-Assert clair, cas limite testé
describe("buildCompositePrompt", () => {
  it("should concatenate multiple prompts with separator", () => {
    // Arrange
    const personalities = ["builtin:professional", "builtin:creative"];
    const expected = "prompt1\n\n---\n\nprompt2";
    
    // Act
    const result = formatter.buildCompositePrompt(personalities);
    
    // Assert
    expect(result).toBe(expected);
  });
  
  it("should handle empty array", () => {
    const result = formatter.buildCompositePrompt([]);
    expect(result).toBe("");
  });
});

// ❌ MAUVAIS : Test vague, pas de cas limite
it("works", () => {
  expect(formatter.buildCompositePrompt(["test"])).toBeTruthy();
});
```

---

## 🔍 Validation Automatique

### Commandes à exécuter SYSTÉMATIQUEMENT

```bash
# 1. Tests unitaires (MUST PASS)
bun test
# Résultat attendu : ✅ XX/XX tests pass

# 2. Linting (0 errors accepté)
make lint
# Résultat attendu : ✅ 0 errors

# 3. Vérification TypeScript
bun run check
# Résultat attendu : ✅ No errors

# 4. Format check (optionnel mais recommandé)
make format-check
```

### Critères de succès

- ✅ **100% des tests passent**
- ✅ **0 erreur de linting**
- ✅ **0 erreur TypeScript**
- ✅ **Tests manuels OK**

---

## 📊 Métriques de Qualité

### Nouveau code

- **Couverture de tests** : minimum 80%
- **Complexité cyclomatique** : < 10 par fonction
- **Lignes par fonction** : < 50 (idéalement < 30)
- **Paramètres par fonction** : < 5

### Modifications

- **Ratio modification/ajout** : privilégier petites modifications ciblées
- **Nombre de fichiers impactés** : minimiser l'impact
- **Taille du diff** : préférer plusieurs petits commits qu'un gros

---

## 🎯 Application aux Tâches

### TASK_1 : Prompt Concatenation

**Risques spécifiques** :
- Over-engineering de la logique de truncation
- Oubli de cas limites (array vide, prompt vide, etc.)
- Non-respect de la limite configurée

**Contre-mesures** :
- Implémenter la solution la plus simple (loop + break)
- Tester TOUS les cas limites
- Vérifier que maxPromptLength est bien lu depuis config

### TASK_2 : Save as Default

**Risques spécifiques** :
- Écrasement involontaire de la config
- État inconsistent entre runtime et config persistée
- Mauvaise gestion des erreurs de save

**Contre-mesures** :
- Validation avant save
- Tests de round-trip (save → load → verify)
- Gestion explicite des erreurs IO

### TASK_3 : UX Polish

**Risques spécifiques** :
- Over-design du menu (trop de fonctionnalités)
- Icônes/emojis qui ne s'affichent pas partout
- Documentation incohérente avec le code

**Contre-mesures** :
- Garder le menu simple et fonctionnel
- Tester les icônes sur la plateforme cible
- Synchroniser code et docs en même temps

### TASK_4 : Cross-Platform Tests

**Risques spécifiques** :
- Assumer que ça marche sans tester
- Ignorer les problèmes platform-specific
- Tests flaky ou non-reproductibles

**Contre-mesures** :
- Tester vraiment sur chaque OS (ou documenter limitations)
- Isoler le code platform-dependent
- Tests déterministes et reproductibles

---

## 📝 Template de Commit

```
<type>(<scope>): <description courte>

<description détaillée optionnelle>

Tests:
- ✅ bun test (XX/XX pass)
- ✅ make lint (0 errors)
- ✅ manual test (comportement vérifié)

Breaking Changes: None
```

**Types autorisés** : `feat`, `fix`, `test`, `refactor`, `docs`, `chore`

---

## 🚀 Workflow Recommandé

### Pour chaque tâche

1. **Lire** les fichiers concernés en entier
2. **Planifier** la modification (pseudo-code sur papier)
3. **Implémenter** le minimum viable
4. **Tester** unitairement
5. **Valider** (lint + type-check)
6. **Tester** manuellement
7. **Commiter** avec message descriptif
8. **Passer** à la tâche suivante

### En cas de problème

1. **STOP** - Ne pas continuer à coder
2. **Analyser** - Comprendre la cause racine
3. **Documenter** - Noter le problème
4. **Demander** - Si incertain, demander de l'aide
5. **Résoudre** - Fixer proprement, pas de workaround sale

---

## 🎓 Rappels

- **La qualité > la vitesse**
- **Simple > complexe**
- **Testé > non testé**
- **Explicite > implicite**
- **Fonctionnel > parfait**

---

**🔴 RÈGLE D'OR** : Si tu n'es pas sûr à 100%, VÉRIFIE avant de modifier.

**🟢 OBJECTIF** : Code production-ready dès le premier commit.

