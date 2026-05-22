import express from "express";
import { getUserCounts, listUsers, updateUserRole } from "../Controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("ADMIN"), listUsers);
router.get("/counts", authenticateToken, authorizeRoles("ADMIN"), getUserCounts);
router.patch("/:id/role", authenticateToken, authorizeRoles("ADMIN"), updateUserRole);

export default router;
