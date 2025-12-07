import { Router, Request, Response } from "express";
import { searchSimilar, SearchResult } from "../services/vectorStore.js";
import { generateResponse, generateStreamingResponse, generateSuggestions, Message } from "../services/llm.js";

const router = Router();

/**
 * Detect if query is asking for state-level overview (no specific district/block)
 */
function isStateLevelQuery(query: string, filters?: Record<string, string>): boolean {
  const queryLower = query.toLowerCase();
  // Check if query mentions district or block-level terms
  const hasBlockTerms = /\b(block|district|taluk|tehsil|mandal)\b/i.test(query);
  // Check if filters specify district or block
  const hasDistrictFilter = filters?.district || filters?.block;
  // Check for overview/summary keywords
  const hasOverviewTerms = /\b(overview|summary|state|total|overall|information about|info about|tell me about)\b/i.test(query);

  return !hasBlockTerms && !hasDistrictFilter && (hasOverviewTerms || queryLower.split(" ").length <= 6);
}

/**
 * Get comprehensive state-level data by fetching from multiple source types
 */
async function getStateLevelContext(query: string, state: string, year: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Priority order for state-level data
  const sourceTypes = ["annexure_1", "annexure_3a", "annexure_3c", "annexure_3e", "attribute_summary"];

  for (const sourceType of sourceTypes) {
    const sourceResults = await searchSimilar(query, 2, {
      state,
      year,
      source_type: sourceType,
    });
    results.push(...sourceResults);
  }

  // Sort by relevance and take top results
  return results.sort((a, b) => a.distance - b.distance).slice(0, 8);
}

/**
 * POST /api/chat
 * Full RAG chat endpoint (non-streaming)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, chatHistory = [], topK = 5, filters } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    let searchResults: SearchResult[];

    // Smart detection: If asking about a state without district/block, fetch state-level summaries
    if (filters?.state && filters?.year && isStateLevelQuery(query, filters) && !filters?.source_type) {
      console.log(`📊 Detected state-level query for ${filters.state} (${filters.year})`);
      searchResults = await getStateLevelContext(query, filters.state, filters.year);
    } else {
      // Standard search
      searchResults = await searchSimilar(query, topK, filters);
    }

    // Step 2: Build context string from search results
    const context = searchResults.map((r, i) => `[${i + 1}] ${r.text}`).join("\n\n");

    // Step 3: Generate response using LLM
    const response = await generateResponse(query, context, chatHistory as Message[]);

    // Step 4: Generate follow-up suggestions
    const suggestions = await generateSuggestions(query, context);

    res.json({
      response,
      sources: searchResults.map((r) => ({
        id: r.id,
        text: r.text.substring(0, 200) + "...",
        metadata: r.metadata,
        relevance: 1 - r.distance, // Convert distance to similarity score
      })),
      suggestions,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

/**
 * POST /api/chat/stream
 * Streaming RAG chat endpoint
 */
router.post("/stream", async (req: Request, res: Response) => {
  try {
    const { query, chatHistory = [], topK = 5, filters } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Smart detection for state-level queries
    let searchResults: SearchResult[];
    if (filters?.state && filters?.year && isStateLevelQuery(query, filters) && !filters?.source_type) {
      console.log(`📊 [Stream] Detected state-level query for ${filters.state} (${filters.year})`);
      searchResults = await getStateLevelContext(query, filters.state, filters.year);
    } else {
      searchResults = await searchSimilar(query, topK, filters);
    }

    // Send sources first
    res.write(
      `data: ${JSON.stringify({
        type: "sources",
        sources: searchResults.map((r) => ({
          id: r.id,
          text: r.text.substring(0, 200) + "...",
          metadata: r.metadata,
          relevance: 1 - r.distance,
        })),
      })}\n\n`
    );

    // Step 2: Build context string
    const context = searchResults.map((r, i) => `[${i + 1}] ${r.text}`).join("\n\n");

    // Step 3: Stream response
    await generateStreamingResponse(query, context, chatHistory as Message[], {
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
      },
      onComplete: async (fullResponse) => {
        // Generate suggestions after response is complete
        const suggestions = await generateSuggestions(query, context);
        res.write(`data: ${JSON.stringify({ type: "suggestions", suggestions })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
      },
      onError: (error) => {
        res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
        res.end();
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ error: "Failed to start streaming" });
  }
});

export default router;
