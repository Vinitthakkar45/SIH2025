"use client";

import { Skeleton } from "@heroui/react";
import { SparklesIcon } from "./icons";
import MarkdownRenderer from "./MarkdownRenderer";
import VisualizationRenderer from "./VisualizationRenderer";
import { Button } from "@heroui/button";
import type { Visualization } from "@/types/visualizations";

export interface Message {
  role: "user" | "assistant";
  content: string;
  charts?: Visualization[];
  suggestions?: string[];
  isLoading?: boolean;
}

interface MessageListProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
}

export default function MessageList({
  messages,
  onSuggestionClick,
}: MessageListProps) {
  return (
    <>
      {messages.map((message, idx) => (
        <div
          key={idx}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {message.role === "assistant" && (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-2">
              <SparklesIcon width={23} height={23} className="text-primary" />
            </div>
          )}
          <div
            className={`max-w-[90%] px-4 py-2 ${
              message.role === "user"
                ? "bg-primary text-white rounded-3xl rounded-br-none w-fit"
                : "w-full"
            }`}
          >
            {message.isLoading && !message.content ? (
              <div className="space-y-3 w-full">
                <Skeleton className="h-3 w-1/3 rounded-lg" />
                <Skeleton className="h-3 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-2/3 rounded-lg" />
              </div>
            ) : (
              <>
                <MarkdownRenderer
                  content={message.content}
                  className={
                    message.role === "assistant" ? "text-zinc-200" : ""
                  }
                />
                {message.charts && message.charts.length > 0 && (
                  <div className="mt-3">
                    <VisualizationRenderer visualizations={message.charts} />
                  </div>
                )}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-4 mb-10">
                    <p className="text-sm text-zinc-400 mb-2 font-medium">
                      Follow-up questions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, i) => (
                        <Button
                          key={i}
                          onPress={() => onSuggestionClick(suggestion)}
                          variant="light"
                          className="border-dashed border-zinc-600 border-1 text-zinc-400 font-light"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
