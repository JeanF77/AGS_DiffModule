# Recette fonctionnelle — AGS_DiffModule

Plan de test au niveau acceptation (pas de tests unitaires ni d'intégration) pour le widget de comparaison de modules DOORS Next Gen. Ce dossier contient un fichier Markdown par cas de test (Test Case), chacun composé d'un ou plusieurs scripts de test (Test Script), destinés à être repris dans IBM Engineering Test Management (ETM).

## Portée du plan de test

- Le widget est utilisé tel qu'exposé dans la page Jazz : sélection Projet → Composant → Configuration (Old/New) → Module (Old/New), comparaison, consultation et export des résultats.
- **Mode de comparaison :** à ce jour, le sélecteur "Mode" de l'interface n'expose que le mode *Local Conf vs Local Conf* (comparaison de deux configurations d'un même environnement RM). Le mode "vs ReqIF" existe dans le code mais n'est pas sélectionnable depuis l'interface actuelle (`COMPARE_MODE_LABEL` ne contient qu'une seule entrée) — il est donc **hors périmètre** de cette recette.
- Seuls les artefacts de format **Text** sont analysés par le widget (message affiché au survol du bouton `Load Modules`). Les artefacts d'un autre format (diagramme, fichier joint, ...) restent dans la structure du module : ils ne sont signalés que lorsqu'ils sont créés ou supprimés, avec la mention `Format Not Supported` dans la colonne « Type » (cf. TC-04).

## Matériel de test requis

Un **projet** et un **composant** RM contenant au moins deux configurations (streams/baselines/changesets) exploitables comme configurations "Old" et "New", et un **module** présent dans les deux configurations, dont les artefacts couvrent, à minima :

- un artefact présent uniquement côté New (créé) et un artefact présent uniquement côté Old (supprimé) ;
- un artefact d'un format autre que Text (ex. diagramme ou fichier joint) présent uniquement côté New, un autre présent uniquement côté Old, et un troisième présent des deux côtés ;
- un artefact dont le **type** diffère entre Old et New ;
- un artefact avec un attribut personnalisé renseigné différemment des deux côtés (cas « modifié »), un avec un attribut renseigné côté Old et vidé côté New (cas « vidé »), un avec un attribut vide côté Old et renseigné côté New (cas « rempli ») ;
- un artefact dont la liste de **tags** diffère entre les deux versions ;
- un artefact Text dont le **contenu** diffère (texte et, si possible, un tableau) entre les deux versions, avec une date de modification différente ;
- un artefact avec une **image embarquée** remplacée, un avec une image ajoutée, un avec une image supprimée entre Old et New ;
- des artefacts répartis à des positions différentes du plan du module, pour pouvoir vérifier le tri des résultats.

Prévoir en complément : deux configurations strictement identiques en contenu (pour TC-13), et un moyen de provoquer volontairement l'échec d'une requête (pour TC-14).

## Sommaire des cas de test

### Sélection du contexte
- [TC-01 — Navigation et sélection du contexte de comparaison](TC-01-navigation-selection.md)
- [TC-02 — Filtrage des listes de configuration](TC-02-filtrage-configurations.md)
- [TC-03 — Avertissement configurations identiques](TC-03-configurations-identiques.md)

### Détection des écarts
- [TC-04 — Artefacts créés et supprimés](TC-04-artefacts-crees-supprimes.md)
- [TC-05 — Changement de type d'artefact](TC-05-type-artefact-modifie.md)
- [TC-06 — Attribut personnalisé (modifié / vidé / rempli)](TC-06-attribut-personnalise.md)
- [TC-07 — Changement de tags](TC-07-tags-modifies.md)
- [TC-08 — Changement de contenu (Primary Text)](TC-08-contenu-primary-text.md)
- [TC-09 — Images embarquées](TC-09-images-embarquees.md)

### Résultats & export
- [TC-10 — Fenêtre de résultats (Display Results)](TC-10-fenetre-resultats.md)
- [TC-11 — Export Standard Report](TC-11-export-standard-report.md)
- [TC-12 — Export Compact Export](TC-12-export-compact.md)

### Cas limites
- [TC-13 — Aucun écart détecté](TC-13-aucun-ecart.md)
- [TC-14 — Gestion des erreurs bloquantes](TC-14-erreurs-bloquantes.md)
