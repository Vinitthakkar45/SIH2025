import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";
import {
  StateGraph,
  MessagesAnnotation,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { allTools } from "./gwTools";

const SYSTEM_PROMPT = `You are an expert assistant for India's Groundwater Resources Information System (INGRES). You help users understand groundwater data across India at country, state, district, and taluk levels.

Your capabilities:
1. Find and retrieve groundwater data for any location in India
2. Compare groundwater metrics across multiple locations
3. Identify top/bottom locations by various metrics (rainfall, extraction, recharge, etc.)
4. Provide category summaries (safe, semi-critical, critical, over-exploited, saline)
5. Explain groundwater concepts and data

Key metrics you can help with:
- Rainfall (mm)
- Ground Water Recharge (ham) - from rainfall, canals, irrigation, tanks, artificial structures
- Natural Discharges/Loss (ham) - baseflow, evaporation, transpiration
- Annual Extractable Ground Water Resources (ham)
- Ground Water Extraction (ham) - for irrigation, domestic, industrial use
- Stage of Extraction (%) - ratio of extraction to availability
- Category - classification based on extraction levels

When answering:
1. First use tools to find and retrieve relevant data
2. Present data clearly with actual numbers
3. Explain what the numbers mean in context
4. If charts are returned by tools, mention that visualizations are available
5. Be helpful in explaining groundwater concepts if asked

Always use the appropriate tools to get accurate, up-to-date data rather than making assumptions.`;

export function createGroundwaterAgent() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash-exp",
    temperature: 0,
    apiVersion: "v1beta",
  }).bindTools(allTools);

  const toolNode = new ToolNode(allTools);

  function shouldContinue(
    state: typeof MessagesAnnotation.State
  ): "tools" | typeof END {
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

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export function convertChatHistory(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((msg) => {
    if (msg.role === "user") return new HumanMessage(msg.content);
    if (msg.role === "assistant") return new AIMessage(msg.content);
    return new SystemMessage(msg.content);
  });
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onChart: (chart: object) => void;
  onToolCall: (toolName: string, args: object) => void;
  onToolResult: (toolName: string, result: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export async function streamGroundwaterChat(
  query: string,
  chatHistory: ChatMessage[] = [],
  callbacks: StreamCallbacks
): Promise<void> {
  const agent = createGroundwaterAgent();

  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    ...convertChatHistory(chatHistory),
    new HumanMessage(query),
  ];

  const collectedCharts: object[] = [];
  let fullResponse = "";

  try {
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
        callbacks.onToolResult(
          toolMessage.name ?? "unknown",
          toolMessage.content as string
        );

        // Extract charts from tool results
        try {
          const result = JSON.parse(toolMessage.content as string);
          if (result.charts) {
            for (const chart of result.charts) {
              collectedCharts.push(chart);
              callbacks.onChart(chart);
            }
          }
        } catch {
          // Not JSON or no charts
        }
      }
    }

    callbacks.onComplete(fullResponse);
  } catch (error) {
    callbacks.onError(error as Error);
  }
}

export async function invokeGroundwaterChat(
  query: string,
  chatHistory: ChatMessage[] = []
): Promise<{ response: string; charts: object[] }> {
  const agent = createGroundwaterAgent();

  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    ...convertChatHistory(chatHistory),
    new HumanMessage(query),
  ];

  const result = await agent.invoke({ messages });

  const lastMessage = result.messages[result.messages.length - 1] as AIMessage;
  const response =
    typeof lastMessage.content === "string" ? lastMessage.content : "";

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

  return { response, charts };
}
