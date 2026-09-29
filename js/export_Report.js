/*******************************************************************************/
/*                    (C) Copyright 2019 by Safran Aircraft Engines            */
/*                             All rights reserved                             */
/*******************************************************************************/
/*
+-------------------------------------------------------------------------------+
| Revision |    Date    |     Author     |                Issue                 |
+-------------------------------------------------------------------------------+
|     1    | 28/01/2021 |   Safran       | Initial version                      |
|     2    | 08/05/2026 |   Safran       | Export XLSX via xlsx-js-style v1.2   |
|          |            |                | Correction blocage CSP (blob: URL)   |
|     3    | 08/05/2026 |   Safran       | Export HTML stylisé (diff riche,     |
|          |            |                | autonome, compatible CSP, impression) |
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
    ---- Constantes
   --------------------------------------------------------------------------- */

// ---- Gabarits Handlebars (voir main.html, section "Export report templates")
const TEMPL_RPT_SHELL        = "templ-rpt-shell";
const TEMPL_RPT_ROW_STANDARD = "templ-rpt-row-standard";
const TEMPL_RPT_ROW_COMPACT  = "templ-rpt-row-compact";

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
 * Supprimer les balises HTML d'une valeur (utilisé pour les colonnes texte)
 * @param {*}      html - Valeur pouvant contenir du HTML
 * @returns {String}    - Texte brut sans balises
 */
function rpt_stripHtml(html) {
    if (html === undefined || html === null) return "";

    // ---- Nœud DOM temporaire pour décoder les entités HTML et supprimer les balises
    const myTmp = document.createElement('div');
    myTmp.innerHTML = String(html);
    return (myTmp.textContent || myTmp.innerText || "").trim();
}

/**
 * Échapper les caractères HTML spéciaux pour insertion sécurisée dans du HTML
 * @param {*}      str - Valeur à échapper
 * @returns {String}   - Chaîne avec &, <, >, " remplacés par leurs entités HTML
 */
function rpt_escHtml(str) {
    return String(str === undefined || str === null ? "" : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Retourner la classe CSS de colorisation de ligne selon le label de diff
 * Les classes correspondent aux couleurs définies dans rpt_buildCss()
 * Source unique de la correspondance diffcode/label/classe : ClassDiffResult.META
 * @param {String} diffLabel - Valeur d'un élément de DIFF_LABEL[]
 * @returns {String}         - Classe CSS (ex: "rpt-row-content")
 */
function rpt_getDiffRowClass(diffLabel) {
    const myMeta = Object.values(ClassDiffResult.META).find(m => m.label === diffLabel);

    return myMeta ? myMeta.rptRowClass : '';
}

/**
 * Retourner la classe CSS de colorisation de ligne pour l'export "Compact"
 * Une ligne compacte cumule potentiellement plusieurs types d'ecart pour un meme artefact :
 * une couleur n'est donc appliquee que pour les 3 etats qui concernent l'artefact dans son
 * ensemble (nouveau / supprime / type change) ; pour tout le reste (attribut, tag, contenu,
 * image ...), une couleur induirait une mauvaise interpretation de la ligne, donc aucune
 * classe n'est appliquee.
 * @param {String} difflabelBlock - Labels de diff cumules pour l'artefact, separes par '\n'
 * @returns {String}              - Classe CSS (ex: "rpt-row-newart"), ou '' si aucune ne s'applique
 */
function rpt_getCompactRowClass(difflabelBlock) {
    const myLabels = difflabelBlock.split('\n');

    if (myLabels.includes(DIFF_LABEL[DIFF_NEWARTIFACT])) return ClassDiffResult.META[DIFF_NEWARTIFACT].rptRowClass;
    if (myLabels.includes(DIFF_LABEL[DIFF_DELARTIFACT])) return ClassDiffResult.META[DIFF_DELARTIFACT].rptRowClass;
    if (myLabels.includes(DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED])) return ClassDiffResult.META[DIFF_ARTIFACTTYPECHANGED].rptRowClass;

    return '';
}

/**
 * Déclencher le téléchargement d'un fichier HTML
 * Stratégie identique à l'export XLSX : window.top pour contourner frame-src CSP
 * @param {String} htmlContent - Contenu HTML complet du rapport
 * @param {String} filename    - Nom de fichier sans extension
 */
function rpt_downloadHtml(htmlContent, filename) {
    const myBlob    = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const myBlobUrl = URL.createObjectURL(myBlob);
    const myCleanup = function() { URL.revokeObjectURL(myBlobUrl); };

    // ---- Option 1 : ancre dans window.top (même origine JTS, échappe à frame-src)
    if (window !== window.top) {
        try {
            const myTopDoc = window.top.document;
            const myAnchor = myTopDoc.createElement('a');
            myAnchor.href  = myBlobUrl;
            myAnchor.setAttribute('download', filename + '.html');
            myAnchor.style.display = 'none';
            myTopDoc.body.appendChild(myAnchor);
            myAnchor.click();
            myTopDoc.body.removeChild(myAnchor);
            setTimeout(myCleanup, 500);
            return;
        } catch(e) {
            console.warn("$$$ window.top inaccessible :", e.message);
        }
    }

    // ---- Option 2 : nouvelle fenêtre top-level (hors portée de frame-src)
    const myNewWin = window.open(myBlobUrl, '_blank');
    if (!myNewWin) {
        console.error("$$$ Téléchargement bloqué : autoriser les popups pour " + window.location.hostname);
    }
    setTimeout(myCleanup, 1000);
}

/**
 * Construire la feuille de style CSS complète du rapport
 * CSS embarqué dans le fichier pour un rapport autonome
 * @returns {String}            - Bloc CSS complet
 */
function rpt_buildCss() {
    return `
/* ---- Reset et base */
*,*::before,*::after{box-sizing:border-box}
body{font-family:Calibri,'Segoe UI',Arial,sans-serif;font-size:10pt;color:#222;
     margin:0;padding:16px;background:#f0f2f5}

/* ---- Titre du rapport */
.rpt-title{background:#1F3264;color:#fff;font-size:15pt;font-weight:bold;
           text-align:center;padding:14px 24px;letter-spacing:.5px}

/* ---- Bloc de métadonnées */
.rpt-meta{background:#E9EFF8;border:1px solid #C5D3E8;padding:10px 18px;margin-bottom:12px}
.rpt-meta table{border-collapse:collapse}
.rpt-meta th{text-align:left;font-weight:bold;padding:3px 18px 3px 0;
             color:#1F3264;white-space:nowrap;width:160px;font-size:10pt}
.rpt-meta td{padding:3px 0;font-size:10pt}

/* ---- Légende des couleurs */
.rpt-legend{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;padding:6px 10px;
            background:#fff;border:1px solid #ddd;border-radius:4px;font-size:8.5pt}
.rpt-legend-item{display:flex;align-items:center;gap:5px}
.rpt-legend-swatch{width:14px;height:14px;border:1px solid rgba(0,0,0,.2);flex-shrink:0;border-radius:2px}

/* ---- Contrôles de filtrage */
.rpt-filters{display:flex;align-items:center;flex-wrap:wrap;gap:10px;
             padding:7px 10px;background:#fff;border:1px solid #ddd;border-radius:4px;
             margin-bottom:10px;font-size:9pt}
.rpt-filters label{font-weight:bold;color:#444;white-space:nowrap}
.rpt-filters select,.rpt-filters input[type=text]{padding:4px 8px;border:1px solid #ccc;
             border-radius:3px;font-size:9pt;font-family:inherit}
.rpt-filters select{min-width:220px}
.rpt-filters input[type=text]{min-width:240px}
#rpt-count{margin-left:auto;color:#666;font-size:8.5pt;white-space:nowrap}

/* ---- Conteneur du tableau avec défilement */
.rpt-table-wrap{overflow-x:auto;border:1px solid #ccc;border-radius:4px;background:#fff}

/* ---- Tableau principal */
.rpt-table{border-collapse:collapse;width:100%;font-size:9pt}
.rpt-table thead tr{background:#1F3264;color:#fff}
.rpt-table thead{position:sticky;top:0;z-index:10}
.rpt-table th{padding:8px 10px;text-align:center;font-weight:bold;font-size:9.5pt;
              border:1px solid rgba(255,255,255,.3);white-space:nowrap}
.rpt-table td{padding:5px 8px;border:1px solid #ccc;vertical-align:top}
.rpt-table td:first-child{text-align:center;font-weight:bold;white-space:nowrap}

/* ---- Colorisation des lignes par type de diff (cohérente avec le rapport XLSX) */
.rpt-row-newart {background:#C6EFCE}
.rpt-row-delart {background:#FFC7CE}
.rpt-row-content{background:#DDEBF7}
.rpt-row-changed{background:#FFEB9C}
.rpt-row-image  {background:#BDD7EE}

/* ---- Cellule "Diff Content" : conteneur du rendu de la diff */
.rpt-diffcontent{min-width:360px}

/* ---- Impression (PDF et papier) */
@media print{
    body{background:#fff;padding:6px}
    .rpt-filters{display:none}
    .rpt-table-wrap{overflow:visible;border:none}
    .rpt-table thead{position:static}
    .rpt-table{page-break-inside:auto}
    .rpt-table tr{page-break-inside:avoid;page-break-after:auto}
    *{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
`;
}

/**
 * Assembler le document HTML complet et autonome du rapport (gabarit Handlebars "templ-rpt-shell")
 * @param {Object} info    - Métadonnées : project, newModule, oldModule, date, count, moduleName
 * @param {Object} headers - { colgroup: HTML des <col>, ths: HTML des <th> }
 * @param {String} rows    - HTML des lignes de données (<tr>…)
 * @param {Array}  labels  - Labels de diff uniques présents dans les données (pour le filtre)
 * @param {String} css     - CSS complet à embarquer dans <style>
 * @param {Boolean} isCompact - true = rapport Compact (legende restreinte aux 3 couleurs utilisees)
 * @returns {String}       - Document HTML complet
 */
function rpt_buildHtml(info, headers, rows, labels, css, isCompact) {

    // ---- Légende : n'afficher que les types réellement présents dans les données
    // ---- Source unique de la correspondance type d'ecart / couleur : ClassDiffResult.META
    // ---- Rapport Compact : une ligne cumule plusieurs types d'ecart, seuls les 3 etats globaux
    // ---- de l'artefact (nouveau / supprime / type change) sont colores (cf rpt_getCompactRowClass) ;
    // ---- la legende se restreint donc a ces 3 entrees pour rester coherente avec les lignes.
    const myCompactLegendCodes = [DIFF_NEWARTIFACT, DIFF_DELARTIFACT, DIFF_ARTIFACTTYPECHANGED];
    const myLegendSource = isCompact ? myCompactLegendCodes.map(dc => ClassDiffResult.META[dc]) : Object.values(ClassDiffResult.META);
    const myActiveSet = new Set(labels);
    const myLegendDefs = myLegendSource
        .map(function(m) { return { cls: m.rptRowClass, label: m.label }; })
        .filter(function(d) { return myActiveSet.has(d.label); });

    // ---- Script de filtrage autonome intégré au rapport (pas de dépendance externe)
    // ---- Construit ici, et non dans le gabarit : un <script>...</script> litteral dans un
    // ---- gabarit Handlebars stocke en HTML refermerait prematurement le <script> qui le contient
    const myFilterScript =
        'function rptFilter(){'
        + 'var t=document.getElementById("rpt-type-filter").value;'
        + 'var s=document.getElementById("rpt-text-filter").value.toLowerCase();'
        + 'var rows=document.querySelectorAll("#rpt-tbody tr");'
        + 'var n=0;'
        + 'rows.forEach(function(r){'
        + 'var ok=(!t||r.dataset.difflabel===t)&&(!s||r.textContent.toLowerCase().indexOf(s)>=0);'
        + 'r.style.display=ok?"":"none";'
        + 'if(ok)n++;'
        + '});'
        + 'document.getElementById("rpt-count").textContent=n+" row(s) displayed";'
        + '}';
    const myScriptBlock = '<script>' + myFilterScript + '<\/script>';

    return gui_htmlfromtemplate(TEMPL_RPT_SHELL, {
        moduleName:  info.moduleName,
        project:     info.project,
        newModule:   info.newModule,
        oldModule:   info.oldModule,
        date:        info.date,
        count:       info.count,
        legendDefs:  myLegendDefs,
        labels:      labels,
        colgroup:    headers.colgroup,
        headerThs:   headers.ths,
        rowsHtml:    rows,
        css:         css,
        scriptBlock: myScriptBlock
    });
}

/**
 * Exporter le rapport de comparaison au format HTML autonome
 * @param {Boolean} isCompact - true = format compact, false = format standard
 */
function export_report(isCompact) {
    let myFilteredTable;
    let myCompactTable       = [];
    let myDate               = new Date();
    let myTypeChange         = false;
    let myCustAttrChangeList = [];

    // ---- Récupérer uniquement les lignes visibles (filtre DataTables appliqué)
    myFilteredTable = g_DiffTable.DataTable().rows({ filter: 'applied' }).data().toArray();

    let myHeaderColgroup;  // ---- Balises <col> pour les largeurs de colonnes
    let myHeaderThs;       // ---- Balises <th> de l'entête
    let myRowsHtml = '';   // ---- Lignes de données (<tr>)
    let myLabelSet = new Set();  // ---- Labels de diff uniques (pour le filtre)

    if (isCompact != undefined && isCompact === true) {
        console.log("$$$ Compact Export Diff Report to HTML");

        // ---- Compacter la table : regrouper les lignes par artefact (même logique que rev. 2)
        // ---- Structure entrée  : [ID, Type, Diff Label, Attribute, Old, New, Content]
        // ---- Structure sortie  : {id, type, difflabel, diffcontent, nbdiff, newtype, custattr[]}

        for (let i = 0; i < myFilteredTable.length; i++) {
            let myCompactRow = myCompactTable.find(row => row.id === myFilteredTable[i][RPT_COL_ID]);

            if (myCompactRow === undefined) {
                let myRow = {
                    'id':          myFilteredTable[i][RPT_COL_ID],
                    'type':        myFilteredTable[i][RPT_COL_TYPE],
                    'section':     myFilteredTable[i][RPT_COL_SECTION],
                    'difflabel':   myFilteredTable[i][RPT_COL_DIFFLABEL],
                    'diffcontent': '',
                    'nbdiff':      1,
                    'newtype':     '',
                    'custattr':    []
                };
                myCompactRow = myRow;
                myCompactTable.push(myCompactRow);
            } else {
                myCompactRow.nbdiff++;

                // ---- Accumuler les labels si l'artefact cumule plusieurs types de diff
                if (myCompactRow.difflabel.indexOf(myFilteredTable[i][RPT_COL_DIFFLABEL]) === -1) {
                    myCompactRow.difflabel += '\n' + myFilteredTable[i][RPT_COL_DIFFLABEL];
                }
            }

            // ---- Traitement spécifique selon le type de différence
            switch (myFilteredTable[i][RPT_COL_DIFFLABEL]) {
                case DIFF_LABEL[DIFF_CONTENTCHANGED]:
                case DIFF_LABEL[DIFF_NEWARTIFACT]:
                case DIFF_LABEL[DIFF_DELARTIFACT]:
                    // ---- Conserver le HTML de la diff tel quel (rendu riche dans le rapport HTML)
                    myCompactRow.diffcontent = myFilteredTable[i][RPT_COL_DIFFCONTENT];
                    break;

                case DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED]:
                    myTypeChange         = true;
                    myCompactRow.newtype = myFilteredTable[i][RPT_COL_OLDVAL];
                    break;

                case DIFF_LABEL[DIFF_CUSTATTRCHANGED]:
                case DIFF_LABEL[DIFF_CUSTATTRCLEARED]:
                case DIFF_LABEL[DIFF_CUSTATTRFILLED]:
                case DIFF_LABEL[DIFF_TAGCHANGED]:
                    if (myCustAttrChangeList.indexOf(myFilteredTable[i][RPT_COL_ATTR]) === -1) {
                        myCustAttrChangeList.push(myFilteredTable[i][RPT_COL_ATTR]);
                    }
                    myCompactRow.custattr.push({
                        'attrname': myFilteredTable[i][RPT_COL_ATTR],
                        'oldvalue': myFilteredTable[i][RPT_COL_OLDVAL],
                        'newvalue': myFilteredTable[i][RPT_COL_NEWVAL]
                    });
                    break;

                default:
            }
        }

        myCustAttrChangeList.sort();

        // ---- Compact report - Structure de sortie
        // ---- +----+------+---------+------------+--------------+------------------+----...----+
        // ---- | ID | Type | Section | Diff Label | Diff Content | Old Artifact (*) | Attr  (*) |
        // ---- |    |      |         |            |              | Type             | Old | New  |
        // ---- (*) : colonnes présentes uniquement si des changements de ce type existent

        const myCols   = ['5%', '10%', '8%', '15%', ''];  // ---- '' : Diff Content prend l'espace restant
        const myLabels = ['ID', 'Type', 'Section', 'Diff Label', 'Diff Content'];

        if (myTypeChange) {
            myCols.push('12%');
            myLabels.push('Old Artifact Type');
        }
        for (let i = 0; i < myCustAttrChangeList.length; i++) {
            myCols.push('10%', '10%');
            myLabels.push(myCustAttrChangeList[i] + ' (Old)', myCustAttrChangeList[i] + ' (New)');
        }

        myHeaderColgroup = myCols.map(function(w) {
            return '<col' + (w ? ' style="width:' + w + '"' : '') + '>';
        }).join('');
        myHeaderThs = myLabels.map(function(t) { return '<th>' + rpt_escHtml(t) + '</th>'; }).join('');

        // ---- Génération des lignes de données compactes (gabarit Handlebars "templ-rpt-row-compact")

        const myCompactRowTemplate = Handlebars.compile($("#" + TEMPL_RPT_ROW_COMPACT).html());

        for (let i = 0; i < myCompactTable.length; i++) {
            const myRow       = myCompactTable[i];
            const myPrimLabel = myRow.difflabel.split('\n')[0];
            myLabelSet.add(myPrimLabel);

            // ---- Aligner les cellules Ancien/Nouveau sur la liste (triee) des attributs rencontres
            const myCustattrCells = myCustAttrChangeList.map(function(attrName) {
                const myAttr = myRow.custattr.find(a => a.attrname === attrName);
                return {
                    old: myAttr ? rpt_stripHtml(myAttr.oldvalue) : '',
                    new: myAttr ? rpt_stripHtml(myAttr.newvalue) : ''
                };
            });

            myRowsHtml += myCompactRowTemplate({
                rowClass:      rpt_getCompactRowClass(myRow.difflabel),
                primLabel:     myPrimLabel,
                id:            myRow.id,
                type:          myRow.type,
                section:       myRow.section,
                // ---- Le retour a la ligne entre labels cumules doit rester du HTML (<br>), donc echappement
                // ---- manuel prealable puis insertion "raw" ({{{...}}}) dans le gabarit
                difflabelHtml: rpt_escHtml(myRow.difflabel).replace(/\n/g, '<br>'),
                diffcontent:   myRow.diffcontent || '', // ---- HTML de la diff deja construit, rendu tel quel
                typeChange:    myTypeChange,
                newtype:       myRow.newtype,
                custattr:      myCustattrCells
            });
        }

    } else {
        console.log("$$$ Standard Export Diff Report to HTML");

        // ---- Standard report - Structure de sortie
        // ---- +----+------+---------+------------+-----------+-----------+-----------+----------------+
        // ---- | ID | Type | Section | Diff Label | Attribute | Old Value | New Value | Diff Content   |
        // ---- +----+------+---------+------------+-----------+-----------+-----------+----------------+

        myHeaderColgroup = '<col style="width:5%"><col style="width:10%"><col style="width:8%"><col style="width:13%">'
                         + '<col style="width:10%"><col style="width:13%"><col style="width:13%"><col>';
        myHeaderThs = '<th>ID</th><th>Type</th><th>Section</th><th>Diff Label</th>'
                    + '<th>Attribute</th><th>Old Value</th><th>New Value</th><th>Diff Content</th>';

        // ---- Génération des lignes de données (gabarit Handlebars "templ-rpt-row-standard")

        const myStandardRowTemplate = Handlebars.compile($("#" + TEMPL_RPT_ROW_STANDARD).html());

        for (let i = 0; i < myFilteredTable.length; i++) {
            const myRow       = myFilteredTable[i];
            const myDiffLabel = myRow[RPT_COL_DIFFLABEL];
            myLabelSet.add(myDiffLabel);

            myRowsHtml += myStandardRowTemplate({
                rowClass:    rpt_getDiffRowClass(myDiffLabel),
                difflabel:   myDiffLabel,
                id:          myRow[RPT_COL_ID],
                type:        myRow[RPT_COL_TYPE],
                section:     myRow[RPT_COL_SECTION],
                attr:        rpt_stripHtml(myRow[RPT_COL_ATTR]),
                oldval:      rpt_stripHtml(myRow[RPT_COL_OLDVAL]),
                newval:      rpt_stripHtml(myRow[RPT_COL_NEWVAL]),
                diffcontent: myRow[RPT_COL_DIFFCONTENT] || '' // ---- HTML de la diff deja construit, rendu tel quel
            });
        }
    }

    // ---- Préparer les métadonnées du rapport
    const myInfo = {
        project:    g_Project.getName(),
        newModule:  g_ConfNew.getName()  + ' / ' + g_ModuleNew.getName(),
        oldModule:  g_ConfOld.getName()  + ' / ' + g_ModuleOld.getName(),
        date:       myDate.toLocaleDateString('en-GB'),
        count:      isCompact ? myCompactTable.length : myFilteredTable.length,
        moduleName: g_ModuleNew.getName()
    };

    // ---- Assembler et télécharger le rapport HTML autonome
    const myHtml = rpt_buildHtml(
        myInfo,
        { colgroup: myHeaderColgroup, ths: myHeaderThs },
        myRowsHtml,
        [...myLabelSet],
        rpt_buildCss(),
        isCompact === true
    );

    rpt_downloadHtml(myHtml, g_ModuleNew.getName() + '_diff_report');
}

/**
 * Exporter le rapport compact au format HTML
 */
function exportCompact_report() {
    export_report(true);
}
