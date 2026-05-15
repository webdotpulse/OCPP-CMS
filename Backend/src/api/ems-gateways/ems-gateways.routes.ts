import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.js";
import { createGateway, getGateways, pushTelemetry } from "./ems-gateways.controller.js";

const router = Router();

// Routes for web interface (secured by JWT)
router.post("/", authenticateToken, createGateway as any);
router.get("/", authenticateToken, getGateways as any);

// Route for EMS hardware to push data (secured by its own hardware token)
router.post("/telemetry", pushTelemetry as any);

export default router;
