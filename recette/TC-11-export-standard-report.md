# TC-11 — Export Standard Report

**Objectif :** vérifier la génération et le contenu du rapport HTML autonome « Standard Report », une ligne par écart.

## TS-11-01 — Génération et contrôle du rapport

**Prérequis :** fenêtre de résultats ouverte avec plusieurs écarts, dont au moins un écart de contenu.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Cliquer sur `Standard Report`. | Un fichier HTML est téléchargé. |
| 2 | Ouvrir le fichier téléchargé. | Le rapport affiche l'en-tête (Projet / Modules / Date / Nombre d'écarts), une légende de toutes les couleurs rencontrées, un filtre par type et une recherche texte, et un tableau reprenant une ligne par écart avec la même coloration que « Display Results ». |
| 3 | Vérifier la colonne « Diff Content » pour l'écart de contenu. | Le rendu riche de la comparaison s'affiche correctement, sans connexion au widget d'origine (fichier autonome). |
| 4 | Utiliser le filtre et la recherche du rapport exporté. | Comportement de filtrage cohérent avec « Display Results ». |
