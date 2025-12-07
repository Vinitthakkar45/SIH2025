"use client";

import { Button } from "@heroui/button";
import { Input, Spinner } from "@heroui/react";
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <Input
        type="text"
        size="lg"
        value={value}
        radius="full"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        variant="flat"
        classNames={{ inputWrapper: "pr-1" }}
        endContent={
          <Button
            type="submit"
            disabled={isLoading || disabled || !value.trim()}
            radius="full"
            isIconOnly
            color="primary"
          >
            {isLoading ? <Spinner /> : <SentIcon size={18} />}
          </Button>
        }
      />
    </form>
  );
}
