import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";

/**
 * Express middleware to authenticate requests using JWT (Bearer token).
 * - Reads Bearer token from Authorization header.
 * - Verifies token using JWT_SECRET.
 * - Loads user from DB and attaches to req.user.
 * - Rejects unauthorized or invalid tokens.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    let token = null;

    // Parse Bearer token
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return next(new ApiError(401, "Authorization token missing"));
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new ApiError(401, "Invalid or expired token"));
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return next(new ApiError(401, "User not found"));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(500, "Authentication failed"));
  }
};

export default authMiddleware;