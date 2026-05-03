import { Router } from "express";
import { register, login, refresh, updateMe, updatePassword } from "./auth.controller.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);

router.put("/me", authenticateToken, updateMe as any);
router.put("/password", authenticateToken, updatePassword as any);

export default router;
