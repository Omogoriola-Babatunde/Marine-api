import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

// Resolve pdfjs-dist from react-pdf's perspective so the worker file always
// matches the pdfjs API version that react-pdf loads at runtime. Resolving from
// the top-level node_modules (or depending on pdfjs-dist directly) leads to
// version drift like "API version 4.8.69 does not match Worker version 4.10.38".
const reactPdfDir = dirname(require.resolve("react-pdf/package.json"));
const src = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs", {
  paths: [reactPdfDir],
});
const dest = resolve("public/pdf.worker.min.mjs");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log(`✓ pdf.worker.min.mjs (${src}) → public/`);
