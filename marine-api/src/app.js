import cors from "cors";
import express from "express";
import helmet from "helmet";
import policyRoutes from "./Routes/policyRoutes.js";
import quoteRoutes from "./Routes/quoteRoutes.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : ["http://localhost:3000"];

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
    return callback(new Error("Not allowed by CORS"));
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

app.use("/api/quote", quoteRoutes);
app.use("/api/policy", policyRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
