import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { allTools } from "../gwTools";

export const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ingres";

export const MAX_TOKENS = 40000;

/**
 * System prompt for tool extraction ONLY.
 * The LLM should ONLY use tools to extract data - it should NOT generate prose.
 */
export const SYSTEM_PROMPT = `You are INGRES, an AI that extracts groundwater data for India.

YOUR ONLY JOB: Use the provided tools to fetch data. Do NOT write explanations or summaries.

RULES:
1. ALWAYS use tools to get data - never make up information
2. After tools return data, respond with ONLY: "Data retrieved successfully."
3. Do NOT explain or summarize the tool results - the UI will display them directly
4. For ambiguous queries, use the most likely interpretation
5. Default year is 2024-2025 unless specified

LOCATION HIERARCHY: India → States → Districts → Blocks/Mandals/Taluks
AVAILABLE DATA: 2016-2017 to 2024-2025`;

export function createModel() {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
  }).bindTools(allTools);
}
