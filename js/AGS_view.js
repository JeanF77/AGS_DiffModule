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

// ---- All interface buttons - used to lock down the GUI on a fatal error

const GUI_ALL_BTN_ROOT = [
   GUI_ITEM_PROJECT_BTN_ROOT,
   GUI_ITEM_COMPONENT_BTN_ROOT,
   GUI_ITEM_OLDCONFIG_BTN_ROOT,
   GUI_ITEM_OLDMODULE_BTN_ROOT,
   GUI_ITEM_NEWCONFIG_BTN_ROOT,
   GUI_ITEM_NEWMODULE_BTN_ROOT,
   GUI_ITEM_LOADMODULE_BTN_ROOT,
   GUI_ITEM_COMPARE_BTN_ROOT,
   GUI_ITEM_EXPORT_BTN_ROOT,
   GUI_ITEM_EXPORTCOMPACT_BTN_ROOT,
   GUI_ITEM_DISPLAYDIFF_BTN_ROOT,
   GUI_ITEM_COMPAREMODE_BTN_ROOT
];

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
const GUI_ICON_CHANGSET = "./resources/rm_changeset_icon.png";
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

/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */

var g_ProjectList = [];                      // ---- Liste des projets DNG
var g_Project = null                         // ---- Projet selectionne
var g_Component = null;                      // ---- Composant selectionne
var g_ConfOld = null;                        // ---- Configuration Old selectionnee
var g_ConfNew = null;                        // ---- Configuration New selectionnee
var g_ModuleOld = null;   // ---- Module Old selectionne
var g_ModuleNew = null;   // ---- Module New selectionne

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
 * Build the content of the "Project" button if REST response = OK
 * @param {Array} projectList - Project list to fill with the REST response
 */

function gui_BuildProjectBtn(projectList) {
   let buttonContent = [];

   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, ACTION_DISP_OFF);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, ACTION_DISP_OFF);

   for (let i = 0; i < projectList.length; i++) {
      buttonContent.push('<li id="' + projectList[i].getIdentifier() + '" onclick="gui_SelectProject (this)"><a class="dropdown-item">' + projectList[i].getName() + '</a></li>');
   }

   gui_mgtButtonDrop(GUI_ITEM_PROJECT_BTN_ROOT, ACTION_SETCONTENT, buttonContent);

   // ---- Activer le bouton 

   gui_mgtButtonDrop(GUI_ITEM_PROJECT_BTN_ROOT, ACTION_ACTIVE_ON);
}

/**
 * Afficher le nom du projet selectionne
 * @param {Object} object - Objet IHM selectionne par l'utilisateur
 */

function gui_SelectProject(object) {

   // ---- Sauvegarder l'identifiant du projet selectionne

   g_Project = g_ProjectList.find(myProject => myProject.getIdentifier() == object.id);

   gui_mgtButtonDrop(GUI_ITEM_PROJECT_BTN_ROOT, ACTION_SETLABEL, g_Project.getName())
   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, IS_SUCCESS);

   // ---- Reinitialiser les items dependants

   gui_InitComponentBtn();

   // ---- Etablir la liste des composants du projet

   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, IS_INPROGRESS);

   get_ComponentList(g_Project);
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

   g_Project = null;

   // ---- Reinitialiser les items dependants

   gui_InitComponentBtn();
}

/* ---- Component ------------------------------------------------------------ */

/**
 * Construire le contenu du bouton de sélection d'un composant si reponse REST = OK
 * @param {ClassProject} project - The ClassProject object for which to build the component button
 */

function gui_BuildComponentBtn(project) {
   let buttonContent = [];

   // ---- Reinitialiser les information relatives aux composants

   g_Component = null;

   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, ACTION_DISP_OFF);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, ACTION_DISP_OFF);

   // ---- Activer le bouton s'il existe des composants

   if (project.getComponentList().length > 0) {
      for (let myComponent of project.getComponentList()) {
         buttonContent.push('<li id="' + myComponent.getIdentifier() + '" onclick="gui_SelectComponent (this)"><a class="dropdown-item"><img src="' + GUI_ICON_COMPONENT + '" alt="Component"> ' + myComponent.getName() + '</a></li>');
      }

      gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_SETCONTENT, buttonContent);
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

   g_Component = g_Project.getComponentList().find(myComponent => myComponent.getIdentifier() == object.id);

   gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_SETLABEL, '<img src="' + GUI_ICON_COMPONENT + '" alt="Component"> ' + g_Component.getName());
   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, IS_SUCCESS);

   // ---- Reinitialiser les items dependants

   gui_InitConfBtn();

   // ---- Etablir la liste des configurations (streams, baselines ...)

   gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, IS_INPROGRESS);
   gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, IS_INPROGRESS);

   g_ConfOld = null;
   g_ConfNew = null;

   get_ConfigurationList(g_Component);
}

/**
 * Initialiser le bouton de sélection d'un composant si reponse REST = KO
 */

function gui_InitComponentBtn() {

   // ---- Desactiver le bouton

   gui_mgtButtonDrop(GUI_ITEM_COMPONENT_BTN_ROOT, ACTION_INIT, "Select the component");

   // ---- Reinitialiser le bouton et ses dependances

   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, ACTION_DISP_OFF);

   g_Component= null;

   // ---- Ses dependances

   gui_InitConfBtn();
}

/* ---- Configurations ------------------------------------------------------- */

/**
 * Construire le contenu du bouton de sélection d'une configuration si reponse REST = OK
 */

function gui_BuildConfBtn() {
   let myConfigurationList = [];

   gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, ACTION_DISP_OFF);
   gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, ACTION_DISP_OFF);
   gui_mgtAlert(GUI_ITEM_ALERT_ROOT, ACTION_DISP_OFF);

   // ---- Get all configurations and changesets for the selected component

   for (let myConf of g_Component.getConfigurationList()) {
      myConfigurationList.push(myConf);

      myConfigurationList = myConfigurationList.concat(myConf.getChangesetsList());
   }

   myConfigurationList.sort(compareName);

   // ---- Create the buttons for each configuration (stream, baseline, changeset)

   const myIconByType = {
      stream: { src: GUI_ICON_STREAM, alt: "Stream" },
      baseline: { src: GUI_ICON_BASELINE, alt: "Baseline" },
      changeset: { src: GUI_ICON_CHANGSET, alt: "Changeset" }
   };

   for (let myConf of myConfigurationList) {
      const myIcon = myIconByType[myConf.getType()];

      if (!myIcon) {
         continue;
      }

      const myLabel = '<img src="' + myIcon.src + '" alt="' + myIcon.alt + '"> ' + myConf.getName();

      gui_mgtButtonDrop(GUI_ITEM_OLDCONFIG_BTN_ROOT, ACTION_APPENDCONTENT, '<li id="_old' + myConf.getIdentifier() + '" onclick="gui_SelectConf (this)"><a class="dropdown-item">' + myLabel + '</a></li>');
      gui_mgtButtonDrop(GUI_ITEM_NEWCONFIG_BTN_ROOT, ACTION_APPENDCONTENT, '<li id="_new' + myConf.getIdentifier() + '" onclick="gui_SelectConf (this)"><a class="dropdown-item">' + myLabel + '</a></li>');
   }

   // ---- Activer le bouton 

   gui_mgtButtonDrop(GUI_ITEM_OLDCONFIG_BTN_ROOT, ACTION_ACTIVE_ON);
   gui_mgtButtonDrop(GUI_ITEM_NEWCONFIG_BTN_ROOT, ACTION_ACTIVE_ON);
}

/**
 * Afficher le nom de la configuration selectionnee
 * @param {Object} object - Objet IHM selectionne par l'utilisateur
 */

function gui_SelectConf(object) {
   const myConfId = object.id.match(/^_(old|new)(.+)/); // ---- Groupe 1 = prefix | Groupe 2 = identifiant de la configuration

   let mySelectedConf;
   let myConfigurationList = [];
   let myConfIcon;

   // ---- Get all configurations and changesets for the selected component

   for (let myConf of g_Component.getConfigurationList()) {
      myConfigurationList.push(myConf);

      myConfigurationList = myConfigurationList.concat(myConf.getChangesetsList());
   }

   mySelectedConf = myConfigurationList.find(myConf => myConf.getIdentifier() === myConfId[2]);

   switch (mySelectedConf.getType()) {
      case "stream":
         myConfIcon = '<img src="' + GUI_ICON_STREAM + '" alt="Stream"> ';
         break;
      case "baseline":
         myConfIcon = '<img src="' + GUI_ICON_BASELINE + '" alt="Baseline"> ';
         break;
      case "changeset":
         myConfIcon = '<img src="' + GUI_ICON_CHANGSET + '" alt="Changeset"> ';
         break;
      default:
         myConfIcon = '';
   }

   // ---- Sauvegarder l'identifiant de la configuration selectionnee

   if (myConfId[1] === 'old') { // ---- Old configuration
      g_ConfOld = mySelectedConf;

      gui_mgtButtonDrop(GUI_ITEM_OLDCONFIG_BTN_ROOT, ACTION_SETLABEL, myConfIcon + g_ConfOld.getName());

      // ---- Reinitialiser les items dependants

      gui_InitOldModuleBtn();

      // ---- Etablir la liste des configurations (streams, baselines ...)

      if (g_ConfNew && g_ConfOld.getIdentifier() === g_ConfNew.getIdentifier()) {
         // ---- Alerter si les 2 configurations sont identiques
         gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, IS_WARNING);
      } else {
         gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, ACTION_DISP_OFF);
         gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, ACTION_DISP_OFF);
         gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, IS_INPROGRESS);

         get_ModuleList(g_Project, g_Component, g_ConfOld);
      }
   } else { // ---- New configuration
      g_ConfNew = mySelectedConf;

      gui_mgtButtonDrop(GUI_ITEM_NEWCONFIG_BTN_ROOT, ACTION_SETLABEL, myConfIcon + g_ConfNew.getName());

      // ---- Reinitialiser les items dependants

      gui_InitNewModuleBtn();

      // ---- Etablir la liste des configurations (streams, baselines ...)

      if (g_ConfOld && g_ConfNew.getIdentifier() === g_ConfOld.getIdentifier()) {
         // ---- Alerter si les 2 configurations sont identiques
         gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, IS_WARNING);
      } else {
         gui_mgtIndicator(GUI_ITEM_NEWCONFIGIND_ROOT, ACTION_DISP_OFF);
         gui_mgtIndicator(GUI_ITEM_OLDCONFIGIND_ROOT, ACTION_DISP_OFF);
         gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, IS_INPROGRESS);
         
         get_ModuleList(g_Project, g_Component, g_ConfNew);
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

   g_ConfOld = null;
   g_ConfNew = null;

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
 * Create module selection button from the selectec configuration
 * @param {ERM_Configuration} configuration - Configuration object
 */

function gui_BuildModuleBtn (configuration) {
   let myItem;

   // ---- Build module button

   if (g_ConfNew && configuration.getUrl() === g_ConfNew.getUrl()) { // ---- New module button
      mgt_Console(gui_BuildModuleBtn.name + " - Build 'New' module list for " + configuration.getName(), CONSOLE_INFO);

      gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, ACTION_DISP_OFF);

      if (configuration.getModuleList().length > 0) {
         for (let myModule of configuration.getModuleList()) {
            myItem = '<li id="_new' + myModule.getIdentifier() + '" onclick="gui_SelectModule (this)"><a class="dropdown-item"><img src="' + GUI_ICON_MODULE + '" alt="New Module"> ' + myModule.getName() + '</a></li>';

            gui_mgtButtonDrop(GUI_ITEM_NEWMODULE_BTN_ROOT, ACTION_APPENDCONTENT, myItem);
         }

         gui_mgtButtonDrop(GUI_ITEM_NEWMODULE_BTN_ROOT, ACTION_ACTIVE_ON);
      } else { // ---- Module list is empty
         gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_WARNING, "Warning : New Module List is empty !");
         gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, IS_ERROR);
         gui_mgtButtonDrop(GUI_ITEM_NEWMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);
      }
   } else if (g_ConfOld && configuration.getUrl() === g_ConfOld.getUrl()) { // ---- Old module button
      mgt_Console(gui_BuildModuleBtn.name + " - Build 'Old' module list for " + configuration.getName(), CONSOLE_INFO);

      if (configuration.getModuleList().length > 0) {
         gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, ACTION_DISP_OFF);

         for (let myModule of configuration.getModuleList()) {
            myItem = '<li id="_old' + myModule.getIdentifier() + '" onclick="gui_SelectModule (this)"><a class="dropdown-item"><img src="' + GUI_ICON_MODULE + '" alt="Old Module"> ' + myModule.getName() + '</a></li>';

            gui_mgtButtonDrop(GUI_ITEM_OLDMODULE_BTN_ROOT, ACTION_APPENDCONTENT, myItem);
         }

         gui_mgtButtonDrop(GUI_ITEM_OLDMODULE_BTN_ROOT, ACTION_ACTIVE_ON);
      } else { // ---- Module list is empty
         gui_mgtAlert(GUI_ITEM_ALERT_ROOT, IS_WARNING, "Warning : New Module List is empty !");
         gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, IS_ERROR);
         gui_mgtButtonDrop(GUI_ITEM_OLDMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);
      }
   } else {
      // ---- Somthing is wrong !

      mgt_Console(gui_BuildModuleBtn.name + " - Something is wrong for " + configuration.getName(), CONSOLE_ERROR);

      gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, IS_ERROR);
      gui_mgtButtonDrop(GUI_ITEM_NEWMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);
      gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, IS_ERROR);
      gui_mgtButtonDrop(GUI_ITEM_OLDMODULE_BTN_ROOT, ACTION_ACTIVE_OFF);
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
      g_ModuleOld = g_ConfOld.getModuleList().find(myModule => myModule.getIdentifier() === myModuleId[2]);

      gui_mgtButtonDrop(GUI_ITEM_OLDMODULE_BTN_ROOT, ACTION_SETLABEL, '<img src="' + GUI_ICON_MODULE + '" alt="Old Module"> ' + g_ModuleOld.getName());
      gui_mgtIndicator(GUI_ITEM_OLDMODULEIND_ROOT, IS_SUCCESS);
   } else { // ---- New module
      g_ModuleNew = g_ConfNew.getModuleList().find(myModule => myModule.getIdentifier() === myModuleId[2]);

      gui_mgtButtonDrop(GUI_ITEM_NEWMODULE_BTN_ROOT, ACTION_SETLABEL, '<img src="' + GUI_ICON_MODULE + '" alt="New Module"> ' + g_ModuleNew.getName());
      gui_mgtIndicator(GUI_ITEM_NEWMODULEIND_ROOT, IS_SUCCESS);
   }

   // ---- Si les 2 modules sont selectionnes, on peut alors autoriser la comparaison

   switch (g_CompareMode) {
      case COMPARE_MODE_LOCALLOCAL:
         if (g_ModuleOld && g_ModuleNew) {
            gui_mgtButtonDrop(GUI_ITEM_LOADMODULE_BTN_ROOT, ACTION_ACTIVE_ON);
         }
         break;

      case COMPARE_MODE_LOCALREQIF:
         if (g_ModuleOld !== null) {
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
   $("#" + divstat).append($('<tr><td>Module Name : <b>' + objModule.getName() + '</b><br>Module ID : <b>' + objModule.getIddng() + '</b></td></tr>'));
   $("#" + divstat).append($('<tr><td>Module Modified : <b>' + objModule.getModified() + '</b></td></tr>'));
   $("#" + divstat).append($('<tr><td>Nb Artifacts : <b>' + objModule.artefactCount() + '</b></td>/tr>'));

   // ---- Types d'artefacts

   for (myArtefactType in objModule.getArtefacttypeList()) {
      if (objModule.getArtefacttypeList()[myArtefactType] > 0) {
         if (myHtmlCode !== "") {
            myHtmlCode += "<br>";
         }

         myHtmlCode += myArtefactType + " : <b>" + objModule.getArtefacttypeList()[myArtefactType] + "</b>";
      }
   }

   $("#" + divstat).append($('<tr><td>' + myHtmlCode + '</td></tr>'));

   // ---- Ajouter une ligne à la table, dont une cellule sera modifiable

   if (objModule.getStatus() === IS_NEW) {
      $("#" + divstat).append($('<tr><td><div id="' + GUI_ITEM_newcellstat + '"></div></td></tr>'));
   }

   $("#" + divstat).append($('</tbody>'));
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
 * @param {String} nbartifact - Nombre total d'artefacts
 */

function gui_InitTableStat(divstat, status, paging, nbartifact) {
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
         myHtmlCode += '<tr><td style="text-align:center"><b>Module Loading in Progress ...</b><br>Progress is <b>' + paging + '/'+ nbartifact + '</b> artifacts</tr></td>';
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
         get_ProjectList(g_ProjectList);

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
            ---- get_ProjectList (g_ProjectList);
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

   get_ProjectList(g_ProjectList);
}
