# Editable source and rebuild

The deliverable is editable as Python layout code plus UTF-8 JSON/Markdown data. All local raster art, SVG symbols and fonts used to rebuild the PDFs are included. PDFs contain selectable text and vector frames; previews are review images, not editable masters.

| File | Purpose |
|---|---|
| `components.json` | Twelve soul templates, all starter instances, memory alternatives, events, map, costs, resources, escalation and exact phase order |
| `extract_rules.py` | Recreate structured data from the pinned rules snapshot; explicit printed copy/constants require review on a rule revision |
| `build.py` | Editable cards, counters, boards, trackers, guides, references, forms and continuation layouts |
| `drawing.py` | A4 geometry, fonts, text, contained art, simple SVG rendering and layout logging |
| `asset_manifest.json` | Reused assets, upstream paths, hashes and raster dimensions |
| `source_snapshot.json` | Rules, contract and art-reference source hashes and last commits |
| `page_index.json` | Generated section counts and complete-PDF page ranges |
| `validate.py` | Component, source, type, margin, calibration, font, route and overlap checks |
| `render.py` | Render all PDFs, compare all section pages with master pages, create final previews |
| `component_walkthrough.py` | Bounded agent desk walkthrough, recording-field checks and arithmetic; not a game engine |
| `package.py` | Build the final ZIP and verify all archived bytes against the delivery and manifest |

## Reproduce

Requires already available Python 3 with ReportLab, Pillow, pypdf and pdfplumber, plus Poppler's `pdftoppm` and `pdffonts` on PATH. No dependencies were installed during production. Printing and playing do not require any of these tools.

From the kit folder, use a Python interpreter with those modules. In the production environment it was `/Users/supa/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3.12`. The generic commands below avoid tying the source package to that machine:

```text
python source/extract_rules.py
python source/build.py
python source/validate.py
python source/render.py
python source/component_walkthrough.py
```

`extract_rules.py` intentionally stops if the bundled source-rules hash changes. For approved revisions, update/re-audit constants, effect wording, phase order and layouts together. If editing `components.json` directly for an authorized revision, do not run the extractor afterward until its definitions also reflect the change. Regenerate and inspect every affected output, update the inventory/provenance/check evidence, then package last.

`render.py` uses `CHARON_WORK_DIR` when set; otherwise it places duplicate renders, review spreads and font cache under the repository's `work/workshop-kit-v0.3/`. Set that variable to a scratch folder when rebuilding an extracted ZIP outside the repository. Only final master-page previews are saved inside the deliverable. The renderer marks visual inspection pending because it cannot perform or certify a human/agent visual review itself.

After inspecting all pages and grayscale samples, update `validation/visual_review.json` with the actual review scope, current PDF hash and preview hashes. Do not preserve a PASS record across unreviewed changes. `package.py` checks those hashes, the static results and the walkthrough's PDF hash before packaging:

```text
python source/package.py
python source/package.py --verify
```

The ZIP is written beside the kit folder. `PACKAGE_MANIFEST.json` is inside the ZIP and lists payload hashes. `validation/package_check.json` is a separate post-build receipt in the delivery folder; it is deliberately excluded from the ZIP and manifest to prevent a recursive hash. Bytecode, OS metadata, scratch renders and the ZIP itself are excluded. Never package before the final edits and review.
