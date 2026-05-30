/**
 * @file compare_RichTextContent.test.js
 * @description Unit tests for compare_RichTextContent.
 *
 * Test framework : Jest
 * DOM environment : jest-environment-jsdom (jQuery requires a DOM)
 *
 * Setup (run once in this directory):
 *   npm install
 *   npm test
 */

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------
const $ = require("jquery");
global.$ = $;
global.jQuery = $;

// diff-match-patch must be available as a global (REQ-17)
const { diff_match_patch } = require("diff-match-patch");
global.diff_match_patch = diff_match_patch;

// Module under test
const { compare_RichTextContent } = require("../js/compare_RichTextContent");


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strips all HTML tags — lets us assert on plain text without brittle tag checks. */
function stripTags(html) {
  return html.replace(/<[^>]*>/g, "");
}

/** True if the diffHtml contains at least one <ins> or <del> element. */
function hasDiffMarkers(html) {
  return /<ins[\s>]/.test(html) || /<del[\s>]/.test(html);
}

/** True if the diffHtml contains a <del> element. */
function hasDeletion(html) {
  return /<del[\s>]/.test(html);
}

/** True if the diffHtml contains an <ins> element. */
function hasInsertion(html) {
  return /<ins[\s>]/.test(html);
}


// ===========================================================================
// TEST SUITE
// ===========================================================================

describe("compare_RichTextContent", () => {

  // -------------------------------------------------------------------------
  // TC-01 — Identical plain text content
  // -------------------------------------------------------------------------
  describe("TC-01 — Identical textual content", () => {

    test("returns isEqual=true and diffHtml=null when both HTML blocks " +
         "contain the same text", () => {
      const src = "<p>Hello world</p>";
      const tgt = "<p>Hello world</p>";

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });
  });


  // -------------------------------------------------------------------------
  // TC-02 — Different textual content
  // -------------------------------------------------------------------------
  describe("TC-02 — Different textual content", () => {

    test("returns isEqual=false and diffHtml with diff markers when text " +
         "differs", () => {
      const src = "<p>The quick brown fox</p>";
      const tgt = "<p>The slow brown fox</p>";

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toBeNull();
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });

    test("diffHtml contains deleted word from source", () => {
      const src = "<p>The quick brown fox</p>";
      const tgt = "<p>The slow brown fox</p>";

      const result = compare_RichTextContent(src, tgt);

      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*quick[^<]*<\/del>/);
    });

    test("diffHtml contains inserted word from target", () => {
      const src = "<p>The quick brown fox</p>";
      const tgt = "<p>The slow brown fox</p>";

      const result = compare_RichTextContent(src, tgt);

      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*slow[^<]*<\/ins>/);
    });
  });


  // -------------------------------------------------------------------------
  // TC-03 — One content is empty
  // -------------------------------------------------------------------------
  describe("TC-03 — One content is empty", () => {

    test("source empty, target has text → isEqual=false, diffHtml has " +
         "insertion markers", () => {
      const result = compare_RichTextContent("", "<p>Some content here</p>");

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toBeNull();
      expect(hasInsertion(result.diffHtml)).toBe(true);
      expect(hasDeletion(result.diffHtml)).toBe(false);
    });

    test("source has text, target empty → isEqual=false, diffHtml has " +
         "deletion markers", () => {
      const result = compare_RichTextContent("<p>Some content here</p>", "");

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toBeNull();
      expect(hasDeletion(result.diffHtml)).toBe(true);
      expect(hasInsertion(result.diffHtml)).toBe(false);
    });
  });


  // -------------------------------------------------------------------------
  // TC-04 — Both contents are empty
  // -------------------------------------------------------------------------
  describe("TC-04 — Both contents empty", () => {

    test("returns isEqual=true and diffHtml=null when both inputs are " +
         "empty strings", () => {
      const result = compare_RichTextContent("", "");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("returns isEqual=true and diffHtml=null when both inputs are " +
         "whitespace-only", () => {
      const result = compare_RichTextContent("   ", "\t\n  ");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });
  });


  // -------------------------------------------------------------------------
  // TC-05 — Identical text, formatting differences only (whitespace)
  // -------------------------------------------------------------------------
  describe("TC-05 — Same text, whitespace/formatting differences (REQ-12)", () => {

    test("extra spaces between words are ignored", () => {
      const result = compare_RichTextContent("<p>Hello   world</p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("extra newlines between blocks are ignored", () => {
      const result = compare_RichTextContent(
        "<p>Hello</p>\n\n\n<p>world</p>",
        "<p>Hello</p><p>world</p>"
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("leading and trailing whitespace is ignored", () => {
      const result = compare_RichTextContent("<p>  Hello world  </p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("non-breaking spaces are treated as regular spaces", () => {
      const result = compare_RichTextContent("<p>Hello&nbsp;world</p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("tab characters are treated as spaces", () => {
      const result = compare_RichTextContent("<p>Hello\tworld</p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });
  });


  // -------------------------------------------------------------------------
  // TC-06 — Case differences
  // -------------------------------------------------------------------------
  describe("TC-06 — Case differences (REQ-08)", () => {

    test("'Hello' vs 'hello' → isEqual=false, diffHtml shows the difference", () => {
      const result = compare_RichTextContent("<p>Hello world</p>", "<p>hello world</p>");

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toBeNull();
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });

    test("diffHtml contains the original-case and new-case tokens", () => {
      const result = compare_RichTextContent("<p>Hello world</p>", "<p>hello world</p>");

      expect(stripTags(result.diffHtml)).toMatch(/Hello|hello/);
    });
  });


  // -------------------------------------------------------------------------
  // TC-07 — Different content with special characters and HTML tags
  // -------------------------------------------------------------------------
  describe("TC-07 — Different content with special chars / HTML tags (REQ-10)", () => {

    test("special characters are preserved in text extraction and " +
         "differences are detected", () => {
      const result = compare_RichTextContent(
        "<p>Prix : 10 &euro; TTC</p>",
        "<p>Prix : 12 &euro; TTC</p>"
      );

      expect(result.isEqual).toBe(false);
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });

    test("HTML entities in diffHtml are escaped to prevent XSS", () => {
      const result = compare_RichTextContent(
        "<p>a &lt;script&gt; tag</p>",
        "<p>a &lt;div&gt; tag</p>"
      );

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*<script/i);
      expect(result.diffHtml).not.toMatch(/<ins[^>]*>[^<]*<div/i);
    });

    test("text difference inside deeply nested tags is still detected", () => {
      const result = compare_RichTextContent(
        `<div><section><ul><li><span>Item A</span></li></ul></section></div>`,
        `<div><section><ul><li><span>Item B</span></li></ul></section></div>`
      );

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*A[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*B[^<]*<\/ins>/);
    });
  });


  // -------------------------------------------------------------------------
  // TC-08 — Identical content with special characters and HTML tags
  // -------------------------------------------------------------------------
  describe("TC-08 — Identical content with special chars / HTML tags (REQ-10)", () => {

    test("same text with HTML entities in both → isEqual=true", () => {
      const html = "<p>Prix : 10 &euro; TTC</p>";
      const result = compare_RichTextContent(html, html);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("same text with different entity encoding (numeric vs named) → isEqual=true", () => {
      // &euro; and &#8364; both represent €.
      const result = compare_RichTextContent("<p>10 &euro;</p>", "<p>10 &#8364;</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("same text in differently structured HTML → isEqual=true", () => {
      const result = compare_RichTextContent(
        `<div><p><strong>Hello</strong> <em>world</em></p></div>`,
        `<article><section>Hello world</section></article>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });
  });


  // -------------------------------------------------------------------------
  // TC-09 — Punctuation differences
  // -------------------------------------------------------------------------
  describe("TC-09 — Punctuation differences (REQ-08)", () => {

    test("'Hello, world!' vs 'Hello world' → isEqual=false", () => {
      const result = compare_RichTextContent("<p>Hello, world!</p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(false);
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });

    test("diffHtml reflects the punctuation change", () => {
      const result = compare_RichTextContent("<p>Hello, world!</p>", "<p>Hello world</p>");

      const plain = stripTags(result.diffHtml);
      expect(plain).toMatch(/Hello/);
      expect(plain).toMatch(/world/);
    });
  });


  // -------------------------------------------------------------------------
  // TC-10 — Identical text, various whitespace differences
  // -------------------------------------------------------------------------
  describe("TC-10 — Identical text, whitespace formatting differences ignored (REQ-12)", () => {

    test("mixed spaces, tabs and newlines in source vs clean text in " +
         "target → isEqual=true", () => {
      const result = compare_RichTextContent(
        "<p>Line one\t\t\n   Line two</p>",
        "<p>Line one Line two</p>"
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("zero-width and BOM characters are stripped before comparison " +
         "→ isEqual=true", () => {
      const result = compare_RichTextContent(
        "<p>﻿Hello​ world</p>",
        "<p>Hello world</p>"
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("text split across multiple <br> tags vs single line → isEqual=true", () => {
      const result = compare_RichTextContent("<p>Hello<br/>world</p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });
  });


  // -------------------------------------------------------------------------
  // TC-11 — Identical text, style differences only (REQ-09)
  // -------------------------------------------------------------------------
  describe("TC-11 — Identical text, style differences only (REQ-09)", () => {

    test("inline style attributes removed → isEqual=true", () => {
      const result = compare_RichTextContent(
        `<p style="margin-left:0px">` +
        `<span style="color:rgb(27,28,29);font-size:11pt;font-family:arial">Hello world</span></p>`,
        `<p>Hello world</p>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("bold wrapper vs plain text → isEqual=true", () => {
      const result = compare_RichTextContent("<p><strong>Hello world</strong></p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("italic wrapper vs plain text → isEqual=true", () => {
      const result = compare_RichTextContent("<p><em>Hello world</em></p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("underline wrapper vs plain text → isEqual=true", () => {
      const result = compare_RichTextContent("<p><u>Hello world</u></p>", "<p>Hello world</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("mixed bold + italic + underline vs plain text → isEqual=true", () => {
      const result = compare_RichTextContent(
        "<p><strong><em><u>Hello world</u></em></strong></p>",
        "<p>Hello world</p>"
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("CSS class attributes removed → isEqual=true", () => {
      const result = compare_RichTextContent(
        `<p class="intro"><span class="highlight">Hello world</span></p>`,
        `<p>Hello world</p>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("IBM RDM real-world example (inline style on span) → isEqual=true", () => {
      const result = compare_RichTextContent(
        `<p dir="ltr" id="_18" style="margin-left: 0px;">` +
        `<span style="color: rgb(27,28,29); font-size: 11pt; font-family: arial, helvetica, sans-serif;">` +
        `]Nulla porttitor accumsan tincidunt.[</span></p>`,
        `<p dir="ltr" id="_18">]Nulla porttitor accumsan tincidunt.[</p>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });
  });


  // -------------------------------------------------------------------------
  // TC-STRUCT — Structural indicators (REQ-05, REQ-06, REQ-07)
  // -------------------------------------------------------------------------
  describe("TC-STRUCT — Structural indicators", () => {

    test("REQ-05 — detects images in source and target", () => {
      const result = compare_RichTextContent(
        `<p><img src="img/a.png" alt="A"/></p>`,
        `<p><img src="img/b.png" alt="B"/></p>`
      );

      expect(result.images.srcHasImages).toBe(true);
      expect(result.images.tgtHasImages).toBe(true);
      expect(result.images.srcList).toContain("img/a.png");
      expect(result.images.tgtList).toContain("img/b.png");
    });

    test("REQ-05 — no images present", () => {
      const result = compare_RichTextContent("<p>Text</p>", "<p>Text</p>");

      expect(result.images.srcHasImages).toBe(false);
      expect(result.images.tgtHasImages).toBe(false);
      expect(result.images.srcList).toHaveLength(0);
      expect(result.images.tgtList).toHaveLength(0);
    });

    test("REQ-06 — detects tables in source and target", () => {
      const result = compare_RichTextContent(
        `<table><tr><td>Cell</td></tr></table>`,
        `<p>No table here</p>`
      );

      expect(result.tables.srcHasTables).toBe(true);
      expect(result.tables.tgtHasTables).toBe(false);
    });

    test("REQ-07 — detects IBM embedded resource decorator class", () => {
      const cls = "com-ibm-rdm-editor-EmbeddedResourceDecorator";
      const result = compare_RichTextContent(
        `<span class="${cls}">Embedded</span>`,
        `<p>No embedded resource</p>`
      );

      expect(result.embeddedResources.srcHasEmbedded).toBe(true);
      expect(result.embeddedResources.tgtHasEmbedded).toBe(false);
    });
  });


  // -------------------------------------------------------------------------
  // TC-TABLE — Table handling (REQ-13)
  // -------------------------------------------------------------------------
  describe("TC-TABLE — Table handling (REQ-13)", () => {

    test("TC-TABLE-01 — identical table content → isEqual=true, diffHtml=null", () => {
      const src = `
        <table>
          <thead><tr><th>Name</th><th>Value</th></tr></thead>
          <tbody><tr><td>Alpha</td><td>10</td></tr></tbody>
        </table>`;

      const result = compare_RichTextContent(src, src);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
      expect(result.tables.srcHasTables).toBe(true);
      expect(result.tables.tgtHasTables).toBe(true);
    });

    test("TC-TABLE-02 — different cell value → isEqual=false, diffHtml has diff markers", () => {
      const src = `<table><tbody><tr><td>Alpha</td><td>10</td></tr></tbody></table>`;
      const tgt = `<table><tbody><tr><td>Alpha</td><td>20</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });

    test("TC-TABLE-03 — deleted cell value appears in <del>", () => {
      const src = `<table><tbody><tr><td>Alpha</td><td>10</td></tr></tbody></table>`;
      const tgt = `<table><tbody><tr><td>Alpha</td><td>20</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*10[^<]*<\/del>/);
    });

    test("TC-TABLE-04 — inserted cell value appears in <ins>", () => {
      const src = `<table><tbody><tr><td>Alpha</td><td>10</td></tr></tbody></table>`;
      const tgt = `<table><tbody><tr><td>Alpha</td><td>20</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*20[^<]*<\/ins>/);
    });

    test("TC-TABLE-05 — added row in target → isEqual=false", () => {
      const src = `<table><tbody>
          <tr><td>Row 1</td><td>Val 1</td></tr>
        </tbody></table>`;
      const tgt = `<table><tbody>
          <tr><td>Row 1</td><td>Val 1</td></tr>
          <tr><td>Row 2</td><td>Val 2</td></tr>
        </tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(hasInsertion(result.diffHtml)).toBe(true);
    });

    test("TC-TABLE-06 — removed row in target → isEqual=false", () => {
      const src = `<table><tbody>
          <tr><td>Row 1</td><td>Val 1</td></tr>
          <tr><td>Row 2</td><td>Val 2</td></tr>
        </tbody></table>`;
      const tgt = `<table><tbody>
          <tr><td>Row 1</td><td>Val 1</td></tr>
        </tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(hasDeletion(result.diffHtml)).toBe(true);
    });

    test("TC-TABLE-07 — added column in target → isEqual=false", () => {
      const src = `<table>
          <thead><tr><th>Name</th></tr></thead>
          <tbody><tr><td>Alpha</td></tr></tbody>
        </table>`;
      const tgt = `<table>
          <thead><tr><th>Name</th><th>Value</th></tr></thead>
          <tbody><tr><td>Alpha</td><td>10</td></tr></tbody>
        </table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(hasInsertion(result.diffHtml)).toBe(true);
    });

    test("TC-TABLE-08 — removed column in target → isEqual=false", () => {
      const src = `<table>
          <thead><tr><th>Name</th><th>Value</th></tr></thead>
          <tbody><tr><td>Alpha</td><td>10</td></tr></tbody>
        </table>`;
      const tgt = `<table>
          <thead><tr><th>Name</th></tr></thead>
          <tbody><tr><td>Alpha</td></tr></tbody>
        </table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(hasDeletion(result.diffHtml)).toBe(true);
    });

    test("TC-TABLE-09 — same table content, different cell styles → isEqual=true", () => {
      const src = `
        <table style="border-collapse: collapse; width: 100%;">
          <tbody><tr>
            <td style="border: 1px solid black; padding: 8px;">Alpha</td>
            <td style="border: 1px solid black; padding: 8px;">10</td>
          </tr></tbody>
        </table>`;
      const tgt = `<table><tbody><tr><td>Alpha</td><td>10</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-TABLE-10 — same table content, different CSS classes on cells → isEqual=true", () => {
      const src = `
        <table class="table table-bordered">
          <tbody><tr class="odd">
            <td class="col-name">Alpha</td><td class="col-val">10</td>
          </tr></tbody>
        </table>`;
      const tgt = `<table><tbody><tr><td>Alpha</td><td>10</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-TABLE-11 — same table content, extra whitespace between cells → isEqual=true", () => {
      const src = `<table><tbody><tr><td>   Alpha   </td><td>   10   </td></tr></tbody></table>`;
      const tgt = `<table><tbody><tr><td>Alpha</td><td>10</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-TABLE-12 — identical nested tables → isEqual=true", () => {
      const src = `
        <table><tbody><tr><td>
          Outer cell
          <table><tbody><tr><td>Inner cell</td></tr></tbody></table>
        </td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, src);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-TABLE-13 — difference in nested table cell → isEqual=false", () => {
      const src = `<table><tbody><tr><td>Outer
          <table><tbody><tr><td>Inner A</td></tr></tbody></table>
        </td></tr></tbody></table>`;
      const tgt = `<table><tbody><tr><td>Outer
          <table><tbody><tr><td>Inner B</td></tr></tbody></table>
        </td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*A[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*B[^<]*<\/ins>/);
    });

    test("TC-TABLE-14 — table mixed with surrounding text, no difference → isEqual=true", () => {
      const html = `
        <p>Introduction text</p>
        <table><tbody><tr><td>Cell A</td><td>Cell B</td></tr></tbody></table>
        <p>Conclusion text</p>`;

      const result = compare_RichTextContent(html, html);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-TABLE-15 — table mixed with surrounding text, difference in cell → isEqual=false", () => {
      const src = `
        <p>Introduction text</p>
        <table><tbody><tr><td>Cell A</td><td>Old value</td></tr></tbody></table>
        <p>Conclusion text</p>`;
      const tgt = `
        <p>Introduction text</p>
        <table><tbody><tr><td>Cell A</td><td>New value</td></tr></tbody></table>
        <p>Conclusion text</p>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
    });

    test("TC-TABLE-16 — difference in surrounding text only, table unchanged " +
         "→ stable cell not in diff markers", () => {
      const src = `
        <p>Before text</p>
        <table><tbody><tr><td>Stable cell</td></tr></tbody></table>`;
      const tgt = `
        <p>After text</p>
        <table><tbody><tr><td>Stable cell</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Stable[^<]*<\/del>/);
      expect(result.diffHtml).not.toMatch(/<ins[^>]*>[^<]*Stable[^<]*<\/ins>/);
    });

    test("TC-TABLE-17 — identical table with caption → isEqual=true", () => {
      const html = `
        <table>
          <caption>My table</caption>
          <tbody><tr><td>Data</td></tr></tbody>
        </table>`;

      const result = compare_RichTextContent(html, html);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-TABLE-18 — different caption text → isEqual=false", () => {
      const src = `<table><caption>Caption A</caption><tbody><tr><td>Data</td></tr></tbody></table>`;
      const tgt = `<table><caption>Caption B</caption><tbody><tr><td>Data</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*A[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*B[^<]*<\/ins>/);
    });
  });


  // -------------------------------------------------------------------------
  // TC-LIST — List handling
  // -------------------------------------------------------------------------
  describe("TC-LIST — List handling", () => {

    test("TC-LIST-01 — identical unordered list → isEqual=true", () => {
      const html = `<ul><li>Item A</li><li>Item B</li><li>Item C</li></ul>`;

      const result = compare_RichTextContent(html, html);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-LIST-02 — changed word inside a list item → isEqual=false, diff markers present", () => {
      const result = compare_RichTextContent(
        `<ul><li>Item A</li><li>Old value</li></ul>`,
        `<ul><li>Item A</li><li>New value</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });

    test("TC-LIST-03 — deleted word in <del>, inserted word in <ins>", () => {
      const result = compare_RichTextContent(
        `<ul><li>Item A</li><li>Old value</li></ul>`,
        `<ul><li>Item A</li><li>New value</li></ul>`
      );

      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
    });

    test("TC-LIST-04 — item added in target → isEqual=false even when aggregate text is unchanged", () => {
      // Same words, different item boundaries.
      const result = compare_RichTextContent(
        `<ul><li>Item A Item B</li></ul>`,
        `<ul><li>Item A</li><li>Item B</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasInsertion(result.diffHtml)).toBe(true);
    });

    test("TC-LIST-05 — item removed from target → isEqual=false even when aggregate text is unchanged", () => {
      const result = compare_RichTextContent(
        `<ul><li>Item A</li><li>Item B</li></ul>`,
        `<ul><li>Item A Item B</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasDeletion(result.diffHtml)).toBe(true);
    });

    test("TC-LIST-06 — item appended at end of list → isEqual=false", () => {
      const result = compare_RichTextContent(
        `<ul><li>Alpha</li><li>Beta</li></ul>`,
        `<ul><li>Alpha</li><li>Beta</li><li>Gamma</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasInsertion(result.diffHtml)).toBe(true);
    });

    test("TC-LIST-07 — item removed from end of list → isEqual=false", () => {
      const result = compare_RichTextContent(
        `<ul><li>Alpha</li><li>Beta</li><li>Gamma</li></ul>`,
        `<ul><li>Alpha</li><li>Beta</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasDeletion(result.diffHtml)).toBe(true);
    });

    test("TC-LIST-08 — item inserted in the middle → isEqual=false", () => {
      const result = compare_RichTextContent(
        `<ul><li>First</li><li>Last</li></ul>`,
        `<ul><li>First</li><li>Middle</li><li>Last</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasInsertion(result.diffHtml)).toBe(true);
    });

    test("TC-LIST-09 — same items, <ul> vs <ol> → isEqual=true (list type is formatting)", () => {
      const result = compare_RichTextContent(
        `<ul><li>Alpha</li><li>Beta</li></ul>`,
        `<ol><li>Alpha</li><li>Beta</li></ol>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-LIST-10 — same items, bold / italic inside items → isEqual=true", () => {
      const result = compare_RichTextContent(
        `<ul><li><strong>Alpha</strong></li><li><em>Beta</em></li></ul>`,
        `<ul><li>Alpha</li><li>Beta</li></ul>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-LIST-10b — same items, extra whitespace inside items → isEqual=true", () => {
      const result = compare_RichTextContent(
        `<ul><li>  Alpha  </li><li>  Beta  </li></ul>`,
        `<ul><li>Alpha</li><li>Beta</li></ul>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-LIST-11 — same items, inline style on <li> → isEqual=true", () => {
      const result = compare_RichTextContent(
        `<ul>
          <li style="color: red; font-weight: bold;">Alpha</li>
          <li style="margin-left: 20px;">Beta</li>
        </ul>`,
        `<ul><li>Alpha</li><li>Beta</li></ul>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-LIST-12 — identical definition list → isEqual=true", () => {
      const html = `<dl><dt>Term A</dt><dd>Definition A</dd></dl>`;

      const result = compare_RichTextContent(html, html);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-LIST-13 — definition entry added in target → isEqual=false", () => {
      const result = compare_RichTextContent(
        `<dl><dt>Term A</dt><dd>Definition A</dd></dl>`,
        `<dl><dt>Term A</dt><dd>Definition A</dd><dt>Term B</dt><dd>Definition B</dd></dl>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasInsertion(result.diffHtml)).toBe(true);
    });

    test("TC-LIST-14 — identical nested list → isEqual=true", () => {
      const html = `<ul>
        <li>Parent A<ul><li>Child 1</li><li>Child 2</li></ul></li>
      </ul>`;

      const result = compare_RichTextContent(html, html);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-LIST-15 — child item added in nested list → isEqual=false", () => {
      const result = compare_RichTextContent(
        `<ul><li>Parent A<ul><li>Child 1</li></ul></li></ul>`,
        `<ul><li>Parent A<ul><li>Child 1</li><li>Child 2</li></ul></li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasInsertion(result.diffHtml)).toBe(true);
    });

    test("TC-LIST-16 — changed text in nested list item → isEqual=false", () => {
      const result = compare_RichTextContent(
        `<ul><li>Top<ul><li>Inner Old</li></ul></li></ul>`,
        `<ul><li>Top<ul><li>Inner New</li></ul></li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
    });
  });


  // -------------------------------------------------------------------------
  // TC-ORDER — Document order preservation
  // Vérifie que les éléments du diff (texte, tableau, liste) apparaissent
  // dans le même ordre que dans le document source, et non groupés par type.
  // -------------------------------------------------------------------------
  describe("TC-ORDER — Document order preservation", () => {

    test("TC-ORDER-01 — heading + table + trailing text, all identical → isEqual=true", () => {
      const html = `
        <p>Table heading</p>
        <table><tbody><tr><td>Cell</td></tr></tbody></table>
        <p>Following text</p>`;

      const result = compare_RichTextContent(html, html);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-ORDER-02 — table diff appears between the heading and the " +
         "trailing paragraph in diffHtml", () => {
      const src = `
        <p>My heading</p>
        <table><tbody><tr><td>Old value</td></tr></tbody></table>
        <p>Following paragraph</p>`;
      const tgt = `
        <p>My heading</p>
        <table><tbody><tr><td>New value</td></tr></tbody></table>
        <p>Following paragraph</p>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);

      const headingPos = result.diffHtml.indexOf("My heading");
      const tablePos   = result.diffHtml.indexOf("rte-diff-table");
      const paraPos    = result.diffHtml.indexOf("Following paragraph");

      expect(headingPos).toBeGreaterThanOrEqual(0);
      expect(tablePos).toBeGreaterThanOrEqual(0);
      expect(paraPos).toBeGreaterThanOrEqual(0);
      // Order: heading → table → paragraph
      expect(headingPos).toBeLessThan(tablePos);
      expect(tablePos).toBeLessThan(paraPos);
    });

    test("TC-ORDER-03 — only table cell differs: surrounding headings/paragraphs " +
         "not in diff markers", () => {
      const src = `
        <p>Stable heading</p>
        <table><tbody><tr><td>Old</td></tr></tbody></table>
        <p>Stable conclusion</p>`;
      const tgt = `
        <p>Stable heading</p>
        <table><tbody><tr><td>New</td></tr></tbody></table>
        <p>Stable conclusion</p>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Stable[^<]*<\/del>/);
      expect(result.diffHtml).not.toMatch(/<ins[^>]*>[^<]*Stable[^<]*<\/ins>/);
    });

    test("TC-ORDER-04 — only the heading changes: table and trailing text not " +
         "in diff markers", () => {
      const src = `
        <p>Old heading</p>
        <table><tbody><tr><td>Stable cell</td></tr></tbody></table>
        <p>Stable trailing text</p>`;
      const tgt = `
        <p>New heading</p>
        <table><tbody><tr><td>Stable cell</td></tr></tbody></table>
        <p>Stable trailing text</p>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Stable[^<]*<\/del>/);
      expect(result.diffHtml).not.toMatch(/<ins[^>]*>[^<]*Stable[^<]*<\/ins>/);
    });

    test("TC-ORDER-05 — only the trailing paragraph changes: heading and table " +
         "not in diff markers", () => {
      const src = `
        <p>Stable heading</p>
        <table><tbody><tr><td>Stable cell</td></tr></tbody></table>
        <p>Old conclusion</p>`;
      const tgt = `
        <p>Stable heading</p>
        <table><tbody><tr><td>Stable cell</td></tr></tbody></table>
        <p>New conclusion</p>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Stable[^<]*<\/del>/);
      expect(result.diffHtml).not.toMatch(/<ins[^>]*>[^<]*Stable[^<]*<\/ins>/);
    });

    test("TC-ORDER-06 — multiple tables each paired with their counterpart " +
         "by position", () => {
      // The diff engine splits the changed word out of the equal prefix,
      // so we assert that "Old" appears in a <del> and the output contains
      // two rte-diff-table blocks (one per table).
      const src = `
        <table><tbody><tr><td>Table 1 Old</td></tr></tbody></table>
        <p>Separator</p>
        <table><tbody><tr><td>Table 2 Old</td></tr></tbody></table>`;
      const tgt = `
        <table><tbody><tr><td>Table 1 New</td></tr></tbody></table>
        <p>Separator</p>
        <table><tbody><tr><td>Table 2 New</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      // Both "Old" tokens must appear inside <del> elements.
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      // Two separate rte-diff-table blocks must be present.
      expect((result.diffHtml.match(/rte-diff-table/g) || []).length).toBeGreaterThanOrEqual(2);
    });

    test("TC-ORDER-06b — content wrapped in outer <div>: table is still detected " +
         "and appears between heading and trailing text", () => {
      // ERM rich text often wraps all content in an outer <div>. The table
      // must still be detected as a structured segment (not flattened into text).
      const src = `<div>
        <p>My heading</p>
        <table><tbody><tr><td>Old value</td></tr></tbody></table>
        <p>Trailing paragraph</p>
      </div>`;
      const tgt = `<div>
        <p>My heading</p>
        <table><tbody><tr><td>New value</td></tr></tbody></table>
        <p>Trailing paragraph</p>
      </div>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      // Table diff must be present (not flattened into plain text).
      expect(result.diffHtml).toContain("rte-diff-table");
      // Document order: heading → table → paragraph.
      const headingPos = result.diffHtml.indexOf("My heading");
      const tablePos   = result.diffHtml.indexOf("rte-diff-table");
      const paraPos    = result.diffHtml.indexOf("Trailing paragraph");
      expect(headingPos).toBeLessThan(tablePos);
      expect(tablePos).toBeLessThan(paraPos);
      // Table content changes detected.
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
      // Stable surrounding text not in diff markers.
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*My heading[^<]*<\/del>/);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Trailing[^<]*<\/del>/);
    });

    test("TC-ORDER-06c — content wrapped in multiple nested <div>s: table is still detected", () => {
      const src = `<div><div>
        <p>Heading</p>
        <table><tbody><tr><td>Old</td></tr></tbody></table>
        <p>Footer</p>
      </div></div>`;
      const tgt = `<div><div>
        <p>Heading</p>
        <table><tbody><tr><td>New</td></tr></tbody></table>
        <p>Footer</p>
      </div></div>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toContain("rte-diff-table");
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
    });

    test("TC-ORDER-07 — list appears in document position between two text blocks", () => {
      const src = `
        <p>Intro</p>
        <ul><li>Old item</li></ul>
        <p>Outro</p>`;
      const tgt = `
        <p>Intro</p>
        <ul><li>New item</li></ul>
        <p>Outro</p>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);

      const introPos = result.diffHtml.indexOf("Intro");
      const listPos  = result.diffHtml.indexOf("rte-diff-list");
      const outroPos = result.diffHtml.indexOf("Outro");

      expect(introPos).toBeGreaterThanOrEqual(0);
      expect(listPos).toBeGreaterThanOrEqual(0);
      expect(outroPos).toBeGreaterThanOrEqual(0);
      // Order: intro → list → outro
      expect(introPos).toBeLessThan(listPos);
      expect(listPos).toBeLessThan(outroPos);
    });
  });


  // -------------------------------------------------------------------------
  // TC-ROBUSTNESS — Robustness / edge-case inputs
  // -------------------------------------------------------------------------
  describe("TC-ROBUSTNESS — Robustness / edge-case inputs", () => {

    test("TC-ROBUSTNESS-01 — null source is treated as empty string", () => {
      const result = compare_RichTextContent(null, "<p>Text</p>");

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toBeNull();
      expect(hasInsertion(result.diffHtml)).toBe(true);
    });

    test("TC-ROBUSTNESS-02 — null target is treated as empty string", () => {
      const result = compare_RichTextContent("<p>Text</p>", null);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toBeNull();
      expect(hasDeletion(result.diffHtml)).toBe(true);
    });

    test("TC-ROBUSTNESS-03 — both inputs null → isEqual=true, diffHtml=null", () => {
      const result = compare_RichTextContent(null, null);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-ROBUSTNESS-04 — undefined inputs treated as empty string", () => {
      const result = compare_RichTextContent(undefined, undefined);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-ROBUSTNESS-05 — <script> sibling to text is stripped before comparison", () => {
      const result = compare_RichTextContent(
        "<div><p>Visible</p><script>alert('xss')</script><p>text</p></div>",
        "<div><p>Visible</p><p>text</p></div>"
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-ROBUSTNESS-06 — <style> sibling to text is stripped before comparison", () => {
      const result = compare_RichTextContent(
        "<div><p>Text</p><style>.hidden { display:none }</style></div>",
        "<div><p>Text</p></div>"
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-ROBUSTNESS-07 — <script> content does not appear in diffHtml (XSS prevention)", () => {
      const result = compare_RichTextContent(
        "<p>Before</p>",
        "<div><p>After</p><script>alert('xss')</script></div>"
      );

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).not.toMatch(/alert/i);
    });

    test("TC-ROBUSTNESS-08 — soft hyphen (U+00AD) is stripped", () => {
      const result = compare_RichTextContent(
        "<p>dis­conti­nuity</p>",
        "<p>discontinuity</p>"
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-ROBUSTNESS-09 — zero-width joiner and non-joiner are stripped", () => {
      const result = compare_RichTextContent("<p>a‌b‍c</p>", "<p>abc</p>");

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });
  });


  // -------------------------------------------------------------------------
  // TC-API — Return value structure
  // -------------------------------------------------------------------------
  describe("TC-API — Return value structure", () => {

    test("TC-API-01 — equal content: all 5 result properties are present", () => {
      const result = compare_RichTextContent("<p>Hello</p>", "<p>Hello</p>");

      expect(result).toHaveProperty("isEqual");
      expect(result).toHaveProperty("diffHtml");
      expect(result).toHaveProperty("images");
      expect(result).toHaveProperty("tables");
      expect(result).toHaveProperty("embeddedResources");
    });

    test("TC-API-02 — different content: all 5 result properties are present", () => {
      const result = compare_RichTextContent("<p>A</p>", "<p>B</p>");

      expect(result).toHaveProperty("isEqual");
      expect(result).toHaveProperty("diffHtml");
      expect(result).toHaveProperty("images");
      expect(result).toHaveProperty("tables");
      expect(result).toHaveProperty("embeddedResources");
    });

    test("TC-API-03 — images sub-object always has srcList and tgtList arrays", () => {
      const result = compare_RichTextContent("<p>Text</p>", "<p>Text</p>");

      expect(Array.isArray(result.images.srcList)).toBe(true);
      expect(Array.isArray(result.images.tgtList)).toBe(true);
    });

    test("TC-API-04 — isEqual=true implies diffHtml=null (invariant)", () => {
      const cases = [
        ["<p>Same</p>",                              "<p>Same</p>"],
        ["",                                         ""],
        ["<ul><li>A</li></ul>",                      "<ul><li>A</li></ul>"],
        ["<table><tr><td>X</td></tr></table>",       "<table><tr><td>X</td></tr></table>"],
      ];
      for (const [src, tgt] of cases) {
        const result = compare_RichTextContent(src, tgt);
        if (result.isEqual) {
          expect(result.diffHtml).toBeNull();
        }
      }
    });

    test("TC-API-05 — isEqual=false implies diffHtml is a non-empty string", () => {
      const result = compare_RichTextContent("<p>A</p>", "<p>B</p>");

      expect(result.isEqual).toBe(false);
      expect(typeof result.diffHtml).toBe("string");
      expect(result.diffHtml.length).toBeGreaterThan(0);
    });
  });


  // -------------------------------------------------------------------------
  // TC-IMG-CONTENT — Images and text comparison
  // -------------------------------------------------------------------------
  describe("TC-IMG-CONTENT — Images and text comparison", () => {

    test("TC-IMG-CONTENT-01 — different images, same surrounding text " +
         "→ isEqual=true (images are not text content)", () => {
      const result = compare_RichTextContent(
        `<p>Caption</p><img src="photo-a.png"/>`,
        `<p>Caption</p><img src="photo-b.png"/>`
      );

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
      expect(result.images.srcList).toContain("photo-a.png");
      expect(result.images.tgtList).toContain("photo-b.png");
    });

    test("TC-IMG-CONTENT-02 — same images, different surrounding text → isEqual=false", () => {
      const result = compare_RichTextContent(
        `<p>Old caption</p><img src="photo.png"/>`,
        `<p>New caption</p><img src="photo.png"/>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });

    test("TC-IMG-CONTENT-03 — <img> without src is not counted as an image", () => {
      const src = `<p><img alt="no src"/></p>`;
      const result = compare_RichTextContent(src, src);

      expect(result.images.srcHasImages).toBe(false);
      expect(result.images.srcList).toHaveLength(0);
    });

    test("TC-IMG-CONTENT-04 — <img> with empty src is not counted as an image", () => {
      const src = `<p><img src="" alt="empty"/></p>`;
      const result = compare_RichTextContent(src, src);

      expect(result.images.srcHasImages).toBe(false);
    });

    test("TC-IMG-CONTENT-05 — multiple images: srcList preserves document order", () => {
      const src = `<img src="first.png"/><img src="second.png"/><img src="third.png"/>`;
      const result = compare_RichTextContent(src, src);

      expect(result.images.srcList).toEqual(["first.png", "second.png", "third.png"]);
    });
  });


  // -------------------------------------------------------------------------
  // TC-MIX — Mixed structured content (text + list + table)
  // -------------------------------------------------------------------------
  describe("TC-MIX — Mixed structured content", () => {

    test("TC-MIX-01 — surrounding text changes, list unchanged → " +
         "stable list items not in diff markers", () => {
      const result = compare_RichTextContent(
        `<p>Before text</p><ul><li>Stable item</li></ul>`,
        `<p>After text</p><ul><li>Stable item</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Stable[^<]*<\/del>/);
      expect(result.diffHtml).not.toMatch(/<ins[^>]*>[^<]*Stable[^<]*<\/ins>/);
    });

    test("TC-MIX-02 — list changes, surrounding text unchanged → " +
         "stable text not in diff markers", () => {
      const result = compare_RichTextContent(
        `<p>Stable text</p><ul><li>Old item</li></ul>`,
        `<p>Stable text</p><ul><li>New item</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Stable[^<]*<\/del>/);
      expect(result.diffHtml).not.toMatch(/<ins[^>]*>[^<]*Stable[^<]*<\/ins>/);
    });

    test("TC-MIX-03 — two lists, only second differs → first list unchanged", () => {
      const result = compare_RichTextContent(
        `<ul><li>Stable A</li></ul><ul><li>Old B</li></ul>`,
        `<ul><li>Stable A</li></ul><ul><li>New B</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Stable[^<]*<\/del>/);
    });

    test("TC-MIX-04 — text + list + table: change only in list", () => {
      const src = `
        <p>Introduction</p>
        <ul><li>Old item</li></ul>
        <table><tbody><tr><td>Stable cell</td></tr></tbody></table>`;
      const tgt = `
        <p>Introduction</p>
        <ul><li>New item</li></ul>
        <table><tbody><tr><td>Stable cell</td></tr></tbody></table>`;

      const result = compare_RichTextContent(src, tgt);

      expect(result.isEqual).toBe(false);
      expect(result.diffHtml).toMatch(/<del[^>]*>[^<]*Old[^<]*<\/del>/);
      expect(result.diffHtml).toMatch(/<ins[^>]*>[^<]*New[^<]*<\/ins>/);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Stable[^<]*<\/del>/);
      expect(result.diffHtml).not.toMatch(/<del[^>]*>[^<]*Introduction[^<]*<\/del>/);
    });

    test("TC-MIX-05 — text + list + table: all three unchanged → isEqual=true", () => {
      const html = `
        <p>Introduction</p>
        <ul><li>Item A</li><li>Item B</li></ul>
        <table><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody></table>
        <p>Conclusion</p>`;

      const result = compare_RichTextContent(html, html);

      expect(result.isEqual).toBe(true);
      expect(result.diffHtml).toBeNull();
    });

    test("TC-MIX-06 — list nested inside table cell: change detected", () => {
      const result = compare_RichTextContent(
        `<table><tbody><tr><td><ul><li>Cell list item A</li></ul></td></tr></tbody></table>`,
        `<table><tbody><tr><td><ul><li>Cell list item B</li></ul></td></tr></tbody></table>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });

    test("TC-MIX-07 — same list items in different order → isEqual=false", () => {
      // Items compared by position, so order swap is a change.
      const result = compare_RichTextContent(
        `<ul><li>Alpha</li><li>Beta</li></ul>`,
        `<ul><li>Beta</li><li>Alpha</li></ul>`
      );

      expect(result.isEqual).toBe(false);
      expect(hasDiffMarkers(result.diffHtml)).toBe(true);
    });
  });

});
