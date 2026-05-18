import jwt from "jsonwebtoken";

/**
 * Generates a JWT token for authenticated users.
 * @param {string} userId - Unique identifier for the user.
 * @returns {string} Signed JWT token.
 */
export function generateToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }

  const payload = { userId };
  const options = { expiresIn: "7d" };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
}