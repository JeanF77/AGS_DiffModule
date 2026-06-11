/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | 19/10/2023 |   Safran       | Initial version                      |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
	---- Constantes
   --------------------------------------------------------------------------- */

// ---- OSLC Definitions

const OSLC_GC_COMPONENT             = "http://open-services.net/ns/config#Component";
const OSLC_GC_CONFIGURATION         = "http://open-services.net/ns/config#Configuration";
const OSLC_GC_BASELINE              = "http://open-services.net/ns/config#Baseline";
const OSLC_GC_STREAM                = "http://open-services.net/ns/config#Stream";
const OSCL_GC_PERSONNALSTREAM       = "http://jazz.net/ns/config_ext#PersonalStream";

// ---- RDF Definitions
// ----
// ---- form "rdf\\:about" used to get a node
// ---- form "rdf:about" used to get an attribute

const RDF_ABOUT                     = "rdf\\:about";
const RDF0_ABOUT                    = RDF_ABOUT.replace ("\\:",":");
const RDF_DESCRIPTION               = "rdf\\:Description";
const RDF0_DESCRIPTION              = RDF_DESCRIPTION.replace ("\\:",":");
const RDF_LI                        = "rdf\\:li";
const RDF0_LI                       = RDF_LI.replace ("\\:",":");
const RDF_RESOURCE                  = "rdf\\:resource";
const RDF0_RESOURCE                 = RDF_RESOURCE.replace ("\\:",":");
const RDF_TYPE                      = "rdf\\:type";
const RDF0_TYPE                     = RDF_TYPE.replace ("\\:",":");
const RDF_VALUE                     = "rdf\\:value";
const RDF0_VALUE                    = RDF_VALUE.replace ("\\:",":");

const RDFS_MEMBER                   = "rdfs\\:member";
const RDFS0_MEMBER                  = RDFS_MEMBER.replace ("\\:",":");

const DCTERMS_CREATOR               = "dcterms\\:creator";
const DCTERMS0_CREATOR              = DCTERMS_CREATOR.replace ("\\:",":");
const DCTERMS_CREATED               = "dcterms\\:created";
const DCTERMS0_CREATED              = DCTERMS_CREATED.replace ("\\:",":");
const DCTERMS_DESCRIPTION           = "dcterms\\:description";
const DCTERMS0_DESCRIPTION          = DCTERMS_DESCRIPTION.replace ("\\:",":");
const DCTERMS_IDENTIFIER            = "dcterms\\:identifier";
const DCTERMS0_IDENTIFIER           = DCTERMS_IDENTIFIER.replace ("\\:",":");
const DCTERMS_TITLE                 = "dcterms\\:title";
const DCTERMS0_TITLE                = DCTERMS_TITLE.replace ("\\:",":");

const FOAF_MBOX                     = "foaf\\:mbox";
const FOAF0_MBOX                    = FOAF_MBOX.replace ("\\:",":");
const FOAF_NAME                     = "foaf\\:name";
const FOAF0_NAME                    = FOAF_NAME.replace ("\\:",":");

const LDP_DIRECTCONTAINER           = "ldp\\:DirectContainer";
const LDP0_DIRECTCONTAINER          = LDP_DIRECTCONTAINER.replace ("\\:",":");

const OSLC_RMUSES                   = "oslc_rm\\:uses";
const OSLC0_RMUSES                  = OSLC_RMUSES.replace ("\\:",":");
const OSCL_SHORTID                  = "oslc\\:shortId";
const OSCL0_SHORTID                 = OSCL_SHORTID.replace ("\\:",":");

const OSLCCONFIG_BASELINE           = "oslc_config\\:Baseline";
const OSLCCONFIG0_BASELINE          = OSLCCONFIG_BASELINE.replace ("\\:",":");
const OSLCCONFIG_CHANGESET          = "oslc_config\\:ChangeSet";
const OSLCCONFIG0_CHANGESET         = OSLCCONFIG_CHANGESET.replace ("\\:",":");
const OSLCCONFIG_COMPONENT          = "oslc_config\\:component";
const OSLCCONFIG0_COMPONENT         = OSLCCONFIG_COMPONENT.replace ("\\:",":");
const OSLCCONFIG_CONFIGURATION      = "oslc_config\\:configuration";
const OSLCCONFIG0_CONFIGURATION     = OSLCCONFIG_CONFIGURATION.replace ("\\:",":");
const OSLCCONFIG_CONFIGURATION2     = "oslc_config\\:Configuration";
const OSLCCONFIG0_CONFIGURATION2    = OSLCCONFIG_CONFIGURATION2.replace ("\\:",":");
const OSLCCONFIG_OVERRIDES          = "oslc_config\\:overrides";
const OSLCCONFIG0_OVERRIDES         = OSLCCONFIG_OVERRIDES.replace ("\\:",":");
const OSLCCONFIG_STREAM             = "oslc_config\\:Stream";
const OSLCCONFIG0_STREAM            = OSLCCONFIG_STREAM.replace ("\\:",":");

const OSLCRM_REQUIREMENTCOLLECTION  = "oslc_rm\\:RequirementCollection";
const OSLCRM0_REQUIREMENTCOLLECTION = OSLCRM_REQUIREMENTCOLLECTION.replace ("\\:",":");

const OSLC_INSTANCESHAPE            = "oslc\\:instanceShape";
const OSLC0_INSTANCESHAPE           = OSLC_INSTANCESHAPE.replace ("\\:",":");

const OWL_SAMEAS                    = "owl\\:sameAs";
const OWL0_SAMEAS                   = OWL_SAMEAS.replace ("\\:",":");

const JP06_ARCHIVED                 = "jp06\\:archived";
const JP060_ARCHIVED                = JP06_ARCHIVED.replace ("\\:",":");
const JP06_DESCRIPTION              = "jp06\\:description";
const JP060_DESCRIPTION             = JP06_DESCRIPTION.replace ("\\:",":");
const JP06_MODIFIED                 = "jp06\\:modified";
const JP060_MODIFIED                = JP06_MODIFIED.replace ("\\:",":");
const JP06_NAME                     = "jp06\\:name";
const JP060_NAME                    = JP06_NAME.replace ("\\:",":");
const JP06_PROJECTAREA              = "jp06\\:project-area";
const JP060_PROJECTAREA             = JP06_PROJECTAREA.replace ("\\:",":");
const JP06_PROJECTAREAS             = "jp06\\:project-areas";
const JP060_PROJECTAREAS            = JP06_PROJECTAREAS.replace ("\\:",":");
const JP06_SUMMARY                  = "jp06\\:summary";
const JP060_SUMMARY                 = JP06_SUMMARY.replace ("\\:",":");
const JP06_URL                      = "jp06\\:url";
const JP060_URL                     = JP06_URL.replace ("\\:",":");

const RMREQIF_MODULE                = "rmReqIF\\:module";
const RMREQIF0_MODULE               = RMREQIF_MODULE.replace ("\\:",":");

const RM_ACTIONID                   = "rm\\:actionId";
const RM0_ACTIONID                  = RM_ACTIONID.replace ("\\:",":");
const RM_ATTRIBUTEDEFINITION        = "rm\\:AttributeDefinition";
const RM0_ATTRIBUTEDEFINITION       = RM_ATTRIBUTEDEFINITION.replace ("\\:",":");
const RM_ATTRIBUTETYPE              = "rm\\:AttributeType";
const RM0_ATTRIBUTETYPE             = RM_ATTRIBUTETYPE.replace ("\\:",":");
const RM_DEFAULTFORMAT              = "rm\\:defaultFormat";
const RM0_DEFAULTFORMAT             = RM_DEFAULTFORMAT.replace ("\\:",":");
const RM_ENUMENTRIES                = "rm\\:enumEntries";
const RM0_ENUMENTRIES               = RM_ENUMENTRIES.replace ("\\:",":");
const RM_ENUMENTRY                  = "rm\\:enumEntry";
const RM0_ENUMENTRY                 = RM_ENUMENTRY.replace ("\\:",":");
const RM_HASATTRIBUTE               = "rm\\:hasAttribute";
const RM0_HASATTRIBUTE              = RM_HASATTRIBUTE.replace ("\\:",":");
const RM_HASSYSTEMATTRIBUTE         = "rm\\:hasSystemAttribute";
const RM0_HASSYSTEMATTRIBUTE        = RM_HASSYSTEMATTRIBUTE.replace ("\\:",":");
const RM_HASWORKFLOWATTRIBUTE       = "rm\\:hasWorkflowAttribute";
const RM0_HASWORKFLOWATTRIBUTE      = RM_HASWORKFLOWATTRIBUTE.replace ("\\:",":");
const RM_LINKTYPE                   = "rm\\:LinkType";
const RM0_LINKTYPE                  = RM_LINKTYPE.replace ("\\:",":");
const RM_MANDATORY                  = "rm\\:mandatory";
const RM0_MANDATORY                 = RM_MANDATORY.replace ("\\:",":");
const RM_MULTIVALUED                = "rm\\:multiValued";
const RM0_MULTIVALUED               = RM_MULTIVALUED.replace ("\\:",":");
const RM_OBJECTTOSUBJECTLABEL       = "rm\\:objectToSubjectLabel";
const RM0_OBJECTTOSUBJECTLABEL      = RM_OBJECTTOSUBJECTLABEL.replace ("\\:",":");
const RM_OBJECTTYPE                 = "rm\\:ObjectType";
const RM0_OBJECTTYPE                = RM_OBJECTTYPE.replace ("\\:",":");
const RM_RANGE                      = "rm\\:range";
const RM0_RANGE                     = RM_RANGE.replace ("\\:",":");
const RM_SUBJECTTOOBJECTLABEL       = "rm\\:subjectToObjectLabel";
const RM0_SUBJECTTOOBJECTLABEL      = RM_SUBJECTTOOBJECTLABEL.replace ("\\:",":");
const RM_VALUETYPE                  = "rm\\:valueType";
const RM0_VALUETYPE                 = RM_VALUETYPE.replace ("\\:",":");
const RM_WORKFLOW                   = "rm\\:workflow";
const RM0_WORKFLOW                  = RM_WORKFLOW.replace ("\\:",":");
