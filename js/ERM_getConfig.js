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
 * Get the ERM project list
 * @param {Array} projectList - The project list to fill with the REST response
 */

function get_ProjectList(projectList) {
   const REST_RM_GETPROJECTLIST = RM_HOSTNAME + "/rm/process/project-areas";

   projectList.splice(0); // ---- Clear the projectList before filling it with the REST response

   let myRESTRequest = {
      'method': "GET",
      'rest_url': REST_RM_GETPROJECTLIST,
      'successCallback': success_get_ProjectList,
      'successArg': projectList,
      'errorCallback': fail_get_ProjectList,
      'timeout': 30000 // ---- [SEC] Prevent indefinite blocking of the request queue
   };

   queueManager.addToQueue(myRESTRequest);
}

/**
 * Success callback for get_ProjectList function
 * @param {Array} projectList - The project list to fill with the REST response
 * @param {String} data - The REST response data
 */

function success_get_ProjectList(projectList, data) {
   let xmlData = $.parseXML(data);

   // ---- Decode XML response and fill the projectList with ClassProject objects

   $(xmlData).find(JP06_PROJECTAREAS).children().each(function () {
      let myProject = new ClassProject();

      myProject.init($(this));

      projectList.push(myProject);
   });

   // ---- Sort the projectList by project name

   projectList.sort(function (a, b) {
      return a.getName().localeCompare(b.getName());
   });

   // ---- Build the project dropdown button with the filled projectList

   gui_BuildProjectBtn(projectList);
}

/**
 * Error callback for get_ProjectList function
 */

function fail_get_ProjectList() {
   mgt_Console(fail_get_ProjectList.name + " - Can not get the project area configuration list from ERM", CONSOLE_ERROR);

   gui_mgtIndicator(GUI_ITEM_PROJECTIND_ROOT, IS_ERROR);
   gui_FatalError("<strong>ERROR : </strong> Projects list not loaded !");
}

/* --------------------------------------------------------------------------- */

/**
 * Get the ERM component list for a given project
 * @param {ClassProject} project - The ClassProject object for which to get the component list
 */

function get_ComponentList(project) {
   const REST_RM_GETCOMPONENTLIST = extractRmBase(project.getUrl()) + "/rm-projects/" + project.getIdentifier() + "/components";

   project.reset_componentList(); // ---- Clear the componentList before filling it with the REST response

   let myRESTRequest = {
      'method': "GET",
      'rest_url': REST_RM_GETCOMPONENTLIST,
      'successCallback': success_get_ComponentList,
      'successArg': project,
      'errorCallback': fail_get_ComponentList,
      'timeout': 30000 // ---- [SEC] Prevent indefinite blocking of the request queue
   };

   queueManager.addToQueue(myRESTRequest);
}

/**
 * Success callback for get_ComponentList function
 * @param {ClassProject} project - The ClassProject object for which to get the component list
 * @param {String} data - The REST response data
 */

function success_get_ComponentList(project, data) {
   let xmlData = $.parseXML(data);

   $(xmlData).find(JP06_PROJECTAREA).each(function () {
      let myComponent = new ClassComponent();

      myComponent.init($(this));

      project.add_component(myComponent);
   });

   // ---- Sort the component list by component name

   project.getComponentList().sort(function (a, b) {
      return a.getName().localeCompare(b.getName());
   });

   // ---- Build the component dropdown button with the filled component list

   gui_BuildComponentBtn(project);
}

/**
 * Error callback for get_ComponentList function
 */

function fail_get_ComponentList() {
   mgt_Console(fail_get_ComponentList.name + " - Can not get the component list from ERM", CONSOLE_ERROR);

   gui_mgtIndicator(GUI_ITEM_COMPONENTIND_ROOT, IS_ERROR);
   gui_FatalError("<strong>ERROR : </strong> Components list not loaded !");
}

/* --------------------------------------------------------------------------- */

/**
 * Get the ERM configuration list for a given component
 * @param {ClassComponent} component - The ClassComponent object for which to get the configuration list
 */

function get_ConfigurationList(component) {
   const REST_RM_GETCONFLIST = extractRmBase(component.getUrl()) + "/cm/component/" + component.getIdentifier() + "/configurations";

   component.reset_configurationList(); // ---- Clear the configurationList before filling it with the REST response

   let myRESTRequest = {
      'method': "GET",
      'rest_url': REST_RM_GETCONFLIST,
      'successCallback': success_get_ConfigurationList,
      'successArg': component,
      'errorCallback': fail_get_ConfigurationList,
      'errorArg': component,
      'timeout': 30000 // ---- [SEC] Prevent indefinite blocking of the request queue
   };

   queueManager.addToQueue(myRESTRequest);
}

/**
 * Success callback for get_ConfigurationList function
 * @param {ClassComponent} component - The ClassComponent object for which to get the configuration list
 * @param {String} data - The REST response data
 */

function success_get_ConfigurationList(component, data) {
   let xmlData = $.parseXML(data);

   // ---- Decoder le contenu de la reponse REST
   // ----
   // ---- <rdf:Description rdf:about="https://jazz:9443/rm/cm/component/_9AiQMCr4EeuJ8b5wb92nYg/configurations">
   // ----    <rdfs:member rdf:resource="https://jazz:9443/rm/cm/stream/_IgZwUCr6EeuJ8b5wb92nYg"/>
   // ----    <rdfs:member rdf:resource="https://jazz:9443/rm/cm/baseline/_4ETxUCr5EeuJ8b5wb92nYg"/>
   // ----    <rdfs:member rdf:resource="https://jazz:9443/rm/cm/stream/_9A_jMCr4EeuJ8b5wb92nYg"/>
   // ---- </rdf:Description>
   // ----
   // ---- Pour chaque configuration, on lance une requete REST pour recuperer les details de la configuration

   $(xmlData).find(RDF_DESCRIPTION).children(RDFS_MEMBER).each(function () {
      let myRESTRequest = {
         'method': "GET",
         'rest_url': $(this).attr(RDF0_RESOURCE),
         'successCallback': success_getConfiguration,
         'successArg': component,
         'errorCallback': failed_getConfiguration,
         'errorArg': component,
         'timeout': 30000
      };

      queueManagerConfig.addToQueue(myRESTRequest);
   });
}

/**
 * Error callback for get_ConfigurationList function
 * @param {ClassComponent} component - The ClassComponent object for which to get the configuration list
 */

function fail_get_ConfigurationList(component) {
   mgt_Console(fail_get_ConfigurationList.name + " - Can not get the configuration list for component '" + component.getName() + "'", CONSOLE_ERROR);

   gui_FatalError("<strong>ERROR : </strong> Configurations list not loaded for component '" + component.getName() + "' !");
}

/**
 * Success callback for get_Configuration function
 * @param {ClassComponent} component - The ClassComponent object for which to get the configuration
 * @param {String} data - The REST response data
 */

function success_getConfiguration(component, data) {
   let xmlData = $.parseXML(data);
   let myConfiguration = new ERM_Configuration($(xmlData).find(RDF_DESCRIPTION).attr(RDF0_ABOUT));

   myConfiguration.init(xmlData);

   component.add_configuration(myConfiguration);

   // ---- Get changesets details for the configuration

   if (myConfiguration.getChangesetsListUrl()) {
      let myRESTRequest = {
         'method': "GET",
         'rest_url': myConfiguration.getChangesetsListUrl(),
         'successCallback': success_getChangesets,
         'successArg': myConfiguration,
         'errorCallback': failed_getChangesets,
         'errorArg': myConfiguration,
         'timeout': 30000
      };

      queueManagerConfig.addToQueue(myRESTRequest);
   }

   mgt_Console(success_getConfiguration.name + " - Successfully retrieved configuration: " + myConfiguration.getName() + " for component: " + component.getName(), CONSOLE_INFO);
}

/**
 * Error callback for get_Configuration function
 * @param {ClassComponent} component - The ClassComponent object for which to get the configuration
 * @param {Number} httpCode - The HTTP response code from the REST request
 */

function failed_getConfiguration(component, httpCode) { // --- Error Callback for get_Configuration
   if (httpCode != 404) { // ---- If the error is not a 404 Not Found, then it is a real error
      mgt_Console(failed_getConfiguration.name + " - Can not get configuration for component : " + component.getName() + " - " + httpCode, CONSOLE_ERROR);

      gui_FatalError("<strong>ERROR : </strong> Can not get configuration for component : '" + component.getName() + "' !");
   } else { // ---- 404 Not Found : This means that the component has no configuration (yet) or that the configuration is archived
      mgt_Console(failed_getConfiguration.name + " - Archived configuration found for component : " + component.getName(), CONSOLE_WARNING);
   }
}

/**
 * Success callback for get_Changesets function
 * @param {ERM_Configuration} configuration - The configuration object for which to get changesets
 * @param {String} data - The REST response data
 */

function success_getChangesets(configuration, data) {
   let xmlData = $.parseXML(data);

   $(xmlData).find(LDP_DIRECTCONTAINER).children(RDFS_MEMBER).each(function () {
      let myChangeset = new ERM_Configuration();

      myChangeset.init($(this));

      configuration.setChangesetsList(myChangeset);
   });

   mgt_Console(success_getChangesets.name + " - Successfully retrieved changesets for configuration: " + configuration.getName(), CONSOLE_INFO);
}

/**
 * Error callback for get_Changesets function
 * @param {ERM_Configuration} configuration - The configuration object for which to get changesets
 * @param {Number} httpCode - The HTTP response code from the REST request
 */
function failed_getChangesets(configuration, httpCode) {
   mgt_Console(failed_getChangesets.name + " - Can not get changesets for configuration : " + configuration.getName() + " - " + httpCode, CONSOLE_ERROR);

   gui_FatalError("<strong>ERROR : </strong> Changesets not loaded for configuration '" + configuration.getName() + "' !");
}

/* --------------------------------------------------------------------------- */

/**
 * Get module list for a givent configuration
 * @param {ClassProject} project - Project object
 * @param {ClassComponent} component - Component object
 * @param {ERM_Configuration} configuration - The given configuration
 */

function get_ModuleList(project, component, configuration) {

   // ---- Build OSLC request

   let myContext = "";
   myContext += "&project_URL=" + encodeURIComponent(project.getUrl());
   myContext += "&oslc_config.context=" + encodeURIComponent(configuration.getUrl());
   myContext += "&componentURI=" + encodeURIComponent(component.getUrl());

   let myOslcPrefix = "";
   myOslcPrefix += "&oslc.prefix=" + encodeURIComponent("oslc=<http://open-services.net/ns/core#>");
   myOslcPrefix += "&oslc.prefix=" + encodeURIComponent("oslc_rm=<http://open-services.net/ns/rm#>");
   myOslcPrefix += "&oslc.prefix=" + encodeURIComponent("dcterms=<http://purl.org/dc/terms/>");
   myOslcPrefix += "&oslc.prefix=" + encodeURIComponent("rdf=<http://www.w3.org/1999/02/22-rdf-syntax-ns#>");

   let myOslcQuery = "";
   myOslcQuery += "&oslc.select=dcterms:title,oslc:instanceShape,dcterms:modified,dcterms:identifier";
   myOslcQuery += "&oslc.where=rdf:type=" + encodeURIComponent("<http://open-services.net/ns/rm#RequirementCollection>");

   let myRESTRequest = {
      'method': "GET",
      'rest_url': extractRmBase(configuration.getUrl()) + "/views?oslc.query=true" + myContext + myOslcPrefix + myOslcQuery,
      'successCallback': success_get_ModuleList,
      'successArg' : configuration,
      'errorCallback': failed_get_ModuleList,
      'errorArg': configuration,
      'timeout': 30000
   };

   mgt_Console(get_ModuleList.name + " - Get module list for : " + configuration.getUrl(), CONSOLE_INFO);

   queueManager.addToQueue(myRESTRequest);
}

/**
 * Success callback for get_ModuleList function
 * @param {ERM_Configuration} configuration - The configuration object for which to get modules
 * @param {String} data - The REST response data
 */

function success_get_ModuleList (configuration, data) {
   let xmlData = $.parseXML(data);

   configuration.empty_ModuleList();

   // ---- Decoder le contenu de la reponse REST
   // ---- <rdfs:member>
   // ----     <oslc_rm:RequirementCollection rdf:about="https://jazz:9443/rm/resources/_e0e3a11c46854792bc3f0c95a8a4f015">
   // ----        <oslc:instanceShape rdf:resource="https://jazz:9443/rm/types/_9QWN1ir4EeuJ8b5wb92nYg"/>
   // ----        <dcterms:title>REST Discovery - 1</dcterms:title>
   // ----     </oslc_rm:RequirementCollection>
   // ---- </rdfs:member>

   $(xmlData).find(RDF_DESCRIPTION).children(RDFS_MEMBER).each(function () {
      let myModule = new ClassModule();

      myModule.init($(this));

      if (myModule.getIdentifier() != null) {
         configuration.add_Module(myModule);
      }
   });

   // ---- Sort module list

   configuration.getModuleList().sort(function (a, b) {
      return a.getName().localeCompare(b.getName());
   });

   // ---- Build the select module button for the target configuration
   
   gui_BuildModuleBtn(configuration);
}

/**
 * Error callback for get_ModuleList function
 * @param {ERM_Configuration} configuration - The configuration object for which to get changesets
 * @param {Number} httpCode - The HTTP response code from the REST request
 */

function failed_get_ModuleList (configuration, httpCode) {
   mgt_Console(failed_get_ModuleList.name + " - Can not get module list for configuration : " + configuration.getName() + " - " + httpCode, CONSOLE_ERROR);

   gui_FatalError("<strong>ERROR : </strong> Changesets not loaded for configuration '" + configuration.getName() + "' !");
}
