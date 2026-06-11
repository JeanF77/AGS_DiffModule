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

class ClassProject { // ---- Caracteristiques d'un projet JAZZ
   #name;          // ---- Nom du projet
   #summary;       // ---- Sommaire du projet
   #description;   // ---- Description du projet
   #url;           // ---- URL du projet
   #id;            // ---- Identifiant du projet
   #modified;      // ---- Date de derniere modification du projet

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

   /**
    * Initialiser l'objet a partir d'un noeud XML "jp06:project-area"
    * @param {Object} xml_data - Noeud jQuery du projet
    */

   init(xml_data) {
      let myPrjId = [];

      this.#name = xml_data.attr(JP060_NAME); // ---- Project Name

      xml_data.children().each((index, node) => {
         switch ($(node).prop('nodeName')) {
            case JP060_URL: // ---- Project URL
               this.#url = $(node).text();
               myPrjId = this.#url.match(/^https.+\/(.+)/);
               this.#id = myPrjId[1];
               break;

            case JP060_DESCRIPTION: // ---- Project Description
               this.#description = $(node).text();
               break;

            case JP060_SUMMARY: // ---- Project Summary
               this.#summary = $(node).text();
               break;

            case JP060_MODIFIED: // ---- Project Modified Date
               this.#modified = $(node).text();
               break;

            default:
            // ---- Do nothing
         };
      });
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
