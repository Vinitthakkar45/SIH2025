"use client";

import { Button } from "@heroui/button";
import { Spinner, Textarea } from "@heroui/react";
import { useRef, useState } from "react";
import { SentIcon } from "./icons";

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

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Textarea
        // ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        variant="flat"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        rows={1}
        minRows={1.4}
        size="lg"
        classNames={{ innerWrapper: "items-end", inputWrapper: "pr-2" }}
        radius="lg"
        endContent={
          <Button
            type="submit"
            disabled={isLoading || disabled || !value.trim()}
            color={
              isLoading || disabled || !value.trim() ? "default" : "primary"
            }
            startContent={
              isLoading ? (
                <Spinner color="white" size="sm" />
              ) : (
                <SentIcon width={22} height={22} className="min-w-5" />
              )
            }
            radius="lg"
          >
            Send
          </Button>
        }
      />

      <p
        className={`
        text-xs text-zinc-600 text-center mt-2 transition-opacity duration-200
        ${isFocused ? "opacity-100" : "opacity-0"}
      `}
      >
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
