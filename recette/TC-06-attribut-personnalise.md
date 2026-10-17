# TC-06 — Attribut personnalisé (modifié / vidé / rempli)

**Types d'écart couverts :** `Custom Attribut Has Changed`, `Custom Attribut Cleared`, `Custom Attribut Filled`

**Objectif :** vérifier que les 3 cas de figure d'un attribut personnalisé (modifié, vidé, rempli) sont détectés avec 3 badges de couleur distincte.

**Matériel spécifique :** un artefact « modifié » (valeur différente des deux côtés), un artefact « vidé » (valeur présente côté Old, absente côté New), un artefact « rempli » (valeur absente côté Old, présente côté New) — sur le même attribut ou sur des attributs distincts.

## TS-06-01 — Attribut modifié

**Prérequis :** comparaison exécutée et fenêtre de résultats ouverte (TC-04, étapes 1-2).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'artefact du cas « modifié ». | Ligne avec badge `Custom Attribut Has Changed` ; « Attribute » indique le nom de l'attribut, « Old Value » et « New Value » affichent les deux valeurs différentes. |

## TS-06-02 — Attribut vidé

**Prérequis :** comparaison exécutée et fenêtre de résultats ouverte (TC-04, étapes 1-2).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'artefact du cas « vidé ». | Ligne avec badge `Custom Attribut Cleared` ; « Old Value » renseignée, « New Value » vide. |

## TS-06-03 — Attribut rempli

**Prérequis :** comparaison exécutée et fenêtre de résultats ouverte (TC-04, étapes 1-2).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Rechercher l'artefact du cas « rempli ». | Ligne avec badge `Custom Attribut Filled` ; « Old Value » vide, « New Value » renseignée. |

## TS-06-04 — Indicateur « Updated custom attributes »

**Prérequis :** comparaison exécutée (TC-04, étape 1).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Relever la valeur « Updated custom attributes » dans les statistiques affichées sous le panneau « New Module Info ». | — |
| 2 | Ouvrir la fenêtre de résultats et compter les lignes portant les badges `Custom Attribut Has Changed`, `Custom Attribut Cleared` et `Custom Attribut Filled`. | Le total des trois badges est égal à la valeur relevée à l'étape 1 : les cas « vidé » et « rempli » sont comptabilisés au même titre que le cas « modifié ». |
