import { Router, Request, Response } from "express";
import { searchSimilar, getStats } from "../services/vectorStore.js";

const router = Router();

/**
 * POST /api/search
 * Search for similar documents
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, topK = 5, filters } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    const results = await searchSimilar(query, topK, filters);

    res.json({
      query,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search documents" });
  }
});

/**
 * GET /api/search/stats
 * Get vector store statistics
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
