import React from "react";
import { Sparkles } from "lucide-react";

interface SuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ suggestions, onSelect }) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="ig-px-4 ig-py-3 ig-bg-gradient-to-r ig-from-water-50 ig-to-primary-50 ig-border-t ig-border-gray-100">
      <div className="ig-flex ig-items-center ig-gap-2 ig-mb-2">
        <Sparkles className="ig-w-4 ig-h-4 ig-text-water-600" />
        <span className="ig-text-xs ig-font-medium ig-text-gray-600">Suggested follow-ups</span>
      </div>
      <div className="ig-flex ig-flex-wrap ig-gap-2">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(suggestion)}
            className="ig-text-xs ig-bg-white ig-text-gray-700 ig-px-3 ig-py-1.5 ig-rounded-full ig-border ig-border-gray-200 ig-shadow-sm hover:ig-bg-water-50 hover:ig-border-water-300 hover:ig-text-water-700 ig-transition-all ig-duration-200">
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
