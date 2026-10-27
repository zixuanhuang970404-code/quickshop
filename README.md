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
4. The app groups recognized shop erection plans by level and attempts to pair corresponding structural pages automatically. The app displays candidate findings for every detected level automatically, with no level selection.
5. No manual level selection or PDF page entry is required. Only same-level automatically paired pages are compared; unpaired pages are excluded and flagged for review.
6. Review candidate steel section occurrences and grid text for each detected level, then draft manual comments with PDF page references.
7. Export comments to CSV.

## Supported detection

- Level from framing/erection titles when extractable: ROOF, L1–L15, B1–B5, etc.
- S-series structural drawing reference tokens.
- W, S, M, HP, C, MC and HSS section candidates.
- Grid notation such as `A/15-11`.
- Page-specific candidate comparison.

## Engineering limitations

**This MVP does not geometrically align grids or verify that an individual beam occupies the correct span.** Shapes and grid strings are extracted independently. "In both selections" does not mean an individual member matches. Missing shapes are candidates, not verified discrepancies. Scanned drawings may require OCR. Fabrication pages may not contain floor titles and cannot be automatically assigned to a level; they are excluded from the automatic comparison. Only the first 120 pages are analyzed, so for 1,425-page shop submittals use smaller PDFs containing the relevant erection plans or a future chunked scan feature.

No structural approval is automated. Engineer confirmation is required for all findings. PDFs stay in the browser. Comments are stored locally in browser localStorage and are not shared or backed up except by CSV export. Clearing browser data may delete comments.

## Deployment

Merge the feature PR to `main`; the existing GitHub Actions Pages workflow builds `dist`. Set repository Settings → Pages → Source to GitHub Actions. Website: https://zixuanhuang970404-code.github.io/quickshop/

## Validation

Build and browser tests must be completed before merging. Test both text-based and scanned PDFs, plus manual page fallback.

## Framing size mismatch focus

Level, grid and sheet-reference information is used internally and is not presented as separate review findings. The main review area is reserved for verified member-size discrepancies. **The present MVP cannot identify the same physical member across PDFs**, so it currently reports zero *verified* mismatches rather than mislabeling unmatched shape occurrences as size errors. Geometry or unique member-mark correspondence is required before real mismatch detection can be implemented. This zero is **not** a passing review or proof of compliance.

## Background member location matching requirement

Level, sector, structural sheet references, and gridline coordinates are **internal matching keys only**, not user-facing review categories. To declare a size mismatch, the engine must first establish that the structural and shop annotations refer to the same physical member at the same level and framing location. Compare section sizes only after that correspondence is established. Matching section names elsewhere on a floor is not sufficient. Show only confirmed candidate size mismatches with both PDF page references; unresolved location matches belong in an internal/manual-verification queue and must not be mislabeled. Current extraction does not implement geometric grid-to-member correspondence; this is a required future engine capability, not a claim that it works now.
