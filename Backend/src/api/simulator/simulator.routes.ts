import { Router } from "express";
import {
  listSimulators,
  spawnSimulator,
  killSimulator,
  triggerAction,
} from "./simulator.controller.js";

const router = Router();

router.get("/", listSimulators);
router.post("/spawn", spawnSimulator);
router.delete("/:chargerId", killSimulator);
router.post("/:chargerId/action", triggerAction);

export default router;
