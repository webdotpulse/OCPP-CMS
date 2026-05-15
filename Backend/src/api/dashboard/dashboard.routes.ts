import { Router } from "express";
import {
  getOverview,
  getLiveSessions,
  getDistribution,
  getChargersStatus,
  getLoadMetrics,
  getEmsTelemetry,
  getHistoricalEmsTelemetry
} from "./dashboard.controller.js";

const router = Router();

router.get("/overview", getOverview);
router.get("/live-sessions", getLiveSessions);
router.get("/distribution", getDistribution);
router.get("/chargers-status", getChargersStatus);
router.get("/load", getLoadMetrics);
router.get("/ems-telemetry", getEmsTelemetry);
router.get("/ems-telemetry/history", getHistoricalEmsTelemetry);

export default router;
