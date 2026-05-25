# TODO - Fix AI conversation creation behavior

## Step 1
- Update server-side conversation persistence to generate Conversation.title on NEW conversation creation using first user message.
- Title rules: max ~40 chars, trim whitespace, avoid empty, fallback only if message empty.
- IMPLEMENTED ✅ (pending actual code changes)

## Step 2
- Update AiAssistantPage: implement “New Chat” action that clears active conversationId and messages.
- Pending ⏳

## Step 3
- Update AiAssistantPage send behavior:
  - If conversationId is null, create NEW conversation (avoid reusing old id).
  - Defensively avoid duplicate conversation creation/race conditions during first send.
  - Ensure conversationId is stored+reused after creation.
- Pending ⏳

## Step 4
- Refresh sidebar conversation list after creating/switching so multiple conversations appear sorted by updatedAt desc and active highlights.
- Pending ⏳

## Step 5
- Quick manual test checklist.
- Pending ⏳


