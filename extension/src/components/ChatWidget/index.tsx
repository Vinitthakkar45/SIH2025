import React, { useState, useRef, useEffect, useCallback } from "react";
import { Message, ChatFilters, Source } from "../../types";
import { streamChat, checkHealth } from "../../services/api";
import { ChatMessage } from "../ChatMessage";
import { ChatInput } from "../ChatInput";
import { FilterBar } from "../FilterBar";
import { Suggestions } from "../Suggestions";
import { WelcomeScreen } from "../WelcomeScreen";
import { X, Minimize2, Maximize2, Droplets, RefreshCw, Trash2, AlertCircle, CheckCircle } from "lucide-react";

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<ChatFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

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
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Prepare chat history for context (last 6 messages)
      const chatHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let sources: Source[] = [];

      try {
        await streamChat(content, chatHistory, filters, {
          onSources: (newSources) => {
            sources = newSources;
          },
          onToken: (token) => {
            setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: msg.content + token } : msg)));
          },
          onSuggestions: (newSuggestions) => {
            setSuggestions(newSuggestions);
          },
          onError: (error) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: `❌ Error: ${error}. Please try again.`,
                      isStreaming: false,
                    }
                  : msg
              )
            );
          },
          onComplete: () => {
            setMessages((prev) => prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, isStreaming: false, sources } : msg)));
            setIsLoading(false);
          },
        });
      } catch {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: "❌ Failed to connect to the server. Please try again.",
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

  const handleClearChat = () => {
    setMessages([]);
    setSuggestions([]);
  };

  const handleRetryConnection = async () => {
    setIsConnected(null);
    const status = await checkHealth();
    setIsConnected(status);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`ig-fixed ig-z-[999999] ig-transition-all ig-duration-300 ig-ease-out ${
        isExpanded ? "ig-inset-4 ig-rounded-2xl" : "ig-bottom-6 ig-right-6 ig-w-[400px] ig-h-[600px] ig-rounded-2xl"
      }`}>
      <div className="ig-w-full ig-h-full ig-bg-white ig-rounded-2xl ig-shadow-2xl ig-flex ig-flex-col ig-overflow-hidden ig-border ig-border-gray-200">
        {/* Header */}
        <div className="ig-bg-gradient-to-r ig-from-water-600 ig-to-primary-600 ig-text-white ig-px-4 ig-py-3 ig-flex ig-items-center ig-justify-between ig-flex-shrink-0">
          <div className="ig-flex ig-items-center ig-gap-3">
            <div className="ig-w-10 ig-h-10 ig-rounded-full ig-bg-white/20 ig-flex ig-items-center ig-justify-center">
              <Droplets className="ig-w-6 ig-h-6" />
            </div>
            <div>
              <h3 className="ig-font-semibold ig-text-base">INGRES AI Assistant</h3>
              <div className="ig-flex ig-items-center ig-gap-1.5">
                {isConnected === null ? (
                  <span className="ig-text-xs ig-text-white/70">Checking...</span>
                ) : isConnected ? (
                  <>
                    <CheckCircle className="ig-w-3 ig-h-3 ig-text-green-300" />
                    <span className="ig-text-xs ig-text-white/80">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="ig-w-3 ig-h-3 ig-text-red-300" />
                    <span className="ig-text-xs ig-text-white/80">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="ig-flex ig-items-center ig-gap-1">
            {!isConnected && isConnected !== null && (
              <button
                onClick={handleRetryConnection}
                className="ig-p-2 ig-rounded-lg hover:ig-bg-white/20 ig-transition-colors"
                title="Retry connection">
                <RefreshCw className="ig-w-4 ig-h-4" />
              </button>
            )}
            {messages.length > 0 && (
              <button onClick={handleClearChat} className="ig-p-2 ig-rounded-lg hover:ig-bg-white/20 ig-transition-colors" title="Clear chat">
                <Trash2 className="ig-w-4 ig-h-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ig-p-2 ig-rounded-lg hover:ig-bg-white/20 ig-transition-colors"
              title={isExpanded ? "Minimize" : "Expand"}>
              {isExpanded ? <Minimize2 className="ig-w-4 ig-h-4" /> : <Maximize2 className="ig-w-4 ig-h-4" />}
            </button>
            <button onClick={onClose} className="ig-p-2 ig-rounded-lg hover:ig-bg-white/20 ig-transition-colors" title="Close">
              <X className="ig-w-4 ig-h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar filters={filters} onFilterChange={setFilters} isOpen={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} />

        {/* Messages Area */}
        <div ref={chatContainerRef} className="ig-flex-1 ig-overflow-y-auto ig-p-4 ig-space-y-4 ig-bg-gradient-to-b ig-from-gray-50 ig-to-white">
          {messages.length === 0 ? (
            <WelcomeScreen onQuerySelect={handleSendMessage} />
          ) : (
            messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && <Suggestions suggestions={suggestions} onSelect={handleSendMessage} />}

        {/* Input Area */}
        <div className="ig-p-4 ig-bg-white ig-border-t ig-border-gray-100 ig-flex-shrink-0">
          <ChatInput
            onSend={handleSendMessage}
            disabled={isLoading || !isConnected}
            placeholder={!isConnected ? "Connecting to server..." : "Ask about groundwater resources..."}
          />
        </div>
      </div>
    </div>
  );
};
