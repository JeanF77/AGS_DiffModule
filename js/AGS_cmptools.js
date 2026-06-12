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
   "Tag Has Changed"
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

const CST_NOT_FOUND = "Not_Found";
const CST_MOD_REF = "module_ref";
const CST_MOD_TEST = "module_test";

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

class ClassDiffResult {       // ---- Resultat de comparaison
   static SYS_ATTR_CONTENT = "Primary Text";

   constructor() {
      this.id = ""                    // ---- Identifiant de l'artefect en ecart
      this.arttype = ""               // ---- Type d'artefact
      this.diffcode = 0               // ---- Code du type d'ecart
      this.difflabel = ""             // ---- Label du type d'ecart
      this.attrname = undefined       // ---- Nom attribut modifie (optionnel)
      this.newvalue = undefined       // ---- Nouvelle valeur (optionnel)
      this.oldvalue = undefined       // ---- Ancienne valeur (optionnel)
      this.content = undefined        // ---- Difference du Primary Text (represente sous forme d'une image)
      this.canvas = undefined         // ---- Representation graphique de "content"
   }

   // ---- New artifact in the module

   set_diff_newartifact(id, type, content) {
      this.id = id;
      this.arttype = type;
      this.diffcode = DIFF_NEWARTIFACT;
      this.difflabel = DIFF_LABEL[this.diffcode];
      this.attrname = ClassDiffResult.SYS_ATTR_CONTENT;
      this.content = content;
   }

   // ---- Artifact deleted from module

   set_diff_delartifact(id, type, content) {
      this.id = id;
      this.arttype = type;
      this.diffcode = DIFF_DELARTIFACT;
      this.difflabel = DIFF_LABEL[this.diffcode];
      this.attrname = ClassDiffResult.SYS_ATTR_CONTENT;
      this.content = content;
   }

   // ---- Artifact type has changed

   set_diff_artifacttypechanged(id, type, oldvalue) {
      this.id = id;
      this.arttype = type;
      this.diffcode = DIFF_ARTIFACTTYPECHANGED;
      this.difflabel = DIFF_LABEL[this.diffcode];
      this.oldvalue = oldvalue;
   }

   // ---- Artifact custom attribute has changed

   set_diff_attributevaluechanged(id, type, attrname, oldvalue, newvalue) {
      this.id = id;
      this.arttype = type;
      this.diffcode = DIFF_CUSTATTRCHANGED;
      this.difflabel = DIFF_LABEL[this.diffcode];
      this.attrname = attrname;
      this.oldvalue = oldvalue;
      this.newvalue = newvalue;
   }

   // ---- Artifact tag has changed

   set_diff_tagchanged(id, type, oldvalue, newvalue) {
      this.id = id;
      this.arttype = type;
      this.diffcode = DIFF_TAGCHANGED;
      this.difflabel = DIFF_LABEL[this.diffcode];
      this.attrname = "Tags";
      this.oldvalue = oldvalue;
      this.newvalue = newvalue;
   }

   // ---- Artifact content has changed

   set_diff_contentchanged(id, type, content) {
      this.id = id;
      this.arttype = type;
      this.diffcode = DIFF_CONTENTCHANGED;
      this.difflabel = DIFF_LABEL[this.diffcode];
      this.attrname = ClassDiffResult.SYS_ATTR_CONTENT;
      this.content = content;
   }

   // ---- Embedded image has changed

   set_diff_imagechanged(id, type, diffcode) {
      this.id = id;
      this.arttype = type;

      switch (diffcode) {
         case DIFF_IMAGECHANGED:
            this.diffcode = DIFF_IMAGECHANGED;
            this.difflabel = DIFF_LABEL[this.diffcode];
            break;
         case DIFF_IMAGENOTFOUND_NEW:
            this.diffcode = DIFF_IMAGENOTFOUND_NEW;
            this.difflabel = DIFF_LABEL[this.diffcode];
            break;
         case DIFF_IMAGENOTFOUND_OLD:
            this.diffcode = DIFF_IMAGENOTFOUND_OLD;
            this.difflabel = DIFF_LABEL[this.diffcode];
            break;
         default:
            this.diffcode = DIFF_NODIFF;
      };
   }

   // ---- New embedded image

   set_diff_imagenew(id, type, attrname) {
      this.id = id;
      this.arttype = type;
      this.diffcode = DIFF_IMAGENEW;
      this.difflabel = DIFF_LABEL[this.diffcode];
      this.attrname = attrname;
   }

   // ---- Image deleted

   set_diff_imagedel(id, type, attrname) {
      this.id = id;
      this.arttype = type;
      this.diffcode = DIFF_IMAGEDEL;
      this.difflabel = DIFF_LABEL[this.diffcode];
      this.attrname = attrname;
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

   for (let myRefArtefact of modRef.getArtefactList()) {
      let myDiffInfo = new ClassDiffResult();

      if (modTest.get_artefactById(myRefArtefact.getId()) === undefined) {
         // ---- On detecte l'artefact en ecart (existe dans le module de reference, mais pas dans le module a tester)

         if (modRef.getStatus() === IS_NEW) {
            myDiffInfo.set_diff_newartifact(myRefArtefact.getId(), myRefArtefact.getType(), myRefArtefact.getContent());
         } else {
            myDiffInfo.set_diff_delartifact(myRefArtefact.getId(), myRefArtefact.getType(), myRefArtefact.getContent());
         }

         myDiffList.push(myDiffInfo);
      }
   }

   return myDiffList;
}

/**
  * Comparer les attributs entre artefacts
  * @param {Object} artTest - Artefact dont on veut detecter les ecarts
  * @param {Object} artRef - Artefact de reference sur lequel on va boucler
  * @returns {Array} - Tableau d'objets de la classe "ClassDiffResult" (Taille tableau = 0, si pas d'ecart)
  */

function cmp_DiffAttr(artTest, artRef) {
   let myDiffList = [];

   // ---- Iterer sur tous les custom attributs de l'artefact de reference
   // ---- Detecter les cas suivants :
   // ----     - attribut rempli dans la reference, mais pas dans le test
   // ----     - attribut rempli dans la reference et le test (donc, faut comparer les valeurs)

   for (let myAttrRef of artRef.getCustattrList()) {
      let myAttrTest = new ClassAttribute();
      let myDiffInfo = new ClassDiffResult();

      myAttrTest = artTest.get_attributeByName(myAttrRef.name);

      if (myAttrTest === undefined) {
         // ---- L'attribut existe seulement dans la reference

         myDiffInfo.set_diff_attributevaluechanged(artRef.getId(), artRef.getType(), myAttrRef.name, "", myAttrRef.value);
         myDiffList.push(myDiffInfo);
      } else {
         // ---- L'attribut existe dans la reference et le test, il faut donc evaluer l'ecart de valeur
         // ---- Si nombre de valeur est different, alors ecart, sinon faut comparer chaque valeur

         let myValueDiff = myAttrRef.value.filter(x => myAttrTest.value.indexOf(x) === -1);

         if ((myAttrTest.value.length != myAttrRef.value.length) || (myValueDiff.length > 0)) {
            myDiffInfo.set_diff_attributevaluechanged(artRef.getId(), artRef.getType(), myAttrRef.name, myAttrTest.value, myAttrRef.value);
            myDiffList.push(myDiffInfo);
         }
      }
   }

   // ---- Iterer sur tous les custom attributs de l'artefact de test
   // ---- Detecter le cas suivant :
   // ----     - attribut rempli dans le test, mais pas dans la reference

   for (let myAttrTest of artTest.getCustattrList()) {
      let myDiffInfo = new ClassDiffResult();
      let myAttrRef = artRef.get_attributeByName(myAttrTest.name);

      if (myAttrRef === undefined) {
         // ---- L'attribut existe seulement dans le test

         myDiffInfo.set_diff_attributevaluechanged(artTest.getId(), artTest.getType(), myAttrTest.name, myAttrTest.value, "");
         myDiffList.push(myDiffInfo);
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
   let myDiffInfo = new ClassDiffResult();
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
      myDiffInfo.set_diff_tagchanged(artTest.getId(), artTest.getType(), myTagTestList, myTagRefList);
      myDiffList.push(myDiffInfo);
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

   for (let myRefArtefact of modRef.getArtefactList()) {
      let myDiffInfo = new ClassDiffResult();
      let myTestArtefact = modTest.get_artefactById(myRefArtefact.getId());

      // ---- Pour les artefacts communs, on compare le type

      if (myTestArtefact !== undefined && myRefArtefact.getType() !== myTestArtefact.getType()) {
         myDiffInfo.set_diff_artifacttypechanged(myRefArtefact.getId(), myRefArtefact.getType(), myTestArtefact.getType());
         myDiffList.push(myDiffInfo);
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

   for (let myRefArtefact of modRef.getArtefactList()) {
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

   for (let myRefArtefact of modRef.getArtefactList()) {
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
         'artId': diffImgList[i].artId,       // ---- Identifiant de l'artefact dans laquelle se trouve l'image
         'artType': diffImgList[i].artType,     // ---- Type de l'artefact dans laquelle se trouve l'image
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
         'artId': diffImgList[i].artId,       // ---- Identifiant de l'artefact dans laquelle se trouve l'image
         'artType': diffImgList[i].artType,     // ---- Type de l'artefact dans laquelle se trouve l'image
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
         let myDiffInfo = new ClassDiffResult();

         // ---- Image modifiee

         myDiffInfo.set_diff_imagechanged(imgInfo.artId, imgInfo.artType, DIFF_IMAGECHANGED);
         g_DiffList.push(myDiffInfo);
      } else {
         if (g_DiffImgList[imgInfo.imgIdx].refImgDate === CST_NOT_FOUND) { // ----Image de l'artefact de reference a disparu
            let myDiffInfo = new ClassDiffResult();

            myDiffInfo.set_diff_imagechanged(imgInfo.artId, imgInfo.artType, DIFF_IMAGENOTFOUND_NEW);
            g_DiffList.push(myDiffInfo);
         }

         if (g_DiffImgList[imgInfo.imgIdx].testImgDate === CST_NOT_FOUND) { // ----Image de l'artefact de test a disparu
            let myDiffInfo = new ClassDiffResult();

            myDiffInfo.set_diff_imagechanged(imgInfo.artId, imgInfo.artType, DIFF_IMAGENOTFOUND_OLD);
            g_DiffList.push(myDiffInfo);
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
  * @param {Object} modTest - Module dont on veut detecter les ecarts
  * @param {Object} modRef - Module de reference sur lequel on va boucler
  * @returns - Tableau des artefacts en ecart (Taille tableau = 0, si pas d'ecart) - Index = Identifiant artefact en ecart | Contenu = Tableau des attributs en ecart
  */

function cmp_DiffContentArtefact(modTest, modRef) {
   let myDiffList = [];

   for (let myRefArtefact of modRef.getArtefactList()) {
      let myTestArtefact = modTest.get_artefactById(myRefArtefact.getId());
      let myDiffContent;

      if (myTestArtefact != undefined) {
         if (myRefArtefact.getModified() !== myTestArtefact.getModified()) { // ---- Si la date de modification est differente, il est donc possible qu'il y ait des differences de contenu
            if (myRefArtefact.getContent() !== myTestArtefact.getContent()) { // ---- Si le contenu est different, il faut donc faire une comparaison detaillee pour identifier les differences

               mgt_Console(cmp_DiffContentArtefact.name + " : Artifact '" + myRefArtefact.getId() + "' has different content", CONSOLE_INFO);

               myDiffContent = compare_RichTextContent(myRefArtefact.getContent(true), myTestArtefact.getContent(true));

               if (myDiffContent.isEqual === false && myDiffContent.diffHtml !== null) {
                  let myDiffInfo = new ClassDiffResult();

                  myDiffInfo.set_diff_contentchanged(myRefArtefact.getId(), myRefArtefact.getType(), myDiffContent.diffHtml);
                  myDiffList.push(myDiffInfo);
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

   for (let myRefArtefact of modRef.getArtefactList()) {
      let myTestArtefact = modTest.get_artefactById(myRefArtefact.getId());

      // ---- Identifier toutes les images contenues dans le Primary Text et voir si elles ont ete modifiees
      // ---- Les differents cas de figure a prendre en compte :
      // ----     - l'image existe dans l'artefact de reference et dans l'artefact de test, il daut donc detecter si elle a ete modifiee
      // ----     - l'image existe seulement dans l'artefact de reference, c'est donc une nouvelle image
      // ----     - l'image existe seulement dans l'artefact de test, c'est donc qu'elle a ete supprimee de l'artefact de reference

      if (myTestArtefact !== undefined) {
         myRefImgList = myRefArtefact.get_imageList();
         myTestImgList = myTestArtefact.get_imageList();

         for (let myId in myRefImgList) {
            let myDiffInfo = new ClassDiffResult();
            let myImgDiff = {
               'artId': myRefArtefact.getId(),
               'artType': myRefArtefact.getType(),
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
               myDiffInfo.set_diff_imagenew(myRefArtefact.getId(), myRefArtefact.getType(), myRefArtefact.attrname);
               myFctReturnStr.diffList.push(myDiffInfo);

               mgt_Console("New image in '" + myRefArtefact.getId() + "'", CONSOLE_INFO);
            }
         }

         // ---- Images supprimees de l'artefact de referenceBen

         for (let myId in myTestImgList) {
            let myDiffInfo = new ClassDiffResult();

            if (myRefImgList[myId] === undefined) {
               myDiffInfo.set_diff_imagedel(myRefArtefact.getId(), myRefArtefact.getType(), myRefArtefact.attrname);
               myFctReturnStr.diffList.push(myDiffInfo);

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
