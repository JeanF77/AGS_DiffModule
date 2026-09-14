# TC-13 — Aucun écart détecté

**Objectif :** vérifier le comportement de la fenêtre de résultats lorsque les deux modules comparés sont strictement identiques.

**Matériel spécifique :** une configuration Old et une configuration New pointant vers un module dont le contenu est strictement identique.

## TS-13-01 — Comparaison sans écart

**Prérequis :** contexte Old/New sans écart sélectionné et modules chargés (TC-01).

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Cliquer sur `Compare All`. | La comparaison se termine normalement. |
| 2 | Cliquer sur `Display Results`. | Le message « No differences found ! » est affiché, sans tableau ; les boutons d'export ne sont pas proposés. |
