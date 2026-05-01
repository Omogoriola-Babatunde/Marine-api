import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./config/openapi.js";
import policyRoutes from "./Routes/policyRoutes.js";
import quoteRoutes from "./Routes/quoteRoutes.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : ["http://localhost:5173", "http://localhost:3000"];

if (process.env.NODE_ENV === "production" && !process.env.ALLOWED_ORIGINS) {
  console.warn(
    "ALLOWED_ORIGINS is not set in production — falling back to localhost only. Set it explicitly."
  );
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const err = new Error("Not allowed by CORS");
    err.status = 403;
    return callback(err);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600,
};

app.disable("x-powered-by");
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));

app.get("/", (_req, res) => {
  res.send("Marine API is running!");
});

app.get("/api/docs.json", (_req, res) => {
  res.json(openApiSpec);
});
app.use(
  "/api/docs",
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https:"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Marine API — Docs",
    swaggerOptions: { persistAuthorization: true },
  })
);

app.use("/api/quote", quoteRoutes);
app.use("/api/policy", policyRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large" });
  }
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (err?.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
