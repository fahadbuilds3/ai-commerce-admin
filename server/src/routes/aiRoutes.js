import express from "express";

import {
  chat,
  chatStream,
  getConversations,
  getConversationById,
} from "../controllers/aiController.js";

import {
  renameConversation,
  deleteConversation,
} from "../controllers/conversationController.js";

const router = express.Router();


// POST /api/ai/chat
router.post("/chat", chat);

// POST /api/ai/chat/stream
router.post("/chat/stream", chatStream);


// GET /api/ai/conversations
router.get("/conversations", getConversations);

// GET /api/ai/conversations/:id
router.get("/conversations/:id", getConversationById);

// PATCH /api/ai/conversations/:id/rename
router.patch("/conversations/:id/rename", renameConversation);

// DELETE /api/ai/conversations/:id
router.delete("/conversations/:id", deleteConversation);

export default router;



