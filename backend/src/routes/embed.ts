import { Router, Request, Response } from "express";
import { embed } from "../services/embeddings.js";

const router = Router();

/**
 * POST /api/embed
 * Generate embedding for a text
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing or invalid 'text' field" });
      return;
    }

    const embedding = await embed(text);

    res.json({
      embedding,
      dimension: embedding.length,
      model: "bge-small-en-v1.5",
    });
  } catch (error) {
    console.error("Embed error:", error);
    res.status(500).json({ error: "Failed to generate embedding" });
  }
});

export default router;
