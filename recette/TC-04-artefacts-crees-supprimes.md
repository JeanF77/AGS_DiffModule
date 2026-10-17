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

## TS-04-02 — Artefacts d'un format autre que Text

**Matériel spécifique :** un artefact non Text (ex. diagramme ou fichier joint) présent uniquement côté New, un autre présent uniquement côté Old, et un troisième présent des deux côtés.

**Prérequis :** comparaison exécutée et fenêtre de résultats ouverte (TS-04-01, étapes 1-2).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'identifiant de l'artefact non Text créé. | Une ligne apparaît avec le badge `New Artifact` ; la colonne « Type » affiche `Format Not Supported` (et non une valeur vide ou « null »). |
| 2 | Rechercher l'identifiant de l'artefact non Text supprimé. | Une ligne apparaît avec le badge `Artifact Deleted` ; la colonne « Type » affiche `Format Not Supported`. |
| 3 | Rechercher l'identifiant de l'artefact non Text présent des deux côtés. | Aucune ligne : ses caractéristiques ne sont pas chargées, il n'est donc pas comparé. |
| 4 | Dans le panneau de recherche « Type », vérifier les valeurs proposées. | La valeur `Format Not Supported` est proposée et permet de filtrer les deux lignes des étapes 1 et 2. |
