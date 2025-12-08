"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/react";
import { ArrowUp02Icon } from "./icons";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "Ask about groundwater data...",
  className = "",
}: ChatComposerProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Calculate and set the textarea height
  const updateHeight = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    // Reset height to auto to get the actual scroll height
    textarea.style.height = "auto";

    // Calculate the new height
    const scrollHeight = textarea.scrollHeight;
    const minHeight = isFocused && !value ? 72 : 36; // 72px when focused and empty, 36px otherwise
    const maxHeight = 150;

    const newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
    textarea.style.height = `${newHeight}px`;
  }, [isFocused, value]);

  // Update height when value or focus changes
  useEffect(() => {
    updateHeight();
  }, [value, isFocused, updateHeight]);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div
        className={`
          relative flex items-end gap-2 p-2 rounded-2xl
          bg-zinc-800/80 backdrop-blur-sm
          border transition-all duration-300 ease-out
          ${isFocused ? "border-primary/50 shadow-lg shadow-primary/10" : "border-zinc-700/50 hover:border-zinc-600"}
        `}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isLoading || disabled}
          rows={1}
          className="
            flex-1 bg-transparent text-zinc-100 placeholder-zinc-500
            resize-none outline-none px-3 py-2 text-sm leading-relaxed
            scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent
            transition-[height] duration-200 ease-out
          "
          style={{ minHeight: isFocused && !value ? "72px" : "36px", maxHeight: "150px" }}
        />
        <Button
          type="submit"
          disabled={isLoading || disabled || !value.trim()}
          color={isLoading || disabled || !value.trim() ? "default" : "primary"}
          radius="full"
          isIconOnly
          size="sm"
          className={`
            transition-all duration-200 shrink-0
            ${value.trim() && !isLoading ? "scale-100 opacity-100" : "scale-95 opacity-70"}
          `}>
          {isLoading ? <Spinner color="white" size="sm" /> : <ArrowUp02Icon width={18} height={18} />}
        </Button>
      </div>

      {/* Subtle hint */}
      <p
        className={`
        text-xs text-zinc-600 text-center mt-2 transition-opacity duration-200
        ${isFocused ? "opacity-100" : "opacity-0"}
      `}>
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
