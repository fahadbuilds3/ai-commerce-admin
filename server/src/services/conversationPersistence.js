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

// Title rules:
// - generated from first user message only
// - max ~40 chars
// - trim whitespace
// - avoid empty titles
function generateConversationTitleFromFirstMessage(firstUserMessage) {
  const normalized = normalizeTitle(firstUserMessage);
  if (!normalized) return null;

  // Keep it short and human-friendly.
  // Avoid cutting mid-word if possible.
  const maxChars = 40;
  let title = normalized.slice(0, maxChars);

  // If we sliced in the middle, try to backtrack to last space.
  if (normalized.length > maxChars) {
    const lastSpace = title.lastIndexOf(" ");
    if (lastSpace > 10) title = title.slice(0, lastSpace);
  }

  title = normalizeTitle(title);
  return title;
}

export async function ensureConversationAndAppendMessages({
  conversationId: rawConversationId,
  userId,
  message,
  reply,
}) {
  const conversationId = normalizeConversationId(rawConversationId);
  const safeMessage = normalizeMessage(message);
  const safeReply = normalizeMessage(reply);

  if (!safeMessage) {
    const err = new Error("Empty message");
    err.code = "EMPTY_MESSAGE";
    throw err;
  }

  if (!safeReply) {
    const err = new Error("Empty AI reply");
    err.code = "EMPTY_REPLY";
    throw err;
  }

  if (!userId) {
    const err = new Error("Missing conversation owner");
    err.code = "MISSING_USER_ID";
    throw err;
  }

  try {
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

      await prisma.message.create({
        data: {
          role: "assistant",
          content: safeReply,
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

    await prisma.message.create({
      data: {
        role: "assistant",
        content: safeReply,
        conversationId,
      },
    });

    return { conversationId };
  } catch (err) {
    // Normalize Prisma errors into something the controller can map.
    if (err?.code === "CONVERSATION_NOT_FOUND") throw err;
    if (err?.code === "MISSING_USER_ID") throw err;
    const e = err instanceof Error ? err : new Error("Failed to persist conversation");
    e.code = e.code || "DB_WRITE_FAILED";
    throw e;
  }
}

