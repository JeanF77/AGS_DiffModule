/**
 * @file compare_RichTextContent.js
 * @description Compares two rich text blocks from ERM artifacts and returns
 *              a structured diff result highlighting textual differences.
 *
 * Dependencies:
 *  - jQuery (DOM manipulation - REQ-16)
 *  - diff-match-patch (text diffing - REQ-17)
 *    [github.com](https://github.com/google/diff-match-patch)
 *
 * All comments are written in English (REQ-21).
 * Each function references the relevant REQ identifiers (REQ-22).
 */

// =============================================================================
// SECTION 1 — CONSTANTS
// =============================================================================

/**
 * CSS class used by the IBM RDM editor for embedded resource decorators.
 * REQ-07, REQ-15
 */
const IBM_EMBEDDED_CLASS = "com-ibm-rdm-editor-EmbeddedResourceDecorator";

/**
 * CSS classes injected into the HTML diff output to mark changes.
 * REQ-04
 */
const DIFF_CSS = {
  inserted:     "rte-diff-inserted",      // inline text: added
  deleted:      "rte-diff-deleted",       // inline text: removed
  cellEqual:    "rte-diff-cell-equal",    // table cell: unchanged
  cellInserted: "rte-diff-cell-inserted", // table cell: added / changed in tgt
  cellDeleted:  "rte-diff-cell-deleted",  // table cell: removed / changed in src
  cellModified: "rte-diff-cell-modified", // table cell: present in both, text differs
  rowInserted:  "rte-diff-row-inserted",  // row only in target
  rowDeleted:   "rte-diff-row-deleted",   // row only in source
  liEqual:      "rte-diff-li-equal",      // list item: unchanged
  liInserted:   "rte-diff-li-inserted",   // list item: added in target
  liDeleted:    "rte-diff-li-deleted",    // list item: removed from source
  liModified:   "rte-diff-li-modified",   // list item: present in both, text differs
};

/**
 * Sentinel character used to delimit list items (<li>, <dt>, <dd>) inside the
 * normalised plain text produced by _extractText.
 *
 * Unlike a newline — which is later collapsed to a space (REQ-12) — this
 * control character is preserved through normalisation.  Consequently, adding
 * or removing a list item is always reported as a textual difference, even
 * when the aggregate words are unchanged.
 */
const LIST_ITEM_SEP = "\x1F";


// =============================================================================
// SECTION 2 — MAIN FUNCTION
// =============================================================================

/**
 * compare_RichTextContent
 *
 * Compares two rich-text HTML blocks and returns a structured result describing
 * textual differences, with indicators for images, tables, and IBM embedded
 * resource decorators.
 *
 * @param {string} richTextSrc - HTML string of the source artifact. (REQ-02)
 * @param {string} richTextTgt - HTML string of the target artifact. (REQ-02)
 * @returns {Object} ComparisonResult                                 (REQ-03)
 *   @returns {string}   ComparisonResult.diffHtml
 *       HTML string with <ins> / <del> highlights on changed text.  (REQ-04)
 *   @returns {Object}   ComparisonResult.images
 *       @returns {boolean} images.srcHasImages   Source contains ≥1 image.
 *       @returns {boolean} images.tgtHasImages   Target contains ≥1 image.
 *       @returns {Array}   images.srcList        <img> src attributes from source.
 *       @returns {Array}   images.tgtList        <img> src attributes from target.
 *                                                                    (REQ-05, REQ-14)
 *   @returns {Object}   ComparisonResult.tables
 *       @returns {boolean} tables.srcHasTables   Source contains ≥1 table.
 *       @returns {boolean} tables.tgtHasTables   Target contains ≥1 table.
 *                                                                    (REQ-06)
 *   @returns {Object}   ComparisonResult.embeddedResources
 *       @returns {boolean} embeddedResources.srcHasEmbedded
 *       @returns {boolean} embeddedResources.tgtHasEmbedded         (REQ-07, REQ-15)
 */
function compare_RichTextContent(richTextSrc, richTextTgt) {

  // --- Parse both inputs into detached jQuery DOM trees (REQ-16) -----------
  const $src = _parseHtml(richTextSrc);
  const $tgt = _parseHtml(richTextTgt);

  // --- Collect structural indicators before any text extraction ------------
  const images            = _detectImages($src, $tgt);
  const tables            = _detectTables($src, $tgt);
  const embeddedResources = _detectEmbeddedResources($src, $tgt);

  // --- Extract normalised plain text for diffing (REQ-09, REQ-10, REQ-12) --
  const textSrc = _extractText($src);
  const textTgt = _extractText($tgt);

  // --- Short-circuit: strictly equal normalised texts ----------------------
  const isEqual = textSrc === textTgt;
  if (isEqual) {
    return { isEqual, diffHtml: null, images, tables, embeddedResources };
  }

  // --- Build diff HTML, with enhanced table rendering (REQ-13) -------------
  const diffHtml = _buildDiffHtmlWithTables($src, $tgt, textSrc, textTgt);

  return { isEqual, diffHtml, images, tables, embeddedResources };
}


// =============================================================================
// SECTION 3 — DOM HELPERS
// =============================================================================

/**
 * _parseHtml
 *
 * Parses an HTML string into a detached jQuery collection so we can safely
 * traverse it without touching the live document.
 * Uses a <div> wrapper to preserve all top-level nodes.
 *
 * REQ-10, REQ-16
 *
 * @param  {string} html - Raw HTML string.
 * @returns {jQuery}       Wrapped jQuery object.
 */
function _parseHtml(html) {
  // jQuery's $() can parse HTML fragments; we wrap in a neutral div to ensure
  // top-level text nodes and mixed content are captured correctly.
  return $("<div>").html(html || "");
}


/**
 * _extractText
 *
 * Extracts a clean, normalised plain-text string from a jQuery-wrapped DOM.
 *
 * Strategy (REQ-09, REQ-10, REQ-12):
 *  1. Clone the tree to avoid mutating the original.
 *  2. Remove non-content nodes: <script>, <style>, and any node whose sole
 *     purpose is presentational (style attributes, class attributes are
 *     irrelevant — we strip them to neutralise any whitespace side-effects
 *     they may carry, but the key point is that we work on text only).
 *  3. Unwrap purely decorative inline wrappers (<span>, <font>, <b>, <i>,
 *     <u>, <strong>, <em>, <mark>, <s>, <sub>, <sup>) so that text nodes
 *     that were split across wrapper boundaries are reunited before
 *     extraction. This is the core fix for REQ-09: a <span style="...">
 *     wrapping text that is later unwrapped must produce the same token
 *     sequence as the bare text.
 *  4. Insert newline sentinels before block-level elements.
 *  5. Extract text with jQuery .text().
 *  6. Aggressively normalise all whitespace and invisible characters.
 *
 * @param  {jQuery} $root - Parsed DOM wrapper.
 * @returns {string}        Normalised plain text.
 */
function _extractText($root) {
  // Work on a deep clone so detection trees are not mutated.
  const $clone = $root.clone();

  // Step 1 — Remove non-content nodes entirely.
  $clone.find("script, style").remove();

  // Step 2 — Strip style and class attributes everywhere.
  // This neutralises any whitespace injected by style-aware serialisers
  // and makes the DOM structurally comparable regardless of presentation.
  // (REQ-09: formatting differences must not affect the comparison.)
  $clone.find("*").each(function () {
    $(this).removeAttr("style")
      .removeAttr("class")
      .removeAttr("dir")
      .removeAttr("id")
      .removeAttr("lang")
      .removeAttr("xml:lang");
  });

  // Step 3 — Unwrap purely presentational inline elements.
  // When a run of text is wrapped in e.g. <span style="color:red"> in one
  // version and bare in the other, jQuery .text() produces the same string
  // in both cases — BUT adjacent text nodes may carry different surrounding
  // whitespace depending on how the serialiser indented the markup.
  // Unwrapping collapses those wrapper boundaries and reunites text nodes,
  // making the whitespace environment identical in both versions. (REQ-09)
  const INLINE_PRESENTATIONAL =
    "span, font, b, i, u, strong, em, mark, s, strike, small, " +
    "sub, sup, abbr, cite, code, kbd, samp, var, bdi, bdo, q, time";

  // Unwrap must be done innermost-first to avoid double-unwrapping.
  // jQuery processes selectors depth-first when iterating .find(), so we
  // reverse the collection to start from leaves.
  let $inline = $clone.find(INLINE_PRESENTATIONAL);
  while ($inline.length > 0) {
    // .contents().unwrap() replaces each matched element with its children.
    $inline.contents().unwrap();
    // Re-query: some wrappers may have been nested and are now exposed.
    $inline = $clone.find(INLINE_PRESENTATIONAL);
  }

  // Step 4a — List-item elements (<li>, <dt>, <dd>) get the LIST_ITEM_SEP
  // sentinel instead of a plain newline.  This preserves their count and
  // boundaries through normalisation, so adding or removing a list item is
  // always detected as a structural change.
  $clone.find("li, dt, dd").each(function () {
    $(this).prepend(document.createTextNode(LIST_ITEM_SEP));
  });

  // Step 4b — All other block-level / line-break elements get a newline
  // sentinel so that words from adjacent blocks do not merge. (REQ-10)
  const BLOCK_SELECTORS =
    "p, div, section, article, aside, header, footer, nav, main, " +
    "h1, h2, h3, h4, h5, h6, blockquote, pre, " +
    "tr, td, th, caption, br, hr, figure, figcaption, summary, details";

  $clone.find(BLOCK_SELECTORS).each(function () {
    $(this).prepend(document.createTextNode("\n"));
  });

  // Step 5 — Extract raw text content.
  let text = $clone.text();

  // Step 6 — Aggressive whitespace and invisible-character normalisation.
  // (REQ-12)
  text = text
    // Remove BOM and zero-width characters injected by RDM / Word pastes.
    .replace(/[\uFEFF\u200B\u200C\u200D\u00AD]/g, "")
    // Normalise non-breaking and other exotic spaces to a regular space.
    .replace(/[\u00A0\u202F\u205F\u3000]/g, " ")
    // Trim horizontal whitespace around list-item sentinels so that
    // incidental indentation in the source HTML is not counted as content.
    .replace(/[ \t]*\x1F[ \t]*/g, LIST_ITEM_SEP)
    // Collapse horizontal whitespace runs.
    .replace(/[ \t]+/g, " ")
    // Remove spaces adjacent to newlines.
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    // Collapse multiple consecutive newlines into one.
    .replace(/\n{2,}/g, "\n")
    // A newline adjacent to a list separator is redundant — the separator
    // already marks a structural boundary.  Keep only the separator.
    .replace(/\n\x1F|\x1F\n/g, LIST_ITEM_SEP)
    // Collapse consecutive list separators.
    .replace(/\x1F+/g, LIST_ITEM_SEP)
    // REQ-12 : block newlines are word separators, not content.
    // Convert them to spaces; list-item sentinels are intentionally preserved.
    .replace(/\n/g, " ")
    .replace(/ {2,}/g, " ")
    // Strip leading / trailing sentinels and whitespace.
    .replace(/^\x1F+|\x1F+$/g, "")
    .trim();

  return text;
}


// =============================================================================
// SECTION 4 — STRUCTURAL INDICATORS
// =============================================================================

/**
 * _detectImages
 *
 * Detects <img> elements in both source and target DOM trees and collects
 * their `src` attributes for later comparison by an external image-diffing
 * function (out of scope per REQ-14).
 *
 * REQ-05, REQ-14
 *
 * @param  {jQuery} $src
 * @param  {jQuery} $tgt
 * @returns {Object} { srcHasImages, tgtHasImages, srcList, tgtList }
 */
function _detectImages($src, $tgt) {
  const srcList = _collectAttr($src, "img", "src");
  const tgtList = _collectAttr($tgt, "img", "src");

  return {
    srcHasImages: srcList.length > 0,
    tgtHasImages: tgtList.length > 0,
    srcList,
    tgtList,
  };
}


/**
 * _detectTables
 *
 * Detects <table> elements in both DOM trees. (REQ-06, REQ-13)
 *
 * @param  {jQuery} $src
 * @param  {jQuery} $tgt
 * @returns {Object} { srcHasTables, tgtHasTables }
 */
function _detectTables($src, $tgt) {
  return {
    srcHasTables: $src.find("table").length > 0,
    tgtHasTables: $tgt.find("table").length > 0,
  };
}


/**
 * _detectEmbeddedResources
 *
 * Checks whether either DOM tree contains elements carrying the IBM RDM
 * embedded-resource decorator class.  Only sets a boolean flag; no further
 * processing is required (REQ-15).
 *
 * REQ-07, REQ-15
 *
 * @param  {jQuery} $src
 * @param  {jQuery} $tgt
 * @returns {Object} { srcHasEmbedded, tgtHasEmbedded }
 */
function _detectEmbeddedResources($src, $tgt) {
  const selector = `.${IBM_EMBEDDED_CLASS}`;
  return {
    srcHasEmbedded: $src.find(selector).length > 0,
    tgtHasEmbedded: $tgt.find(selector).length > 0,
  };
}


/**
 * _collectAttr
 *
 * Helper that queries all matching elements inside a root and returns an array
 * of a given attribute value (non-empty values only).
 *
 * @param  {jQuery} $root    - DOM wrapper.
 * @param  {string} selector - CSS selector (e.g. "img").
 * @param  {string} attr     - Attribute name (e.g. "src").
 * @returns {string[]}
 */
function _collectAttr($root, selector, attr) {
  const values = [];
  $root.find(selector).each(function () {
    const val = $(this).attr(attr);
    if (val && val.trim() !== "") {
      values.push(val.trim());
    }
  });
  return values;
}


// =============================================================================
// SECTION 5 — DIFF ENGINE
// =============================================================================

/**
 * _extractDocumentSegments
 *
 * Walks the children of a parsed HTML root in document order and groups them
 * into typed segments: "table", "list", or "text".  Consecutive non-table,
 * non-list children are merged into a single text segment so that headings and
 * paragraphs that surround a table remain associated with their natural position.
 *
 * This preserves the original document order (e.g. heading → table → paragraphs)
 * so that _buildDiffHtmlWithTables can reassemble the diff in the same order
 * rather than grouping all text first and all tables last.
 *
 * ERM rich-text content is often wrapped in one or more outer <div> containers
 * before the actual paragraph/table siblings appear.  The function therefore
 * first descends through any chain of single-child block wrappers (div, article,
 * section, main) to reach the level where structural elements live as siblings,
 * then walks that level in document order.
 *
 * @param  {jQuery} $root - Parsed DOM wrapper (from _parseHtml).
 * @returns {Array<{type: string, $el: jQuery}>}
 *   Each entry has:
 *   - type  : "text" | "table" | "list"
 *   - $el   : the jQuery element(s) for that segment
 */
function _extractDocumentSegments($root) {
  // Descend through single-child block wrappers until we reach the level that
  // contains the actual siblings (paragraphs, tables, lists, …).
  // This handles ERM content wrapped in one or more outer <div> elements.
  const BLOCK_WRAPPERS = new Set(["div", "article", "section", "main", "body"]);
  let $effective = $root;
  for (;;) {
    const $ch = $effective.children();
    if ($ch.length !== 1) break;
    const tag = $ch.get(0).tagName.toLowerCase();
    if (!BLOCK_WRAPPERS.has(tag)) break;
    $effective = $ch.first();
  }

  const segments = [];
  let $textBuffer = null;

  $effective.children().each(function () {
    const tag = this.tagName.toLowerCase();

    if (tag === "table") {
      if ($textBuffer) {
        segments.push({ type: "text", $el: $textBuffer });
        $textBuffer = null;
      }
      segments.push({ type: "table", $el: $(this) });

    } else if (tag === "ul" || tag === "ol" || tag === "dl") {
      if ($textBuffer) {
        segments.push({ type: "text", $el: $textBuffer });
        $textBuffer = null;
      }
      segments.push({ type: "list", $el: $(this) });

    } else {
      if (!$textBuffer) $textBuffer = $("<div>");
      $textBuffer.append($(this).clone());
    }
  });

  if ($textBuffer) {
    segments.push({ type: "text", $el: $textBuffer });
  }

  return segments;
}


/**
 * _extractTextFromTextSegment
 *
 * Extracts normalised plain text from a text segment element, explicitly
 * excluding any tables or top-level lists that may be nested inside it.
 *
 * This is the defensive counterpart to _extractDocumentSegments: even if an
 * edge-case HTML structure causes a table to end up inside a text buffer element
 * (e.g. a <div> wrapping both a paragraph and a table that was not separated
 * at the segmentation step), its cell text will not bleed into the text diff.
 *
 * @param  {jQuery} $el - A text-segment wrapper element.
 * @returns {string}       Normalised plain text without table/list content.
 */
function _extractTextFromTextSegment($el) {
  const $clone = $el.clone();
  $clone.find("table").remove();
  $clone.find("ul, ol, dl").filter(function () {
    return $(this).closest("li").length === 0;
  }).remove();
  return _extractText($clone);
}


/**
 * _buildDiffHtmlWithTables
 *
 * Orchestrates the diff rendering by walking both DOM trees in document order
 * and processing each segment (table, list, or text block) in the position it
 * occupies in the source document.
 *
 * Structured elements (tables, lists) are paired by type and index across
 * source and target.  Text segments are paired by their positional index among
 * text-only segments.  Any structured or text segments present only in the
 * target are appended at the end as fully-inserted content.
 *
 * This approach preserves the original document order (e.g. heading → table →
 * paragraphs) instead of grouping all text first and all tables last.
 *
 * - Top-level <table> nodes  → visual cell-by-cell diff  (REQ-13)
 * - Top-level <ul>/<ol>/<dl> → visual item-by-item diff
 * - Text segments             → word-level text diff      (REQ-08)
 *
 * @param  {jQuery} $src     - Parsed source DOM.
 * @param  {jQuery} $tgt     - Parsed target DOM.
 * @param  {string} textSrc  - Normalised source plain text (used for short-circuit).
 * @param  {string} textTgt  - Normalised target plain text (used for short-circuit).
 * @returns {string}           Complete diff HTML string.
 */
function _buildDiffHtmlWithTables($src, $tgt, textSrc, textTgt) {

  // ── Extract ordered segments from both sides ─────────────────────────────
  const srcSegs = _extractDocumentSegments($src);
  const tgtSegs = _extractDocumentSegments($tgt);

  // Collect structured elements by type for index-based pairing.
  const srcTables   = srcSegs.filter(s => s.type === "table").map(s => s.$el);
  const tgtTables   = tgtSegs.filter(s => s.type === "table").map(s => s.$el);
  const srcLists    = srcSegs.filter(s => s.type === "list").map(s => s.$el);
  const tgtLists    = tgtSegs.filter(s => s.type === "list").map(s => s.$el);
  const srcTextSegs = srcSegs.filter(s => s.type === "text");
  const tgtTextSegs = tgtSegs.filter(s => s.type === "text");

  // Short-circuit: no structured elements on either side → plain text diff.
  if (srcTables.length === 0 && tgtTables.length === 0 &&
      srcLists.length  === 0 && tgtLists.length  === 0) {
    return _buildDiffHtml(textSrc, textTgt);
  }

  const parts = [];
  let tableIdx = 0;
  let listIdx  = 0;
  let textIdx  = 0;

  // ── Walk source segments in document order ───────────────────────────────
  for (const seg of srcSegs) {
    if (seg.type === "text") {
      const srcText = _extractTextFromTextSegment(seg.$el);
      const tgtSeg  = tgtTextSegs[textIdx] || null;
      const tgtText = tgtSeg ? _extractTextFromTextSegment(tgtSeg.$el) : "";

      if (srcText !== "" || tgtText !== "") {
        if (srcText === tgtText) {
          parts.push(`<div class="rte-diff-result">${_escapeHtml(srcText)}</div>`);
        } else {
          parts.push(_buildDiffHtml(srcText, tgtText));
        }
      }
      textIdx++;

    } else if (seg.type === "table") {
      const $t2 = tgtTables[tableIdx] || null;
      parts.push(_buildTableDiffHtml(seg.$el, $t2));
      tableIdx++;

    } else if (seg.type === "list") {
      const $l2 = tgtLists[listIdx] || null;
      parts.push(_buildListDiffHtml(seg.$el, $l2));
      listIdx++;
    }
  }

  // ── Append extra target elements absent from source ──────────────────────
  for (let i = tableIdx; i < tgtTables.length; i++) {
    parts.push(_buildTableDiffHtml(null, tgtTables[i]));
  }
  for (let i = listIdx; i < tgtLists.length; i++) {
    parts.push(_buildListDiffHtml(null, tgtLists[i]));
  }
  for (let i = textIdx; i < tgtTextSegs.length; i++) {
    const tgtText = _extractTextFromTextSegment(tgtTextSegs[i].$el);
    if (tgtText !== "") {
      parts.push(_buildDiffHtml("", tgtText));
    }
  }

  return parts.join("\n");
}


/**
 * _encodeWords
 *
 * Converts two plain-text strings into single-character-per-token encoded
 * strings suitable for character-level diffing, producing word-level results.
 *
 * Tokenisation splits on whitespace boundaries while keeping the whitespace
 * as separate tokens so spacing is faithfully reconstructed.
 *
 * REQ-11, REQ-12
 *
 * @param  {string} textA
 * @param  {string} textB
 * @returns {{ encodedSrc: string, encodedTgt: string, wordArray: string[] }}
 */
function _encodeWords(textA, textB) {
  // Map from token string → private-use Unicode character code point.
  const wordMap = {};
  const wordArray = []; // index → token string (for decoding)

  /**
   * Encodes one text string: splits into tokens, assigns each unique token
   * a character in the Unicode Supplementary Private Use Area (starting at
   * U+E000) and returns the encoded string.
   *
   * @param  {string} text
   * @returns {string} Encoded string.
   */
  function encode(text) {
    // Split on whitespace OR the list-item sentinel, keeping every separator
    // as its own token so spaces and list boundaries are encoded distinctly.
    const tokens = text.split(/(\s+|\x1F)/);
    let encoded = "";

    for (const token of tokens) {
      if (token === "") continue;

      if (!(token in wordMap)) {
        // Assign the next available code point (U+E000 … U+F8FF private area).
        // For very large documents we could overflow into U+F0000; for ERM
        // artefacts this range is more than sufficient.
        const codePoint = 0xE000 + wordArray.length;
        wordMap[token] = String.fromCodePoint(codePoint);
        wordArray.push(token);
      }

      encoded += wordMap[token];
    }

    return encoded;
  }

  const encodedSrc = encode(textA);
  const encodedTgt = encode(textB);

  return { encodedSrc, encodedTgt, wordArray };
}


/**
 * _diffsToHtml
 *
 * Converts a diff-match-patch diff array (operating on encoded characters)
 * back into a human-readable HTML string, decoding each character to its
 * original word/token and wrapping changes in <ins> / <del> elements.
 *
 * REQ-04, REQ-08
 *
 * @param  {Array}    diffs     - Array of [operation, encodedText] tuples.
 *                                Operation: -1 = DELETE, 0 = EQUAL, 1 = INSERT
 * @param  {string[]} wordArray - Decoded token array (index → token).
 * @returns {string}              Annotated HTML string.
 */
function _diffsToHtml(diffs, wordArray) {
  // diff-match-patch operation constants.
  const DIFF_DELETE = -1;
  const DIFF_INSERT = 1;
  const DIFF_EQUAL = 0;

  let html = "";

  for (const [op, encodedText] of diffs) {
    // Decode tokens, then render list-item sentinels as a visible pilcrow (¶)
    // so the reader can see where list-item boundaries were added or removed.
    const decoded = _decodeTokens(encodedText, wordArray).replace(/\x1F/g, " ¶ ");

    // Escape the decoded text to prevent XSS before wrapping in HTML tags.
    const safe = _escapeHtml(decoded);

    switch (op) {
      case DIFF_EQUAL:
        html += safe;
        break;

      case DIFF_DELETE:
        // Text present in source but absent from target.
        html += `<del class="${DIFF_CSS.deleted}">${safe}</del>`;
        break;

      case DIFF_INSERT:
        // Text absent from source but present in target.
        html += `<ins class="${DIFF_CSS.inserted}">${safe}</ins>`;
        break;
    }
  }

  // Wrap the whole result in a container for easy styling / inspection.
  return `<div class="rte-diff-result">${html}</div>`;
}


/**
 * _decodeTokens
 *
 * Converts an encoded string (where each code point maps to one token) back
 * to the concatenated original tokens.
 *
 * @param  {string}   encodedText - String of private-use code points.
 * @param  {string[]} wordArray   - Token lookup table (code point offset from U+E000).
 * @returns {string}                Decoded plain text.
 */
function _decodeTokens(encodedText, wordArray) {
  let decoded = "";
  // Iterate over Unicode code points (handles surrogate pairs correctly).
  for (const char of encodedText) {
    const index = char.codePointAt(0) - 0xE000;
    decoded += wordArray[index] !== undefined ? wordArray[index] : char;
  }
  return decoded;
}


/**
 * _buildDiffHtml
 *
 * Produces an HTML string highlighting insertions and deletions between the
 * source and target plain-text strings.
 *
 * Uses `diff-match-patch` (REQ-17) at word-level granularity (REQ-11):
 *  1. Encode each unique word/token to a private-use Unicode character.
 *  2. Run a character-level diff on the encoded strings.
 *  3. Decode and wrap deletions in <del> / insertions in <ins>.
 *  4. Escape all literal text to prevent XSS.
 *
 * REQ-04, REQ-08, REQ-11, REQ-17
 *
 * @param  {string} textSrc - Normalised source plain text.
 * @param  {string} textTgt - Normalised target plain text.
 * @returns {string}          HTML string with diff annotations.
 */
function _buildDiffHtml(textSrc, textTgt) {
  /* global diff_match_patch */
  const dmp = new diff_match_patch();
  const { encodedSrc, encodedTgt, wordArray } = _encodeWords(textSrc, textTgt);
  const diffs = dmp.diff_main(encodedSrc, encodedTgt, false);
  dmp.diff_cleanupSemantic(diffs);
  return _diffsToHtml(diffs, wordArray);
}



/**
 * _getCellText
 *
 * Extracts normalised plain text from a single <td> or <th> jQuery element.
 *
 * @param  {jQuery} $cell - A single table cell.
 * @returns {string}        Normalised plain text.
 */
function _getCellText($cell) {
  return _extractText($("<div>").html($cell.html()));
}


/**
 * _getItemText
 *
 * Extracts normalised plain text from a single <li>, <dt> or <dd> element.
 * The item's HTML is wrapped in a neutral <div> before extraction so that
 * _extractText can process it as a standalone fragment.
 *
 * @param  {jQuery} $item - A single list item element.
 * @returns {string}         Normalised plain text.
 */
function _getItemText($item) {
  return _extractText($("<div>").html($item.html()));
}


/**
 * _buildInlineCellDiff
 *
 * Produces an inline word-level diff HTML fragment (no wrapping <div>) for
 * two cell text strings.  Used inside modified table cells so that the <del>
 * and <ins> markers appear directly within the <td> / <th>.
 *
 * @param  {string} textSrc - Normalised source cell text.
 * @param  {string} textTgt - Normalised target cell text.
 * @returns {string}          Inline HTML with <del> / <ins> annotations.
 */
function _buildInlineCellDiff(textSrc, textTgt) {
  /* global diff_match_patch */
  const dmp = new diff_match_patch();
  const { encodedSrc, encodedTgt, wordArray } = _encodeWords(textSrc, textTgt);
  const diffs = dmp.diff_main(encodedSrc, encodedTgt, false);
  dmp.diff_cleanupSemantic(diffs);

  const DIFF_DELETE = -1;
  const DIFF_INSERT = 1;
  const DIFF_EQUAL  = 0;

  let html = "";
  for (const [op, encodedText] of diffs) {
    const safe = _escapeHtml(_decodeTokens(encodedText, wordArray));
    switch (op) {
      case DIFF_EQUAL:  html += safe; break;
      case DIFF_DELETE: html += `<del class="${DIFF_CSS.deleted}">${safe}</del>`; break;
      case DIFF_INSERT: html += `<ins class="${DIFF_CSS.inserted}">${safe}</ins>`; break;
    }
  }
  return html;
}


/**
 * _buildTableDiffHtml
 *
 * Produces a visual, cell-by-cell diff of two <table> jQuery elements as a
 * single unified HTML table.  Rows and cells are compared by index position.
 *
 * Rendering rules (REQ-13):
 *  - Row only in source  → entire <tr> carries DIFF_CSS.rowDeleted;
 *    each cell is wrapped in <del>.
 *  - Row only in target  → entire <tr> carries DIFF_CSS.rowInserted;
 *    each cell is wrapped in <ins>.
 *  - Matching rows, cell only in source  → DIFF_CSS.cellDeleted + <del>.
 *  - Matching rows, cell only in target  → DIFF_CSS.cellInserted + <ins>.
 *  - Matching rows, cell text identical  → DIFF_CSS.cellEqual, no markers.
 *  - Matching rows, cell text differs    → DIFF_CSS.cellModified with an
 *    inline word-level diff (<del>/<ins> inside the cell).
 *
 * Either argument may be null when one side has more tables than the other;
 * a null source table is treated as fully inserted and vice-versa.
 *
 * REQ-13
 *
 * @param  {jQuery|null} $t1 - Source <table> element (or null).
 * @param  {jQuery|null} $t2 - Target <table> element (or null).
 * @returns {string}           HTML string for the diff table.
 */
function _buildTableDiffHtml($t1, $t2) {
  // Flatten all <tr> nodes across thead / tbody / tfoot.
  const srcRows = $t1 ? $t1.find("tr").toArray() : [];
  const tgtRows = $t2 ? $t2.find("tr").toArray() : [];
  const rowCount = Math.max(srcRows.length, tgtRows.length);

  let html = `<table class="rte-diff-table">`;

  // ── Caption ─────────────────────────────────────────────────────────────────
  // A <caption> is not a row, so handle it separately before the row loop.
  const $srcCaption = $t1 ? $t1.children("caption") : null;
  const $tgtCaption = $t2 ? $t2.children("caption") : null;
  const srcCapText  = ($srcCaption && $srcCaption.length) ? _getCellText($srcCaption) : null;
  const tgtCapText  = ($tgtCaption && $tgtCaption.length) ? _getCellText($tgtCaption) : null;

  if (srcCapText !== null || tgtCapText !== null) {
    if (srcCapText === null) {
      html += `<caption class="${DIFF_CSS.cellInserted}">` +
              `<ins class="${DIFF_CSS.inserted}">${_escapeHtml(tgtCapText)}</ins>` +
              `</caption>`;
    } else if (tgtCapText === null) {
      html += `<caption class="${DIFF_CSS.cellDeleted}">` +
              `<del class="${DIFF_CSS.deleted}">${_escapeHtml(srcCapText)}</del>` +
              `</caption>`;
    } else if (srcCapText !== tgtCapText) {
      html += `<caption class="${DIFF_CSS.cellModified}">` +
              `${_buildInlineCellDiff(srcCapText, tgtCapText)}` +
              `</caption>`;
    } else {
      html += `<caption class="${DIFF_CSS.cellEqual}">${_escapeHtml(srcCapText)}</caption>`;
    }
  }

  for (let r = 0; r < rowCount; r++) {
    const $srcRow = srcRows[r] ? $(srcRows[r]) : null;
    const $tgtRow = tgtRows[r] ? $(tgtRows[r]) : null;

    // ── Row only in target (fully inserted) ──────────────────────────────────
    if (!$srcRow) {
      html += `<tr class="${DIFF_CSS.rowInserted}">`;
      $tgtRow.find("td, th").each(function () {
        const tag  = this.tagName.toLowerCase();
        const text = _getCellText($(this));
        html += `<${tag} class="${DIFF_CSS.cellInserted}">` +
                `<ins class="${DIFF_CSS.inserted}">${_escapeHtml(text)}</ins>` +
                `</${tag}>`;
      });
      html += `</tr>`;
      continue;
    }

    // ── Row only in source (fully deleted) ───────────────────────────────────
    if (!$tgtRow) {
      html += `<tr class="${DIFF_CSS.rowDeleted}">`;
      $srcRow.find("td, th").each(function () {
        const tag  = this.tagName.toLowerCase();
        const text = _getCellText($(this));
        html += `<${tag} class="${DIFF_CSS.cellDeleted}">` +
                `<del class="${DIFF_CSS.deleted}">${_escapeHtml(text)}</del>` +
                `</${tag}>`;
      });
      html += `</tr>`;
      continue;
    }

    // ── Both rows exist: compare cell by cell ────────────────────────────────
    const srcCells = $srcRow.find("td, th").toArray();
    const tgtCells = $tgtRow.find("td, th").toArray();
    const cellCount = Math.max(srcCells.length, tgtCells.length);

    html += `<tr>`;

    for (let c = 0; c < cellCount; c++) {
      const $sc = srcCells[c] ? $(srcCells[c]) : null;
      const $tc = tgtCells[c] ? $(tgtCells[c]) : null;

      // Output tag: prefer <th> if either side uses it.
      const srcTag = $sc ? $sc.prop("tagName").toLowerCase() : "td";
      const tgtTag = $tc ? $tc.prop("tagName").toLowerCase() : "td";
      const outTag = (srcTag === "th" || tgtTag === "th") ? "th" : "td";

      if (!$sc) {
        // Cell only in target.
        const text = _getCellText($tc);
        html += `<${outTag} class="${DIFF_CSS.cellInserted}">` +
                `<ins class="${DIFF_CSS.inserted}">${_escapeHtml(text)}</ins>` +
                `</${outTag}>`;

      } else if (!$tc) {
        // Cell only in source.
        const text = _getCellText($sc);
        html += `<${outTag} class="${DIFF_CSS.cellDeleted}">` +
                `<del class="${DIFF_CSS.deleted}">${_escapeHtml(text)}</del>` +
                `</${outTag}>`;

      } else {
        const srcText = _getCellText($sc);
        const tgtText = _getCellText($tc);

        if (srcText === tgtText) {
          // Identical: no diff markers.
          html += `<${outTag} class="${DIFF_CSS.cellEqual}">` +
                  `${_escapeHtml(srcText)}` +
                  `</${outTag}>`;
        } else {
          // Modified: inline word diff inside the cell.
          html += `<${outTag} class="${DIFF_CSS.cellModified}">` +
                  `${_buildInlineCellDiff(srcText, tgtText)}` +
                  `</${outTag}>`;
        }
      }
    }

    html += `</tr>`;
  }

  html += `</table>`;
  return html;
}


/**
 * _buildListDiffHtml
 *
 * Produces a visual, item-by-item diff of two list jQuery elements
 * (<ul>, <ol>, or <dl>) as a single HTML list of the same type.
 *
 * Items are compared by index position (item[0] ↔ item[0], etc.).
 * Direct children matching "li, dt, dd" are considered; sub-lists nested
 * inside a <li> are treated as part of that item's text content.
 *
 * Rendering rules:
 *  - Item only in source  → <li class="liDeleted"> wrapped in <del>.
 *  - Item only in target  → <li class="liInserted"> wrapped in <ins>.
 *  - Both exist, text equal   → <li class="liEqual">, no markers.
 *  - Both exist, text differs → <li class="liModified"> with inline
 *    word-level diff (<del>/<ins> inside the item).
 *
 * Either argument may be null when one side has more lists than the other
 * (unpaired list treated as fully inserted / fully deleted).
 *
 * @param  {jQuery|null} $l1 - Source list element (or null).
 * @param  {jQuery|null} $l2 - Target list element (or null).
 * @returns {string}           HTML string for the diff list.
 */
function _buildListDiffHtml($l1, $l2) {
  // Use the target list tag for the output; fall back to the source tag.
  const listTag = ($l2 || $l1).prop("tagName").toLowerCase();

  // Direct children only — ">" prevents descending into nested sub-lists.
  const srcItems = $l1 ? $l1.children("li, dt, dd").toArray() : [];
  const tgtItems = $l2 ? $l2.children("li, dt, dd").toArray() : [];
  const itemCount = Math.max(srcItems.length, tgtItems.length);

  let html = `<${listTag} class="rte-diff-list">`;

  for (let i = 0; i < itemCount; i++) {
    const $si = srcItems[i] ? $(srcItems[i]) : null;
    const $ti = tgtItems[i] ? $(tgtItems[i]) : null;

    // Output tag: prefer target's tag; fall back to source's.
    const outTag = ($ti || $si).prop("tagName").toLowerCase();

    if (!$si) {
      // ── Item only in target (inserted) ──────────────────────────────────
      const text = _getItemText($ti);
      html += `<${outTag} class="${DIFF_CSS.liInserted}">` +
              `<ins class="${DIFF_CSS.inserted}">${_escapeHtml(text)}</ins>` +
              `</${outTag}>`;

    } else if (!$ti) {
      // ── Item only in source (deleted) ───────────────────────────────────
      const text = _getItemText($si);
      html += `<${outTag} class="${DIFF_CSS.liDeleted}">` +
              `<del class="${DIFF_CSS.deleted}">${_escapeHtml(text)}</del>` +
              `</${outTag}>`;

    } else {
      const srcText = _getItemText($si);
      const tgtText = _getItemText($ti);

      if (srcText === tgtText) {
        // ── Identical item ─────────────────────────────────────────────────
        html += `<${outTag} class="${DIFF_CSS.liEqual}">` +
                `${_escapeHtml(srcText)}</${outTag}>`;
      } else {
        // ── Modified item: inline word diff ───────────────────────────────
        html += `<${outTag} class="${DIFF_CSS.liModified}">` +
                `${_buildInlineCellDiff(srcText, tgtText)}</${outTag}>`;
      }
    }
  }

  html += `</${listTag}>`;
  return html;
}


// =============================================================================
// SECTION 6 — UTILITY HELPERS
// =============================================================================

/**
 * _escapeHtml
 *
 * Escapes the five characters that have special meaning in HTML so that
 * decoded token text is safe to embed inside HTML element content.
 *
 * @param  {string} text
 * @returns {string}
 */
function _escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    // List-item sentinels that reach this point are in non-diff contexts
    // (equal cell content, deleted/inserted whole rows…): render as a space.
    .replace(/\x1F/g, " ");
}


// =============================================================================
// SECTION 7 — MODULE EXPORT (CommonJS / AMD / browser global)
// =============================================================================

/**
 * Export the public API.
 * Supports CommonJS (Node/bundlers), AMD (RequireJS), and plain browser globals.
 * REQ-20 (modularity)
 */
(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    // CommonJS
    module.exports = { compare_RichTextContent };
  } else if (typeof define === "function" && define.amd) {
    // AMD
    define([], factory);
  } else {
    // Browser global
    root.ERM = root.ERM || {};
    root.ERM.compare_RichTextContent = compare_RichTextContent;
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return { compare_RichTextContent };
}));
