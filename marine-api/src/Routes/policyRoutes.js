import express from "express";
import { createPolicy,approvePolicy,rejectPolicy,getPendingPolicies,downloadCertificate } from "../Controllers/policyController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("USER", "STAFF"), createPolicy);
router.get("/pending", authenticateToken, authorizeRoles("ADMIN"), getPendingPolicies);
router.patch("/approve/:id", authenticateToken, authorizeRoles("ADMIN"), approvePolicy);
router.patch("/reject/:id", authenticateToken, authorizeRoles("ADMIN"), rejectPolicy);
router.get("/certificate/:policyNumber", authenticateToken, downloadCertificate);
export default router;
