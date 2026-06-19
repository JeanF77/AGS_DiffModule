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

const REST_QUEUE_SIZE = 5;

const WIDGET_PREF_RM_HOSTNAME = "JAZZ_RMHOSTNAME";

// const RM_HOSTNAME_STATIC       = "https://jazzrm-dev.snm.snecma:9443";
// const RM_HOSTNAME_STATIC       = "https://agsrm-3ap.snm.snecma:9443";
const RM_HOSTNAME_STATIC = "https://elm703.raoulnet";

/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */

var RM_HOSTNAME;           // ---- Nom d'hote du serveur RM

var queueManager = new QueueManager(REST_QUEUE_SIZE, null);
var queueManagerConfig = new QueueManager(REST_QUEUE_SIZE, gui_BuildConfBtn);

/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/** Point d'entree du widget */

$().ready(function () {

   // ---- External Parameters

   try {
      RM_HOSTNAME = widget_get_UserPref(WIDGET_PREF_RM_HOSTNAME);
   } catch (e) {
      RM_HOSTNAME = RM_HOSTNAME_STATIC;
   }

   // ---- Main view

   view_init();
});
