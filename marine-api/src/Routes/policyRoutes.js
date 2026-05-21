import express from "express";
import {
  approvePolicy,
  createPolicy,
  downloadCertificate,
  getapprovedPolicies,
  getpendingPolicies,
  rejectPolicy,
} from "../Controllers/policyController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("ADMIN", "STAFF"), createPolicy);
router.get("/pending", authenticateToken, authorizeRoles("ADMIN"), getpendingPolicies);
router.get("/approved", authenticateToken, authorizeRoles("ADMIN", "STAFF"), getapprovedPolicies);
router.patch("/approve/:id", authenticateToken, authorizeRoles("ADMIN"), approvePolicy);
router.patch("/reject/:id", authenticateToken, authorizeRoles("ADMIN"), rejectPolicy);
router.get("/certificate/:policyNumber", authenticateToken, downloadCertificate);

export default router;
