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

  const result = await prisma.conversation.updateMany({
    where: { id: conversationId, userId: req.user.id },
    data: { title },
  });

  if (result.count === 0) {
    throw new ApiError(404, "Conversation not found");
  }

  const updated = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: req.user.id },
    select: { id: true, title: true, updatedAt: true },
  });

  if (!updated) {
    throw new ApiError(404, "Conversation not found");
  }

  res.status(200).json({
    success: true,
    conversation: {
      id: updated.id,
      title: updated.title,
      updatedAt: updated.updatedAt,
    },
  });
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const conversationId = normalizeConversationId(req?.params?.id);

  if (!conversationId) throw new ApiError(400, "Invalid conversation id");

  const deleted = await prisma.conversation.deleteMany({
    where: { id: conversationId, userId: req.user.id },
  });

  if (deleted.count === 0) {
    throw new ApiError(404, "Conversation not found");
  }

  res.status(200).json({ success: true, deletedId: conversationId });
});

