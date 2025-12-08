import { Router, Request, Response, type IRouter } from "express";
import {
  streamGroundwaterChat,
  invokeGroundwaterChat,
  ChatMessage,
} from "../services/gwAgent";
import { generateSuggestions } from "../services/llm";
import {
  addMessage,
  updateMessage,
  getTrimmedChatHistory,
} from "../services/chatHistory";
import logger from "../utils/logger";

const router: IRouter = Router();

/**
 * POST /api/gw-chat
 * Non-streaming groundwater chat endpoint
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { query, chatHistory = [] } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    // Get trimmed chat history from database
    const effectiveChatHistory: ChatMessage[] = await getTrimmedChatHistory();

    // Store user message
    await addMessage("user", query);

    logger.info(
      { query, historyLength: effectiveChatHistory.length },
      "Chat request received"
    );

    const { response, charts } = await invokeGroundwaterChat(
      query,
      effectiveChatHistory
    );

    // Store assistant response with charts
    await addMessage("assistant", response, {
      visualizations: charts,
    });

    logger.info({ chartsCount: charts.length }, "Chat response generated");

    res.json({
      response,
      charts,
    });
  } catch (error) {
    logger.error({ err: error, query: req.body.query }, "Chat request failed");
    res.status(500).json({ error: "Failed to generate response" });
  }
});

/**
 * POST /api/gw-chat/stream
 * Streaming groundwater chat endpoint with SSE
 */
router.post("/stream", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    // Get trimmed chat history from database
    const chatHistory = await getTrimmedChatHistory();

    // Store user message
    await addMessage("user", query);

    logger.info(
      { query, historyLength: chatHistory.length },
      "Stream request received"
    );

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Track accumulated data for storing
    const charts: object[] = [];
    let assistantMessageId: string | null = null;

    await streamGroundwaterChat(query, chatHistory, {
      onToken: async (token) => {
        res.write(
          `data: ${JSON.stringify({ type: "token", content: token })}\n\n`
        );
      },
      onChart: (chart) => {
        logger.debug(
          { chartType: (chart as { type?: string }).type, chart },
          "Streaming chart to client"
        );
        charts.push(chart);
        res.write(`data: ${JSON.stringify(chart)}\n\n`);
      },
      onToolCall: (toolName, args) => {
        logger.debug({ tool: toolName, args }, "Tool invoked");
        res.write(
          `data: ${JSON.stringify({
            type: "tool_call",
            tool: toolName,
            args,
          })}\n\n`
        );
      },
      onToolResult: (toolName, result) => {
        // Parse result to extract useful info without sending raw data
        try {
          const parsed = JSON.parse(result);
          res.write(
            `data: ${JSON.stringify({
              type: "tool_result",
              tool: toolName,
              found: parsed.found,
              summary: parsed.textSummary?.substring(0, 200) + "..." || null,
            })}\n\n`
          );
        } catch {
          res.write(
            `data: ${JSON.stringify({
              type: "tool_result",
              tool: toolName,
            })}\n\n`
          );
        }
      },
      onComplete: async (fullResponse) => {
        logger.info(
          { responseLength: fullResponse.length },
          "Stream completed"
        );

        // Generate suggestions based on the query and response
        let suggestions: string[] = [];
        try {
          suggestions = await generateSuggestions(query, fullResponse);
          res.write(
            `data: ${JSON.stringify({ type: "suggestions", suggestions })}\n\n`
          );
        } catch (error) {
          console.error("Failed to generate suggestions:", error);
        }

        // Store assistant message with all accumulated data
        try {
          const storedMessage = await addMessage("assistant", fullResponse, {
            visualizations: charts,
            suggestions,
          });
          assistantMessageId = storedMessage.id;
          logger.debug(
            { messageId: assistantMessageId },
            "Stored assistant message"
          );
        } catch (error) {
          logger.error({ err: error }, "Failed to store assistant message");
        }

        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
      },
      onError: (error) => {
        logger.error({ err: error, query: req.body.query }, "Stream error");
        res.write(
          `data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`
        );
        res.end();
      },
    });
  } catch (error) {
    logger.error(
      { err: error, query: req.body.query },
      "Stream request failed"
    );
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

    logger.info(
      { suggestionsCount: suggestions.length },
      "Suggestions generated"
    );

    res.json({ suggestions });
  } catch (error) {
    logger.error(
      { err: error, query: req.body.query },
      "Suggestions request failed"
    );
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

export default router;
