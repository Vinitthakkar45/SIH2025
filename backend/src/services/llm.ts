import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import logger from "../utils/logger";

dotenv.config();

const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

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
 * Generate a response using Gemini
 */
export async function generateResponse(
  query: string,
  context: string
): Promise<string> {
  const contextMessage = `Context (use ONLY this data):
${context}

Question: ${query}`;

  const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  callbacks: StreamCallbacks
): Promise<void> {
  const contextMessage = `Context (use ONLY this data):
${context}

Question: ${query}`;

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

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
  context: string,
  language: string = "en"
): Promise<string[]> {
  const languageMap: Record<string, string> = {
    en: "English",
    hi: "Hindi (हिन्दी)",
    bn: "Bengali (বাংলা)",
    te: "Telugu (తెలుగు)",
    ta: "Tamil (தமிழ்)",
    ml: "Malayalam (മലയാളം)",
    pa: "Punjabi (ਪੰਜਾਬੀ)",
    ur: "Urdu (اردو)",
  };

  const languageInstruction =
    language !== "en"
      ? `Generate the suggestions in ${languageMap[language] || language}. `
      : "";

  const prompt = `Based on this groundwater data query and context, suggest 3 relevant follow-up questions the user might want to ask. ${languageInstruction}Return only the questions, one per line.

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

/**
 * Translate text to the target language
 */
export async function translateText(
  text: string,
  language: string = "en"
): Promise<string> {
  if (language === "en") return text;

  const languageMap: Record<string, string> = {
    hi: "Hindi (हिन्दी)",
    bn: "Bengali (বাংলা)",
    te: "Telugu (తెలుగు)",
    ta: "Tamil (தமிழ்)",
    ml: "Malayalam (മലയാളം)",
    pa: "Punjabi (ਪੰਜਾਬੀ)",
    ur: "Urdu (اردو)",
  };

  const targetLanguage = languageMap[language] || language;

  const prompt = `Translate the following text to ${targetLanguage}. Keep technical terms and numbers in English. Return ONLY the translated text, nothing else.

Text: ${text}`;

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text()?.trim() || text;
  } catch (error) {
    logger.error({ err: error, text, language }, "Translation failed");
    return text; // Fallback to original text
  }
}
