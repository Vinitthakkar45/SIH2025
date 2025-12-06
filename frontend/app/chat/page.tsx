"use client";

import { useState, useRef, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Source {
  id: string;
  text: string;
  metadata: {
    state?: string;
    district?: string;
    block?: string;
    year?: string;
    categorization?: string;
  };
  relevance: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSuggestions([]);

    try {
      // Use streaming endpoint
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          chatHistory: messages.slice(-6), // Last 3 exchanges
          topK: 5,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let assistantContent = "";
      let sources: Source[] = [];

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, { role: "assistant", content: "", sources: [] }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "sources") {
                sources = data.sources;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].sources = sources;
                  return updated;
                });
              } else if (data.type === "token") {
                assistantContent += data.content;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = assistantContent;
                  return updated;
                });
              } else if (data.type === "suggestions") {
                setSuggestions(data.suggestions);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">💧</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">INGRES AI Assistant</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">India&apos;s Groundwater Resource Information System</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💧</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Welcome to INGRES AI</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Ask me anything about India&apos;s groundwater resources, state-wise reports, extraction levels, and sustainability status.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "What is the groundwater status in Maharashtra?",
                  "Which states have critical groundwater levels?",
                  "Compare rainfall in Punjab vs Rajasthan",
                  "Show over-exploited blocks in Tamil Nadu",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSubmit(q)}
                    className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div key={idx} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                }`}>
                {/* Sources badge */}
                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {message.sources.slice(0, 3).map((src) => (
                      <span key={src.id} className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {src.metadata.state || "Unknown"} {src.metadata.year && `(${src.metadata.year})`}
                      </span>
                    ))}
                  </div>
                )}

                <p className={`whitespace-pre-wrap ${message.role === "assistant" ? "text-gray-800 dark:text-gray-200" : ""}`}>
                  {message.content}
                  {isLoading && idx === messages.length - 1 && message.role === "assistant" && !message.content && (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce delay-100">●</span>
                      <span className="animate-bounce delay-200">●</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}

          {/* Suggestions */}
          {suggestions.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(s)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about groundwater data..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isLoading ? "..." : "Send"}
          </button>
        </form>
      </footer>
    </div>
  );
}
