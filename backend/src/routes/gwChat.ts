import { Router, Request, Response, type IRouter } from "express";
import {
  streamGroundwaterChat,
  invokeGroundwaterChat,
  ChatMessage,
} from "../services/gwAgent";
import { generateSuggestions } from "../services/llm";

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

    const { response, charts } = await invokeGroundwaterChat(
      query,
      chatHistory as ChatMessage[]
    );

    res.json({
      response,
      charts,
    });
  } catch (error) {
    console.error("GW Chat error:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

/**
 * POST /api/gw-chat/stream
 * Streaming groundwater chat endpoint with SSE
 */
router.post("/stream", async (req: Request, res: Response) => {
  try {
    const { query, chatHistory = [] } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Missing or invalid 'query' field" });
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    await streamGroundwaterChat(query, chatHistory as ChatMessage[], {
      onToken: (token) => {
        res.write(
          `data: ${JSON.stringify({ type: "token", content: token })}\n\n`
        );
      },
      onChart: (chart) => {
        res.write(`data: ${JSON.stringify({ type: "chart", ...chart })}\n\n`);
      },
      onToolCall: (toolName, args) => {
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
        // Generate suggestions based on the query and response
        try {
          const suggestions = await generateSuggestions(query, fullResponse);
          res.write(
            `data: ${JSON.stringify({ type: "suggestions", suggestions })}\n\n`
          );
        } catch (error) {
          console.error("Failed to generate suggestions:", error);
        }
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
    console.error("GW Stream error:", error);
    res.status(500).json({ error: "Failed to start streaming" });
  }
});

export default router;
