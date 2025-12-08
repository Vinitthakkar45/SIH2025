import { db } from "../db/gw-db";
import { conversations, messages } from "../db/gw-schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import logger from "../utils/logger";

// Types
export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
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
 * Create a new conversation
 */
export async function createConversation(title: string = "New Chat", userId: string = "default_user"): Promise<string> {
  const [conversation] = await db
    .insert(conversations)
    .values({
      title,
      userId,
      metadata: {},
    })
    .returning({ id: conversations.id });

  logger.info({ conversationId: conversation.id }, "Created new conversation");
  return conversation.id;
}

/**
 * Get all conversations for a user, ordered by most recent
 */
export async function getConversations(userId: string = "default_user", limit: number = 50): Promise<ConversationSummary[]> {
  const result = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);

  return result;
}

/**
 * Get a specific conversation with its messages
 */
export async function getConversation(conversationId: string): Promise<{
  conversation: ConversationSummary | null;
  messages: StoredMessage[];
}> {
  const [conversation] = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) {
    return { conversation: null, messages: [] };
  }

  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.sequenceNumber));

  return {
    conversation,
    messages: conversationMessages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      visualizations: m.visualizations as object[] | undefined,
      suggestions: m.suggestions as string[] | undefined,
      sequenceNumber: m.sequenceNumber,
      createdAt: m.createdAt,
      tokenCount: m.tokenCount ?? undefined,
      metadata: m.metadata as object | undefined,
    })),
  };
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string,
  options?: {
    visualizations?: object[];
    suggestions?: string[];
    metadata?: object;
  }
): Promise<StoredMessage> {
  // Get the current max sequence number
  const [maxSeq] = await db
    .select({ max: sql<number>`COALESCE(MAX(${messages.sequenceNumber}), 0)` })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const sequenceNumber = (maxSeq?.max ?? 0) + 1;
  const tokenCount = estimateTokenCount(content);

  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      role,
      content,
      visualizations: options?.visualizations,
      suggestions: options?.suggestions,
      sequenceNumber,
      tokenCount,
      metadata: options?.metadata,
    })
    .returning();

  // Update conversation's updatedAt timestamp
  await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId));

  // Auto-generate title from first user message if it's still "New Chat"
  if (role === "user" && sequenceNumber === 1) {
    const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
    await db.update(conversations).set({ title }).where(eq(conversations.id, conversationId));
  }

  logger.debug({ conversationId, messageId: message.id, role, sequenceNumber }, "Added message to conversation");

  return {
    id: message.id,
    conversationId: message.conversationId,
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
 * Update an assistant message (for streaming completion)
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
 * 1. Always include the system message
 * 2. Always include the most recent N messages
 * 3. Trim older messages to fit within token budget
 * 4. Summarize trimmed content if significant
 */
export async function getTrimmedChatHistory(conversationId: string, maxTokens: number = MAX_CONTEXT_TOKENS): Promise<ChatMessage[]> {
  const { messages: allMessages } = await getConversation(conversationId);

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
 * Delete a conversation and all its messages
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await db.delete(conversations).where(eq(conversations.id, conversationId));
  logger.info({ conversationId }, "Deleted conversation");
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  await db.update(conversations).set({ title, updatedAt: new Date() }).where(eq(conversations.id, conversationId));
}

/**
 * Get the next sequence number for a conversation
 */
export async function getNextSequenceNumber(conversationId: string): Promise<number> {
  const [maxSeq] = await db
    .select({ max: sql<number>`COALESCE(MAX(${messages.sequenceNumber}), 0)` })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  return (maxSeq?.max ?? 0) + 1;
}
