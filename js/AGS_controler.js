/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/

/* ------------------------------------------------------------------------------
   ---- Constantes
   --------------------------------------------------------------------------- */

const IS_TRUE = "true";
const IS_FALSE = "false";

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

class QueueManager {
   constructor(maxConcurrentRequests, onCompleteCallback) { // ---- Create new queue manager
      this.maxConcurrentRequests = maxConcurrentRequests;
      this.queue = [];
      this.running = 0;
      this.completed = 0;
      this.totalRequests = 0;
      this.onCompleteCallback = onCompleteCallback;
   }

   addToQueue(rest_request) { // ---- Add request in queue
      this.queue.push(rest_request);
      this.totalRequests++;

      mgt_Console("Queued Request (" + this.queue.length + ") : " + rest_request.rest_url, CONSOLE_INFO);

      this.processQueue();
   }

   processQueue() { // ---- Execute queue content
      while (this.running < this.maxConcurrentRequests && this.queue.length > 0) {
         var rest_request = this.queue.shift();
         this.running++;

         ajax_async_request(rest_request,
            (data) => { // ---- Success function
               if (rest_request.successArg === undefined || rest_request.successArg === null) { // ---- With, or without callback argument !
                  rest_request.successCallback(data);
               } else {
                  rest_request.successCallback(rest_request.successArg, data);
               }
               this.requestCompleted();
            },
            (error) => { // ---- Error function
               if (rest_request.errorArg === undefined || rest_request.errorArg === null) {  // ---- With, or without callback argument !
                  rest_request.errorCallback(error, rest_request);
               } else {
                  rest_request.errorCallback(rest_request.errorArg, error, rest_request);
               }
               this.requestCompleted();
            },
            null
         );
      }
   }

   requestCompleted() { // ---- Request completed
      mgt_Console("Queue Remove : " + this.queue.length, CONSOLE_INFO);

      this.running--;
      this.completed++;

      if (this.completed === this.totalRequests) {
         if (typeof this.onCompleteCallback === 'function') {
            this.onCompleteCallback();
         } else {
            mgt_Console("All requests executed !", CONSOLE_WARNING);
         }
      }

      this.processQueue();
   }
}

/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/**
 * Open an application window in a tab browser (initiate an authentication challenge)
 * @param {String} reqURL : request URL
 */

function open_winappl(reqURL) {
   const regexp = /(https:\/\/[^\/]+)\/([^\/]+)(?:\/|$)/gm; // ---- Group 1 = hostname | Group 2 = application name

   const WIN_TARGET = '_blank';
   const WIN_FEATURES = "popup,width=100,height=100";
   const WIN_CLOSEDELAY = 5000;

   const JTS_URL = '/dashboards/all';
   const CCM_URL = '/web#action=jazz.viewPage&id=com.ibm.team.process.projectAreaList';
   const GC_URL = '/web';
   const RM_URl = '/web';
   const QM_URL = '/web#action=jazz.viewPage&id=com.ibm.team.process.projectAreaList';
   const AM_URL = '';

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
      case 'jts':
         myWinURL += JTS_URL;
         break;

      case 'ccm':
         myWinURL += CCM_URL;
         break;

      case 'gc':
         myWinURL += GC_URL;
         break;

      case 'rm':
         myWinURL += RM_URl;
         break;

      case 'qm':
         myWinURL += QM_URL;
         break;

      case 'am':
         myWinURL += AM_URL;
         break;

      default:
         mgt_Console("Open Window - Application '" + myReqAppl + "' unknown !", CONSOLE_ERROR);

         return undefined;
   }

   // ---- Open URL in a new browser tab

   mgt_Console("Open Window : '" + myWinURL + "'", CONSOLE_INFO);

   myWindow = window.open(myWinURL, WIN_TARGET, WIN_FEATURES);

   // ---- Close the window after a delay

   setTimeout(() => {
      myWindow.close();
   },
      WIN_CLOSEDELAY
   );

   myWindow.blur();
   window.focus();
}

/* --------------------------------------------------------------------------- */

/**
 * Requete AJAX - Asynchrone
 * @param {Object} rest_request - Requete REST (REST URL de la requete AJAX et messages associés)
 * @param {*} success_func - Fonction a appeler sur la requete est un succes
 * @param {*} failed_func - Fonction a appeler sur la requete est un echec
 * @param {*} always_func - Fonction a appeler quel que soit l'état de la requête
 */

/* function ajax_async_request(rest_request, success_func, failed_func, always_func) {
   const APPL_LAUNCHDELAY = 6000;

   return $.ajax({
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
      .done(function (data, textStatus, jqXHR) {
         console.log("$$$ AJAX-GET call is successfull for '" + rest_request.rest_url + "' !");

         if (success_func) {
            success_func(data);
         }
      }) // ---- Request failed
      .fail(function (jqXHR, textStatus, errorThrown) {
         console.log("### ERROR : AJAX-GET call failed for '" + rest_request.rest_url + "' !");

         if (jqXHR.status === 401) { // ---- 401 : need an authentication challenge
            console.log("### ERROR : Authentication challenge needed with code '" + jqXHR.status + "' !");

            // ---- Open application window

            open_winappl(rest_request.rest_url);

            // ---- After a time out, relaunch te request

            setTimeout(() => { // ---- Waiting for opened windows run authentication challenge
               ajax_async_request(rest_request, success_func, failed_func, always_func);
            },
               APPL_LAUNCHDELAY
            );
         } else if (failed_func) { // ---- Other errors
            failed_func(jqXHR.status);
         }
      }) // ---- System message
      .always(function (data, textStatus, jqXHR) {
         console.log("--- textStatus = '" + textStatus + "'");

         if (always_func) {
            if (textStatus == "error") {
               always_func(IS_ERROR, rest_request.rest_failed);
            } else {
               always_func(IS_SUCCESS, rest_request.rest_success);
            }
         }
      });
} */

/**
 * Requete AJAX - Asynchrone
 * @param {Object} rest_request - Requete REST (REST URL de la requete AJAX et messages associés)
 * @param {Function} success_func - Fonction a appeler sur la requete est un succes
 * @param {Function} failed_func - Fonction a appeler sur la requete est un echec
 * @param {Function} always_func - Fonction a appeler quel que soit l'état de la requête
 */

function ajax_async_request(rest_request, success_func, failed_func, always_func) {
   const APPL_LAUNCHDELAY = 6000;

   return $.ajax({
      url: rest_request.rest_url,
      method: ((rest_request.method === undefined) ? "GET" : rest_request.method),
      dataType: "text",
      headers: ((rest_request.headers === undefined) ?
         {
            "OSLC-Core-Version": "2.0",
            "Accept": "xml+rdf"
         } : rest_request.headers),
      xhrFields: {
         "withCredentials": true
      },
      crossdomain: true,
      async: ((rest_request.async === undefined) ? true : rest_request.async)
   }) // ---- Request successfull
      .done(function (data, textStatus, jqXHR) {
         mgt_Console("AJAX-GET call is successfull for '" + rest_request.rest_url + "' !");

         if (success_func) {
            success_func(data);
         }
      }) // ---- Request failed
      .fail(function (jqXHR, textStatus, errorThrown) {
         mgt_Console("AJAX-GET call failed for '" + rest_request.rest_url + "' with '" + textStatus + "' !", CONSOLE_ERROR);

         if (jqXHR.status === 401) { // ---- 401 : need an authentication challenge
            console.log("### ERROR : Authentication challenge needed with code '" + jqXHR.status + "' !");

            // ---- Open application window

            open_winappl(rest_request.rest_url);

            // ---- After a time out, relaunch te request

            setTimeout(() => { // ---- Waiting for opened windows run authentication challenge
               ajax_async_request(rest_request, success_func, failed_func, always_func);
            },
               APPL_LAUNCHDELAY
            );
         } else if (failed_func) {
            failed_func(jqXHR.status, rest_request);
         }
      }) // ---- Other
      .always(function (dataOrjqXHR, textStatus, jqXHRorErrorThrown) {
         mgt_Console("textStatus = '" + textStatus + "'");

         if (always_func && textStatus === "success") {
            always_func(jqXHRorErrorThrown.status);
         } else if (always_func && textStatus !== "success") {
            always_func(dataOrjqXHR.status);
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

function ajax_async_parm_request(rest_request, success_func, failed_func, callback_parm) {
   return $.ajax({
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
      .done(function (data, textStatus, jqXHR) {
         console.log("$$$ AJAX-GET call is successfull for '" + rest_request.rest_url + "' !");

         if (success_func) {
            success_func(callback_parm, data, jqXHR);
         }
      }) // ---- Request failed
      .fail(function (jqXHR, textStatus, errorThrown) {
         console.log("### ERROR : AJAX-GET call failed for '" + rest_request.rest_url + "' !");

         if (jqXHR.status === 401) { // ---- 401 : need an authentication challenge
            console.log("### ERROR : Authentication challenge needed with code '" + jqXHR.status + "' !");

            // ---- Open application window

            open_winappl(rest_request.rest_url);

            // ---- After a time out, relaunch te request

            setTimeout(() => { // ---- Waiting for opened windows run authentication challenge
               ajax_async_parm_request(rest_request, success_func, failed_func, callback_parm);
            },
               APPL_LAUNCHDELAY
            );
         } else if (failed_func) {
            failed_func(callback_parm, jqXHR);
         }
      }) // ---- System message
      .always(function (data, textStatus, jqXHR) {
         console.log("--- textStatus = '" + textStatus + "'");
      });
}
