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
