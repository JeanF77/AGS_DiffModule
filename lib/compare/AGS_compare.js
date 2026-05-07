/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | JJ/MM/AAAA |   LGM          | Initial version                      |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
	---- Constantes
   --------------------------------------------------------------------------- */

const AGS_DEL_STYLE				= "text-decoration:line-through;color:red;font-weight:bold;";
const AGS_INS_STYLE				= "color:blue;font-weight:bold;";

/* ------------------------------------------------------------------------------
   ---- Core Fonctions
   --------------------------------------------------------------------------- */

/**
 * Comparer 2 blocs HTML "Primary Text"
 * @param {Object} p_old_spec_node - Structure XML a comparer
 * @param {Object} p_new_spec_node - Structure XML de reference
 * @returns {String} - Resultat de comparaison au format HTML
 */

function diff_HtmlContent (p_old_spec_node, p_new_spec_node) {
	var v_result_html = "";

	if (p_old_spec_node !== null && p_new_spec_node !== null) {
        // ---- Dans DNG, le bloc "content" est toujours encadré par <div></div>.

		var v_old_div_node = node_get_first_child (p_old_spec_node, "div");
		var v_new_div_node = node_get_first_child (p_new_spec_node, "div");

        // ---- Le contenu de l'artefact est une suite de noeuds (<p>, <table> ...) qu'il faut examiner les uns apres les autres

		if (v_old_div_node && v_new_div_node) {
			var v_old_node_list = v_old_div_node["childNodes"];
			var v_new_node_list = v_new_div_node["childNodes"];
			
			v_result_html = node_list_diff (v_old_node_list, v_new_node_list);
		}
	}

	return v_result_html;
}

/**
 * Rechercher un noeud dans une structure XML
 * @param {Object} p_parent_node - Structure XML
 * @param {String} p_node_name - Nom du noeud recherche
 * @returns {Object} - Noeud trouve dans la structure ("null" si noeud introuvable)
 */

function node_get_first_child (p_parent_node, p_node_name) {
	var v_node  = null ;
	var v_nodes = p_parent_node["childNodes"];

	if (v_nodes) {
		for (var i=0; i < v_nodes.length; i++) {
			if (v_nodes[i]["nodeName"].toUpperCase() === p_node_name.toUpperCase()) {
				v_node = v_nodes[i];
				break;
			}
		}
	}

	return v_node;
}

/**
 * Rechercher les enfants d'un noeud XML
 * @param {Object} p_parent_node - Noeud parent
 * @param {Object} p_node_name - Nom des noeuds enfants
 * @returns {Array} - Liste des enfants trouves
 */

function node_get_children_by_name (p_parent_node, p_node_name) {
	var v_children = [] ;
	var v_nodes    = p_parent_node["childNodes"];

	for (var i=0 ; i<v_nodes.length ; i++) {
		if (v_nodes[i]["nodeName"] == p_node_name) {
			v_children.push(v_nodes[i]);
		}
	}

	return v_children;
}

/**
 * Comparer 2 listes de noeuds HTML
 * @param {Object} p_old_node_list - Liste de noeuds a comparer
 * @param {Object} p_new_node_list - Liste de noeuds de reference
 * @returns {String} - Resultat de la comparaison
 */

function node_list_diff (p_old_node_list, p_new_node_list) {
	var v_result_html = "";
	var v_node_count  = 0;

	if (p_old_node_list.length >= p_new_node_list.length) {
		v_node_count = p_old_node_list.length;
	} else {
		v_node_count = p_new_node_list.length;
	}

	for (var v_node_index=0; v_node_index < v_node_count; v_node_index++) {
		var v_old_node = null;
		var v_new_node = null;

		if (v_node_index < p_old_node_list.length) {
			v_old_node = p_old_node_list[v_node_index];
		}

		if (v_node_index < p_new_node_list.length) {
			v_new_node = p_new_node_list[v_node_index];
		}

		v_result_html += node_diff (v_old_node, v_new_node);
		v_result_html += "<br>";
	}

	return v_result_html;
}

/**
 * Comparer 2 noeuds HTML
 * @param {Object} p_old_node - Noeud a comparer
 * @param {Object} p_new_node - Noeud de reference
 * @returns {String} - Resultat de comparaison
 */

function node_diff (p_old_node, p_new_node) {
	var v_result_html = "";

	if (p_old_node == null) {
		if (p_new_node["nodeName"] === "table") {
            // ---- Nouvelle table
			v_result_html = node_table_apply_cell_style(p_new_node, AGS_INS_STYLE) ;
		} else if (p_new_node["nodeName"] === "ol" || p_new_node["nodeName"] === "ul") {
            // ---- Nouvelle liste
			v_result_html = '<font style="' + AGS_INS_STYLE + '">' + dom_to_html_string(p_new_node).replace("</li>", "</li><br>") + '</font>';
		} else {
            // ---- Nouveau paragraphe
			v_result_html = '<font style="' + AGS_INS_STYLE + '">' + p_new_node["textContent"] + '</font>';
		}
	} else if (p_new_node == null) {
		if (p_old_node["nodeName"] === "table") {
            // ---- Table supprimee
            v_result_html = node_table_apply_cell_style(p_old_node, AGS_DEL_STYLE) ;
		} else if (p_old_node["nodeName"] === "ol" || p_old_node["nodeName"] === "ul") {
            // ---- Liste supprimee
			v_result_html = '<font style="' + AGS_DEL_STYLE + '">' + dom_to_html_string(p_old_node).replace("</li>", "</li><br>") + '</font>';
		} else {
            // ---- Paragraphe supprime
			v_result_html = '<font style="' + AGS_DEL_STYLE + '">' + p_old_node["textContent"] + '</font>';
		}
	} else {
		if (p_old_node["nodeName"] === "table" || p_new_node["nodeName"] === "table") {
            // ---- Comparer les tables
			v_result_html += node_table_diff(p_old_node, p_new_node);
		} else if (p_old_node["nodeName"] === "ol" || p_new_node["nodeName"] === "ol" || p_old_node["nodeName"] === "ul" || p_new_node["nodeName"] === "ul") {
            // ---- Comparer les listes
			v_result_html += node_ol_diff (p_old_node, p_new_node); 
		} else {
            // ---- Comparer les paragraphes
			v_result_html += node_text_diff (p_old_node, p_new_node);	
		}
	}

	return v_result_html;
}

/**
 * Reformater un noeud de type <table>
 * @param {Object} p_table_node - Noeud a reformater
 * @param {String} p_style - Style a appliquer
 * @returns {String} - Code HTML correspondant a l'operation
 */

function node_table_apply_cell_style (p_table_node, p_style) {
	var v_html_results 	= "" ;
	v_html_results 		+= "<table border='1'>";
	
	var v_row_node_list = p_table_node["rows"];

	if (v_row_node_list != null) {
		for (var i = 0 ; i < v_row_node_list.length ; i ++) {
			v_html_results 		 += '<tr style='+ '"' + p_style + '">';
			var v_row_node 		 = v_row_node_list[i];
			var v_cell_node_list = v_row_node["cells"];

			for (var j = 0 ; j  < v_cell_node_list.length ; j ++) {
				var v_cell_node = v_cell_node_list[j];
				v_html_results += 	v_cell_node["outerHTML"];
			}

			v_html_results += "</tr>";
		}
	}

	v_html_results += "</table>"
	
	return v_html_results ;
}

/**
 * Convertir un objet XML en chaine de caractere
 * @param {Object} domElement - Structure XML a convertir
 * @returns {String} - Structure convertie en chaine de caracteres
 */

function dom_to_html_string (domElement) {
	var sValue = "";

	if (domElement.outerHTML) {
		sValue = domElement.outerHTML;
	} else if (XMLSerializer) {
		sValue = new XMLSerializer().serializeToString(domElement); 
	}

	return sValue ;
}

/**
 * Comparer 2 structures de type <table>
 * @param {Object} p_old_node - Structure XML a comparer
 * @param {Object} p_new_node - Structure XML de reference
 * @returns {String} - Resultat de la comparaison
 */

function node_table_diff (p_old_node, p_new_node) {
	var v_result_html = "";
	
	var v_old_node_name = p_old_node["nodeName"];
	var v_new_node_name = p_new_node["nodeName"];
	
	if (v_old_node_name === "table" && v_new_node_name === "table")	{
		if (p_old_node["textContent"] !== p_new_node["textContent"]) {
			v_result_html += node_table_apply_cell_style (p_new_node, AGS_INS_STYLE) ;
			v_result_html += "<br>";
			v_result_html += node_table_apply_cell_style (p_old_node, AGS_DEL_STYLE) ;
		}
	} else if (v_old_node_name === "table")	{
		v_result_html += '<font style="' + AGS_INS_STYLE + '">' + p_new_node["textContent"] + '</font>';
		v_result_html += "<br>";
		v_result_html += node_table_apply_cell_style (p_old_node, AGS_DEL_STYLE) ;
	} else if(v_new_node_name === "table") {
		v_result_html += node_table_apply_cell_style (p_new_node, AGS_DEL_STYLE) ;
		v_result_html += "<br>";
		v_result_html += '<font style="' + AGS_INS_STYLE + '">' + p_old_node["textContent"] + '</font>';
	}

	return v_result_html;
}

/**
 * Reformater un noeud de type <pl> (liste)
 * @param {Object} p_node - Noeud a reformater
 * @param {String} p_style - Style a appliquer
 * @returns {String} - Code HTML correspondant a l'operation
 */

function node_ol_apply_style (p_node, p_style) {
	var v_html_results = "" ;
	var v_li_node_list = node_get_children_by_name(p_node, "li");

	if (v_li_node_list != null) {
		for(var i = 0 ; i < v_li_node_list.length; i ++) {
			var v_li_node = v_li_node_list[i];
			v_html_results += '<font style="' + p_style + '"> ' + v_li_node["textContent"] + '</font><br>';
		}
	}

	return v_html_results ;
}

/**
 * Comparer 2 structures de type <ol> (liste)
 * @param {Object} p_old_node - Structure XML a comparer
 * @param {Object} p_new_node - Structure XML de reference
 * @returns {String} - Resultat de la comparaison
 */

function node_ol_diff (p_old_node, p_new_node) {
	var v_result_html = "";
	
	var v_old_node_name = p_old_node["nodeName"];
	var v_new_node_name = p_new_node["nodeName"];
	
	if ((v_old_node_name === "ol" || v_old_node_name === "ul") && (v_new_node_name === "ol" || v_new_node_name === "ul")) {
		if (p_old_node["textContent"] !== p_new_node["textContent"])	{
			v_result_html += node_ol_apply_style(p_new_node, AGS_INS_STYLE);
			v_result_html += "<br>";
			v_result_html += node_ol_apply_style(p_old_node, AGS_DEL_STYLE);
		}
	} else if (v_old_node_name === "ol" || v_old_node_name === "ul")	{
		v_result_html += '<font style="' + AGS_INS_STYLE + '">' + p_new_node["textContent"] + '</font>';
		v_result_html += "<br>";
		v_result_html += node_ol_apply_style(p_old_node, AGS_DEL_STYLE);
	} else if (v_new_node_name === "ol" || v_new_node_name === "ul")	{
		v_result_html += node_ol_apply_style(p_old_node, AGS_INS_STYLE);
		v_result_html += "<br>";
		v_result_html += '<font style="' + AGS_DEL_STYLE + '">' + p_old_node["textContent"] + '</font>';
	}

	return v_result_html;
}

/**
 * Comparer 2 structures de type paragraphe
 * @param {Object} p_old_node - Structure XML a comparer
 * @param {Object} p_new_node - Structure XML de reference
 * @returns {String} - Resultat de la comparaison
 */

function node_text_diff (p_old_node, p_new_node) {
	var v_result_html = "";
	
	var v_old_text = p_old_node["textContent"];
	var v_new_text = p_new_node["textContent"];
	
	v_result_html += diffString (v_old_text, v_new_text);

	return v_result_html;
}
