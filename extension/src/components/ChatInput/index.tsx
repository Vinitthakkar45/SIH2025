import React, { useState, useRef, useEffect } from "react";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onStop,
  disabled = false,
  isLoading = false,
  placeholder = "Ask about groundwater resources...",
}) => {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading && onStop) {
      onStop();
      return;
    }
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ig-relative">
      <div className="ig-flex ig-items-end ig-gap-2 ig-bg-zinc-800 ig-rounded-2xl ig-border ig-border-zinc-700 ig-p-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          rows={1}
          className="ig-flex-1 ig-resize-none ig-bg-transparent ig-border-0 ig-outline-none ig-px-3 ig-py-2 ig-text-zinc-100 ig-placeholder-zinc-500 ig-text-sm ig-max-h-[120px] focus:ig-ring-0"
        />
        <button
          type="submit"
          disabled={disabled || (!isLoading && !input.trim())}
          className={`ig-flex-shrink-0 ig-h-10 ig-px-4 ig-rounded-xl ig-flex ig-items-center ig-justify-center ig-gap-2 ig-transition-all ig-duration-200 ig-font-medium ig-text-sm ${
            disabled || (!isLoading && !input.trim())
              ? "ig-bg-zinc-700 ig-text-zinc-500 ig-cursor-not-allowed"
              : isLoading
              ? "ig-bg-red-600 ig-text-white hover:ig-bg-red-700"
              : "ig-bg-blue-600 ig-text-white hover:ig-bg-blue-700"
          }`}>
          {isLoading ? (
            <>
              <Square className="ig-w-4 ig-h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Send className="ig-w-4 ig-h-4" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
      <p
        className={`ig-text-xs ig-text-zinc-600 ig-text-center ig-mt-1 ig-transition-opacity ig-duration-200 ${
          isFocused ? "ig-opacity-100" : "ig-opacity-0"
        }`}>
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
};
