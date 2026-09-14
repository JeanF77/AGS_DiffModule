# TC-08 — Changement de contenu (Primary Text)

**Type d'écart couvert :** `Content Has Changed`

**Objectif :** vérifier la détection de différences de contenu riche : texte, mise en forme, tableau.

**Matériel spécifique :** un artefact Text dont le contenu diffère entre Old et New (texte modifié et, si possible, un tableau modifié), avec une date de modification différente entre les deux versions.

## TS-08-01 — Comparaison visuelle du contenu

**Prérequis :** comparaison exécutée et fenêtre de résultats ouverte (TC-04, étapes 1-2).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'artefact concerné. | Ligne avec badge `Content Has Changed` ; la colonne « Diff Content » affiche une comparaison visuelle riche du texte et du tableau modifié. |
| 2 | Examiner la cellule « Diff Content ». | Les portions ajoutées, supprimées et communes sont visuellement distinguées (ajouts/suppressions mis en évidence). |
