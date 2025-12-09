import { Message, ChatFilters, StreamResponse, Visualization } from "../types";

const API_BASE_URL = "http://localhost:3001";

export interface ChatStreamCallbacks {
  onToken: (token: string) => void;
  onChart: (chart: Visualization) => void;
  onSuggestions: (suggestions: string[]) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

export async function streamChat(
  query: string,
  chatHistory: Pick<Message, "role" | "content">[],
  _filters: ChatFilters,
  callbacks: ChatStreamCallbacks,
  language: string = "en"
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gw-chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        language,
        chatHistory: chatHistory.map((m) => ({ role: m.role, content: m.content })),
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
              case "token":
                if (data.content) {
                  callbacks.onToken(data.content);
                }
                break;
              case "chart":
              case "stats":
              case "table":
              case "summary":
              case "trend_summary":
              case "data_container":
                callbacks.onChart(data as unknown as Visualization);
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
