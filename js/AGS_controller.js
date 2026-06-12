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

const IS_TRUE           = "true";
const IS_FALSE          = "false";

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
 * Requete AJAX - Asynchrone
 * @param {Object} rest_request - Requete REST (REST URL de la requete AJAX et messages associés)
 * @param {*} success_func - Fonction a appeler sur la requete est un succes
 * @param {*} failed_func - Fonction a appeler sur la requete est un echec
 * @param {*} always_func - Fonction a appeler quel que soit l'état de la requête
 */

function ajax_async_request (rest_request, success_func, failed_func, always_func) {
   const APPL_LAUNCHDELAY = 6000;

   return $.ajax ({
      url: rest_request.rest_url,
      method: ((rest_request.method === undefined) ? "GET" : rest_request.method),
      dataType: "text",
      headers: {
          "OSLC-Core-Version": "2.0",
          "Accept": "xml+rdf",
      },
      xhrFields: {
			withCredentials: true
		},
      crossdomain: true,
      async: ((rest_request.async === undefined) ? true : rest_request.async)
   }) // ---- Request successfull
   .done (function (data, textStatus, jqXHR) {
      console.log ("$$$ AJAX-GET call is successfull for '" + rest_request.rest_url + "' !");

      if (success_func) {
         success_func (data);
      }
   }) // ---- Request failed
   .fail (function (jqXHR, textStatus, errorThrown) {
      console.log ("### ERROR : AJAX-GET call failed for '" + rest_request.rest_url + "' !");

      if (jqXHR.status === 401) { // ---- 401 : need an authentication challenge
         console.log ("### ERROR : Authentication challenge needed with code '" + jqXHR.status + "' !");

         // ---- Open application window

         open_winappl (rest_request.rest_url);

         // ---- After a time out, relaunch te request

         setTimeout (() => { // ---- Waiting for opened windows run authentication challenge
               ajax_async_request (rest_request, success_func, failed_func, always_func);
            },
            APPL_LAUNCHDELAY
         );
      } else if (failed_func) { // ---- Other errors
         failed_func (jqXHR.status);
      }
   }) // ---- System message
   .always (function (data, textStatus, jqXHR) {
      console.log ("--- textStatus = '" + textStatus + "'");

   if (always_func) {
         if (textStatus == "error") {
            always_func (IS_ERROR, rest_request.rest_failed);
         } else {
            always_func (IS_SUCCESS, rest_request.rest_success);
         }
      }
   });
}

/**
 * Requete AJAX - Asynchrone - Withe parameters
 * @param {Object} rest_request - Requete REST (REST URL de la requete AJAX et messages associés)
 * @param {*} success_func - Fonction a appeler sur la requete est un succes
 * @param {*} failed_func - Fonction a appeler sur la requete est un echec
 * @param {*} callback_parm - Parametre a transmettre aux callback fonctions
 */

function ajax_async_parm_request (rest_request, success_func, failed_func, callback_parm) {
   return $.ajax ({
      url: rest_request.rest_url,
      method: ((rest_request.method === undefined) ? "GET" : rest_request.method),
      data: $.param(callback_parm),
      dataType: "text",
      headers: {
          "OSLC-Core-Version": "2.0",
          "Accept": "xml+rdf",
      },
      xhrFields: {
			withCredentials: true
		},
      crossdomain: true,
      async: ((rest_request.async === undefined) ? true : rest_request.async)
   }) // ---- Request successfull
   .done (function (data, textStatus, jqXHR) {
      console.log ("$$$ AJAX-GET call is successfull for '" + rest_request.rest_url + "' !");

      if (success_func) {
         success_func (callback_parm, data, jqXHR);
      }
   }) // ---- Request failed
   .fail (function (jqXHR, textStatus, errorThrown) {
      console.log ("### ERROR : AJAX-GET call failed for '" + rest_request.rest_url + "' !");

      if (jqXHR.status === 401) { // ---- 401 : need an authentication challenge
         console.log ("### ERROR : Authentication challenge needed with code '" + jqXHR.status + "' !");

         // ---- Open application window

         open_winappl (rest_request.rest_url);

         // ---- After a time out, relaunch te request

         setTimeout (() => { // ---- Waiting for opened windows run authentication challenge
               ajax_async_parm_request (rest_request, success_func, failed_func, callback_parm);
            },
            APPL_LAUNCHDELAY
         );
      } else if (failed_func) {
         failed_func (callback_parm, jqXHR);
      }
   }) // ---- System message
   .always (function (data, textStatus, jqXHR) {
      console.log ("--- textStatus = '" + textStatus + "'");
   });
}

/* ---- Listes d'objets ------------------------------------------------------ */

/**
 * Construire le "Dropdown Button" contenant la liste des projets
 */

function BuildProjectList ( ) {
   const REST_RM_GETPROJECTLIST = RM_HOSTNAME + "/rm/process/project-areas";

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETPROJECTLIST,
      'rest_success' : "",
      'rest_failed'  : ""
   }   

   ajax_async_request (myRequest, gui_BuildProjectBtn, gui_FailProjectBtn, null);
}

/**
 * Construire le "Dropdown Button" contenant la liste des composants
 * @param {String} prjId - Identifiant du projet
 */

function BuildComponentList (prjId) {
   const REST_RM_GETCOMPONENTLIST = RM_HOSTNAME + "/rm/rm-projects/" + prjId + "/components";

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETCOMPONENTLIST,
      'rest_success' : "",
      'rest_failed'  : ""
   }   

   console.log ("$$$ Get components for project : '" + prjId + "'\n");

   ajax_async_request (myRequest, gui_BuildComponentBtn, gui_FailComponentBtn, null);
}

/**
 * Construire les "Dropdown Button" contenant la liste des configurations (Old et New)
 * @param {String} compId - Identifiant du composant
 */

function BuildConfList (compId) {
   const REST_RM_GETCONFLIST = RM_HOSTNAME + "/rm/cm/component/" + compId + "/configurations";

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETCONFLIST,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   console.log ("$$$ Get configurations for component : '" + compId + "'\n");

   ajax_async_request (myRequest, gui_BuildConfBtn, gui_FailConfBtn, null);
}

/**
 * Mettre à jour les "Dropdown Button" contenant la liste des configurations (Old et New)
 * @param {String} confId - URI de la configuration
 * @param {String} confObj - Objet de type ClassConfiguration
 */

function UpdateConfList (confObj) {
   const REST_RM_GETCONF = RM_HOSTNAME + "/rm/cm/" + confObj.getType() + "/" + confObj.getId();

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETCONF,
      'rest_success' : "",
      'rest_failed'  : "",
      'async'        : false // ---- Appel synchrone, car nécessaire pour permettre le tri des configurations
   }

   console.log ("$$$ Get name for configuration : '" + confObj.id + "'\n");

   ajax_async_request (myRequest, gui_UpdateConfBtn, gui_FailConfBtn, null);
}

/**
 * Construire le "Dropdown Button" contenant la liste des modules pour une configuration donnee
 * @param {String} prjURI - URI du projet (URI ou Id ?)
 * @param {String} compURI - URI du composant (URI ou Id ?)
 * @param {String} confURI - URI de la configuration
 * @param {String} state - Etat ("old" ou "new")
 */

function BuildModuleList (prjURI, compURI, confURI, state) {
   let myRestURL = RM_HOSTNAME + "/rm/views?oslc.query=true";

   // ---- Preparation requete OSLC

   let myContext = "";
   myContext    += "&project_URL=" + encodeURIComponent(prjURI);
	myContext    += "&oslc_config.context=" + encodeURIComponent(confURI);
	myContext    += "&componentURI=" + encodeURIComponent(compURI);	

   let myOslcPrefix = "";
	myOslcPrefix    += "&oslc.prefix=" + encodeURIComponent("oslc=<http://open-services.net/ns/core#>");
	myOslcPrefix    += "&oslc.prefix=" + encodeURIComponent("oslc_rm=<http://open-services.net/ns/rm#>");
	myOslcPrefix    += "&oslc.prefix=" + encodeURIComponent("dcterms=<http://purl.org/dc/terms/>");
	myOslcPrefix    += "&oslc.prefix=" + encodeURIComponent("rdf=<http://www.w3.org/1999/02/22-rdf-syntax-ns#>");

   let myOslcQuery = "";
   myOslcQuery    += "&oslc.select=dcterms:title,oslc:instanceShape,dcterms:modified,dcterms:identifier";
   myOslcQuery    += "&oslc.where=rdf:type=" + encodeURIComponent("<http://open-services.net/ns/rm#RequirementCollection>");
   
   myRestURL += myContext + myOslcPrefix + myOslcQuery;

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : myRestURL,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   console.log ("$$$ Get modules list for '" + state + "'\n");

   // ---- Executer requete

   if (state === IS_OLD) {
      ajax_async_request (myRequest, gui_BuildOldModuleBtn, gui_FailOldModuleBtn, null);
   } else {
      ajax_async_request (myRequest, gui_BuildNewModuleBtn, gui_FailNewModuleBtn, null);   
   }
}

/* ---- Charger les objets --------------------------------------------------- */

/**
 * Chargement du module "Old" (Text artifact only)
 * @param {Integer} pos - Position de pagination
 */

function load_oldTxtmodule (pos) {
   const REST_RM_GETMODULE_OLD = RM_HOSTNAME + "/rm/publish/text?moduleURI=" + g_ModuleOld.getId() + "&projectURI=" + g_Project.getId() + "&oslc_config.context=" + g_ModuleOld.getConf().getUrl();

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

   console.log ("$$$ Load modules (old) '" + g_ModuleOld.getId() + "'\n");
   
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
   const REST_RM_GETMODULE_NEW = RM_HOSTNAME + "/rm/publish/text?moduleURI=" + g_ModuleNew.getId() + "&projectURI=" + g_Project.getId() + "&oslc_config.context=" + g_ModuleNew.getConf().getUrl();

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

   console.log ("$$$ Load modules (new) '" + g_ModuleNew.getId() + "'\n");
   
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

function load_OldModule () {
   const REST_RM_GETMODULESTR_OLD = RM_HOSTNAME + "/rm/publish/modules?resourceURI=" + g_ModuleOld.getId() + "&oslc_config.context=" + g_ModuleOld.getConf().getUrl();

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETMODULESTR_OLD,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   // ---- Vider le contenu du module et initialiser la zone d'affichage des statistiques

   g_ModuleOld.empty_artifact ();

   mgt_Console ("Load module structure (old) : " + g_ModuleOld.getId(), CONSOLE_INFO);

   gui_InitTableStat (GUI_ITEM_oldstatdiv, IS_INPROGRESS, g_ModuleOld.getPagepos());

   // ---- On récupère la structure du module (tous artafacts, quelque soit leur format)

   $.when (ajax_async_request (myRequest, g_ModuleOld.get_structure.bind(g_ModuleOld), gui_FailedOldTableStat, null)).then(function () {
      load_oldTxtmodule ();
   });
}

/**
 * Chargement de la structure du module "New"
 * On récupère la liste de tous les artefacts contenus le module
 */

function load_NewModule () {
   const REST_RM_GETMODULESTR_NEW = RM_HOSTNAME + "/rm/publish/modules?resourceURI=" + g_ModuleNew.getId() + "&oslc_config.context=" + g_ModuleNew.getConf().getUrl();

   let myRequest = {
      'rest_method'  : "GET",
      'rest_url'     : REST_RM_GETMODULESTR_NEW,
      'rest_success' : "",
      'rest_failed'  : ""
   }

   // ---- Vider le contenu du module et initialiser la zone d'affichage des statistiques

   g_ModuleNew.empty_artifact ();

   mgt_Console ("Load module structure (new) : " + g_ModuleNew.getId(), CONSOLE_INFO);

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
