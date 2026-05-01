import { Request, Response } from "express";
import { prisma } from "../../config/database.js";
import bcrypt from "bcrypt";
import { generateToken, AuthRequest } from "../../middleware/auth.js";
import { logger } from "../../utils/logger.js";

/**
 * POST /api/auth/register - Register new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    logger.info(`New user registered: ${email}`);
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Error registering user: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to register user",
    });
  }
};

/**
 * POST /api/auth/login - Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    logger.info(`User logged in: ${email}`);
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    logger.error(`Error logging in: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to login",
    });
  }
};

/**
 * POST /api/auth/refresh - Get user info from token
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const authRequest = req as AuthRequest;

    if (!authRequest.userId) {
      return res.status(401).json({
        success: false,
        error: "No valid token provided",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: authRequest.userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`Error refreshing user info: ${error}`);
    res.status(500).json({
      success: false,
      error: "Failed to refresh user info",
    });
  }
};
