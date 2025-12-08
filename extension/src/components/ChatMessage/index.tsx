import React from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "../../types";
import { User, Droplets } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`ig-flex ig-gap-3 ig-animate-slide-up ${isUser ? "ig-flex-row-reverse" : "ig-flex-row"}`}>
      {/* Avatar */}
      <div
        className={`ig-flex-shrink-0 ig-w-8 ig-h-8 ig-rounded-full ig-flex ig-items-center ig-justify-center ${
          isUser ? "ig-bg-primary-600 ig-text-white" : "ig-bg-gradient-to-br ig-from-water-400 ig-to-water-600 ig-text-white"
        }`}>
        {isUser ? <User className="ig-w-4 ig-h-4" /> : <Droplets className="ig-w-4 ig-h-4" />}
      </div>

      {/* Message Content */}
      <div
        className={`ig-max-w-[80%] ig-rounded-2xl ig-px-4 ig-py-3 ${
          isUser
            ? "ig-bg-primary-600 ig-text-white ig-rounded-tr-md"
            : "ig-bg-white ig-text-gray-800 ig-shadow-md ig-border ig-border-gray-100 ig-rounded-tl-md"
        }`}>
        {message.isStreaming && !message.content ? (
          <div className="ig-flex ig-items-center ig-gap-1">
            <span className="ig-w-2 ig-h-2 ig-bg-water-500 ig-rounded-full ig-animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="ig-w-2 ig-h-2 ig-bg-water-500 ig-rounded-full ig-animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="ig-w-2 ig-h-2 ig-bg-water-500 ig-rounded-full ig-animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (
          <div className={`ig-prose ig-prose-sm ig-max-w-none ${isUser ? "ig-prose-invert" : ""}`}>
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="ig-m-0 ig-leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="ig-my-2 ig-pl-4 ig-list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="ig-my-2 ig-pl-4 ig-list-decimal">{children}</ol>,
                li: ({ children }) => <li className="ig-my-1">{children}</li>,
                strong: ({ children }) => <strong className="ig-font-semibold">{children}</strong>,
                code: ({ children }) => <code className="ig-bg-gray-100 ig-px-1 ig-py-0.5 ig-rounded ig-text-sm ig-font-mono">{children}</code>,
                table: ({ children }) => (
                  <div className="ig-overflow-x-auto ig-my-2">
                    <table className="ig-min-w-full ig-border-collapse ig-border ig-border-gray-300 ig-text-sm">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="ig-border ig-border-gray-300 ig-bg-gray-100 ig-px-2 ig-py-1 ig-text-left ig-font-semibold">{children}</th>
                ),
                td: ({ children }) => <td className="ig-border ig-border-gray-300 ig-px-2 ig-py-1">{children}</td>,
              }}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="ig-mt-3 ig-pt-3 ig-border-t ig-border-gray-200">
            <p className="ig-text-xs ig-font-medium ig-text-gray-500 ig-mb-2">📚 Sources ({message.sources.length})</p>
            <div className="ig-flex ig-flex-wrap ig-gap-1">
              {message.sources.slice(0, 3).map((source, idx) => (
                <span
                  key={source.id}
                  className="ig-text-xs ig-bg-water-50 ig-text-water-700 ig-px-2 ig-py-1 ig-rounded-full ig-border ig-border-water-200"
                  title={source.text}>
                  {source.metadata.state || source.metadata.source_type || `Source ${idx + 1}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className={`ig-text-xs ig-mt-2 ${isUser ? "ig-text-primary-200" : "ig-text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};
