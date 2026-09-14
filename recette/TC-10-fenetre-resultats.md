# TC-10 — Fenêtre de résultats (Display Results)

**Objectif :** vérifier le tri, les colonnes et les filtres de la fenêtre de résultats, indépendamment du contenu de chaque écart.

## TS-10-01 — Tri et colonnes

**Prérequis :** comparaison exécutée avec plusieurs écarts sur des artefacts situés à des positions différentes du module.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Ouvrir `Display Results`. | Les lignes apparaissent triées selon la position réelle de l'artefact dans le module (ordre du document), et non par identifiant. |
| 2 | Observer l'en-tête du tableau. | Les colonnes ID, Type, Section, Diff Label, Attribute, Old Value, New Value, Diff Content sont présentes dans cet ordre ; « Section » affiche le numéro de section de l'artefact. |

## TS-10-02 — Recherche et filtres

**Prérequis :** fenêtre de résultats ouverte avec plusieurs types d'écart présents.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Saisir un texte dans le champ de recherche globale du tableau. | Le tableau se limite aux lignes contenant le texte saisi, tous champs confondus. |
| 2 | Utiliser le panneau de filtre « Diff Label ». | Sélectionner un type d'écart limite l'affichage à ce seul type. |
| 3 | Répéter avec les panneaux « Type » et « Attribute ». | Filtrage cohérent, cumulable avec les autres filtres actifs. |
