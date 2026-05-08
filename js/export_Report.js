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
+-------------------------------------------------------------------------------+
*/

/* ------------------------------------------------------------------------------
    ---- Constantes
   --------------------------------------------------------------------------- */

// ---- Couleurs de remplissage hexadécimales pour le rapport XLSX (sans le #)
const RPT_FILL_HEADER  = "1F3264";   // Bleu nuit  - en-tête de tableau / titre
const RPT_FILL_META    = "E9EFF8";   // Bleu pâle  - bloc de métadonnées
const RPT_FILL_NEWART  = "C6EFCE";   // Vert clair - nouvel artefact
const RPT_FILL_DELART  = "FFC7CE";   // Rouge clair - artefact supprimé
const RPT_FILL_CONTENT = "DDEBF7";   // Bleu clair - contenu modifié
const RPT_FILL_CHANGED = "FFEB9C";   // Jaune ambre - type/attribut/tag modifié
const RPT_FILL_IMAGE   = "BDD7EE";   // Bleu-gris  - image modifiée

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
 * Supprimer les balises HTML d'une valeur (string ou autre)
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
 * Construire un objet de style de cellule compatible xlsx-js-style
 * @param {Object} opts - fillColor, fontColor, fontSize, bold, hAlign, vAlign, wrap
 * @returns {Object}    - Objet style
 */
function rpt_makeCellStyle(opts) {
    const myOpts = opts || {};
    return {
        font: {
            name:  "Calibri",
            sz:    myOpts.fontSize  || 10,
            bold:  myOpts.bold      || false,
            color: { rgb: myOpts.fontColor || "000000" }
        },
        fill: {
            patternType: "solid",
            fgColor: { rgb: myOpts.fillColor || "FFFFFF" }
        },
        border: {
            top:    { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left:   { style: "thin", color: { rgb: "CCCCCC" } },
            right:  { style: "thin", color: { rgb: "CCCCCC" } }
        },
        alignment: {
            horizontal: myOpts.hAlign || "left",
            vertical:   myOpts.vAlign || "top",
            wrapText:   myOpts.wrap   !== false
        }
    };
}

/**
 * Appliquer un style à toutes les cellules d'une plage de la feuille
 * Les cellules inexistantes (vides dans le AOA) sont créées automatiquement
 * @param {Object} ws       - Objet feuille xlsx
 * @param {Number} startRow - Ligne de début (0-indexée)
 * @param {Number} startCol - Colonne de début (0-indexée)
 * @param {Number} endRow   - Ligne de fin (0-indexée)
 * @param {Number} endCol   - Colonne de fin (0-indexée)
 * @param {Object} style    - Objet style xlsx-js-style
 */
function rpt_applyRangeStyle(ws, startRow, startCol, endRow, endCol, style) {
    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            const myAddr = XLSX.utils.encode_cell({ r: r, c: c });
            if (!ws[myAddr]) ws[myAddr] = { v: "", t: "s" };
            ws[myAddr].s = style;
        }
    }
}

/**
 * Retourner la couleur de fond XLSX correspondant à un label de différence
 * @param {String} diffLabel - Valeur d'un élément de DIFF_LABEL[]
 * @returns {String}         - Code hexadécimal de couleur (sans #)
 */
function rpt_getDiffFillColor(diffLabel) {
    switch (diffLabel) {
        case DIFF_LABEL[DIFF_NEWARTIFACT]:          return RPT_FILL_NEWART;
        case DIFF_LABEL[DIFF_DELARTIFACT]:          return RPT_FILL_DELART;
        case DIFF_LABEL[DIFF_CONTENTCHANGED]:       return RPT_FILL_CONTENT;
        case DIFF_LABEL[DIFF_ARTIFACTTYPECHANGED]:
        case DIFF_LABEL[DIFF_CUSTATTRCHANGED]:
        case DIFF_LABEL[DIFF_TAGCHANGED]:           return RPT_FILL_CHANGED;
        case DIFF_LABEL[DIFF_IMAGECHANGED]:
        case DIFF_LABEL[DIFF_IMAGENEW]:
        case DIFF_LABEL[DIFF_IMAGEDEL]:             return RPT_FILL_IMAGE;
        case DIFF_LABEL[DIFF_IMAGENOTFOUND_NEW]:
        case DIFF_LABEL[DIFF_IMAGENOTFOUND_OLD]:    return RPT_FILL_DELART;
        default:                                    return "FFFFFF";
    }
}

/**
 * Déclencher le téléchargement d'un classeur XLSX
 * Stratégie à 3 niveaux pour contourner le blocage CSP frame-src des iframes IBM Jazz :
 *   1. showSaveFilePicker  — dialogue natif OS, aucune navigation, hors portée du CSP
 *   2. Ancre dans window.top — le téléchargement depuis le document principal n'est pas
 *      soumis à frame-src (qui ne régit que les navigations de sous-frames)
 *   3. window.open()       — nouvelle fenêtre top-level, hors portée de frame-src
 * @param {Object} wb       - Classeur xlsx-js-style
 * @param {String} filename - Nom de fichier sans extension
 */
async function rpt_downloadXlsx(wb, filename) {
    const myArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const myMime  = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const myBlob  = new Blob([myArray], { type: myMime });
    const myFile  = filename + '.xlsx';

    // ---- Option 1 : File System Access API — dialogue natif OS, non soumis au CSP
    if (typeof window.showSaveFilePicker === 'function') {
        try {
            const myHandle   = await window.showSaveFilePicker({
                suggestedName: myFile,
                types: [{ description: 'Microsoft Excel Workbook (.xlsx)', accept: { [myMime]: ['.xlsx'] } }]
            });
            const myWritable = await myHandle.createWritable();
            await myWritable.write(myBlob);
            await myWritable.close();
            return;
        } catch(e) {
            if (e.name === 'AbortError') return;   // Annulé par l'utilisateur
            console.warn("$$$ showSaveFilePicker indisponible :", e.message);
        }
    }

    // ---- Options 2 et 3 : blob: URL
    // ---- frame-src bloque blob: uniquement quand la navigation se produit dans une iframe ;
    // ---- une ancre dans window.top ou window.open() opère dans un contexte top-level
    const myBlobUrl = URL.createObjectURL(myBlob);
    const myCleanup = function() { URL.revokeObjectURL(myBlobUrl); };

    // ---- Option 2 : ancre dans window.top (accessible si même origine que JTS)
    if (window !== window.top) {
        try {
            const myTopDoc = window.top.document;
            const myAnchor = myTopDoc.createElement('a');
            myAnchor.href  = myBlobUrl;
            myAnchor.setAttribute('download', myFile);
            myAnchor.style.display = 'none';
            myTopDoc.body.appendChild(myAnchor);
            myAnchor.click();
            myTopDoc.body.removeChild(myAnchor);
            setTimeout(myCleanup, 500);
            return;
        } catch(e) {
            // ---- Accès refusé (iframe cross-origin inattendu) → tentative suivante
            console.warn("$$$ window.top inaccessible :", e.message);
        }
    }

    // ---- Option 3 : nouvelle fenêtre top-level (hors portée de frame-src)
    const myNewWin = window.open(myBlobUrl, '_blank');
    if (!myNewWin) {
        console.error("$$$ Téléchargement bloqué : veuillez autoriser les popups pour " + window.location.hostname);
    }
    setTimeout(myCleanup, 1000);
}

/**
 * Exporter le rapport de comparaison au format XLSX
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

    // ---- Bloc de métadonnées commun aux deux formats
    // ---- Contenu : titre + 5 lignes d'info + séparateur visuel = 7 lignes
    const myMetaAoa = [
        ["DNG Module Comparison Report"],
        ["Project",            g_Project.name],
        ["New Module",         g_ConfNew.name  + " / " + g_ModuleNew.name],
        ["Old Module",         g_ConfOld.name  + " / " + g_ModuleOld.name],
        ["Export Date",        myDate.toLocaleDateString('en-GB')],
        ["Number of Changes",  myFilteredTable.length],
        []
    ];

    // ---- Index (0-basé) de la ligne d'entête et de la première ligne de données
    const myHeaderRow    = myMetaAoa.length;   // = 7
    const myDataStartRow = myHeaderRow + 1;    // = 8

    let myAoa;      // ---- Array of Arrays complet (méta + entête + données)
    let myNumCols;  // ---- Nombre de colonnes du tableau de données

    if (isCompact != undefined && isCompact === true) {
        console.log("$$$ Compact Export Diff Report to XLSX");

        // ---- Compacter la table : regrouper les lignes par artefact (même ID)
        // ---- Structure entrée  : [ID, Type, Diff Label, Attribute, Old, New, Content]
        // ---- Structure sortie  : {id, type, difflabel, diffcontent, nbdiff, newtype, custattr[]}

        for (let i = 0; i < myFilteredTable.length; i++) {
            let myCompactRow = myCompactTable.find(row => row.id === myFilteredTable[i][RPT_COL_ID]);

            if (myCompactRow === undefined) {
                let myRow = {
                    'id':          myFilteredTable[i][RPT_COL_ID],
                    'type':        myFilteredTable[i][RPT_COL_TYPE],
                    'difflabel':   myFilteredTable[i][RPT_COL_DIFFLABEL],
                    'diffcontent': "",
                    'nbdiff':      1,
                    'newtype':     "",
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

        const myCompactHeader = ["ID", "Type", "Diff Label", "Diff Content"];
        if (myTypeChange) {
            myCompactHeader.push("Old Artifact Type");
        }
        for (let i = 0; i < myCustAttrChangeList.length; i++) {
            myCompactHeader.push(myCustAttrChangeList[i] + " (Old Value)");
            myCompactHeader.push(myCustAttrChangeList[i] + " (New Value)");
        }

        myNumCols = myCompactHeader.length;
        myAoa     = myMetaAoa.concat([myCompactHeader]);

        // ---- Ajouter les lignes de données compactes
        for (let i = 0; i < myCompactTable.length; i++) {
            const myRow     = myCompactTable[i];
            const myDataRow = [
                myRow.id,
                myRow.type,
                rpt_stripHtml(myRow.difflabel),
                rpt_stripHtml(myRow.diffcontent)
            ];

            if (myTypeChange) {
                myDataRow.push(myRow.newtype);
            }

            // ---- Colonnes de valeurs pour chaque attribut modifié (colonnes par paires)
            for (let j = 0; j < myCustAttrChangeList.length; j++) {
                const myAttr = myRow.custattr.find(a => a.attrname === myCustAttrChangeList[j]);
                if (myAttr === undefined) {
                    myDataRow.push("", "");
                } else {
                    myDataRow.push(rpt_stripHtml(myAttr.oldvalue), rpt_stripHtml(myAttr.newvalue));
                }
            }

            myAoa.push(myDataRow);
        }

    } else {
        console.log("$$$ Standard Export Diff Report to XLSX");

        // ---- Standard report - Structure de sortie
        // ---- +----+------+------------+-----------+-----------+-----------+----------------+
        // ---- | ID | Type | Diff Label | Attribute | Old Value | New Value | Diff Content   |
        // ---- +----+------+------------+-----------+-----------+-----------+----------------+

        myNumCols = 7;
        myAoa     = myMetaAoa.concat([[
            "ID", "Type", "Diff Label", "Attribute", "Old Value", "New Value", "Diff Content"
        ]]);

        for (let i = 0; i < myFilteredTable.length; i++) {
            myAoa.push([
                myFilteredTable[i][RPT_COL_ID],
                myFilteredTable[i][RPT_COL_TYPE],
                myFilteredTable[i][RPT_COL_DIFFLABEL],
                rpt_stripHtml(myFilteredTable[i][RPT_COL_ATTR]),
                rpt_stripHtml(myFilteredTable[i][RPT_COL_OLDVAL]),
                rpt_stripHtml(myFilteredTable[i][RPT_COL_NEWVAL]),
                rpt_stripHtml(myFilteredTable[i][RPT_COL_DIFFCONTENT])
            ]);
        }
    }

    // ---- Créer la feuille xlsx à partir du tableau de données
    const ws            = XLSX.utils.aoa_to_sheet(myAoa);
    const myLastDataRow = myAoa.length - 1;
    const myLastCol     = myNumCols - 1;

    // ---- Ajuster !ref pour couvrir toutes les colonnes (y compris les cellules vides styalisées)
    ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: myLastDataRow, c: myLastCol });

    // ---- Style : ligne de titre (ligne 0, toutes colonnes)
    rpt_applyRangeStyle(ws, 0, 0, 0, myLastCol, rpt_makeCellStyle({
        fillColor: RPT_FILL_HEADER,
        fontColor: "FFFFFF",
        fontSize:  14,
        bold:      true,
        hAlign:    "center",
        vAlign:    "center"
    }));

    // ---- Style : bloc de métadonnées (lignes 1 à 5, fond bleu pâle)
    const myMetaLabelStyle = rpt_makeCellStyle({ fillColor: RPT_FILL_META, bold: true,  hAlign: "left", vAlign: "center", wrap: false });
    const myMetaValueStyle = rpt_makeCellStyle({ fillColor: RPT_FILL_META, bold: false, hAlign: "left", vAlign: "center", wrap: false });

    for (let r = 1; r <= 5; r++) {
        const myLabelAddr = XLSX.utils.encode_cell({ r: r, c: 0 });
        if (ws[myLabelAddr]) ws[myLabelAddr].s = myMetaLabelStyle;

        for (let c = 1; c <= myLastCol; c++) {
            const myAddr = XLSX.utils.encode_cell({ r: r, c: c });
            if (!ws[myAddr]) ws[myAddr] = { v: "", t: "s" };
            ws[myAddr].s = myMetaValueStyle;
        }
    }

    // ---- Style : ligne d'entête du tableau (ligne myHeaderRow, fond bleu nuit)
    rpt_applyRangeStyle(ws, myHeaderRow, 0, myHeaderRow, myLastCol, rpt_makeCellStyle({
        fillColor: RPT_FILL_HEADER,
        fontColor: "FFFFFF",
        fontSize:  11,
        bold:      true,
        hAlign:    "center",
        vAlign:    "center"
    }));

    // ---- Style : lignes de données (couleur selon le type de différence)
    for (let r = myDataStartRow; r <= myLastDataRow; r++) {
        const myRowIdx = r - myDataStartRow;

        // ---- Récupérer le label primaire pour déterminer la couleur de fond de la ligne
        let myDiffLabel;
        if (isCompact) {
            myDiffLabel = myCompactTable[myRowIdx]
                ? myCompactTable[myRowIdx].difflabel.split('\n')[0]
                : "";
        } else {
            myDiffLabel = myFilteredTable[myRowIdx]
                ? myFilteredTable[myRowIdx][RPT_COL_DIFFLABEL]
                : "";
        }

        const myFill = rpt_getDiffFillColor(myDiffLabel);

        rpt_applyRangeStyle(ws, r, 0, r, myLastCol, rpt_makeCellStyle({ fillColor: myFill }));

        // ---- Colonne ID : centré et en gras pour faciliter la lecture
        const myIdAddr = XLSX.utils.encode_cell({ r: r, c: 0 });
        if (ws[myIdAddr]) {
            ws[myIdAddr].s = rpt_makeCellStyle({ fillColor: myFill, bold: true, hAlign: "center", vAlign: "center" });
        }
    }

    // ---- Fusion de la cellule de titre sur toute la largeur du tableau
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: myLastCol } }];

    // ---- Largeurs de colonnes (en nombre de caractères)
    if (isCompact) {
        const myCols = [{ wch: 8 }, { wch: 20 }, { wch: 28 }, { wch: 60 }];
        if (myTypeChange) myCols.push({ wch: 25 });
        for (let i = 0; i < myCustAttrChangeList.length; i++) {
            myCols.push({ wch: 30 }, { wch: 30 });
        }
        ws['!cols'] = myCols;
    } else {
        ws['!cols'] = [{ wch: 8 }, { wch: 20 }, { wch: 28 }, { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 60 }];
    }

    // ---- Ligne de titre plus haute pour la lisibilité
    ws['!rows'] = [{ hpx: 34 }];

    // ---- Figer les panneaux : titre + métadonnées + en-tête restent visibles au défilement
    ws['!views'] = [{ state: 'frozen', ySplit: myHeaderRow + 1 }];

    // ---- Filtre automatique sur la ligne d'en-tête
    ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({ r: myHeaderRow, c: 0 }, { r: myHeaderRow, c: myLastCol })
    };

    // ---- Créer le classeur et y ajouter la feuille
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Diff Report");

    // ---- Exporter le classeur via data: URL (contourne le blocage CSP sur blob:)
    rpt_downloadXlsx(wb, g_ModuleNew.name + '_diff_report');
}

/**
 * Exporter le rapport de comparaison compact au format XLSX
 */
function exportCompact_report() {
    export_report(true);
}
