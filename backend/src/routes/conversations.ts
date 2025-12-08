import { Router, Request, Response, type IRouter } from "express";
import { createConversation, getConversations, getConversation, deleteConversation, updateConversationTitle } from "../services/chatHistory";
import logger from "../utils/logger";

const router: IRouter = Router();

/**
 * POST /api/conversations
 * Create a new conversation
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title = "New Chat", userId = "default_user" } = req.body;

    const conversationId = await createConversation(title, userId);

    logger.info({ conversationId }, "Created new conversation");

    res.status(201).json({
      id: conversationId,
      title,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

/**
 * GET /api/conversations
 * Get all conversations for a user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || "default_user";
    const limit = parseInt(req.query.limit as string) || 50;

    const conversationsList = await getConversations(userId, limit);

    res.json({ conversations: conversationsList });
  } catch (error) {
    logger.error({ err: error }, "Failed to get conversations");
    res.status(500).json({ error: "Failed to get conversations" });
  }
});

/**
 * GET /api/conversations/:id
 * Get a specific conversation with all messages
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { conversation, messages } = await getConversation(id);

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json({
      conversation,
      messages,
    });
  } catch (error) {
    logger.error({ err: error, conversationId: req.params.id }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

/**
 * PATCH /api/conversations/:id
 * Update conversation title
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || typeof title !== "string") {
      res.status(400).json({ error: "Missing or invalid 'title' field" });
      return;
    }

    await updateConversationTitle(id, title);

    logger.info({ conversationId: id, title }, "Updated conversation title");

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error, conversationId: req.params.id }, "Failed to update conversation");
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

/**
 * DELETE /api/conversations/:id
 * Delete a conversation and all its messages
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteConversation(id);

    logger.info({ conversationId: id }, "Deleted conversation");

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error, conversationId: req.params.id }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;
