import { Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../utils/logger.js";
import { parsePagination, parseId } from "../../utils/validation.js";
import { AuthRequest } from "../../middleware/auth.js";

/**
 * GET /api/users - Get all users
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page: queryPage, limit: queryLimit } = req.query;
    const { page, limit } = parsePagination(queryPage as string, queryLimit as string);

    const skip = (page - 1) * limit;
    const take = limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    logger.error(`Error getting users: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to get users",
    });
  }
};

/**
 * PUT /api/users/:id/role - Update user role
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseId(req.params.id);
    const { role } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    if (!role || (role !== "admin" && role !== "user")) {
        return res.status(400).json({
          success: false,
          error: "Valid role is required (admin or user)",
        });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    logger.error(`Error updating user role: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
    });
  }
};
