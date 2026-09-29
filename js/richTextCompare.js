/**
 * @file richTextCompare.js
 * @description Compares two ERM (DOORS Next) rich text fragments ("Primary Text", HTML)
 * and reports the significant differences between them, as specified in the
 * "TRD Rich Text Compare" specification (v6).
 *
 * Public API: a single global function, richTextCompare(oldRichText, newRichText, metaOld, metaNew).
 * All other code is encapsulated in this module and is not visible from the outside.
 *
 * Dependencies (loaded before this file, from ./lib):
 *   - jQuery 3.7.1 (DOM traversal),
 *   - js-sha256 1.0.0 (synchronous SHA-256 of inline base64 images).
 *
 * Main processing steps (TRD section 3):
 *   1. parsing (DOMParser, text/html),
 *   2. normalization into a canonical model (TRD sections 5, 6, 7),
 *   3. comparison of the two canonical models (TRD section 8),
 *   4. production of the result object (TRD sections 4.3 and 8.5).
 */
(function (rootScope) {
    'use strict';

    /* ======================================================================
     * Module constants
     * These constants are shared by all functions of the module, hence the
     * "g_" prefix (TRD 106245). They are not visible outside the module.
     * ====================================================================== */

    /** XHTML namespace carried by the ERM envelope <div> (TRD 106109, step 5). */
    const g_XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

    /** Minimum Dice similarity for two blocks or items to be paired (TRD 106169). */
    const g_SIMILARITY_THRESHOLD = 0.5;

    /** Elements removed together with their content (TRD 106116). */
    const g_removedTagList = ['script', 'style', 'head', 'meta', 'form', 'input', 'iframe', 'video', 'audio'];

    /** Decorative inline elements, flattened into their parent (TRD 106112). */
    const g_decorativeTagList = ['span', 'b', 'strong', 'i', 'em', 'u', 'font'];

    /** Block containers listed in the specification (paragraph delimiters). */
    const g_blockTagList = ['p', 'div', 'li'];

    /** Table-related elements handled by the table builder (TRD 106134). */
    const g_tablePartTagList = ['thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col'];

    /**
     * Unexpected elements that are block-level in HTML. They are logged as unexpected
     * (TRD 106127) and their content is kept, but they also delimit blocks so that the
     * text of two such elements is not merged into a single paragraph.
     */
    const g_unexpectedBlockTagList = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'section', 'article',
        'header', 'footer', 'address', 'figure', 'figcaption', 'center', 'dl', 'dt', 'dd', 'hr', 'main',
        'nav', 'aside', 'details', 'summary'];

    /** Mark carried by the text of each non-decorative inline element (TRD 106120). */
    const g_MARK_BY_TAG = Object.freeze({ sup: 'sup', sub: 'sub', s: 's', del: 's' });

    /** Unicode superscript characters and their digit (TRD 106122). */
    const g_SUPERSCRIPT_BY_CHAR = Object.freeze({
        '¹': '1', '²': '2', '³': '3', '⁰': '0', '⁴': '4',
        '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'
    });

    /** Unicode subscript characters and their digit (TRD 106122). */
    const g_SUBSCRIPT_BY_CHAR = Object.freeze({
        '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
        '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
    });

    /** Regular expression matching the Unicode superscript and subscript characters above. */
    const g_SCRIPT_CHAR_REGEX = /[¹²³⁰⁴-⁹₀-₉]/;

    /** Class name of the ERM decorator wrapping an embedded artifact (TRD 106154). */
    const g_EMBEDDED_CLASS_NAME = 'com-ibm-rdm-editor-EmbeddedResourceDecorator';

    /** Marker attribute used for embedded artifacts in the canonical HTML (TRD 106104). */
    const g_EMBEDDED_MARKER_ATTRIBUTE = 'data-rtc';

    /**
     * Tokenization (TRD 106178), in order of priority:
     *   identifiers (REQ-1234), decimal numbers (3,14), French elisions (l'), words, punctuation.
     */
    const g_TOKEN_REGEX = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+|\d+(?:[.,]\d+)+|\p{L}+'(?=\p{L})|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu;

    /** Warning codes of the anomaly log (TRD 108595). */
    const g_WARNING_CODE = Object.freeze({
        UNEXPECTED_ELEMENT: 'UNEXPECTED_ELEMENT',
        REMOVED_ELEMENT: 'REMOVED_ELEMENT',
        ESCAPED_INPUT: 'ESCAPED_INPUT'
    });

    /* ======================================================================
     * Generic helpers
     * ====================================================================== */

    /**
     * Escapes a string for use as HTML text or attribute value.
     * @param {string} text - Raw text.
     * @returns {string} Escaped text.
     */
    function escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /**
     * Normalizes the characters of a raw text node: Unicode NFC, non-breaking space,
     * quotes, dashes and apostrophes (TRD 106109 step 6 and TRD 106122).
     * Whitespace collapsing is done later, on complete lines.
     * @param {string} text - Raw text node value.
     * @returns {string} Normalized text.
     */
    function normalizeCharacters(text) {
        let result = text.normalize('NFC');
        result = result.replace(/ /g, ' ');
        result = result.replace(/[‘’‚‛′]/g, '\'');
        result = result.replace(/[“”„‟″]/g, '"');
        result = result.replace(/«\s*/g, '"').replace(/\s*»/g, '"');
        result = result.replace(/[‐‑–]/g, '-');
        return result;
    }

    /**
     * Splits a normalized text into tokens (TRD 106178).
     * @param {string} text - Normalized text of a run.
     * @returns {string[]} Token texts.
     */
    function splitTokens(text) {
        return text.match(g_TOKEN_REGEX) || [];
    }

    /**
     * Computes the Dice similarity of two token multisets (TRD 106169):
     * 2 x common tokens / (tokens of A + tokens of B).
     * Two empty lists are considered identical (similarity 1).
     * @param {string[]} firstTokenTextList - Token texts of A.
     * @param {string[]} secondTokenTextList - Token texts of B.
     * @returns {number} Similarity between 0 and 1.
     */
    function diceSimilarity(firstTokenTextList, secondTokenTextList) {
        if (firstTokenTextList.length === 0 && secondTokenTextList.length === 0) {
            return 1;
        }
        const countByToken = new Map();
        for (const token of firstTokenTextList) {
            countByToken.set(token, (countByToken.get(token) || 0) + 1);
        }
        let commonCount = 0;
        for (const token of secondTokenTextList) {
            const count = countByToken.get(token) || 0;
            if (count > 0) {
                commonCount++;
                countByToken.set(token, count - 1);
            }
        }
        return (2 * commonCount) / (firstTokenTextList.length + secondTokenTextList.length);
    }

    /**
     * Computes the longest common subsequence of two lists (TRD 106167).
     * Common prefix and suffix are handled first to keep the dynamic programming table small.
     * @param {Array} firstList - First list.
     * @param {Array} secondList - Second list.
     * @param {function(*, *): boolean} isEqual - Equality predicate.
     * @returns {Array<number[]>} Pairs [indexA, indexB] of matched elements, in increasing order.
     */
    function longestCommonSubsequence(firstList, secondList, isEqual) {
        const pairList = [];
        let start = 0;
        while (start < firstList.length && start < secondList.length && isEqual(firstList[start], secondList[start])) {
            pairList.push([start, start]);
            start++;
        }
        let endA = firstList.length;
        let endB = secondList.length;
        const suffixPairList = [];
        while (endA > start && endB > start && isEqual(firstList[endA - 1], secondList[endB - 1])) {
            endA--;
            endB--;
            suffixPairList.unshift([endA, endB]);
        }
        const rowCount = endA - start;
        const columnCount = endB - start;
        if (rowCount > 0 && columnCount > 0) {
            const width = columnCount + 1;
            const lengthList = new Int32Array((rowCount + 1) * width);
            for (let i = rowCount - 1; i >= 0; i--) {
                for (let j = columnCount - 1; j >= 0; j--) {
                    if (isEqual(firstList[start + i], secondList[start + j])) {
                        lengthList[i * width + j] = lengthList[(i + 1) * width + j + 1] + 1;
                    } else {
                        lengthList[i * width + j] = Math.max(lengthList[(i + 1) * width + j], lengthList[i * width + j + 1]);
                    }
                }
            }
            let i = 0;
            let j = 0;
            while (i < rowCount && j < columnCount) {
                if (isEqual(firstList[start + i], secondList[start + j])) {
                    pairList.push([start + i, start + j]);
                    i++;
                    j++;
                } else if (lengthList[(i + 1) * width + j] >= lengthList[i * width + j + 1]) {
                    i++;
                } else {
                    j++;
                }
            }
        }
        return pairList.concat(suffixPairList);
    }

    /**
     * Computes the longest increasing subsequence of a list of numbers.
     * Used to detect moved list items (TRD 106171).
     * @param {number[]} valueList - Values.
     * @returns {Set<number>} Positions (in valueList) belonging to the subsequence.
     */
    function longestIncreasingSubsequence(valueList) {
        const tailIndexList = [];
        const previousIndexList = new Array(valueList.length).fill(-1);
        for (let i = 0; i < valueList.length; i++) {
            let low = 0;
            let high = tailIndexList.length;
            while (low < high) {
                const middle = (low + high) >> 1;
                if (valueList[tailIndexList[middle]] < valueList[i]) {
                    low = middle + 1;
                } else {
                    high = middle;
                }
            }
            if (low > 0) {
                previousIndexList[i] = tailIndexList[low - 1];
            }
            tailIndexList[low] = i;
        }
        const resultSet = new Set();
        let index = tailIndexList.length > 0 ? tailIndexList[tailIndexList.length - 1] : -1;
        while (index >= 0) {
            resultSet.add(index);
            index = previousIndexList[index];
        }
        return resultSet;
    }

    /**
     * Aligns two sequences by order-preserving pairing, maximizing the total similarity of
     * the pairs whose similarity reaches the threshold (TRD 106172: rows and columns of tables).
     * @param {number} countA - Length of sequence A.
     * @param {number} countB - Length of sequence B.
     * @param {function(number, number): number} similarityOf - Similarity of A[i] and B[j].
     * @returns {Array<number[]>} Pairs [indexA, indexB], in increasing order.
     */
    function alignBySimilarity(countA, countB, similarityOf) {
        const width = countB + 1;
        const scoreList = new Float64Array((countA + 1) * width);
        const similarityList = new Float64Array(countA * countB);
        for (let i = 0; i < countA; i++) {
            for (let j = 0; j < countB; j++) {
                similarityList[i * countB + j] = similarityOf(i, j);
            }
        }
        for (let i = countA - 1; i >= 0; i--) {
            for (let j = countB - 1; j >= 0; j--) {
                let best = Math.max(scoreList[(i + 1) * width + j], scoreList[i * width + j + 1]);
                const similarity = similarityList[i * countB + j];
                if (similarity >= g_SIMILARITY_THRESHOLD) {
                    best = Math.max(best, similarity + scoreList[(i + 1) * width + j + 1]);
                }
                scoreList[i * width + j] = best;
            }
        }
        const pairList = [];
        let i = 0;
        let j = 0;
        while (i < countA && j < countB) {
            const similarity = similarityList[i * countB + j];
            const current = scoreList[i * width + j];
            if (similarity >= g_SIMILARITY_THRESHOLD && current === similarity + scoreList[(i + 1) * width + j + 1]) {
                pairList.push([i, j]);
                i++;
                j++;
            } else if (current === scoreList[(i + 1) * width + j]) {
                i++;
            } else {
                j++;
            }
        }
        return pairList;
    }

    /**
     * Compares two paths (arrays of 1-based indexes) lexicographically.
     * @param {number[]} firstPathList - First path.
     * @param {number[]} secondPathList - Second path.
     * @returns {number} Negative, zero or positive value.
     */
    function comparePaths(firstPathList, secondPathList) {
        const length = Math.min(firstPathList.length, secondPathList.length);
        for (let i = 0; i < length; i++) {
            if (firstPathList[i] !== secondPathList[i]) {
                return firstPathList[i] - secondPathList[i];
            }
        }
        return firstPathList.length - secondPathList.length;
    }

    /**
     * Builds an entry of the "differences" array with a stable property order (TRD 8.5).
     * @param {string} type - Value of the "type" property (TRD 8.6).
     * @param {Object} location - Location properties (position, itemPath, rowIndex, ...).
     * @param {string} oldText - Canonical text before.
     * @param {string} newText - Canonical text after.
     * @param {Array|null} changeList - Atomic changes, or null when not applicable.
     * @returns {Object} The difference entry.
     */
    function makeDifference(type, location, oldText, newText, changeList) {
        const difference = { type: type };
        const locationKeyList = ['position', 'itemPath', 'oldItemPath', 'rowIndex', 'colIndex', 'rowSpan', 'colSpan', 'nested'];
        for (const key of locationKeyList) {
            if (location[key] !== undefined) {
                difference[key] = location[key];
            }
        }
        difference.old = oldText;
        difference.new = newText;
        if (changeList) {
            difference.changes = changeList;
        }
        return difference;
    }

    /* ======================================================================
     * Anomaly log (TRD 10.5)
     * ====================================================================== */

    /**
     * Collects the anomalies found while parsing both arguments (TRD 108595).
     */
    class RtcWarningLog {
        #entryList;

        /**
         * Creates an empty log.
         */
        constructor() {
            this.#entryList = [];
        }

        /**
         * Returns a copy of the logged entries.
         * @returns {Array<{code: string, message: string, detail: Object}>} Log entries.
         */
        get_entryList() {
            return this.#entryList.slice();
        }

        /**
         * Replaces the logged entries.
         * @param {Array<Object>} entryList - New entries.
         */
        set_entryList(entryList) {
            this.#entryList = entryList.slice();
        }

        /**
         * Adds an entry to the log.
         * @param {string} code - One of g_WARNING_CODE.
         * @param {string} message - Readable description, in English.
         * @param {string|null} elementName - Name of the element concerned, if any.
         * @param {string} origin - Argument of origin: "old" or "new".
         */
        add(code, message, elementName, origin) {
            this.#entryList.push({ code: code, message: message, detail: { element: elementName, origin: origin } });
        }
    }

    /* ======================================================================
     * Canonical model — inline content
     * ====================================================================== */

    /**
     * Base class of the inline items of the canonical model.
     */
    class RtcInlineItem {
        #kind;

        /**
         * @param {string} kind - Item kind: "text", "image", "link", "embedded" or "lineBreak".
         */
        constructor(kind) {
            this.#kind = kind;
        }

        /**
         * @returns {string} Item kind.
         */
        get_kind() {
            return this.#kind;
        }

        /**
         * @param {string} kind - New item kind.
         */
        set_kind(kind) {
            this.#kind = kind;
        }

        /**
         * Tells whether the item is a linked object (image, link or embedded artifact).
         * @returns {boolean} True for linked objects.
         */
        isObject() {
            return false;
        }

        /**
         * Returns the canonical HTML of the item (TRD 106104).
         * @returns {string} HTML fragment.
         */
        toHtml() {
            return '';
        }

        /**
         * Returns the canonical text of the item (TRD 106104).
         * @returns {string} Text.
         */
        toText() {
            return '';
        }
    }

    /**
     * Run of text sharing the same mark (none, superscript, subscript or strikethrough).
     */
    class RtcTextRun extends RtcInlineItem {
        #text;
        #mark;

        /**
         * @param {string} text - Text of the run.
         * @param {string} mark - "" (none), "sup", "sub" or "s".
         */
        constructor(text, mark) {
            super('text');
            this.#text = text;
            this.#mark = mark;
        }

        /**
         * @returns {string} Text of the run.
         */
        get_text() {
            return this.#text;
        }

        /**
         * @param {string} text - New text of the run.
         */
        set_text(text) {
            this.#text = text;
        }

        /**
         * @returns {string} Mark of the run.
         */
        get_mark() {
            return this.#mark;
        }

        /**
         * @param {string} mark - New mark of the run.
         */
        set_mark(mark) {
            this.#mark = mark;
        }

        /**
         * @returns {string} Canonical HTML of the run.
         */
        toHtml() {
            const text = escapeHtml(this.#text);
            return this.#mark ? '<' + this.#mark + '>' + text + '</' + this.#mark + '>' : text;
        }

        /**
         * Returns the canonical text, with the notations ^{...}, _{...} and ~~...~~ (TRD 106104).
         * @returns {string} Text.
         */
        toText() {
            if (this.#mark === 'sup') {
                return '^{' + this.#text + '}';
            }
            if (this.#mark === 'sub') {
                return '_{' + this.#text + '}';
            }
            if (this.#mark === 's') {
                return '~~' + this.#text + '~~';
            }
            return this.#text;
        }
    }

    /**
     * Base class of the linked objects (TRD section 7).
     */
    class RtcObjectItem extends RtcInlineItem {
        /**
         * Tells whether the item is a linked object.
         * @returns {boolean} Always true.
         */
        isObject() {
            return true;
        }

        /**
         * Returns the attributes compared for this object, in a fixed order.
         * @returns {Array<string[]>} Pairs [attributeName, value].
         */
        get_attributeList() {
            return [];
        }

        /**
         * Returns the canonical representation used in "old" and "new" (TRD 108588).
         * @returns {string} Representation such as img(src, alt).
         */
        toCanonical() {
            return this.get_kind();
        }

        /**
         * Returns a key identifying the object and all its compared attributes.
         * @returns {string} Key.
         */
        toKey() {
            return JSON.stringify([this.get_kind(), this.get_attributeList()]);
        }
    }

    /**
     * Image: canonical model img(src, alt) (TRD 7.2).
     */
    class RtcImageItem extends RtcObjectItem {
        #src;
        #alt;

        /**
         * @param {string} src - Canonical source (sha256:... for inline base64 images).
         * @param {string} alt - Alternative text.
         */
        constructor(src, alt) {
            super('image');
            this.#src = src;
            this.#alt = alt;
        }

        /**
         * @returns {string} Canonical source.
         */
        get_src() {
            return this.#src;
        }

        /**
         * @param {string} src - New canonical source.
         */
        set_src(src) {
            this.#src = src;
        }

        /**
         * @returns {string} Alternative text.
         */
        get_alt() {
            return this.#alt;
        }

        /**
         * @param {string} alt - New alternative text.
         */
        set_alt(alt) {
            this.#alt = alt;
        }

        /**
         * @returns {Array<string[]>} Compared attributes.
         */
        get_attributeList() {
            return [['src', this.#src], ['alt', this.#alt]];
        }

        /**
         * @returns {string} img(src, alt).
         */
        toCanonical() {
            return 'img(' + this.#src + ', ' + this.#alt + ')';
        }

        /**
         * @returns {string} Canonical HTML.
         */
        toHtml() {
            return '<img src="' + escapeHtml(this.#src) + '" alt="' + escapeHtml(this.#alt) + '">';
        }

        /**
         * @returns {string} Canonical text: [img: alt].
         */
        toText() {
            return '[img: ' + this.#alt + ']';
        }
    }

    /**
     * External link: canonical model link(href, label) (TRD 7.4).
     */
    class RtcLinkItem extends RtcObjectItem {
        #href;
        #label;

        /**
         * @param {string} href - Target of the link.
         * @param {string} label - Normalized text of the link.
         */
        constructor(href, label) {
            super('link');
            this.#href = href;
            this.#label = label;
        }

        /**
         * @returns {string} Target of the link.
         */
        get_href() {
            return this.#href;
        }

        /**
         * @param {string} href - New target.
         */
        set_href(href) {
            this.#href = href;
        }

        /**
         * @returns {string} Label of the link.
         */
        get_label() {
            return this.#label;
        }

        /**
         * @param {string} label - New label.
         */
        set_label(label) {
            this.#label = label;
        }

        /**
         * @returns {Array<string[]>} Compared attributes.
         */
        get_attributeList() {
            return [['href', this.#href], ['label', this.#label]];
        }

        /**
         * @returns {string} link(href, label).
         */
        toCanonical() {
            return 'link(' + this.#href + ', ' + this.#label + ')';
        }

        /**
         * @returns {string} Canonical HTML.
         */
        toHtml() {
            return '<a href="' + escapeHtml(this.#href) + '">' + escapeHtml(this.#label) + '</a>';
        }

        /**
         * @returns {string} Canonical text: the label.
         */
        toText() {
            return this.#label;
        }
    }

    /**
     * Embedded ERM artifact: canonical model embedded(presence) (TRD 7.3).
     */
    class RtcEmbeddedItem extends RtcObjectItem {
        /**
         * Creates an embedded artifact marker.
         */
        constructor() {
            super('embedded');
        }

        /**
         * @returns {string} "embedded".
         */
        toCanonical() {
            return 'embedded';
        }

        /**
         * @returns {string} Canonical HTML marker.
         */
        toHtml() {
            return '<span ' + g_EMBEDDED_MARKER_ATTRIBUTE + '="embedded"></span>';
        }

        /**
         * @returns {string} Canonical text: [embedded].
         */
        toText() {
            return '[embedded]';
        }
    }

    /**
     * Line separator inside a table cell or a list item holding several blocks (TRD 108596).
     */
    class RtcLineBreakItem extends RtcInlineItem {
        /**
         * Creates a line separator.
         */
        constructor() {
            super('lineBreak');
        }

        /**
         * @returns {string} Canonical text: a space (one line per cell or item).
         */
        toText() {
            return ' ';
        }
    }

    /**
     * Normalizes the whitespace of one line of inline items (TRD 106122):
     * collapses whitespace, trims the start and end of the line and of marked runs,
     * merges adjacent runs with the same mark, splits Unicode superscripts and subscripts.
     * @param {RtcInlineItem[]} itemList - Raw items of the line (no line breaks).
     * @returns {RtcInlineItem[]} Normalized items.
     */
    function normalizeLine(itemList) {
        const expandedList = [];
        for (const item of itemList) {
            if (item.get_kind() !== 'text') {
                expandedList.push(item);
                continue;
            }
            let text = item.get_text().replace(/\s+/g, ' ');
            if (item.get_mark()) {
                text = text.trim();
            }
            if (!text) {
                continue;
            }
            if (!g_SCRIPT_CHAR_REGEX.test(text)) {
                expandedList.push(new RtcTextRun(text, item.get_mark()));
                continue;
            }
            let buffer = '';
            for (const character of text) {
                const superscript = g_SUPERSCRIPT_BY_CHAR[character];
                const subscript = g_SUBSCRIPT_BY_CHAR[character];
                if (superscript === undefined && subscript === undefined) {
                    buffer += character;
                    continue;
                }
                if (buffer) {
                    expandedList.push(new RtcTextRun(buffer, item.get_mark()));
                    buffer = '';
                }
                if (superscript !== undefined) {
                    expandedList.push(new RtcTextRun(superscript, 'sup'));
                } else {
                    expandedList.push(new RtcTextRun(subscript, 'sub'));
                }
            }
            if (buffer) {
                expandedList.push(new RtcTextRun(buffer, item.get_mark()));
            }
        }
        const mergedList = [];
        for (const item of expandedList) {
            const previous = mergedList.length > 0 ? mergedList[mergedList.length - 1] : null;
            if (previous && item.get_kind() === 'text' && previous.get_kind() === 'text' && previous.get_mark() === item.get_mark()) {
                previous.set_text((previous.get_text() + item.get_text()).replace(/ {2,}/g, ' '));
            } else {
                mergedList.push(item);
            }
        }
        // Avoid a double space across two runs, then trim both ends of the line.
        for (let i = 1; i < mergedList.length; i++) {
            const previous = mergedList[i - 1];
            const current = mergedList[i];
            if (previous.get_kind() === 'text' && current.get_kind() === 'text'
                && previous.get_text().endsWith(' ') && current.get_text().startsWith(' ')) {
                current.set_text(current.get_text().substring(1));
            }
        }
        if (mergedList.length > 0 && mergedList[0].get_kind() === 'text') {
            mergedList[0].set_text(mergedList[0].get_text().replace(/^ /, ''));
        }
        const last = mergedList.length > 0 ? mergedList[mergedList.length - 1] : null;
        if (last && last.get_kind() === 'text') {
            last.set_text(last.get_text().replace(/ $/, ''));
        }
        return mergedList.filter(function (item) {
            return item.get_kind() !== 'text' || item.get_text() !== '';
        });
    }

    /**
     * Normalizes raw inline items that may contain line breaks: each line is normalized,
     * empty lines are dropped and the remaining lines are separated by a single line break.
     * @param {RtcInlineItem[]} rawItemList - Raw items.
     * @returns {RtcInlineItem[]} Normalized items.
     */
    function normalizeInlineContent(rawItemList) {
        const lineList = [];
        let currentList = [];
        for (const item of rawItemList) {
            if (item.get_kind() === 'lineBreak') {
                lineList.push(currentList);
                currentList = [];
            } else {
                currentList.push(item);
            }
        }
        lineList.push(currentList);
        const resultList = [];
        for (const lineItemList of lineList) {
            const normalizedList = normalizeLine(lineItemList);
            if (normalizedList.length === 0) {
                continue;
            }
            if (resultList.length > 0) {
                resultList.push(new RtcLineBreakItem());
            }
            for (const item of normalizedList) {
                resultList.push(item);
            }
        }
        return resultList;
    }

    /**
     * Splits normalized inline content into lines.
     * @param {RtcInlineItem[]} itemList - Normalized items.
     * @returns {Array<RtcInlineItem[]>} Lines.
     */
    function splitLines(itemList) {
        const lineList = [[]];
        for (const item of itemList) {
            if (item.get_kind() === 'lineBreak') {
                lineList.push([]);
            } else {
                lineList[lineList.length - 1].push(item);
            }
        }
        return lineList;
    }

    /**
     * Returns the canonical HTML of inline content; several lines become several <p>.
     * @param {RtcInlineItem[]} itemList - Normalized items.
     * @returns {string} HTML.
     */
    function inlineToHtml(itemList) {
        const lineList = splitLines(itemList);
        const htmlList = lineList.map(function (lineItemList) {
            return lineItemList.map(function (item) {
                return item.toHtml();
            }).join('');
        });
        if (htmlList.length === 1) {
            return htmlList[0];
        }
        return htmlList.map(function (html) {
            return '<p>' + html + '</p>';
        }).join('');
    }

    /**
     * Returns the canonical text of inline content (TRD 106104).
     * @param {RtcInlineItem[]} itemList - Normalized items.
     * @returns {string} Text on a single line.
     */
    function inlineToText(itemList) {
        return itemList.map(function (item) {
            return item.toText();
        }).join('');
    }

    /**
     * Tokenizes inline content (TRD 106178).
     * Text tokens carry the mark of their run; line breaks become "\n" tokens;
     * linked objects are returned separately because they are compared as objects.
     * @param {RtcInlineItem[]} itemList - Normalized items.
     * @returns {{textTokenList: Array<{text: string, mark: string}>, objectList: RtcObjectItem[]}} Tokens and objects.
     */
    function tokenizeInline(itemList) {
        const textTokenList = [];
        const objectList = [];
        for (const item of itemList) {
            if (item.get_kind() === 'text') {
                for (const tokenText of splitTokens(item.get_text())) {
                    textTokenList.push({ text: tokenText, mark: item.get_mark() });
                }
            } else if (item.get_kind() === 'lineBreak') {
                textTokenList.push({ text: '\n', mark: '' });
            } else {
                objectList.push(item);
            }
        }
        return { textTokenList: textTokenList, objectList: objectList };
    }

    /**
     * Builds the equality key of inline content: tokens with their marks and objects with
     * their attributes. Spacing between tokens is therefore not significant.
     * @param {RtcInlineItem[]} itemList - Normalized items.
     * @returns {Array} Key data (serializable).
     */
    function inlineKeyData(itemList) {
        const keyList = [];
        for (const item of itemList) {
            if (item.get_kind() === 'text') {
                for (const tokenText of splitTokens(item.get_text())) {
                    keyList.push(item.get_mark() ? item.get_mark() + ':' + tokenText : tokenText);
                }
            } else if (item.get_kind() === 'lineBreak') {
                keyList.push('\n');
            } else {
                keyList.push(item.toKey());
            }
        }
        return keyList;
    }

    /**
     * Returns the token texts used for similarity: text tokens plus one marker per object kind.
     * @param {RtcInlineItem[]} itemList - Normalized items.
     * @returns {string[]} Token texts.
     */
    function inlineSimilarityTokens(itemList) {
        const tokenized = tokenizeInline(itemList);
        const tokenTextList = tokenized.textTokenList.map(function (token) {
            return token.text;
        });
        for (const objectItem of tokenized.objectList) {
            tokenTextList.push('\u0000' + objectItem.get_kind());
        }
        return tokenTextList;
    }

    /* ======================================================================
     * Canonical model — blocks
     * ====================================================================== */

    /**
     * Base class of the top-level blocks of the canonical model.
     */
    class RtcBlock {
        #kind;

        /**
         * @param {string} kind - Block kind: "text", "list" or "table".
         */
        constructor(kind) {
            this.#kind = kind;
        }

        /**
         * @returns {string} Block kind.
         */
        get_kind() {
            return this.#kind;
        }

        /**
         * @param {string} kind - New block kind.
         */
        set_kind(kind) {
            this.#kind = kind;
        }

        /**
         * @returns {Array} Serializable key data describing the whole block.
         */
        toKeyData() {
            return [];
        }

        /**
         * @returns {string} Equality key of the block.
         */
        toKey() {
            return JSON.stringify(this.toKeyData());
        }

        /**
         * @returns {string} Canonical HTML of the block.
         */
        toHtml() {
            return '';
        }

        /**
         * @returns {string[]} Canonical text lines of the block.
         */
        toTextLineList() {
            return [];
        }

        /**
         * @returns {string[]} Token texts used to compute the similarity with another block.
         */
        toSimilarityTokenList() {
            return [];
        }
    }

    /**
     * Paragraph of text, possibly inside a blockquote (TRD 5.5 and 6.3).
     */
    class RtcParagraphBlock extends RtcBlock {
        #inlineList;
        #quoted;

        /**
         * @param {RtcInlineItem[]} inlineList - Normalized inline content (single line).
         * @param {boolean} quoted - True when the paragraph belongs to a blockquote.
         */
        constructor(inlineList, quoted) {
            super('text');
            this.#inlineList = inlineList;
            this.#quoted = quoted;
        }

        /**
         * @returns {RtcInlineItem[]} Inline content.
         */
        get_inlineList() {
            return this.#inlineList;
        }

        /**
         * @param {RtcInlineItem[]} inlineList - New inline content.
         */
        set_inlineList(inlineList) {
            this.#inlineList = inlineList;
        }

        /**
         * @returns {boolean} True for a blockquote paragraph.
         */
        get_quoted() {
            return this.#quoted;
        }

        /**
         * @param {boolean} quoted - New blockquote flag.
         */
        set_quoted(quoted) {
            this.#quoted = quoted;
        }

        /**
         * @returns {Array} Key data.
         */
        toKeyData() {
            return ['text', this.#quoted, inlineKeyData(this.#inlineList)];
        }

        /**
         * @returns {string} Canonical HTML.
         */
        toHtml() {
            const html = '<p>' + inlineToHtml(this.#inlineList) + '</p>';
            return this.#quoted ? '<blockquote>' + html + '</blockquote>' : html;
        }

        /**
         * @returns {string[]} One text line.
         */
        toTextLineList() {
            return [inlineToText(this.#inlineList)];
        }

        /**
         * @returns {string[]} Similarity tokens.
         */
        toSimilarityTokenList() {
            return inlineSimilarityTokens(this.#inlineList);
        }
    }

    /**
     * Item of a list, with its own content and its nested lists (TRD 6.1).
     */
    class RtcListItem {
        #inlineList;
        #childListList;

        /**
         * @param {RtcInlineItem[]} inlineList - Normalized content of the item.
         * @param {RtcListBlock[]} childListList - Nested lists.
         */
        constructor(inlineList, childListList) {
            this.#inlineList = inlineList;
            this.#childListList = childListList;
        }

        /**
         * @returns {RtcInlineItem[]} Content of the item.
         */
        get_inlineList() {
            return this.#inlineList;
        }

        /**
         * @param {RtcInlineItem[]} inlineList - New content.
         */
        set_inlineList(inlineList) {
            this.#inlineList = inlineList;
        }

        /**
         * @returns {RtcListBlock[]} Nested lists.
         */
        get_childListList() {
            return this.#childListList;
        }

        /**
         * @param {RtcListBlock[]} childListList - New nested lists.
         */
        set_childListList(childListList) {
            this.#childListList = childListList;
        }

        /**
         * @returns {Array} Key data of the item and its nested lists.
         */
        toKeyData() {
            return [inlineKeyData(this.#inlineList), this.#childListList.map(function (childList) {
                return childList.toKeyData();
            })];
        }

        /**
         * @returns {string} Canonical HTML of the item.
         */
        toHtml() {
            const childHtml = this.#childListList.map(function (childList) {
                return childList.toHtml();
            }).join('');
            return '<li>' + inlineToHtml(this.#inlineList) + childHtml + '</li>';
        }
    }

    /**
     * Ordered or unordered list (TRD 6.1).
     */
    class RtcListBlock extends RtcBlock {
        #ordered;
        #numberingType;
        #start;
        #itemList;

        /**
         * @param {boolean} ordered - True for <ol>.
         * @param {string} numberingType - Numbering style of an ordered list ("1", "a", "A", "i", "I").
         * @param {number} start - Start value of an ordered list.
         * @param {RtcListItem[]} itemList - Items.
         */
        constructor(ordered, numberingType, start, itemList) {
            super('list');
            this.#ordered = ordered;
            this.#numberingType = numberingType;
            this.#start = start;
            this.#itemList = itemList;
        }

        /**
         * @returns {boolean} True for an ordered list.
         */
        get_ordered() {
            return this.#ordered;
        }

        /**
         * @param {boolean} ordered - New ordered flag.
         */
        set_ordered(ordered) {
            this.#ordered = ordered;
        }

        /**
         * @returns {string} Numbering style.
         */
        get_numberingType() {
            return this.#numberingType;
        }

        /**
         * @param {string} numberingType - New numbering style.
         */
        set_numberingType(numberingType) {
            this.#numberingType = numberingType;
        }

        /**
         * @returns {number} Start value.
         */
        get_start() {
            return this.#start;
        }

        /**
         * @param {number} start - New start value.
         */
        set_start(start) {
            this.#start = start;
        }

        /**
         * @returns {RtcListItem[]} Items.
         */
        get_itemList() {
            return this.#itemList;
        }

        /**
         * @param {RtcListItem[]} itemList - New items.
         */
        set_itemList(itemList) {
            this.#itemList = itemList;
        }

        /**
         * Returns the key data. The order of the items of an unordered list is not significant
         * (TRD 106131), so their keys are sorted.
         * @returns {Array} Key data.
         */
        toKeyData() {
            const itemKeyList = this.#itemList.map(function (item) {
                return JSON.stringify(item.toKeyData());
            });
            if (!this.#ordered) {
                itemKeyList.sort();
            }
            return ['list', this.#ordered, this.#numberingType, this.#start, itemKeyList];
        }

        /**
         * @returns {string} Canonical HTML; type and start are written only when not default.
         */
        toHtml() {
            let attributes = '';
            if (this.#ordered && this.#numberingType !== '1') {
                attributes += ' type="' + this.#numberingType + '"';
            }
            if (this.#ordered && this.#start !== 1) {
                attributes += ' start="' + this.#start + '"';
            }
            const tagName = this.#ordered ? 'ol' : 'ul';
            return '<' + tagName + attributes + '>' + this.#itemList.map(function (item) {
                return item.toHtml();
            }).join('') + '</' + tagName + '>';
        }

        /**
         * @returns {string[]} One line per item, depth first.
         */
        toTextLineList() {
            const lineList = [];
            for (const item of this.#itemList) {
                lineList.push(inlineToText(item.get_inlineList()));
                for (const childList of item.get_childListList()) {
                    for (const lineText of childList.toTextLineList()) {
                        lineList.push(lineText);
                    }
                }
            }
            return lineList;
        }

        /**
         * @returns {string[]} Similarity tokens of all items.
         */
        toSimilarityTokenList() {
            let tokenTextList = [];
            for (const item of this.#itemList) {
                tokenTextList = tokenTextList.concat(inlineSimilarityTokens(item.get_inlineList()));
                for (const childList of item.get_childListList()) {
                    tokenTextList = tokenTextList.concat(childList.toSimilarityTokenList());
                }
            }
            return tokenTextList;
        }
    }

    /**
     * Cell of a table (TRD 6.2).
     */
    class RtcTableCell {
        #inlineList;
        #rowSpan;
        #colSpan;
        #nestedTableList;

        /**
         * @param {RtcInlineItem[]} inlineList - Normalized content of the cell.
         * @param {number} rowSpan - Row span (1 when absent).
         * @param {number} colSpan - Column span (1 when absent).
         * @param {RtcTableBlock[]} nestedTableList - Tables nested in the cell.
         */
        constructor(inlineList, rowSpan, colSpan, nestedTableList) {
            this.#inlineList = inlineList;
            this.#rowSpan = rowSpan;
            this.#colSpan = colSpan;
            this.#nestedTableList = nestedTableList;
        }

        /**
         * @returns {RtcInlineItem[]} Content of the cell.
         */
        get_inlineList() {
            return this.#inlineList;
        }

        /**
         * @param {RtcInlineItem[]} inlineList - New content.
         */
        set_inlineList(inlineList) {
            this.#inlineList = inlineList;
        }

        /**
         * @returns {number} Row span.
         */
        get_rowSpan() {
            return this.#rowSpan;
        }

        /**
         * @param {number} rowSpan - New row span.
         */
        set_rowSpan(rowSpan) {
            this.#rowSpan = rowSpan;
        }

        /**
         * @returns {number} Column span.
         */
        get_colSpan() {
            return this.#colSpan;
        }

        /**
         * @param {number} colSpan - New column span.
         */
        set_colSpan(colSpan) {
            this.#colSpan = colSpan;
        }

        /**
         * @returns {RtcTableBlock[]} Nested tables.
         */
        get_nestedTableList() {
            return this.#nestedTableList;
        }

        /**
         * @param {RtcTableBlock[]} nestedTableList - New nested tables.
         */
        set_nestedTableList(nestedTableList) {
            this.#nestedTableList = nestedTableList;
        }

        /**
         * @returns {Array} Key data of the cell content (spans excluded).
         */
        toContentKeyData() {
            return [inlineKeyData(this.#inlineList), this.#nestedTableList.map(function (table) {
                return table.toKeyData();
            })];
        }

        /**
         * @returns {string} Canonical text of the cell, nested tables included.
         */
        toText() {
            const textList = [inlineToText(this.#inlineList)];
            for (const table of this.#nestedTableList) {
                textList.push(table.toTextLineList().join(' '));
            }
            return textList.filter(function (text) {
                return text !== '';
            }).join(' ');
        }

        /**
         * @returns {string[]} Similarity tokens of the cell.
         */
        toSimilarityTokenList() {
            let tokenTextList = inlineSimilarityTokens(this.#inlineList);
            for (const table of this.#nestedTableList) {
                tokenTextList = tokenTextList.concat(table.toSimilarityTokenList());
            }
            return tokenTextList;
        }

        /**
         * @returns {string} Canonical HTML of the cell.
         */
        toHtml() {
            let attributes = '';
            if (this.#colSpan !== 1) {
                attributes += ' colspan="' + this.#colSpan + '"';
            }
            if (this.#rowSpan !== 1) {
                attributes += ' rowspan="' + this.#rowSpan + '"';
            }
            const nestedHtml = this.#nestedTableList.map(function (table) {
                return table.toHtml();
            }).join('');
            return '<td' + attributes + '>' + inlineToHtml(this.#inlineList) + nestedHtml + '</td>';
        }
    }

    /**
     * Table, with its expanded grid (TRD 106139): every position of the grid refers to the
     * index of the source cell covering it.
     */
    class RtcTableBlock extends RtcBlock {
        #rowList;
        #cellInfoList;
        #gridList;
        #columnCount;

        /**
         * @param {Array<RtcTableCell[]>} rowList - Source rows (<tr>) and their cells.
         */
        constructor(rowList) {
            super('table');
            this.#rowList = rowList;
            this.#cellInfoList = [];
            this.#gridList = [];
            this.#columnCount = 0;
            this.buildGrid();
        }

        /**
         * @returns {Array<RtcTableCell[]>} Source rows.
         */
        get_rowList() {
            return this.#rowList;
        }

        /**
         * @param {Array<RtcTableCell[]>} rowList - New source rows; the grid is rebuilt.
         */
        set_rowList(rowList) {
            this.#rowList = rowList;
            this.buildGrid();
        }

        /**
         * @returns {Array<{cell: RtcTableCell, row: number, col: number}>} Cells with their top-left grid position.
         */
        get_cellInfoList() {
            return this.#cellInfoList;
        }

        /**
         * @returns {Array<number[]>} Expanded grid: cell index at each position (-1 when empty).
         */
        get_gridList() {
            return this.#gridList;
        }

        /**
         * @returns {number} Number of columns of the expanded grid.
         */
        get_columnCount() {
            return this.#columnCount;
        }

        /**
         * Builds the expanded grid from the source rows (TRD 106139).
         */
        buildGrid() {
            const gridList = [];
            const cellInfoList = [];
            for (let rowIndex = 0; rowIndex < this.#rowList.length; rowIndex++) {
                if (!gridList[rowIndex]) {
                    gridList[rowIndex] = [];
                }
                let columnIndex = 0;
                for (const cell of this.#rowList[rowIndex]) {
                    while (gridList[rowIndex][columnIndex] !== undefined) {
                        columnIndex++;
                    }
                    const cellIndex = cellInfoList.length;
                    cellInfoList.push({ cell: cell, row: rowIndex, col: columnIndex });
                    for (let deltaRow = 0; deltaRow < cell.get_rowSpan(); deltaRow++) {
                        if (!gridList[rowIndex + deltaRow]) {
                            gridList[rowIndex + deltaRow] = [];
                        }
                        for (let deltaColumn = 0; deltaColumn < cell.get_colSpan(); deltaColumn++) {
                            gridList[rowIndex + deltaRow][columnIndex + deltaColumn] = cellIndex;
                        }
                    }
                    columnIndex += cell.get_colSpan();
                }
            }
            let columnCount = 0;
            for (const rowCellIndexList of gridList) {
                columnCount = Math.max(columnCount, rowCellIndexList.length);
            }
            for (let rowIndex = 0; rowIndex < gridList.length; rowIndex++) {
                for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
                    if (gridList[rowIndex][columnIndex] === undefined) {
                        gridList[rowIndex][columnIndex] = -1;
                    }
                }
            }
            this.#gridList = gridList;
            this.#cellInfoList = cellInfoList;
            this.#columnCount = columnCount;
        }

        /**
         * Returns the distinct cells of a grid row, from left to right.
         * @param {number} rowIndex - 0-based grid row.
         * @returns {RtcTableCell[]} Cells.
         */
        getRowCellList(rowIndex) {
            const cellList = [];
            let previousIndex = -2;
            for (const cellIndex of this.#gridList[rowIndex]) {
                if (cellIndex >= 0 && cellIndex !== previousIndex) {
                    cellList.push(this.#cellInfoList[cellIndex].cell);
                }
                previousIndex = cellIndex;
            }
            return cellList;
        }

        /**
         * Returns the distinct cells of a grid column, from top to bottom.
         * @param {number} columnIndex - 0-based grid column.
         * @returns {RtcTableCell[]} Cells.
         */
        getColumnCellList(columnIndex) {
            const cellList = [];
            let previousIndex = -2;
            for (const rowCellIndexList of this.#gridList) {
                const cellIndex = rowCellIndexList[columnIndex];
                if (cellIndex >= 0 && cellIndex !== previousIndex) {
                    cellList.push(this.#cellInfoList[cellIndex].cell);
                }
                previousIndex = cellIndex;
            }
            return cellList;
        }

        /**
         * @returns {Array} Key data, based on the expanded grid and the cell contents.
         */
        toKeyData() {
            const cellInfoList = this.#cellInfoList;
            return ['table', this.#gridList, cellInfoList.map(function (info) {
                return info.cell.toContentKeyData();
            })];
        }

        /**
         * @returns {string} Canonical HTML.
         */
        toHtml() {
            return '<table>' + this.#rowList.map(function (rowCellList) {
                return '<tr>' + rowCellList.map(function (cell) {
                    return cell.toHtml();
                }).join('') + '</tr>';
            }).join('') + '</table>';
        }

        /**
         * @returns {string[]} One line per grid row, cells separated by a tabulation.
         */
        toTextLineList() {
            const lineList = [];
            for (let rowIndex = 0; rowIndex < this.#gridList.length; rowIndex++) {
                lineList.push(this.getRowCellList(rowIndex).map(function (cell) {
                    return cell.toText();
                }).join('\t'));
            }
            return lineList;
        }

        /**
         * @returns {string[]} Similarity tokens of all cells.
         */
        toSimilarityTokenList() {
            let tokenTextList = [];
            for (const info of this.#cellInfoList) {
                tokenTextList = tokenTextList.concat(info.cell.toSimilarityTokenList());
            }
            return tokenTextList;
        }
    }

    /**
     * Canonical model of a whole Primary Text: an ordered list of top-level blocks.
     */
    class RtcDocumentModel {
        #blockList;

        /**
         * @param {RtcBlock[]} blockList - Top-level blocks.
         */
        constructor(blockList) {
            this.#blockList = blockList;
        }

        /**
         * @returns {RtcBlock[]} Top-level blocks.
         */
        get_blockList() {
            return this.#blockList;
        }

        /**
         * @param {RtcBlock[]} blockList - New top-level blocks.
         */
        set_blockList(blockList) {
            this.#blockList = blockList;
        }

        /**
         * Tells whether the canonical model is empty (TRD 108586).
         * @returns {boolean} True when there is no block.
         */
        isEmpty() {
            return this.#blockList.length === 0;
        }

        /**
         * @returns {string} Equality key of the whole model (TRD 106062).
         */
        toKey() {
            return JSON.stringify(this.#blockList.map(function (block) {
                return block.toKeyData();
            }));
        }

        /**
         * @returns {string} Canonical HTML (TRD 106104).
         */
        toHtml() {
            return this.#blockList.map(function (block) {
                return block.toHtml();
            }).join('');
        }

        /**
         * @returns {string} Canonical text (TRD 106104).
         */
        toText() {
            let lineList = [];
            for (const block of this.#blockList) {
                lineList = lineList.concat(block.toTextLineList());
            }
            return lineList.join('\n');
        }
    }

    /* ======================================================================
     * Content sinks: receive the content found while walking the DOM
     * ====================================================================== */

    /**
     * Base class of the content sinks used by the DOM walker. A sink receives text runs,
     * linked objects, line breaks, lists and tables, and decides how to store them.
     */
    class RtcContentSink {
        #builder;
        #rawItemList;

        /**
         * @param {RtcModelBuilder} builder - Builder owning the sink (used to build lists and tables).
         */
        constructor(builder) {
            this.#builder = builder;
            this.#rawItemList = [];
        }

        /**
         * @returns {RtcModelBuilder} Owning builder.
         */
        get_builder() {
            return this.#builder;
        }

        /**
         * @param {RtcModelBuilder} builder - New owning builder.
         */
        set_builder(builder) {
            this.#builder = builder;
        }

        /**
         * @returns {RtcInlineItem[]} Raw items collected since the last flush.
         */
        get_rawItemList() {
            return this.#rawItemList;
        }

        /**
         * @param {RtcInlineItem[]} rawItemList - New raw items.
         */
        set_rawItemList(rawItemList) {
            this.#rawItemList = rawItemList;
        }

        /**
         * Receives a text node value.
         * @param {string} text - Raw text.
         * @param {string} mark - Current mark.
         */
        appendText(text, mark) {
            this.#rawItemList.push(new RtcTextRun(normalizeCharacters(text), mark));
        }

        /**
         * Receives a linked object.
         * @param {RtcObjectItem} item - Object.
         */
        appendItem(item) {
            this.#rawItemList.push(item);
        }

        /**
         * Receives a block delimiter (<p>, <br/>, <div>...).
         */
        breakLine() {
            this.#rawItemList.push(new RtcLineBreakItem());
        }

        /**
         * Receives a list element.
         * @param {Element} element - <ul> or <ol>.
         */
        appendList(element) {
            this.breakLine();
            const list = this.#builder.buildList(element);
            this.appendListAsLines(list);
            this.breakLine();
        }

        /**
         * Adds the items of a list as lines (used where a nested list cannot be kept as a list).
         * @param {RtcListBlock} list - List.
         */
        appendListAsLines(list) {
            for (const item of list.get_itemList()) {
                for (const inlineItem of item.get_inlineList()) {
                    this.#rawItemList.push(inlineItem);
                }
                this.breakLine();
                for (const childList of item.get_childListList()) {
                    this.appendListAsLines(childList);
                }
            }
        }

        /**
         * Receives a table element.
         * @param {Element} element - <table>.
         */
        appendTable(element) {
            this.breakLine();
            const tableResult = this.#builder.buildTable(element);
            if (tableResult.captionItemList.length > 0) {
                for (const item of tableResult.captionItemList) {
                    this.#rawItemList.push(item);
                }
                this.breakLine();
            }
            for (const lineText of tableResult.table.toTextLineList()) {
                this.#rawItemList.push(new RtcTextRun(lineText, ''));
                this.breakLine();
            }
        }

        /**
         * Enters a blockquote.
         */
        enterQuote() {
        }

        /**
         * Leaves a blockquote.
         */
        leaveQuote() {
        }
    }

    /**
     * Sink for the top level of a document: produces paragraphs, lists and tables.
     */
    class RtcBlockSink extends RtcContentSink {
        #blockList;
        #quoteDepth;

        /**
         * @param {RtcModelBuilder} builder - Owning builder.
         */
        constructor(builder) {
            super(builder);
            this.#blockList = [];
            this.#quoteDepth = 0;
        }

        /**
         * @returns {RtcBlock[]} Blocks produced so far.
         */
        get_blockList() {
            return this.#blockList;
        }

        /**
         * @param {RtcBlock[]} blockList - New blocks.
         */
        set_blockList(blockList) {
            this.#blockList = blockList;
        }

        /**
         * @returns {number} Current blockquote nesting depth.
         */
        get_quoteDepth() {
            return this.#quoteDepth;
        }

        /**
         * @param {number} quoteDepth - New blockquote nesting depth.
         */
        set_quoteDepth(quoteDepth) {
            this.#quoteDepth = quoteDepth;
        }

        /**
         * Closes the current paragraph; empty paragraphs are dropped (TRD 106117).
         */
        breakLine() {
            const inlineList = normalizeInlineContent(this.get_rawItemList());
            this.set_rawItemList([]);
            if (inlineList.length > 0) {
                this.#blockList.push(new RtcParagraphBlock(inlineList, this.#quoteDepth > 0));
            }
        }

        /**
         * Adds a top-level list.
         * @param {Element} element - <ul> or <ol>.
         */
        appendList(element) {
            this.breakLine();
            const list = this.get_builder().buildList(element);
            if (list.get_itemList().length > 0) {
                this.#blockList.push(list);
            }
        }

        /**
         * Adds a top-level table, preceded by its caption as a paragraph (TRD 106138).
         * @param {Element} element - <table>.
         */
        appendTable(element) {
            this.breakLine();
            const tableResult = this.get_builder().buildTable(element);
            if (tableResult.captionItemList.length > 0) {
                this.#blockList.push(new RtcParagraphBlock(tableResult.captionItemList, this.#quoteDepth > 0));
            }
            if (tableResult.table.get_rowList().length > 0) {
                this.#blockList.push(tableResult.table);
            }
        }

        /**
         * Enters a blockquote: the following paragraphs are quoted.
         */
        enterQuote() {
            this.breakLine();
            this.#quoteDepth++;
        }

        /**
         * Leaves a blockquote.
         */
        leaveQuote() {
            this.breakLine();
            this.#quoteDepth--;
        }

        /**
         * Returns the produced blocks after closing the last paragraph.
         * @returns {RtcBlock[]} Blocks.
         */
        finish() {
            this.breakLine();
            return this.#blockList;
        }
    }

    /**
     * Sink for the content of a list item: text lines and nested lists (TRD 108596).
     */
    class RtcListItemSink extends RtcContentSink {
        #childListList;

        /**
         * @param {RtcModelBuilder} builder - Owning builder.
         */
        constructor(builder) {
            super(builder);
            this.#childListList = [];
        }

        /**
         * @returns {RtcListBlock[]} Nested lists.
         */
        get_childListList() {
            return this.#childListList;
        }

        /**
         * @param {RtcListBlock[]} childListList - New nested lists.
         */
        set_childListList(childListList) {
            this.#childListList = childListList;
        }

        /**
         * Keeps a nested list as a child list of the item.
         * @param {Element} element - <ul> or <ol>.
         */
        appendList(element) {
            const list = this.get_builder().buildList(element);
            if (list.get_itemList().length > 0) {
                this.#childListList.push(list);
            }
        }

        /**
         * Returns the list item.
         * @returns {RtcListItem} Item.
         */
        finish() {
            return new RtcListItem(normalizeInlineContent(this.get_rawItemList()), this.#childListList);
        }
    }

    /**
     * Sink for the content of a table cell: text lines and nested tables (TRD 106140).
     */
    class RtcCellSink extends RtcContentSink {
        #nestedTableList;

        /**
         * @param {RtcModelBuilder} builder - Owning builder.
         */
        constructor(builder) {
            super(builder);
            this.#nestedTableList = [];
        }

        /**
         * @returns {RtcTableBlock[]} Nested tables.
         */
        get_nestedTableList() {
            return this.#nestedTableList;
        }

        /**
         * @param {RtcTableBlock[]} nestedTableList - New nested tables.
         */
        set_nestedTableList(nestedTableList) {
            this.#nestedTableList = nestedTableList;
        }

        /**
         * Keeps a nested table as a table, processed recursively (TRD 106140).
         * @param {Element} element - <table>.
         */
        appendTable(element) {
            const tableResult = this.get_builder().buildTable(element);
            for (const item of tableResult.captionItemList) {
                this.appendItem(item);
            }
            this.breakLine();
            if (tableResult.table.get_rowList().length > 0) {
                this.#nestedTableList.push(tableResult.table);
            }
        }

        /**
         * Returns the cell.
         * @param {number} rowSpan - Row span.
         * @param {number} colSpan - Column span.
         * @returns {RtcTableCell} Cell.
         */
        finish(rowSpan, colSpan) {
            return new RtcTableCell(normalizeInlineContent(this.get_rawItemList()), rowSpan, colSpan, this.#nestedTableList);
        }
    }

    /* ======================================================================
     * Model builder: parsing and normalization (TRD sections 5, 6 and 7)
     * ====================================================================== */

    /**
     * Builds the canonical model of one argument.
     */
    class RtcModelBuilder {
        #warningLog;
        #origin;
        #jQuery;
        #hashFunction;

        /**
         * @param {RtcWarningLog} warningLog - Anomaly log.
         * @param {string} origin - "old" or "new".
         * @param {Function} jQueryFunction - jQuery.
         * @param {function(string): string} hashFunction - SHA-256 function returning a hexadecimal string.
         */
        constructor(warningLog, origin, jQueryFunction, hashFunction) {
            this.#warningLog = warningLog;
            this.#origin = origin;
            this.#jQuery = jQueryFunction;
            this.#hashFunction = hashFunction;
        }

        /**
         * @returns {RtcWarningLog} Anomaly log.
         */
        get_warningLog() {
            return this.#warningLog;
        }

        /**
         * @param {RtcWarningLog} warningLog - New anomaly log.
         */
        set_warningLog(warningLog) {
            this.#warningLog = warningLog;
        }

        /**
         * @returns {string} Argument of origin.
         */
        get_origin() {
            return this.#origin;
        }

        /**
         * @param {string} origin - New argument of origin.
         */
        set_origin(origin) {
            this.#origin = origin;
        }

        /**
         * Builds the canonical model of a rich text argument.
         * @param {string|null} richText - Argument received by richTextCompare.
         * @returns {RtcDocumentModel} Canonical model (empty for null or empty input).
         */
        build(richText) {
            if (richText === null || richText === undefined || typeof richText !== 'string' || richText.trim() === '') {
                return new RtcDocumentModel([]);
            }
            const rootElement = this.parse(richText);
            const sink = new RtcBlockSink(this);
            this.walkChildren(rootElement, sink, '');
            return new RtcDocumentModel(sink.finish());
        }

        /**
         * Cleans and parses the string, then removes the XHTML envelope when present (TRD 106070, 106109).
         * The widget may pass the content with or without its envelope; both forms are normal.
         * @param {string} richText - Raw argument.
         * @returns {Element} Root element of the content to compare.
         */
        parse(richText) {
            let html = richText;
            // Step 1: content escaped as a whole, with or without its envelope. It contains no real
            // tag but starts with an escaped one; a text such as "&lt; 5 bar" is not affected.
            if (html.indexOf('<') < 0 && /^\s*&lt;[a-zA-Z]/.test(html)) {
                html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
                    .replace(/&apos;/g, '\'').replace(/&amp;/g, '&');
                this.#warningLog.add(g_WARNING_CODE.ESCAPED_INPUT, 'The content was received escaped and has been decoded once.', null, this.#origin);
            }
            // Steps 2 and 3: byte order mark and control characters.
            html = html.replace(/^﻿/, '');
            html = html.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
            // Step 4: tolerant HTML parsing; entities are decoded by the parser itself.
            const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
            const body = parsedDocument.body;
            // Step 5: XHTML envelope, removed when present; otherwise the whole fragment is the content.
            const firstElement = body.firstElementChild;
            if (firstElement && firstElement.localName === 'div' && firstElement.getAttribute('xmlns') === g_XHTML_NAMESPACE) {
                return firstElement;
            }
            return body;
        }

        /**
         * Walks the children of a node and sends their content to a sink.
         * @param {Node} node - Parent node.
         * @param {RtcContentSink} sink - Receiving sink.
         * @param {string} mark - Mark inherited from the ancestors ("" when none).
         */
        walkChildren(node, sink, mark) {
            const builder = this;
            this.#jQuery(node).contents().each(function () {
                builder.walkNode(this, sink, mark);
            });
        }

        /**
         * Processes one node according to the normalization rules (TRD sections 5, 6 and 7).
         * @param {Node} node - Node.
         * @param {RtcContentSink} sink - Receiving sink.
         * @param {string} mark - Inherited mark.
         */
        walkNode(node, sink, mark) {
            if (node.nodeType === Node.TEXT_NODE) {
                sink.appendText(node.nodeValue, mark);
                return;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return; // Comments and processing instructions are removed (TRD 106116).
            }
            const name = node.localName;
            if (g_removedTagList.includes(name)) {
                this.#warningLog.add(g_WARNING_CODE.REMOVED_ELEMENT, 'Element <' + name + '> removed with its content.', name, this.#origin);
                return;
            }
            if (name === 'br') {
                sink.breakLine();
                return;
            }
            if (name === 'ul' || name === 'ol') {
                sink.appendList(node);
                return;
            }
            if (name === 'table') {
                sink.appendTable(node);
                return;
            }
            if (name === 'blockquote') {
                sink.enterQuote();
                this.walkChildren(node, sink, mark);
                sink.leaveQuote();
                return;
            }
            if (g_blockTagList.includes(name) || g_tablePartTagList.includes(name) || g_unexpectedBlockTagList.includes(name)) {
                if (g_unexpectedBlockTagList.includes(name)) {
                    this.logUnexpected(name);
                }
                sink.breakLine();
                this.walkChildren(node, sink, mark);
                sink.breakLine();
                return;
            }
            if (g_MARK_BY_TAG[name] !== undefined) {
                this.walkChildren(node, sink, g_MARK_BY_TAG[name]);
                return;
            }
            if (name === 'img') {
                sink.appendItem(this.buildImage(node));
                return;
            }
            if (name === 'a' && node.hasAttribute('href')) {
                sink.appendItem(new RtcLinkItem(this.#jQuery(node).attr('href').trim(), this.extractText(node)));
                return;
            }
            if (name === 'span' && this.isEmbedded(node)) {
                sink.appendItem(new RtcEmbeddedItem());
                return;
            }
            if (g_decorativeTagList.includes(name) || name === 'a' || name.includes(':')) {
                // Decorative elements, anchors without href and Word residues (o:p, w:*...) are flattened.
                this.walkChildren(node, sink, mark);
                return;
            }
            this.logUnexpected(name);
            this.walkChildren(node, sink, mark);
        }

        /**
         * Logs an unexpected element (TRD 106127).
         * @param {string} name - Element name.
         */
        logUnexpected(name) {
            this.#warningLog.add(g_WARNING_CODE.UNEXPECTED_ELEMENT, 'Unexpected element <' + name + '> ignored; its text is kept.', name, this.#origin);
        }

        /**
         * Tells whether a span is the container of an embedded ERM artifact (TRD 106154).
         * The canonical marker is also recognized, so that normalization is idempotent.
         * @param {Element} element - <span>.
         * @returns {boolean} True for an embedded artifact.
         */
        isEmbedded(element) {
            const className = element.getAttribute('class') || '';
            return className.split(/\s+/).includes(g_EMBEDDED_CLASS_NAME)
                || element.getAttribute(g_EMBEDDED_MARKER_ATTRIBUTE) === 'embedded';
        }

        /**
         * Builds the canonical image img(src, alt); base64 sources are hashed (TRD 106151).
         * @param {Element} element - <img>.
         * @returns {RtcImageItem} Image.
         */
        buildImage(element) {
            let src = (this.#jQuery(element).attr('src') || '').trim();
            if (src.startsWith('data:image/')) {
                src = 'sha256:' + this.#hashFunction(src).toLowerCase();
            }
            const alt = normalizeCharacters(this.#jQuery(element).attr('alt') || '').replace(/\s+/g, ' ').trim();
            return new RtcImageItem(src, alt);
        }

        /**
         * Returns the normalized text of an element (used for link labels, TRD 106161).
         * @param {Element} element - Element.
         * @returns {string} Text.
         */
        extractText(element) {
            return normalizeCharacters(element.textContent || '').replace(/\s+/g, ' ').trim();
        }

        /**
         * Builds a list and its items (TRD 6.1).
         * @param {Element} element - <ul> or <ol>.
         * @returns {RtcListBlock} List.
         */
        buildList(element) {
            const ordered = element.localName === 'ol';
            let numberingType = '1';
            let start = 1;
            if (ordered) {
                const typeValue = (element.getAttribute('type') || '1').trim();
                numberingType = ['1', 'a', 'A', 'i', 'I'].includes(typeValue) ? typeValue : '1';
                const startValue = parseInt(element.getAttribute('start') || '1', 10);
                start = isNaN(startValue) ? 1 : startValue;
            }
            const itemList = [];
            const builder = this;
            this.#jQuery(element).contents().each(function () {
                const child = this;
                if (child.nodeType === Node.ELEMENT_NODE && child.localName === 'li') {
                    const sink = new RtcListItemSink(builder);
                    builder.walkChildren(child, sink, '');
                    itemList.push(sink.finish());
                } else if (child.nodeType === Node.ELEMENT_NODE && (child.localName === 'ul' || child.localName === 'ol')) {
                    // A list placed directly in a list belongs to the previous item.
                    const nestedList = builder.buildList(child);
                    if (itemList.length === 0) {
                        itemList.push(new RtcListItem([], []));
                    }
                    itemList[itemList.length - 1].get_childListList().push(nestedList);
                } else if (child.nodeType === Node.ELEMENT_NODE || (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim() !== '')) {
                    // Content outside <li>: kept as an item of its own.
                    const sink = new RtcListItemSink(builder);
                    builder.walkNode(child, sink, '');
                    const item = sink.finish();
                    if (item.get_inlineList().length > 0 || item.get_childListList().length > 0) {
                        itemList.push(item);
                    }
                }
            });
            return new RtcListBlock(ordered, numberingType, start, itemList);
        }

        /**
         * Builds a table (TRD 6.2): sections flattened, th treated as td, caption extracted.
         * @param {Element} element - <table>.
         * @returns {{table: RtcTableBlock, captionItemList: RtcInlineItem[]}} Table and caption content.
         */
        buildTable(element) {
            const rowList = [];
            let captionItemList = [];
            const builder = this;
            const jQueryFunction = this.#jQuery;
            /**
             * Processes the rows found directly in a table or table section.
             * @param {Element} container - <table>, <thead>, <tbody> or <tfoot>.
             */
            function collectRows(container) {
                jQueryFunction(container).children().each(function () {
                    const child = this;
                    const name = child.localName;
                    if (name === 'tr') {
                        const cellList = [];
                        jQueryFunction(child).children().each(function () {
                            if (this.localName === 'td' || this.localName === 'th') {
                                cellList.push(builder.buildCell(this));
                            }
                        });
                        rowList.push(cellList);
                    } else if (name === 'thead' || name === 'tbody' || name === 'tfoot') {
                        collectRows(child);
                    } else if (name === 'caption') {
                        const sink = new RtcCellSink(builder);
                        builder.walkChildren(child, sink, '');
                        captionItemList = normalizeLine(sink.finish(1, 1).get_inlineList().map(function (item) {
                            return item.get_kind() === 'lineBreak' ? new RtcTextRun(' ', '') : item;
                        }));
                    }
                });
            }
            collectRows(element);
            return { table: new RtcTableBlock(rowList), captionItemList: captionItemList };
        }

        /**
         * Builds a table cell; colspan and rowspan default to 1 (TRD 106136).
         * @param {Element} element - <td> or <th>.
         * @returns {RtcTableCell} Cell.
         */
        buildCell(element) {
            const rowSpan = Math.max(1, parseInt(element.getAttribute('rowspan') || '1', 10) || 1);
            const colSpan = Math.max(1, parseInt(element.getAttribute('colspan') || '1', 10) || 1);
            const sink = new RtcCellSink(this);
            this.walkChildren(element, sink, '');
            return sink.finish(rowSpan, colSpan);
        }
    }

    /* ======================================================================
     * Comparator (TRD section 8)
     * ====================================================================== */

    /**
     * Compares two canonical models and produces the "differences" array.
     */
    class RtcComparator {
        #differenceList;

        /**
         * Creates a comparator.
         */
        constructor() {
            this.#differenceList = [];
        }

        /**
         * @returns {Object[]} Differences produced by the last comparison.
         */
        get_differenceList() {
            return this.#differenceList;
        }

        /**
         * @param {Object[]} differenceList - New differences.
         */
        set_differenceList(differenceList) {
            this.#differenceList = differenceList;
        }

        /**
         * Compares two documents (TRD 106167): strict LCS first, then similarity pairing,
         * merges and splits between the strictly matched blocks.
         * @param {RtcDocumentModel} oldModel - Canonical model of oldRichText.
         * @param {RtcDocumentModel} newModel - Canonical model of newRichText.
         * @returns {Object[]} Differences, in reading order of newRichText (TRD 106183).
         */
        compareDocuments(oldModel, newModel) {
            this.#differenceList = [];
            const oldBlockList = oldModel.get_blockList();
            const newBlockList = newModel.get_blockList();
            const oldKeyList = oldBlockList.map(function (block) {
                return block.toKey();
            });
            const newKeyList = newBlockList.map(function (block) {
                return block.toKey();
            });
            const anchorList = longestCommonSubsequence(oldKeyList, newKeyList, function (keyA, keyB) {
                return keyA === keyB;
            });
            anchorList.push([oldBlockList.length, newBlockList.length]);
            let oldStart = 0;
            let newStart = 0;
            for (const [anchorOldIndex, anchorNewIndex] of anchorList) {
                this.compareSegment(oldBlockList, oldStart, anchorOldIndex, newBlockList, newStart, anchorNewIndex);
                oldStart = anchorOldIndex + 1;
                newStart = anchorNewIndex + 1;
            }
            return this.#differenceList;
        }

        /**
         * Aligns the blocks of a segment located between two strictly matched blocks,
         * with pairing, merge (T5, L5) and split (T6, L6) operations (TRD 106169, 108594).
         * @param {RtcBlock[]} oldBlockList - Old blocks.
         * @param {number} oldStart - First old index of the segment.
         * @param {number} oldEnd - End (excluded) old index.
         * @param {RtcBlock[]} newBlockList - New blocks.
         * @param {number} newStart - First new index of the segment.
         * @param {number} newEnd - End (excluded) new index.
         */
        compareSegment(oldBlockList, oldStart, oldEnd, newBlockList, newStart, newEnd) {
            const segmentOldList = oldBlockList.slice(oldStart, oldEnd);
            const segmentNewList = newBlockList.slice(newStart, newEnd);
            const countA = segmentOldList.length;
            const countB = segmentNewList.length;
            if (countA === 0 && countB === 0) {
                return;
            }
            const oldSegmentTokenList = segmentOldList.map(function (block) {
                return block.toSimilarityTokenList();
            });
            const newSegmentTokenList = segmentNewList.map(function (block) {
                return block.toSimilarityTokenList();
            });
            const kindCountA = this.countKinds(segmentOldList);
            const kindCountB = this.countKinds(segmentNewList);
            /**
             * Returns the weight of pairing A[i] with B[j], or -1 when not allowed.
             * @param {number} i - Index in A.
             * @param {number} j - Index in B.
             * @returns {number} Weight.
             */
            function pairWeight(i, j) {
                const kind = segmentOldList[i].get_kind();
                if (kind !== segmentNewList[j].get_kind()) {
                    return -1;
                }
                const similarity = diceSimilarity(oldSegmentTokenList[i], newSegmentTokenList[j]);
                if (similarity >= g_SIMILARITY_THRESHOLD) {
                    return similarity;
                }
                // A list or a table alone of its kind on both sides is paired anyway, so that
                // its structural changes are reported instead of a removal and an addition.
                if (kind !== 'text' && kindCountA[kind] === 1 && kindCountB[kind] === 1) {
                    return Math.max(similarity, 0.001);
                }
                return -1;
            }
            /**
             * Returns the weight of merging A[i] and A[i+1] into B[j], or -1 when not allowed.
             * @param {number} i - Index in A.
             * @param {number} j - Index in B.
             * @returns {number} Weight.
             */
            function mergeWeight(i, j) {
                return fusionWeight(segmentOldList[i], segmentOldList[i + 1], segmentNewList[j],
                    oldSegmentTokenList[i], oldSegmentTokenList[i + 1], newSegmentTokenList[j]);
            }
            /**
             * Returns the weight of splitting A[i] into B[j] and B[j+1], or -1 when not allowed.
             * @param {number} i - Index in A.
             * @param {number} j - Index in B.
             * @returns {number} Weight.
             */
            function splitWeight(i, j) {
                return fusionWeight(segmentNewList[j], segmentNewList[j + 1], segmentOldList[i],
                    newSegmentTokenList[j], newSegmentTokenList[j + 1], oldSegmentTokenList[i]);
            }
            /**
             * Weight of the fusion of two consecutive blocks into one block (T5, T6, L5, L6).
             * @param {RtcBlock} first - First block of the pair.
             * @param {RtcBlock} second - Second block of the pair.
             * @param {RtcBlock} single - Block on the other side.
             * @param {string[]} firstTokenList - Tokens of the first block.
             * @param {string[]} secondTokenList - Tokens of the second block.
             * @param {string[]} singleTokenList - Tokens of the single block.
             * @returns {number} Weight, or -1 when not a fusion.
             */
            function fusionWeight(first, second, single, firstTokenList, secondTokenList, singleTokenList) {
                const kind = single.get_kind();
                if (kind === 'table' || first.get_kind() !== kind || second.get_kind() !== kind) {
                    return -1;
                }
                const joinedSimilarity = diceSimilarity(firstTokenList.concat(secondTokenList), singleTokenList);
                const bestSingle = Math.max(diceSimilarity(firstTokenList, singleTokenList), diceSimilarity(secondTokenList, singleTokenList));
                if (joinedSimilarity >= g_SIMILARITY_THRESHOLD && joinedSimilarity > bestSingle) {
                    return joinedSimilarity;
                }
                return -1;
            }
            const width = countB + 1;
            const scoreList = new Float64Array((countA + 1) * width);
            const choiceList = new Array((countA + 1) * width).fill('');
            for (let i = countA; i >= 0; i--) {
                for (let j = countB; j >= 0; j--) {
                    if (i === countA && j === countB) {
                        continue;
                    }
                    let best = -Infinity;
                    let choice = '';
                    if (i < countA && j < countB) {
                        const weight = pairWeight(i, j);
                        if (weight >= 0 && weight + scoreList[(i + 1) * width + j + 1] > best) {
                            best = weight + scoreList[(i + 1) * width + j + 1];
                            choice = 'pair';
                        }
                    }
                    if (i + 1 < countA && j < countB) {
                        const weight = mergeWeight(i, j);
                        if (weight >= 0 && weight + scoreList[(i + 2) * width + j + 1] > best) {
                            best = weight + scoreList[(i + 2) * width + j + 1];
                            choice = 'merge';
                        }
                    }
                    if (i < countA && j + 1 < countB) {
                        const weight = splitWeight(i, j);
                        if (weight >= 0 && weight + scoreList[(i + 1) * width + j + 2] > best) {
                            best = weight + scoreList[(i + 1) * width + j + 2];
                            choice = 'split';
                        }
                    }
                    if (i < countA && scoreList[(i + 1) * width + j] > best) {
                        best = scoreList[(i + 1) * width + j];
                        choice = 'removeOld';
                    }
                    if (j < countB && scoreList[i * width + j + 1] > best) {
                        best = scoreList[i * width + j + 1];
                        choice = 'addNew';
                    }
                    scoreList[i * width + j] = best;
                    choiceList[i * width + j] = choice;
                }
            }
            let i = 0;
            let j = 0;
            while (i < countA || j < countB) {
                const choice = choiceList[i * width + j];
                const positionA = oldStart + i + 1;
                const positionB = newStart + j + 1;
                if (choice === 'pair') {
                    this.compareBlockPair(segmentOldList[i], segmentNewList[j], positionB);
                    i++;
                    j++;
                } else if (choice === 'merge') {
                    this.reportFusion(segmentOldList[i].get_kind() === 'text' ? 'paragraph_merged' : 'list_merged', positionB,
                        segmentOldList[i].toTextLineList().concat(segmentOldList[i + 1].toTextLineList()).join('\n'),
                        segmentNewList[j].toTextLineList().join('\n'));
                    i += 2;
                    j++;
                } else if (choice === 'split') {
                    this.reportFusion(segmentOldList[i].get_kind() === 'text' ? 'paragraph_split' : 'list_split', positionB,
                        segmentOldList[i].toTextLineList().join('\n'),
                        segmentNewList[j].toTextLineList().concat(segmentNewList[j + 1].toTextLineList()).join('\n'));
                    i++;
                    j += 2;
                } else if (choice === 'removeOld') {
                    this.reportWholeBlock(segmentOldList[i], positionA, false);
                    i++;
                } else {
                    this.reportWholeBlock(segmentNewList[j], positionB, true);
                    j++;
                }
            }
        }

        /**
         * Counts the blocks of each kind.
         * @param {RtcBlock[]} blockList - Blocks.
         * @returns {Object<string, number>} Count by kind.
         */
        countKinds(blockList) {
            const countByKind = { text: 0, list: 0, table: 0 };
            for (const block of blockList) {
                countByKind[block.get_kind()]++;
            }
            return countByKind;
        }

        /**
         * Reports a merge or a split of blocks.
         * @param {string} type - paragraph_merged, paragraph_split, list_merged or list_split.
         * @param {number} position - Position in newRichText.
         * @param {string} oldText - Old text.
         * @param {string} newText - New text.
         */
        reportFusion(type, position, oldText, newText) {
            this.#differenceList.push(makeDifference(type, { position: position }, oldText, newText, null));
        }

        /**
         * Reports a block added or removed as a whole. A paragraph holding only linked
         * objects is reported object by object (image_added, link_removed...).
         * @param {RtcBlock} block - Block.
         * @param {number} position - Position of the block in its own version.
         * @param {boolean} added - True for an addition, false for a removal.
         */
        reportWholeBlock(block, position, added) {
            const suffix = added ? '_added' : '_removed';
            const text = block.toTextLineList().join('\n');
            if (block.get_kind() === 'text') {
                const tokenized = tokenizeInline(block.get_inlineList());
                if (tokenized.textTokenList.length === 0 && tokenized.objectList.length > 0) {
                    for (const objectItem of tokenized.objectList) {
                        this.#differenceList.push(this.objectDifference(objectItem, { position: position }, added));
                    }
                    return;
                }
                this.#differenceList.push(makeDifference('paragraph' + suffix, { position: position },
                    added ? '' : text, added ? text : '', null));
                return;
            }
            this.#differenceList.push(makeDifference(block.get_kind() + suffix, { position: position },
                added ? '' : text, added ? text : '', null));
        }

        /**
         * Compares two paired blocks of the same kind.
         * @param {RtcBlock} oldBlock - Old block.
         * @param {RtcBlock} newBlock - New block.
         * @param {number} position - Position in newRichText.
         */
        compareBlockPair(oldBlock, newBlock, position) {
            if (oldBlock.toKey() === newBlock.toKey()) {
                return;
            }
            if (oldBlock.get_kind() === 'text') {
                this.compareParagraphs(oldBlock, newBlock, position);
            } else if (oldBlock.get_kind() === 'list') {
                this.#differenceList.push(...this.compareLists(oldBlock, newBlock, position));
            } else {
                this.#differenceList.push(...this.compareTables(oldBlock, newBlock, position));
            }
        }

        /**
         * Compares two paired paragraphs (T1 to T3, T7).
         * @param {RtcParagraphBlock} oldBlock - Old paragraph.
         * @param {RtcParagraphBlock} newBlock - New paragraph.
         * @param {number} position - Position in newRichText.
         */
        compareParagraphs(oldBlock, newBlock, position) {
            const location = { position: position };
            const result = this.compareInline(oldBlock.get_inlineList(), newBlock.get_inlineList(), location);
            const oldText = inlineToText(oldBlock.get_inlineList());
            const newText = inlineToText(newBlock.get_inlineList());
            if (oldBlock.get_quoted() !== newBlock.get_quoted()) {
                this.#differenceList.push(makeDifference('blockquote_converted', location, oldText, newText,
                    result.changeList.length > 0 ? result.changeList : null));
            } else if (result.changeList.length > 0) {
                this.#differenceList.push(makeDifference('paragraph_modified', location, oldText, newText, result.changeList));
            }
            this.#differenceList.push(...result.objectDifferenceList);
        }

        /**
         * Compares two inline contents: word diff of the text and comparison of the objects.
         * @param {RtcInlineItem[]} oldItemList - Old content.
         * @param {RtcInlineItem[]} newItemList - New content.
         * @param {Object} location - Location of the container, used for object differences.
         * @returns {{changeList: Object[], objectDifferenceList: Object[]}} Text changes and object differences.
         */
        compareInline(oldItemList, newItemList, location) {
            const oldTokenized = tokenizeInline(oldItemList);
            const newTokenized = tokenizeInline(newItemList);
            return {
                changeList: this.diffTokens(oldTokenized.textTokenList, newTokenized.textTokenList),
                objectDifferenceList: this.compareObjects(oldTokenized.objectList, newTokenized.objectList, location)
            };
        }

        /**
         * Word-level diff (TRD 8.3): the token texts are compared first; equal tokens with
         * different marks produce mark_added or mark_removed (TRD 106178).
         * @param {Array<{text: string, mark: string}>} oldTokenList - Old tokens.
         * @param {Array<{text: string, mark: string}>} newTokenList - New tokens.
         * @returns {Object[]} Changes (TRD 108589).
         */
        diffTokens(oldTokenList, newTokenList) {
            const changeList = [];
            const pairList = longestCommonSubsequence(oldTokenList, newTokenList, function (tokenA, tokenB) {
                return tokenA.text === tokenB.text;
            });
            pairList.push([oldTokenList.length, newTokenList.length]);
            let oldIndex = 0;
            let newIndex = 0;
            /**
             * Joins the texts of a slice of tokens.
             * @param {Array<{text: string}>} tokenList - Tokens.
             * @returns {string} Text.
             */
            function joinTokens(tokenList) {
                return tokenList.map(function (token) {
                    return token.text;
                }).join(' ');
            }
            for (const [pairOldIndex, pairNewIndex] of pairList) {
                const removedList = oldTokenList.slice(oldIndex, pairOldIndex);
                const addedList = newTokenList.slice(newIndex, pairNewIndex);
                if (removedList.length > 0 && addedList.length > 0) {
                    changeList.push({ type: 'token_replaced', old: joinTokens(removedList), new: joinTokens(addedList), offset: oldIndex });
                } else if (removedList.length > 0) {
                    changeList.push({ type: 'token_removed', old: joinTokens(removedList), new: '', offset: oldIndex });
                } else if (addedList.length > 0) {
                    changeList.push({ type: 'token_added', old: '', new: joinTokens(addedList), offset: newIndex });
                }
                if (pairOldIndex < oldTokenList.length) {
                    const oldToken = oldTokenList[pairOldIndex];
                    const newToken = newTokenList[pairNewIndex];
                    if (oldToken.mark !== newToken.mark) {
                        if (oldToken.mark) {
                            changeList.push({ type: 'mark_removed', old: oldToken.text, new: newToken.text, offset: pairOldIndex, mark: oldToken.mark });
                        }
                        if (newToken.mark) {
                            changeList.push({ type: 'mark_added', old: oldToken.text, new: newToken.text, offset: pairNewIndex, mark: newToken.mark });
                        }
                    }
                }
                oldIndex = pairOldIndex + 1;
                newIndex = pairNewIndex + 1;
            }
            return changeList;
        }

        /**
         * Compares the linked objects of two paired containers (TRD 7 and 8.2).
         * Identical objects are matched first; the others are paired by kind, in order.
         * @param {RtcObjectItem[]} oldObjectList - Old objects.
         * @param {RtcObjectItem[]} newObjectList - New objects.
         * @param {Object} location - Location of the container.
         * @returns {Object[]} Object differences.
         */
        compareObjects(oldObjectList, newObjectList, location) {
            const differenceList = [];
            const pairList = longestCommonSubsequence(oldObjectList, newObjectList, function (objectA, objectB) {
                return objectA.toKey() === objectB.toKey();
            });
            pairList.push([oldObjectList.length, newObjectList.length]);
            let oldIndex = 0;
            let newIndex = 0;
            for (const [pairOldIndex, pairNewIndex] of pairList) {
                const removedList = oldObjectList.slice(oldIndex, pairOldIndex);
                const addedList = newObjectList.slice(newIndex, pairNewIndex);
                const usedAddedSet = new Set();
                for (const removed of removedList) {
                    let partnerIndex = -1;
                    for (let k = 0; k < addedList.length; k++) {
                        if (!usedAddedSet.has(k) && addedList[k].get_kind() === removed.get_kind()) {
                            partnerIndex = k;
                            break;
                        }
                    }
                    if (partnerIndex < 0) {
                        differenceList.push(this.objectDifference(removed, location, false));
                        continue;
                    }
                    usedAddedSet.add(partnerIndex);
                    const added = addedList[partnerIndex];
                    const changeList = [];
                    const oldAttributeList = removed.get_attributeList();
                    const newAttributeList = added.get_attributeList();
                    for (let k = 0; k < oldAttributeList.length; k++) {
                        if (oldAttributeList[k][1] !== newAttributeList[k][1]) {
                            changeList.push({ type: 'attr_changed', old: oldAttributeList[k][1], new: newAttributeList[k][1], offset: 0, attr: oldAttributeList[k][0] });
                        }
                    }
                    if (changeList.length > 0) {
                        differenceList.push(makeDifference(removed.get_kind() + '_modified', location, removed.toCanonical(), added.toCanonical(), changeList));
                    }
                }
                for (let k = 0; k < addedList.length; k++) {
                    if (!usedAddedSet.has(k)) {
                        differenceList.push(this.objectDifference(addedList[k], location, true));
                    }
                }
                oldIndex = pairOldIndex + 1;
                newIndex = pairNewIndex + 1;
            }
            return differenceList;
        }

        /**
         * Builds the difference of an object added or removed.
         * @param {RtcObjectItem} objectItem - Object.
         * @param {Object} location - Location.
         * @param {boolean} added - True for an addition.
         * @returns {Object} Difference.
         */
        objectDifference(objectItem, location, added) {
            return makeDifference(objectItem.get_kind() + (added ? '_added' : '_removed'), location,
                added ? '' : objectItem.toCanonical(), added ? objectItem.toCanonical() : '', null);
        }

        /**
         * Flattens a list into its items, all levels included (TRD 106171).
         * @param {RtcListBlock} list - List.
         * @param {number[]} parentPathList - Path of the parent item ([] for the top level).
         * @param {Object[]} resultList - Receives the flattened items.
         * @returns {Object[]} Items: {item, path, level, ordered, list, tokenList}.
         */
        flattenList(list, parentPathList, resultList) {
            let index = 0;
            for (const item of list.get_itemList()) {
                index++;
                const pathList = parentPathList.concat([index]);
                resultList.push({
                    item: item,
                    path: pathList,
                    level: pathList.length,
                    ordered: list.get_ordered(),
                    tokenList: inlineSimilarityTokens(item.get_inlineList()),
                    contentKey: JSON.stringify(inlineKeyData(item.get_inlineList()))
                });
                for (const childList of item.get_childListList()) {
                    this.flattenList(childList, pathList, resultList);
                }
            }
            return resultList;
        }

        /**
         * Compares two paired lists (TRD 106171, L1 to L10).
         * @param {RtcListBlock} oldList - Old list.
         * @param {RtcListBlock} newList - New list.
         * @param {number} position - Position in newRichText.
         * @returns {Object[]} Differences, ordered by item path.
         */
        compareLists(oldList, newList, position) {
            const differenceList = [];
            const oldItemList = this.flattenList(oldList, [], []);
            const newItemList = this.flattenList(newList, [], []);
            // Pairing by content similarity, best pairs first.
            const candidateList = [];
            for (let i = 0; i < oldItemList.length; i++) {
                for (let j = 0; j < newItemList.length; j++) {
                    const similarity = oldItemList[i].contentKey === newItemList[j].contentKey
                        ? 1 : diceSimilarity(oldItemList[i].tokenList, newItemList[j].tokenList);
                    if (similarity >= g_SIMILARITY_THRESHOLD) {
                        candidateList.push({ i: i, j: j, similarity: similarity });
                    }
                }
            }
            candidateList.sort(function (a, b) {
                return (b.similarity - a.similarity) || (Math.abs(a.i - a.j) - Math.abs(b.i - b.j)) || (a.i - b.i) || (a.j - b.j);
            });
            const partnerOfOld = new Map();
            const partnerOfNew = new Map();
            for (const candidate of candidateList) {
                if (!partnerOfOld.has(candidate.i) && !partnerOfNew.has(candidate.j)) {
                    partnerOfOld.set(candidate.i, candidate.j);
                    partnerOfNew.set(candidate.j, candidate.i);
                }
            }
            // List attributes (L7 to L9): top level, then the nested lists of paired items.
            this.compareListAttributes(oldList, newList, [], position, differenceList);
            for (const [oldIndex, newIndex] of partnerOfOld) {
                const oldChildListList = oldItemList[oldIndex].item.get_childListList();
                const newChildListList = newItemList[newIndex].item.get_childListList();
                const count = Math.min(oldChildListList.length, newChildListList.length);
                for (let k = 0; k < count; k++) {
                    this.compareListAttributes(oldChildListList[k], newChildListList[k], newItemList[newIndex].path, position, differenceList);
                }
            }
            // Removed and added items (L2).
            for (let i = 0; i < oldItemList.length; i++) {
                if (!partnerOfOld.has(i)) {
                    differenceList.push(makeDifference('list_item_removed', { position: position, itemPath: oldItemList[i].path },
                        inlineToText(oldItemList[i].item.get_inlineList()), '', null));
                }
            }
            for (let j = 0; j < newItemList.length; j++) {
                if (!partnerOfNew.has(j)) {
                    differenceList.push(makeDifference('list_item_added', { position: position, itemPath: newItemList[j].path },
                        '', inlineToText(newItemList[j].item.get_inlineList()), null));
                }
            }
            // Moves (L3): paired items outside the longest order-preserving subsequence,
            // only when the item belongs to an ordered list in the new version.
            const pairedNewIndexList = [];
            for (let j = 0; j < newItemList.length; j++) {
                if (partnerOfNew.has(j)) {
                    pairedNewIndexList.push(j);
                }
            }
            const keptSet = longestIncreasingSubsequence(pairedNewIndexList.map(function (j) {
                return partnerOfNew.get(j);
            }));
            for (let k = 0; k < pairedNewIndexList.length; k++) {
                const j = pairedNewIndexList[k];
                const i = partnerOfNew.get(j);
                const oldInfo = oldItemList[i];
                const newInfo = newItemList[j];
                const oldText = inlineToText(oldInfo.item.get_inlineList());
                const newText = inlineToText(newInfo.item.get_inlineList());
                if (!keptSet.has(k) && newInfo.ordered) {
                    differenceList.push(makeDifference('list_item_moved', { position: position, itemPath: newInfo.path, oldItemPath: oldInfo.path },
                        oldText, newText, null));
                }
                if (oldInfo.level !== newInfo.level) {
                    differenceList.push(makeDifference('list_item_level_changed', { position: position, itemPath: newInfo.path, oldItemPath: oldInfo.path },
                        oldText, newText, null));
                }
                if (oldInfo.contentKey !== newInfo.contentKey) {
                    const location = { position: position, itemPath: newInfo.path };
                    const result = this.compareInline(oldInfo.item.get_inlineList(), newInfo.item.get_inlineList(), location);
                    if (result.changeList.length > 0) {
                        differenceList.push(makeDifference('list_item_modified', location, oldText, newText, result.changeList));
                    }
                    for (const objectDifference of result.objectDifferenceList) {
                        differenceList.push(objectDifference);
                    }
                }
            }
            // Order within the block: by item path (TRD 106183).
            return differenceList.map(function (difference, index) {
                return { difference: difference, index: index };
            }).sort(function (a, b) {
                return comparePaths(a.difference.itemPath || [], b.difference.itemPath || []) || (a.index - b.index);
            }).map(function (wrapper) {
                return wrapper.difference;
            });
        }

        /**
         * Compares the attributes of two paired lists (L7, L8, L9).
         * @param {RtcListBlock} oldList - Old list.
         * @param {RtcListBlock} newList - New list.
         * @param {number[]} ownerPathList - Path of the item owning the list in the new version ([] for the top level).
         * @param {number} position - Position in newRichText.
         * @param {Object[]} differenceList - Receives the differences.
         */
        compareListAttributes(oldList, newList, ownerPathList, position, differenceList) {
            const location = { position: position, itemPath: ownerPathList };
            if (oldList.get_ordered() !== newList.get_ordered()) {
                differenceList.push(makeDifference('list_type_changed', location,
                    oldList.get_ordered() ? 'ol' : 'ul', newList.get_ordered() ? 'ol' : 'ul', null));
                return;
            }
            if (!newList.get_ordered()) {
                return;
            }
            if (oldList.get_numberingType() !== newList.get_numberingType()) {
                differenceList.push(makeDifference('list_numbering_style_changed', location,
                    oldList.get_numberingType(), newList.get_numberingType(), null));
            }
            if (oldList.get_start() !== newList.get_start()) {
                differenceList.push(makeDifference('list_start_changed', location,
                    String(oldList.get_start()), String(newList.get_start()), null));
            }
        }

        /**
         * Compares two paired tables on their expanded grids (TRD 106172, 106173, B2 to B6).
         * @param {RtcTableBlock} oldTable - Old table.
         * @param {RtcTableBlock} newTable - New table.
         * @param {number} position - Position in newRichText.
         * @returns {Object[]} Differences, ordered by row then column.
         */
        compareTables(oldTable, newTable, position) {
            const differenceList = [];
            const oldGridList = oldTable.get_gridList();
            const newGridList = newTable.get_gridList();
            /**
             * Returns the similarity tokens of a list of cells.
             * @param {RtcTableCell[]} cellList - Cells.
             * @returns {string[]} Tokens.
             */
            function cellTokens(cellList) {
                let tokenTextList = [];
                for (const cell of cellList) {
                    tokenTextList = tokenTextList.concat(cell.toSimilarityTokenList());
                }
                return tokenTextList;
            }
            /**
             * Returns the text of a list of cells, separated by tabulations.
             * @param {RtcTableCell[]} cellList - Cells.
             * @returns {string} Text.
             */
            function cellText(cellList) {
                return cellList.map(function (cell) {
                    return cell.toText();
                }).join('\t');
            }
            const oldRowTokenList = [];
            for (let r = 0; r < oldGridList.length; r++) {
                oldRowTokenList.push(cellTokens(oldTable.getRowCellList(r)));
            }
            const newRowTokenList = [];
            for (let r = 0; r < newGridList.length; r++) {
                newRowTokenList.push(cellTokens(newTable.getRowCellList(r)));
            }
            const rowPairList = alignBySimilarity(oldGridList.length, newGridList.length, function (i, j) {
                return diceSimilarity(oldRowTokenList[i], newRowTokenList[j]);
            });
            const oldColumnTokenList = [];
            for (let c = 0; c < oldTable.get_columnCount(); c++) {
                oldColumnTokenList.push(cellTokens(oldTable.getColumnCellList(c)));
            }
            const newColumnTokenList = [];
            for (let c = 0; c < newTable.get_columnCount(); c++) {
                newColumnTokenList.push(cellTokens(newTable.getColumnCellList(c)));
            }
            const columnPairList = alignBySimilarity(oldTable.get_columnCount(), newTable.get_columnCount(), function (i, j) {
                return diceSimilarity(oldColumnTokenList[i], newColumnTokenList[j]);
            });
            const newRowOfOld = new Map(rowPairList);
            const newRowSet = new Set(rowPairList.map(function ([, pairNewIndex]) {
                return pairNewIndex;
            }));
            const newColumnOfOld = new Map(columnPairList);
            const newColumnSet = new Set(columnPairList.map(function ([, pairNewIndex]) {
                return pairNewIndex;
            }));
            // Rows and columns added or removed (B2, B3).
            for (let r = 0; r < oldGridList.length; r++) {
                if (!newRowOfOld.has(r)) {
                    differenceList.push(makeDifference('table_row_removed', { position: position, rowIndex: r + 1 },
                        cellText(oldTable.getRowCellList(r)), '', null));
                }
            }
            for (let r = 0; r < newGridList.length; r++) {
                if (!newRowSet.has(r)) {
                    differenceList.push(makeDifference('table_row_added', { position: position, rowIndex: r + 1 },
                        '', cellText(newTable.getRowCellList(r)), null));
                }
            }
            for (let c = 0; c < oldTable.get_columnCount(); c++) {
                if (!newColumnOfOld.has(c)) {
                    differenceList.push(makeDifference('table_column_removed', { position: position, colIndex: c + 1 },
                        cellText(oldTable.getColumnCellList(c)), '', null));
                }
            }
            for (let c = 0; c < newTable.get_columnCount(); c++) {
                if (!newColumnSet.has(c)) {
                    differenceList.push(makeDifference('table_column_added', { position: position, colIndex: c + 1 },
                        '', cellText(newTable.getColumnCellList(c)), null));
                }
            }
            // Correspondence between the cells of the matched rows and columns.
            const oldCellInfoList = oldTable.get_cellInfoList();
            const newCellInfoList = newTable.get_cellInfoList();
            const oldCellsOfNew = new Map();
            const newCellsOfOld = new Map();
            for (const [oldRow, newRow] of rowPairList) {
                for (const [oldColumn, newColumn] of columnPairList) {
                    const oldCellIndex = oldGridList[oldRow][oldColumn];
                    const newCellIndex = newGridList[newRow][newColumn];
                    if (oldCellIndex < 0 || newCellIndex < 0) {
                        continue;
                    }
                    if (!oldCellsOfNew.has(newCellIndex)) {
                        oldCellsOfNew.set(newCellIndex, new Set());
                    }
                    oldCellsOfNew.get(newCellIndex).add(oldCellIndex);
                    if (!newCellsOfOld.has(oldCellIndex)) {
                        newCellsOfOld.set(oldCellIndex, new Set());
                    }
                    newCellsOfOld.get(oldCellIndex).add(newCellIndex);
                }
            }
            // Merged cells (B4): one new cell covering several old cells.
            const excludedNewSet = new Set();
            const excludedOldSet = new Set();
            for (const [newCellIndex, oldCellIndexSet] of oldCellsOfNew) {
                if (oldCellIndexSet.size > 1) {
                    const newInfo = newCellInfoList[newCellIndex];
                    const oldIndexList = Array.from(oldCellIndexSet).sort(function (a, b) {
                        return a - b;
                    });
                    differenceList.push(makeDifference('table_cell_merged', {
                        position: position, rowIndex: newInfo.row + 1, colIndex: newInfo.col + 1,
                        rowSpan: newInfo.cell.get_rowSpan(), colSpan: newInfo.cell.get_colSpan()
                    }, oldIndexList.map(function (index) {
                        return oldCellInfoList[index].cell.toText();
                    }).join('\t'), newInfo.cell.toText(), null));
                    excludedNewSet.add(newCellIndex);
                    for (const index of oldIndexList) {
                        excludedOldSet.add(index);
                    }
                }
            }
            // Split cells (B5): one old cell covering several new cells.
            for (const [oldCellIndex, newCellIndexSet] of newCellsOfOld) {
                if (newCellIndexSet.size > 1) {
                    const oldInfo = oldCellInfoList[oldCellIndex];
                    const newIndexList = Array.from(newCellIndexSet).sort(function (a, b) {
                        return a - b;
                    });
                    const topRow = Math.min(...newIndexList.map(function (index) {
                        return newCellInfoList[index].row;
                    }));
                    const leftColumn = Math.min(...newIndexList.map(function (index) {
                        return newCellInfoList[index].col;
                    }));
                    differenceList.push(makeDifference('table_cell_split', {
                        position: position, rowIndex: topRow + 1, colIndex: leftColumn + 1,
                        rowSpan: oldInfo.cell.get_rowSpan(), colSpan: oldInfo.cell.get_colSpan()
                    }, oldInfo.cell.toText(), newIndexList.map(function (index) {
                        return newCellInfoList[index].cell.toText();
                    }).join('\t'), null));
                    excludedOldSet.add(oldCellIndex);
                    for (const index of newIndexList) {
                        excludedNewSet.add(index);
                    }
                }
            }
            // Content of the cells paired one to one (B6), nested tables included (TRD 106140).
            for (const [newIndex, oldCellIndexSet] of oldCellsOfNew) {
                if (oldCellIndexSet.size !== 1 || excludedNewSet.has(newIndex)) {
                    continue;
                }
                const oldIndex = oldCellIndexSet.values().next().value;
                if (excludedOldSet.has(oldIndex)) {
                    continue;
                }
                const oldCell = oldCellInfoList[oldIndex].cell;
                const newInfo = newCellInfoList[newIndex];
                const location = { position: position, rowIndex: newInfo.row + 1, colIndex: newInfo.col + 1 };
                const result = this.compareInline(oldCell.get_inlineList(), newInfo.cell.get_inlineList(), location);
                if (result.changeList.length > 0) {
                    differenceList.push(makeDifference('table_cell_modified', location,
                        inlineToText(oldCell.get_inlineList()), inlineToText(newInfo.cell.get_inlineList()), result.changeList));
                }
                for (const objectDifference of result.objectDifferenceList) {
                    differenceList.push(objectDifference);
                }
                this.compareNestedTables(oldCell.get_nestedTableList(), newInfo.cell.get_nestedTableList(), location, differenceList);
            }
            // Order within the block: by row, then by column (TRD 106183).
            return differenceList.map(function (difference, index) {
                return { difference: difference, index: index };
            }).sort(function (a, b) {
                return ((a.difference.rowIndex || 0) - (b.difference.rowIndex || 0))
                    || ((a.difference.colIndex || 0) - (b.difference.colIndex || 0)) || (a.index - b.index);
            }).map(function (wrapper) {
                return wrapper.difference;
            });
        }

        /**
         * Compares the tables nested in two paired cells; the location inside the nested table
         * is moved into a "nested" property (TRD 108590).
         * @param {RtcTableBlock[]} oldTableList - Old nested tables.
         * @param {RtcTableBlock[]} newTableList - New nested tables.
         * @param {Object} hostLocation - Location of the host cell.
         * @param {Object[]} differenceList - Receives the differences.
         */
        compareNestedTables(oldTableList, newTableList, hostLocation, differenceList) {
            const count = Math.max(oldTableList.length, newTableList.length);
            for (let k = 0; k < count; k++) {
                const oldTable = oldTableList[k];
                const newTable = newTableList[k];
                if (!oldTable || !newTable) {
                    const table = oldTable || newTable;
                    const text = table.toTextLineList().join('\n');
                    differenceList.push(makeDifference(newTable ? 'table_added' : 'table_removed', hostLocation,
                        newTable ? '' : text, newTable ? text : '', null));
                    continue;
                }
                if (oldTable.toKey() === newTable.toKey()) {
                    continue;
                }
                for (const inner of this.compareTables(oldTable, newTable, hostLocation.position)) {
                    const nested = {};
                    for (const key of ['rowIndex', 'colIndex', 'rowSpan', 'colSpan', 'nested']) {
                        if (inner[key] !== undefined) {
                            nested[key] = inner[key];
                        }
                    }
                    const location = { position: hostLocation.position, rowIndex: hostLocation.rowIndex, colIndex: hostLocation.colIndex, nested: nested };
                    differenceList.push(makeDifference(inner.type, location, inner.old, inner.new, inner.changes || null));
                }
            }
        }
    }

    /* ======================================================================
     * Public function (TRD section 4)
     * ====================================================================== */

    /**
     * Compares two ERM rich text fragments and reports their significant differences.
     *
     * @param {string|null} oldRichText - Rich text HTML of version N (reference), with or without its XHTML envelope.
     * @param {string|null} newRichText - Rich text HTML of version N+1, with or without its XHTML envelope.
     * @param {*} [metaOld] - Free metadata of version N, copied into the result without interpretation.
     * @param {*} [metaNew] - Free metadata of version N+1, copied into the result without interpretation.
     * @returns {null|{canonicalOld: string, canonicalNew: string, canonicalOldText: string, canonicalNewText: string,
     *   differences: Object[], metaOld: *, metaNew: *, warnings: Object[]}}
     *   null when both canonical models are equal (verdict IDENTIQUE, TRD 106093); otherwise the
     *   result object, whose "differences" array holds at least one entry (TRD 106095).
     * @throws {Error} Only when jQuery or js-sha256 is not loaded (configuration error, not an input error).
     */
    function richTextCompare(oldRichText, newRichText, metaOld, metaNew) {
        const jQueryFunction = rootScope.jQuery;
        const hashFunction = rootScope.sha256;
        if (typeof jQueryFunction !== 'function' || typeof hashFunction !== 'function') {
            throw new Error('richTextCompare: jQuery 3.7.1 and js-sha256 must be loaded before richTextCompare.js.');
        }
        const warningLog = new RtcWarningLog();
        const oldModel = new RtcModelBuilder(warningLog, 'old', jQueryFunction, hashFunction).build(oldRichText);
        const newModel = new RtcModelBuilder(warningLog, 'new', jQueryFunction, hashFunction).build(newRichText);
        if (oldModel.toKey() === newModel.toKey()) {
            return null;
        }
        const canonicalOldText = oldModel.toText();
        const canonicalNewText = newModel.toText();
        let differenceList;
        if (oldModel.isEmpty()) {
            differenceList = [makeDifference('all_text_added', { position: 1 }, '', canonicalNewText, null)];
        } else if (newModel.isEmpty()) {
            differenceList = [makeDifference('all_text_removed', { position: 1 }, canonicalOldText, '', null)];
        } else {
            differenceList = new RtcComparator().compareDocuments(oldModel, newModel);
            if (differenceList.length === 0) {
                // Safety net: the models differ but no rule could qualify the difference.
                differenceList = [makeDifference('paragraph_modified', { position: 1 }, canonicalOldText, canonicalNewText, [])];
            }
        }
        return {
            canonicalOld: oldModel.toHtml(),
            canonicalNew: newModel.toHtml(),
            canonicalOldText: canonicalOldText,
            canonicalNewText: canonicalNewText,
            differences: differenceList,
            metaOld: metaOld,
            metaNew: metaNew,
            warnings: warningLog.get_entryList()
        };
    }

    rootScope.richTextCompare = richTextCompare;
})(window);
