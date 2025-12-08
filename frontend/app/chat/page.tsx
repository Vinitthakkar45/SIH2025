"use client";

import ChatComposer from "@/components/ChatComposer";
import ChatSidebar from "@/components/ChatSidebar";
import MessageList, { type Message } from "@/components/MessageList";
import WelcomeScreen from "@/components/WelcomeScreen";
import type { Visualization } from "@/types/visualizations";
import { ArrowDown02Icon } from "@/components/icons";
import { Button } from "@heroui/button";
import { useEffect, useRef, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface LocationInfo {
  state: string;
  district: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationInfo>({
    state: "India",
    district: "India",
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
        // Keep default location on error
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Keep default location on error
        }
      );
    }
  }, []);

  // Load conversation messages when switching conversations
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        // Convert stored messages to the format expected by MessageList
        const loadedMessages: Message[] = data.messages.map(
          (msg: { role: "user" | "assistant"; content: string; visualizations?: Visualization[]; suggestions?: string[] }) => ({
            role: msg.role,
            content: msg.content,
            charts: msg.visualizations || [],
            suggestions: msg.suggestions || [],
            isLoading: false,
          })
        );
        setMessages(loadedMessages);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, []);

  // Handle selecting a conversation from sidebar
  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      if (conversationId !== currentConversationId) {
        loadConversation(conversationId);
      }
    },
    [currentConversationId, loadConversation]
  );

  // Handle starting a new chat
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
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
    // Check scroll position when messages update
    checkScrollPosition();

    // Auto-scroll to bottom when new messages are added (if not manually scrolled up)
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages, showScrollButton]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add loading assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "", charts: [], isLoading: true }]);

    try {
      const response = await fetch(`${API_URL}/api/gw-chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantContent = "";
      const charts: Visualization[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle conversation ID from server
              if (data.type === "conversation_id") {
                setCurrentConversationId(data.conversationId);
                continue;
              }

              if (data.type === "token") {
                assistantContent += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: assistantContent,
                    isLoading: false,
                  };
                  return updated;
                });
              } else if (
                data.type === "chart" ||
                data.type === "stats" ||
                data.type === "table" ||
                data.type === "summary" ||
                data.type === "trend_summary" ||
                data.type === "data_container"
              ) {
                charts.push(data);
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    charts: [...charts],
                  };
                  return updated;
                });
              } else if (data.type === "suggestions") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    suggestions: data.suggestions,
                  };
                  return updated;
                });
              } else if (data.type === "done") {
                // Update conversation ID if returned
                if (data.conversationId) {
                  setCurrentConversationId(data.conversationId);
                }

                setMessages((prev) => {
                  const updated = [...prev];
                  const lastIdx = updated.length - 1;
                  updated[lastIdx] = { ...updated[lastIdx], isLoading: false };
                  return updated;
                });
              } else if (data.type === "error") {
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
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQueries = [
    `What is the groundwater status in ${userLocation.state}?`,
    `Show historical trend for ${userLocation.district}`,
    `How has groundwater extraction changed in ${userLocation.state} over the years?`,
  ];

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex h-screen bg-dark-primary overflow-hidden">
      {/* Chat Sidebar */}
      <ChatSidebar
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Messages Area */}
        <main
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="max-w-4xl mx-auto px-4 py-6 min-h-full">
            {messages.length === 0 ? (
              <WelcomeScreen suggestedQueries={suggestedQueries} onQueryClick={handleSubmit} />
            ) : (
              <div className="space-y-4">
                <MessageList messages={messages} onSuggestionClick={handleSubmit} />
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        {/* Input Area */}
        <footer className="p-4 shrink-0">
          {/* Scroll to bottom button */}
          {showScrollButton && (
            <div className="flex justify-center mb-3">
              <Button
                isIconOnly
                radius="full"
                size="sm"
                variant="flat"
                className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 shadow-lg"
                onPress={() => {
                  scrollToBottom();
                  setShowScrollButton(false);
                }}>
                <ArrowDown02Icon size={16} />
              </Button>
            </div>
          )}

          <ChatComposer value={input} onChange={setInput} onSubmit={handleSubmit} isLoading={isLoading} className="max-w-3xl mx-auto" />
        </footer>
      </div>
    </div>
  );
}
