import React, { useState, useRef, useEffect, useCallback } from "react";
import { Message, ChatFilters, Visualization } from "../../types";
import { streamChat, checkHealth } from "../../services/api";
import { ChatMessage } from "../ChatMessage";
import { ChatInput } from "../ChatInput";
import { Suggestions } from "../Suggestions";
import { WelcomeScreen } from "../WelcomeScreen";
import { X, Minimize2, Maximize2, RefreshCw, Trash2, AlertCircle, CheckCircle, Droplet } from "lucide-react";

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ChatFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check backend health on mount
  useEffect(() => {
    checkHealth().then(setIsConnected);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setSuggestions([]);
      setIsLoading(true);

      // Create assistant message placeholder
      const assistantMessageId = generateId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        charts: [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Prepare chat history for context (last 6 messages)
      const chatHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const charts: Visualization[] = [];

      try {
        await streamChat(content, chatHistory, filters, {
          onToken: (token) => {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: msg.content + token, isStreaming: false } : msg))
            );
          },
          onChart: (chart) => {
            charts.push(chart);
            setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, charts: [...charts] } : msg)));
          },
          onSuggestions: (newSuggestions) => {
            setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, suggestions: newSuggestions } : msg)));
          },
          onError: (error) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: `Error: ${error}. Please try again.`,
                      isStreaming: false,
                    }
                  : msg
              )
            );
          },
          onComplete: () => {
            setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg)));
            setIsLoading(false);
          },
        });
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "Failed to connect to the server. Please try again.",
                  isStreaming: false,
                }
              : msg
          )
        );
        setIsLoading(false);
      }
    },
    [messages, filters, isLoading]
  );

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setSuggestions([]);
  };

  const handleRetryConnection = async () => {
    setIsConnected(null);
    const status = await checkHealth();
    setIsConnected(status);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`ig-fixed ig-z-[999999] ig-transition-all ig-duration-300 ig-ease-out ${
        isExpanded ? "ig-inset-4 ig-rounded-2xl" : "ig-bottom-6 ig-right-6 ig-w-[420px] ig-h-[650px] ig-rounded-2xl"
      }`}>
      <div className="ig-w-full ig-h-full ig-bg-zinc-950 ig-rounded-2xl ig-shadow-2xl ig-flex ig-flex-col ig-overflow-hidden ig-border ig-border-zinc-800">
        {/* Header */}
        <div className="ig-bg-zinc-900 ig-px-4 ig-py-3 ig-flex ig-items-center ig-justify-between ig-flex-shrink-0 ig-border-b ig-border-zinc-800">
          <div className="ig-flex ig-items-center ig-gap-3">
            <div className="ig-w-8 ig-h-8 ig-rounded-lg ig-bg-blue-600 ig-flex ig-items-center ig-justify-center">
              <Droplet className="ig-w-4 ig-h-4 ig-text-white" />
            </div>
            <div>
              <h3 className="ig-font-semibold ig-text-zinc-100 ig-text-sm">INGRES AI</h3>
              <div className="ig-flex ig-items-center ig-gap-1.5">
                {isConnected === null ? (
                  <span className="ig-text-xs ig-text-zinc-500">Checking...</span>
                ) : isConnected ? (
                  <>
                    <CheckCircle className="ig-w-3 ig-h-3 ig-text-green-400" />
                    <span className="ig-text-xs ig-text-zinc-500">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="ig-w-3 ig-h-3 ig-text-red-400" />
                    <span className="ig-text-xs ig-text-zinc-500">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="ig-flex ig-items-center ig-gap-1">
            {!isConnected && isConnected !== null && (
              <button
                onClick={handleRetryConnection}
                className="ig-p-2 ig-rounded-lg hover:ig-bg-zinc-800 ig-transition-colors ig-text-zinc-400"
                title="Retry connection">
                <RefreshCw className="ig-w-4 ig-h-4" />
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="ig-p-2 ig-rounded-lg hover:ig-bg-zinc-800 ig-transition-colors ig-text-zinc-400"
                title="Clear chat">
                <Trash2 className="ig-w-4 ig-h-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ig-p-2 ig-rounded-lg hover:ig-bg-zinc-800 ig-transition-colors ig-text-zinc-400"
              title={isExpanded ? "Minimize" : "Expand"}>
              {isExpanded ? <Minimize2 className="ig-w-4 ig-h-4" /> : <Maximize2 className="ig-w-4 ig-h-4" />}
            </button>
            <button onClick={onClose} className="ig-p-2 ig-rounded-lg hover:ig-bg-zinc-800 ig-transition-colors ig-text-zinc-400" title="Close">
              <X className="ig-w-4 ig-h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={chatContainerRef} className="ig-flex-1 ig-overflow-y-auto ig-p-4 ig-space-y-4 ig-bg-zinc-950">
          {messages.length === 0 ? (
            <WelcomeScreen onQuerySelect={handleSendMessage} />
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} onSuggestionClick={handleSuggestionClick} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="ig-p-4 ig-bg-zinc-950 ig-border-t ig-border-zinc-800 ig-flex-shrink-0">
          <ChatInput
            onSend={handleSendMessage}
            onStop={handleStop}
            disabled={!isConnected}
            isLoading={isLoading}
            placeholder={!isConnected ? "Connecting to server..." : "Ask about groundwater data..."}
          />
        </div>
      </div>
    </div>
  );
};
