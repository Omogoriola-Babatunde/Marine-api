import express from "express";
import { createPolicy, downloadCertificate } from "../Controllers/policyController.js";

const router = express.Router();

router.post("/", createPolicy);
router.get("/certificate/:policyNumber", downloadCertificate);
export default router;
