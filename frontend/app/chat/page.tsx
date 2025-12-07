"use client";

import ChartRenderer from "@/components/ChartRenderer";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ChatComposer from "@/components/ChatComposer";
import { Button } from "@heroui/button";
import { Skeleton } from "@heroui/react";
import { ArrowDownIcon, DropletIcon } from "@/components/icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MapsIcon, MessageIcon } from "@/components/icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ChartData {
  type: "chart" | "stats";
  chartType?: "bar" | "pie";
  title: string;
  description?: string;
  data: Record<string, unknown>[] | Record<string, unknown>;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  charts?: ChartData[];
  isLoading?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkScrollPosition = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
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
  }, [messages]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add loading assistant message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", charts: [], isLoading: true },
    ]);

    try {
      const response = await fetch(`${API_URL}/api/gw-chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          chatHistory: messages
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantContent = "";
      const charts: ChartData[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

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
              } else if (data.type === "chart" || data.type === "stats") {
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
              } else if (data.type === "done") {
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
    "What is the groundwater status in Gujarat?",
    "Which states have the highest extraction rate?",
    "Compare Maharashtra and Karnataka groundwater",
    "Show category distribution for all states",
  ];

  return (
    <div className="flex h-screen bg-zinc-900">
      {/* Main Chat Area */}
      <div
        className={`flex flex-col flex-1 transition duration-300 ${
          showMap ? "w-1/2" : "w-full"
        }`}
      >
        {/* Header */}
        <header className="bg-zinc-800 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link className="flex items-center gap-3" href={"/"}>
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <DropletIcon size={24} className="text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-zinc-100">
                  INGRES AI Assistant
                </h1>
                <p className="text-sm text-zinc-400">
                  Groundwater Resource Information
                </p>
              </div>
            </Link>
            <Button
              onPress={() => setShowMap(!showMap)}
              color={showMap ? "default" : "primary"}
              startContent={
                showMap ? <MessageIcon size={18} /> : <MapsIcon size={18} />
              }
            >
              <span className="text-sm font-medium">
                {showMap ? "Hide Map" : "Show Map"}
              </span>
            </Button>
          </div>
        </header>

        {/* Messages */}
        <main
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4"
        >
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <DropletIcon size={32} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                  Welcome to INGRES AI
                </h2>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Ask me anything about India&apos;s groundwater resources -
                  state data, district comparisons, extraction levels, and more.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQueries.map((q) => (
                    <Button
                      key={q}
                      onPress={() => handleSubmit(q)}
                      variant="flat"
                      radius="full"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%]  px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-white rounded-3xl rounded-br-none w-fit"
                      : "w-full"
                  }`}
                >
                  {message.isLoading && !message.content ? (
                    <div className="space-y-3 w-full">
                      <Skeleton className="h-3 w-1/3 rounded-lg" />
                      <Skeleton className="h-3 w-3/4 rounded-lg" />
                      <Skeleton className="h-3 w-2/3 rounded-lg" />
                    </div>
                  ) : (
                    <>
                      <MarkdownRenderer
                        content={message.content}
                        className={
                          message.role === "assistant" ? "text-zinc-200" : ""
                        }
                      />
                      {message.charts && message.charts.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {message.charts.map((chart, i) => (
                            <ChartRenderer key={i} chart={chart} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input */}
        <footer className="p-4 relative">
          {/* Scroll to bottom button */}
          {showScrollButton && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
              <Button
                isIconOnly
                radius="full"
                size="sm"
                color="default"
                onPress={() => {
                  scrollToBottom();
                  setShowScrollButton(false);
                }}
              >
                <ArrowDownIcon size={18} />
              </Button>
            </div>
          )}

          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            className="max-w-2xl mx-auto"
          />
        </footer>
      </div>

      {/* Map Panel */}
      <div
        className={`${
          showMap ? "w-1/2 opacity-100" : "w-0 opacity-0"
        } transition-all duration-300 bg-zinc-800 flex items-center justify-center`}
      >
        <div className="text-center text-zinc-400">
          <MapsIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">Map View</p>
        </div>
      </div>
    </div>
  );
}
