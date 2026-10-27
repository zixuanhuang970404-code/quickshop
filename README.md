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
