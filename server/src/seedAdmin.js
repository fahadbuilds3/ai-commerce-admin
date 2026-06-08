import bcrypt from "bcryptjs";
import prisma from "./config/prisma.js";

const isProduction = process.env.NODE_ENV === "production";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || (isProduction ? null : "admin@example.com");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProduction ? null : "password123");
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";

export async function ensureAdminUser() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  // Only create if missing
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) return;

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
}

export async function seedAdminIfNeeded() {
  // Backwards-compatible alias in case it's imported elsewhere.
  return ensureAdminUser();
}


