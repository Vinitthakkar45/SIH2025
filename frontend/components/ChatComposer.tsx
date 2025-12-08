"use client";
"use i18n";

import { Button } from "@heroui/button";
import { Textarea } from "@heroui/react";
import { useState } from "react";
import { SentIcon, StopIcon } from "./icons";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  disabled = false,
  placeholder = "Ask about groundwater data...",
  className = "",
}: ChatComposerProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading && onStop) {
      onStop();
      return;
    }
    if (!value.trim() || disabled) return;
    onSubmit(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Textarea
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
        classNames={{ innerWrapper: "items-end", inputWrapper: "pr-2 pl-4" }}
        radius="lg"
        endContent={
          <Button
            type="submit"
            disabled={disabled || (!isLoading && !value.trim())}
            color={
              disabled || (!isLoading && !value.trim())
                ? "default"
                : isLoading
                ? "danger"
                : "primary"
            }
            startContent={
              isLoading ? (
                <StopIcon
                  color="white"
                  width={22}
                  height={22}
                  className="min-w-5"
                />
              ) : (
                <SentIcon width={22} height={22} className="min-w-5" />
              )
            }
            radius="lg"
          >
            {isLoading ? <>Stop</> : <>Send</>}
          </Button>
        }
      />

      <p
        className={`
        text-xs text-zinc-600 text-center mt-1 transition-opacity duration-200
        ${isFocused ? "opacity-100" : "opacity-0"}
      `}
      >
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
