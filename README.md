# AGS Diff Module

AGS Diff Module is a JavaScript/jQuery widget for IBM Engineering Requirements Management (ERM, DOORS Next) that compares two versions of a module, each taken from a configuration (stream, baseline or change set) of the same component, and lists every difference artifact by artifact.

The results are shown in a filterable table and can be exported as a self-contained HTML report. The report is meant to be attached to the technical specifications of complex systems and read by engineers and technical auditors.

| | |
|---|---|
| Version | v2026a |
| Target application | ERM (DOORS Next), OSLC configuration management enabled |
| Compare mode | *Local Conf* (configuration vs configuration on the same RM server) |

## Features

- **Context selection** — Project → Component → Old Configuration / Old Module → New Configuration / New Module, with a status icon (loading, success, error, warning) next to each selector.
- **Configuration filter** — each configuration list can be narrowed to streams, baselines or change sets.
- **Identical configurations check** — an "Identical configurations !" warning is shown, and the module list stays disabled, while Old and New point to the same configuration.
- **Module loading** — **Load Modules** reads both modules (structure, then the content of every artifact, 5 REST requests in parallel at most) and shows, for each side, the module name, ID, last modification date, artifact count and the count by artifact type.
- **Comparison** — **Compare All** detects the following differences (labels as displayed):

  | Difference | Detected when |
  |---|---|
  | New Artifact / Artifact Deleted | the artifact is only in the New / only in the Old module |
  | Artifact Type Has Changed | the artifact type differs |
  | Custom Attribut Has Changed / Cleared / Filled | a custom attribute value differs, is emptied, or is filled |
  | Tag Has Changed | the tag list differs |
  | Content Has Changed | the *Primary Text* differs (text, tables, formatting — see `js/richTextCompare.js`) |
  | Embedded Image Has Changed / New embedded image / Image deleted | an embedded image is replaced, added or removed |
  | Image not found in new / old module ! | an embedded image cannot be read on one side |

  A summary of the counts by category is shown under *New Module Info*.
- **Display Results** — a DataTables table (ID, Type, Section, Diff Label, Attribute, Old/New Value, Old/New Content) sorted by position in the module, with search panes on Type, Diff Label and Attribute, colored rows and a rich rendering of the content differences.
- **Exports** — the rows **currently visible** in the table (DataTables filter applied) are exported as a styled, self-contained HTML file `<New module name>_diff_report.html`, in English, printable, with an embedded filter and search box:
  - **Standard Report** — one row per difference;
  - **Compact Export** — one row per artifact, combining all its differences; columns for artifact type and custom attributes are added only when such changes exist.

  The download goes through the top-level window so that it is not blocked by the `frame-src` Content Security Policy of the Jazz page.

**Scope:** only artifacts of format **Text** are analyzed. Artifacts of another format (diagram, attached file…) are only reported when they are created or deleted, with the type `Format Not Supported`. A *ReqIF* compare mode exists in the code (`js/AGS_reqif.js`) but cannot be selected from the interface (`COMPARE_MODE_LABEL` in `js/AGS_view.js` has a single entry).

## Tech stack

- [jQuery 3.7.1](https://jquery.com/) (MIT), bundled in `lib/jquery/`
- [js-sha256 1.0.0](https://github.com/emn178/js-sha256) (MIT), bundled in `lib/utils/` — hashing of inline base64 images for the content comparison
- [JSZip 3.1.5](https://stuk.github.io/jszip/) (MIT or GPLv3), bundled in `lib/utils/` — reading of ReqIFz archives (ReqIF mode)
- [Bootstrap 5.3.3](https://getbootstrap.com/) + [Bootstrap Icons 1.13.1](https://icons.getbootstrap.com/), [Handlebars 4.7.8](https://handlebarsjs.com/), [DataTables 2.1.8](https://datatables.net/) with its SearchPanes, Buttons, Select and FixedHeader extensions (MIT), **not bundled**: loaded from the shared library `../ELM_sharedLib/` of the hosting server
- Packaged as an [OpenSocial](https://opensocial.github.io/spec/2.5.1/Core-Gadget.xml.html) gadget (`main.xml`) for deployment inside an ERM dashboard

## Project structure

```
main.xml                 OpenSocial gadget declaration (UserPref JAZZ_RMHOSTNAME)
main.html                Widget markup and Handlebars templates (statistics, export report)
css/widget.css           Styles
js/                      Application code, one responsibility per file
  AGS_main.js              Entry point (RM hostname, REST queues, view initialization)
  AGS_controler.js         REST request queue (QueueManager) and AJAX calls
  AGS_utils.js             Generic helpers and GUI gadget actions
  OSLC_NameSpace.js        RDF / OSLC namespaces
  ERM_classes.js           Data model: project, component, configuration, module, artifact
  ERM_getConfig.js         Reading of projects, components and configurations
  ERM_getContent.js        Reading of the module structure and of the artifact contents
  AGS_cmptools.js          Comparison of the two modules, difference model (ClassDiffResult)
  richTextCompare.js       Comparison of two Primary Text (rich text) fragments
  AGS_reqif.js             ReqIF / ReqIFz reading (mode not exposed in the interface)
  AGS_view.js              Interface state and events, results table
  export_Report.js         Standard / Compact HTML exports
lib/                     jQuery 3.7.1, JSZip 3.1.5, js-sha256 1.0.0
resources/               Icons, preview and thumbnail images
recette/                 Manual acceptance test cases for ETM (in French)
tests/                   Jest + jsdom configuration (no test file yet)
spec-export_report.txt   Original request for the HTML export (in French)
```

`ClassDiffResult.META` (in `js/AGS_cmptools.js`) is the single place that defines, for each kind of difference, its label, its colors and the cells it fills. The results table and both exports read it, so a new kind of difference, or a change in how one is shown, is made there only.

## Deployment

1. Copy the widget folder next to `ELM_sharedLib/` on the server, so that `../ELM_sharedLib/bootstrap/5.3.3/`, `../ELM_sharedLib/handlebars/` and `../ELM_sharedLib/datatables/` resolve from `main.html`.
2. Register `main.xml` as an OpenSocial gadget in ERM and add it to a dashboard.
3. In the widget preferences, set **RM Hostname** (`JAZZ_RMHOSTNAME`) to the RM server, e.g. `https://rm-host-fqdn:port`. Outside a gadget container, the widget falls back to `RM_HOSTNAME_STATIC` in `js/AGS_main.js`.

When the RM server is not the server hosting the widget, its CORS policy must allow requests with credentials from the hosting server.

## Usage

1. Select the **Project** and the **Component**.
2. Select the **Old** configuration and module, then the **New** configuration and module (use the Stream / Baseline / Changeset buttons to filter the lists).
3. Click **Load Modules** and wait until both modules are loaded (progress shown under *New Module Info*).
4. Click **Compare All**: the summary of the differences is displayed.
5. Click **Display Results**, filter the table if needed, then click **Standard Report** or **Compact Export** to download the report of the visible rows.

## Tests

[recette/](recette/README.md) holds 14 manual acceptance test cases, written in French, to be entered in IBM Engineering Test Management (ETM):

- TC-01 to TC-03 — context selection, configuration filter, identical configurations;
- TC-04 to TC-09 — detection of the differences (created/deleted artifacts, type, custom attributes, tags, Primary Text, embedded images);
- TC-10 to TC-12 — results window and both exports;
- TC-13 and TC-14 — no difference, blocking errors.

The [recette/README.md](recette/README.md) file lists the test data the RM project must contain. The ReqIF mode is out of scope.

`tests/` is set up for Jest with jsdom (`cd tests && npm install && npm test`) but holds no test file yet; the tests of `richTextCompare.js` are kept in a separate project.

## Copyright

(C) Copyright 2019-2026 by Safran Aircraft Engines — All rights reserved. Third-party libraries keep their own licenses (see above).
