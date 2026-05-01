import express from "express";
import cors from "cors";
import quoteRoutes from "./Routes/quoteRoutes.js";
import policyRoutes from "./Routes/policyRoutes.js";

const app = express();

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use("/api/quote", quoteRoutes);
app.use("/api/policy", policyRoutes);

app.get("/", (req, res) => {
  res.send("Marine API is running!");
});

export default app;