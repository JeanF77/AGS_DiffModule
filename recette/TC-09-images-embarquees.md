# TC-09 — Images embarquées

**Types d'écart couverts :** `Embedded Image Has Changed`, `New embedded image`, `Image deleted`, `Image not found in new/old module !`

**Objectif :** vérifier les 4 cas de figure sur les images embarquées dans le contenu : modifiée, nouvelle, supprimée, introuvable.

**Matériel spécifique :** un artefact avec une image embarquée remplacée par une autre, un artefact avec une image ajoutée uniquement côté New, un artefact avec une image présente uniquement côté Old (supprimée).

> **Point d'attention :** la comparaison des images se fait de façon asynchrone, après l'affichage du tableau principal des écarts — attendre la fin de l'indicateur de progression avant de rechercher ces lignes dans les résultats.

## TS-09-01 — Image modifiée, nouvelle et supprimée

**Prérequis :** comparaison exécutée (TC-04, étape 1) et indicateur de progression des images terminé, fenêtre de résultats ouverte.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'artefact avec l'image remplacée. | Ligne avec badge `Embedded Image Has Changed`. |
| 2 | Rechercher l'artefact avec l'image ajoutée. | Ligne avec badge `New embedded image`. |
| 3 | Rechercher l'artefact avec l'image retirée. | Ligne avec badge `Image deleted`. |

## TS-09-02 — Image introuvable (optionnel)

**Prérequis :** nécessite qu'une image référencée ne réponde plus (URL invalide ou inaccessible) — à réaliser uniquement si un tel cas peut être préparé sur l'environnement de test.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'artefact concerné. | Ligne avec badge `Image not found in new/old module !` selon le côté concerné. |
