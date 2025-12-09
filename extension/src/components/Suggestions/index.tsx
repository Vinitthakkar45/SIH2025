import React from "react";
import { Sparkles } from "lucide-react";

interface SuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="ig-px-4 ig-py-3 ig-bg-zinc-900/50 ig-border-t ig-border-zinc-800">
      <div className="ig-flex ig-items-center ig-gap-2 ig-mb-2">
        <Sparkles className="ig-w-4 ig-h-4 ig-text-blue-400" />
        <span className="ig-text-xs ig-font-medium ig-text-zinc-400">Suggested follow-ups</span>
      </div>
      <div className="ig-flex ig-flex-wrap ig-gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(suggestion)}
            className="ig-text-xs ig-bg-zinc-800 ig-text-zinc-300 ig-px-3 ig-py-1.5 ig-rounded-full ig-border ig-border-zinc-700 hover:ig-bg-zinc-700 hover:ig-border-zinc-600 ig-transition-all ig-duration-200">
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
