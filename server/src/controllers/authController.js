import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { generateToken } from "../services/tokenService.js";

/**
 * Helper to pick safe user properties for response
 * @param {object} user - Prisma user object
 * @returns {object} stripped user object
 */
const buildSafeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  // Check for duplicate email (case-insensitive by default, but adjust as needed for your DB collation)
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER",
    },
  });

  // Return token and safe user object
  res.status(201).json({
    success: true,
    token: generateToken(user.id),
    user: buildSafeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Look up user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Compare password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  res.status(200).json({
    success: true,
    token: generateToken(user.id),
    user: buildSafeUser(user),
  });
});

/**
 * @desc    Get the current authenticated user's safe info
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user should be set by auth middleware after token verification
  if (!req.user) {
    throw new ApiError(401, "Not authenticated");
  }

  // Optionally, re-fetch from database for freshest data (if needed)
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    user: buildSafeUser(user),
  });
});
