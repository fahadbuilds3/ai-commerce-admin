# TODO

## Streaming AI Responses (Groq via SSE)
- [x] Add backend SSE endpoint: POST /api/ai/chat/stream
- [ ] Implement Groq streaming (stream:true) and chunk -> SSE events
- [ ] Persist user message immediately; persist assistant message only after stream completes
- [ ] Defensive handling: abort/disconnect/empty chunks/provider errors
- [ ] Frontend: switch AiAssistantPage to stream assistant incrementally
- [ ] Frontend: typing cursor/streaming indicator + disable duplicate sends while streaming
- [ ] Frontend: auto-scroll during streaming; abort/cleanup on unmount or conversation switch


