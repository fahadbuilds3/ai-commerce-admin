import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

import { generateReply } from "../services/aiService.js";

// @desc    AI chat response (Groq via OpenAI-compatible SDK)
// @route   POST /api/ai/chat
// @access  Public (for now)
export const chat = asyncHandler(async (req, res) => {
  console.log("[AI CONTROLLER] Request received");

  const body = req?.body;
  const rawMessage = body?.message;

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

    console.log("[AI CONTROLLER] Sending success response");
    res.status(200).json({
      success: true,
      reply: safeReply,
    });
  } catch (err) {
    // Defensive: never leak internals/provider errors.
    if (err?.code === "MISSING_GROQ_API_KEY") {
      throw new ApiError(500, "AI service is not configured. Please contact support.");
    }

    if (err?.code === "EMPTY_MESSAGE") {
      throw new ApiError(400, "`message` must be a non-empty string");
    }

    // Includes timeout/aborted/invalid response.
    throw new ApiError(500, "Failed to generate AI reply");
  }
});




