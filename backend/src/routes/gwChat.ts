import { Router, Request, Response, type IRouter } from "express";
import { streamGroundwaterChat, invokeGroundwaterChat } from "../services/gwAgent";
import { generateSuggestions } from "../services/llm";
import logger from "../utils/logger";
import type { Visualization, TextSummary, SSEEvent } from "../types/responses";

const router: IRouter = Router();

/**
 * Helper to send SSE event
 */
function sendSSE(res: Response, event: SSEEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * POST /api/gw-chat
 * Non-streaming groundwater chat endpoint - returns STRUCTURED data only
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, chatHistory = [] } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    logger.info({ query, historyLength: chatHistory.length }, "Chat request received");

    const { visualizations, summary } = await invokeGroundwaterChat(query, chatHistory);

    logger.info({ visualizationsCount: visualizations.length }, "Chat response generated");

    // Return structured response - NO LLM-generated text
    res.json({
      visualizations,
      summary,
    });
  } catch (error) {
    logger.error({ err: error, query: req.body.query }, "Chat request failed");
    res.status(500).json({ error: "Failed to generate response" });
  }
});

/**
 * POST /api/gw-chat/stream
 * Streaming groundwater chat endpoint with SSE - returns STRUCTURED data only
 * NO LLM-generated text tokens are streamed
 */
router.post("/stream", async (req: Request, res: Response) => {
  try {
    const { query, chatHistory = [] } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    logger.info({ query, historyLength: chatHistory.length }, "Stream request received");

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Track all visualizations for suggestion generation
    const allVisualizations: Visualization[] = [];
    let lastSummary: TextSummary | undefined;

    await streamGroundwaterChat(query, chatHistory, {
      onData: (visualizations, summary) => {
        // Stream each visualization as structured data
        for (const viz of visualizations) {
          allVisualizations.push(viz);
          // Send visualization directly - frontend renders it
          sendSSE(res, { type: "data" as const, visualizations: [viz], summary });
          // Also send in legacy format for backward compatibility
          res.write(`data: ${JSON.stringify(viz)}\n\n`);
        }
        if (summary) {
          lastSummary = summary;
        }
      },
      onToolCall: (toolName, args) => {
        logger.debug({ tool: toolName, args }, "Tool invoked");
        sendSSE(res, {
          type: "tool_call",
          tool: toolName,
          args: args as Record<string, unknown>,
        });
      },
      onToolResult: (toolName, found, summaryText) => {
        logger.debug({ tool: toolName, found }, "Tool result received");
        sendSSE(res, {
          type: "tool_result",
          tool: toolName,
          found,
          summary: summaryText,
        });
      },
      onComplete: async () => {
        logger.info({ visualizationsCount: allVisualizations.length }, "Stream completed");

        // Generate suggestions based on the query and summary
        let suggestions: string[] = [];
        try {
          const context = lastSummary ? `${lastSummary.title}. ${lastSummary.insights?.join(". ") || ""}` : query;
          suggestions = await generateSuggestions(query, context);
          sendSSE(res, { type: "suggestions", suggestions });
        } catch (error) {
          logger.error({ err: error }, "Failed to generate suggestions");
        }

        sendSSE(res, { type: "done" });
        res.end();
      },
      onError: (error) => {
        logger.error({ err: error, query: req.body.query }, "Stream error");
        sendSSE(res, { type: "error", error: error.message });
        res.end();
      },
    });
  } catch (error) {
    logger.error({ err: error, query: req.body.query }, "Stream request failed");
    res.status(500).json({ error: "Failed to start streaming" });
  }
});

/**
 * POST /api/gw-chat/suggestions
 * Generate follow-up suggestions based on query and context
 */
router.post("/suggestions", async (req: Request, res: Response) => {
  try {
    const { query, context = "" } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    logger.info({ query }, "Suggestions request received");

    const suggestions = await generateSuggestions(query, context);

    logger.info({ suggestionsCount: suggestions.length }, "Suggestions generated");

    res.json({ suggestions });
  } catch (error) {
    logger.error({ err: error, query: req.body.query }, "Suggestions request failed");
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

export default router;
