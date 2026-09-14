# TC-07 — Changement de tags

**Type d'écart couvert :** `Tag Has Changed`

**Objectif :** vérifier la détection d'un changement de tags sur un artefact.

**Matériel spécifique :** un artefact dont la liste de tags diffère entre Old et New (ajout et/ou suppression d'un tag).

## TS-07-01 — Recherche de l'artefact aux tags modifiés

**Prérequis :** comparaison exécutée et fenêtre de résultats ouverte (TC-04, étapes 1-2).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'artefact concerné. | Ligne avec badge `Tag Has Changed` ; « Attribute » = « Tags » ; « Old Value »/« New Value » listent les tags (valeur et portée) de chaque côté. |
