# TC-14 — Gestion des erreurs bloquantes

**Objectif :** vérifier qu'un échec de chargement, à chacune des 5 étapes de récupération de données, affiche un message explicite et verrouille l'ensemble des éléments interactifs de l'interface.

> **Point d'attention :** ces scripts nécessitent de provoquer volontairement l'échec de la requête concernée (coupure réseau temporaire, configuration ou URL invalidée entre-temps, blocage via les outils développeur du navigateur) — à réaliser avec l'assistance de la personne en charge de l'environnement si besoin. Après un tel blocage, seul un rechargement complet de la page permet de reprendre un test.

## TS-14-01 — Échec à chacune des 5 étapes de chargement

**Prérequis :** accès technique permettant de provoquer l'échec d'une requête REST spécifique.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Provoquer l'échec de la requête de récupération des **projets**, puis ouvrir/recharger le widget. | Message d'erreur explicite dans le bandeau d'alerte (fond rouge, non refermable automatiquement) ; tous les boutons et menus sont désactivés. |
| 2 | Réinitialiser l'environnement, puis provoquer l'échec de la requête **composants** après sélection d'un projet valide. | Même comportement. |
| 3 | Réinitialiser, puis provoquer l'échec de la requête **configurations** après sélection d'un composant valide. | Même comportement. |
| 4 | Réinitialiser, puis provoquer l'échec de la requête **modules** après sélection d'une configuration valide. | Même comportement. |
| 5 | Réinitialiser, puis provoquer l'échec du **chargement du contenu** des modules après clic sur `Load Modules`. | Même comportement ; les panneaux Old/New Module Info affichent un état d'échec. |
