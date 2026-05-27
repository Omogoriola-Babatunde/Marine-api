import express from "express";
import {
  approvePolicy,
  createPolicy,
  downloadCertificate,
  getAllPolicyCounts,
  getapprovedPolicies,
  getMyPolicies,
  getMyPolicyCounts,
  getMyPolicyTimeseries,
  getPolicies,
  getPolicyById,
  getpendingPolicies,
  rejectPolicy,
} from "../Controllers/policyController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("ADMIN", "STAFF"), createPolicy);
router.get("/", authenticateToken, authorizeRoles("ADMIN", "STAFF"), getPolicies);
router.get("/mine", authenticateToken, getMyPolicies);
router.get("/mine/counts", authenticateToken, getMyPolicyCounts);
router.get("/counts", authenticateToken, authorizeRoles("ADMIN"), getAllPolicyCounts);
router.get("/mine/timeseries", authenticateToken, getMyPolicyTimeseries);
router.get("/pending", authenticateToken, authorizeRoles("ADMIN"), getpendingPolicies);
router.get("/approved", authenticateToken, authorizeRoles("ADMIN", "STAFF"), getapprovedPolicies);
router.patch("/approve/:id", authenticateToken, authorizeRoles("ADMIN"), approvePolicy);
router.patch("/reject/:id", authenticateToken, authorizeRoles("ADMIN"), rejectPolicy);
router.get("/certificate/:policyNumber", authenticateToken, downloadCertificate);
router.get("/:id", authenticateToken, getPolicyById);

export default router;
