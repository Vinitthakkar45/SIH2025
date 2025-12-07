// import Groq from "groq-sdk";

// let groq: Groq | null = null;

// function getGroqClient(): Groq {
//   if (!groq) {
//     const apiKey = process.env.GROQ_API_KEY;
//     if (!apiKey) {
//       throw new Error(
//         "GROQ_API_KEY is not set. Please add it to your .env file. Get a free key at https://console.groq.com"
//       );
//     }
//     groq = new Groq({
//       apiKey,
// });
//   }
//   return groq;
// }

// Self-hosted model configuration
const LLM_API_URL = process.env.LLM_API_URL || "http://localhost:8080";
const LLM_MODEL = process.env.LLM_MODEL || "gemma3:12b";

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
 * Generate a response using self-hosted LLM with context from RAG
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

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextMessage },
  ];

  // Build prompt from messages
  const prompt = messages
    .map((m) => {
      if (m.role === "system") return `System: ${m.content}`;
      if (m.role === "assistant") return `Assistant: ${m.content}`;
      return `User: ${m.content}`;
    })
    .join("\n\n");

  // Use self-hosted model on localhost:8080
  const response = await fetch(`${LLM_API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      model: LLM_MODEL,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const data = await response.json();
  // Assume response is either { response: "..." } or just the text directly
  return data.response || data.text || data || "I couldn't generate a response.";

  // Original Groq code (commented out):
  // const completion = await getGroqClient().chat.completions.create({
  //   model: "llama-3.3-70b-versatile", // Updated model on Groq
  //   messages,
  //   temperature: 0.3, // Lower temperature for more factual responses
  //   max_tokens: 2048,
  // });
  // return completion.choices[0]?.message?.content || "I couldn't generate a response.";
}

/**
 * Generate a streaming response using self-hosted LLM
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

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: contextMessage },
  ];

  try {
    // Build prompt from messages
    const prompt = messages
      .map((m) => {
        if (m.role === "system") return `System: ${m.content}`;
        if (m.role === "assistant") return `Assistant: ${m.content}`;
        return `User: ${m.content}`;
      })
      .join("\n\n");

    // Use streaming endpoint from Ollama API server (similar to Groq)
    const response = await fetch(`${LLM_API_URL}/api/generate/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: LLM_MODEL,
      }),
      // Increase timeout for large responses
      signal: AbortSignal.timeout(120000), // 2 minutes
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      let errorMessage = `LLM API error: ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If not JSON, use the text as is
        if (errorText) errorMessage = `LLM API error: ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    // Stream response from Ollama (similar to Groq streaming)
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";
    let buffer = "";

    if (!reader) {
      throw new Error("No response body reader available");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            
            // Handle streaming tokens from Ollama
            if (data.token) {
              fullResponse += data.token;
              callbacks.onToken(data.token);
            }
            
            // Check if streaming is done
            if (data.done) {
              callbacks.onComplete(fullResponse);
              return;
            }
            
            // Handle errors
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
            if (e instanceof Error && !e.message.includes("JSON")) {
              console.error("Stream parsing error:", e);
            }
          }
        }
      }
    }

    // If we exit the loop without done flag, complete anyway
    callbacks.onComplete(fullResponse);

    // Original Groq code (commented out):
    // const stream = await getGroqClient().chat.completions.create({
    //   model: "llama-3.3-70b-versatile",
    //   messages,
    //   temperature: 0.3,
    //   max_tokens: 2048,
    //   stream: true,
    // });
    // let fullResponse = "";
    // for await (const chunk of stream) {
    //   const token = chunk.choices[0]?.delta?.content || "";
    //   if (token) {
    //     fullResponse += token;
    //     callbacks.onToken(token);
    //   }
    // }
    // callbacks.onComplete(fullResponse);
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : String(error);
    
    // Provide more helpful error messages
    if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      callbacks.onError(new Error("Request timed out. The model may be taking too long to respond. Please try again."));
    } else if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("Failed to fetch")) {
      callbacks.onError(new Error("Cannot connect to LLM service. Please ensure Ollama API server is running on port 8080."));
    } else {
      callbacks.onError(new Error(errorMessage));
    }
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

  // Use self-hosted model on localhost:8080
  const response = await fetch(`${LLM_API_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      model: LLM_MODEL,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.response || data.text || data || "";
  return content
    .split("\n")
    .map((q) => q.replace(/^\d+\.\s*/, "").trim())
    .filter((q) => q.length > 0)
    .slice(0, 3);

  // Original Groq code (commented out):
  // const completion = await getGroqClient().chat.completions.create({
  //   model: "llama-3.1-8b-instant", // Faster model for suggestions
  //   messages: [{ role: "user", content: prompt }],
  //   temperature: 0.7,
  //   max_tokens: 200,
  // });
  // const response = completion.choices[0]?.message?.content || "";
  // return response
  //   .split("\n")
  //   .map((q) => q.replace(/^\d+\.\s*/, "").trim())
  //   .filter((q) => q.length > 0)
  //   .slice(0, 3);
}
