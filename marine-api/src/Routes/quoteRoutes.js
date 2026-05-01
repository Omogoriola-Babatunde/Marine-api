import express from "express";
import { createQuotes, getQuotes } from "../Controllers/quoteController.js";
const router = express.Router();

router.post("/", createQuotes);
router.get("/", getQuotes);

export default router;