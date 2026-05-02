import { Router } from "express";
import { getAllUsers, updateUserRole, createUser, deleteUser } from "./users.controller.js";
import { requireAdmin } from "../../middleware/auth.js";

const router = Router();

// Only admins can access these routes
router.use(requireAdmin as any);

router.get("/", getAllUsers as any);
router.post("/", createUser as any);
router.put("/:id/role", updateUserRole as any);
router.delete("/:id", deleteUser as any);

export default router;
