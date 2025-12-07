import { Router, Request, Response } from "express";
import { searchSimilar } from "../services/vectorStore.js";
import {
  generateResponse,
  generateStreamingResponse,
  generateSuggestions,
  Message,
} from "../services/llm.js";

const router = Router();

/**
 * OPTIONS /api/chat/stream
 * Handle CORS preflight for streaming endpoint
 */
router.options("/stream", (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
  res.status(204).end();
});

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

    // Step 1: Search for relevant context (handle ChromaDB unavailability)
    let searchResults: Awaited<ReturnType<typeof searchSimilar>> = [];
    let context = "";

    try {
      searchResults = await searchSimilar(query, topK, filters);
    // Step 2: Build context string from search results
      context = searchResults
      .map((r, i) => `[${i + 1}] ${r.text}`)
      .join("\n\n");
    } catch (error) {
      // ChromaDB not available - continue without RAG context
      console.warn("ChromaDB not available, continuing without RAG context:", error);
      context = "No context available from vector database.";
    }

    // Step 3: Generate response using LLM
    const response = await generateResponse(
      query,
      context,
      chatHistory as Message[]
    );

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ 
      error: "Failed to generate response",
      details: errorMessage 
    });
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

    // Set up CORS headers for streaming
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Step 1: Search for relevant context (handle ChromaDB unavailability)
    let searchResults: Awaited<ReturnType<typeof searchSimilar>> = [];
    let context = "";
    
    try {
      searchResults = await searchSimilar(query, topK, filters);

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
      context = searchResults
      .map((r, i) => `[${i + 1}] ${r.text}`)
      .join("\n\n");
    } catch (error) {
      // ChromaDB not available - send empty sources and continue without RAG
      console.warn("ChromaDB not available, continuing without RAG context:", error);
      res.write(
        `data: ${JSON.stringify({
          type: "sources",
          sources: [],
        })}\n\n`
      );
      context = "No context available from vector database.";
    }

    // Step 3: Stream response
    await generateStreamingResponse(query, context, chatHistory as Message[], {
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
      },
      onComplete: async (fullResponse) => {
        // Generate suggestions after response is complete
        const suggestions = await generateSuggestions(query, context);
        res.write(
          `data: ${JSON.stringify({ type: "suggestions", suggestions })}\n\n`
        );
        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
      },
      onError: (error) => {
        res.write(
          `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
        );
        res.end();
      },
    });
  } catch (error) {
    console.error("Stream error:", error);
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.write(
      `data: ${JSON.stringify({ 
        type: "error", 
        error: error instanceof Error ? error.message : "Failed to start streaming" 
      })}\n\n`
    );
    res.end();
  }
});

export default router;
