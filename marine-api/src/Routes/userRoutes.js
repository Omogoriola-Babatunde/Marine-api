import express from "express";
import {
  createUser,
  getUserCounts,
  listUsers,
  updateUserRates,
  updateUserRole,
} from "../Controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("ADMIN"), listUsers);
router.post("/", authenticateToken, authorizeRoles("ADMIN"), createUser);
router.get("/counts", authenticateToken, authorizeRoles("ADMIN"), getUserCounts);
router.patch("/:id/role", authenticateToken, authorizeRoles("ADMIN"), updateUserRole);
router.patch("/:id/rates", authenticateToken, authorizeRoles("ADMIN"), updateUserRates);

export default router;
