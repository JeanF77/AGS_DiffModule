# TC-01 — Navigation et sélection du contexte de comparaison

**Objectif :** vérifier que l'enchaînement Projet → Composant → Configuration → Module, des deux côtés (Old/New), fonctionne et alimente correctement les panneaux d'information avant comparaison.

## TS-01-01 — Sélection complète du contexte

**Prérequis :** le widget est ouvert dans la page Jazz ; le testeur connaît le projet, le composant et les configurations de test.

| # | Action | Résultat attendu |
|---|--------|-------------------|
| 1 | Ouvrir le menu `Select Project`. | La liste des projets accessibles s'affiche. |
| 2 | Sélectionner le projet de test. | L'indicateur du projet passe au succès ; le menu `Select Component` devient sélectionnable. |
| 3 | Sélectionner le composant de test. | L'indicateur du composant passe au succès ; les deux menus `Select Configuration` (badges OLD et NEW) se peuplent de streams/baselines/changesets. |
| 4 | Sélectionner la configuration « Old » préparée pour le test. | Le bouton affiche l'icône et le nom de la configuration ; le menu `Select Module` côté OLD devient sélectionnable. |
| 5 | Sélectionner le module de test côté OLD. | Le panneau « Old Module Info » affiche Module Name, Module ID, Module Modified, Nb Artifacts et la répartition par type d'artefact. |
| 6 | Répéter les étapes 4 et 5 côté NEW, avec une configuration différente de celle choisie côté OLD. | Le panneau « New Module Info » se renseigne de la même façon ; le bouton `Load Modules` devient actif. |
| 7 | Cliquer sur `Load Modules`. | Un indicateur de progression s'affiche puis les deux panneaux affichent le nombre d'artefacts chargés ; le bouton `Compare All` devient actif. |
