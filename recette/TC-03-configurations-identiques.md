# TC-03 — Avertissement configurations identiques

**Objectif :** vérifier qu'une alerte apparaît, et que le chargement du module correspondant reste bloqué, tant que les configurations Old et New sélectionnées sont identiques.

## TS-03-01 — Sélection de la même configuration des deux côtés

**Prérequis :** Projet et Composant sélectionnés (TC-01, étapes 1-3).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Sélectionner la même configuration pour OLD et pour NEW. | Une icône d'avertissement apparaît à côté du sélecteur de configuration concerné, avec l'infobulle « Identical configurations ! » au survol. |
| 2 | Observer le menu Module du côté concerné. | Le menu Module reste désactivé tant que les deux configurations restent identiques. |
| 3 | Changer la configuration NEW pour une configuration différente de OLD. | L'avertissement disparaît et le menu Module (NEW) se peuple normalement. |
