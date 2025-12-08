"use client";

import { DropletIcon } from "./icons";
import { Button } from "@heroui/button";

interface WelcomeScreenProps {
  suggestedQueries: string[];
  onQueryClick: (query: string) => void;
}

export default function WelcomeScreen({
  suggestedQueries,
  onQueryClick,
}: WelcomeScreenProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-lg bg-dark-tertiary flex items-center justify-center mx-auto mb-4">
        <DropletIcon size={32} className="text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">
        Welcome to INGRES AI
      </h2>
      <p className="text-zinc-400 mb-6 max-w-md mx-auto">
        Ask me anything about India&apos;s groundwater resources - state data,
        district comparisons, extraction levels, and more.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestedQueries.map((q) => (
          <Button
            key={q}
            onPress={() => onQueryClick(q)}
            variant="flat"
            radius="full"
          >
            {q}
          </Button>
        ))}
      </div>
    </div>
  );
}
