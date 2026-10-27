# Steel Shop Drawing Review — Rebuilt MVP

React + Vite browser-based steel shop drawing review tool. The existing GitHub Pages workflow and Vite base path `/quickshop/` are preserved.

## Run locally

```bash
npm install
npm run dev
npm run build
```

## Workflow

1. Upload structural drawings and steel shop drawings.
2. Navigate both PDF viewers independently.
3. Click **Analyze PDFs** to extract selectable text from the first 120 pages of each file. Large submittals are deliberately capped for responsiveness.
4. Review detected shop erection-plan titles and structural references. Select the level manually when not detected.
5. **Enter structural and shop PDF page ranges manually** (for example `7,12-15`). Only those pages are compared; the app never compares all levels by default.
6. Review candidate steel section occurrences and grid text, then draft manual comments with PDF page references.
7. Export comments to CSV.

## Supported detection

- Level from framing/erection titles when extractable: ROOF, L1–L15, B1–B5, etc.
- S-series structural drawing reference tokens.
- W, S, M, HP, C, MC and HSS section candidates.
- Grid notation such as `A/15-11`.
- Page-specific candidate comparison.

## Engineering limitations

**This MVP does not geometrically align grids or verify that an individual beam occupies the correct span.** Shapes and grid strings are extracted independently. "In both selections" does not mean an individual member matches. Missing shapes are candidates, not verified discrepancies. Scanned drawings may require OCR. Fabrication pages may not contain floor titles; use explicit PDF page selection. Only the first 120 pages are analyzed, so for 1,425-page shop submittals use smaller PDFs containing the relevant erection plans or a future chunked scan feature.

No structural approval is automated. Engineer confirmation is required for all findings. PDFs stay in the browser. Comments are stored locally in browser localStorage and are not shared or backed up except by CSV export. Clearing browser data may delete comments.

## Deployment

Merge the feature PR to `main`; the existing GitHub Actions Pages workflow builds `dist`. Set repository Settings → Pages → Source to GitHub Actions. Website: https://zixuanhuang970404-code.github.io/quickshop/

## Validation

Build and browser tests must be completed before merging. Test both text-based and scanned PDFs, plus manual page fallback.
