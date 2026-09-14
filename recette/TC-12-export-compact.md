# TC-12 — Export Compact Export

**Objectif :** vérifier le regroupement par artefact et la coloration restreinte du rapport HTML autonome « Compact Export ».

**Matériel spécifique :** un artefact cumulant au moins deux types d'écart (ex. un attribut modifié et un tag modifié sur le même artefact).

## TS-12-01 — Génération et contrôle du rapport compact

**Prérequis :** fenêtre de résultats ouverte, incluant le cas d'artefact cumulant plusieurs écarts et un artefact au type modifié.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Cliquer sur `Compact Export`, puis ouvrir le fichier téléchargé. | Le rapport s'ouvre normalement. |
| 2 | Localiser l'artefact cumulant plusieurs écarts. | Une seule ligne représente l'artefact, listant tous les libellés d'écart cumulés (un par ligne) et une paire de colonnes Ancien/Nouveau par attribut ou tag concerné. |
| 3 | Observer la coloration de l'ensemble des lignes. | Seules les lignes `New Artifact`, `Artifact Deleted` et `Artifact Type Has Changed` sont colorées ; toutes les autres (attribut, tag, contenu, image) sont sans couleur. |
| 4 | Observer la légende du rapport. | Elle ne présente que les 3 couleurs effectivement utilisées (Nouveau / Supprimé / Type modifié). |
| 5 | Localiser la ligne de l'artefact au type modifié. | La colonne « Old Artifact Type » est présente et affiche l'ancien type. |
