import React from "react";
import { ChatFilters } from "../../types";
import { INDIAN_STATES, ASSESSMENT_YEARS } from "../../data/constants";
import { MapPin, Calendar, Filter } from "lucide-react";

interface FilterBarProps {
  filters: ChatFilters;
  onFilterChange: (filters: ChatFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, isOpen, onToggle }) => {
  const hasActiveFilters = filters.state || filters.year;

  return (
    <div className="ig-border-b ig-border-gray-100">
      {/* Filter Toggle Button */}
      <button
        onClick={onToggle}
        className={`ig-w-full ig-flex ig-items-center ig-justify-between ig-px-4 ig-py-2 ig-text-sm ig-transition-colors ${
          hasActiveFilters ? "ig-bg-water-50 ig-text-water-700" : "ig-bg-gray-50 ig-text-gray-600 hover:ig-bg-gray-100"
        }`}>
        <div className="ig-flex ig-items-center ig-gap-2">
          <Filter className="ig-w-4 ig-h-4" />
          <span className="ig-font-medium">Filters</span>
          {hasActiveFilters && <span className="ig-bg-water-500 ig-text-white ig-text-xs ig-px-2 ig-py-0.5 ig-rounded-full">Active</span>}
        </div>
        <svg
          className={`ig-w-4 ig-h-4 ig-transition-transform ${isOpen ? "ig-rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Options */}
      {isOpen && (
        <div className="ig-p-4 ig-bg-white ig-space-y-4 ig-animate-fade-in">
          {/* State Filter */}
          <div>
            <label className="ig-flex ig-items-center ig-gap-2 ig-text-xs ig-font-medium ig-text-gray-600 ig-mb-2">
              <MapPin className="ig-w-3 ig-h-3" />
              State / UT
            </label>
            <select
              value={filters.state || ""}
              onChange={(e) => onFilterChange({ ...filters, state: e.target.value || undefined })}
              className="ig-w-full ig-px-3 ig-py-2 ig-text-sm ig-bg-gray-50 ig-border ig-border-gray-200 ig-rounded-lg focus:ig-ring-2 focus:ig-ring-water-500 focus:ig-border-transparent ig-outline-none">
              <option value="">All States</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="ig-flex ig-items-center ig-gap-2 ig-text-xs ig-font-medium ig-text-gray-600 ig-mb-2">
              <Calendar className="ig-w-3 ig-h-3" />
              Assessment Year
            </label>
            <select
              value={filters.year || ""}
              onChange={(e) => onFilterChange({ ...filters, year: e.target.value || undefined })}
              className="ig-w-full ig-px-3 ig-py-2 ig-text-sm ig-bg-gray-50 ig-border ig-border-gray-200 ig-rounded-lg focus:ig-ring-2 focus:ig-ring-water-500 focus:ig-border-transparent ig-outline-none">
              <option value="">All Years</option>
              {ASSESSMENT_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={() => onFilterChange({})}
              className="ig-w-full ig-py-2 ig-text-sm ig-text-water-600 ig-font-medium hover:ig-bg-water-50 ig-rounded-lg ig-transition-colors">
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
