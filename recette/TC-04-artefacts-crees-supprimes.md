# TC-04 — Artefacts créés et supprimés

**Types d'écart couverts :** `New Artifact`, `Artifact Deleted`

**Objectif :** vérifier la détection d'un artefact présent uniquement dans la configuration New (créé) et d'un artefact présent uniquement dans Old (supprimé).

## TS-04-01 — Recherche des artefacts créé et supprimé

**Prérequis :** modules Old et New chargés (TC-01), configurations non identiques (TC-03).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Cliquer sur `Compare All`. | La comparaison s'exécute (indicateur « Compare in Progress »), puis `Display Results` devient actif. |
| 2 | Cliquer sur `Display Results`. | La fenêtre « Module Diff Report » s'ouvre. |
| 3 | Rechercher l'identifiant de l'artefact créé. | Une ligne apparaît avec le badge `New Artifact` ; la colonne « Diff Content » affiche le contenu de l'artefact. |
| 4 | Rechercher l'identifiant de l'artefact supprimé. | Une ligne apparaît avec le badge `Artifact Deleted` ; la colonne « Diff Content » affiche le contenu tel qu'il existait côté Old. |
