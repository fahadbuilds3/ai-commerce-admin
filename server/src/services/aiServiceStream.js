import OpenAI from "openai";
import "../config/env.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const MODEL = "llama-3.1-8b-instant";

function normalizeReplyText(text) {
  if (typeof text !== "string") return "";
  const cleaned = text.replace(/\u0000/g, "").trim();
  return cleaned;
}

/**
 * Streams assistant text using Groq/OpenAI-compatible streaming.
 * Yields string chunks (may be empty; caller should ignore).
 */
export async function* generateReplyStream(message, { signal } = {}) {
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
    apiKey,
    baseURL: GROQ_BASE_URL,
  });

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
      stream: true,
    },
    { signal }
  );

  // response is an async iterable of events
  for await (const event of response) {
    const delta = event?.choices?.[0]?.delta;
    const content = delta?.content;
    if (typeof content === "string") {
      yield content;
    }
  }
}

