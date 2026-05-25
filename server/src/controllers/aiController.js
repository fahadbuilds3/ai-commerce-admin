import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import prisma from "../config/prisma.js";

import { generateReply } from "../services/aiService.js";

function normalizeConversationId(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}

function normalizeTitle(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}

// @desc    AI chat response (Groq via OpenAI-compatible SDK)
// @route   POST /api/ai/chat
// @access  Public (for now)
export const chat = asyncHandler(async (req, res) => {
  console.log("[AI CONTROLLER] Request received");

  const body = req?.body;
  const rawMessage = body?.message;
  const rawConversationId = body?.conversationId;

  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

  if (!message) {
    throw new ApiError(400, "`message` must be a non-empty string");
  }

  try {
    const reply = await generateReply(message);

    // Defensive: preserve contract even if provider returned junk.
    const safeReply = typeof reply === "string" && reply.trim().length > 0 ? reply.trim() : "";

    if (!safeReply) {
      console.log("[AI CONTROLLER] Sending empty reply fallback");
      return res.status(200).json({
        success: true,
        reply: "I’m having trouble generating a reply right now. Please try again.",
      });
    }

    const { ensureConversationAndAppendMessages } = await import(
      "../services/conversationPersistence.js"
    );

    const { conversationId } = await ensureConversationAndAppendMessages({
      conversationId: rawConversationId,
      message,
      reply: safeReply,
    });

    console.log("[AI CONTROLLER] Sending success response");
    res.status(200).json({
      success: true,
      reply: safeReply,
      conversationId,
    });
  } catch (err) {
    // Defensive: never leak internals/provider errors.
    if (err?.code === "MISSING_GROQ_API_KEY") {
      throw new ApiError(500, "AI service is not configured. Please contact support.");
    }

    if (err?.code === "EMPTY_MESSAGE") {
      throw new ApiError(400, "`message` must be a non-empty string");
    }

    if (err?.code === "INVALID_CONVERSATION_ID") {
      throw new ApiError(400, "Invalid `conversationId`");
    }

    if (err?.code === "DB_WRITE_FAILED" || err?.code === "EMPTY_REPLY") {
      throw new ApiError(500, "Failed to persist conversation");
    }

    // Includes timeout/aborted/invalid response.
    throw new ApiError(500, "Failed to generate AI reply");
  }
});

// @desc    List persisted conversations
// @route   GET /api/ai/conversations
// @access  Public (for now)
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
      },
    },
  });

  const payload = (conversations ?? []).map((c) => {
    const latest = c?.messages?.[0];
    const latestContent = typeof latest?.content === "string" ? latest.content : null;
    const latestPreview = latestContent ? latestContent.trim().slice(0, 140) : null;

    return {
      id: c?.id,
      title: normalizeTitle(c?.title),
      updatedAt: c?.updatedAt,
      latestMessagePreview: latestPreview,
    };
  });

  res.status(200).json({
    success: true,
    conversations: payload,
  });
});

// @desc    Load a conversation with ordered messages
// @route   GET /api/ai/conversations/:id
// @access  Public (for now)
export const getConversationById = asyncHandler(async (req, res) => {
  const conversationId = normalizeConversationId(req?.params?.id);

  if (!conversationId) {
    throw new ApiError(400, "Invalid conversation id");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  res.status(200).json({
    success: true,
    conversation: {
      id: conversation.id,
      title: normalizeTitle(conversation.title),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
    messages: (conversation.messages ?? []).map((m) => ({
      id: m.id,
      role: m.role,
      content: typeof m.content === "string" ? m.content : "",
      createdAt: m.createdAt,
    })),
  });
});

