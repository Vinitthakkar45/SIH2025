import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "../../types";
import { User } from "lucide-react";
import { VisualizationRenderer } from "../VisualizationRenderer";

interface ChatMessageProps {
  message: Message;
  onSuggestionClick?: (suggestion: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSuggestionClick }) => {
  const isUser = message.role === "user";

  return (
    <div className={`ig-flex ig-gap-3 ig-animate-slide-up ${isUser ? "ig-flex-row-reverse" : "ig-flex-row"}`}>
      {/* Avatar */}
      {message.role === "assistant" && (
        <div className="ig-flex-shrink-0 ig-w-8 ig-h-8 ig-rounded-full ig-bg-gradient-to-br ig-from-white/10 ig-to-white/5 ig-flex ig-items-center ig-justify-center ig-mt-1">
          <span className="ig-text-lg">🇮🇳</span>
        </div>
      )}
      {isUser && (
        <div className="ig-flex-shrink-0 ig-w-8 ig-h-8 ig-rounded-full ig-bg-blue-600 ig-text-white ig-flex ig-items-center ig-justify-center">
          <User className="ig-w-4 ig-h-4" />
        </div>
      )}

      {/* Message Content */}
      <div
        className={`ig-max-w-[85%] ig-space-y-3 ${
          isUser ? "ig-bg-blue-600 ig-text-white ig-rounded-3xl ig-rounded-br-none ig-px-4 ig-py-2 ig-w-fit" : "ig-w-full"
        }`}>
        {message.isStreaming && !message.content ? (
          <div className="ig-flex ig-items-center ig-gap-1 ig-py-2">
            <span className="ig-w-2 ig-h-2 ig-bg-zinc-600 ig-rounded-full ig-animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="ig-w-2 ig-h-2 ig-bg-zinc-600 ig-rounded-full ig-animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="ig-w-2 ig-h-2 ig-bg-zinc-600 ig-rounded-full ig-animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <>
            <div className={`ig-prose ig-prose-sm ig-max-w-none ${isUser ? "ig-prose-invert" : ""}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className={`ig-m-0 ig-leading-relaxed ${!isUser ? "ig-text-zinc-200 ig-text-[15px]" : "ig-text-[15px]"}`}>{children}</p>
                  ),
                  ul: ({ children }) => <ul className="ig-my-2 ig-pl-4 ig-list-disc ig-space-y-1 ig-text-zinc-200">{children}</ul>,
                  ol: ({ children }) => <ol className="ig-my-2 ig-pl-4 ig-list-decimal ig-space-y-1 ig-text-zinc-200">{children}</ol>,
                  li: ({ children }) => <li className="ig-my-1 ig-text-zinc-200 ig-pl-1">{children}</li>,
                  h1: ({ children }) => <h1 className="ig-text-xl ig-font-bold ig-mb-3 ig-mt-4 ig-text-zinc-100">{children}</h1>,
                  h2: ({ children }) => <h2 className="ig-text-lg ig-font-bold ig-mb-2 ig-mt-3 ig-text-zinc-100">{children}</h2>,
                  h3: ({ children }) => <h3 className="ig-text-base ig-font-semibold ig-mb-2 ig-mt-3 ig-text-zinc-100">{children}</h3>,
                  strong: ({ children }) => <strong className="ig-font-semibold ig-text-zinc-100">{children}</strong>,
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="ig-text-blue-400 hover:ig-text-blue-300 ig-underline">
                      {children}
                    </a>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="ig-bg-zinc-700 ig-text-zinc-100 ig-px-1.5 ig-py-0.5 ig-rounded ig-text-sm ig-font-mono">{children}</code>
                    ) : (
                      <code className="ig-block ig-bg-zinc-700 ig-text-zinc-100 ig-p-3 ig-rounded-lg ig-text-sm ig-font-mono ig-overflow-x-auto ig-my-2">
                        {children}
                      </code>
                    );
                  },
                  table: ({ children }) => (
                    <div className="ig-overflow-x-auto ig-my-3 ig-rounded-xl ig-border ig-border-zinc-700/50 ig-bg-zinc-800/30">
                      <table className="ig-w-full ig-border-collapse ig-text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="ig-bg-zinc-800/80">{children}</thead>,
                  tbody: ({ children }) => <tbody className="ig-divide-y ig-divide-zinc-700/50">{children}</tbody>,
                  tr: ({ children }) => <tr className="hover:ig-bg-zinc-700/20 ig-transition-colors">{children}</tr>,
                  th: ({ children }) => (
                    <th className="ig-px-4 ig-py-3 ig-text-left ig-font-semibold ig-text-zinc-100 ig-text-xs ig-uppercase ig-tracking-wider ig-border-b ig-border-zinc-700/50">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => <td className="ig-px-4 ig-py-3 ig-text-zinc-300 ig-text-sm">{children}</td>,
                  blockquote: ({ children }) => (
                    <blockquote className="ig-border-l-4 ig-border-blue-500 ig-pl-4 ig-my-2 ig-text-zinc-300 ig-italic">{children}</blockquote>
                  ),
                }}>
                {message.content}
              </ReactMarkdown>
            </div>

            {/* Charts/Visualizations */}
            {message.charts && message.charts.length > 0 && <VisualizationRenderer visualizations={message.charts} />}

            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="ig-mt-4 ig-mb-2">
                <div className="ig-text-xs ig-text-zinc-500 ig-mb-3 ig-font-semibold ig-pl-1 ig-flex ig-items-center ig-gap-2">Suggestions 💡</div>
                <div className="ig-flex ig-flex-wrap ig-gap-2">
                  {message.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => onSuggestionClick?.(suggestion)}
                      className="ig-py-2 ig-px-3 ig-border ig-border-dashed ig-border-zinc-600 ig-rounded-lg ig-text-zinc-400 ig-text-sm ig-text-left hover:ig-bg-zinc-800 hover:ig-border-zinc-500 ig-transition-colors">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
