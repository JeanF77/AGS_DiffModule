# TC-05 — Changement de type d'artefact

**Type d'écart couvert :** `Artifact Type Has Changed`

**Objectif :** vérifier la détection d'un artefact dont le type a changé entre Old et New.

**Matériel spécifique :** un artefact dont le type (ex. Heading → Information) diffère entre Old et New.

## TS-05-01 — Recherche de l'artefact au type modifié

**Prérequis :** comparaison exécutée et fenêtre de résultats ouverte (TC-04, étapes 1-2).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'identifiant de l'artefact concerné. | Une ligne apparaît avec le badge `Artifact Type Has Changed` ; la colonne « Old Value » affiche l'ancien type (celui de la configuration Old). |
