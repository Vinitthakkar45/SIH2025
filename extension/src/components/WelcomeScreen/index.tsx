import React from "react";
import { Droplets, Zap, Globe, BarChart3 } from "lucide-react";
import { SUGGESTED_QUERIES } from "../../data/constants";

interface WelcomeScreenProps {
  onQuerySelect: (query: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onQuerySelect,
}) => {
  return (
    <div className="ig-flex ig-flex-col ig-items-center ig-justify-center ig-h-full ig-p-6 ig-text-center ig-animate-fade-in">
      {/* Logo/Icon */}
      <div className="ig-relative ig-mb-6">
        <div className="ig-w-20 ig-h-20 ig-rounded-full ig-bg-gradient-to-br ig-from-water-400 ig-to-water-600 ig-flex ig-items-center ig-justify-center ig-shadow-lg">
          <Droplets className="ig-w-10 ig-h-10 ig-text-white" />
        </div>
        <div className="ig-absolute -ig-bottom-1 -ig-right-1 ig-w-8 ig-h-8 ig-rounded-full ig-bg-gradient-to-br ig-from-primary-400 ig-to-primary-600 ig-flex ig-items-center ig-justify-center ig-shadow-md">
          <Zap className="ig-w-4 ig-h-4 ig-text-white" />
        </div>
      </div>

      {/* Title */}
      <h2 className="ig-text-xl ig-font-bold ig-text-gray-800 ig-mb-2">
        INGRES AI Assistant
      </h2>
      <p className="ig-text-sm ig-text-gray-500 ig-mb-6 ig-max-w-[280px]">
        Your intelligent guide to India's groundwater resources. Ask me anything
        about groundwater data!
      </p>

      {/* Feature Pills */}
      <div className="ig-flex ig-flex-wrap ig-justify-center ig-gap-2 ig-mb-6">
        <span className="ig-flex ig-items-center ig-gap-1 ig-text-xs ig-bg-water-50 ig-text-water-700 ig-px-3 ig-py-1.5 ig-rounded-full">
          <Globe className="ig-w-3 ig-h-3" />
          All States & UTs
        </span>
        <span className="ig-flex ig-items-center ig-gap-1 ig-text-xs ig-bg-primary-50 ig-text-primary-700 ig-px-3 ig-py-1.5 ig-rounded-full">
          <BarChart3 className="ig-w-3 ig-h-3" />
          Historical Data
        </span>
      </div>

      {/* Suggested Queries */}
      <div className="ig-w-full">
        <p className="ig-text-xs ig-font-medium ig-text-gray-500 ig-mb-3">
          Try asking:
        </p>
        <div className="ig-space-y-2">
          {SUGGESTED_QUERIES.slice(0, 4).map((query, idx) => (
            <button
              key={idx}
              onClick={() => onQuerySelect(query)}
              className="ig-w-full ig-text-left ig-text-sm ig-bg-white ig-text-gray-700 ig-px-4 ig-py-3 ig-rounded-xl ig-border ig-border-gray-200 ig-shadow-sm hover:ig-bg-water-50 hover:ig-border-water-300 hover:ig-shadow-md ig-transition-all ig-duration-200"
            >
              <span className="ig-text-water-500 ig-mr-2">💧</span>
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
