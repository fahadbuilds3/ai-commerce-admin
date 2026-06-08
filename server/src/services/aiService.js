import OpenAI from "openai";
import "../config/env.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.1-8b-instant";

function normalizeReplyText(text) {
  if (typeof text !== "string") return "";
  const cleaned = text.replace(/\u0000/g, "").trim();
  return cleaned;
}

export async function generateReply(message) {
  const timeoutMs = 15_000;

  const raw = message;
  const trimmed = normalizeReplyText(raw);

  if (!trimmed) {
    const err = new Error("Empty `message`");
    err.code = "EMPTY_MESSAGE";
    throw err;
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
    const err = new Error("Missing GROQ_API_KEY");
    err.code = "MISSING_GROQ_API_KEY";
    throw err;
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: GROQ_BASE_URL,
  });

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

    const content = response?.choices?.[0]?.message?.content;

    const normalized = normalizeReplyText(content);

    if (!normalized) {
      const err = new Error("Groq returned empty response content");
      err.code = "GROQ_EMPTY_CONTENT";
      throw err;
    }

    return normalized;
  } catch (err) {
    throw err;
  } finally {

    clearTimeout(timeout);
  }
}

export default {
  generateReply,
};





