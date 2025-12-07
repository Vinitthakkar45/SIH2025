import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled = false, placeholder = "Ask about groundwater resources..." }) => {
  const [input, setInput] = useState("");
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
      <div className="ig-flex ig-items-end ig-gap-2 ig-bg-white ig-rounded-2xl ig-shadow-lg ig-border ig-border-gray-200 ig-p-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="ig-flex-1 ig-resize-none ig-bg-transparent ig-border-0 ig-outline-none ig-px-3 ig-py-2 ig-text-gray-800 ig-placeholder-gray-400 ig-text-sm ig-max-h-[120px] focus:ig-ring-0"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className={`ig-flex-shrink-0 ig-w-10 ig-h-10 ig-rounded-xl ig-flex ig-items-center ig-justify-center ig-transition-all ig-duration-200 ${
            disabled || !input.trim()
              ? "ig-bg-gray-100 ig-text-gray-400 ig-cursor-not-allowed"
              : "ig-bg-gradient-to-r ig-from-water-500 ig-to-primary-600 ig-text-white ig-shadow-md hover:ig-shadow-lg hover:ig-scale-105 active:ig-scale-95"
          }`}>
          {disabled ? <Loader2 className="ig-w-5 ig-h-5 ig-animate-spin" /> : <Send className="ig-w-5 ig-h-5" />}
        </button>
      </div>
      <p className="ig-text-xs ig-text-gray-400 ig-mt-1 ig-text-center">Press Enter to send, Shift+Enter for new line</p>
    </form>
  );
};
