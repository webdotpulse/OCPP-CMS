import { Request, Response } from "express";
import { EmsGatewayService } from "../../services/EmsGatewayService.js";

export const createGateway = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-expect-error userId is attached by authenticateToken middleware
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Admins can create for other clients, otherwise default to self
    const targetClientId = req.body.client_id || userId;

    const gateway = await EmsGatewayService.createGateway(targetClientId);

    res.status(201).json({ success: true, data: gateway });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getGateways = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-expect-error user properties are attached by authenticateToken middleware
    const userId = req.user?.id;
    // @ts-expect-error user properties are attached by authenticateToken middleware
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const gateways = await EmsGatewayService.getGateways(userId, userRole);

    res.json({ success: true, data: gateways });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const pushTelemetry = async (req: Request, res: Response): Promise<void> => {
  try {
    // Expect Authorization: Bearer <token> or a custom token header
    const authHeader = req.headers.authorization;
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      res.status(401).json({ success: false, error: "Missing Bearer token" });
      return;
    }

    const { solar_kw, battery_kw, grid_kw, house_kw } = req.body;

    if (
      solar_kw === undefined ||
      battery_kw === undefined ||
      grid_kw === undefined ||
      house_kw === undefined
    ) {
      res.status(400).json({
        success: false,
        error: "Missing required telemetry fields: solar_kw, battery_kw, grid_kw, house_kw"
      });
      return;
    }

    const result = await EmsGatewayService.processTelemetry(token, {
      solar_kw: Number(solar_kw),
      battery_kw: Number(battery_kw),
      grid_kw: Number(grid_kw),
      house_kw: Number(house_kw)
    });

    res.json(result);
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      res.status(401).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};
