import { Router } from "express";
import { getMailConfig, updateMailConfig } from "./mail.controller.js";

const router = Router();

router.get("/", getMailConfig);
router.put("/", updateMailConfig);

export default router;
