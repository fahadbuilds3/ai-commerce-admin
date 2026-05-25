import OpenAI from "openai";
import dotenv from "dotenv";

// Verify dotenv loading order: must run before any env usage.
dotenv.config();

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.1-8b-instant";

function normalizeReplyText(text) {
  if (typeof text !== "string") return "";
  const cleaned = text.replace(/\u0000/g, "").trim();
  return cleaned;
}

export async function generateReply(message) {
  console.log("AI service started");

  const timeoutMs = 15_000;

  // Debug: request received (safe; no payload dumps)

  const raw = message;
  const trimmed = normalizeReplyText(raw);

  console.log("[aiService] request received:", {
    hasMessage: typeof raw === "string" && raw.trim().length > 0,
    messageLength: typeof raw === "string" ? raw.trim().length : 0,
  });

  if (!trimmed) {
    const err = new Error("Empty `message`");
    err.code = "EMPTY_MESSAGE";
    throw err;
  }

  const apiKey = process.env.GROQ_API_KEY;
  console.log("[aiService] API key exists:", !!apiKey);

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    const err = new Error("Missing GROQ_API_KEY");
    err.code = "MISSING_GROQ_API_KEY";
    throw err;
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: GROQ_BASE_URL,
  });

  console.log("[aiService] before Groq request");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Official Groq-compatible OpenAI pattern (OpenAI SDK with Groq baseURL)
    const response = await client.chat.completions.create(
      {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: trimmed,
          },
        ],
        temperature: 0.2,
        max_tokens: 220,
      },
      { signal: controller.signal }
    );

    console.log("[aiService] after Groq response");

    // Temporary logging for response structure keys only (no full payload)
    const responseKeys = response && typeof response === "object" ? Object.keys(response) : [];
    const choices = response?.choices;
    const firstChoiceKeys =
      choices && Array.isArray(choices) && choices[0] && typeof choices[0] === "object"
        ? Object.keys(choices[0])
        : [];
    const messageKeys =
      choices?.[0]?.message && typeof choices[0].message === "object"
        ? Object.keys(choices[0].message)
        : [];

    console.log("[aiService] response structure keys:", {
      responseKeys,
      choicesType: Array.isArray(choices) ? "array" : typeof choices,
      firstChoiceKeys,
      messageKeys,
    });

    const content = response?.choices?.[0]?.message?.content;

    const normalized = normalizeReplyText(content);

    if (!normalized) {
      const err = new Error("Groq returned empty response content");
      err.code = "GROQ_EMPTY_CONTENT";
      throw err;
    }

    return normalized;
  } catch (err) {
    // Debug-only: capture REAL Groq backend error details (never log API keys)
    console.log("[aiService] caught error details (FULL safe):", {
      message: err?.message,
      status: err?.status,
      code: err?.code,
      responseData: err?.response?.data,
      name: err?.name,
    });

    throw err;
  } finally {

    clearTimeout(timeout);
  }
}

export default {
  generateReply,
};





