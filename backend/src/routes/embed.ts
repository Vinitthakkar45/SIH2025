import { Router, Request, Response } from "express";
import { embed, embedBatch } from "../services/embeddings.js";

const router = Router();

/**
 * POST /api/embed
 * Generate embeddings for texts (supports both single text and array of texts)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { text, texts } = req.body;

    // Support both 'text' (single) and 'texts' (array) for backward compatibility
    let textsToEmbed: string[];
    if (texts && Array.isArray(texts)) {
      textsToEmbed = texts;
    } else if (text && typeof text === "string") {
      textsToEmbed = [text];
    } else {
      res.status(400).json({ error: "Missing or invalid 'text' or 'texts' field" });
      return;
    }

    // Generate embeddings for all texts
    const embeddings = await embedBatch(textsToEmbed);

    // Return array of embeddings (or single embedding if only one text)
    if (textsToEmbed.length === 1) {
      res.json({
        embedding: embeddings[0],
        embeddings: embeddings,
        dimension: embeddings[0].length,
        model: "bge-small-en-v1.5",
      });
    } else {
    res.json({
        embeddings,
        dimension: embeddings[0]?.length || 384,
      model: "bge-small-en-v1.5",
    });
    }
  } catch (error) {
    console.error("Embed error:", error);
    res.status(500).json({ error: "Failed to generate embedding" });
  }
});

export default router;
