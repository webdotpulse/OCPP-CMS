import { Request, Response } from "express";
import { simulatorManager } from "../../simulator/SimulatorManager.js";
import { SimulatorConfig } from "../../simulator/ChargePointSimulator.js";

export async function listSimulators(req: Request, res: Response) {
  try {
    const list = simulatorManager.getList();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to list simulators" });
  }
}

export async function spawnSimulator(req: Request, res: Response) {
  try {
    const config: SimulatorConfig = req.body;

    if (!config.chargerId || !config.protocol || !config.type || !config.maxPowerKw) {
      return res.status(400).json({ success: false, error: "Missing required config parameters" });
    }

    const success = await simulatorManager.spawn(config);
    if (!success) {
      return res.status(400).json({ success: false, error: "Simulator already exists" });
    }

    res.json({ success: true, message: `Simulator ${config.chargerId} spawned` });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to spawn simulator" });
  }
}

export async function killSimulator(req: Request, res: Response) {
  try {
    const chargerId = req.params.chargerId as string;
    const success = await simulatorManager.kill(chargerId);

    if (!success) {
      return res.status(404).json({ success: false, error: "Simulator not found" });
    }

    res.json({ success: true, message: `Simulator ${chargerId} killed` });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to kill simulator" });
  }
}

export async function triggerAction(req: Request, res: Response) {
  try {
    const chargerId = req.params.chargerId as string;
    const { action, params } = req.body;

    const sim = simulatorManager.getSimulator(chargerId);
    if (!sim) {
      return res.status(404).json({ success: false, error: "Simulator not found" });
    }

    switch (action) {
      case "boot":
        await sim.sendBootNotification();
        break;
      case "startTx":
        await sim.startTransaction(params?.idTag || "SIM-CARD");
        break;
      case "stopTx":
        await sim.stopTransaction();
        break;
      case "status":
        await sim.sendStatusNotification(params?.status || "Available");
        break;
      case "startAuto":
        sim.startAutoMode();
        break;
      case "stopAuto":
        sim.stopAutoMode();
        break;
      default:
        return res.status(400).json({ success: false, error: "Unknown action" });
    }

    res.json({ success: true, message: `Action ${action} executed` });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to execute action" });
  }
}
