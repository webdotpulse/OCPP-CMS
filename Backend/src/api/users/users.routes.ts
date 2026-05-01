import { Router } from "express";
import { getAllUsers, updateUserRole } from "./users.controller.js";
import { requireAdmin } from "../../middleware/auth.js";

const router = Router();

// Only admins can access these routes
router.use(requireAdmin as any);

router.get("/", getAllUsers as any);
router.put("/:id/role", updateUserRole as any);

export default router;
