/*******************************************************************************/
/*                    (C) Copyright 2026 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | 11/06/2026 |   Safran       | Initial version                      |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

class ClassJazzItem { // ---- Caracteristiques communes a une ressource JAZZ (projet, composant, ...)
   #name;          // ---- Nom de la ressource
   #summary;       // ---- Sommaire de la ressource
   #description;   // ---- Description de la ressource
   #url;           // ---- URL de la ressource
   #id;            // ---- Identifiant de la ressource
   #modified;      // ---- Date de derniere modification de la ressource

   constructor() {
      this.#name = null;
      this.#summary = null;
      this.#description = null;
      this.#url = null;
      this.#id = null;
      this.#modified = null;
   }

   /**
    * Réinitialiser l'objet
    */

   empty() {
      this.#name = null;
      this.#summary = null;
      this.#description = null;
      this.#url = null;
      this.#id = null;
      this.#modified = null;
   }

   // ---- Getters

   getName() {
      return this.#name;
   }

   getSummary() {
      return this.#summary;
   }

   getDescription() {
      return this.#description;
   }

   getUrl() {
      return this.#url;
   }

   getId() {
      return this.#id;
   }

   getModified() {
      return this.#modified;
   }

   // ---- Setters

   setName(name) {
      this.#name = name;
   }

   setSummary(summary) {
      this.#summary = summary;
   }

   setDescription(description) {
      this.#description = description;
   }

   setUrl(url) {
      this.#url = url;
   }

   setId(id) {
      this.#id = id;
   }

   setModified(modified) {
      this.#modified = modified;
   }
}

class ClassProject extends ClassJazzItem { // ---- Caracteristiques d'un projet JAZZ
   /**
    * Initialiser l'objet a partir d'un noeud XML "jp06:project-area"
    * @param {Object} xml_data - Noeud jQuery du projet
    */

   init(xml_data) {
      let myPrjId = [];

      this.setName(xml_data.attr(JP060_NAME)); // ---- Project Name

      xml_data.children().each((index, node) => {
         switch ($(node).prop('nodeName')) {
            case JP060_URL: // ---- Project URL
               this.setUrl($(node).text());
               myPrjId = this.getUrl().match(/^https.+\/(.+)/);
               this.setId(myPrjId[1]);
               break;

            case JP060_DESCRIPTION: // ---- Project Description
               this.setDescription($(node).text());
               break;

            case JP060_SUMMARY: // ---- Project Summary
               this.setSummary($(node).text());
               break;

            case JP060_MODIFIED: // ---- Project Modified Date
               this.setModified($(node).text());
               break;

            default:
            // ---- Do nothing
         };
      });
   }
}

class ClassComponent extends ClassJazzItem { // ---- Caracteristiques d'un composant JAZZ
   /**
    * Initialiser l'objet a partir d'un noeud XML "jp06:project-area"
    * @param {Object} xml_data - Noeud jQuery du composant
    */

   init(xml_data) {
      let myCompId = [];

      this.setName(xml_data.attr(JP060_NAME)); // ---- Component Name

      xml_data.children().each((index, node) => {
         switch ($(node).prop('nodeName')) {
            case JP060_URL: // ---- Component URL
               this.setUrl($(node).text());
               myCompId = this.getUrl().match(/^https.+\/components\/(.+)/);
               this.setId(myCompId[1]);
               break;

            case JP060_DESCRIPTION: // ---- Component Description
               this.setDescription($(node).text());
               break;

            case JP060_SUMMARY: // ---- Component Summary
               this.setSummary($(node).text());
               break;

            case JP060_MODIFIED: // ---- Component Modified Date
               this.setModified($(node).text());
               break;

            default:
            // ---- Do nothing
         };
      });
   }
}

class ClassConfiguration extends ClassJazzItem { // ---- Caracteristiques d'une configuration JAZZ
   #type; // ---- Type de configuration : "stream" ou "baseline"
   
   constructor() {
      super();
      this.#type = null;
   }

   /**
    * Réinitialiser l'objet
    */

   empty() {
      super.empty();
      this.#type = null;
   }

   /**
    * Initialiser l'objet a partir d'un noeud XML "rdfs:member"
    * @param {Object} xml_data - Noeud jQuery de la configuration
    */

   init(xml_data) {
      let myConfId = [];

      this.setUrl(xml_data.attr(RDF0_RESOURCE)); // ---- Configuration URL

      myConfId = this.getUrl().match(/^https.+\/rm\/cm\/(.+)\/(.+)/); // ---- Extraire type et identifiant de configuration
      this.setType(myConfId[1]);
      this.setId(myConfId[2]);
      this.setName(this.getId()); // ---- A ce stade, nous n'avons pas encore le nom de la configuration
   }

   /**
    * Affecter une configuration a partir d'une liste
    * @param {Array} confList - Table d'objets de type "ClassConfiguration"
    * @param {String} confId - Identifiant de la configuration
    */

   set(confList, confId) {
      for (let myConf of confList) {
         if (confId === myConf.getId()) {
            this.setName(myConf.getName());
            this.setDescription(myConf.getDescription());
            this.setUrl(myConf.getUrl());
            this.setId(myConf.getId());
            this.setType(myConf.getType());
            break;
         }
      }
   }

   // ---- Getters

   getType() {
      return this.#type;
   }

   getChangesets() {
      return this.getUrl() + '/changesets'; // ---- URL de la liste des changesets de la configuration
   }

   // ---- Setters

   setType(type) {
      this.#type = type;
   }
}

class ClassModule extends ClassJazzItem { // ---- Caracteristiques d'un module JAZZ
   #iddng;              // ---- Identifiant du module (identifiant externe visible dans les vues)
   #status;             // ---- Status du module ("New" ou "Old"), defini a la creation de l'objet
   #format;             // ---- Format "Collection" ou "Module"
   #artefact_list;       // ---- Liste des artefacts (liste d'objets de la classe "ClassArtefact")
   #attributecust_list;  // ---- Liste de tous les "Custom Attributes" detectes dans le module
   #artefacttype_list;   // ---- Liste des tous les types d'artefacts et leur nombre - Index = type d'artefact / Contenu = nombre
   #nbpage;             // ---- Nombre de pages du module
   #pagepos;            // ---- Position de pagination
   #conf;               // ---- Configuration du module (objet de la classe "ClassConfiguration")

   constructor(modStatus) {
      super();

      this.#iddng = null;
      this.#status = null;
      this.#format = null;
      this.#artefact_list = [];
      this.#attributecust_list = [];
      this.#artefacttype_list = [];
      this.#nbpage = 0;
      this.#pagepos = 0;
      this.#conf = null;

      if (modStatus != undefined) {
         this.#status = modStatus;
      }
   }

   /**
    * Réinitialiser totalement l'objet
    */

   empty() {
      super.empty();

      this.#iddng = null;
      this.#nbpage = 0;
      this.#pagepos = 0;
      this.#conf = null;

      this.empty_artifact();
   }

   /**
    * Vider le contenu de l'objet (artefacts, types d'artefacts ...)
    */

   empty_artifact() {
      this.#nbpage = 0;
      this.#pagepos = 0;

      this.#artefact_list.splice(0);
      this.#attributecust_list.splice(0);

      for (let myArtefactType in this.#artefacttype_list) {
         this.#artefacttype_list[myArtefactType] = 0;
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
         if (modId === myMod.getId()) {
            this.setName(myMod.getName());
            this.setUrl(myMod.getUrl());
            this.setId(myMod.getId());
            this.setIddng(myMod.getIddng());
            this.setModified(myMod.getModified());
            break;
         }
      }

      if (confObj !== undefined) {
         this.setConf(confObj);
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

      this.#nbpage++;

      // ---- Recuperer les informations de pagination (si la recuperation du module est paginee)

      myHref = $(xmlData).find('ds\\:dataSource').attr('href');

      if (myHref != undefined) {
         myHref = decodeURIComponent(myHref);
         myPos = myHref.match(/^https.+(&pos=([0-9]+)).*/);

         this.#pagepos = myPos[2];
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

         if (myArtefact.type in mySelf.#artefacttype_list) { // ---- Le type d'artefact est dans la liste : incrementer son compteur
            mySelf.#artefacttype_list[myArtefact.type]++;
         } else { // ---- Le type d'artefact n'est dans la liste : empiler le type et initialiser son compteur
            mySelf.#artefacttype_list[myArtefact.type] = 1;
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

            if (mySelf.#attributecust_list.indexOf(myCustAttribute.name) < 0) {
               mySelf.#attributecust_list.push(myCustAttribute.name);
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
            mySelf.#artefact_list.push(myArtefact);
         }
      });
   }

   /**
    * Initialiser l'objet à partir de données provenant d'une structure reqIF
    * @param {Object ReqIFModule} reqifModule - Structure du module
    * @param {Array of ReqIFArtefact} reqifArtefactList - Liste des artefacts
    * @param {Array of ReqIFArtefactType} reqifArtefactTypeList - Liste des type d'artefacts
    * @param {Array of ReqIFDataType} reqifDataTypeList - Liste des types de données
    */

   get_datareqif(reqifModule, reqifArtefactList, reqifArtefactTypeList, reqifDataTypeList) {

      // ---- Modules characteristics

      this.setName(reqifModule.name);
      this.setIddng(reqifModule.get_attrvaluebyname(REQIF_REQIF_FOREIGNID, reqifArtefactTypeList, reqifDataTypeList));
      this.setModified(reqifModule.get_attrvaluebyname(REQIF_REQIF_FOREIGNMODIFIEDON, reqifArtefactTypeList, reqifDataTypeList));

      // ---- Artifacts characteristics

      for (let myReqifArtefact of reqifModule.artefactlist) {
         let myArtefact = new ClassArtefact();

         myArtefact.get_datareqif(myReqifArtefact, reqifArtefactList, reqifArtefactTypeList, reqifDataTypeList);

         this.#artefact_list.push(myArtefact);
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

         mySelf.#artefact_list.push(myArtefact);
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
         return this.#artefact_list.find(artefact => artefact.id === id && artefact.bookorder === order);
      } else {
         return this.#artefact_list.find(artefact => artefact.id === id);
      }
   }

   /**
    * Compter le nombre d'artefact dans le module
    */

   artefactCount() {
      return this.#artefact_list.length;
   }

   // ---- Getters

   getIddng() {
      return this.#iddng;
   }

   getStatus() {
      return this.#status;
   }

   getFormat() {
      return this.#format;
   }

   getArtefactList() {
      return this.#artefact_list;
   }

   getAttributecustList() {
      return this.#attributecust_list;
   }

   getArtefacttypeList() {
      return this.#artefacttype_list;
   }

   getNbpage() {
      return this.#nbpage;
   }

   getPagepos() {
      return this.#pagepos;
   }

   getConf() {
      return this.#conf;
   }

   // ---- Setters

   setIddng(iddng) {
      this.#iddng = iddng;
   }

   setStatus(status) {
      this.#status = status;
   }

   setFormat(format) {
      this.#format = format;
   }

   setNbpage(nbpage) {
      this.#nbpage = nbpage;
   }

   setPagepos(pagepos) {
      this.#pagepos = pagepos;
   }

   setConf(conf) {
      this.#conf = conf;
   }
}
