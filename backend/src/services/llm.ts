import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization of Groq client
let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

// System prompt for the RAG assistant
const SYSTEM_PROMPT = `You are INGRES AI Assistant, a groundwater data expert for India. Your role is to provide SHORT, PRECISE answers based ONLY on the provided context.

CRITICAL RULES:
1. ONLY use data from the provided context - never make up statistics
2. Focus on the EXACT location/year the user asked about - ignore other locations in context
3. Keep responses BRIEF (3-5 bullet points max for simple queries)
4. Use exact numbers from context with units (ham, mm, %, ha)
5. If specific data isn't in context, say "Data not available" - don't guess
6. ALWAYS respond in markdown format

RESPONSE FORMAT:
- For single location: Direct bullet points with key metrics but if user specifies more provide more details
- For comparisons: Simple table format
- NO lengthy introductions or explanations
- NO repeating the question back
- Bold only the most critical values (status, extraction %)

KEY METRICS TO PRIORITIZE:
• Groundwater Status (Safe/Semi-Critical/Critical/Over-Exploited)
• Stage of Extraction (%)
• Annual Recharge vs Extraction (ham)
• Net Availability (ham)

Example good response:
**Aibawk, Aizawl, Mizoram (2024-2025)**
• Status: **SAFE**
• Extraction: 5.98 ham / 8.61 ham extractable (**69.5%**)
• Annual Recharge: 9.57 ham
• Net Availability: 2.35 ham`;

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
  const contextMessage = `Context (use ONLY this data):
${context}

Question: ${query}

Remember: Be brief and precise. Only use data from context above.`;

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextMessage },
  ];

  const completion = await getGroqClient().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    temperature: 0.1, // Very low for factual, consistent responses
    max_tokens: 512, // Shorter responses
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
  const contextMessage = `Context (use ONLY this data):
${context}

Question: ${query}

Remember: Be brief and precise. Only use data from context above.`;

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextMessage },
  ];

  try {
    const stream = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.1,
      max_tokens: 512,
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

  const completion = await getGroqClient().chat.completions.create({
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
