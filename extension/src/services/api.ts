import { Message, ChatFilters, StreamResponse, Source } from "../types";

const API_BASE_URL = "http://localhost:3001";

export interface ChatStreamCallbacks {
  onSources: (sources: Source[]) => void;
  onToken: (token: string) => void;
  onSuggestions: (suggestions: string[]) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

export async function streamChat(
  query: string,
  chatHistory: Pick<Message, "role" | "content">[],
  filters: ChatFilters,
  callbacks: ChatStreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        chatHistory: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        topK: 5,
        filters,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        callbacks.onComplete();
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data: StreamResponse = JSON.parse(line.slice(6));

            switch (data.type) {
              case "sources":
                if (data.sources) {
                  callbacks.onSources(data.sources);
                }
                break;
              case "token":
                if (data.content) {
                  callbacks.onToken(data.content);
                }
                break;
              case "suggestions":
                if (data.suggestions) {
                  callbacks.onSuggestions(data.suggestions);
                }
                break;
              case "error":
                callbacks.onError(data.error || "Unknown error");
                break;
              case "done":
                callbacks.onComplete();
                break;
            }
          } catch (e) {
            console.error("Failed to parse SSE data:", e);
          }
        }
      }
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error.message : "Failed to connect to server");
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
