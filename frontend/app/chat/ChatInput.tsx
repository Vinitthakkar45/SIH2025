"use client";

import { Send, Paperclip, Image as ImageIcon } from "lucide-react";
import { Button } from "@heroui/react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder = "Ask me anything...",
}: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="border-t border-zinc-800/50 bg-zinc-950 px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-end gap-2 bg-zinc-900/50 rounded-3xl px-4 py-2 border border-zinc-800/50 focus-within:border-zinc-700 transition-colors">
            {/* Attachment buttons */}
            <div className="flex items-center gap-0.5 pb-1.5">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="min-w-8 h-8 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                type="button"
              >
                <Paperclip size={16} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="min-w-8 h-8 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                type="button"
              >
                <ImageIcon size={16} />
              </Button>
            </div>

            {/* Text input */}
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading || disabled}
              rows={1}
              className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none py-2 text-[15px] max-h-32 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              style={{
                minHeight: "28px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "28px";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />

            {/* Send button */}
            <div className="pb-1.5">
              <Button
                type="submit"
                isIconOnly
                size="sm"
                isDisabled={isLoading || disabled || !value.trim()}
                className={`min-w-8 h-8 ${
                  !value.trim() || isLoading || disabled
                    ? "bg-zinc-800 text-zinc-600"
                    : "bg-zinc-100 text-zinc-900 hover:bg-white"
                }`}
                radius="full"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </form>

        {/* Helper text */}
        <p className="text-[11px] text-zinc-600 text-center mt-2.5 px-4">
          Bring your docs, code, and files to collaborate with INGRES and your team.
        </p>
      </div>
    </div>
  );
}
