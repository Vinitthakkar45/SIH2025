"use client";
"use i18n";

import ChatComposer from "@/components/ChatComposer";
import { Location01Icon } from "@/components/icons";
import MessageList, { type Message } from "@/components/MessageList";
import type { Visualization, TextSummary } from "@/types/visualizations";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MapWrapper from "./MapWrapper";
import ScrollToBottom from "./ScrollToBottom";
import WelcomeView from "./WelcomeView";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface LocationInfo {
  state: string;
  district: string;
}

/**
 * Check if an SSE data event is a visualization type
 */
function isVisualizationType(type: string): boolean {
  return ["chart", "stats", "table", "summary", "trend_summary", "data_container", "collapsible"].includes(type);
}

export default function ChatPage() {
  const [showMap, setShowMap] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationInfo>({
    state: "India",
    district: "India",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchLocation = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }

        const data = await response.json();

        const state = data.principalSubdivision;
        const district = data.city || data.locality || data.localityInfo?.administrative?.[2]?.name;

        setUserLocation({ state, district });
      } catch (error) {
        console.error("Failed to fetch location details:", error);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkScrollPosition = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isScrollable = scrollHeight > clientHeight;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setShowScrollButton(isScrollable && !isAtBottom);
  };

  const handleScroll = () => {
    checkScrollPosition();
  };

  useEffect(() => {
    checkScrollPosition();

    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages, showScrollButton]);

  /**
   * Handle chat submission with STRUCTURED data response
   * NO LLM text processing - data is rendered directly
   */
  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add loading assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "", charts: [], isLoading: true }]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/api/gw-chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          chatHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      // Collect visualizations - NO text content from LLM
      const charts: Visualization[] = [];
      let summary: TextSummary | undefined;
      let activeTool: string | undefined;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle tool call - show progress
              if (data.type === "tool_call") {
                activeTool = data.tool;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    activeTool,
                    isLoading: true,
                  };
                  return updated;
                });
              }
              // Handle tool result - update progress
              else if (data.type === "tool_result") {
                // Tool completed, clear active tool
                activeTool = undefined;
              }
              // Handle structured data events
              else if (data.type === "data" && data.visualizations) {
                // New SSE data format
                for (const viz of data.visualizations) {
                  charts.push(viz);
                }
                if (data.summary) {
                  summary = data.summary;
                }
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    charts: [...charts],
                    summary,
                    isLoading: false,
                    activeTool: undefined,
                  };
                  return updated;
                });
              }
              // Handle legacy visualization format (backward compatibility)
              else if (isVisualizationType(data.type)) {
                charts.push(data as Visualization);
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    charts: [...charts],
                    isLoading: false,
                    activeTool: undefined,
                  };
                  return updated;
                });
              }
              // Handle suggestions
              else if (data.type === "suggestions") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    suggestions: data.suggestions,
                  };
                  return updated;
                });
              }
              // Handle completion
              else if (data.type === "done") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    isLoading: false,
                    activeTool: undefined,
                  };
                  return updated;
                });
              }
              // Handle errors
              else if (data.type === "error") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    role: "assistant",
                    content: `Error: ${data.error}`,
                    isLoading: false,
                  };
                  return updated;
                });
              }
              // NOTE: We intentionally ignore "token" events - no LLM text
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            ...updated[lastIdx],
            isLoading: false,
          };
          return updated;
        });
      } else {
        console.error("Chat error:", error);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          updated[lastIdx] = {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            isLoading: false,
          };
          return updated;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex h-screen bg-dark-primary overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 relative">
        <ChatHeader onToggleMap={() => setShowMap(!showMap)} showMap={showMap} />

        <main ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {messages.length === 0 ? (
              <WelcomeView onQueryClick={handleSubmit} userLocation={userLocation} />
            ) : (
              <MessageList messages={messages} onSuggestionClick={handleSubmit} />
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <ScrollToBottom
          visible={showScrollButton}
          onClick={() => {
            scrollToBottom();
            setShowScrollButton(false);
          }}
        />

        <div className="max-w-2xl mx-auto w-full pt-3">
          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            onStop={handleStop}
            isLoading={isLoading}
            placeholder="Ask me anything..."
          />
        </div>
      </div>

      {/* Map Panel */}
      <div className={`${showMap ? "w-1/2 opacity-100" : "w-0 opacity-0"} transition-all duration-300 bg-zinc-900 overflow-hidden`}>
        {showMap ? (
          <MapWrapper />
        ) : (
          <div className="flex items-center justify-center h-full text-center text-zinc-400">
            <div>
              <Location01Icon width={48} height={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">Map View</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
