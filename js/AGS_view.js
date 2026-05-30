/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | 28/01/2021 |   Safran       | Initial version                      |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
   ---- Constantes
   --------------------------------------------------------------------------- */

// ---- GUI Objects and Objects Root

const GUI_ITEM_ALERT_ROOT = "gui_alert";

const GUI_BLCK_PROJECT = "gui_blckproject";
const GUI_ITEM_PROJECT_BTN_ROOT = "gui_project";
const GUI_ITEM_PROJECTIND_ROOT = "gui_projectInd";

const GUI_BLCK_COMPONENT = "gui_blckcomponent";
const GUI_ITEM_COMPONENT_BTN_ROOT = "gui_component";
const GUI_ITEM_COMPONENTIND_ROOT = "gui_componentInd";

const GUI_BLCK_OLDCONFIG = "gui_blckoldconfig";
const GUI_ITEM_OLDCONFIG_BTN_ROOT = "gui_oldconfig";
const GUI_ITEM_OLDCONFIGIND_ROOT = "gui_oldconfigInd";
const GUI_ITEM_OLDMODULE_BTN_ROOT = "gui_oldmodule";
const GUI_ITEM_OLDMODULEIND_ROOT = "gui_oldmoduleInd";
const GUI_BLCK_OLDREQIF = "gui_blckoldreqif";

const GUI_BLCK_NEWCONFIG = "gui_blcknewconfig";
const GUI_ITEM_NEWCONFIG_BTN_ROOT = "gui_newconfig";
const GUI_ITEM_NEWCONFIGIND_ROOT = "gui_newconfigInd";
const GUI_ITEM_NEWMODULE_BTN_ROOT = "gui_newmodule";
const GUI_ITEM_NEWMODULEIND_ROOT = "gui_newmoduleInd";
const GUI_BLCK_NEWREQIF = "gui_blcknewreqif";
const GUI_ITEM_NEWREQIFLOAD = "gui_newreqifload";
const GUI_ITEM_NEWREQIFLOADIND_ROOT = "gui_newreqifloadInd";

const GUI_ITEM_LOADMODULE_BTN_ROOT = "gui_loadmodule";
const GUI_ITEM_COMPARE_BTN_ROOT = "gui_compare";
const GUI_ITEM_EXPORT_BTN_ROOT = "gui_export";
const GUI_ITEM_EXPORTCOMPACT_BTN_ROOT = "gui_exportCompact";
const GUI_ITEM_DISPLAYDIFF_BTN_ROOT = "gui_displaydiff";
const GUI_ITEM_COMPAREMODE_BTN_ROOT = "gui_compareMode";

// ---- HTML Templates

const TEMPL_COMPARE_STAT = "templ-compare-stat";

// ---- Report Columns Name

const RPT_COL_ID = 0;
const RPT_COL_TYPE = 1;
const RPT_COL_DIFFLABEL = 2;
const RPT_COL_ATTR = 3;
const RPT_COL_OLDVAL = 4;
const RPT_COL_NEWVAL = 5;
const RPT_COL_DIFFCONTENT = 6;

/* --------------------------------------------------------------------------- */

const GUI_ITEM_oldstatdiv = "gui_olddivstat";
const GUI_ITEM_newstatdiv = "gui_newdivstat";
const GUI_ITEM_newcellstat = "gui_newcellstat";
const GUI_ITEM_newloadingcellstat = "gui_newloadingcellstat";

const GUI_ITEM_diffzone = "gui_diffzone";
const GUI_ITEM_diffresult = "gui_diffresult";
const GUI_ITEM_diffmodal = "gui_diffmodal";
const GUI_ITEM_tmpexport = "gui_tmpexport";

const GUI_RED_COLOR = "red";
const GUI_GREEN_COLOR = "green";
const GUI_BLACK_COLOR = "black";

const GUI_ICON_STREAM = "./resources/rm_stream_icon.png";
const GUI_ICON_BASELINE = "./resources/rm_baseline_icon.png";
const GUI_ICON_COMPONENT = "./resources/rm_component_icon.png";
const GUI_ICON_MODULE = "./resources/rm_module_icon.png";

const IS_OLD = "OLD";
const IS_NEW = "NEW";

const PAGE_SIZE = 20; // ---- Nombre maximum d'artefacts à retourner par requete

const COMPARE_MODE_LOCALLOCAL = 0; // ---- local configuration vs local configuration
const COMPARE_MODE_LOCALREQIF = 1; // ---- local configuration vs ReqIF
const COMPARE_MODE_REQIFREQIF = 2; // ---- local ReqIF vs ReqIF
// ---- For future implementation : const COMPARE_MODE_LABEL = ["Local Conf", "Local Conf vs ReqIF", "ReqIF"];
const COMPARE_MODE_LABEL = ["Local Conf"];

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

class ClassProject {           // ---- Caracteristiques d'un projet JAZZ
   name = ""                   // ---- Nom du projet
   url = ""                    // ---- URL du projet
   id = ""                     // ---- Identifiant du projet

   /**
    * Réinitialiser l'objet
    */

   empty() {
      this.name = "";
      this.url = "";
      this.id = "";
   }
}

class ClassComponent {         // ---- Caracteristiques d'un composant JAZZ
   name = ""                   // ---- Nom du composant
   url = ""                    // ---- URL du composant
   id = ""                     // ---- Identifiant du composant

   /**
    * Réinitialiser l'objet
    */

   empty() {
      this.name = "";
      this.url = "";
      this.id = "";
   }
}

class ClassConfiguration {     // ---- Caracteristiques d'une configuration JAZZ
   name = ""                   // ---- Nom de la configuration
   description = ""            // ---- Description de la configuration
   url = ""                    // ---- URL de la configuration
   id = ""                     // ---- Identifiant de la configuration
   type = ""                   // ---- Type de condiguration : stream ou baseline

   /**
    * Réinitialiser l'objet
    */

   empty() {
      this.name = "";
      this.description = "";
      this.url = "";
      this.id = "";
      this.type = "";
   }

   /**
    * Affecter une configuration a partir d'une liste
    * @param {Array} confList - Table d'objets de type "Configuration"
    * @param {String} confId - Identifiant de la configuration
    */

   set(confList, confId) {
      for (let myConf of confList) {
         if (confId === myConf.id) {
            this.name = myConf.name;
            this.description = myConf.description;
            this.url = myConf.url;
            this.id = myConf.id;
            this.type = myConf.type;
            break;
         }
      }
   }
}

class ClassAttribute {         // ---- Caracteristiques d'un attribut
   name = ""                   // ---- Nom de l'attribut
   type = ""                   // ---- Type de l'attribut (URI du type)
   isenum = ""                 // ---- Est une enumeration
   ismultivalue = ""           // ---- Est multivalue
   value = []                  // ---- Tableau des valeurs possibles de l'attribut
}

class ClassArtefact {          // ---- Caracteristiques d'un artefact

   constructor() {
      this.id = ""                     // ---- Identifiant artefact
      this.uri = ""                    // ---- URI artefact
      this.format = ""                 // ---- Format de l'artefact
      this.modified = ""               // ---- Date de modification
      this.content = ""                // ---- Contenu ("Contents")
      this.type = ""                   // ---- Type artefact
      this.bookorder = ""              // ---- Position in module hierarchy
      this.custattr_list = []          // ---- Liste des attributs (liste d'objets de la classe "ClassAttribute")
      this.tag_list = []               // ---- Liste des tags (Tag Value + Tag Scope)
      this.joinedfile_list = []        // ---- Liste des pieces jointes de l'artefact (images, autres fichiers ...)
   }

   // ---- Getters et Setters : new code structure with constructor and methods instead of direct access to properties
   // ---- 30/05/2026 : This new code structure with constructor and methods allows to better control the access to the properties of the class and to add some logic if needed (for example, for the content property, we can add a cleaning function to keep only the relevant content for comparison between source and target artifacts)

   get_id() {
      return this.id;
   }

   get_type() {
      return this.type;
   }

   get_modified() {
      return this.modified;
   }

   get_content(cleaned = false) { // ---- Get the content of the artifact, with the possibility to clean the content for a more relevant comparison between source and target artifacts if the cleaned parameter is set to true (we keep only the text and basic formatting (paragraphs, lists, tables) and we remove all the other HTML tags and attributes that are not relevant for the content comparison)
      if (!cleaned) {
         return this.content;
      } else { // ---- We clean the content to keep only the text and basic formatting (paragraphs, lists, tables) for a more relevant comparison of the content between source and target artifacts (we remove all the other HTML tags and attributes that are not relevant for the content comparison)
         const $wrapper = $('<div>').html(this.content); // ---- We wrap the content in a div to be able to manipulate it with jQuery
         const $innerDiv = $wrapper.find('div[xmlns]');

         if ($innerDiv.length === 0) { // ---- No inner div with xmlns found, we consider that the content is not wrapped in a div with xmlns and we clean the content from all HTML tags except paragraphs, lists and tables
            return $wrapper.find('div').last().html().trim();
         }

         return "<html><body><div>" + $innerDiv.html().trim() + "</div></body></html>";
      }
   }

   // ---- End of Getters and Setters


   /**
    * Rechercher un attribut par son nom
    * @param {String} name - Nom de l'artefact
    * @returns {Object} - Objet de type "ClassAttribute"
    */

   get_attributeByName(name) {
      return this.custattr_list.find(attribute => attribute.name === name);
   }

   /**
   * Get images embedded in artifact content
   * @returns - Array with images embedded in artifact content (If size = 0, no image) - Index = Image URI | Content = Image URL
   */

   get_imageList() {
      let myImgList = [];
      let myMatch = [];

      // ---- Expression reguliere initiale : voir si on conserve ou bien si on continue avec la nouvelle qui semble + simple et performante
      // ---- const regexp  = /<img\s+[^>]*?src=("|')([^"']+)\1/gmi; // ---- Groupe n° 2 = URI de l'image

      // ---- Extraire le contenu des balises <img ... />

      const regexp = /<img[^>]+src=("|')([^"']+)("|')[^>]*>/gmi; // ---- Groupe n° 2 = URI de l'image

      while ((myMatch = regexp.exec(this.content)) !== null) {

         // ---- /\ : élargir la recherche à d'autre type de ressources embarquees (autres que images) ?

         const regexp2 = /https.+wrappedResources\/(.+)\?.+/g; // ---- Groupe n° 1 = Identifiant de l'image

         let myImgId;
         let myMatch2 = [];

         // ---- This is necessary to avoid infinite loops with zero-width matches

         if (myMatch.index === regexp.lastIndex) {
            regexp.lastIndex++;
         }

         myMatch2 = regexp2.exec(myMatch[2]);

         if (myMatch2 !== null) {
            myImgId = myMatch2[1];
            myImgList[myImgId] = myMatch[2];
         }
      }

      return myImgList;
   }

   /**
   * Remove <img ... /> tag from artifact content
   * @returns {String} - Modified content
   */

   remove_embeddedImgURL() {
      const regexp = /<img[^>]+src=("|')([^"']+)("|')[^>]*>/gmi; // ---- Groupe n° 0 = balise complete | Groupe n° 2 = URI de l'image

      let myNewContent = this.content;
      let myMatch;

      while ((myMatch = regexp.exec(this.content)) !== null) {
         if (myMatch.index === regexp.lastIndex) {
            regexp.lastIndex++;
         }

         // ---- Dans le code HTML, supprimer toute reference à des images externes

         myNewContent = myNewContent.replace(myMatch[0], '<b>--- EMBEDDED IMAGE ---</b>');
      }

      return myNewContent;
   }

   /**
    * Verifier l'existence d'un tag
    * @param {String} value - Tag value
    * @param {String} scope - Tag scope (public or shared), optional
    * @returns - True if tag exists, otherwise false
    */

   find_tag(value, scope) {
      let myTag = this.tag_list.find(tag => tag.value === value);

      if (myTag !== undefined) { // ---- Tag value exists
         if (scope !== undefined) { // ---- If scope available, check it
            return ((myTag.scope === scope) ? true : false);
         } else {
            return true;
         }
      } else {
         return false;
      }
   }

   /**
    * Concat tags applied on artefact
    * @returns {String} - List of tags
    */

   concat_tag() {
      let myTagList = "";
      let myTagFmt;

      for (let myTag of this.tag_list) {
         myTagFmt = myTag.value + "(" + myTag.scope + ")";

         if (myTagList.length > 0) {
            myTagList = myTagList + ";" + myTagFmt;
         } else {
            myTagList = myTagFmt;
         }
      }

      return myTagList;
   }

   /**
    * Initialiser l'objet à partir de données provenant d'une structure reqIF
    * @param {Array of ReqIFArtefact} reqifArtifact - Artefact à convertir
    * @param {Array of ReqIFArtefact} reqifArtifactList - Liste des artefacts
    * @param {Array of ReqIFArtefactType} reqifArtifactTypeList - Liste des type d'artefacts
    * @param {Array of ReqIFDataType} reqifDataTypeList - Liste des types de données
    */

   get_datareqif(reqifArtifact, reqifArtifactList, reqifArtifactTypeList, reqifDataTypeList) {
      let myReqifArtifact;
      let myReqifType;

      // ---- Identifier le type d'artefact

      myReqifArtifact = reqifArtifactList.find(artifact => artifact.id === reqifArtifact);
      myReqifType = reqifArtifactTypeList.find(type => type.id === myReqifArtifact.typeid);

      this.type = myReqifType.name;

      // ---- Liste des attributs

      for (let myAttribute of myReqifType.attrlist) {
         switch (myAttribute.name) {
            case REQIF_REQIF_FOREIGNID:

               break;

            case REQIF_REQIF_FOREIGNCREATEDON:

               break;

            default: // ---- Custom Attributes
         }
      }

   }
}

class ClassJoinedFile {        // ---- Caracteristiques d'une piece jointe a un artefact
   id = ""                     // ---- Identifiant de la piece jointe
   uri = ""                    // ---- URI de la piece jointe
   type = ""                   // ---- Type de piece jointe (image, autres fichiers ...)
   modified = undefined        // ---- Date de modification

   set(uri) {

      // ---- Le type et l'id de la piece jointe seront etablis a partir de l'URI qui transporte les informations associees

      // ---- this.id = expression reguliere a partir de l'uri
      // ---- this.type =
   }

}

class ClassModule {            // ---- Caracteristiques d'un module JAZZ
   name = ""                   // ---- Nom du module
   url = ""                    // ---- URL du module
   id = ""                     // ---- Identifiant du module (identifiant interne "rm")
   iddng = 0                   // ---- Identifiant du module (identifiant externe visible dans les vues)
   modified = ""               // ---- Date de dernière modification
   status = ""                 // ---- Status du module ("New" ou "Old"), defini a la creation de l'objet
   format = ""                 // ---- Format "Collection" ou "Module"
   artefact_list = []          // ---- Liste des artefacts (liste d'objets de la classe "ClassArtefact")
   attributecust_list = []      // ---- Liste de tous les "Custom Attributes" detectes dans le module
   artefacttype_list = []      // ---- Liste des tous les types d'artefacts et leur nombre - Index = type d'artefact / Contenu = nombre
   nbpage = 0                  // ---- Nombre de pages du module
   pagepos = 0                 // ---- Position de pagination
   conf = undefined            // ---- Configuration du module (objet de la classe "ClassConfiguration")

   constructor(modStatus) {
      if (modStatus != undefined) {
         this.status = modStatus;
      }
   }

   /**
    * Réinitialiser totalement l'objet
    */

   empty() {
      this.name = "";
      this.url = "";
      this.id = "";
      this.iddng = 0;
      this.modified = "";
      this.nbpage = 0;
      this.pagepos = 0;
      this.conf = undefined;

      this.empty_artifact();
   }

   /**
    * Vider le contenu de l'objet (artefacts, types d'artefacts ...)
    */

   empty_artifact() {
      this.nbpage = 0;
      this.pagepos = 0;

      this.artefact_list.splice(0);
      this.attributecust_list.splice(0);

      for (let myArtefactType in this.artefacttype_list) {
         this.artefacttype_list[myArtefactType] = 0;
      }
   }

   /**
    * Affecter un module a partir d'une liste
    * @param {Array} modList - Table d'objets de type "Module"
    * @param {String} modId - Identifiant du module
    * @param {Object} confObj - Objet de type "ClassConfiguration" correspondant a la configuration du module (optionnel)
    */

   set(modList, modId, confObj) {
      for (let myMod of modList) {
         if (modId === myMod.id) {
            this.name = myMod.name;
            this.url = myMod.url;
            this.id = myMod.id;
            this.iddng = myMod.iddng;
            this.modified = myMod.modified;
            break;
         }
      }

      if (confObj !== undefined) {
         this.conf = confObj;
      }
   }

   /**
    * Analyser la structure XML d'un module et la stocker
    * @param {String} data - XML Structure
    */

   get_data(data) {
      let mySelf = this;
      let xmlData = $.parseXML(data);
      let myHref;
      let myPos = [];

      this.nbpage++;

      // ---- Recuperer les informations de pagination (si la recuperation du module est paginee)

      myHref = $(xmlData).find('ds\\:dataSource').attr('href');

      if (myHref != undefined) {
         myHref = decodeURIComponent(myHref);
         myPos = myHref.match(/^https.+(&pos=([0-9]+)).*/);

         this.pagepos = myPos[2];
      }

      // ---- Decoder le contenu de la reponse REST

      $(xmlData).find('ds\\:artifact').each(function () { // ---- Boucler sur chaque artefact
         let myXmlObj;
         let myArtefactId = $(this).find('rrm\\:identifier').first().text();
         let myArtefactOrder = $(this).find('ds\\:moduleContext').find('rrm\\:contextBinding').find('rrm\\:bookOrder').first().text();
         let myArtefact;
         let pushArtefact = false;

         // ---- 2 modes de fonctionnements sont admis :
         // ----     - la structure du module a été préchargée, et dans ce cas il faut se contenter de retrouver l'ID de l'artefact
         // ----       et compléter les caractéristiques de celui-ci
         // ----     - si la structure est incomplète, l'artefact sera alors ajoutée à la liste des artefacts constituants le module

         myArtefact = mySelf.get_artefactById(myArtefactId, myArtefactOrder);

         if (myArtefact === undefined) { // ---- Artefact introuvable dans la structure préchargée
            myArtefact = new ClassArtefact();
            pushArtefact = true;

            myArtefact.id = myArtefactId;
            myArtefact.uri = $(this).find('rrm\\:about').first().text();
            myArtefact.format = $(this).find('rrm\\:format').first().text();
            myArtefact.bookorder = myArtefactOrder;
         }

         myArtefact.modified = $(this).find('rrm\\:collaboration').find('rrm\\:modified').text();
         myArtefact.content = $(this).find('ds\\:content').find('text\\:text').find('text\\:richTextBody').find('div').html();

         myXmlObj = $(this).find('rrm\\:collaboration').find('rrm\\:attributes').find('attribute\\:objectType');
         myArtefact.type = $(myXmlObj).attr('attribute:name');

         if (myArtefact.type in mySelf.artefacttype_list) { // ---- Le type d'artefact est dans la liste : incrementer son compteur
            mySelf.artefacttype_list[myArtefact.type]++;
         } else { // ---- Le type d'artefact n'est dans la liste : empiler le type et initialiser son compteur
            mySelf.artefacttype_list[myArtefact.type] = 1;
         }

         // ---- Boucler sur tous les Custom Attributs de l'artefact et recuperer les caracteristiques

         $(myXmlObj).find('attribute\\:customAttribute').each(function () {
            let myCustAttribute = new ClassAttribute();
            let myEnumCustAttribute = new ClassAttribute();

            myCustAttribute.name = $(this).attr('attribute:name');
            myCustAttribute.type = $(this).attr('attribute:datatype');
            myCustAttribute.isenum = $(this).attr('attribute:isEnumeration');
            myCustAttribute.ismultivalue = $(this).attr('attribute:isMultiValued');

            if (myCustAttribute.isenum === undefined || myCustAttribute.isenum === 'false') {
               // ---- L'attribut n'est pas une enumeration

               myCustAttribute.value.push($(this).attr('attribute:value'));

               myArtefact.custattr_list.push(myCustAttribute);
            } else {
               // ---- L'attribut est une enumeration

               myEnumCustAttribute = myArtefact.get_attributeByName(myCustAttribute.name);

               if (myEnumCustAttribute === undefined) {
                  // ---- Il n'est pas encore connu de l'artefact, on peut donc l'ajouter

                  myCustAttribute.value.push($(this).attr('attribute:literalName'));

                  myArtefact.custattr_list.push(myCustAttribute);
               } else {
                  // ---- Il est connu de l'artefact, donc on empile seulement sa valeur

                  myEnumCustAttribute.value.push($(this).attr('attribute:literalName'));
                  myEnumCustAttribute.value.sort();
               }
            }

            // ---- Empiler le nom du Custom Attribut, s'il n'existe pas dans la liste globale

            if (mySelf.attributecust_list.indexOf(myCustAttribute.name) < 0) {
               mySelf.attributecust_list.push(myCustAttribute.name);
            }
         });

         // ---- Boucler sur tous les tags

         myXmlObj = $(this).find('rrm\\:collaboration').find('rrm\\:tags');

         $(myXmlObj).find('rrm\\:tag').each(function () {
            let myTag = {
               value: "",
               scope: ""
            };

            myTag.value = $(this).find('rrm\\:title').first().text();
            myTag.scope = $(this).find('rrm\\:scope').first().text();

            // ---- DNG s'assure qu'il n'y ait pas de doublon de tags

            myArtefact.tag_list.push(myTag);
         });

         // ---- Stocker l'artefact dans l'objet

         if (pushArtefact) {
            mySelf.artefact_list.push(myArtefact);
         }
      });
   }

   /**
    * Initialiser l'objet à partir de données provenant d'une structure reqIF
    * @param {Object ReqIFModule} reqifModule - Structure du module
    * @param {Array of ReqIFArtefact} reqifArtifactList - Liste des artefacts
    * @param {Array of ReqIFArtefactType} reqifArtifactTypeList - Liste des type d'artefacts
    * @param {Array of ReqIFDataType} reqifDataTypeList - Liste des types de données
    */

   get_datareqif(reqifModule, reqifArtifactList, reqifArtifactTypeList, reqifDataTypeList) {

      // ---- Modules characteristics

      this.name = reqifModule.name;
      this.iddng = reqifModule.get_attrvaluebyname(REQIF_REQIF_FOREIGNID, reqifArtifactTypeList, reqifDataTypeList);
      this.modified = reqifModule.get_attrvaluebyname(REQIF_REQIF_FOREIGNMODIFIEDON, reqifArtifactTypeList, reqifDataTypeList);

      // ---- Artifacts characteristics

      for (let myReqifArtifact of reqifModule.artefactlist) {
         let myArtifact = new ClassArtefact();

         myArtifact.get_datareqif(myReqifArtifact, reqifArtifactList, reqifArtifactTypeList, reqifDataTypeList);

         this.artefact_list.push(myArtifact);
      }
   }

   /**
    * Analyser la structure XML représentant la structure du module
    * @param {String} data - XLM Structure
    */

   get_structure(data) {
      let mySelf = this;
      let xmlData = $.parseXML(data);

      // ---- Decoder le contenu de la reponse REST

      $(xmlData).find('rrm\\:contextBinding').each(function () { // ---- Boucler sur chaque artefact
         let myArtefact = new ClassArtefact();

         myArtefact.id = $(this).find('rrm\\:identifier').first().text();
         myArtefact.uri = $(this).find('rrm\\:about').first().text();
         myArtefact.format = $(this).find('rrm\\:format').first().text();
         myArtefact.bookorder = $(this).find('rrm\\:bookOrder').first().text();

         // ---- Store artefact short representation

         mySelf.artefact_list.push(myArtefact);
      });
   }

   /**
    * Rechercher un artefact par son identifiant
    * @param {String} id - Identifiant de l'artefact
    * @param {String} order - Ordre de l'artefact (Book Order)
    * @returns {Object} - Objet artefact 
    */

   get_artefactById(id, order) {
      if (order !== undefined) {
         return this.artefact_list.find(artefact => artefact.id === id && artefact.bookorder === order);
      } else {
         return this.artefact_list.find(artefact => artefact.id === id);
      }
   }

   /**
    * Compter le nombre d'artefact dans le module
    */

   artefactCount() {
      return this.artefact_list.length;
   }
}

/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */

var g_ProjectList = [];                       // ---- Liste des projets DNG
var g_Project = new ClassProject();      // ---- Projet selectionne
var g_ComponentList = [];                       // ---- Liste des composants DNG
var g_Component = new ClassComponent();    // ---- Composant selectionne
var g_ConfList = [];                       // ---- Liste des configurations d'un composant
var g_ConfOld = new ClassConfiguration() // ---- Configuration Old selectionnee
var g_ConfNew = new ClassConfiguration() // ---- Configuration New selectionnee
var g_ModuleOldList = [];                       // ---- Liste des modules de la configuration Old
var g_ModuleOld = new ClassModule(IS_OLD); // ---- Module Old selectionne
var g_ModuleNewList = [];                       // ---- Liste des modules de la configuration New
var g_ModuleNew = new ClassModule(IS_NEW); // ---- Module New selectionne

var g_DiffList = [];                      // ---- Tableau des resultats de comparaison

var g_DiffImgList = [];                      // ---- Tableau d'images a comparer
var g_DiffImgCpt = 0;                       // ---- Compteur d'image a comparer

var g_DiffTable;                                // ---- DataTable contenant le rapport de comparaison

var g_CompareMode = COMPARE_MODE_LOCALLOCAL; // ---- Default Compare Mode

/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------- */
/*
   ---- Methodes sur objets GUI
   ----     1/ gui_Build   : construire l'objet
   ----     2/ gui_Select  : capter la selection de l'objet
   ----     3/ gui_Init    : réinitialiser l'objet
   ----     4/ gui_Fail    : indicateur de probleme de chargement
 */

/* ---- Project -------------------------------------------------------------- */

/**
 * Construire le contenu du bouton de sélection d'un projet si reponse REST = OK
 * @param {String} data - Reponse REST contenant la liste des projets sous forme de structure XML
 */

function gui_BuildProjectBtn(data) {
   let xmlData = $.parseXML(data);
   let myItem = [];

   g_Project.empty();
   g_ProjectList.splice(0);

   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, ACTION_DISP_OFF);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, ACTION_DISP_OFF);


   // ---- Decoder le contenu de la reponse REST

   $(xmlData).find('jp06\\:project-area').each(function () {
      let myPrj = new ClassProject();
      let myPrjId = [];

      myPrj.name = $(this).attr('jp06:name');              // ---- Nom du projet
      myPrj.url = $(this).find('jp06\\:url').text();      // ---- URL du projet
      myPrjId = myPrj.url.match(/^https.+\/(.+)/);      // ---- Identifiant du projet
      myPrj.id = myPrjId[1];

      // ---- Stocker caracteristiques du projet dans la liste globale

      g_ProjectList.push(myPrj);
   });

   // ---- Trier les projets et construire le bouton

   if (g_ProjectList.length === 1) { // ---- 1 seul element, donc rien a trier
      myItem.push('<li id="' + g_ProjectList[0].id + '" onclick="gui_SelectProject (this)"><a class="dropdown-item">' + g_ProjectList[0].name + '</a></li>');
   } else if (g_ProjectList.length > 1) {
      g_ProjectList.sort((a, b) => (a.name > b.name) ? 1 : -1);

      for (let i = 0; i < g_ProjectList.length; i++) {
         myItem.push('<li id="' + g_ProjectList[i].id + '" onclick="gui_SelectProject (this)"><a class="dropdown-item">' + g_ProjectList[i].name + '</a></li>');
      }
   }

   gui_mgtButtonDrop(GUI_ITEM_PROJECT_BTN_ROOT, ACTION_SETCONTENT, myItem);

   // ---- Activer le bouton 

   gui_mgtButtonDrop(GUI_ITEM_PROJECT_BTN_ROOT, ACTION_ACTIVE_ON);
}

/**
 * Afficher le nom du projet selectionne
 * @param {Object} object - Objet IHM selectionne par l'utilisateur
 */

function gui_SelectProject(object) {

   // ---- Sauvegarder l'identifiant du projet selectionne

   for (let i = 0; i < g_ProjectList.length; i++) {
      if (g_ProjectList[i].id == object.id) {
         g_Project = g_ProjectList[i];
         break;
      }
   }

   gui_mgtButtonDrop(GUI_ITEM_PROJECT_BTN_ROOT, ACTION_SETLABEL, g_Project.name)
   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, IS_SUCCESS);

   // ---- Reinitialiser les items dependants

   gui_InitComponentBtn();

   // ---- Etablir la liste des composants du projet

   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, IS_INPROGRESS);

   BuildComponentList(g_Project.id);
}

/**
 * Initialiser le bouton de sélection d'un projet si reponse REST = KO
 */

function gui_InitProjectBtn() {

   // ---- Reinitialiser le bouton et ses dependances

   gui_mgtButtonDrop(GUI_ITEM_PROJECT_BTN_ROOT, ACTION_INIT, "Select the project");

   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, ACTION_DISP_OFF);

   $("#" + GUI_ITEM_diffzone).empty();
   $("#" + GUI_ITEM_diffzone).hide();

   g_Project.empty();

   // ---- Reinitialiser les items dependants

   gui_InitComponentBtn();
}

/**
 * Afficher un indicateur de probleme de chargement du bouton
 */

function gui_FailProjectBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_PROJECT_BTN_ROOT, ACTION_ACTIVE_OFF);

   // ---- Indiquer que le chargement du bouton a echoue

   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, IS_ERROR);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_ERROR, "<strong>ERROR : </strong> Projects list not loaded !");

   // ---- Reinitialiser les items dependants

   gui_InitComponentBtn();
}

/* ---- Component ------------------------------------------------------------ */

/**
 * Construire le contenu du bouton de sélection d'un composant si reponse REST = OK
 * @param {String} data - Reponse REST contenant la liste des composants sous forme de structure XML
 */

function gui_BuildComponentBtn(data) {
   let xmlData = $.parseXML(data);
   let myItem = [];

   // ---- Reinitialiser les information relatives aux composants

   g_Component.empty();
   g_ComponentList.splice(0);

   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, ACTION_DISP_OFF);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, ACTION_DISP_OFF);

   // ---- Decoder le contenu de la reponse REST

   $(xmlData).find('jp06\\:project-area').each(function () {
      let myComp = new ClassComponent();
      let myCompId = [];

      myComp.name = $(this).attr('jp06:name');                       // ---- Nom du composant
      myComp.url = $(this).find('jp06\\:url').text();               // ---- URL du composant
      myCompId = myComp.url.match(/^https.+\/components\/(.+)/);  // ---- Identifiant du composant
      myComp.id = myCompId[1];

      // ---- Stocker caracteristiques du projet dans la liste globale

      g_ComponentList.push(myComp);
   });

   // ---- Trier les composants et construire le bouton

   g_ComponentList.sort((a, b) => (a.name > b.name) ? 1 : -1);

   for (let myComponent of g_ComponentList) {
      myItem.push('<li id="' + myComponent.id + '" onclick="gui_SelectComponent (this)"><a class="dropdown-item"><img src="' + GUI_ICON_COMPONENT + '" alt="Component"> ' + myComponent.name + '</a></li>');
   }

   // ---- Activer le bouton s'il existe des composants

   if (g_ComponentList.length > 0) {
      gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_SETCONTENT, myItem);
      gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_ACTIVE_ON);
   } else {
      gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_ACTIVE_OFF);
      gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, IS_WARNING);
      gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_WARNING, "<strong>WARNING : </strong> No component found in the selected project !")
   }
}

/**
 * Afficher le nom du composant selectionne
 * @param {Object} object - Objet IHM selectionne par l'utilisateur
 */

function gui_SelectComponent(object) {

   // ---- Sauvegarder l'identifiant du composant selectionne

   for (let i = 0; i < g_ComponentList.length; i++) {
      if (g_ComponentList[i].id == object.id) {
         g_Component = g_ComponentList[i];
         break;
      }
   }

   gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_SETLABEL, '<img src="' + GUI_ICON_COMPONENT + '" alt="Component"> ' + g_Component.name);
   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, IS_SUCCESS);

   // ---- Reinitialiser les items dependants

   gui_InitConfBtn();

   // ---- Etablir la liste des configurations (streams, baselines ...)

   gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, IS_INPROGRESS);
   gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, IS_INPROGRESS);

   BuildConfList(g_Component.id);
}

/**
 * Initialiser le bouton de sélection d'un composant si reponse REST = KO
 */

function gui_InitComponentBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_INIT, "Select the component");

   // ---- Reinitialiser le bouton et ses dependances

   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, ACTION_DISP_OFF);

   g_Component.empty();

   // ---- Ses dependances

   gui_InitConfBtn();
}

/**
 * Afficher un indicateur de probleme de chargement du bouton
 */

function gui_FailComponentBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_ACTIVE_OFF);

   // ---- Indiquer que le chargement du bouton a echoue

   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, IS_ERROR);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_ERROR, "<strong>ERROR : </strong> Components list not loaded !");

   // ---- Reinitialiser les items dependants

   gui_InitConfBtn();
}

/* ---- Configurations ------------------------------------------------------- */

/**
 * Construire le contenu du bouton de sélection d'une configuration si reponse REST = OK
 * @param {String} data - Reponse REST contenant la liste des configurations sous forme de structure XML
 */

function gui_BuildConfBtn(data) {
   let xmlData = $.parseXML(data);

   // ---- Reinitialiser les information relatives aux configurations

   g_ConfOld.empty();
   g_ConfNew.empty();
   g_ConfList.splice(0);

   gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, ACTION_DISP_OFF);
   gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, ACTION_DISP_OFF);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, ACTION_DISP_OFF);

   // ---- Decoder le contenu de la reponse REST
   // ----
   // ---- <rdf:Description rdf:about="https://jazz:9443/rm/cm/component/_9AiQMCr4EeuJ8b5wb92nYg/configurations">
   // ----    <rdfs:member rdf:resource="https://jazz:9443/rm/cm/stream/_IgZwUCr6EeuJ8b5wb92nYg"/>
   // ----    <rdfs:member rdf:resource="https://jazz:9443/rm/cm/baseline/_4ETxUCr5EeuJ8b5wb92nYg"/>
   // ----    <rdfs:member rdf:resource="https://jazz:9443/rm/cm/stream/_9A_jMCr4EeuJ8b5wb92nYg"/>
   // ---- </rdf:Description>

   $(xmlData).find('rdfs\\:member').each(function () {
      let myConf = new ClassConfiguration();
      let myConfId = [];

      // ---- A ce stade, nous n'avons pas encore le nom de la configuration

      myConf.url = $(this).attr('rdf:resource');                     // ---- URL de la configuration
      myConfId = myConf.url.match(/^https.+\/rm\/cm\/(.+)\/(.+)/); // ---- Extraire type et identifiant de configuration
      myConf.type = myConfId[1];
      myConf.id = myConfId[2];
      myConf.name = myConf.id;

      // ---- Stocker caracteristiques du projet dans la liste globale

      g_ConfList.push(myConf);
   });

   // ---- Mise à jour de la liste des configurations (recherche du nom réel de chaque configuration)

   for (let myConf of g_ConfList) {
      UpdateConfList(myConf);
   }

   // ---- Trier la liste des configurations et construire le bouton

   g_ConfList.sort(compareName);

   for (let myConf of g_ConfList) {
      let myItem;
      let myConfIcon;

      if (myConf.name != myConf.id) { // ---- Si Name = ID, il s'agit d'une configuration archivée pour laquelle la résolution n'a pu être faite

         // ---- Construire le bouton

         if (myConf.type === "stream") {
            myConfIcon = '<img src="' + GUI_ICON_STREAM + '" alt="Stream"> ';
         } else {
            myConfIcon = '<img src="' + GUI_ICON_BASELINE + '" alt="Baseline"> ';
         }

         myItem = '<li id="_old' + myConf.id + '" onclick="gui_SelectConf (this)"><a class="dropdown-item">' + myConfIcon + myConf.name + '</a></li>';
         gui_mgtButtonDrop(GUI_ITEM_OLDCONFIG_BTN_ROOT, ACTION_APPENDCONTENT, myItem);

         myItem = '<li id="_new' + myConf.id + '" onclick="gui_SelectConf (this)"><a class="dropdown-item">' + myConfIcon + myConf.name + '</a></li>';
         gui_mgtButtonDrop(GUI_ITEM_NEWCONFIG_BTN_ROOT, ACTION_APPENDCONTENT, myItem);
      }
   }

   // ---- Activer le bouton 

   gui_mgtButtonDrop(GUI_ITEM_OLDCONFIG_BTN_ROOT, ACTION_ACTIVE_ON);
   gui_mgtButtonDrop(GUI_ITEM_NEWCONFIG_BTN_ROOT, ACTION_ACTIVE_ON);
}

/**
 * Mettre à jour le contenu du bouton de sélection d'une configuration si reponse REST = OK
 * @param {String} data - Reponse REST contenant les caractéristiques d'une configuration sous forme de structure XML
 */

function gui_UpdateConfBtn(data) {
   let xmlData = $.parseXML(data);
   let myConf;
   let myConfIdx;
   let myConfId;
   let myConfName;

   // ---- Decoder le contenu de la reponse REST (la reponse differe selon s'il s'agit du stream racine
   // ---- ou d'un stream parallele ou encore d'une baseline)

   myConf = $(xmlData).find('oslc_config\\:Stream'); // ---- 1ere forme de la reponse

   if (myConf.length === 0) {
      myConf = $(xmlData).find('oslc_config\\:Configuration'); // ---- 2sde forme de la reponse

      if (myConf.length === 0) {
         myConf = $(xmlData).find('oslc_config\\:Baseline'); // ---- 3ieme forme de la reponse
      }
   }

   myConfId = myConf.find('dcterms\\:identifier').text();
   myConfName = myConf.find('dcterms\\:title').text();

   // ---- Mettre à jour la liste des configurations

   myConfIdx = g_ConfList.findIndex(conf => conf.id === myConfId)

   if (myConfIdx > -1) {
      g_ConfList[myConfIdx].name = myConfName;
   }
}

/**
 * Afficher le nom de la configuration selectionnee
 * @param {Object} object - Objet IHM selectionne par l'utilisateur
 */

function gui_SelectConf(object) {
   let myConfId = [];
   let myConfIcon;

   myConfId = object.id.match(/^_(old|new)(.+)/); // ---- Groupe 1 = prefix | Groupe 2 = identifiant de la configuration

   // ---- Sauvegarder l'identifiant de la configuration selectionnee

   if (myConfId[1] === 'old') { // ---- Old configuration
      g_ConfOld.set(g_ConfList, myConfId[2]);

      if (g_ConfOld.type === "stream") {
         myConfIcon = '<img src="' + GUI_ICON_STREAM + '" alt="Stream"> ';
      } else {
         myConfIcon = '<img src="' + GUI_ICON_BASELINE + '" alt="Baseline"> ';
      }

      gui_mgtButtonDrop(GUI_ITEM_OLDCONFIG_BTN_ROOT, ACTION_SETLABEL, myConfIcon + g_ConfOld.name);

      // ---- Reinitialiser les items dependants

      gui_InitOldModuleBtn();

      // ---- Etablir la liste des configurations (streams, baselines ...)

      if (g_ConfOld.id === g_ConfNew.id) {
         // ---- Alerter si les 2 configurations sont identiques
         gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, IS_WARNING);
      } else {
         gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, ACTION_DISP_OFF);
         gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, IS_INPROGRESS);
         BuildModuleList(g_Project.url, g_Component.url, g_ConfOld.url, IS_OLD);
      }
   } else { // ---- New configuration
      g_ConfNew.set(g_ConfList, myConfId[2]);

      if (g_ConfNew.type === "stream") {
         myConfIcon = '<img src="' + GUI_ICON_STREAM + '" alt="Stream"> ';
      } else {
         myConfIcon = '<img src="' + GUI_ICON_BASELINE + '" alt="Baseline"> ';
      }

      gui_mgtButtonDrop(GUI_ITEM_NEWCONFIG_BTN_ROOT, ACTION_SETLABEL, myConfIcon + g_ConfNew.name);

      // ---- Reinitialiser les items dependants

      gui_InitNewModuleBtn();

      // ---- Etablir la liste des configurations (streams, baselines ...)

      if (g_ConfOld.id === g_ConfNew.id) {
         // ---- Alerter si les 2 configurations sont identiques
         gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, IS_WARNING);
      } else {
         gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, ACTION_DISP_OFF);
         gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, IS_INPROGRESS);
         BuildModuleList(g_Project.url, g_Component.url, g_ConfNew.url, IS_NEW);
      }
   }
}

/**
 * Initialiser le bouton de sélection d'une configuration (Old et New) si reponse REST = KO
 */

function gui_InitConfBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_OLDCONFIG_BTN_ROOT, ACTION_INIT, "Select the configuration");
   gui_mgtButtonDrop(GUI_ITEM_NEWCONFIG_BTN_ROOT, ACTION_INIT, "Select the configuration");

   // ---- Reinitialiser le bouton et ses dependances

   gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, ACTION_DISP_OFF);
   gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, ACTION_DISP_OFF);

   g_ConfOld.empty();
   g_ConfNew.empty();

   // ---- Ses dependances

   gui_InitOldModuleBtn();
   gui_InitNewModuleBtn();
}

/**
 * Afficher un indicateur de probleme de chargement du bouton
 * @param {BigInteger} httpCode - Code retour de la requete REST
 */

function gui_FailConfBtn(httpCode) {

   if (httpCode !== 404) { // ---- Prendre en compte le cas particulier des streams archives dont l'URI répond en 404
      // ---- Desactiver le bouton

      gui_mgtButtonDrop(GUI_ITEM_OLDCONFIG_BTN_ROOT, ACTION_ACTIVE_OFF);
      gui_mgtButtonDrop(GUI_ITEM_NEWCONFIG_BTN_ROOT, ACTION_ACTIVE_OFF);

      // ---- Indiquer que le chargement du bouton a echoue

      gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, IS_ERROR);
      gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, IS_ERROR);
      gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_ERROR, "<strong>ERROR : </strong> Configurations list not loaded !");

      // ---- Reinitialiser les items dependants

      gui_InitOldModuleBtn();
      gui_InitNewModuleBtn();
   }
}

/* ---- Module --------------------------------------------------------------- */

/**
 * Construire le contenu du bouton de sélection du module "Old" si reponse REST = OK
 * @param {String} data - Reponse REST contenant la liste des modules sous forme de structure XML
 */

function gui_BuildOldModuleBtn(data) {
   gui_BuildModuleBtn(data, g_ModuleOldList, g_ModuleOld, GUI_ITEM_OLDMODULE_BTN_ROOT, GUI_ITEM_OLDMODULEIND_ROOT);
}

/**
 * Construire le contenu du bouton de sélection du module "New" si reponse REST = OK
 * @param {String} data - Reponse REST contenant la liste des modules sous forme de structure XML
 */

function gui_BuildNewModuleBtn(data) {
   gui_BuildModuleBtn(data, g_ModuleNewList, g_ModuleNew, GUI_ITEM_NEWMODULE_BTN_ROOT, GUI_ITEM_NEWMODULEIND_ROOT);
}

/**
 * Construire le contenu du bouton de sélection du module
 * @param {String} data - Reponse REST contenant la liste des modules sous forme de structure XML
 * @param {Array} moduleList - Liste des modules
 * @param {Object} moduleObj - Objet module
 * @param {String} btnName - Id du bouton
 * @param {*String} loadInd - Id de l'indicateur de chargement 
 */

function gui_BuildModuleBtn(data, moduleList, moduleObj, btnName, loadInd) {
   let xmlData = $.parseXML(data);
   let myItem;

   // ---- Reinitialiser les information relatives aux modules

   moduleObj.empty();
   moduleList.splice(0);

   gui_mgtIndicator(loadInd, ACTION_DISP_OFF);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, ACTION_DISP_OFF);

   // ---- Decoder le contenu de la reponse REST
   // ---- <rdfs:member>
   // ----     <oslc_rm:RequirementCollection rdf:about="https://jazz:9443/rm/resources/_e0e3a11c46854792bc3f0c95a8a4f015">
   // ----        <oslc:instanceShape rdf:resource="https://jazz:9443/rm/types/_9QWN1ir4EeuJ8b5wb92nYg"/>
   // ----        <dcterms:title>REST Discovery - 1</dcterms:title>
   // ----     </oslc_rm:RequirementCollection>
   // ---- </rdfs:member>

   $(xmlData).find('rdfs\\:member').each(function () {
      let myModule = new ClassModule();
      let myModuleId = [];
      let myCollection;

      myCollection = $(this).find('oslc_rm\\:RequirementCollection');
      myModule.url = myCollection.attr('rdf:about');                   // ---- URL du module
      myModuleId = myModule.url.match(/^https.+\/resources\/(.+)/);

      // ---- Peut ne pas "matcher" car une forme de reponse peut etre : <oslc_rm:RequirementCollection rdf:about="https://jazz/rm/materializedviews/_gR5ioTC4EeuHlq5APHMxmg">

      if (myModuleId != null) {
         myModule.id = myModuleId[1];                                   // ---- Identifiant du module
         myModule.name = myCollection.find('dcterms\\:title').text();      // ---- Nom du module
         myModule.modified = myCollection.find('dcterms\\:modified').text();   // ---- Date de modification du module
         myModule.modified = new Date(myModule.modified);
         myModule.iddng = myCollection.find('dcterms\\:identifier').text(); // ---- IDentifiant externe du module

         // ---- Stocker caracteristiques du projet dans la liste globale

         moduleList.push(myModule);
      }
   });

   // ---- Trier les modules et construire le bouton

   if (moduleList.length === 0 && moduleObj.status === IS_OLD) { // ---- Module List is empty, display warning
      gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_WARNING, "Warning : Old Module List is empty !")

      // ---- Hide progess and display error indicator

      gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, IS_ERROR);
      gui_mgtButtonDrop(btnName, ACTION_ACTIVE_OFF);
   } else if (moduleList.length === 0 && moduleObj.status !== IS_OLD) {
      gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_WARNING, "Warning : New Module List is empty !")

      // ---- Hide progess and display error indicator

      gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, IS_ERROR);
      gui_mgtButtonDrop(btnName, ACTION_ACTIVE_OFF);
   } else {
      moduleList.sort((a, b) => (a.name > b.name) ? 1 : -1);

      for (let myModule of moduleList) {
         if (moduleObj.status === IS_OLD) {
            myItem = '<li id="_old' + myModule.id + '" onclick="gui_SelectModule (this)"><a class="dropdown-item"><img src="' + GUI_ICON_MODULE + '" alt="Module"> ' + myModule.name + '</a></li>';
         } else {
            myItem = '<li id="_new' + myModule.id + '" onclick="gui_SelectModule (this)"><a class="dropdown-item"><img src="' + GUI_ICON_MODULE + '" alt="Module"> ' + myModule.name + '</a></li>';
         }

         gui_mgtButtonDrop(btnName, ACTION_APPENDCONTENT, myItem);
      }

      gui_mgtButtonDrop(btnName, ACTION_ACTIVE_ON);
   }
}

/**
 * Afficher le nom du module selectionne
 * @param {Object} object - Objet IHM selectionne par l'utilisateur
 */

function gui_SelectModule(object) {
   let myModuleId = [];

   myModuleId = object.id.match(/^_(old|new)(.+)/); // ---- Groupe 1 = prefix | Groupe 2 = identifiant du module

   // ---- Sauvegarder l'identifiant du module selectionne

   if (myModuleId[1] === 'old') { // ---- Old module
      g_ModuleOld.set(g_ModuleOldList, myModuleId[2], g_ConfOld);

      gui_mgtButtonDrop(GUI_ITEM_OLDMODULE_BTN_ROOT, ACTION_SETLABEL, '<img src="' + GUI_ICON_MODULE + '" alt="Old Module"> ' + g_ModuleOld.name);
      gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, IS_SUCCESS);
   } else { // ---- New module
      g_ModuleNew.set(g_ModuleNewList, myModuleId[2], g_ConfNew);

      gui_mgtButtonDrop(GUI_ITEM_NEWMODULE_BTN_ROOT, ACTION_SETLABEL, '<img src="' + GUI_ICON_MODULE + '" alt="New Module"> ' + g_ModuleNew.name);
      gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, IS_SUCCESS);
   }

   // ---- Si les 2 modules sont selectionnes, on peut alors autoriser la comparaison

   switch (g_CompareMode) {
      case COMPARE_MODE_LOCALLOCAL:
         if (g_ModuleOld.id !== "" && g_ModuleNew.id !== "") {
            gui_mgtButtonDrop(GUI_ITEM_LOADMODULE_BTN_ROOT, ACTION_ACTIVE_ON);
         }
         break;

      case COMPARE_MODE_LOCALREQIF:
         if (g_ModuleOld.id !== "") {
            gui_mgtButtonDrop(GUI_ITEM_LOADMODULE_BTN_ROOT, ACTION_ACTIVE_ON);
         }
         break;

      default:
         break;
   }
}

/**
 * Initialiser le bouton de sélection d'un module (Old) si reponse REST = KO
 */

function gui_InitOldModuleBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_OLDMODULE_BTN_ROOT, ACTION_INIT, "Select the module");

   // ---- Reinitialiser le bouton et ses dependances

   gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, ACTION_DISP_OFF);

   g_ModuleOld.empty();

   // ---- Ses dependances

   gui_InitTableStat(GUI_ITEM_oldstatdiv);
   gui_mgtButtonDrop(GUI_ITEM_LOADMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);
}

/**
 * Afficher un indicateur de probleme de chargement du bouton
 */

function gui_FailOldModuleBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_OLDMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);

   // ---- Indiquer que le chargement du bouton a echoue

   gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, IS_ERROR);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_ERROR, "<strong>ERROR : </strong> Old modules list not loaded !");

   // ---- Reinitialiser les items dependants

   gui_InitTableStat(GUI_ITEM_oldstatdiv);
   gui_mgtButtonDrop(GUI_ITEM_LOADMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);
}

/**
 * Initialiser le bouton de sélection d'un module (New) si reponse REST = KO
 */

function gui_InitNewModuleBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_NEWMODULE_BTN_ROOT, ACTION_INIT, "Select the module");

   // ---- Reinitialiser le bouton et ses dependances

   gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, ACTION_DISP_OFF);

   g_ModuleNew.empty();

   // ---- Ses dependances

   gui_InitTableStat(GUI_ITEM_newstatdiv);
   gui_mgtButtonDrop(GUI_ITEM_LOADMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);
}

/**
 * Afficher un indicateur de probleme de chargement du bouton
 */

function gui_FailNewModuleBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_NEWMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);

   // ---- Indiquer que le chargement du bouton a echoue

   gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, IS_ERROR);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_ERROR, "<strong>ERROR : </strong> New modules list not loaded !");

   // ---- Reinitialiser les items dependants

   gui_InitTableStat(GUI_ITEM_newstatdiv);
   gui_mgtButtonDrop(GUI_ITEM_LOADMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);
}

/* ---- ReqIF interface ------------------------------------------------------ */

/**
 * ReqIF - Extract Data Model and Module Content
 * @param {string} data - XML ReqIF representation
 */

function reqif_load_datamodel(data) {
   let xmlData = $.parseXML(data);

   let ReqIfDataTypeList = [];     // ---- Array of ReqIFDataType Objects
   let ReqIfArtefactTypeList = [];     // ---- Array of ReqIFArtefactType Objects
   let ReqIfArtefactList = [];     // ---- Array of ReqIFArtefact Objects
   let ReqIfModuleList = [];     // ---- Array of ReqIFModule Objects

   g_ModuleNew.empty();

   // ---- Read Data Types

   ReqIfDataTypeList = reqif_load_datatype(xmlData);

   // ---- Read Artefact Types

   ReqIfArtefactTypeList = reqif_load_artefacttype(xmlData);

   // ---- Read Artefact Content

   ReqIfArtefactList = reqif_load_artefact(xmlData);

   // ---- Read Module Hierarchy

   ReqIfModuleList = reqif_load_module(xmlData);

   // ---- ReqIF mapping

   g_ModuleNew.get_datareqif(ReqIfModuleList[0], ReqIfArtefactList, ReqIfArtefactTypeList, ReqIfDataTypeList);

   gui_mgtIndicator(GUI_ITEM_NEWREQIFLOADIND_ROOT, IS_SUCCESS);
}

/* ---- Statistiques modules ------------------------------------------------- */

/**
 * Afficher les statistiques de chaque module
 * @param {String} divstat - Nom de la zone statistique a initialiser
 * @param {Object} objModule - Objet module
 */

function gui_BuildTableStat(divstat, objModule) {
   let myArtefactType;
   let myHtmlCode = "";

   $("#" + divstat).empty();

   // ---- Entete de table, nom des modules, nombre d'artefacts

   $("#" + divstat).append($('<tbody>'));
   $("#" + divstat).append($('<tr><td>Module Name : <b>' + objModule.name + '</b><br>Module ID : <b>' + objModule.iddng + '</b></td></tr>'));
   $("#" + divstat).append($('<tr><td>Module Modified : <b>' + objModule.modified + '</b></td></tr>'));
   $("#" + divstat).append($('<tr><td>Nb Artifacts : <b>' + objModule.artefactCount() + '</b></td>/tr>'));

   // ---- Types d'artefacts

   for (myArtefactType in objModule.artefacttype_list) {
      if (objModule.artefacttype_list[myArtefactType] > 0) {
         if (myHtmlCode !== "") {
            myHtmlCode += "<br>";
         }

         myHtmlCode += myArtefactType + " : <b>" + objModule.artefacttype_list[myArtefactType] + "</b>";
      }
   }

   $("#" + divstat).append($('<tr><td>' + myHtmlCode + '</td></tr>'));

   // ---- Ajouter une ligne à la table, dont une cellule sera modifiable

   if (objModule.status === IS_NEW) {
      $("#" + divstat).append($('<tr><td><div id="' + GUI_ITEM_newcellstat + '"></div></td></tr>'));
   }

   $("#" + divstat).append($('</tbody>'));

   // ---- Afficher le bouton de comparaison

   gui_mgtButtonDrop(GUI_ITEM_COMPARE_BTN_ROOT, ACTION_ACTIVE_ON);
}

/**
 * Display short compare statistics
 * @param {String} guiObjectId - Display area Id
 * @param {String} templname - Display template name
 * @param {Object} metrics - Compare values
 */

function gui_UpdateTableStat(guiObjectId, templname, metrics) {
   let myMetricsArea = $('#' + guiObjectId)
   let myHtmlContent;

   // ---- Display metrics

   myHtmlContent = gui_htmlfromtemplate(templname, metrics);

   myMetricsArea.empty();
   myMetricsArea.html(myHtmlContent);
   myMetricsArea.show();

   // ---- Dismiss "Compare" button

   gui_mgtButtonDrop(GUI_ITEM_COMPARE_BTN_ROOT, ACTION_ACTIVE_OFF);
   gui_mgtButtonDrop(GUI_ITEM_COMPARE_BTN_ROOT, ACTION_DISP_OFF);
}

/**
 * Initialiser la zone d'affichage des statistiques des module
 * @param {String} divstat - Nom de la zone statistique a initialiser
 * @param {String} status - Status d'initialisation de la zone
 * @param {String} paging - Taux de chargement du module
 */

function gui_InitTableStat(divstat, status, paging) {
   let myDivStat = $("#" + divstat);
   let myHtmlCode = "";

   myDivStat.empty();

   gui_mgtButtonDrop(GUI_ITEM_COMPARE_BTN_ROOT, ACTION_ACTIVE_OFF);
   gui_mgtButtonDrop(GUI_ITEM_COMPARE_BTN_ROOT, ACTION_DISP_OFF);

   gui_mgtButtonDrop(GUI_ITEM_DISPLAYDIFF_BTN_ROOT, ACTION_ACTIVE_OFF);
   gui_mgtButtonDrop(GUI_ITEM_DISPLAYDIFF_BTN_ROOT, ACTION_DISP_OFF);

   if (status !== undefined) {
      myHtmlCode = '<tbody>';

      if (status === IS_ERROR) { // ---- Loading failed
         myHtmlCode += '<tr><td style="text-align:center"><img src="resources/icon_failed.png" alt="Module Loading Has Failed" width="75" height="75" /></tr></td>';
         myHtmlCode += '<tr><td style="text-align:center"><b>Failed to load the modules to compare. See the log for more details ...</b></tr></td>';
      } else if (status === IS_INPROGRESS) { // ---- Loading in progress
         myHtmlCode += '<tr><td style="text-align:center"><img src="resources/loading.gif" alt="Loading Module" width="35" height="35" /></tr></td>';
         myHtmlCode += '<tr><td style="text-align:center"><b>Module Loading in Progress ...</b><br>Progress is <b>' + paging + '</b> artifacts</tr></td>';
      }

      myHtmlCode += '</tbody>';

      myDivStat.append(myHtmlCode);
   }
}

function gui_FailedOldTableStat() {
   gui_InitTableStat(GUI_ITEM_oldstatdiv, IS_ERROR);
}

function gui_FailedNewTableStat() {
   gui_InitTableStat(GUI_ITEM_newstatdiv, IS_ERROR);
}

/* ---- Affichage des resultats ---------------------------------------------- */

/**
 * Afficher le tableau des statistiques de comparaison
 */

function gui_DisplayStat() {

   // ---- Masquer l'indicateur de progression de comparaison

   $("#" + GUI_ITEM_newloadingcellstat).hide();

   // ---- Construire la tableau des statistiques de comparaison et les afficher

   gui_UpdateTableStat(GUI_ITEM_newcellstat, TEMPL_COMPARE_STAT, {
      "nb_newart": g_DiffList.filter((obj) => obj.diffcode === DIFF_NEWARTIFACT).length,
      "nb_delart": g_DiffList.filter((obj) => obj.diffcode === DIFF_DELARTIFACT).length,
      "nb_updtype": g_DiffList.filter((obj) => obj.diffcode === DIFF_ARTIFACTTYPECHANGED).length,
      "nb_updattr": g_DiffList.filter((obj) => obj.diffcode === DIFF_CUSTATTRCHANGED).length,
      "nb_updtag": g_DiffList.filter((obj) => obj.diffcode === DIFF_TAGCHANGED).length,
      "nb_updcontent": g_DiffList.filter((obj) => obj.diffcode === DIFF_CONTENTCHANGED).length,
      "nb_newimg": g_DiffList.filter((obj) => obj.diffcode === DIFF_IMAGENEW).length,
      "nb_updimg": g_DiffList.filter((obj) => obj.diffcode === DIFF_IMAGECHANGED).length,
      "nb_delimg": g_DiffList.filter((obj) => obj.diffcode === DIFF_IMAGEDEL).length,
      "nb_imgnew": g_DiffList.filter((obj) => obj.diffcode === DIFF_IMAGENOTFOUND_NEW).length,
      "nb_imgold": g_DiffList.filter((obj) => obj.diffcode === DIFF_IMAGENOTFOUND_OLD).length
   });

   // ---- Construire le rapport de comparaison

   gui_DisplayDiff();

   // ---- Activer le bouton d'affichate du rapport immediatement 

   gui_mgtButtonDrop(GUI_ITEM_DISPLAYDIFF_BTN_ROOT, ACTION_ACTIVE_ON);
}

/**
 * Mettre a jour l'indicateur de comparaison
 * @param {*} maxValue - Nombre maximum d'objet a traiter
 * @param {*} currentValue - Nombre d'objets deja traites
 */

function gui_RefreshCmpIndicator(maxValue, currentValue) {
   let myIndicator = $("#" + GUI_ITEM_newloadingcellstat).find("p");

   myIndicator.empty();
   myIndicator.html("<b>Scan Image " + currentValue + "/" + maxValue + "</b>");
}

/**
 * Generer code HTML du contenu d'une cellule de tableau
 * @param {Array} myTabVal - Tableau de valeurs a inserer dans une table HTML (facultatif, cree alors une cellule vide)
 * @param {String} idCell - Identifiant de la cellule (facultatif)
 * @returns {String} - Code HTML genere
 */

function gui_genCell(myTabVal, idCell) {
   let myCell = "";

   if (myTabVal !== undefined) {
      for (let i = 0; i < myTabVal.length; i++) {
         if (idCell !== undefined) {
            myCell += '<td id="' + idCell + '">' + myTabVal[i] + '</td>';
         } else {
            myCell += '<td>' + myTabVal[i] + '</td>';
         }
      }
   } else {
      myCell = '<td></td>';
   }

   return myCell;
}

/**
 * Creation du panneau des resultats de comparaison
 * @param {Array} diffTab - Tableau d'objets de classe "ClassDiffResult"
 * @param {String} guiItem - Identifiant de l'objet IHM recevant le rapport de comparaison
 */

function gui_DisplayDiff() {
   let myHtmlCode = "";

   // ---- Si une "DataTables" existe, alors il faut la supprimer !

   g_DiffTable = $("#" + GUI_ITEM_diffresult);

   if ($.fn.DataTable.isDataTable(g_DiffTable[0])) {
      $(g_DiffTable[0]).DataTable().destroy();
   }

   g_DiffTable.empty();

   // ---- Selon les resultats de comparaison, construire le rapport

   if (g_DiffList.length === 0) { // ---- Pas de differences !
      myHtmlCode = '<tbody><tr><td style="text-align: center">';
      myHtmlCode += '<h2><b>No differences found !</b></h2>';
      myHtmlCode += '</td></tr></tbody>';

      g_DiffTable.append(myHtmlCode);

      // ---- Masquer le bouton d'exportation

      $('#' + GUI_ITEM_diffmodal).on("shown.bs.modal", function () {
         gui_mgtButtonDrop(GUI_ITEM_EXPORT_BTN_ROOT, ACTION_DISP_OFF);
         gui_mgtButtonDrop(GUI_ITEM_EXPORTCOMPACT_BTN_ROOT, ACTION_DISP_OFF);
      });
   } else {
      myHtmlCode = fmt_diffreport(g_DiffList);

      g_DiffTable.append(myHtmlCode);

      // ---- "dataTables" ... c'est trop fort ... voir https://datatables.net/
      // ---- "dataTables" permet de creer des tables avec un tas de sous-fonctions (tri, flitres ...)

      g_DiffTable.dataTable({
         destroy: true,
         layout: {
            top1: { searchPanes: { cascadePanes: true, layout: 'columns-2', initCollapsed: true } },
            topStart: 'pageLength',
            topEnd: 'search',
            bottomStart: 'info',
            bottomEnd: 'paging'
         },
         paging: true,
         scrollY: "600px",
         columnDefs: [
            { targets: RPT_COL_ID, type: "num", width: "4%" },
            { targets: RPT_COL_TYPE, type: "string", width: "9%", searchPanes: { show: true } },
            { targets: RPT_COL_ATTR, type: "string", width: "9%", searchPanes: { show: true } },
            { targets: RPT_COL_OLDVAL, type: "string", width: "14%", orderable: false, searchPanes: { show: false } },
            { targets: RPT_COL_NEWVAL, type: "string", width: "14%", orderable: false, searchPanes: { show: false } },
            { targets: RPT_COL_DIFFCONTENT, width: "35%", orderable: false, searchable: false, searchPanes: { show: false } },
            { targets: RPT_COL_ID, searchPanes: { show: false } },
            {
               targets: RPT_COL_DIFFLABEL,
               type: "string",
               width: "15%",
               searchPanes: { show: true },
               render: function (data, type) {             // ---- Badge coloré selon le type de différence
                  if (type !== 'display') return data;
                  const BADGE = {};
                  BADGE[DIFF_LABEL[DIFF_NEWARTIFACT]] = 'bg-success';
                  BADGE[DIFF_LABEL[DIFF_DELARTIFACT]] = 'bg-danger';
                  BADGE[DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED]] = 'bg-warning text-dark';
                  BADGE[DIFF_LABEL[DIFF_CUSTATTRCHANGED]] = 'bg-warning text-dark';
                  BADGE[DIFF_LABEL[DIFF_CONTENTCHANGED]] = 'bg-primary';
                  BADGE[DIFF_LABEL[DIFF_IMAGECHANGED]] = 'bg-info text-dark';
                  BADGE[DIFF_LABEL[DIFF_IMAGENEW]] = 'bg-info text-dark';
                  BADGE[DIFF_LABEL[DIFF_IMAGEDEL]] = 'bg-secondary';
                  BADGE[DIFF_LABEL[DIFF_IMAGENOTFOUND_NEW]] = 'bg-danger';
                  BADGE[DIFF_LABEL[DIFF_IMAGENOTFOUND_OLD]] = 'bg-danger';
                  BADGE[DIFF_LABEL[DIFF_TAGCHANGED]] = 'bg-warning text-dark';
                  let cls = BADGE[data] || 'bg-secondary';
                  return '<span class="badge ' + cls + ' text-wrap">' + data + '</span>';
               }
            }
         ],
         drawCallback: function (settings) {               // ---- Necessaire pour les fenetres modales Bootstrap !
            document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) {
               new bootstrap.Tooltip(el, { placement: 'left', html: true });
            });
         },
         rowCallback: function (row, data) {               // ---- Colorier les lignes selon le type de différence
            const ROW_CLASS = {};
            ROW_CLASS[DIFF_LABEL[DIFF_NEWARTIFACT]] = 'table-success';
            ROW_CLASS[DIFF_LABEL[DIFF_DELARTIFACT]] = 'table-danger';
            ROW_CLASS[DIFF_LABEL[DIFF_CONTENTCHANGED]] = 'table-primary';
            ROW_CLASS[DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED]] = 'table-warning';
            ROW_CLASS[DIFF_LABEL[DIFF_CUSTATTRCHANGED]] = 'table-warning';
            ROW_CLASS[DIFF_LABEL[DIFF_TAGCHANGED]] = 'table-warning';
            ROW_CLASS[DIFF_LABEL[DIFF_IMAGECHANGED]] = 'table-info';
            ROW_CLASS[DIFF_LABEL[DIFF_IMAGENEW]] = 'table-info';
            ROW_CLASS[DIFF_LABEL[DIFF_IMAGEDEL]] = 'table-secondary';
            ROW_CLASS[DIFF_LABEL[DIFF_IMAGENOTFOUND_NEW]] = 'table-danger';
            ROW_CLASS[DIFF_LABEL[DIFF_IMAGENOTFOUND_OLD]] = 'table-danger';
            let cls = ROW_CLASS[data[RPT_COL_DIFFLABEL]];
            if (cls) $(row).addClass(cls);
         }
      });

      // ---- Reajuster les colonnes au moment de l'affichage de la fenetre modale (cela ne s'invente pas !) et afficher le bouton d'export

      $('#' + GUI_ITEM_diffmodal).on("shown.bs.modal", function () {
         $.fn.dataTable.tables({ visible: true, api: true }).columns.adjust();

         gui_mgtButtonDrop(GUI_ITEM_EXPORT_BTN_ROOT, ACTION_DISP_ON);
      });
   }
}

/* ---- Divers utilitaires --------------------------------------------------- */

/**
 * Formatter le rapport de comparaison (generation du code HTML contenant le rapport de comparaison)
 * @param {Object} diffObjList - Tableau d'objets de la classe "ClassDiffResult"
 * @returns {String} - Code HTML genere
 */

function fmt_diffreport(diffObjList) {
   let myHtmlCode = "";

   // ---- +----+------+------------+-----------+-----------+-----------+---------+
   // ---- | ID | Type | Diff Label | Attribute | Old Value | New Value | Content |
   // ---- | 0  | 1    | 2          | 3         | 4         | 5         | 6       |
   // ---- +----+------+------------+-----------+-----------+-----------+---------+

   myHtmlCode = '<thead><tr>';
   myHtmlCode += '<th>ID</th>';
   myHtmlCode += '<th>Type</th>';
   myHtmlCode += '<th>Diff Label</th>';
   myHtmlCode += '<th>Attribute</th>';
   myHtmlCode += '<th>Old Value</th>';
   myHtmlCode += '<th>New Value</th>';
   myHtmlCode += '<th>Diff Content</th>';
   myHtmlCode += '</tr></thead><tbody style="font-size: 12px;">';

   for (let myDiffObj of diffObjList) {
      myHtmlCode += '<tr>' + gui_genCell([myDiffObj.id, myDiffObj.arttype, myDiffObj.difflabel]);

      switch (myDiffObj.diffcode) {
         case DIFF_ARTIFACTTYPECHANGED:
            myHtmlCode += gui_genCell(["", myDiffObj.oldvalue, "", ""]);
            break;

         case DIFF_CUSTATTRCHANGED:
            myHtmlCode += gui_genCell([myDiffObj.attrname, myDiffObj.oldvalue, myDiffObj.newvalue, ""]);
            break;

         case DIFF_CONTENTCHANGED:
            myHtmlCode += gui_genCell([myDiffObj.attrname, "", "", myDiffObj.content]);
            break;

         case DIFF_TAGCHANGED:
            myHtmlCode += gui_genCell([myDiffObj.attrname, myDiffObj.oldvalue, myDiffObj.newvalue, ""]);
            break;

         case DIFF_NEWARTIFACT:
         case DIFF_DELARTIFACT:
            myHtmlCode += gui_genCell([myDiffObj.attrname, "", "", myDiffObj.content]);
            break;
         case DIFF_IMAGECHANGED:
         case DIFF_IMAGENOTFOUND_NEW:
         case DIFF_IMAGENOTFOUND_OLD:
         case DIFF_IMAGENEW:
         case DIFF_IMAGEDEL:
            myHtmlCode += gui_genCell(["", "", "", ""]);
            break;

         default:
            console.log("### ERROR : Diff code '" + myDiffObj.diffcode + "' is unknown !");

            myHtmlCode += gui_genCell(["", "", "", ""]);
      }

      myHtmlCode += '</tr>';
   }

   myHtmlCode += '</tbody>';

   return myHtmlCode;
}

/**
 * Manage compare modes (Local vs Local, Local vs ReqIF ...)
 * @param {Object} object : GUI Object
 */

function gui_selectCompareMode(object) {
   g_CompareMode = parseInt(object.id.replace(/.+-/, ""));

   gui_mgtButtonDrop(GUI_ITEM_COMPAREMODE_BTN_ROOT, ACTION_SETLABEL, COMPARE_MODE_LABEL[g_CompareMode]);

   switch (g_CompareMode) {
      case COMPARE_MODE_LOCALLOCAL:
         $('#' + GUI_BLCK_PROJECT).show();
         $('#' + GUI_BLCK_COMPONENT).show();
         $('#' + GUI_BLCK_OLDCONFIG).show();
         $('#' + GUI_BLCK_OLDREQIF).hide();
         $('#' + GUI_BLCK_NEWCONFIG).show();
         $('#' + GUI_BLCK_NEWREQIF).hide();

         gui_InitProjectBtn();
         gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, IS_INPROGRESS);
         BuildProjectList();

         mgt_Console('Locacl Conf vs Local Conf', CONSOLE_INFO);
         break;

      case COMPARE_MODE_LOCALREQIF:
         $('#' + GUI_BLCK_PROJECT).show();
         $('#' + GUI_BLCK_COMPONENT).show();
         $('#' + GUI_BLCK_OLDCONFIG).show();
         $('#' + GUI_BLCK_OLDREQIF).hide();
         $('#' + GUI_BLCK_NEWCONFIG).hide();
         $('#' + GUI_BLCK_NEWREQIF).show();

         /* ---- Future implementation 
            ---- gui_InitProjectBtn ();
            ---- gui_mgtIndicator (GUI_ITEM_PROJECTIND_ROOT, IS_INPROGRESS);
            ---- BuildProjectList ();
         */

         gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_WARNING, "<strong>WARNING</strong> : Not yet implemented !");
         mgt_Console('Local Conf vs ReqIF', CONSOLE_INFO);
         break;

      case COMPARE_MODE_REQIFREQIF:
         $('#' + GUI_BLCK_PROJECT).hide();
         $('#' + GUI_BLCK_COMPONENT).hide();
         $('#' + GUI_BLCK_OLDCONFIG).hide();
         $('#' + GUI_BLCK_OLDREQIF).show();
         $('#' + GUI_BLCK_NEWCONFIG).hide();
         $('#' + GUI_BLCK_NEWREQIF).show();

         /* ---- Not yet implemented */

         gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_WARNING, "<strong>WARNING</strong> : Not yet implemented !");
         mgt_Console('ReqIF vs ReqIF', CONSOLE_WARNING);
         break;

      default:
         mgt_Console('Unknown Compare Mode !', CONSOLE_WARNING);
   }
}

/* --------------------------------------------------------------------------- */

/** Initialisation de l'IHM du widget */

function view_init() {
   let myItem = [];

   // ---- Init IHM du widget

   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, ACTION_DISP_OFF);
   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, ACTION_DISP_OFF);

   // ---- Compare Mode

   for (let i = 0; i < COMPARE_MODE_LABEL.length; i++) {
      myItem.push('<li id="CompareMode-' + i + '" onclick="gui_selectCompareMode (this)"><a class="dropdown-item">' + COMPARE_MODE_LABEL[i] + '</a></li>');
   }

   gui_mgtButtonDrop(GUI_ITEM_COMPAREMODE_BTN_ROOT, ACTION_SETLABEL, COMPARE_MODE_LABEL[COMPARE_MODE_LOCALLOCAL]);
   gui_mgtButtonDrop(GUI_ITEM_COMPAREMODE_BTN_ROOT, ACTION_SETCONTENT, myItem);

   // ---- Button/Function association

   gui_mgtButtonDrop(GUI_ITEM_COMPARE_BTN_ROOT, ACTION_SETMETHOD, start_compare);
   gui_mgtButtonDrop(GUI_ITEM_EXPORT_BTN_ROOT, ACTION_SETMETHOD, export_report);
   gui_mgtButtonDrop(GUI_ITEM_EXPORTCOMPACT_BTN_ROOT, ACTION_SETMETHOD, exportCompact_report);
   gui_mgtButtonDrop(GUI_ITEM_LOADMODULE_BTN_ROOT, ACTION_SETMETHOD, load_module);

   $('#' + GUI_ITEM_NEWREQIFLOAD).change(gui_loadreqif);

   // ---- Bootstrap : initialisation "popover"

   document.querySelectorAll('[data-bs-toggle="popover"]').forEach(function (el) {
      new bootstrap.Popover(el);
   });

   // ---- Filtrage des dropdowns avec champ de recherche

   $(document).on('input', '.dropdown-search', function () {
      let filter = $(this).val().toLowerCase();
      $(this).closest('.dropdown-menu').find('ul > li').each(function () {
         $(this).toggle($(this).text().toLowerCase().includes(filter));
      });
   });

   $(document).on('shown.bs.dropdown', '[data-bs-toggle="dropdown"]', function () {
      let search = $(this).next('.dropdown-menu').find('.dropdown-search');
      if (search.length) {
         search.val('');
         search.closest('.dropdown-menu').find('ul > li').show();
         search.trigger('focus');
      }
   });

   // ---- Get Project List

   gui_InitProjectBtn();
   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, IS_INPROGRESS);
   BuildProjectList();
}
