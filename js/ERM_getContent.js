/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/

/* ------------------------------------------------------------------------------
   ---- Constantes
   --------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/**
 * Chargement du module "Old" (Text artifact only)
 * @param {Integer} pos - Position de pagination
 */

/* function load_oldTxtmodule(pos) {
   const REST_RM_GETMODULE_OLD = RM_HOSTNAME + "/rm/publish/text?moduleURI=" + g_ModuleOld.getIdentifier() + "&projectURI=" + g_Project.getIdentifier() + "&oslc_config.context=" + g_ModuleOld.getConf().getUrl();

   let myPaging = "&scoped=true&size=" + PAGE_SIZE + "&pos=";

   // ---- Gestion de la pagination de la requete

   if (pos !== undefined && pos > 0) {
      myPaging += pos;
   } else {
      myPaging += "0";
   }

   let myRequest = {
      'rest_method': "GET",
      'rest_url': REST_RM_GETMODULE_OLD + myPaging,
      'rest_success': "",
      'rest_failed': ""
   }

   // ---- Chargement du module

   console.log("$$$ Load modules (old) '" + g_ModuleOld.getIdentifier() + "'\n");

   gui_InitTableStat(GUI_ITEM_oldstatdiv, IS_INPROGRESS, g_ModuleOld.getPageOffset(), g_ModuleOld.artefactCount());

   $.when(ajax_async_request(myRequest, g_ModuleOld.get_data.bind(g_ModuleOld), gui_FailedOldTableStat, null)).then(function () {

      // ---- Si la reponse est paginee, il faut de nouveau faire une requete pour recuperer la page suivante

      if (g_ModuleOld.getPageOffset() == (PAGE_SIZE * g_ModuleOld.getNbpage())) {
         load_oldTxtmodule(g_ModuleOld.getPageOffset());

         console.log("$$$ Old - Get new page : '" + g_ModuleOld.getPageOffset() + "'\n");
      } else {
         if (g_ModuleOld.artefactCount() > 0) { // ---- Le module s'est charge correctement
            gui_BuildTableStat(GUI_ITEM_oldstatdiv, g_ModuleOld);

            // ---- Activer le bouton de compararaison si le nouveau module a lui aussi ete charge

            if (g_ModuleNew.artefactCount() > 0) {
               gui_mgtButtonDrop(GUI_ITEM_COMPARE_BTN_ROOT, ACTION_ACTIVE_ON);
            }
         } else {
            gui_FailedOldTableStat();
            gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_ERROR, "Old Module is empty !");
         }

         console.log("$$$ Old - Number of pages read : '" + g_ModuleOld.getNbpage() + "'\n");
      }
   });
} */

/**
 * Chargement du module "New" (Text artifact only)
 * @param {Integer} pos - Position de pagination
 */

/* function load_newTxtmodule(pos) {
   const REST_RM_GETMODULE_NEW = RM_HOSTNAME + "/rm/publish/text?moduleURI=" + g_ModuleNew.getIdentifier() + "&projectURI=" + g_Project.getIdentifier() + "&oslc_config.context=" + g_ModuleNew.getConf().getUrl();

   let myPaging = "&scoped=true&size=" + PAGE_SIZE + "&pos=";

   // ---- Gestion de la pagination de la requete

   if (pos !== undefined && pos > 0) {
      myPaging += pos;
   } else {
      myPaging += "0";
   }

   let myRequest = {
      'rest_method': "GET",
      'rest_url': REST_RM_GETMODULE_NEW + myPaging,
      'rest_success': "",
      'rest_failed': ""
   }

   // ---- Chargement du module

   console.log("$$$ Load modules (new) '" + g_ModuleNew.getIdentifier() + "'\n");

   gui_InitTableStat(GUI_ITEM_newstatdiv, IS_INPROGRESS, g_ModuleNew.getPageOffset(), g_ModuleNew.artefactCount());

   $.when(ajax_async_request(myRequest, g_ModuleNew.get_data.bind(g_ModuleNew), gui_FailedNewTableStat, null)).then(function () {

      // ---- Si la reponse est paginee, il faut de nouveau faire une requete pour recuperer la suite

      if (g_ModuleNew.getPageOffset() == (PAGE_SIZE * g_ModuleNew.getNbpage())) {
         load_newTxtmodule(g_ModuleNew.getPageOffset());

         console.log("$$$ New - Get new page : '" + g_ModuleNew.getPageOffset() + "'\n");
      } else {
         if (g_ModuleNew.artefactCount() > 0) { // ---- Le module s'est charge correctement
            gui_BuildTableStat(GUI_ITEM_newstatdiv, g_ModuleNew);

            // ---- Activer le bouton de compararaison si l'ancien module a lui aussi ete charge

            if (g_ModuleOld.artefactCount() > 0) {
               gui_mgtButtonDrop(GUI_ITEM_COMPARE_BTN_ROOT, ACTION_ACTIVE_ON);
            }
         } else {
            gui_FailedNewTableStat();
            gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_ERROR, "New Module is empty !");
         }

         console.log("$$$ New - Number of pages read : '" + g_ModuleNew.getNbpage() + "'\n");
      }
   });
} */


/*******************************************************************************/

/**
 * Get the module structure
 * @param {ClassModule} module - Module object
 * @param {ClassProject} project - Project object
 * @param {ERM_Configuration} configuration - Configuration object
 * @param {String} source - Source is "old" or "new"
 */

function get_ModuleStructure(module, project, configuration, source) {
   let myRESTRequest = {
      'method': "GET",
      'rest_url': extractRmBase(module.getUrl()) + "/publish/modules?resourceURI=" + module.getIdentifier() + "&oslc_config.context=" + configuration.getUrl(),
      'successCallback': success_get_ModuleStructure,
      'successArg': {
         'source': source,
         'module': module,
         'project': project,
         'configuration': configuration
      },
      'errorCallback': failed_get_ModuleStructure,
      'errorArg': module,
      'timeout': 30000
   };

   module.empty(); // ---- Empty module structure each time it is reloaded

   mgt_Console(get_ModuleStructure.name + " - Get module structure for : " + module.getUrl(), CONSOLE_INFO);

   // ---- Display loading indicator

   if (source === "old") {
      gui_InitTableStat(GUI_ITEM_oldstatdiv, IS_INPROGRESS, module.getPageOffset());
   } else {
      gui_InitTableStat(GUI_ITEM_newstatdiv, IS_INPROGRESS, module.getPageOffset());
   }

   queueManager.addToQueue(myRESTRequest);
}

/**
 * Success callback for get_ModuleStructure function
 * @param {Object} success - Structure with module + configuration objects
 * @param {String} data - The REST response data
 */

function success_get_ModuleStructure(success, data) {
   let xmlData = $.parseXML(data);

   $(xmlData).find(DS_ARTIFACT).children(DS_MODULECONTEXT).children(RRM_CONTEXTBINDING).each(function () {
      let myArtefact = new ERM_Artefact();

      myArtefact.init($(this));

      success.module.add_Artifact(myArtefact);
   });

   mgt_Console(success_get_ModuleStructure.name + " - Module contents " + success.module.getArtifactList().length + " artifacts", CONSOLE_INFO);

   // ---- Get the module content

   load_ModuleContent(success.module, success.project, success.configuration, success.source);
}

/**
 * Error callback for get_ModuleStructure function
 * @param {ClassModule} module - The module object for which to get the structure
 * @param {Number} httpCode - The HTTP response code from the REST request
 */

function failed_get_ModuleStructure(module, httpCode) {
   mgt_Console(failedget_ModuleStructure.name + " - Can not get module structure for : " + module.getName() + " - " + httpCode, CONSOLE_ERROR);

   gui_FatalError("<strong>ERROR : </strong> Can not the module structure for '" + module.getName() + "' !");
}

/**
 * Load the module content
 * @param {ClassModule} module - Module object
 * @param {ERM_Configuration} configuration - Configuration object
 * @param {ClassProject} project - Project object
 * @param {String} source - Source is "old" or "new"
 * @param {Integer} position - Paging position
 */

function load_ModuleContent(module, project, configuration, source, position) {
   const RRAPI_PAGESIZE = 5;

   let myPaging = "&scoped=true&size=" + RRAPI_PAGESIZE + "&pos=" + (position !== undefined && position > 0 ? position : "0");
   let myRESTRequest = {
      'method': "GET",
      'rest_url': extractRmBase(module.getUrl()) + "/publish/text?moduleURI=" + module.getIdentifier() + "&projectURI=" + project.getIdentifier() + "&oslc_config.context=" + configuration.getUrl() + myPaging,
      'successCallback': success_load_ModuleContent,
      'successArg': {
         'source': source,
         'module': module,
         'project': project,
         'configuration': configuration,
         'position': (position !== undefined ? position : 0)
      },
      'errorCallback': failed_load_ModuleContent,
      'errorArg': {
         'source': source,
         'module': module
      },
      'timeout': 30000
   };

   mgt_Console(load_ModuleContent.name + " - Load module content for '" + module.getName() + "' (" + source + ")", CONSOLE_INFO);

   // ---- Manage loading indicator

   if (source === "old") {
      gui_InitTableStat(GUI_ITEM_oldstatdiv, IS_INPROGRESS, module.getPageOffset(), module.artefactCount());
   } else {
      gui_InitTableStat(GUI_ITEM_newstatdiv, IS_INPROGRESS, module.getPageOffset(), module.artefactCount());
   }

   // ---- Send request

   if (module.getPageOffset() === 0) { // ---- First call !
      mgt_Console(load_ModuleContent.name + " - Fist call for content loading for '" + source + "'", CONSOLE_INFO);

      queueManager.addToQueue(myRESTRequest);
   } else if (module.getPageOffset() == (RRAPI_PAGESIZE * module.getNbpage())) { // ---- Next page
      mgt_Console(load_ModuleContent.name + " - Get new page : " + module.getPageOffset(), CONSOLE_INFO);

      queueManager.addToQueue(myRESTRequest);
   } else { // ---- Content loading is finished
      mgt_Console(load_ModuleContent.name + " - Content loading is finishad for '" + module.getName() + "' (" + source + ")", CONSOLE_INFO);

      if (source === "old") {
         gui_BuildTableStat(GUI_ITEM_oldstatdiv, module);
      } else {
         gui_BuildTableStat(GUI_ITEM_newstatdiv, module);
      }
   }
}

/**
 * Success callback for load_ModuleContent function
 * @param {Object} success - Succes message structure
 * @param {String} data - The REST response data
 */

function success_load_ModuleContent(success, data) {
   let xmlData = $.parseXML(data);
   let myPosition;
   let myHref;

   success.module.setNbpage(success.module.getNbpage() + 1);

   // ---- Read page position

   myHref = $(xmlData).find(DS_DATASOURCE).attr('href');

   if (myHref != undefined) {
      myHref = decodeURIComponent(myHref);
      myPosition = myHref.match(/^https.+(&pos=([0-9]+)).*/);

      success.module.setPageOffset(myPosition[2]);
   }

   mgt_Console(success_load_ModuleContent.name + " - Load module content for '" + success.module.getName() + "' (" + success.source + ") at range " + success.position + "/" + success.module.getPageOffset(), CONSOLE_INFO);

   // ---- Get artifact contents and attributes

   $(xmlData).find(DS_ARTIFACT).each((index, node) => {
      let myArtefactId = $(node).children(RRM_IDENTIFIER).text();
      let myArtefactOrder = $(node).children(DS_MODULECONTEXT).children(RRM_CONTEXTBINDING).children(RRM_BOOKORDER).text();

      // ---- Module structure is already preloaded : the goal is to find the artifact in the existing structure

      let myArtifact = success.module.get_artefactById(myArtefactId, myArtefactOrder);

      if (myArtifact === undefined) {
         mgt_Console(success_load_ModuleContent.name + " - Can not find artifact " + myArtefactId + " in the module structure !", CONSOLE_ERROR);
      } else { // ---- Get artifact details
         myArtifact.load($(node));
      }
   });

   // ---- Get another page

   load_ModuleContent(success.module, success.project, success.configuration, success.source, success.module.getPageOffset());
}

/**
 * Failed callback for load_ModuleContent function
 * @param {Object} error - Error message structure
 * @param {String} data - The REST response data
 */

function failed_load_ModuleContent(error) {
   mgt_Console(failed_load_ModuleContent.name + " - Can not load module : " + error.module.getName(), CONSOLE_ERROR);

   if (error.source === "old") {
      gui_InitTableStat(GUI_ITEM_oldstatdiv, IS_ERROR);
   } else {
      gui_InitTableStat(GUI_ITEM_newstatdiv, IS_ERROR);
   }
}

/**
 * Chargement des modules "Old" et "New"
 */

function load_module() {
   gui_InitTableStat(GUI_ITEM_oldstatdiv);

   switch (g_CompareMode) {
      case COMPARE_MODE_LOCALLOCAL:
         gui_InitTableStat(GUI_ITEM_newstatdiv);

         get_ModuleStructure(g_ModuleOld, g_Project, g_ConfOld, "old");
         get_ModuleStructure(g_ModuleNew, g_Project, g_ConfNew, "new");

         // load_OldModule ();
         // load_NewModule ();
         break;

      case COMPARE_MODE_LOCALREQIF:
         get_ModuleStructure(g_ModuleOld, g_Project, g_ConfOld, "old");
         break;

      default:
         break;
   }
}


/**
 * Chargement de la structure du module "Old"
 * On récupère la liste de tous les artefacts contenus le module
 */

/* function load_OldModule () {
   const REST_RM_GETMODULESTR_OLD = RM_HOSTNAME + "/rm/publish/modules?resourceURI=" + g_ModuleOld.getIdentifier() + "&oslc_config.context=" + g_ModuleOld.getConf().getUrl();

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETMODULESTR_OLD,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   // ---- Vider le contenu du module et initialiser la zone d'affichage des statistiques

   g_ModuleOld.empty_artifact ();

   mgt_Console ("Load module structure (old) : " + g_ModuleOld.getIdentifier(), CONSOLE_INFO);

   gui_InitTableStat (GUI_ITEM_oldstatdiv, IS_INPROGRESS, g_ModuleOld.getPageOffset());

   // ---- On récupère la structure du module (tous artafacts, quelque soit leur format)

   $.when (ajax_async_request (myRequest, g_ModuleOld.get_structure.bind(g_ModuleOld), gui_FailedOldTableStat, null)).then(function () {
      load_oldTxtmodule ();
   });
} */

/**
 * Chargement de la structure du module "New"
 * On récupère la liste de tous les artefacts contenus le module
 */

/* function load_NewModule() {
   const REST_RM_GETMODULESTR_NEW = RM_HOSTNAME + "/rm/publish/modules?resourceURI=" + g_ModuleNew.getIdentifier() + "&oslc_config.context=" + g_ModuleNew.getConf().getUrl();

   let myRequest = {
      'rest_method': "GET",
      'rest_url': REST_RM_GETMODULESTR_NEW,
      'rest_success': "",
      'rest_failed': ""
   }

   // ---- Vider le contenu du module et initialiser la zone d'affichage des statistiques

   g_ModuleNew.empty_artifact();

   mgt_Console("Load module structure (new) : " + g_ModuleNew.getIdentifier(), CONSOLE_INFO);

   gui_InitTableStat(GUI_ITEM_newstatdiv, IS_INPROGRESS, g_ModuleNew.getPageOffset());

   // ---- On récupère la structure du module (tous artafacts, quelque soit leur format)

   $.when(ajax_async_request(myRequest, g_ModuleNew.get_structure.bind(g_ModuleNew), gui_FailedNewTableStat, null)).then(function () {
      load_newTxtmodule();
   });
} */

