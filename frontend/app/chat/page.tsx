"use client";

import { useState, useRef, useEffect } from "react";
import { Map, MessageSquare, Send, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/react";

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

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const CATEGORY_COLORS: Record<string, string> = {
  safe: "#10b981",
  semi_critical: "#3b82f6",
  critical: "#f59e0b",
  over_exploited: "#ef4444",
  salinity: "#8b5cf6",
  hilly_area: "#6b7280",
  no_data: "#9ca3af",
};

function ChartRenderer({ chart }: { chart: ChartData }) {
  if (chart.type === "stats") {
    const stats = chart.data as Record<string, unknown>;
    return (
      <div className="bg-zinc-800 rounded-lg p-4 my-2">
        <h4 className="font-semibold text-zinc-100 mb-3">{chart.title}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-zinc-900 p-3 rounded-lg">
              <p className="text-xs text-zinc-400 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-lg font-semibold text-zinc-100">
                {typeof value === "number"
                  ? value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  : String(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (chart.chartType === "bar") {
    const data = chart.data as Record<string, unknown>[];
    return (
      <div className="bg-zinc-800 rounded-lg p-4 my-2">
        <h4 className="font-semibold text-zinc-100 mb-1">{chart.title}</h4>
        {chart.description && (
          <p className="text-sm text-zinc-400 mb-3">{chart.description}</p>
        )}
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {data[0] &&
              Object.keys(data[0])
                .filter((k) => k !== "name" && k !== "category")
                .map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.chartType === "pie") {
    const data = chart.data as { name: string; value: number }[];
    return (
      <div className="bg-zinc-800 rounded-lg p-4 my-2">
        <h4 className="font-semibold text-zinc-100 mb-1">{chart.title}</h4>
        {chart.description && (
          <p className="text-sm text-zinc-400 mb-3">{chart.description}</p>
        )}
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) =>
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={
                    CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
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
        className={`flex flex-col flex-1 transition-all duration-300 ${
          showMap ? "w-1/2" : "w-full"
        }`}
      >
        {/* Header */}
        <header className="bg-zinc-800 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xl">💧</span>
              </div>
              <div>
                <h1 className="font-semibold text-zinc-100">
                  INGRES AI Assistant
                </h1>
                <p className="text-sm text-zinc-400">
                  Groundwater Resource Information
                </p>
              </div>
            </div>
            <Button
              onPress={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors `}
              color={showMap ? "default" : "primary"}
              startContent={
                showMap ? <MessageSquare size={18} /> : <Map size={18} />
              }
            >
              <span className="text-sm font-medium">
                {showMap ? "Hide Map" : "Show Map"}
              </span>
            </Button>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💧</span>
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
                  className={`max-w-[90%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800"
                  }`}
                >
                  {message.isLoading && !message.content ? (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`whitespace-pre-wrap ${
                          message.role === "assistant" ? "text-zinc-200" : ""
                        }`}
                      >
                        {message.content}
                      </p>
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
        <footer className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="max-w-2xl mx-auto flex gap-2"
          >
            <Input
              type="text"
              size="lg"
              value={input}
              radius="full"
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about groundwater data..."
              disabled={isLoading}
              variant="flat"
              classNames={{ inputWrapper: "pr-1" }}
              endContent={
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  radius="full"
                  isIconOnly
                  color="primary"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              }
            />
          </form>
        </footer>
      </div>

      {/* Map Panel */}
      {showMap && (
        <div className="w-1/2 bg-zinc-800 flex items-center justify-center">
          <div className="text-center text-zinc-400">
            <Map size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium">Map View</p>
            <p className="text-sm">Map integration coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
