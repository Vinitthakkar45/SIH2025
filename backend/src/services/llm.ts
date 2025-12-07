import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


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
 * Generate a response using Groq LLM with context from RAG
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

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextMessage },
  ];

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b", // Fast and capable model on Groq
    messages,
    temperature: 0.3, // Lower temperature for more factual responses
    max_tokens: 2048,
  });

  return (
    completion.choices[0]?.message?.content || "I couldn't generate a response."
  );
}

/**
 * Generate a streaming response using Groq LLM
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

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextMessage },
  ];

  try {
    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages,
      temperature: 0.3,
      max_tokens: 2048,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        fullResponse += token;
        callbacks.onToken(token);
      }
    }

    callbacks.onComplete(fullResponse);
  } catch (error) {
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

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // Faster model for suggestions
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 200,
  });

  const response = completion.choices[0]?.message?.content || "";
  return response
    .split("\n")
    .map((q) => q.replace(/^\d+\.\s*/, "").trim())
    .filter((q) => q.length > 0)
    .slice(0, 3);
}
