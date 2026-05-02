import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const src = resolve("node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve("public/pdf.worker.min.mjs");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log("✓ pdf.worker.min.mjs → public/");
