import express from "express";
import { listUsers } from "../Controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("ADMIN"), listUsers);

export default router;
