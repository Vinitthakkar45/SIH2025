import { Router, Request, Response } from "express";
import {
  addDocumentsToCollection,
  queryCollection,
  ChunkDocument,
} from "../services/vectorStore.js";
import { embedBatch } from "../services/embeddings.js";
import { randomUUID } from "crypto";

const router = Router();

/**
 * POST /api/collections/:name/add
 * Add documents to a collection
 */
router.post("/:name/add", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { texts, metadatas } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      res.status(400).json({ error: "Missing or invalid 'texts' field (must be a non-empty array)" });
      return;
    }

    // Generate embeddings for all texts
    const embeddings = await embedBatch(texts);

    // Create documents with IDs and optional metadata
    const documents: ChunkDocument[] = texts.map((text: string, index: number) => ({
      id: randomUUID(),
      text,
      metadata: metadatas && Array.isArray(metadatas) && metadatas[index]
        ? metadatas[index]
        : {},
    }));

    // Add to collection
    await addDocumentsToCollection(name, documents, embeddings);

    res.json({
      success: true,
      collection: name,
      count: documents.length,
      message: `Added ${documents.length} document(s) to collection "${name}"`,
    });
  } catch (error) {
    console.error("Add documents error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Failed to add documents to collection",
      details: errorMessage,
    });
  }
});

/**
 * POST /api/collections/:name/query
 * Query a collection
 */
router.post("/:name/query", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { query, n_results = 3 } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    const nResults = typeof n_results === "number" ? n_results : 3;

    // Query the collection
    const results = await queryCollection(name, query, nResults);

    res.json({
      collection: name,
      query,
      results: results.map((r) => ({
        id: r.id,
        text: r.text,
        metadata: r.metadata,
        distance: r.distance,
        relevance: 1 - r.distance, // Convert distance to similarity score
      })),
      count: results.length,
    });
  } catch (error) {
    console.error("Query collection error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      error: "Failed to query collection",
      details: errorMessage,
    });
  }
});

export default router;


