import React from "react";
import { MapPin, TrendingUp, Droplet, BarChart3 } from "lucide-react";
import { SUGGESTED_QUERIES } from "../../data/constants";

interface WelcomeScreenProps {
  onQuerySelect: (query: string) => void;
}

const defaultCards = [
  {
    icon: <MapPin className="ig-w-5 ig-h-5" />,
    title: "Regional Analysis",
    description: "Get groundwater status for your region",
    query: "What is the groundwater status in Tamil Nadu 2024-2025?",
  },
  {
    icon: <TrendingUp className="ig-w-5 ig-h-5" />,
    title: "Historical Trends",
    description: "View trends over the years",
    query: "Show historical groundwater trends in Coimbatore 2020-2025",
  },
  {
    icon: <Droplet className="ig-w-5 ig-h-5" />,
    title: "Extraction Analysis",
    description: "Analyze extraction patterns",
    query: "How has groundwater extraction changed over the years in Coimbatore 2020-2022?",
  }
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onQuerySelect }) => {
  return (
    <div className="ig-flex ig-flex-col ig-items-center ig-justify-center ig-h-full ig-p-4 ig-text-center ig-animate-fade-in">
      {/* Title */}
      <div className="ig-text-center ig-mb-6">
        <h2 className="ig-text-2xl ig-font-semibold ig-text-zinc-100 ig-mb-2">Hi, Welcome!</h2>
        <p className="ig-text-zinc-400 ig-text-sm">How can I assist you today?</p>
      </div>

      

      {/* Suggested Queries */}
      <div className="ig-w-full">
        <p className="ig-text-xs ig-font-medium ig-text-zinc-500 ig-mb-2 ig-text-left">Try asking:</p>
        <div className="ig-space-y-1.5">
          {SUGGESTED_QUERIES.slice(0, 3).map((query, idx) => (
            <button
              key={idx}
              onClick={() => onQuerySelect(query)}
              className="ig-w-full ig-text-left ig-text-sm ig-bg-zinc-900/50 ig-text-zinc-300 ig-px-3 ig-py-2.5 ig-rounded-lg ig-border ig-border-zinc-800 hover:ig-bg-zinc-800/70 hover:ig-border-zinc-700 ig-transition-all">
              <span className="ig-text-blue-400 ig-mr-2">💧</span>
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
