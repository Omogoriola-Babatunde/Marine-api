import fs from "node:fs";
import path from "node:path";

export const CERTIFICATE_DIR = path.resolve(
  process.env.CERTIFICATE_DIR || path.join(process.cwd(), "certificates")
);

fs.mkdirSync(CERTIFICATE_DIR, { recursive: true });
