import express from "express";
import { listUsers, updateUserRole } from "../Controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("ADMIN"), listUsers);
router.patch("/:id/role", authenticateToken, authorizeRoles("ADMIN"), updateUserRole);

export default router;
