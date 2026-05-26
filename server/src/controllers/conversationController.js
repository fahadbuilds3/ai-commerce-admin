import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import prisma from "../config/prisma.js";

function normalizeConversationId(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}

function normalizeTitle(value) {
  if (typeof value !== "string") return null;
  const v = value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  return v.length ? v : null;
}

export const renameConversation = asyncHandler(async (req, res) => {
  const conversationId = normalizeConversationId(req?.params?.id);
  const rawTitle = req?.body?.title;
  const title = normalizeTitle(rawTitle);

  if (!conversationId) throw new ApiError(400, "Invalid conversation id");
  if (!title) throw new ApiError(400, "`title` must be a non-empty string");

  try {
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
      select: { id: true, title: true, updatedAt: true },
    });

    res.status(200).json({
      success: true,
      conversation: {
        id: updated.id,
        title: updated.title,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    // Prisma throws if record not found; map defensively.
    if (err?.code === "P2025") throw new ApiError(404, "Conversation not found");
    throw err;
  }
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const conversationId = normalizeConversationId(req?.params?.id);

  if (!conversationId) throw new ApiError(400, "Invalid conversation id");

  // If conversation doesn't exist, treat as 204 so UI can be resilient.
  const existing = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });

  if (!existing) {
    return res.status(204).send();
  }

  await prisma.conversation.delete({ where: { id: conversationId } });

  res.status(200).json({ success: true, deletedId: conversationId });
});

