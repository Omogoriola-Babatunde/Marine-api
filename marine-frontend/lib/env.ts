import "server-only";

const isProd = process.env.NODE_ENV === "production";
const raw = process.env.API_URL?.trim();

if (isProd && !raw) {
  throw new Error(
    "API_URL is required in production. Set it in your hosting provider's env vars."
  );
}

const apiUrl = raw || "http://localhost:4000";

if (!isProd && !raw) {
  console.warn(`[env] API_URL not set, defaulting to ${apiUrl}`);
}

export const env = {
  API_URL: apiUrl,
} as const;
