/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | 30/03/2022 |   Safran       | Initial version                      |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
   ---- Constantes
   --------------------------------------------------------------------------- */

const DIFF_LABEL = ["New Artifact",
   "Artifact Deleted",
   "Artifact Type Has Changed",
   "Custom Attribut Has Changed",
   "Content Has Changed",
   "Embedded Image Has Changed",
   "New embedded image",
   "Image deleted",
   "Image not found in new module !",
   "Image not found in old module !",
   "Tag Has Changed",
   "Custom Attribut Cleared",
   "Custom Attribut Filled"
];

const DIFF_NODIFF = -1;
const DIFF_NEWARTIFACT = 0;
const DIFF_DELARTIFACT = 1;
const DIFF_ARTIFACTTYPECHANGED = 2;
const DIFF_CUSTATTRCHANGED = 3;
const DIFF_CONTENTCHANGED = 4;
const DIFF_IMAGECHANGED = 5;
const DIFF_IMAGENEW = 6;
const DIFF_IMAGEDEL = 7;
const DIFF_IMAGENOTFOUND_NEW = 8;
const DIFF_IMAGENOTFOUND_OLD = 9;
const DIFF_TAGCHANGED = 10;
const DIFF_CUSTATTRCLEARED = 11; // ---- Valeur "avant" existante, valeur "apres" vide (attribut vide de son contenu)
const DIFF_CUSTATTRFILLED = 12;  // ---- Valeur "avant" absente, valeur "apres" existante (attribut rempli)

const CST_NOT_FOUND = "Not_Found";
const CST_MOD_REF = "module_ref";
const CST_MOD_TEST = "module_test";

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

class ClassDiffResult {       // ---- Resultat de comparaison
   static SYS_ATTR_CONTENT = "Primary Text";

   // ---- Metadonnees par type d'ecart : label, presentation (badge/couleur, DataTable, export) et champs a afficher.
   // ---- Point d'entree unique pour l'affichage ("Display Results") et les exports ("Standard Report", "Compact Export") :
   // ---- toute evolution de la presentation d'un type d'ecart (existant ou nouveau) se fait ici, et seulement ici.

   static META = {
      [DIFF_NEWARTIFACT]: {
         label: DIFF_LABEL[DIFF_NEWARTIFACT], badgeClass: 'bg-success', dtRowClass: 'table-success', rptRowClass: 'rpt-row-newart',
         cells: (d) => [d.attrname, "", "", "", d.newcontent]
      },
      [DIFF_DELARTIFACT]: {
         label: DIFF_LABEL[DIFF_DELARTIFACT], badgeClass: 'bg-danger', dtRowClass: 'table-danger', rptRowClass: 'rpt-row-delart',
         cells: (d) => [d.attrname, "", "", d.oldcontent, ""]
      },
      [DIFF_ARTIFACTTYPECHANGED]: {
         label: DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED], badgeClass: 'bg-warning text-dark', dtRowClass: 'table-warning', rptRowClass: 'rpt-row-changed',
         cells: (d) => ["", d.oldvalue, "", "", ""]
      },
      [DIFF_CUSTATTRCHANGED]: {
         label: DIFF_LABEL[DIFF_CUSTATTRCHANGED], badgeClass: 'bg-warning text-dark', dtRowClass: 'table-warning', rptRowClass: 'rpt-row-changed',
         cells: (d) => [d.attrname, d.oldvalue, d.newvalue, "", ""]
      },
      [DIFF_CONTENTCHANGED]: {
         label: DIFF_LABEL[DIFF_CONTENTCHANGED], badgeClass: 'bg-primary', dtRowClass: 'table-primary', rptRowClass: 'rpt-row-content',
         cells: (d) => [d.attrname, "", "", d.oldcontent, d.newcontent]
      },
      [DIFF_IMAGECHANGED]: {
         label: DIFF_LABEL[DIFF_IMAGECHANGED], badgeClass: 'bg-info text-dark', dtRowClass: 'table-info', rptRowClass: 'rpt-row-image',
         cells: () => ["", "", "", "", ""]
      },
      [DIFF_IMAGENEW]: {
         label: DIFF_LABEL[DIFF_IMAGENEW], badgeClass: 'bg-info text-dark', dtRowClass: 'table-info', rptRowClass: 'rpt-row-image',
         cells: () => ["", "", "", "", ""]
      },
      [DIFF_IMAGEDEL]: {
         label: DIFF_LABEL[DIFF_IMAGEDEL], badgeClass: 'bg-secondary', dtRowClass: 'table-secondary', rptRowClass: 'rpt-row-image',
         cells: () => ["", "", "", "", ""]
      },
      [DIFF_IMAGENOTFOUND_NEW]: {
         label: DIFF_LABEL[DIFF_IMAGENOTFOUND_NEW], badgeClass: 'bg-danger', dtRowClass: 'table-danger', rptRowClass: 'rpt-row-delart',
         cells: () => ["", "", "", "", ""]
      },
      [DIFF_IMAGENOTFOUND_OLD]: {
         label: DIFF_LABEL[DIFF_IMAGENOTFOUND_OLD], badgeClass: 'bg-danger', dtRowClass: 'table-danger', rptRowClass: 'rpt-row-delart',
         cells: () => ["", "", "", "", ""]
      },
      [DIFF_TAGCHANGED]: {
         label: DIFF_LABEL[DIFF_TAGCHANGED], badgeClass: 'bg-warning text-dark', dtRowClass: 'table-warning', rptRowClass: 'rpt-row-changed',
         cells: (d) => [d.attrname, d.oldvalue, d.newvalue, "", ""]
      },
      [DIFF_CUSTATTRCLEARED]: {
         label: DIFF_LABEL[DIFF_CUSTATTRCLEARED], badgeClass: 'bg-danger', dtRowClass: 'table-danger', rptRowClass: 'rpt-row-delart',
         cells: (d) => [d.attrname, d.oldvalue, d.newvalue, "", ""]
      },
      [DIFF_CUSTATTRFILLED]: {
         label: DIFF_LABEL[DIFF_CUSTATTRFILLED], badgeClass: 'bg-primary', dtRowClass: 'table-primary', rptRowClass: 'rpt-row-content',
         cells: (d) => [d.attrname, d.oldvalue, d.newvalue, "", ""]
      }
   };

   /**
    * @param {Object} context - Identification/localisation de l'artefact en ecart : {id, type, section, bookorder}
    *                            (cf ERM_Artefact.getDiffContext())
    * @param {Number} diffcode - Code du type d'ecart (DIFF_NEWARTIFACT, DIFF_CUSTATTRCHANGED, ...)
    * @param {Object} payload - Champs specifiques au type d'ecart (optionnel) : {attrname, oldvalue, newvalue, oldcontent, newcontent}
    *                            (oldcontent / newcontent : HTML canonique du "Primary Text", cf richTextCompare())
    */

   constructor(context, diffcode, payload = {}) {
      this.id = context.id;
      this.arttype = context.type;
      this.section = context.section;
      this.bookorder = context.bookorder;

      this.diffcode = diffcode;
      this.difflabel = DIFF_LABEL[diffcode];

      this.attrname = payload.attrname;
      this.oldvalue = payload.oldvalue;
      this.newvalue = payload.newvalue;
      this.oldcontent = payload.oldcontent || "";   // ---- Contenu de l'ancienne version (colonne "Old Content")
      this.newcontent = payload.newcontent || "";   // ---- Contenu de la nouvelle version (colonne "New Content")
      this.canvas = undefined;        // ---- Representation graphique du contenu
   }
}

/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/**
 * Detecter les ecarts en nombre d'artefacts entre 2 modules
 * @param {Object} modTest - Module dont on veut detecter les ecarts
 * @param {Object} modRef - Module de reference sur lequel on va boucler
 * @returns {Array} - Tableau d'objets de la classe "ClassDiffResult" (Taille tableau = 0, si pas d'ecart)
 */

function cmp_DiffModArtefact(modTest, modRef) {
   let myDiffList = [];

   for (let myRefArtefact of modRef.getArtifactList()) {
      if (modTest.get_artefactById(myRefArtefact.getId()) === undefined) {
         // ---- On detecte l'artefact en ecart (existe dans le module de reference, mais pas dans le module a tester)

         // ---- Nouvel artefact : contenu en colonne "New Content" | Artefact supprime : contenu en colonne "Old Content"

         const myDiffcode = (modRef.getStatus() === IS_NEW) ? DIFF_NEWARTIFACT : DIFF_DELARTIFACT;
         const myContent = cmp_canonicalContent(myRefArtefact.getContent());

         myDiffList.push(new ClassDiffResult(myRefArtefact.getDiffContext(), myDiffcode,
            (myDiffcode === DIFF_NEWARTIFACT)
               ? { attrname: ClassDiffResult.SYS_ATTR_CONTENT, newcontent: myContent }
               : { attrname: ClassDiffResult.SYS_ATTR_CONTENT, oldcontent: myContent }));
      }
   }

   return myDiffList;
}

/**
 * Obtenir le HTML canonique d'un "Primary Text" (meme mise en forme que les colonnes "Old Content" / "New Content"
 * des artefacts dont le contenu a change, cf richTextCompare())
 * @param {String} richText - Contenu riche de l'artefact
 * @returns {String} - HTML canonique ("" si le contenu est vide)
 */

function cmp_canonicalContent(richText) {
   const myResult = richTextCompare(null, richText);

   return (myResult !== null) ? myResult.canonicalNew : "";
}

/**
  * Comparer les attributs entre artefacts
  * @param {Object} artTest - Artefact dont on veut detecter les ecarts
  * @param {Object} artRef - Artefact de reference sur lequel on va boucler
  * @returns {Array} - Tableau d'objets de la classe "ClassDiffResult" (Taille tableau = 0, si pas d'ecart)
  */

/**
 * Determiner le type d'ecart precis pour un attribut "custom" en fonction du remplissage
 * des valeurs avant/apres : DIFF_CUSTATTRFILLED (avant vide, apres rempli), DIFF_CUSTATTRCLEARED
 * (avant rempli, apres vide) ou DIFF_CUSTATTRCHANGED (avant et apres tous les deux non vides)
 * @param {String|Array} oldvalue - Valeur avant (chaine vide ou tableau de valeurs)
 * @param {String|Array} newvalue - Valeur apres (chaine vide ou tableau de valeurs)
 * @returns {Number} - Code du type d'ecart (DIFF_CUSTATTRFILLED, DIFF_CUSTATTRCLEARED ou DIFF_CUSTATTRCHANGED)
 */

function cmp_pickCustAttrDiffcode(oldvalue, newvalue) {
   const isEmpty = (value) => value === "" || value === undefined || value === null || (Array.isArray(value) && value.length === 0);

   if (isEmpty(oldvalue) && !isEmpty(newvalue)) {
      return DIFF_CUSTATTRFILLED;
   } else if (!isEmpty(oldvalue) && isEmpty(newvalue)) {
      return DIFF_CUSTATTRCLEARED;
   } else {
      return DIFF_CUSTATTRCHANGED;
   }
}

function cmp_DiffAttr(artTest, artRef) {
   let myDiffList = [];

   // ---- Iterer sur tous les custom attributs de l'artefact de reference
   // ---- Detecter les cas suivants :
   // ----     - attribut rempli dans la reference, mais pas dans le test
   // ----     - attribut rempli dans la reference et le test (donc, faut comparer les valeurs)

   for (let myAttrRef of artRef.getCustattrList()) {
      let myAttrTest = artTest.get_attributeByName(myAttrRef.getName());

      if (myAttrTest === undefined) {
         // ---- L'attribut existe seulement dans la reference

         myDiffList.push(new ClassDiffResult(artRef.getDiffContext(), cmp_pickCustAttrDiffcode("", myAttrRef.getValue()),
            { attrname: myAttrRef.getName(), oldvalue: "", newvalue: myAttrRef.getValue() }));
      } else {
         // ---- L'attribut existe dans la reference et le test, il faut donc evaluer l'ecart de valeur
         // ---- Si nombre de valeur est different, alors ecart, sinon faut comparer chaque valeur

         let myValueDiff = myAttrRef.getValue().filter(x => myAttrTest.getValue().indexOf(x) === -1);

         if ((myAttrTest.getValue().length != myAttrRef.getValue().length) || (myValueDiff.length > 0)) {
            myDiffList.push(new ClassDiffResult(artRef.getDiffContext(), cmp_pickCustAttrDiffcode(myAttrTest.getValue(), myAttrRef.getValue()),
               { attrname: myAttrRef.getName(), oldvalue: myAttrTest.getValue(), newvalue: myAttrRef.getValue() }));
         }
      }
   }

   // ---- Iterer sur tous les custom attributs de l'artefact de test
   // ---- Detecter le cas suivant :
   // ----     - attribut rempli dans le test, mais pas dans la reference

   for (let myAttrTest of artTest.getCustattrList()) {
      let myAttrRef = artRef.get_attributeByName(myAttrTest.getName());

      if (myAttrRef === undefined) {
         // ---- L'attribut existe seulement dans le test

         myDiffList.push(new ClassDiffResult(artTest.getDiffContext(), cmp_pickCustAttrDiffcode(myAttrTest.getValue(), ""),
            { attrname: myAttrTest.getName(), oldvalue: myAttrTest.getValue(), newvalue: "" }));
      }
   }

   return myDiffList;
}

/**
 * Comparer les tages entre artefacts
 * @param {Object} artTest - Artefact dont on veut detecter les ecarts
 * @param {Object} artRef - Artefact de reference sur lequel on va boucler
 * @returns {Array} - Tableau d'objets de la classe "ClassDiffResult" (Taille tableau = 0, si pas d'ecart)
 */

function cmp_DiffTag(artTest, artRef) {
   let myDiffList = [];
   let myTagRefList = artRef.concat_tag();;
   let myTagTestList = artTest.concat_tag();
   let myTagModified = false;

   // ---- Iterer sur tous les tags de l'artefact de reference
   // ---- Detecter les cas suivants :
   // ----     - tag rempli dans la reference, mais pas dans le test

   for (let myTagRef of artRef.getTagList()) {
      if (!artTest.find_tag(myTagRef.value, myTagRef.scope)) {
         myTagModified = true;
      }
   }

   // ---- Iterer sur tous les tags de l'artefact de test
   // ---- Detecter le cas suivant :
   // ----     - attribut rempli dans le test, mais pas dans la reference

   for (let myTagTest of artTest.getTagList()) {
      if (!artRef.find_tag(myTagTest.value, myTagTest.scope)) {
         myTagModified = true;
      }
   }

   // ---- Tag list is modified !

   if (myTagModified) {
      myDiffList.push(new ClassDiffResult(artTest.getDiffContext(), DIFF_TAGCHANGED,
         { attrname: "Tags", oldvalue: myTagTestList, newvalue: myTagRefList }));
   }

   return myDiffList;
}

/**
  * Detecter les ecarts en type d'artefacts entre 2 modules
  * @param {Object} modTest - Module dont on veut detecter les ecarts
  * @param {Object} modRef - Module de reference sur lequel on va boucler
  * @returns {Array} - Tableau d'objets de la classe "ClassDiffResult" (Taille tableau = 0, si pas d'ecart)
  */

function cmp_DiffTypeArtefact(modTest, modRef) {
   let myDiffList = [];

   for (let myRefArtefact of modRef.getArtifactList()) {
      let myTestArtefact = modTest.get_artefactById(myRefArtefact.getId());

      // ---- Pour les artefacts communs, on compare le type

      if (myTestArtefact !== undefined && myRefArtefact.getType() !== myTestArtefact.getType()) {
         myDiffList.push(new ClassDiffResult(myRefArtefact.getDiffContext(), DIFF_ARTIFACTTYPECHANGED,
            { oldvalue: myTestArtefact.getType() }));
      }
   }

   return myDiffList;
}

/**
 * Detecter les ecarts de custom attributs entre 2 modules
 * @param {Object} modTest - Module dont on veut detecter les ecarts
 * @param {Object} modRef - Module de reference sur lequel on va boucler
 * @returns {Array} - Tableau d'objets de la classe "ClassDiffResult" (Taille tableau = 0, si pas d'ecart)
 */

function cmp_DiffAttrArtefact(modTest, modRef) {
   let myDiffList = [];

   for (let myRefArtefact of modRef.getArtifactList()) {
      let myDiffAttrList = [];
      let myTestArtefact = modTest.get_artefactById(myRefArtefact.getId());

      // ---- Pour les artefacts communs et de même type, dont la date de modification est differente :
      // ----     - on compare les changements de custom attributs

      if (myTestArtefact !== undefined && myRefArtefact.getType() === myTestArtefact.getType() && myRefArtefact.getModified() !== myTestArtefact.getModified()) {
         myDiffAttrList = cmp_DiffAttr(myTestArtefact, myRefArtefact);

         if (myDiffAttrList.length > 0) {
            myDiffList = myDiffList.concat(myDiffAttrList);
         }
      }
   }

   return myDiffList;
}

/**
  * Detecter les ecarts de tags entre 2 modules
  * @param {Object} modTest - Module dont on veut detecter les ecarts
  * @param {Object} modRef - Module de reference sur lequel on va boucler
  * @returns {Array} - Tableau d'objets de la classe "ClassDiffResult" (Taille tableau = 0, si pas d'ecart)
  */

function cmp_DiffTagArtefact(modTest, modRef) {
   let myDiffList = [];

   for (let myRefArtefact of modRef.getArtifactList()) {
      let myDiffAttrList = [];
      let myTestArtefact = modTest.get_artefactById(myRefArtefact.getId());

      // ---- Pour les artefacts communs (un changement de tag de modifie pas la date de l'artefact)
      // ----     - on compare les changements de tags

      if (myTestArtefact !== undefined) {
         myDiffAttrList = cmp_DiffTag(myTestArtefact, myRefArtefact);
         myDiffList = myDiffList.concat(myDiffAttrList);
      }
   }

   return myDiffList;
}

/**
  * 
  * @param {*} headerContent - Header HTTP
  * @param {*} headerKey - Champ du header dont on souhaite retourner la valeur
  * @returns {String} - Vakeur du champ contenu dans le header HTTP (undefined, si champ n'existe pas)
  */

function get_httpHeaderInfo(headerContent, headerKey) {
   const regexp = new RegExp(headerKey.toLowerCase() + "\s*:\s*(.+)", "gmi");  // ---- Groupe n° 1 = valeur de la clef recherchée

   let myKeyValue = undefined;
   let myMatch;

   myMatch = regexp.exec(headerContent.toLowerCase());

   if (myMatch) {
      myKeyValue = myMatch[1];
   }

   return myKeyValue;
}

/**
  * Lancer les requetes de recuperartion des Headers HPPT des images a comparer (Dans le Header HTTP se trouve la
  * date de derniere modification de l'image). Les requetes sont envoyees en parallele et chaque reponse doit
  * etre traitee individuellement.
  * @param {Array} diffImgList - Tableau des images a comparer
  */

function cmp_DiffImgArtefact(diffImgList) {
   let myRequest;
   let myImgInfo;

   // ---- Boucler sur la liste des images a comparer

   for (let i = 0; i < diffImgList.length; i++) {

      // ---- Recuprere les informations pour l'image de reference

      myRequest = {
         'rest_method': "HEAD",               // ---- Get header only !
         'rest_url': diffImgList[i].refImgUri,
         'rest_success': "Success message - not used in this version",
         'rest_failed': "Failed message - not used in this version"
      };

      myImgInfo = {
         'imgIdx': i,                          // ---- Indice de l'image dans la liste des image a tester
         'id': diffImgList[i].id,              // ---- Identifiant de l'artefact dans laquelle se trouve l'image
         'type': diffImgList[i].type,          // ---- Type de l'artefact dans laquelle se trouve l'image
         'section': diffImgList[i].section,    // ---- Section de l'artefact dans laquelle se trouve l'image
         'bookorder': diffImgList[i].bookorder, // ---- Position de l'artefact dans laquelle se trouve l'image
         'imgUri': diffImgList[i].refImgUri,   // ---- URI de l'image de reference
         'imgSrc': CST_MOD_REF                 // ---- Indicateur "Image de Reference"
      };

      ajax_async_parm_request(myRequest, getImgHeader, getImgHeaderFailed, myImgInfo);

      // ---- Recuprere les informations pour l'image de test

      myRequest = {
         'rest_method': "HEAD",                // ---- Get header only !
         'rest_url': diffImgList[i].testImgUri,
         'rest_success': "Success message - not used in this version",
         'rest_failed': "Failed message - not used in this version"
      };

      myImgInfo = {
         'imgIdx': i,                          // ---- Indice de l'image dans la liste des image a tester
         'id': diffImgList[i].id,              // ---- Identifiant de l'artefact dans laquelle se trouve l'image
         'type': diffImgList[i].type,          // ---- Type de l'artefact dans laquelle se trouve l'image
         'section': diffImgList[i].section,    // ---- Section de l'artefact dans laquelle se trouve l'image
         'bookorder': diffImgList[i].bookorder, // ---- Position de l'artefact dans laquelle se trouve l'image
         'imgUri': diffImgList[i].testImgUri,  // ---- URI de l'image de test
         'imgSrc': CST_MOD_TEST                // ---- Indicateur "Image de Test"
      };

      // ---- Lancer la requete de recuperation du header

      ajax_async_parm_request(myRequest, getImgHeader, getImgHeaderFailed, myImgInfo);
   }
}

/**
  * Succes de la requete REST de recuperation du header d'une image
  * @param {Object} imgInfo - Caracteristiques de l'image a comparer
  * @param {Object} date - Donnees retournees par la requete REST
  * @param {Object} jqXHR - Objet jQuery XMLHttpRequest
  */

function getImgHeader(imgInfo, data, jqXHR) {
   let myStatus = jqXHR.status;
   let myHeader = jqXHR.getAllResponseHeaders();
   let myImgDate;

   console.log('$$$ Embedded image found : ' + imgInfo.imgUri);

   // ---- Recuperer la date de derniere modification de l'image

   if (myStatus === 200) { // ---- Requete passee avec succes
      myImgDate = get_httpHeaderInfo(myHeader, "last-modified");
   } else { // ---- Autre statut : pour l'instant on ne prend pas en compte
      myImgDate = CST_NOT_FOUND;
   }

   // ---- Stocker la date de derniere modification et comparer les images

   cmpImgEmbedded(imgInfo, myImgDate);
}

/**
  * Requete REST en echec lors de la recuperation du header d'une image
  * @param {Object} imgInfo - Caracteristiques de l'image a comparer
  * @param {Object} jqXHR - Objet jQuery XMLHttpRequest 
  */

function getImgHeaderFailed(imgInfo, jqXHR) {
   let myStatus = jqXHR.status;

   console.log('### Embedded image not found : ' + myStatus);

   // ---- Stocker la date de derniere modification et comparer les images

   cmpImgEmbedded(imgInfo, CST_NOT_FOUND);
}

/**
  * Stocker les caracteristiques des images embarquees dans l'artefact et les comparer
  * @param {Object} imgInfo - Caracteristiques de l'image a comparer
  * @param {String} imgDate - Date de erniere modification de l'image
  */

function cmpImgEmbedded(imgInfo, imgDate) {

   // ---- Stocker la date de derniere modification de l'image

   if (imgInfo.imgSrc === CST_MOD_REF) {
      g_DiffImgList[imgInfo.imgIdx].refImgDate = imgDate;
   } else {
      g_DiffImgList[imgInfo.imgIdx].testImgDate = imgDate;
   }

   // ---- Si possible, comparer les dates de dernière modification

   if (g_DiffImgList[imgInfo.imgIdx].refImgDate !== undefined && g_DiffImgList[imgInfo.imgIdx].testImgDate !== undefined) {
      if (g_DiffImgList[imgInfo.imgIdx].refImgDate !== CST_NOT_FOUND && g_DiffImgList[imgInfo.imgIdx].testImgDate !== CST_NOT_FOUND &&
         g_DiffImgList[imgInfo.imgIdx].refImgDate !== g_DiffImgList[imgInfo.imgIdx].testImgDate) {

         // ---- Image modifiee

         g_DiffList.push(new ClassDiffResult(imgInfo, DIFF_IMAGECHANGED));
      } else {
         if (g_DiffImgList[imgInfo.imgIdx].refImgDate === CST_NOT_FOUND) { // ----Image de l'artefact de reference a disparu
            g_DiffList.push(new ClassDiffResult(imgInfo, DIFF_IMAGENOTFOUND_NEW));
         }

         if (g_DiffImgList[imgInfo.imgIdx].testImgDate === CST_NOT_FOUND) { // ----Image de l'artefact de test a disparu
            g_DiffList.push(new ClassDiffResult(imgInfo, DIFF_IMAGENOTFOUND_OLD));
         }
      }

      // ---- Incrementer le compteur de comparaison d'image

      g_DiffImgCpt++;

      // ---- Si toute les images on ete comparees, on peut donc afficher les statistiques 

      if (g_DiffImgCpt >= g_DiffImgList.length) {
         gui_DisplayStat();
      } else {
         gui_RefreshCmpIndicator(g_DiffImgList.length, g_DiffImgCpt);
      }
   }
}

/**
  * Detecter les ecarts de contenu entre 2 modules
  * @param {Object} modTest - Module dont on veut detecter les ecarts (ancienne version : g_ModuleOld)
  * @param {Object} modRef - Module de reference sur lequel on va boucler (nouvelle version : g_ModuleNew)
  * @returns - Tableau des artefacts en ecart (Taille tableau = 0, si pas d'ecart) - Index = Identifiant artefact en ecart | Contenu = Tableau des attributs en ecart
  */

function cmp_DiffContentArtefact(modTest, modRef) {
   let myDiffList = [];

   for (let myRefArtefact of modRef.getArtifactList()) {
      let myTestArtefact = modTest.get_artefactById(myRefArtefact.getId());
      let myDiffContent;

      if (myTestArtefact != undefined) {
         if (myRefArtefact.getModified() !== myTestArtefact.getModified()) { // ---- Si la date de modification est differente, il est donc possible qu'il y ait des differences de contenu
            if (myRefArtefact.getContent() !== myTestArtefact.getContent()) { // ---- Si le contenu est different, il faut donc faire une comparaison detaillee pour identifier les differences

               mgt_Console(cmp_DiffContentArtefact.name + " : Artifact '" + myRefArtefact.getId() + "' has different content", CONSOLE_INFO);

               // ---- richTextCompare(ancien, nouveau) : l'artefact "test" est l'ancienne version, l'artefact "ref" la nouvelle
               // ---- Retourne null si les 2 contenus sont equivalents (differences non significatives uniquement)

               myDiffContent = richTextCompare(myTestArtefact.getContent(), myRefArtefact.getContent());

               if (myDiffContent !== null) {
                  for (let myWarning of myDiffContent.warnings) {
                     mgt_Console(cmp_DiffContentArtefact.name + " : Artifact '" + myRefArtefact.getId() + "' (" + myWarning.detail.origin + ") - "
                        + myWarning.code + " : " + myWarning.message, CONSOLE_WARNING);
                  }

                  myDiffList.push(new ClassDiffResult(myRefArtefact.getDiffContext(), DIFF_CONTENTCHANGED,
                     { attrname: ClassDiffResult.SYS_ATTR_CONTENT, oldcontent: myDiffContent.canonicalOld, newcontent: myDiffContent.canonicalNew }));
               }
            }
         }
      }
   }

   return myDiffList;
}

/**
 * Detect if embedded images, in artifact "Primary Text", has been added or removed and list images to compare
 * @param {Object} modTest - Module dont on veut detecter les ecarts
 * @param {Object} modRef - Module de reference sur lequel on va boucler
 * @returns {Object} - Object with list of differences and list of embedded images
 */

function cmp_DiffEmbeddeImg(modTest, modRef) {
   let myRefImgList = [];
   let myTestImgList = [];
   let myFctReturnStr = {
      'diffList': [],
      'imgList': []
   };

   for (let myRefArtefact of modRef.getArtifactList()) {
      let myTestArtefact = modTest.get_artefactById(myRefArtefact.getId());

      // ---- Identifier toutes les images contenues dans le Primary Text et voir si elles ont ete modifiees
      // ---- Les differents cas de figure a prendre en compte :
      // ----     - l'image existe dans l'artefact de reference et dans l'artefact de test, il daut donc detecter si elle a ete modifiee
      // ----     - l'image existe seulement dans l'artefact de reference, c'est donc une nouvelle image
      // ----     - l'image existe seulement dans l'artefact de test, c'est donc qu'elle a ete supprimee de l'artefact de reference

      if (myTestArtefact !== undefined) {
         myRefImgList = myRefArtefact.get_imageList();
         myTestImgList = myTestArtefact.get_imageList();

         const myArtContext = myRefArtefact.getDiffContext();

         for (let myId in myRefImgList) {
            let myImgDiff = {
               'id': myArtContext.id,
               'type': myArtContext.type,
               'section': myArtContext.section,
               'bookorder': myArtContext.bookorder,
               'refImgUri': "",
               'refImgDate': undefined,
               'testImgUri': "",
               'testImgDate': undefined
            };

            if (myTestImgList[myId] !== undefined) { // ---- L'image existe dans les 2 versions de l'artefact
               // ---- On empile les caracteristiques des images qui seront comparees plus tard

               mgt_Console("Artifact '" + myRefArtefact.getId() + "' has same image '" + myId + "'", CONSOLE_INFO);

               myImgDiff.refImgUri = myRefImgList[myId] + "&oslc_config.context=" + modRef.getConf().getUrl();
               myImgDiff.testImgUri = myTestImgList[myId] + "&oslc_config.context=" + modTest.getConf().getUrl();

               myFctReturnStr.imgList.push(myImgDiff);
            } else { // ---- Nouvelle image dans l'artefact de reference
               myFctReturnStr.diffList.push(new ClassDiffResult(myArtContext, DIFF_IMAGENEW,
                  { attrname: ClassDiffResult.SYS_ATTR_CONTENT }));

               mgt_Console("New image in '" + myRefArtefact.getId() + "'", CONSOLE_INFO);
            }
         }

         // ---- Images supprimees de l'artefact de referenceBen

         for (let myId in myTestImgList) {
            if (myRefImgList[myId] === undefined) {
               myFctReturnStr.diffList.push(new ClassDiffResult(myArtContext, DIFF_IMAGEDEL,
                  { attrname: ClassDiffResult.SYS_ATTR_CONTENT }));

               mgt_Console("Image deleted from '" + myRefArtefact.getId() + "'", CONSOLE_INFO);
            }
         }
      }
   }

   return myFctReturnStr;
}

/**
  * Comparer les modules
  * 
  * Principe de base : on compare le module "New" par rapport au module "Old"
  * 
  * @param {String} data - Donnees provenant de l'objet ayant appele la fonction 
  */

function start_compare() {
   let myChangedArtifactList = [];
   let myFctReturnStr;

   g_DiffList.splice(0);      // ---- Vider la table des resultats de comparaison
   g_DiffImgList.splice(0);   // ---- Vider la liste des images embarquees à comparer
   g_DiffImgCpt = 0;          // ---- Reinitialiser le compteur de comparaison d'images embarquees

   // ---- Afficher l'indicateur de progession de la comparaison

   $("#" + GUI_ITEM_newloadingcellstat).show();

   // ---- Detecter les nouveaux artefacts

   myChangedArtifactList = cmp_DiffModArtefact(g_ModuleOld, g_ModuleNew);
   g_DiffList = g_DiffList.concat(myChangedArtifactList);

   // ---- Détecter les artefacts supprimes

   myChangedArtifactList = cmp_DiffModArtefact(g_ModuleNew, g_ModuleOld);
   g_DiffList = g_DiffList.concat(myChangedArtifactList);

   // ---- Parmi les artefacts communs, detecter les artefacts dont le type a ete modifie

   myChangedArtifactList = cmp_DiffTypeArtefact(g_ModuleOld, g_ModuleNew);
   g_DiffList = g_DiffList.concat(myChangedArtifactList);

   // ---- Parmi les artefacts communs, detecter les artefacts dont les attributs "custom" ont ete modifies

   myChangedArtifactList = cmp_DiffAttrArtefact(g_ModuleOld, g_ModuleNew);
   g_DiffList = g_DiffList.concat(myChangedArtifactList);

   // ---- Parmi les artefacts communs, detecter les artefacts dont les tags ont ete modifies

   myChangedArtifactList = cmp_DiffTagArtefact(g_ModuleOld, g_ModuleNew);
   g_DiffList = g_DiffList.concat(myChangedArtifactList);

   // ---- Parmi les artefacts communs, detecter les artefacts dont le "Primary Text" a ete modifie

   myChangedArtifactList = cmp_DiffContentArtefact(g_ModuleOld, g_ModuleNew);
   g_DiffList = g_DiffList.concat(myChangedArtifactList);

   // ---- Analyser les images embarquées dans le "Primary Text"

   myFctReturnStr = cmp_DiffEmbeddeImg(g_ModuleOld, g_ModuleNew);
   g_DiffList = g_DiffList.concat(myFctReturnStr.diffList);
   g_DiffImgList = myFctReturnStr.imgList;

   // ---- Lancer la comparaison des images contenues dans le "Primary Text" des artefacts

   if (g_DiffImgList.length > 0) {
      cmp_DiffImgArtefact(g_DiffImgList);
   } else {
      gui_DisplayStat();
   }
}
