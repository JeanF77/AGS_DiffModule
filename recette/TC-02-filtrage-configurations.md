# TC-02 — Filtrage des listes de configuration

**Objectif :** vérifier le filtre textuel et le filtre par type (Stream / Baseline / Changeset) dans les listes déroulantes de configuration, seuls et combinés, et leur remise à zéro à la réouverture.

**Matériel spécifique :** la liste de configurations du composant de test comporte au moins un stream, une baseline et un changeset dont les noms sont connus du testeur, avec un fragment de texte commun à au moins deux d'entre eux de types différents.

## TS-02-01 — Filtre textuel seul

**Prérequis :** TC-01, étapes 1 à 3 réalisées.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Ouvrir le menu Configuration (OLD). | Toutes les configurations sont visibles ; le filtre de type est sur « All ». |
| 2 | Saisir dans le champ « Filter… » une partie du nom d'une configuration connue. | Seules les configurations dont le nom contient le texte saisi restent visibles. |
| 3 | Vider le champ. | Toutes les configurations réapparaissent. |

## TS-02-02 — Filtre par type seul

**Prérequis :** TC-01, étapes 1 à 3 réalisées.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Ouvrir le menu Configuration (OLD), champ texte vide. | Toutes les configurations sont visibles. |
| 2 | Cliquer sur l'icône « Stream ». | Seules les configurations de type stream restent visibles. |
| 3 | Cliquer sur « Baseline » puis « Changeset ». | La liste se limite respectivement aux baselines puis aux changesets. |
| 4 | Cliquer sur « All ». | Toutes les configurations réapparaissent. |

## TS-02-03 — Combinaison texte + type, et remise à zéro

**Prérequis :** TC-01, étapes 1 à 3 réalisées.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Saisir un texte présent à la fois dans un nom de stream et un nom de baseline. | Le stream et la baseline correspondants sont visibles (filtre type sur « All »). |
| 2 | Cliquer sur « Baseline » sans modifier le texte. | Seule la baseline correspondant au texte reste visible. |
| 3 | Fermer le menu (clic en dehors), puis le rouvrir. | Le champ texte est vide et le filtre type est revenu sur « All » ; toutes les configurations sont visibles. |
| 4 | Répéter les étapes 1 à 3 sur le menu Configuration (NEW). | Comportement identique, et indépendant de l'état du menu OLD. |
