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
   #identifier;    // ---- Identifiant de la ressource
   #modified;      // ---- Date de derniere modification de la ressource
   #created;       // ---- Date de creation de la ressource
   #creator;       // ---- Createur de la ressource
   #contributor;   // ---- Contributeur de la ressource
   #type;          // ---- Type de la ressource (projet, composant, configuration, ...)

   constructor(url = null) {
      this.#name = null;
      this.#summary = null;
      this.#description = null;
      this.#url = url;
      this.#identifier = null;
      this.#modified = null;
      this.#created = null;
      this.#creator = null;
      this.#contributor = null;
      this.#type = null;
   }

   /**
    * Réinitialiser l'objet
    */

   empty() {
      this.#name = null;
      this.#summary = null;
      this.#description = null;
      this.#url = null;
      this.#identifier = null;
      this.#modified = null;
      this.#created = null;
      this.#creator = null;
      this.#contributor = null;
      this.#type = null;
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

   getCreated() {
      return this.#created;
   }

   getCreator() {
      return this.#creator;
   }

   getContributor() {
      return this.#contributor;
   }

   getType() {
      return this.#type;
   }

   /**
    * Obtenir le nom d'hote (origine + contexte) a partir de l'URL : https://host/context/rest/of/the/url -> https://host/context
    * @returns {String} - Nom d'hote
    */

   getHostname() {
      const myURL = new URL(this.#url);
      const myContext = myURL.pathname.split('/')[1];

      return myURL.origin + "/" + myContext;
   }

   getIdentifier() {
      return this.#identifier;
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

   setIdentifier(id) {
      this.#identifier = id;
   }

   setModified(modified) {
      this.#modified = modified;
   }

   setCreated(created) {
      this.#created = created;
   }

   setCreator(creator) {
      this.#creator = creator;
   }

   setContributor(contributor) {
      this.#contributor = contributor;
   }

   setType(type) {
      this.#type = type;
   }
}

class ClassProject extends ClassJazzItem { // ---- Caracteristiques d'un projet JAZZ
   // ---- Private field
   #componentList = [];

   empty() {
      super.empty();
      this.#componentList.splice(0);
   }

   getComponentList() {
      return this.#componentList;
   }

   reset_componentList() {
      this.#componentList.splice(0);
   }

   add_component(component) {
      this.#componentList.push(component);
   }

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
               this.setIdentifier(myPrjId[1]);
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

   // ---- Private field
   #configurationList = [];

   empty() {
      super.empty();
      this.#configurationList.splice(0);
   }

   getConfigurationList() {
      return this.#configurationList;
   }

   reset_configurationList() {
      this.#configurationList.splice(0);
   }

   add_configuration(configuration) {
      this.#configurationList.push(configuration);
   }

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
               this.setIdentifier(myCompId[1]);
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

class ERM_Configuration extends ClassJazzItem {

   // ---- Private field
   #changesetsListUrl = null; // ---- URL de la liste des changesets de la configuration
   #changesetsList = [];      // ---- Liste des changesets de la configuration
   #overrides = null;         // ---- Liste des overrides de la configuration
   #moduleList = [];          // ---- Modules hosted by the configuration

   /**
    * @param {string|null} url - Optional URL forwarded to ERM_Config constructor.
    */

   constructor(url = null) {
      super(url);
   }

   // ---- Setters

   setChangesetsListUrl(value) {
      this.#changesetsListUrl = value;
   }

   setChangesetsList(value) {
      this.#changesetsList.push(value);
   }

   setOverrides(value) {
      this.#overrides = value;
   }

   // ---- Getters

   getChangesetsListUrl() {
      return this.#changesetsListUrl;
   }

   getChangesetsList() {
      return this.#changesetsList;
   }

   getOverrides() {
      return this.#overrides;
   }

   getModuleList() {
      return this.#moduleList;
   }

   // ---- Core functions

   init(xml_data) { // ---- Init an ERM Configuration with an XML Node from ERM API
      const XML_FINDREQ = OSLCCONFIG_CONFIGURATION + ", " + OSLCCONFIG_CONFIGURATION2 + ", " + OSLCCONFIG_BASELINE + ", " + OSLCCONFIG_STREAM + ", " + OSLCCONFIG_CHANGESET; // ---- Configuration represented in a "Configuration" or "Baseline" or "Stream" or "ChangeSet" node

      let mySelf = this;

      mySelf.setUrl($(xml_data).find(XML_FINDREQ).attr(RDF0_ABOUT));

      // ---- Determine the type of configuration from the URL (changeset, stream, or baseline)

      const myTypeMatch = mySelf.getUrl().match(/\/cm\/(changeset|stream|baseline)\//);
      if (myTypeMatch) {
         mySelf.setType(myTypeMatch[1]);
      }

      // ---- Parse the XML data to extract configuration details and set them in the object

      $(xml_data).find(XML_FINDREQ).children().each(function () {
         switch ($(this).prop('nodeName')) {
            case DCTERMS0_IDENTIFIER:
               mySelf.setIdentifier($(this).text());
               break;
            case DCTERMS0_TITLE:
               mySelf.setName($(this).text());
               break;
            case DCTERMS0_DESCRIPTION:
               mySelf.setDescription($(this).text());
               break;
            case DCTERMS0_CREATED:
               mySelf.setCreated($(this).text());
               break;
            case DCTERMS0_CREATOR:
               mySelf.setCreator($(this).attr(RDF0_RESOURCE));
               break;
            case J00_CHANGESETS:
               mySelf.#changesetsListUrl = $(this).attr(RDF0_RESOURCE);
               break;
            case OSLCCONFIG0_OVERRIDES:
               mySelf.#overrides = $(this).attr(RDF0_RESOURCE);
               break;
            default:
            // ---- Do nothing for the moment
         }
      });
   }

   add_Module(module) {
      this.#moduleList.push(module);
   }

   empty_ModuleList() {
      this.#moduleList.splice(0);
   }
}

class ERM_wrappedResources extends ClassJazzItem {
   // ---- Private field
   #contenttype = null; // ---- URL de la liste des changesets de la configuration

   constructor(url = null) {
      super(url);
   }

   setContentType(type) {
      this.#contenttype = type;
   }

   getContenType() {
      return this.#contenttype;
   }

   // ---- Rename this class, because it is not "specific" to a Wrapped Resource !!!

   init(xml_data) { // ---- Init an ERM Configuration with an XML Node from ERM API
      xml_data.find(RDF_DESCRIPTION).children().each((index, node) => {
         switch ($(node).prop('nodeName')) {
            case DCTERMS0_IDENTIFIER:
               this.setIdentifier($(node).text());
               break;
            case DCTERMS0_TITLE:
               this.setName($(node).text());
               break;
            case DCTERMS0_DESCRIPTION:
               this.setDescription($(node).text());
               break;
            case DCTERMS0_CREATED:
               this.setCreated($(node).text());
               break;
            case DCTERMS0_CREATOR:
               this.setCreator($(node).attr(RDF0_RESOURCE));
               break;
            case DCTERMS0_MODIFIED:
               this.setModified($(node).text());
               break;
            case DCTERMS0_CONTRIBUTOR:
               this.setContributor($(node).attr(RDF0_RESOURCE));
               break;
            case PUBLIC0_RM10_WRAPPEDRESCONTENTTYPE: // ---- Only for Wrapped Resource !
               this.#contenttype = ($(node).text());
            default:
            // ---- Do nothing for the moment
         }
      });
   }
}

class ClassModule extends ClassJazzItem { // ---- Caracteristiques d'un module JAZZ
   #iddng = null;             // ---- Identifiant du module (identifiant externe visible dans les vues)
   #status = null;            // ---- Status du module ("New" ou "Old"), defini a la creation de l'objet
   #format = null;            // ---- Format "Collection" ou "Module"
   #artefact_list = [];       // ---- Liste des artefacts (liste d'objets de la classe "ClassArtefact")
   #attributecust_list = [];  // ---- Liste de tous les "Custom Attributes" detectes dans le module
   #artefacttype_list = [];   // ---- Liste des tous les types d'artefacts et leur nombre - Index = type d'artefact / Contenu = nombre
   #nbpage = 0;               // ---- Nombre de pages du module
   #pagepos = 0;              // ---- Position de pagination
   #conf = null;              // ---- Configuration du module (objet de la classe "ClassConfiguration")

   constructor(modStatus) {
      super();

      this.#status = (modStatus != undefined ? modStatus : null);
   }

   init(xml_data) {
      xml_data.find(OSLCRM_REQUIREMENTCOLLECTION).each((index, node) => {
         let myIdentifier;

         // ---- Get "internal" identifier
         /* ---- Response form is :
            <rdfs:member>
               <oslc_rm:RequirementCollection rdf:about="https://elm703.raoulnet/rm/resources/MD_0neRECstEfGpLb-cxbHKhQ">
                  <oslc:instanceShape rdf:resource="https://elm703.raoulnet/rm/types/OT_aUyAgCstEfGpLb-cxbHKhQ"/>
                  <dcterms:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">2026-06-12T05:38:46.780Z</dcterms:modified>
                  <dcterms:title>TRD Test Module</dcterms:title>
                  <dcterms:identifier rdf:datatype="http://www.w3.org/2001/XMLSchema#long">704</dcterms:identifier>
               </oslc_rm:RequirementCollection>
            </rdfs:member>
         */

         this.setUrl($(node).attr(RDF0_ABOUT));

         myIdentifier = this.getUrl().match(/^https.+\/resources\/(.+)/);

         this.setIdentifier((myIdentifier === null ? myIdentifier : myIdentifier[1]));

         // ---- Loop on each sub-nodes

         $(node).children().each((index, node) => {
            switch ($(node).prop('nodeName')) {
               case DCTERMS0_IDENTIFIER:
                  this.#iddng = $(node).text();
                  break;
               case DCTERMS0_TITLE:
                  this.setName($(node).text());
                  break;
               case DCTERMS0_MODIFIED:
                  this.setModified($(node).text());
                  break;
               default:
               // ---- Do nothing
            }
         });
      });
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
         if (modId === myMod.getIdentifier()) {
            this.setName(myMod.getName());
            this.setUrl(myMod.getUrl());
            this.setIdentifier(myMod.getIdentifier());
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

            myArtefact.setId(myArtefactId);
            myArtefact.setUri($(this).find('rrm\\:about').first().text());
            myArtefact.setFormat($(this).find('rrm\\:format').first().text());
            myArtefact.setBookorder(myArtefactOrder);
         }

         myArtefact.setModified($(this).find('rrm\\:collaboration').find('rrm\\:modified').text());
         myArtefact.setContent($(this).find('ds\\:content').find('text\\:text').find('text\\:richTextBody').find('div').html());

         myXmlObj = $(this).find('rrm\\:collaboration').find('rrm\\:attributes').find('attribute\\:objectType');
         myArtefact.setType($(myXmlObj).attr('attribute:name'));

         if (myArtefact.getType() in mySelf.#artefacttype_list) { // ---- Le type d'artefact est dans la liste : incrementer son compteur
            mySelf.#artefacttype_list[myArtefact.getType()]++;
         } else { // ---- Le type d'artefact n'est dans la liste : empiler le type et initialiser son compteur
            mySelf.#artefacttype_list[myArtefact.getType()] = 1;
         }

         // ---- Boucler sur tous les Custom Attributs de l'artefact et recuperer les caracteristiques

         $(myXmlObj).find('attribute\\:customAttribute').each(function () {
            let myCustAttribute = new ClassAttribute();
            let myEnumCustAttribute = new ClassAttribute();

            myCustAttribute.setName($(this).attr('attribute:name'));
            myCustAttribute.setType($(this).attr('attribute:datatype'));
            myCustAttribute.setIsenum($(this).attr('attribute:isEnumeration'));
            myCustAttribute.setIsmultivalue($(this).attr('attribute:isMultiValued'));

            if (myCustAttribute.getIsenum() === undefined || myCustAttribute.getIsenum() === 'false') {
               // ---- L'attribut n'est pas une enumeration

               myCustAttribute.getValue().push($(this).attr('attribute:value'));

               myArtefact.getCustattrList().push(myCustAttribute);
            } else {
               // ---- L'attribut est une enumeration

               myEnumCustAttribute = myArtefact.get_attributeByName(myCustAttribute.getName());

               if (myEnumCustAttribute === undefined) {
                  // ---- Il n'est pas encore connu de l'artefact, on peut donc l'ajouter

                  myCustAttribute.getValue().push($(this).attr('attribute:literalName'));

                  myArtefact.getCustattrList().push(myCustAttribute);
               } else {
                  // ---- Il est connu de l'artefact, donc on empile seulement sa valeur

                  myEnumCustAttribute.getValue().push($(this).attr('attribute:literalName'));
                  myEnumCustAttribute.getValue().sort();
               }
            }

            // ---- Empiler le nom du Custom Attribut, s'il n'existe pas dans la liste globale

            if (mySelf.#attributecust_list.indexOf(myCustAttribute.getName()) < 0) {
               mySelf.#attributecust_list.push(myCustAttribute.getName());
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

            myArtefact.getTagList().push(myTag);
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

         myArtefact.setId($(this).find('rrm\\:identifier').first().text());
         myArtefact.setUri($(this).find('rrm\\:about').first().text());
         myArtefact.setFormat($(this).find('rrm\\:format').first().text());
         myArtefact.setBookorder($(this).find('rrm\\:bookOrder').first().text());

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
         return this.#artefact_list.find(artefact => artefact.getId() === id && artefact.getBookorder() === order);
      } else {
         return this.#artefact_list.find(artefact => artefact.getId() === id);
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

class ClassArtefact { // ---- Caracteristiques d'un artefact
   #id;              // ---- Identifiant artefact
   #uri;             // ---- URI artefact
   #format;          // ---- Format de l'artefact
   #modified;        // ---- Date de modification
   #content;         // ---- Contenu ("Contents")
   #type;            // ---- Type artefact
   #bookorder;       // ---- Position in module hierarchy
   #custattr_list;   // ---- Liste des attributs (liste d'objets de la classe "ClassAttribute")
   #tag_list;        // ---- Liste des tags (Tag Value + Tag Scope)
   #joinedfile_list; // ---- Liste des pieces jointes de l'artefact (images, autres fichiers ...)

   constructor() {
      this.#id = null;
      this.#uri = null;
      this.#format = null;
      this.#modified = null;
      this.#content = null;
      this.#type = null;
      this.#bookorder = null;
      this.#custattr_list = [];
      this.#tag_list = [];
      this.#joinedfile_list = [];
   }

   // ---- Getters

   getId() {
      return this.#id;
   }

   getUri() {
      return this.#uri;
   }

   getFormat() {
      return this.#format;
   }

   getModified() {
      return this.#modified;
   }

   /**
    * Get the content of the artifact, with the possibility to clean the content for a more relevant comparison
    * between source and target artifacts (we keep only the text and basic formatting (paragraphs, lists, tables)
    * and we remove all the other HTML tags and attributes that are not relevant for the content comparison)
    * @param {Boolean} cleaned - Clean the content (optional, default = false)
    * @returns {String} - Artifact content
    */

   getContent(cleaned = false) {
      if (!cleaned) {
         return this.#content;
      } else {
         const $wrapper = $('<div>').html(this.#content); // ---- We wrap the content in a div to be able to manipulate it with jQuery
         const $innerDiv = $wrapper.find('div[xmlns]');

         if ($innerDiv.length === 0) { // ---- No inner div with xmlns found, we consider that the content is not wrapped in a div with xmlns and we clean the content from all HTML tags except paragraphs, lists and tables
            return $wrapper.find('div').last().html().trim();
         }

         return "<html><body><div>" + $innerDiv.html().trim() + "</div></body></html>";
      }
   }

   getType() {
      return this.#type;
   }

   getBookorder() {
      return this.#bookorder;
   }

   getCustattrList() {
      return this.#custattr_list;
   }

   getTagList() {
      return this.#tag_list;
   }

   getJoinedfileList() {
      return this.#joinedfile_list;
   }

   // ---- Setters

   setId(id) {
      this.#id = id;
   }

   setUri(uri) {
      this.#uri = uri;
   }

   setFormat(format) {
      this.#format = format;
   }

   setModified(modified) {
      this.#modified = modified;
   }

   setContent(content) {
      this.#content = content;
   }

   setType(type) {
      this.#type = type;
   }

   setBookorder(bookorder) {
      this.#bookorder = bookorder;
   }

   /**
    * Rechercher un attribut par son nom
    * @param {String} name - Nom de l'artefact
    * @returns {Object} - Objet de type "ClassAttribute"
    */

   get_attributeByName(name) {
      return this.#custattr_list.find(attribute => attribute.getName() === name);
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

      while ((myMatch = regexp.exec(this.#content)) !== null) {

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

      let myNewContent = this.#content;
      let myMatch;

      while ((myMatch = regexp.exec(this.#content)) !== null) {
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
      let myTag = this.#tag_list.find(tag => tag.value === value);

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

      for (let myTag of this.#tag_list) {
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
    * @param {Array of ReqIFArtefact} reqifArtefact - Artefact à convertir
    * @param {Array of ReqIFArtefact} reqifArtefactList - Liste des artefacts
    * @param {Array of ReqIFArtefactType} reqifArtefactTypeList - Liste des type d'artefacts
    * @param {Array of ReqIFDataType} reqifDataTypeList - Liste des types de données
    */

   get_datareqif(reqifArtefact, reqifArtefactList, reqifArtefactTypeList, reqifDataTypeList) {
      let myReqifArtefact;
      let myReqifType;

      // ---- Identifier le type d'artefact

      myReqifArtefact = reqifArtefactList.find(artifact => artifact.id === reqifArtefact);
      myReqifType = reqifArtefactTypeList.find(type => type.id === myReqifArtefact.typeid);

      this.setType(myReqifType.name);

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

class ClassAttribute { // ---- Caracteristiques d'un attribut
   #name;          // ---- Nom de l'attribut
   #type;          // ---- Type de l'attribut (URI du type)
   #isenum;        // ---- Est une enumeration
   #ismultivalue;  // ---- Est multivalue
   #value;         // ---- Tableau des valeurs possibles de l'attribut

   constructor() {
      this.#name = null;
      this.#type = null;
      this.#isenum = null;
      this.#ismultivalue = null;
      this.#value = [];
   }

   // ---- Getters

   getName() {
      return this.#name;
   }

   getType() {
      return this.#type;
   }

   getIsenum() {
      return this.#isenum;
   }

   getIsmultivalue() {
      return this.#ismultivalue;
   }

   getValue() {
      return this.#value;
   }

   // ---- Setters

   setName(name) {
      this.#name = name;
   }

   setType(type) {
      this.#type = type;
   }

   setIsenum(isenum) {
      this.#isenum = isenum;
   }

   setIsmultivalue(ismultivalue) {
      this.#ismultivalue = ismultivalue;
   }
}

class ClassJoinedFile { // ---- Caracteristiques d'une piece jointe a un artefact
   #id;       // ---- Identifiant de la piece jointe
   #uri;      // ---- URI de la piece jointe
   #type;     // ---- Type de piece jointe (image, autres fichiers ...)
   #modified; // ---- Date de modification

   constructor() {
      this.#id = null;
      this.#uri = null;
      this.#type = null;
      this.#modified = null;
   }

   // ---- Getters

   getId() {
      return this.#id;
   }

   getUri() {
      return this.#uri;
   }

   getType() {
      return this.#type;
   }

   getModified() {
      return this.#modified;
   }

   // ---- Setters

   setId(id) {
      this.#id = id;
   }

   setUri(uri) {
      this.#uri = uri;
   }

   setType(type) {
      this.#type = type;
   }

   setModified(modified) {
      this.#modified = modified;
   }

   set(uri) {

      // ---- Le type et l'id de la piece jointe seront etablis a partir de l'URI qui transporte les informations associees

      // ---- this.setId(...) = expression reguliere a partir de l'uri
      // ---- this.setType(...) =
   }
}
