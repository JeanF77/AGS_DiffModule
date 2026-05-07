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

/* --------------------------------------------------------------------------- */
// ---- GUI gadgets management

const ACTION_INIT                            = "actionInit";
const ACTION_SETLABEL                        = "actionSetLabel";
const ACTION_SETMETHOD                       = "actionSetMethod";
const ACTION_SETCONTENT                      = "actionSetContent";
const ACTION_APPENDCONTENT                   = "actionAppendContent";
const ACTION_ACTIVE_ON                       = "actionActiveOn";
const ACTION_ACTIVE_OFF                      = "actionActiveOff";
const ACTION_DISP_ON                         = "actionDisplayOn";
const ACTION_DISP_OFF                        = "actionDisplayOff";

// ---- Gestion des indicateurs graphiques dans l'IHM
// ----   4 indicateurs définis : Loading, Success, Warning et Error
// ----
// ---- Dans la définition de l'ID de l'indicateur (dans XML ou HTML), procéder comme suit :
// ----   - id="gui_myObjectLoading", ou id="gui_myObjectError" ...
// ----   - 'myObject" étant la racine de l'objet
// ----   - pour gérer l'objet graphique, il suffira d'appeler la fonction "gui_mgtIndicator"
// ----     en précisant la racine de l'objet et le status que l'on souhaite afficher

// ---- Status - GUI
// ----     - ROOT + STATUS
// ----     - ROOT = racine de l'objet graphique
// ----     - STATUS = "Loading", "Failed", "Success" ...

const GUI_STATUS_LOADING                     = "Loading";
const GUI_STATUS_SUCESS                      = "Success";
const GUI_STATUS_WARNING                     = "Warning";
const GUI_STATUS_ERROR                       = "Error";

// ---- Gestion des gadgets dans l'IHM
// ----   2 types de gadgets définis : Buttons et Dropdown Buttons
// ----
// ---- Dans la définition de l'ID du gadget (dans XML ou HTML), procéder comme suit :
// ----   - id="gui_myObjectBtn" (pour un bouton simple)
// ----   - id="gui_myObjectBtn" et id="gui_myObjectBtnContent" (pour un 'dropdown' bouton)
// ----   - 'myObject" étant la racine de l'objet
// ----   - pour gérer le gadget, il suffira d'appeler la fonction "gui_mgtButtonDrop"
// ----     en précisant la racine de l'objet et l'action que l'on souhaite effectuer

// ---- Targets - GUI
// ----     - ROOT + TARGET
// ----     - ROOT = racine de l'objet graphique
// ----     - TARGET = "Btn", "BtnContent" ...

const GUI_TARGET_BTN                         = "Btn";
const GUI_TARGET_BTNCONTENT                  = "BtnContent";

/* --------------------------------------------------------------------------- */
// ---- Constantes multi-usages

const IS_SUCCESS                             = "isSuccess";
const IS_ERROR                               = "isError";
const IS_WARNING                             = "isWarning";
const IS_INPROGRESS                          = "isInProgress";

/* --------------------------------------------------------------------------- */
// ---- Console messages management

const CONSOLE_INFO                           = "--- INFO : ";
const CONSOLE_WARNING                        = "§§§ WARN : ";
const CONSOLE_ERROR                          = "### ERROR : ";

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
 * Compare property "name" from array of objects, ascendant sort
 * @param {String} a - "a.name" to compare
 * @param {String} b - "b.name" to compare
 * @returns - Compare status (1 or -1)
 */

function compareName (a, b) {
	// Use toUpperCase() to ignore character casing
 
	const nameA = a.name.toUpperCase();
	const nameB = b.name.toUpperCase();
 
	let comparison = 0;
 
	if (nameA > nameB) {
	   comparison = 1;
	} else if (nameA < nameB) {
	   comparison = -1;
	}
 
   return comparison;
}

/**
 * Manage console messages
 * @param {String} consMsg - Console message
 * @param {String} status - Message type (optional, CONSOLE_INFO, CONSOLE_WARNING, CONSOLE_ERROR)
 */

function mgt_Console (msgText, msgType) {
	let myMsgPrefix;

	switch (msgType) {
		case CONSOLE_INFO:
			myMsgPrefix = CONSOLE_INFO;
		break;
		
		case CONSOLE_WARNING:
			myMsgPrefix = CONSOLE_WARNING;
		break;

		case CONSOLE_ERROR:
			myMsgPrefix = CONSOLE_ERROR;
		break;
			
		default: // ---- Option
			myMsgPrefix = CONSOLE_INFO;
	}

	console.log (myMsgPrefix + msgText);
}

/**
 * Generate HTML from HTML template
 * @param {String} templName - Template Name
 * @param {Object} context - Template Parameters
 * @returns - HTML Content
 */

function gui_htmlfromtemplate (templName, context) {
	let myHtmlTemplate = $("#" + templName);
	let myTemplate;
	let myTemplSrc;
	let myHtmlContent;
 
	myTemplSrc = myHtmlTemplate.html();
	myTemplate = Handlebars.compile(myTemplSrc);
 
	myHtmlContent = myTemplate (context);
 
	return myHtmlContent;
}

/* --------------------------------------------------------------------------- */
/* ----- JAZZ Utils                                                            */

/**
 * Recuperer les parametres <UserPref> d'un widget Jazz
 * @param {String} sUserPrefName - Nom du parametre
 */

function widget_get_UserPref (sUserPrefName) {
       var sValue = '';
       var prefs  = new gadgets.Prefs();

       sValue = prefs.getString(sUserPrefName);

       return sValue;
}

/* --------------------------------------------------------------------------- */
/* ----- GUI Utils                                                             */

/**
  * "Button" and "Dropdown Button" management
  * @param {String} guiRoot - GUI Object root name
  * @param {String} action - Action (ACTION_INIT, ACTION_SETLABEL, ACTION_SETMETHOD, ACTION_SETCONTENT, ACTION_APPENDCONTENT, ACTION_ACTIVE_ON, ACTION_ACTIVE_OFF, ACTION_DISP_ON, ACTION_DISP_OFF)
  * @param {Array or Method} content - String or Array of strings or Method
  */

function gui_mgtButtonDrop (guiRoot, action, content) {
   let myGuiObj        = $("#" + guiRoot + GUI_TARGET_BTN);
   let myGuiObjContent = $("#" + guiRoot + GUI_TARGET_BTNCONTENT);
   let myHtmlContent   = "";

   switch (action) {
      case ACTION_INIT: // ---- Reset label and empty content
         myGuiObj.empty();
         myGuiObj.html(content);
         myGuiObjContent.empty();

         myGuiObj.show();
         myGuiObj.prop('disabled', true);
      break;

      case ACTION_SETLABEL: // ---- Set Button Label
         myGuiObj.empty();
         myGuiObj.html(content);

         myGuiObj.show();
      break;

      case ACTION_SETMETHOD: // ---- Set Method
         myGuiObj.click(content);
      break;

      case ACTION_SETCONTENT: // ---- Set Button Content
         for (i = 0; i < content.length; i++) {
            myHtmlContent += content[i];
         }
         myGuiObjContent.empty();
         myGuiObjContent.html(myHtmlContent);
      break;

      case ACTION_APPENDCONTENT: // ---- Append Button Content
         myHtmlContent = myGuiObjContent.html() + content;
         myGuiObjContent.html(myHtmlContent);
      break;

      case ACTION_ACTIVE_ON: // ---- Activation and visible
         myGuiObj.prop('disabled', false);
         myGuiObj.show();
      break;

      case ACTION_ACTIVE_OFF: // ---- Deactivation and visible
         myGuiObj.prop('disabled', true);
         myGuiObj.show();
      break;

      case ACTION_DISP_ON: // ---- Display Button
         myGuiObj.show();
      break;

      case ACTION_DISP_OFF: // ---- Hide Button
         myGuiObj.hide();
      break;

      default:
         mgt_Console ('Unknown Button Action !', CONSOLE_WARNING);
   };
}

/**
 * "Alert Box" management
 * @param {*} guiRoot - GUI Object root name
 * @param {*} action - Action/Status (IS_SUCCESS, IS_WARNING, IS_ERROR, ACTION_DISP_OFF)
 * @param {*} content - HTML or text Content
 */

function gui_mgtAlert (guiRoot, action, content) {
   const ALERT_BUTTON = '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
   const RANDOMID = Math.floor(Math.random() * 100000);

   let myAlert   = $("#" + guiRoot);
   let myAlertId =  guiRoot + '_' + RANDOMID;
   let myHtmlContent;

   // ---- Définir une <div> vide dans laquelle viendront se placer les bannières d'alerte
   // ---- Selection du type d'alerte

   switch (action) {
      case IS_SUCCESS:
         // ---- Display Success
         myAlertId     += IS_SUCCESS;
         myHtmlContent  = '<div class="alert alert-success alert-dismissible" role="alert" id="' + myAlertId + '">';
         myHtmlContent += content;
         myHtmlContent += ALERT_BUTTON + '</div>';
         myAlert.append(myHtmlContent);

         // ---- Auto clean banner
         $("#" + myAlertId).fadeTo(5000, 1).slideUp(500, function(){
            $("#" + myAlertId).slideUp(500);
         });
      break;

      case IS_WARNING:
         // ---- Display Warning
         myAlertId     += IS_WARNING;
         myHtmlContent  = '<div class="alert alert-warning alert-dismissible" role="alert" id="' + myAlertId + '">';
         myHtmlContent += content;
         myHtmlContent += ALERT_BUTTON + '</div>';
         myAlert.append(myHtmlContent);

         // ---- Auto clean banner
         $("#" + myAlertId).fadeTo(5000, 1).slideUp(500, function(){
            $("#" + myAlertId).slideUp(500);
         });
      break;

      case IS_ERROR:
         // ---- Display Error (user must clean it - no auto clean !)
         myAlertId     += IS_ERROR;
         myHtmlContent  = '<div class="alert alert-danger alert-dismissible" role="alert" id="' + myAlertId + '">';
         myHtmlContent += content;
         myHtmlContent += ALERT_BUTTON + '</div>';
         myAlert.append(myHtmlContent);
      break;

      case ACTION_DISP_OFF:
         myAlert.empty ();
      break;

      default:
         mgt_Console ('Unknown Alert Action !', CONSOLE_WARNING);
   }
}

/**
 * "Status Indicator" management
 * @param {*} guiRoot - GUI Object root name
 * @param {*} action - Action/Status (IS_INPROGRESS, IS_SUCCESS, IS_ERROR, IS_WARNING, ACTION_DISP_OFF)
 */

function gui_mgtIndicator (guiRoot, action) {
   let myGuiObj;

   switch (action) {
      case IS_INPROGRESS:
         myGuiObj = $("#" + guiRoot + GUI_STATUS_LOADING);
         myGuiObj.show();

         myGuiObj = $("#" + guiRoot + GUI_STATUS_ERROR);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_SUCESS);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_WARNING);
         myGuiObj.hide();
      break;

      case IS_ERROR:
         myGuiObj = $("#" + guiRoot + GUI_STATUS_ERROR);
         myGuiObj.show();

         myGuiObj = $("#" + guiRoot + GUI_STATUS_SUCESS);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_LOADING);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_WARNING);
         myGuiObj.hide();
      break;

      case IS_WARNING:
         myGuiObj = $("#" + guiRoot + GUI_STATUS_WARNING);
         myGuiObj.show();

         myGuiObj = $("#" + guiRoot + GUI_STATUS_ERROR);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_LOADING);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_SUCESS);
         myGuiObj.hide();
      break;

      case IS_SUCCESS:
         myGuiObj = $("#" + guiRoot + GUI_STATUS_SUCESS);
         myGuiObj.show();

         myGuiObj = $("#" + guiRoot + GUI_STATUS_ERROR);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_LOADING);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_WARNING);
         myGuiObj.hide();
      break;

      case ACTION_DISP_OFF:
         myGuiObj = $("#" + guiRoot + GUI_STATUS_LOADING);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_SUCESS);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_ERROR);
         myGuiObj.hide();
         myGuiObj = $("#" + guiRoot + GUI_STATUS_WARNING);
         myGuiObj.hide();
      break;

      default:
         mgt_Console ('Unknown Indicator Action !', CONSOLE_WARNING);
   };
}

/**
 * Open an application window in a tab browser (initiate an authentication challenge)
 * @param {String} reqURL : request URL
 */

function open_winappl (reqURL) {
   const regexp = /(https:\/\/[^\/]+)\/([^\/]+)(?:\/|$)/gm; // ---- Group 1 = hostname | Group 2 = application name

   const WIN_TARGET     = '_blank';
   const WIN_FEATURES   = "popup,width=100,height=100";
   const WIN_CLOSEDELAY = 5000;

   const JTS_URL = '/dashboards/all';
   const CCM_URL = '/web#action=jazz.viewPage&id=com.ibm.team.process.projectAreaList';
   const GC_URL  = '/web';
   const RM_URl  = '/web';
   const QM_URL  = '/web#action=jazz.viewPage&id=com.ibm.team.process.projectAreaList';
   const AM_URL  = '';

   let myReqHost;
   let myReqAppl;
   let myMatch = [];

   let myWindow;
   let myWinURL;

   // ---- In the request URL, get the hostname and application name

   myMatch = regexp.exec(reqURL);

   if (myMatch !== null) { 
      myReqHost = myMatch[1];
      myReqAppl = myMatch[2];
   }

   myWinURL = myReqHost + '/' + myReqAppl;

   // ---- Open application base window

   switch (myReqAppl.toLowerCase()) {
      case 'jts' :
         myWinURL += JTS_URL;
         break;
      
      case 'ccm' :
         myWinURL += CCM_URL;
         break;

      case 'gc' :
         myWinURL += GC_URL;
         break;

      case 'rm' :
         myWinURL += RM_URl;
         break;
   
      case 'qm' :
         myWinURL += QM_URL;
         break;

      case 'am' :
         myWinURL += AM_URL;
         break;

      default:
         mgt_Console ("Open Window - Application '" + myReqAppl + "' unknown !", CONSOLE_ERROR);

         return undefined;
   }

   // ---- Open URL in a new browser tab

   mgt_Console ("Open Window : '" + myWinURL + "'", CONSOLE_INFO);

   myWindow = window.open (myWinURL, WIN_TARGET, WIN_FEATURES);

   // ---- Close the window after a delay

   setTimeout(() => {
         myWindow.close();
      }, 
      WIN_CLOSEDELAY
   );

   myWindow.blur();
   window.focus ();
}
