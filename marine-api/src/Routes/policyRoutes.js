import express from "express";
import { createPolicy, downloadCertificate } from "../Controllers/policyController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("ADMIN", "STAFF"),   createPolicy);
router.get("/certificate/:policyNumber", downloadCertificate);
export default router;
