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

function load_oldTxtmodule (pos) {
   const REST_RM_GETMODULE_OLD = RM_HOSTNAME + "/rm/publish/text?moduleURI=" + g_ModuleOld.getIdentifier() + "&projectURI=" + g_Project.getIdentifier() + "&oslc_config.context=" + g_ModuleOld.getConf().getUrl();

   let myPaging = "&scoped=true&size="+ PAGE_SIZE + "&pos=";

   // ---- Gestion de la pagination de la requete

   if (pos !== undefined && pos > 0) {
      myPaging += pos;
   } else {
      myPaging += "0";
   }

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETMODULE_OLD + myPaging,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   // ---- Chargement du module

   console.log ("$$$ Load modules (old) '" + g_ModuleOld.getIdentifier() + "'\n");
   
   gui_InitTableStat (GUI_ITEM_oldstatdiv, IS_INPROGRESS, g_ModuleOld.getPagepos(), g_ModuleOld.artefactCount ());

   $.when (ajax_async_request (myRequest, g_ModuleOld.get_data.bind(g_ModuleOld), gui_FailedOldTableStat, null)).then(function () {

      // ---- Si la reponse est paginee, il faut de nouveau faire une requete pour recuperer la page suivante

      if (g_ModuleOld.getPagepos() == (PAGE_SIZE * g_ModuleOld.getNbpage())) {
         load_oldTxtmodule (g_ModuleOld.getPagepos());

         console.log ("$$$ Old - Get new page : '" + g_ModuleOld.getPagepos() + "'\n");
      } else {
         if (g_ModuleOld.artefactCount() > 0) { // ---- Le module s'est charge correctement
            gui_BuildTableStat (GUI_ITEM_oldstatdiv, g_ModuleOld);

            // ---- Activer le bouton de compararaison si le nouveau module a lui aussi ete charge

            if (g_ModuleNew.artefactCount() > 0) {
               gui_mgtButtonDrop (GUI_ITEM_COMPARE_BTN_ROOT, ACTION_ACTIVE_ON);
            }
         } else {
            gui_FailedOldTableStat ();
            gui_mgtAlert (GUI_ITEM_ALERT_ROOT, IS_ERROR, "Old Module is empty !");
         }

         console.log ("$$$ Old - Number of pages read : '" + g_ModuleOld.getNbpage() + "'\n");
      }
   });
}

/**
 * Chargement du module "New" (Text artifact only)
 * @param {Integer} pos - Position de pagination
 */

function load_newTxtmodule (pos) {
   const REST_RM_GETMODULE_NEW = RM_HOSTNAME + "/rm/publish/text?moduleURI=" + g_ModuleNew.getIdentifier() + "&projectURI=" + g_Project.getIdentifier() + "&oslc_config.context=" + g_ModuleNew.getConf().getUrl();

   let myPaging = "&scoped=true&size="+ PAGE_SIZE + "&pos=";

   // ---- Gestion de la pagination de la requete

   if (pos !== undefined && pos > 0) {
      myPaging += pos;
   } else {
      myPaging += "0";
   }

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETMODULE_NEW + myPaging,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   // ---- Chargement du module

   console.log ("$$$ Load modules (new) '" + g_ModuleNew.getIdentifier() + "'\n");
   
   gui_InitTableStat (GUI_ITEM_newstatdiv, IS_INPROGRESS, g_ModuleNew.getPagepos(), g_ModuleNew.artefactCount ());

   $.when (ajax_async_request (myRequest, g_ModuleNew.get_data.bind(g_ModuleNew), gui_FailedNewTableStat, null)).then(function () {

      // ---- Si la reponse est paginee, il faut de nouveau faire une requete pour recuperer la suite

      if (g_ModuleNew.getPagepos() == (PAGE_SIZE * g_ModuleNew.getNbpage())) {
         load_newTxtmodule (g_ModuleNew.getPagepos());

         console.log ("$$$ New - Get new page : '" + g_ModuleNew.getPagepos() + "'\n");
      } else {
         if (g_ModuleNew.artefactCount() > 0) { // ---- Le module s'est charge correctement
            gui_BuildTableStat (GUI_ITEM_newstatdiv, g_ModuleNew);

            // ---- Activer le bouton de compararaison si l'ancien module a lui aussi ete charge
            
            if (g_ModuleOld.artefactCount() > 0) {
               gui_mgtButtonDrop (GUI_ITEM_COMPARE_BTN_ROOT, ACTION_ACTIVE_ON);
            }            
         } else {
            gui_FailedNewTableStat ();
            gui_mgtAlert (GUI_ITEM_ALERT_ROOT, IS_ERROR, "New Module is empty !");
         }

         console.log ("$$$ New - Number of pages read : '" + g_ModuleNew.getNbpage() + "'\n");
      }
   });
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

   gui_InitTableStat (GUI_ITEM_oldstatdiv, IS_INPROGRESS, g_ModuleOld.getPagepos());

   // ---- On récupère la structure du module (tous artafacts, quelque soit leur format)

   $.when (ajax_async_request (myRequest, g_ModuleOld.get_structure.bind(g_ModuleOld), gui_FailedOldTableStat, null)).then(function () {
      load_oldTxtmodule ();
   });
} */

function load_OldModule (module, configuration) {
   const REST_RM_GETMODULESTR_OLD = extractRmBase(module.getUrl()) + "/publish/modules?resourceURI=" + module.getIdentifier() + "&oslc_config.context=" + configuration.getUrl();

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETMODULESTR_OLD,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   // ---- Vider le contenu du module et initialiser la zone d'affichage des statistiques

   module.empty_artifact ();

   mgt_Console ("Load module structure (old) : " + module.getIdentifier(), CONSOLE_INFO);

   gui_InitTableStat (GUI_ITEM_oldstatdiv, IS_INPROGRESS, module.getPagepos());

   // ---- On récupère la structure du module (tous artafacts, quelque soit leur format)

   $.when (ajax_async_request (myRequest, module.get_structure.bind(module), gui_FailedOldTableStat, null)).then(function () {
      load_oldTxtmodule ();
   });
}



function get_ModuleStructure (module, configuration) {
   let myRESTRequest = {
      'method': "GET",
      'rest_url': extractRmBase(module.getUrl()) + "/publish/modules?resourceURI=" + module.getIdentifier() + "&oslc_config.context=" + configuration.getUrl(),
      'successCallback': success_get_ModuleStructure,
      'successArg' : module,
      'errorCallback': failedget_ModuleStructure,
      'errorArg': module,
      'timeout': 30000
   };

   mgt_Console(get_ModuleStructure.name + " - Get module structure for : " + module.getUrl(), CONSOLE_INFO);

   queueManager.addToQueue(myRESTRequest);
}

function success_get_ModuleStructure (module, data) {
   let xmlData = $.parseXML(data);

   

}

/**
 * Error callback for get_ModuleStructure function
 * @param {ClassModule} module - The module object for which to get the structure
 * @param {Number} httpCode - The HTTP response code from the REST request
 */

function failedget_ModuleStructure (module, httpCode) {
   mgt_Console(failedget_ModuleStructure.name + " - Can not get module structure for : " + module.getName() + " - " + httpCode, CONSOLE_ERROR);

   gui_FatalError("<strong>ERROR : </strong> Can not the module structure for '" + module.getName() + "' !");
}

/**
 * Chargement de la structure du module "New"
 * On récupère la liste de tous les artefacts contenus le module
 */

function load_NewModule () {
   const REST_RM_GETMODULESTR_NEW = RM_HOSTNAME + "/rm/publish/modules?resourceURI=" + g_ModuleNew.getIdentifier() + "&oslc_config.context=" + g_ModuleNew.getConf().getUrl();

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETMODULESTR_NEW,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   // ---- Vider le contenu du module et initialiser la zone d'affichage des statistiques

   g_ModuleNew.empty_artifact ();

   mgt_Console ("Load module structure (new) : " + g_ModuleNew.getIdentifier(), CONSOLE_INFO);

   gui_InitTableStat (GUI_ITEM_newstatdiv, IS_INPROGRESS, g_ModuleNew.getPagepos());

   // ---- On récupère la structure du module (tous artafacts, quelque soit leur format)

   $.when (ajax_async_request (myRequest, g_ModuleNew.get_structure.bind(g_ModuleNew), gui_FailedNewTableStat, null)).then(function () {
      load_newTxtmodule ();
   });
}

/**
 * Chargement des modules "Old" et "New"
 */

function load_module () {
   gui_InitTableStat (GUI_ITEM_oldstatdiv);

   switch (g_CompareMode) {
      case COMPARE_MODE_LOCALLOCAL:
            gui_InitTableStat (GUI_ITEM_newstatdiv);
      
            load_OldModule ();
            load_NewModule ();
         break;

      case COMPARE_MODE_LOCALREQIF:
            load_OldModule ();
         break;

      default:
         break;
   }
}
