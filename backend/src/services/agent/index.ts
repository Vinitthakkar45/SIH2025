import { HumanMessage, AIMessage, SystemMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { allTools } from "../gwTools";
import logger from "../../utils/logger";
import { processToolResult } from "../toolResultHandlers";
import { SYSTEM_PROMPT, createModel } from "./config";
import { trimMessagesToFit } from "./trimmer";
import { ChatMessage, convertChatHistory, filterSystemMessages } from "./messages";
import type { Visualization, TextSummary } from "../../types/responses";
import { generateSummaryFromToolResult } from "../../utils/summaryGenerator";

export { ChatMessage };

/**
 * Callbacks for streaming structured data to the client
 */
export interface StreamCallbacks {
  /** Called when a visualization/data container is ready */
  onData: (visualizations: Visualization[], summary?: TextSummary) => void;
  /** Called when a tool is invoked */
  onToolCall: (toolName: string, args: object) => void;
  /** Called when a tool returns result (for progress indication) */
  onToolResult: (toolName: string, found: boolean, summary?: string) => void;
  /** Called when processing is complete */
  onComplete: () => void;
  /** Called on error */
  onError: (error: Error) => void;
}

/**
 * Legacy callbacks - kept for backward compatibility
 * @deprecated Use StreamCallbacks instead
 */
export interface LegacyStreamCallbacks {
  onToken: (token: string) => void;
  onChart: (chart: object) => void;
  onToolCall: (toolName: string, args: object) => void;
  onToolResult: (toolName: string, result: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export function createGroundwaterAgent() {
  const model = createModel();
  const toolNode = new ToolNode(allTools);

  function shouldContinue(state: typeof MessagesAnnotation.State): "tools" | typeof END {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;

    if (lastMessage.tool_calls?.length) {
      return "tools";
    }
    return END;
  }

  async function callModel(state: typeof MessagesAnnotation.State) {
    const trimmedMessages = await trimMessagesToFit(state.messages);
    const response = await model.invoke(trimmedMessages);
    return { messages: [response] };
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  return workflow.compile();
}

/**
 * Stream groundwater chat with STRUCTURED data output (NO LLM text generation)
 *
 * Flow:
 * 1. LLM extracts parameters via tool calls
 * 2. Tools return structured data
 * 3. Data is processed into visualizations
 * 4. Visualizations are sent to client
 * 5. NO final LLM call for text generation
 *
 * Note: Uses invoke instead of stream since we don't need token streaming anymore.
 * The "streaming" is now about sending visualizations as they're processed.
 */
export async function streamGroundwaterChat(query: string, chatHistory: ChatMessage[] = [], callbacks: StreamCallbacks): Promise<void> {
  const agent = createGroundwaterAgent();

  const filteredHistory = filterSystemMessages(chatHistory);
  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), ...convertChatHistory(filteredHistory), new HumanMessage(query)];

  // Collect all visualizations and summaries from tool results
  const allVisualizations: Visualization[] = [];
  const allSummaries: TextSummary[] = [];

  try {
    logger.debug("Starting structured agent (invoke mode)");

    // Use invoke instead of stream - we don't need token streaming anymore
    // This avoids Gemini streaming compatibility issues
    const result = await agent.invoke({ messages });

    // Process all messages from the result
    for (const message of result.messages) {
      // Report tool calls (for logging/debugging)
      if (message._getType() === "ai") {
        const aiMessage = message as AIMessage;
        if (aiMessage.tool_calls?.length) {
          for (const toolCall of aiMessage.tool_calls) {
            callbacks.onToolCall(toolCall.name, toolCall.args);
          }
        }
      }

      // Process tool results
      if (message._getType() === "tool") {
        const toolMessage = message as ToolMessage;
        const toolName = toolMessage.name ?? "unknown";
        const resultJson = toolMessage.content as string;

        // Parse tool result for progress reporting
        try {
          const parsed = JSON.parse(resultJson);
          callbacks.onToolResult(toolName, parsed.found ?? false, parsed.textSummary?.substring(0, 200));

          // Generate deterministic summary from tool result
          const summary = generateSummaryFromToolResult(toolName, parsed);
          if (summary) {
            allSummaries.push(summary);
          }
        } catch {
          callbacks.onToolResult(toolName, false);
        }

        // Process tool result into visualizations
        await processToolResult(toolName, resultJson, (chart: object) => {
          // Collect visualization
          allVisualizations.push(chart as Visualization);
          // Send each visualization as it's generated
          const summary = allSummaries[allSummaries.length - 1];
          callbacks.onData([chart as Visualization], summary);
        });
      }
    }

    logger.debug({ visualizationsCount: allVisualizations.length }, "Structured invocation completed");
    callbacks.onComplete();
  } catch (error) {
    logger.error({ err: error }, "Structured agent failed");
    callbacks.onError(error as Error);
  }
}

/**
 * Legacy streaming function - wraps new structured approach
 * @deprecated Use streamGroundwaterChat with StreamCallbacks
 */
export async function streamGroundwaterChatLegacy(query: string, chatHistory: ChatMessage[] = [], callbacks: LegacyStreamCallbacks): Promise<void> {
  return streamGroundwaterChat(query, chatHistory, {
    onData: (visualizations, summary) => {
      for (const viz of visualizations) {
        callbacks.onChart(viz);
      }
    },
    onToolCall: callbacks.onToolCall,
    onToolResult: (toolName, found, summaryText) => {
      callbacks.onToolResult(toolName, JSON.stringify({ found, textSummary: summaryText }));
    },
    onComplete: () => callbacks.onComplete(""),
    onError: callbacks.onError,
  });
}

/**
 * Structured response from groundwater chat
 */
export interface StructuredChatResponse {
  visualizations: Visualization[];
  summary?: TextSummary;
}

/**
 * Invoke groundwater chat and get structured response (non-streaming)
 * NO LLM text generation - only tool extraction + structured data
 */
export async function invokeGroundwaterChat(query: string, chatHistory: ChatMessage[] = []): Promise<StructuredChatResponse> {
  const agent = createGroundwaterAgent();

  const filteredHistory = filterSystemMessages(chatHistory);
  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), ...convertChatHistory(filteredHistory), new HumanMessage(query)];

  logger.debug("Invoking structured agent");
  const result = await agent.invoke({ messages });

  const visualizations: Visualization[] = [];
  let lastSummary: TextSummary | undefined;

  // Process all tool messages to extract visualizations
  for (const msg of result.messages) {
    if (msg._getType() === "tool") {
      const toolMessage = msg as ToolMessage;
      const toolName = toolMessage.name ?? "unknown";
      const resultJson = toolMessage.content as string;

      try {
        const parsed = JSON.parse(resultJson);

        // Generate summary from last tool result
        const summary = generateSummaryFromToolResult(toolName, parsed);
        if (summary) {
          lastSummary = summary;
        }
      } catch {
        // Not JSON
      }

      // Process tool result into visualizations
      await processToolResult(toolName, resultJson, (chart: object) => {
        visualizations.push(chart as Visualization);
      });
    }
  }

  logger.debug({ visualizationsCount: visualizations.length }, "Structured invocation completed");
  return { visualizations, summary: lastSummary };
}
