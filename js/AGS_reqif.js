/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
/* Dépendances :
/*    - jszip.js
/*    - AGS_utils.js
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | 05/04/2022 |   Safran       | Initial version                      |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
   ---- Constantes
   --------------------------------------------------------------------------- */

const GUI_ITEM_LOADREQIF            = "gui_reqifload";
const GUI_ITEM_REQIFSTAT            = "gui_reqifstat";
const TEMPL_REQIF_STAT              = "templ-reqif-statistics";

// ---- REQIF XML Tags

const REQIF_CORECONTENT                = "CORE-CONTENT";
const REQIF_REQIFCONTENT               = "REQ-IF-CONTENT";
const REQIF_DATATYPES                  = "DATATYPES";
const REQIF_SPECTYPES                  = "SPEC-TYPES";
const REQIF_SPECOBJECTS                = "SPEC-OBJECTS";
const REQIF_SPECOBJECTTYPE             = "SPEC-OBJECT-TYPE";
const REQIF_SPECOBJECTTYPEREF          = "SPEC-OBJECT-TYPE-REF";
const REQIF_SPECIFICATIONS             = "SPECIFICATIONS";
const REQIF_SPECIFICATIONTYPE          = "SPECIFICATION-TYPE";
const REQIF_SPECIFICATIONTYPEREF       = "SPECIFICATION-TYPE-REF";
const REQIF_SPECATTRIBUTES             = "SPEC-ATTRIBUTES";
const REQIF_SPECIFIEDVALUES            = "SPECIFIED-VALUES";
const REQIF_SPECHIERARCHY              = "SPEC-HIERARCHY";
const REQIF_OBJECT                     = "OBJECT";
const REQIF_SPECOBJECTREF              = "SPEC-OBJECT-REF";
const REQIF_ENUMVALUE                  = "ENUM-VALUE";
const REQIF_ENUMVALUEREF               = "ENUM-VALUE-REF";
const REQIF_VALUES                     = "VALUES";
const REQIF_THEVALUE                   = "THE-VALUE";
const REQIF_TYPE                       = "TYPE";
const REQIF_CHILDREN                   = "CHILDREN";
const REQIF_DEFINITION                 = "DEFINITION";
const REQIF_DATATYPEENUMERATION        = "DATATYPE-DEFINITION-ENUMERATION";
const REQIF_DATATYPEENUMERATIONREF     = "DATATYPE-DEFINITION-ENUMERATION-REF";
const REQIF_DATATYPEDATE               = "DATATYPE-DEFINITION-DATE";
const REQIF_DATATYPEINTEGER            = "DATATYPE-DEFINITION-INTEGER";
const REQIF_DATATYPESTRING             = "DATATYPE-DEFINITION-STRING";
const REQIF_DATATYPEXHTML              = "DATATYPE-DEFINITION-XHTML";
const REQIF_ATTRIBUTEENUMERATION       = "ATTRIBUTE-DEFINITION-ENUMERATION";
const REQIF_ATTRIBUTEVALUENUMERATION   = "ATTRIBUTE-VALUE-ENUMERATION";
const REQIF_ATTRIBUTEVALUEXHTML        = "ATTRIBUTE-VALUE-XHTML";
const REQIF_ATTR_LONGNAME              = "LONG-NAME";
const REQIF_ATTR_IDENTIFIER            = "IDENTIFIER";
const REQIF_ATTR_THEVALUE              = "THE-VALUE";
const REQIF_ATTR_LASTCHANGE            = "LAST-CHANGE";

// ---- ReqIF Standard Attributes

const REQIF_REQIF_FOREIGNID            = "ReqIF.ForeignID";
const REQIF_REQIF_FOREIGNCREATEDON     = "ReqIF.ForeignCreatedOn";
const REQIF_REQIF_FOREIGNCREATEDBY     = "ReqIF.ForeignCreatedBy";
const REQIF_REQIF_FOREIGNMODIFIEDON    = "ReqIF.ForeignModifiedOn";
const REQIF_REQIF_FOREIGNMODIFIEDBY    = "ReqIF.ForeignModifiedBy";
   
/* ------------------------------------------------------------------------------
   ---- Classes
   --------------------------------------------------------------------------- */

class ReqIFEnum {
   name = ""            // ---- Enumeration name
   id = ""              // ---- Enumeration ReqIF ID
}

class ReqIFDataType {
   name = ""            // ---- Data Type name
   id = ""              // ---- Data Type ReqIF ID
   uri = ""             // ---- Data Type URI
   isenum = false       // ---- Data Type is enumeration (default is false)
   valuelist = []       // ---- Array of Data Type values (name, id, uri)
}

class ReqIFAttribute {
   name = ""            // ---- Attribute name
   id = ""              // ---- Attribute ReqIF ID
   typeid = ""          // ---- Attribute Type ReqIF ID
   uri = ""             // ---- Attribute URI
   isenum = false       // ---- Attribute is enumeration
   valuelist = []       // ---- Array of values
}

class ReqIFArtefactType {
   name = ""            // ---- Artifact Type name
   id = ""              // ---- Artifact Type ReqIF ID
   uri = ""             // ---- Artifact Type URI
   attrlist = []        // ---- Artifact Type attributes list (ReqIF ID list)
}

class ReqIFArtefact {
   name = ""            // ---- Artifact Name (for module only !)
   id = ""              // ---- Artifact ReqIF ID
   typeid = ""          // ---- Artifact Type ID
   modified = ""        // ---- Artifact Modification Date
   attrlist = []        // ---- Array of artifact custom attributes with values (ReqIF ID list)
   artefactlist = []    // ---- Array of artifacts, orderer by module hierarchy (ReqIF ID list)
   iscollection = false // ---- True, if module, otherwise false

   constructor (collection) {
      if (collection != undefined && collection === true) {
         this.iscollection = true;
      } else {
         this.iscollection = false;
      }
   }

   /**
    * Get attribute value
    * @param {String} attrname - Attribute name 
    * @param {Array of ReqIFArtefactType} artefactTypeList - List of artifact types
    * @param {Array of ReqIFDataType} DataTypeList - List of data types
    * @returns - Attribute value
    */

   get_attrvaluebyname (attrname, artefactTypeList, DataTypeList) {
      let myTypeID        = this.typeid;
      let myAttributeList = this.attrlist;

      let myArtefactType;
      let myAttributeDef;
      let myAttribute;
      let myAttrValueList = [];
      let myDataType;
      
      // ---- Search for artifact type, in which the attribute definitions are listed

      myArtefactType = artefactTypeList.find (type => type.id === myTypeID);

      // ---- Search for attribute definition

      myAttributeDef = myArtefactType.attrlist.find (attr => attr.name === attrname);

      // ---- Search for attribute values

      myAttribute = myAttributeList.find (attr => attr.typeid === myAttributeDef.id);

      // ---- Enumerated value : get values and return

      if (myAttribute.isenum) {

         // ---- Search for enumeration definition

         myDataType = DataTypeList.find (type => type.id === myAttributeDef.typeid);

         for (let myEnumId of myAttribute.valuelist) {
            let myValue;

            myValue = myDataType.valuelist.find (value => value.id === myEnumId);
   
            myAttrValueList.push (myValue.name);
         }
   
         return myAttrValueList;
      } else { // ---- Not enumerated value : return directy
         return myAttribute.valuelist[0];
      }
   }
}
   
/* ------------------------------------------------------------------------------
   ---- Variables globales
   --------------------------------------------------------------------------- */

var g_ReqIfAttachList         = []; // ---- Joined files in ReqIF
   
/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------- */
/* ---- Load ReqIF file from GUI                                               */

/**
 * Read content of Reqifz archive file (get XML and information on attached files)
 * @param {Object} fileObj - File object
 */

function load_reqifz_file (fileObj) {
   // ---- Empty ReqIF attached files list

   g_ReqIfAttachList.splice (0);

   // ---- Read content of compressed ReqIF

   JSZip.loadAsync(fileObj).then(function(zip) {
      Object.keys(zip.files).forEach(function(filename) {
         let myFileExt = filename.split('.').pop();
         let myAttach = {
            'filename' : "",     // ---- Attached file name
            'filesize' : ""      // ---- Attached file size
         }

         if (myFileExt === "reqif") { // ---- Analyser le contenu du fichier "*.reqif" contenu dans l'archive
            mgt_Console ("Load 'reqif' file", CONSOLE_INFO);

            zip.files[filename].async('text').then(function(fileData) {
               reqif_load_datamodel (fileData); // ---- Put here your function to load ReqIF data and post activities
            });
         } else { // ---- Les pièces jointes
            myAttach.filename = filename;
            myAttach.filesize = zip.files[filename]._data.compressedSize;

            g_ReqIfAttachList.push(myAttach);
         }
      });
   });
}

/**
 * Get file name from dialog box
 * @param {Event} evt - Event
 */   

function gui_loadreqif () {
   let myFileObj;
   let myFileExt;

   if (this.files.length > 0) {
		myFileObj = this.files[0];

		if (myFileObj !== null) {
			myFileExt = myFileObj.name.split('.').pop();

			if (myFileExt !== "reqif" && myFileExt !== "reqifz") { // ---- Si le fichier n'a pas d'extension "reqif" ou "reqifz"
            mgt_Console ("Invalid file type !", CONSOLE_ERROR);
			} else {
				if (myFileExt === "reqifz") { // ---- "reqifz" : fichier compressé
					load_reqifz_file (myFileObj);
				} else { // ---- "reqif" : fichier non compressé
               // ---- Pour l'instant, on ne fait rien dans cette branche. L'usage de l'outil nous dira s'il est nécessaire de prendre
               // ---- en compte le cas des fichiers ReqIF non compressés

               mgt_Console ("Load ReqIF file", CONSOLE_INFO);
				}
			}
		}
	}
}

/* --------------------------------------------------------------------------- */
/* ---- Load Data Model                                                        */

/**
 * ReqIF - Get enumeration values
 * @param {Object} xmlObj - XML object in which find the values
 * @returns - Array of values
 */

function reqif_get_enumvalue (xmlObj) {
   let myValueList = [];

   // ---- The enumeration values list is between <VALUES></VALUES>

   $(xmlObj).children(REQIF_VALUES).children(REQIF_ENUMVALUEREF).each(function() {
      myValueList.push ($(this).text());
   });

   return myValueList;
}

/**
 * ReqIF - Get custom attributes list
 * @param {Object} xmlObj - XML object in which find the attributes
 * @returns - Array of attributes (objects of class : ReqIFAttribute)
 */

function reqif_get_custattribute (xmlObj) {
   let myAttributeList = [];

   // ---- The custom attributes list is between <VALUES></VALUES>

   $(xmlObj).children(REQIF_VALUES).children().each(function() { // ---- Get attributes values
      let myAttribute = new ReqIFAttribute ();

      // ---- Get attribute values

      switch (this.nodeName) {
         case REQIF_ATTRIBUTEVALUENUMERATION: // ---- Multiple values possible
            myAttribute.isenum    = true;
            myAttribute.valuelist = reqif_get_enumvalue (this);
         break;

         case REQIF_ATTRIBUTEVALUEXHTML: // ---- Only one value
            myAttribute.valuelist.push ($(this).children(REQIF_THEVALUE).html());
         break;

         default: // ---- Only one value
            myAttribute.valuelist.push ($(this).attr(REQIF_ATTR_THEVALUE));
      }

      // ---- Get attribute definition ID

      myAttribute.typeid = $(this).children(REQIF_DEFINITION).children().text(); // ---- Assumption : the definition must be unique !

      myAttributeList.push (myAttribute);
   });

   return myAttributeList;
}

/**
 * ReqIF - Get artifacts hierarchy
 * @param {Object} xmlObj - XML object in which find the artifacts hierarchy
 * @returns - Array of artifacts ReqIF ID
 */

function reqif_get_artifacthierarchy (xmlObj) {
   let myArtefactList = [];

   // ---- The custom attributes list is between <CHILDREN></CHILDREN>

   $(xmlObj).children(REQIF_CHILDREN).find(REQIF_SPECHIERARCHY).each(function() { // ---- Get artifacts
      myArtefactList.push ($(this).children(REQIF_OBJECT).children(REQIF_SPECOBJECTREF).text());
   });

   return myArtefactList;
}

/**
 * ReqIF - Get Data Types
 * @param {Object} xmlData - ReqIF parsed XML structure
 * @returns - Array of Data Types (objects of class : ReqIFDataType)
 */

function reqif_load_datatype (xmlData) {
   let myDataTypeList = [];

   // ---- Get definitions and values

   mgt_Console ("Get Data Types", CONSOLE_INFO);

   $(xmlData).find(REQIF_CORECONTENT).find(REQIF_REQIFCONTENT).find(REQIF_DATATYPES).children().each(function() {
      let myDataType = new ReqIFDataType ();
      let myEnumObj;

      switch (this.nodeName) {
         // ---- Enumeration
         case REQIF_DATATYPEENUMERATION:
            myDataType.isenum = true;

            myEnumObj = $(this).children(REQIF_SPECIFIEDVALUES);

            $(myEnumObj).children(REQIF_ENUMVALUE).each(function() { // ---- Get enumeration values
               let myEnumValue  = new ReqIFEnum ();

               myEnumValue.name = $(this).attr(REQIF_ATTR_LONGNAME);
               myEnumValue.id   = $(this).attr(REQIF_ATTR_IDENTIFIER);

               // ---- Store Enumeration Values

               myDataType.valuelist.push (myEnumValue);
            });

         // ---- Other Data Types
         case REQIF_DATATYPEDATE:
         case REQIF_DATATYPEINTEGER:
         case REQIF_DATATYPESTRING:
         case REQIF_DATATYPEXHTML:
            myDataType.name = $(this).attr(REQIF_ATTR_LONGNAME);
            myDataType.id   = $(this).attr(REQIF_ATTR_IDENTIFIER);

            // ---- Store Data Type
            
            myDataTypeList.push (myDataType);
         break;

         default:
            mgt_Console ("ReqIF Data Type not found : " + this.nodeName, CONSOLE_WARNING);
      }
   });

   return myDataTypeList;
}

/**
 * ReqIF - Get Artifact Types
 * @param {Object} xmlData - ReqIF parsed XML structure
 * @returns - Array of Artifact Types (objects of class : ReqIFArtefactType)
 */

function reqif_load_artefacttype (xmlData) {
   let myArtefactTypeList = [];

   mgt_Console ("Get Artifact Types", CONSOLE_INFO);

   $(xmlData).find(REQIF_CORECONTENT).find(REQIF_REQIFCONTENT).find(REQIF_SPECTYPES).children().each(function() {
      let myArtefactType = new ReqIFArtefactType ();
      let myArtefactTypeObj;

      switch (this.nodeName) {
         case REQIF_SPECOBJECTTYPE:
         case REQIF_SPECIFICATIONTYPE:
            myArtefactType.name = $(this).attr(REQIF_ATTR_LONGNAME);
            myArtefactType.id   = $(this).attr(REQIF_ATTR_IDENTIFIER);

            myArtefactTypeObj = $(this).children(REQIF_SPECATTRIBUTES);

            $(myArtefactTypeObj).children().each(function() { // ---- Get attributes
               let myAttributeDef = new ReqIFAttribute ();

               myAttributeDef.name   = $(this).attr(REQIF_ATTR_LONGNAME);
               myAttributeDef.id     = $(this).attr(REQIF_ATTR_IDENTIFIER);

               if (this.nodeName === REQIF_ATTRIBUTEENUMERATION) {
                  myAttributeDef.isenum = true;
                  myAttributeDef.typeid = $(this).children(REQIF_TYPE).children(REQIF_DATATYPEENUMERATIONREF).text();
               } else {
                  myAttributeDef.isenum = false;
               }
           
               myArtefactType.attrlist.push (myAttributeDef);
            });

            myArtefactTypeList.push (myArtefactType);
         break;

         default:
            mgt_Console ("ReqIF Artifact Type not found : " + this.nodeName, CONSOLE_WARNING);
      }
   });

   return myArtefactTypeList;
}

/**
 * ReqIF - Get Artifacts
 * @param {Object} xmlData - ReqIF parsed XML structure
 * @returns - Array of Artifacts (objects of class : ReqIFArtefact)
 */

function reqif_load_artefact (xmlData) {
   let myArtefactList = [];

   mgt_Console ("Get Artifacts", CONSOLE_INFO);

   $(xmlData).find(REQIF_CORECONTENT).find(REQIF_REQIFCONTENT).find(REQIF_SPECOBJECTS).children().each(function() {
      let myArtefact = new ReqIFArtefact ();

      myArtefact.modified = $(this).attr(REQIF_ATTR_LASTCHANGE);
      myArtefact.id       = $(this).attr(REQIF_ATTR_IDENTIFIER);
      myArtefact.typeid   = $(this).children(REQIF_TYPE).children(REQIF_SPECOBJECTTYPEREF).text(); // ---- Assumption : the type must be unique !
      myArtefact.attrlist = reqif_get_custattribute (this);

      myArtefactList.push (myArtefact);
   });

   return myArtefactList;
}

/**
 * ReqIF - Get Modules Hierarchy
 * @param {Object} xmlData - ReqIF parsed XML structure
 * @returns - Array of Artifacts (objects of class : ReqIFArtefact)
 */

function reqif_load_module (xmlData) {
   let myModuleList = [];

   mgt_Console ("Get Modules", CONSOLE_INFO);

   $(xmlData).find(REQIF_CORECONTENT).find(REQIF_REQIFCONTENT).find(REQIF_SPECIFICATIONS).children().each(function() {
      let myModule = new ReqIFArtefact (true);

      myModule.name         = $(this).attr(REQIF_ATTR_LONGNAME);
      myModule.modified     = $(this).attr(REQIF_ATTR_LASTCHANGE);
      myModule.id           = $(this).attr(REQIF_ATTR_IDENTIFIER);
      myModule.typeid       = $(this).children(REQIF_TYPE).children(REQIF_SPECIFICATIONTYPEREF).text(); // ---- Assumption : the type must be unique !
      myModule.attrlist     = reqif_get_custattribute (this);
      myModule.artefactlist = reqif_get_artifacthierarchy (this);

      myModuleList.push (myModule);
   });

   return myModuleList;
}

/* --------------------------------------------------------------------------- */

/**
 * Build ReqIF statistics GUI
 * @param {Array} moduleList - Modules List
 * @param {Array} artefactList - Artifact List
 * @param {Array} artefactTypeList - Artifact Types List
 * @param {Array} attachedFileList - Attached Files List
 */

function gui_reqif_statistic (moduleList, artefactList, artefactTypeList, attachedFileList) {
   let myGuiItem = $("#" + GUI_ITEM_REQIFSTAT);
   let myHtmlContent = "";
   let myContext;
   let myArtefactType;
   let myArtefactStatList = [];

   for (let myModule of moduleList) {

      // ---- Module statistics

      myArtefactType = artefactTypeList.find (type => type.id === myModule.typeid);

      // ---- Artifacts statistics

      myArtefactStatList = reqif_stat_artifacttype (myModule, artefactList, artefactTypeList);

      // ---- Display statistics

      myContext = {
         'reqif_modulename' : myModule.name,
         'reqif_moduletype' : myArtefactType.name,
         'reqif_nbtype' : artefactTypeList.length,
         'reqif_nbartifact' : myModule.artefactlist.length,
         'reqif_nbattached' : attachedFileList.length,
         'reqif_artifacttypelist' : myArtefactStatList
      };

      myHtmlContent += gui_htmlfromtemplate (TEMPL_REQIF_STAT, myContext);
   }

   myGuiItem.empty();
   myGuiItem.html(myHtmlContent);
   myGuiItem.show();
}

/**
 * Compute statistics on module : get number of each artifact type
 * @param {Object} module - Module structure (objects of class : ReqIFArtefact)
 * @param {Array} artefactList - Artifact List
 * @param {Array} artefactTypeList - Artifact Types List
 * @returns - 2D Array ([Artifact Type], [Occurence Number])
 */

function reqif_stat_artifacttype (module, artefactList, artefactTypeList) {
   let myArtefactStatList = [];
   let myArtefactStatIdx;
   let myArtefactType;
   let myArtefact;

   for (let myArtefactId of module.artefactlist) {
      myArtefact     = artefactList.find (artefact => artefact.id === myArtefactId); // ---- Search artifact in list, by ID
      myArtefactType = artefactTypeList.find (type => type.id === myArtefact.typeid);  // ---- Search artifact type in list, by type ID

      myArtefactStatIdx = myArtefactStatList.findIndex (arr => arr.includes(myArtefactType.name));

      if (myArtefactStatIdx > -1) { // ---- Artifact is in stat list
         myArtefactStatList[myArtefactStatIdx][1]++;
      } else {  // ---- Artifact is not in stat list
         myArtefactStatList.push ([myArtefactType.name, 1]);
      }
   }

   return myArtefactStatList;
}
