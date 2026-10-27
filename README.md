# Steel Shop Drawing Review — MVP

React + Vite app for manual side-by-side review of structural design and steel shop drawing PDFs.

## Features
- Upload two PDF files, view them side by side, and navigate pages independently.
- Add categorized review comments linked to both current PDF page numbers.
- Mark comments resolved, delete them, jump to referenced pages, and export CSV.
- Comments persist in browser localStorage.

## Start

Node.js 18+ required (Node 20 recommended).

```bash
npm install
npm run dev
```

Open the URL shown by Vite, typically http://localhost:5173.

```bash
npm run build
npm run preview
```

## Workflow
Upload design PDF on the left and shop PDF on the right. Navigate to relevant pages, add a comment and category, and export the CSV for records.

## Limitations
This is a manual review tool, not automated structural verification. PDF content stays in the browser and is not uploaded. Uploaded PDFs do not persist after refresh. Comments are stored only in localStorage and may be lost if browser data is cleared. Page references use PDF page numbers, not printed sheet identifiers. No authentication, backend, or team collaboration.

## Stack
React 18, Vite 5, react-pdf 9, PDF.js 4.

## Next steps
Sheet identification, on-page annotation, candidate member/connection mismatch detection, project storage, PDF report export.

## GitHub Pages deployment

The Vite base path is `/quickshop/`. The GitHub Actions workflow deploys on pushes to `main`.

1. In repository **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**.
2. Review and merge pull request #1 into `main`.
3. Open **Actions** and wait for the **Deploy Steel Review to GitHub Pages** workflow to succeed.
4. Visit https://zixuanhuang970404-code.github.io/quickshop/ .

The app is a public static website, but selected PDFs are processed locally in the browser. Avoid committing confidential drawings or review data to this public repository.

## Phase 2: candidate steel section comparison

Upload both PDFs and click **Compare PDFs**. The app reads selectable text locally using PDF.js, extracts candidate W, S, M, HP, HSS, C and MC section sizes, and shows which sizes occur in both PDFs or only one. Results include PDF page references. Click **Review pages** to navigate to a candidate and prefill a manual review comment; you must click **Add comment** to save it.

**Limitations:** This is text-only matching, not OCR, drawing geometry recognition, member mark matching or automatic validation. Sections listed as design-only or shop-only are candidates, **not verified discrepancies**. Scanned drawings may return no results. All engineering decisions require manual verification.

### Level filtering (experimental)

The app attempts to detect level identifiers from selectable shop drawing title text, e.g. `LEVEL 3 ERECTION PLAN`, and asks the reviewer to confirm the detected level. Comparison is limited to pages with a recognized matching level title in **both** PDFs; unrecognized pages are excluded, not silently assigned. Multiple levels require explicit selection. This is **not** gridline geometry matching, member-location comparison, or OCR. Drawing titles in graphical title blocks may not be extractable.

### Shop drawing structural references

For selectable-text shop drawings with notes such as `STRUCTURAL DRAWING REFERENCE - S1.1.R.B & S1.1.R.E`, the app extracts multiple S-series structural sheet references and lists possible matching pages in the structural PDF. Design PDF page identification is conservative: only pages with a single unique S-series token are matched, and missing/ambiguous matches require manual review. This does not yet automatically align framing geometry or verify gridline positions. Reference extraction can fail when PDF text is split or rasterized.

### Structural index and fabrication candidate extraction

The structural PDF's first page is scanned for drawing-index entries (e.g. `S1.1.R.B ROOF FRAMING PLAN - SECTOR B`). Shop pages expose candidate beam sizes, grid strings, and assembly-like marks. These are **unverified tokens**, not correlated members; the tool cannot yet certify a beam's location, framing level, or size. Very large PDFs may be slow because pages are currently read sequentially. The NVIDIA Starbase files were used to identify intended patterns, not to validate a full comparison.
