import { Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../utils/logger.js";
import type { CreateConnectorDto } from "../../types/index.js";

/**
 * GET /api/connectors - Get all connectors
 */
export const getAllConnectors = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, charger_id } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (charger_id) {
      where.charger_id = Number(charger_id);
    }

    const [connectors, total] = await Promise.all([
      prisma.connector.findMany({
        skip,
        take,
        where,
        include: { charger: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.connector.count({ where }),
    ]);

    res.json({
      success: true,
      data: connectors,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    logger.error(`Error getting connectors: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to get connectors",
    });
  }
};

/**
 * GET /api/connectors/:id - Get specific connector
 */
export const getConnectorById = async (req: Request, res: Response) => {
  try {
    const connectorId = parseInt(req.params.id as string);

    const connector = await prisma.connector.findUnique({
      where: { connector_id: connectorId },
      include: { charger: true },
    });

    if (!connector) {
      return res.status(404).json({
        success: false,
        error: "Connector not found",
      });
    }

    res.json({ success: true, data: connector });
  } catch (error) {
    logger.error(`Error getting connector: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to get connector",
    });
  }
};

/**
 * POST /api/connectors - Create new connector
 */
export const createConnector = async (req: Request, res: Response) => {
  try {
    const data = req.body as CreateConnectorDto;

    // Verify charger exists
    const charger = await prisma.charger.findUnique({
      where: { charger_id: data.charger_id },
    });

    if (!charger) {
      return res.status(400).json({
        success: false,
        error: "Charger not found",
      });
    }

    const connector = await prisma.connector.create({
      data,
      include: { charger: true },
    });

    logger.info(`Connector created: ${connector.connector_name}`);
    res.status(201).json({ success: true, data: connector });
  } catch (error) {
    logger.error(`Error creating connector: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to create connector",
    });
  }
};

/**
 * PUT /api/connectors/:id - Update connector
 */
export const updateConnector = async (req: Request, res: Response) => {
  try {
    const connectorId = parseInt(req.params.id as string);

    const connector = await prisma.connector.update({
      where: { connector_id: connectorId },
      data: req.body,
      include: { charger: true },
    });

    logger.info(`Connector updated: ${connector.connector_name}`);
    res.json({ success: true, data: connector });
  } catch (error) {
    logger.error(`Error updating connector: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to update connector",
    });
  }
};

/**
 * DELETE /api/connectors/:id - Delete connector
 */
export const deleteConnector = async (req: Request, res: Response) => {
  try {
    const connectorId = parseInt(req.params.id as string);

    await prisma.connector.delete({
      where: { connector_id: connectorId },
    });

    logger.info(`Connector deleted: ID ${connectorId}`);
    res.json({ success: true, message: "Connector deleted" });
  } catch (error) {
    logger.error(`Error deleting connector: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to delete connector",
    });
  }
};
