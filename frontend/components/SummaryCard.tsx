"use client";

import type { TextSummary, KeyMetric, MetricStatus } from "@/types/visualizations";
import { getStatusColor, formatNumber } from "@/types/visualizations";
import { motion } from "framer-motion";

interface SummaryCardProps {
  summary: TextSummary;
}

/**
 * Get status badge styles
 */
function getStatusBadge(status: MetricStatus) {
  const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "safe":
      return `${baseClasses} bg-green-500/20 text-green-400`;
    case "semi-critical":
      return `${baseClasses} bg-yellow-500/20 text-yellow-400`;
    case "critical":
      return `${baseClasses} bg-orange-500/20 text-orange-400`;
    case "over-exploited":
      return `${baseClasses} bg-red-500/20 text-red-400`;
    default:
      return "";
  }
}

/**
 * Renders a deterministic text summary generated from structured data
 * This replaces LLM-generated prose with data-driven summaries
 */
export default function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-4">
      {/* Title and Subtitle */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-white">{summary.title}</h3>
        {summary.subtitle && <p className="text-sm text-zinc-400 mt-1">{summary.subtitle}</p>}
      </div>

      {/* Key Metrics */}
      {summary.keyMetrics && summary.keyMetrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          {summary.keyMetrics.map((metric, idx) => (
            <MetricCard key={idx} metric={metric} />
          ))}
        </div>
      )}

      {/* Insights */}
      {summary.insights && summary.insights.length > 0 && (
        <div className="border-t border-zinc-800 pt-3 mt-3">
          <ul className="space-y-1">
            {summary.insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-zinc-400 flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

function MetricCard({ metric }: { metric: KeyMetric }) {
  const value = typeof metric.value === "number" ? formatNumber(metric.value) : metric.value;

  return (
    <div className="bg-zinc-800/50 rounded-lg p-3">
      <div className="text-xs text-zinc-500 mb-1">{metric.label}</div>
      <div className={`text-sm font-medium ${metric.status ? getStatusColor(metric.status) : "text-white"}`}>
        {value}
        {metric.unit && <span className="text-zinc-500 ml-1">{metric.unit}</span>}
      </div>
      {metric.status && <span className={getStatusBadge(metric.status)}>{metric.status.replace("-", " ")}</span>}
    </div>
  );
}
