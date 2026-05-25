# TODO

## Groq provider integration debug (aiService.js)
- [ ] Replace temporary hardcoded response with real Groq/OpenAI-compatible call.
- [ ] Add safe debug logs: `AI service started`, `API key exists: true/false`, `before Groq request`, `after Groq response`, and caught error `status/message`.
- [ ] Ensure dotenv loading happens before any env access in `aiService.js`.
- [ ] Keep request format exactly: `messages: [{ role: 'user', content: message }]`.
- [ ] Use safe response parsing: `response?.choices?.[0]?.message?.content`.
- [ ] If response content missing/empty, throw controlled error.
- [ ] Add temporary logging of response structure keys only (no full payload, no API key).
- [ ] Verify constants: model `llama-3.1-8b-instant` and baseURL `https://api.groq.com/openai/v1`.

