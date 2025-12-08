import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage, ToolMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { allTools } from "./gwTools";
import logger from "../utils/logger";
import { processToolResult } from "./toolResultHandlers";

const SYSTEM_PROMPT = `You are a friendly water expert helping everyday people understand groundwater in India. Think of yourself as a helpful neighbor who knows about water resources and wants to explain things simply.

You can help people learn about:
- How much underground water is available in their area
- Whether water levels are healthy or concerning
- How water use has changed over the years
- Which areas have good or poor water conditions

What you know about:
• Rainfall - How much rain falls in an area (measured in millimeters)
• Water Recharge - Underground water that gets refilled from rain, rivers, and irrigation
• Water Extraction - Underground water pumped out for farming, homes, and factories
• Water Health Status - Categories like "Safe" (plenty of water), "Semi-Critical", "Critical", or "Over-Exploited" (using too much)
• Stage of Extraction - A percentage showing how much water is being used compared to what's available (below 70% is healthy, above 100% means trouble)

How to explain things:
1. Use everyday language - say "underground water" instead of "groundwater resources"
2. Give real-world context - "That's enough water to fill X Olympic swimming pools"
3. Explain what numbers mean - "70% extraction means we're using 70 out of every 100 liters available"
4. Use comparisons - "Rainfall here is similar to [city], so you can imagine how much that is"
5. Share practical implications - "This means wells might run dry during summer" or "Water levels are healthy here"
6. When showing charts, briefly explain what the picture shows and what to look for

Always get actual data before answering - don't guess! When asked about trends or changes over time, look at historical data to give accurate information.

Remember: Your goal is to help regular people understand water conditions in simple, clear terms they can relate to.`;

export function createGroundwaterAgent() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
  }).bindTools(allTools);

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
    const messages = state.messages;
    const response = await model.invoke(messages);
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

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onChart: (chart: object) => void;
  onToolCall: (toolName: string, args: object) => void;
  onToolResult: (toolName: string, result: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export async function streamGroundwaterChat(query: string, callbacks: StreamCallbacks): Promise<void> {
  const agent = createGroundwaterAgent();

  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(query)];

  let fullResponse = "";

  try {
    logger.debug("Starting agent stream");
    const stream = await agent.stream({ messages }, { streamMode: "messages" });

    for await (const chunk of stream) {
      const [message, metadata] = chunk;

      if (message._getType() === "ai") {
        const aiMessage = message as AIMessage;

        // Stream text content
        if (aiMessage.content && typeof aiMessage.content === "string") {
          callbacks.onToken(aiMessage.content);
          fullResponse += aiMessage.content;
        }

        // Handle tool calls
        if (aiMessage.tool_calls?.length) {
          for (const toolCall of aiMessage.tool_calls) {
            callbacks.onToolCall(toolCall.name, toolCall.args);
          }
        }
      }

      if (message._getType() === "tool") {
        const toolMessage = message as ToolMessage;
        const toolName = toolMessage.name ?? "unknown";
        callbacks.onToolResult(toolName, toolMessage.content as string);

        // Process tool result and stream visualizations
        await processToolResult(toolName, toolMessage.content as string, callbacks.onChart);
      }
    }

    logger.debug("Agent stream completed");
    callbacks.onComplete(fullResponse);
  } catch (error) {
    logger.error({ err: error }, "Agent stream failed");
    callbacks.onError(error as Error);
  }
}

export async function invokeGroundwaterChat(query: string): Promise<{ response: string; charts: object[] }> {
  const agent = createGroundwaterAgent();

  const messages: BaseMessage[] = [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(query)];

  logger.debug("Invoking agent");
  const result = await agent.invoke({ messages });

  const lastMessage = result.messages[result.messages.length - 1] as AIMessage;
  const response = typeof lastMessage.content === "string" ? lastMessage.content : "";

  // Collect charts from all tool messages
  const charts: object[] = [];
  for (const msg of result.messages) {
    if (msg._getType() === "tool") {
      try {
        const toolResult = JSON.parse((msg as ToolMessage).content as string);
        if (toolResult.charts) {
          charts.push(...toolResult.charts);
        }
      } catch {
        // Not JSON
      }
    }
  }

  logger.debug({ chartsCount: charts.length }, "Agent invocation completed");
  return { response, charts };
}
