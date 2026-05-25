import express from "express";

import {
  chat,
  getConversations,
  getConversationById,
} from "../controllers/aiController.js";

const router = express.Router();

// POST /api/ai/chat
router.post("/chat", chat);

// GET /api/ai/conversations
router.get("/conversations", getConversations);

// GET /api/ai/conversations/:id
router.get("/conversations/:id", getConversationById);

export default router;


