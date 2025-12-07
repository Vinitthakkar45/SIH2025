import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// System prompt for the RAG assistant
const SYSTEM_PROMPT = `You are INGRES AI Assistant, an expert on India's groundwater resources. You help users understand groundwater data from the INGRES (India-WRIS National Groundwater Resource Estimation System) database.

You have access to detailed groundwater data including:
- State and district-level reports
- Block-wise groundwater assessments
- Annual rainfall data
- Groundwater recharge statistics
- Extraction levels and sustainability status (Safe, Semi-Critical, Critical, Over-Exploited, Saline)

When answering:
1. Be precise and cite specific data from the provided context
2. Use the exact numbers and statistics when available
3. Explain technical terms in simple language
4. If data is not available in the context, clearly say so
5. Suggest related queries the user might find helpful

Format your responses with:
- Clear headings for different sections
- Bullet points for lists
- Bold for important statistics
- Tables when comparing multiple regions`;

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

/**
 * Generate a response using Gemini
 */
export async function generateResponse(
  query: string,
  context: string,
  chatHistory: Message[] = []
): Promise<string> {
  const contextMessage = `Here is the relevant groundwater data context to help answer the user's question:

${context}

---
User Question: ${query}`;

  const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
  const history = chatHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I am INGRES AI Assistant, ready to help with India's groundwater data.",
          },
        ],
      },
      ...history,
    ],
    generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
  });

  const result = await chat.sendMessage(contextMessage);
  return result.response.text() || "I couldn't generate a response.";
}

/**
 * Generate a streaming response using Gemini
 */
export async function generateStreamingResponse(
  query: string,
  context: string,
  chatHistory: Message[] = [],
  callbacks: StreamCallbacks
): Promise<void> {
  const contextMessage = `Here is the relevant groundwater data context to help answer the user's question:

${context}

---
User Question: ${query}`;

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const history = chatHistory.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I am INGRES AI Assistant, ready to help with India's groundwater data.",
            },
          ],
        },
        ...history,
      ],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    });

    const result = await chat.sendMessageStream(contextMessage);
    let fullResponse = "";

    for await (const chunk of result.stream) {
      const token = chunk.text();
      if (token) {
        fullResponse += token;
        callbacks.onToken(token);
      }
    }

    callbacks.onComplete(fullResponse);
  } catch (error) {
    logger.error({ err: error }, "Streaming response failed");
    callbacks.onError(
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Generate suggested follow-up questions
 */
export async function generateSuggestions(
  query: string,
  context: string
): Promise<string[]> {
  const prompt = `Based on this groundwater data query and context, suggest 3 relevant follow-up questions the user might want to ask. Return only the questions, one per line.

Query: ${query}
Context summary: ${context.substring(0, 500)}...`;

  const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const response = result.response.text() || "";
  return response
    .split("\n")
    .map((q) => q.replace(/^\d+\.\s*/, "").trim())
    .filter((q) => q.length > 0)
    .slice(0, 3);
}
