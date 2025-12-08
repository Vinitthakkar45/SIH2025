"use client";

import { Skeleton } from "@heroui/react";
import MarkdownRenderer from "./MarkdownRenderer";
import VisualizationRenderer from "./VisualizationRenderer";
import { Button } from "@heroui/button";
import type { Visualization } from "@/types/visualizations";
import { motion } from "framer-motion";

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
              className="w-8 h-8 rounded-full bg-linear-to-br from-white/10 to-white/5 flex items-center justify-center shrink-0 mt-1 border border-white/10"
            >
              <span className="text-xl">🇮🇳</span>
            </motion.div>
          )}
          <div
            className={`max-w-[85%] ${
              message.role === "user"
                ? "bg-zinc-100 text-zinc-900 rounded-2xl rounded-br-md px-4 py-2.5 w-fit"
                : "w-full"
            }`}
          >
            {message.isLoading && !message.content ? (
              <div className="space-y-2 py-1">
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Skeleton className="h-3 w-24 rounded-lg bg-zinc-800" />
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                >
                  <Skeleton className="h-3 w-40 rounded-lg bg-zinc-800" />
                </motion.div>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                >
                  <Skeleton className="h-3 w-32 rounded-lg bg-zinc-800" />
                </motion.div>
              </div>
            ) : (
              <>
                <MarkdownRenderer
                  content={message.content}
                  className={
                    message.role === "assistant" ? "text-zinc-200 text-[15px]" : "text-[15px]"
                  }
                />
                {message.charts && message.charts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3"
                  >
                    <VisualizationRenderer visualizations={message.charts} />
                  </motion.div>
                )}
                {message.suggestions && message.suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 mb-8"
                  >
                    <p className="text-xs text-zinc-500 mb-3 font-medium">
                      Suggested questions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, i) => (
                        <Button
                          key={i}
                          onPress={() => onSuggestionClick(suggestion)}
                          variant="flat"
                          size="sm"
                          className="bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-zinc-100 text-[13px] min-h-9 h-auto py-2 font-medium border border-white/10 hover:border-white/20 transition-all whitespace-normal text-left"
                          radius="lg"
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
