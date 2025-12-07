"use client";

import { useState, useRef, useEffect } from "react";
import {
  Map,
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface TableRow {
  source?: string;
  name?: string;
  command?: number | null;
  nonCommand?: number | null;
  total?: number | null;
  [key: string]: unknown;
}

interface ChartDataItem {
  name: string;
  value?: number;
  command?: number;
  nonCommand?: number;
  [key: string]: unknown;
}

interface SummaryData {
  extractableTotal?: number;
  extractionTotal?: number;
  rainfall?: number;
  rechargeTotal?: number;
  naturalDischarges?: number;
  stageOfExtraction?: number;
  category?: string;
}

interface WaterBalanceData {
  recharge?: number;
  naturalDischarge?: number;
  extractable?: number;
  extraction?: number;
  availabilityForFuture?: number;
}

interface Visualization {
  type: "chart" | "stats" | "table" | "summary";
  chartType?: "bar" | "pie" | "grouped_bar" | "waterBalance";
  tableType?:
    | "recharge"
    | "discharges"
    | "extractable"
    | "extraction"
    | "locations";
  title: string;
  description?: string;
  headerValue?: number;
  year?: string;
  columns?: string[];
  data: TableRow[] | ChartDataItem[] | SummaryData | WaterBalanceData;
  threshold?: { safe: number; critical: number; overExploited: number };
}

interface Message {
  role: "user" | "assistant";
  content: string;
  charts?: Visualization[];
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
  semi_critical: "#f59e0b",
  critical: "#f97316",
  over_exploited: "#ef4444",
  salinity: "#8b5cf6",
  hilly_area: "#6b7280",
  no_data: "#9ca3af",
  Safe: "#10b981",
  "Semi-Critical": "#f59e0b",
  Critical: "#f97316",
  "Over-Exploited": "#ef4444",
};

function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (isNaN(num)) return "-";
  return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function SummaryCard({ viz }: { viz: Visualization }) {
  const data = viz.data as SummaryData;
  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-lg p-4 my-2 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-lg">{viz.title}</h4>
          {viz.year && (
            <p className="text-blue-300 text-sm">YEAR: {viz.year}</p>
          )}
        </div>
        {data.category && (
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: CATEGORY_COLORS[data.category] || "#6b7280",
            }}
          >
            {data.category}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-800/50 rounded-lg p-3">
          <p className="text-blue-300 text-xs">
            Annual Extractable Ground Water Resources (ham)
          </p>
          <p className="text-2xl font-bold text-cyan-400">
            {formatNumber(data.extractableTotal)}
          </p>
        </div>
        <div className="bg-blue-800/50 rounded-lg p-3">
          <p className="text-blue-300 text-xs">
            Ground Water Extraction for all uses (ham)
          </p>
          <p className="text-2xl font-bold text-cyan-400">
            {formatNumber(data.extractionTotal)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-300">Rainfall (mm)</span>
          <span className="text-cyan-400">{formatNumber(data.rainfall)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-300">Ground Water Recharge (ham)</span>
          <span className="text-cyan-400">
            {formatNumber(data.rechargeTotal)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-300">Natural Discharges (ham)</span>
          <span className="text-cyan-400">
            {formatNumber(data.naturalDischarges)}
          </span>
        </div>
        {data.stageOfExtraction !== undefined && (
          <div className="flex justify-between">
            <span className="text-blue-300">Stage of Extraction</span>
            <span
              className={`font-medium ${
                (data.stageOfExtraction ?? 0) > 100
                  ? "text-red-400"
                  : (data.stageOfExtraction ?? 0) > 90
                  ? "text-orange-400"
                  : (data.stageOfExtraction ?? 0) > 70
                  ? "text-yellow-400"
                  : "text-green-400"
              }`}
            >
              {formatNumber(data.stageOfExtraction)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CollapsibleTable({ viz }: { viz: Visualization }) {
  const [isOpen, setIsOpen] = useState(false);
  const data = viz.data as TableRow[];

  return (
    <div className="bg-gray-900 rounded-lg my-2 overflow-hidden border border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-sm">{viz.title}</span>
          {viz.headerValue !== undefined && (
            <span className="text-cyan-400 font-medium">
              : {formatNumber(viz.headerValue)}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                {viz.columns?.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left text-gray-400 font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-gray-700 ${
                    row.source === "Total" ? "bg-gray-800 font-medium" : ""
                  }`}
                >
                  {viz.tableType === "extractable" ? (
                    <>
                      <td className="px-4 py-2 text-gray-300">
                        {formatNumber(row.command)}
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {formatNumber(row.nonCommand)}
                      </td>
                      <td className="px-4 py-2 text-cyan-400">
                        {formatNumber(row.total)}
                      </td>
                    </>
                  ) : viz.tableType === "locations" ? (
                    <>
                      <td className="px-4 py-2 text-gray-300">{row.name}</td>
                      <td className="px-4 py-2 text-gray-300">
                        {formatNumber(row.rainfall)}
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {formatNumber(row.extractable)}
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {formatNumber(row.extraction)}
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {formatNumber(row.stageOfExtraction)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2 text-gray-300">{row.source}</td>
                      <td className="px-4 py-2 text-gray-300">
                        {formatNumber(row.command)}
                      </td>
                      <td className="px-4 py-2 text-gray-300">
                        {formatNumber(row.nonCommand)}
                      </td>
                      <td className="px-4 py-2 text-cyan-400">
                        {formatNumber(row.total)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WaterBalanceChart({ viz }: { viz: Visualization }) {
  const data = viz.data as WaterBalanceData;
  const chartData = [
    { name: "Recharge", value: data.recharge || 0 },
    { name: "Natural Discharge", value: data.naturalDischarge || 0 },
    { name: "Extractable", value: data.extractable || 0 },
    { name: "Extraction", value: data.extraction || 0 },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
        {viz.title}
      </h4>
      {viz.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {viz.description}
        </p>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Bar dataKey="value" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GroupedBarChart({ viz }: { viz: Visualization }) {
  const data = viz.data as ChartDataItem[];
  const keys = data[0]
    ? Object.keys(data[0]).filter((k) => k !== "name" && k !== "category")
    : [];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
        {viz.title}
      </h4>
      {viz.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {viz.description}
        </p>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
          {keys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimpleBarChart({ viz }: { viz: Visualization }) {
  const data = viz.data as ChartDataItem[];
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
        {viz.title}
      </h4>
      {viz.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {viz.description}
        </p>
      )}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Bar dataKey="value" fill="#3b82f6">
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.category
                    ? CATEGORY_COLORS[String(entry.category)] ||
                      COLORS[index % COLORS.length]
                    : COLORS[index % COLORS.length]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SimplePieChart({ viz }: { viz: Visualization }) {
  const data = viz.data as ChartDataItem[];
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
        {viz.title}
      </h4>
      {viz.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {viz.description}
        </p>
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
              `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
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
          <Tooltip formatter={(value) => formatNumber(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatsCard({ viz }: { viz: Visualization }) {
  const stats = viz.data as Record<string, unknown>;
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 my-2">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
        {viz.title}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {typeof value === "number" ? formatNumber(value) : String(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisualizationRenderer({ viz }: { viz: Visualization }) {
  if (viz.type === "summary") {
    return <SummaryCard viz={viz} />;
  }

  if (viz.type === "table") {
    return <CollapsibleTable viz={viz} />;
  }

  if (viz.type === "stats") {
    return <StatsCard viz={viz} />;
  }

  if (viz.type === "chart") {
    if (viz.chartType === "waterBalance") {
      return <WaterBalanceChart viz={viz} />;
    }
    if (viz.chartType === "grouped_bar") {
      return <GroupedBarChart viz={viz} />;
    }
    if (viz.chartType === "pie") {
      return <SimplePieChart viz={viz} />;
    }
    if (viz.chartType === "bar") {
      return <SimpleBarChart viz={viz} />;
    }
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
                data.type === "summary"
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Chat Area */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          showMap ? "w-1/2" : "w-full"
        }`}
      >
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xl">💧</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 dark:text-white">
                  INGRES AI Assistant
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Groundwater Resource Information
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showMap
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {showMap ? <MessageSquare size={18} /> : <Map size={18} />}
              <span className="text-sm font-medium">
                {showMap ? "Hide Map" : "Show Map"}
              </span>
            </button>
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to INGRES AI
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Ask me anything about India&apos;s groundwater resources -
                  state data, district comparisons, extraction levels, and more.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQueries.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSubmit(q)}
                      className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {q}
                    </button>
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
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {message.isLoading && !message.content ? (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <p
                        className={`whitespace-pre-wrap ${
                          message.role === "assistant"
                            ? "text-gray-800 dark:text-gray-200"
                            : ""
                        }`}
                      >
                        {message.content}
                      </p>
                      {message.charts && message.charts.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {message.charts.map((viz, i) => (
                            <VisualizationRenderer key={i} viz={viz} />
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
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="max-w-4xl mx-auto flex gap-2"
          >
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
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </footer>
      </div>

      {/* Map Panel */}
      {showMap && (
        <div className="w-1/2 border-l border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Map size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-medium">Map View</p>
            <p className="text-sm">Map integration coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
