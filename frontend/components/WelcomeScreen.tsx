"use client";

import { SparklesIcon } from "./icons";

interface WelcomeScreenProps {
  suggestedQueries: string[];
  onQueryClick: (query: string) => void;
}

export default function WelcomeScreen({ suggestedQueries, onQueryClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      {/* Minimal greeting */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <SparklesIcon size={18} className="text-primary" />
        </div>
        <h2 className="text-lg font-medium text-zinc-300">How can I help you today?</h2>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
        {suggestedQueries.map((q) => (
          <button
            key={q}
            onClick={() => onQueryClick(q)}
            className="px-4 py-2 text-sm text-zinc-400 bg-zinc-800/50 hover:bg-zinc-700/50 
                       border border-zinc-700/50 hover:border-zinc-600 rounded-full 
                       transition-all duration-200 hover:text-zinc-200 hover:scale-[1.02]">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
