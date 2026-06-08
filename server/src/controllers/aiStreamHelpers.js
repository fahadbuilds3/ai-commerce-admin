import prisma from "../config/prisma.js";

function normalizeConversationId(value) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length ? v : null;
}

function normalizeMessage(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").trim();
}

function normalizeTitle(value) {
  if (typeof value !== "string") return null;
  const v = value.replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  return v.length ? v : null;
}

// Keep title logic aligned with conversationPersistence rules, but minimal.
function generateConversationTitleFromFirstMessage(firstUserMessage) {
  const normalized = normalizeTitle(firstUserMessage);
  if (!normalized) return null;
  const maxChars = 40;
  let title = normalized.slice(0, maxChars);
  if (normalized.length > maxChars) {
    const lastSpace = title.lastIndexOf(" ");
    if (lastSpace > 10) title = title.slice(0, lastSpace);
  }
  return normalizeTitle(title);
}

export async function ensureConversationAndAppendUserMessage({
  conversationId: rawConversationId,
  userId,
  message,
}) {
  const conversationId = normalizeConversationId(rawConversationId);
  const safeMessage = normalizeMessage(message);

  if (!safeMessage) {
    const err = new Error("Empty message");
    err.code = "EMPTY_MESSAGE";
    throw err;
  }

  if (!userId) {
    const err = new Error("Missing conversation owner");
    err.code = "MISSING_USER_ID";
    throw err;
  }

  if (!conversationId) {
    const title = generateConversationTitleFromFirstMessage(safeMessage);
    const createdConversation = await prisma.conversation.create({
      data: {
        title: title ?? null,
        userId,
      },
      select: { id: true },
    });

    await prisma.message.create({
      data: {
        role: "user",
        content: safeMessage,
        conversationId: createdConversation.id,
      },
    });

    return { conversationId: createdConversation.id };
  }

  // Defensive: ensure conversation exists before appending.
  const existing = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("Conversation not found");
    err.code = "CONVERSATION_NOT_FOUND";
    throw err;
  }

  await prisma.message.create({
    data: {
      role: "user",
      content: safeMessage,
      conversationId,
    },
  });

  return { conversationId };
}

export async function appendAssistantMessage({ conversationId, userId, reply }) {
  if (typeof reply !== "string" || !reply.trim()) {
    const err = new Error("Empty AI reply");
    err.code = "EMPTY_REPLY";
    throw err;
  }

  if (!userId) {
    const err = new Error("Missing conversation owner");
    err.code = "MISSING_USER_ID";
    throw err;
  }

  const existing = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("Conversation not found");
    err.code = "CONVERSATION_NOT_FOUND";
    throw err;
  }

  await prisma.message.create({
    data: {
      role: "assistant",
      content: reply.trim(),
      conversationId,
    },
  });
}

