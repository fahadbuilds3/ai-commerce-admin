import express from "express";
// import prisma from "../prisma/client.js";
import prisma from "../config/prisma.js";

const router = express.Router();

/**
 * GET /api/customers
 * Optional query param: q (search by name or email)
 * Returns: { customers: [{ id, name, email, createdAt }], totalCount }
 */
router.get("/", async (req, res) => {
  try {
    const { q } = req.query;
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } }
          ]
        }
      : undefined;

    const [customers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ customers, totalCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers." });
  }
});

export default router;