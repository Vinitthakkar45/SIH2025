"use client";

import type { Visualization } from "@/types/visualizations";
import { Button } from "@heroui/button";
import { Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
import { Idea01Icon } from "./icons";
import MarkdownRenderer from "./MarkdownRenderer";
import VisualizationRenderer from "./VisualizationRenderer";

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
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`flex gap-3 ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {message.role === "assistant" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="w-8 h-8 rounded-full bg-linear-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0 mt-1"
            >
              <span className="text-xl">🇮🇳</span>
            </motion.div>
          )}
          <div
            className={`max-w-[85%] space-y-5 ${
              message.role === "user"
                ? "bg-primary text-white rounded-3xl rounded-br-none px-4 py-2 w-fit"
                : "w-full"
            }`}
          >
            {message.isLoading && !message.content ? (
              <div className="space-y-2 py-1 w-full">
                <Skeleton className="h-3 w-1/2 rounded-lg bg-zinc-800" />
                <Skeleton className="h-3 w-3/5 rounded-lg bg-zinc-800" />
                <Skeleton className="h-3 w-1/3 rounded-lg bg-zinc-800" />
              </div>
            ) : (
              <>
                <MarkdownRenderer
                  content={message.content}
                  className={
                    message.role === "assistant"
                      ? "text-zinc-200 text-[15px]"
                      : "text-[15px]"
                  }
                />
                {message.charts && message.charts.length > 0 && (
                  <VisualizationRenderer visualizations={message.charts} />
                )}
                {message.suggestions && message.suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                  >
                    <div className="text-xs text-zinc-500 mb-4 font-semibold pl-2.5 flex items-center gap-2 ">
                      Suggestions
                      <Idea01Icon width={17} height={17} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, i) => (
                        <Button
                          key={i}
                          onPress={() => onSuggestionClick(suggestion)}
                          variant="flat"
                          className="text-wrap border-1 border-dashed border-zinc-600 font-light text-zinc-400 text-left justify-start"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      ))}
    </>
  );
}
