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

// ---- CSS diff2html minimal embarqué en fallback si le fetch du fichier échoue
const RPT_DIFF2HTML_CSS_FALLBACK = [
    '.d2h-diff-table{border-collapse:collapse;width:100%;font-family:monospace;font-size:11px}',
    '.d2h-diff-table td{padding:1px 6px;white-space:pre-wrap;word-break:break-all}',
    '.d2h-del{background:#ffe8e8}.d2h-ins{background:#e8ffe8}.d2h-info{background:#f0f7ff;color:#888}',
    '.d2h-del .d2h-code-line-ctn{background:#ffc0c0}.d2h-ins .d2h-code-line-ctn{background:#9cf09c}',
    '.d2h-code-linenumber{width:30px;min-width:30px;max-width:30px;color:rgba(0,0,0,.3);',
    'padding:0 4px;border-right:1px solid #eee;text-align:right}',
    '.d2h-file-wrapper{border:1px solid #e0e0e0;border-radius:3px;margin:3px 0;overflow:hidden}',
    '.d2h-file-header{padding:4px 8px;background:#f6f8fa;font-size:11px;',
    'color:#586069;border-bottom:1px solid #e0e0e0}'
].join('');

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
 * @param {String} diffLabel - Valeur d'un élément de DIFF_LABEL[]
 * @returns {String}         - Classe CSS (ex: "rpt-row-content")
 */
function rpt_getDiffRowClass(diffLabel) {
    switch (diffLabel) {
        case DIFF_LABEL[DIFF_NEWARTIFACT]:           return 'rpt-row-newart';
        case DIFF_LABEL[DIFF_DELARTIFACT]:           return 'rpt-row-delart';
        case DIFF_LABEL[DIFF_CONTENTCHANGED]:        return 'rpt-row-content';
        case DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED]:
        case DIFF_LABEL[DIFF_CUSTATTRCHANGED]:
        case DIFF_LABEL[DIFF_TAGCHANGED]:            return 'rpt-row-changed';
        case DIFF_LABEL[DIFF_IMAGECHANGED]:
        case DIFF_LABEL[DIFF_IMAGENEW]:
        case DIFF_LABEL[DIFF_IMAGEDEL]:              return 'rpt-row-image';
        case DIFF_LABEL[DIFF_IMAGENOTFOUND_NEW]:
        case DIFF_LABEL[DIFF_IMAGENOTFOUND_OLD]:     return 'rpt-row-delart';
        default:                                     return '';
    }
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
 * Inclut le CSS du rapport + le CSS diff2html embarqué pour un fichier autonome
 * @param {String} diff2htmlCss - CSS diff2html (complet ou fallback minimal)
 * @returns {String}            - Bloc CSS complet
 */
function rpt_buildCss(diff2htmlCss) {
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

/* ---- Cellule "Diff Content" : conteneur du rendu diff2html */
.rpt-diffcontent{min-width:360px}
.rpt-diffcontent .d2h-wrapper{font-size:.85em}
.rpt-diffcontent .d2h-file-wrapper{margin:0}

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

/* ---- CSS diff2html intégré (rendu coloré des diffs de contenu) */
${diff2htmlCss}
`;
}

/**
 * Assembler le document HTML complet et autonome du rapport
 * @param {Object} info    - Métadonnées : project, newModule, oldModule, date, count, moduleName
 * @param {Object} headers - { colgroup: HTML des <col>, ths: HTML des <th> }
 * @param {String} rows    - HTML des lignes de données (<tr>…)
 * @param {Array}  labels  - Labels de diff uniques présents dans les données (pour le filtre)
 * @param {String} css     - CSS complet à embarquer dans <style>
 * @returns {String}       - Document HTML complet
 */
function rpt_buildHtml(info, headers, rows, labels, css) {

    // ---- Légende : n'afficher que les types réellement présents dans les données
    const myLegendDefs = [
        { cls: 'rpt-row-newart',  label: DIFF_LABEL[DIFF_NEWARTIFACT]          },
        { cls: 'rpt-row-delart',  label: DIFF_LABEL[DIFF_DELARTIFACT]           },
        { cls: 'rpt-row-content', label: DIFF_LABEL[DIFF_CONTENTCHANGED]        },
        { cls: 'rpt-row-changed', label: DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED]   },
        { cls: 'rpt-row-changed', label: DIFF_LABEL[DIFF_CUSTATTRCHANGED]       },
        { cls: 'rpt-row-changed', label: DIFF_LABEL[DIFF_TAGCHANGED]            },
        { cls: 'rpt-row-image',   label: DIFF_LABEL[DIFF_IMAGECHANGED]          },
        { cls: 'rpt-row-image',   label: DIFF_LABEL[DIFF_IMAGENEW]              },
        { cls: 'rpt-row-image',   label: DIFF_LABEL[DIFF_IMAGEDEL]              },
        { cls: 'rpt-row-delart',  label: DIFF_LABEL[DIFF_IMAGENOTFOUND_NEW]     },
        { cls: 'rpt-row-delart',  label: DIFF_LABEL[DIFF_IMAGENOTFOUND_OLD]     }
    ];

    const myActiveSet  = new Set(labels);
    const myLegendHtml = myLegendDefs
        .filter(function(d) { return myActiveSet.has(d.label); })
        .map(function(d) {
            return '<span class="rpt-legend-item">'
                 + '<span class="rpt-legend-swatch ' + d.cls + '"></span>'
                 + rpt_escHtml(d.label)
                 + '</span>';
        }).join('');

    // ---- Options du menu déroulant de filtrage par type
    const myTypeOptions = labels
        .map(function(l) {
            return '<option value="' + rpt_escHtml(l) + '">' + rpt_escHtml(l) + '</option>';
        }).join('');

    // ---- Script de filtrage autonome intégré au rapport (pas de dépendance externe)
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

    return '<!DOCTYPE html>\n'
         + '<html lang="en">\n'
         + '<head>\n'
         + '<meta charset="UTF-8">\n'
         + '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
         + '<title>DNG Comparison Report — ' + rpt_escHtml(info.moduleName) + '</title>\n'
         + '<style>' + css + '</style>\n'
         + '</head>\n'
         + '<body>\n'

         + '<div class="rpt-title">DNG Module Comparison Report</div>\n'

         + '<div class="rpt-meta"><table>\n'
         + '  <tr><th>Project</th><td>'            + rpt_escHtml(info.project)   + '</td></tr>\n'
         + '  <tr><th>New Module</th><td>'          + rpt_escHtml(info.newModule) + '</td></tr>\n'
         + '  <tr><th>Old Module</th><td>'          + rpt_escHtml(info.oldModule) + '</td></tr>\n'
         + '  <tr><th>Export Date</th><td>'         + rpt_escHtml(info.date)      + '</td></tr>\n'
         + '  <tr><th>Number of Changes</th><td><b>' + info.count + '</b></td></tr>\n'
         + '</table></div>\n'

         + '<div class="rpt-legend">' + myLegendHtml + '</div>\n'

         + '<div class="rpt-filters">\n'
         + '  <label>Filter by type :</label>\n'
         + '  <select id="rpt-type-filter" onchange="rptFilter()">\n'
         + '    <option value="">— All types —</option>\n'
         + myTypeOptions
         + '  </select>\n'
         + '  <label>Search :</label>\n'
         + '  <input type="text" id="rpt-text-filter" oninput="rptFilter()"'
         + '   placeholder="Search in all columns…">\n'
         + '  <span id="rpt-count">' + info.count + ' row(s)</span>\n'
         + '</div>\n'

         + '<div class="rpt-table-wrap">\n'
         + '  <table class="rpt-table">\n'
         + '    <colgroup>' + headers.colgroup + '</colgroup>\n'
         + '    <thead><tr>' + headers.ths + '</tr></thead>\n'
         + '    <tbody id="rpt-tbody">' + rows + '</tbody>\n'
         + '  </table>\n'
         + '</div>\n'

         + '<script>' + myFilterScript + '<\/script>\n'
         + '</body>\n'
         + '</html>';
}

/**
 * Exporter le rapport de comparaison au format HTML autonome
 * Le CSS diff2html est récupéré en fetch pour garantir un rendu fidèle de la diff
 * @param {Boolean} isCompact - true = format compact, false = format standard
 */
async function export_report(isCompact) {
    let myFilteredTable;
    let myCompactTable       = [];
    let myDate               = new Date();
    let myTypeChange         = false;
    let myCustAttrChangeList = [];

    // ---- Récupérer uniquement les lignes visibles (filtre DataTables appliqué)
    myFilteredTable = g_DiffTable.DataTable().rows({ filter: 'applied' }).data().toArray();

    // ---- Récupérer le CSS diff2html depuis le serveur pour l'embarquer dans le rapport
    // ---- (fallback minimal si le fetch échoue, ex : hors réseau)
    let myDiff2htmlCss = RPT_DIFF2HTML_CSS_FALLBACK;
    try {
        const myResp = await fetch('lib/diff2html/diff2html.min.css');
        if (myResp.ok) myDiff2htmlCss = await myResp.text();
    } catch(e) {
        console.warn("$$$ CSS diff2html non récupéré, utilisation du fallback :", e.message);
    }

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
                    // ---- Conserver le HTML diff2html tel quel (rendu riche dans le rapport HTML)
                    myCompactRow.diffcontent = myFilteredTable[i][RPT_COL_DIFFCONTENT];
                    break;

                case DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED]:
                    myTypeChange         = true;
                    myCompactRow.newtype = myFilteredTable[i][RPT_COL_OLDVAL];
                    break;

                case DIFF_LABEL[DIFF_CUSTATTRCHANGED]:
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
        // ---- +----+------+------------+--------------+------------------+----...----+
        // ---- | ID | Type | Diff Label | Diff Content | Old Artifact (*) | Attr  (*) |
        // ---- |    |      |            |              | Type             | Old | New  |
        // ---- (*) : colonnes présentes uniquement si des changements de ce type existent

        const myCols   = ['5%', '12%', '15%', ''];  // ---- '' : Diff Content prend l'espace restant
        const myLabels = ['ID', 'Type', 'Diff Label', 'Diff Content'];

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

        // ---- Génération des lignes de données compactes
        for (let i = 0; i < myCompactTable.length; i++) {
            const myRow       = myCompactTable[i];
            const myPrimLabel = myRow.difflabel.split('\n')[0];
            const myRowClass  = rpt_getDiffRowClass(myPrimLabel);
            myLabelSet.add(myPrimLabel);

            let myHtml = '<tr class="' + myRowClass + '" data-difflabel="' + rpt_escHtml(myPrimLabel) + '">';
            myHtml += '<td>' + rpt_escHtml(myRow.id) + '</td>';
            myHtml += '<td>' + rpt_escHtml(myRow.type) + '</td>';
            myHtml += '<td>' + rpt_escHtml(myRow.difflabel).replace(/\n/g, '<br>') + '</td>';
            // ---- Diff Content : HTML diff2html rendu directement (texte riche)
            myHtml += '<td class="rpt-diffcontent">' + (myRow.diffcontent || '') + '</td>';

            if (myTypeChange) {
                myHtml += '<td>' + rpt_escHtml(myRow.newtype) + '</td>';
            }

            for (let j = 0; j < myCustAttrChangeList.length; j++) {
                const myAttr = myRow.custattr.find(a => a.attrname === myCustAttrChangeList[j]);
                if (myAttr === undefined) {
                    myHtml += '<td></td><td></td>';
                } else {
                    myHtml += '<td>' + rpt_escHtml(rpt_stripHtml(myAttr.oldvalue)) + '</td>';
                    myHtml += '<td>' + rpt_escHtml(rpt_stripHtml(myAttr.newvalue)) + '</td>';
                }
            }

            myHtml += '</tr>';
            myRowsHtml += myHtml;
        }

    } else {
        console.log("$$$ Standard Export Diff Report to HTML");

        // ---- Standard report - Structure de sortie
        // ---- +----+------+------------+-----------+-----------+-----------+----------------+
        // ---- | ID | Type | Diff Label | Attribute | Old Value | New Value | Diff Content   |
        // ---- +----+------+------------+-----------+-----------+-----------+----------------+

        myHeaderColgroup = '<col style="width:5%"><col style="width:10%"><col style="width:13%">'
                         + '<col style="width:10%"><col style="width:13%"><col style="width:13%"><col>';
        myHeaderThs = '<th>ID</th><th>Type</th><th>Diff Label</th>'
                    + '<th>Attribute</th><th>Old Value</th><th>New Value</th><th>Diff Content</th>';

        for (let i = 0; i < myFilteredTable.length; i++) {
            const myRow      = myFilteredTable[i];
            const myDiffLabel = myRow[RPT_COL_DIFFLABEL];
            const myRowClass  = rpt_getDiffRowClass(myDiffLabel);
            myLabelSet.add(myDiffLabel);

            let myHtml = '<tr class="' + myRowClass + '" data-difflabel="' + rpt_escHtml(myDiffLabel) + '">';
            myHtml += '<td>' + rpt_escHtml(myRow[RPT_COL_ID]) + '</td>';
            myHtml += '<td>' + rpt_escHtml(myRow[RPT_COL_TYPE]) + '</td>';
            myHtml += '<td>' + rpt_escHtml(myRow[RPT_COL_DIFFLABEL]) + '</td>';
            myHtml += '<td>' + rpt_escHtml(rpt_stripHtml(myRow[RPT_COL_ATTR])) + '</td>';
            myHtml += '<td>' + rpt_escHtml(rpt_stripHtml(myRow[RPT_COL_OLDVAL])) + '</td>';
            myHtml += '<td>' + rpt_escHtml(rpt_stripHtml(myRow[RPT_COL_NEWVAL])) + '</td>';
            // ---- Diff Content : HTML diff2html rendu directement (texte riche)
            myHtml += '<td class="rpt-diffcontent">' + (myRow[RPT_COL_DIFFCONTENT] || '') + '</td>';
            myHtml += '</tr>';
            myRowsHtml += myHtml;
        }
    }

    // ---- Préparer les métadonnées du rapport
    const myInfo = {
        project:    g_Project.name,
        newModule:  g_ConfNew.name  + ' / ' + g_ModuleNew.name,
        oldModule:  g_ConfOld.name  + ' / ' + g_ModuleOld.name,
        date:       myDate.toLocaleDateString('en-GB'),
        count:      isCompact ? myCompactTable.length : myFilteredTable.length,
        moduleName: g_ModuleNew.name
    };

    // ---- Assembler et télécharger le rapport HTML autonome
    const myHtml = rpt_buildHtml(
        myInfo,
        { colgroup: myHeaderColgroup, ths: myHeaderThs },
        myRowsHtml,
        [...myLabelSet],
        rpt_buildCss(myDiff2htmlCss)
    );

    rpt_downloadHtml(myHtml, g_ModuleNew.name + '_diff_report');
}

/**
 * Exporter le rapport compact au format HTML
 */
function exportCompact_report() {
    export_report(true);
}
