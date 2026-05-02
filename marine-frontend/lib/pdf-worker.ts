import { pdfjs } from "react-pdf";

// Loaded as a module; safe to call at import time. The `/pdf.worker.min.mjs`
// path is served by Next.js from `public/`, where the postinstall script copies
// it (see scripts/copy-pdf-worker.mjs).
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
