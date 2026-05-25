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
  message,
}) {
  const conversationId = normalizeConversationId(rawConversationId);
  const safeMessage = normalizeMessage(message);

  if (!safeMessage) {
    const err = new Error("Empty message");
    err.code = "EMPTY_MESSAGE";
    throw err;
  }

  if (!conversationId) {
    const title = generateConversationTitleFromFirstMessage(safeMessage);
    const createdConversation = await prisma.conversation.create({
      data: {
        title: title ?? null,
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
  const existing = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true },
  });

  if (!existing) {
    const err = new Error("Invalid conversationId");
    err.code = "INVALID_CONVERSATION_ID";
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

export async function appendAssistantMessage({ conversationId, reply }) {
  if (typeof reply !== "string" || !reply.trim()) {
    const err = new Error("Empty AI reply");
    err.code = "EMPTY_REPLY";
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

