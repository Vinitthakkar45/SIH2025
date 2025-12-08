import { db } from "../db/gw-db";
import { messages } from "../db/gw-schema";
import { desc, asc, eq } from "drizzle-orm";
import logger from "../utils/logger";

// Types
export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  visualizations?: object[];
  suggestions?: string[];
  sequenceNumber: number;
  createdAt: Date;
  tokenCount?: number;
  metadata?: object;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Token estimation (rough approximation: ~4 chars per token)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Maximum context tokens to send to LLM (leaving room for response)
const MAX_CONTEXT_TOKENS = 8000;

/**
 * Get all messages ordered by sequence
 */
export async function getAllMessages(): Promise<StoredMessage[]> {
  const allMessages = await db
    .select()
    .from(messages)
    .orderBy(asc(messages.sequenceNumber));

  return allMessages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    visualizations: m.visualizations as object[] | undefined,
    suggestions: m.suggestions as string[] | undefined,
    sequenceNumber: m.sequenceNumber,
    createdAt: m.createdAt,
    tokenCount: m.tokenCount ?? undefined,
    metadata: m.metadata as object | undefined,
  }));
}

/**
 * Add a message to the chat history
 */
export async function addMessage(
  role: "user" | "assistant" | "system",
  content: string,
  options?: {
    visualizations?: object[];
    suggestions?: string[];
    metadata?: object;
  }
): Promise<StoredMessage> {
  // Get the current max sequence number
  const allMessages = await db
    .select()
    .from(messages)
    .orderBy(desc(messages.sequenceNumber))
    .limit(1);
  const sequenceNumber =
    allMessages.length > 0 ? allMessages[0].sequenceNumber + 1 : 1;
  const tokenCount = estimateTokenCount(content);

  const [message] = await db
    .insert(messages)
    .values({
      role,
      content,
      visualizations: options?.visualizations,
      suggestions: options?.suggestions,
      sequenceNumber,
      tokenCount,
      metadata: options?.metadata,
    })
    .returning();

  logger.debug(
    { messageId: message.id, role, sequenceNumber },
    "Added message to chat history"
  );

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    visualizations: message.visualizations as object[] | undefined,
    suggestions: message.suggestions as string[] | undefined,
    sequenceNumber: message.sequenceNumber,
    createdAt: message.createdAt,
    tokenCount: message.tokenCount ?? undefined,
    metadata: message.metadata as object | undefined,
  };
}

/**
 * Update a message (for streaming completion)
 */
export async function updateMessage(
  messageId: string,
  updates: {
    content?: string;
    visualizations?: object[];
    suggestions?: string[];
    metadata?: object;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (updates.content !== undefined) {
    updateData.content = updates.content;
    updateData.tokenCount = estimateTokenCount(updates.content);
  }
  if (updates.visualizations !== undefined) {
    updateData.visualizations = updates.visualizations;
  }
  if (updates.suggestions !== undefined) {
    updateData.suggestions = updates.suggestions;
  }
  if (updates.metadata !== undefined) {
    updateData.metadata = updates.metadata;
  }

  await db.update(messages).set(updateData).where(eq(messages.id, messageId));
}

/**
 * Get trimmed chat history for LLM context
 * Implements a sliding window approach with smart trimming:
 * 1. Always include the most recent N messages
 * 2. Trim older messages to fit within token budget
 * 3. Summarize trimmed content if significant
 */
export async function getTrimmedChatHistory(
  maxTokens: number = MAX_CONTEXT_TOKENS
): Promise<ChatMessage[]> {
  const allMessages = await getAllMessages();

  if (allMessages.length === 0) {
    return [];
  }

  // Calculate total tokens
  let totalTokens = 0;
  const messagesWithTokens = allMessages.map((m) => ({
    ...m,
    tokens: m.tokenCount || estimateTokenCount(m.content),
  }));

  messagesWithTokens.forEach((m) => (totalTokens += m.tokens));

  // If within budget, return all messages
  if (totalTokens <= maxTokens) {
    return messagesWithTokens.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  // Smart trimming: Keep recent messages, trim older ones
  const result: ChatMessage[] = [];
  let usedTokens = 0;

  // Always keep the last 6 messages (3 exchanges) if possible
  const recentMessages = messagesWithTokens.slice(-6);
  const olderMessages = messagesWithTokens.slice(0, -6);

  // Add recent messages first (they're most important)
  for (const msg of recentMessages) {
    if (usedTokens + msg.tokens <= maxTokens) {
      result.push({ role: msg.role, content: msg.content });
      usedTokens += msg.tokens;
    }
  }

  // Add older messages from most recent to oldest until budget is exhausted
  const remainingBudget = maxTokens - usedTokens;
  let olderTokens = 0;
  const includedOlder: ChatMessage[] = [];

  for (let i = olderMessages.length - 1; i >= 0; i--) {
    const msg = olderMessages[i];
    if (olderTokens + msg.tokens <= remainingBudget) {
      includedOlder.unshift({ role: msg.role, content: msg.content });
      olderTokens += msg.tokens;
    } else {
      break;
    }
  }

  // If we had to skip some older messages, add a summary note
  const skippedCount = olderMessages.length - includedOlder.length;
  if (skippedCount > 0) {
    const summaryNote: ChatMessage = {
      role: "system",
      content: `[Previous ${skippedCount} messages were summarized to fit context window. The conversation has been ongoing about groundwater data queries.]`,
    };
    return [summaryNote, ...includedOlder, ...result];
  }

  return [...includedOlder, ...result];
}

/**
 * Clear all messages (for new chat)
 */
export async function clearAllMessages(): Promise<void> {
  await db.delete(messages);
  logger.info("Cleared all messages");
}
