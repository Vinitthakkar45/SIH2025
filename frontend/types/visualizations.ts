/**
 * Structured Response Types for Groundwater Chat Frontend
 *
 * These types match the backend structured responses
 * for direct rendering WITHOUT any LLM processing.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export interface TableRow {
  [key: string]: unknown;
}

export interface ChartDataItem {
  name: string;
  value?: number;
  command?: number;
  nonCommand?: number;
  fill?: string;
  [key: string]: unknown;
}

export interface SummaryData {
  extractableTotal?: number | null;
  extractionTotal?: number | null;
  rainfall?: number | null;
  rechargeTotal?: number | null;
  naturalDischarges?: number | null;
  stageOfExtraction?: number | null;
  category?: string | null;
  [key: string]: unknown;
}

export interface WaterBalanceData {
  recharge?: number | null;
  naturalDischarge?: number | null;
  extractable?: number | null;
  extraction?: number | null;
  availabilityForFuture?: number | null;
}

// ============================================================================
// VISUALIZATION TYPES
// ============================================================================

export type ChartType = "bar" | "pie" | "grouped_bar" | "waterBalance" | "line" | "multi_line" | "area";

export type TableType = "recharge" | "discharges" | "extractable" | "extraction" | "locations" | "trend" | "ranking";

export type VisualizationType = "chart" | "stats" | "table" | "summary" | "trend_summary" | "data_container" | "collapsible";

export interface Visualization {
  type: VisualizationType;
  chartType?: ChartType;
  tableType?: TableType;
  title: string;
  subtitle?: string;
  description?: string;
  /** Layman-friendly explanation of what this visualization shows and key insights */
  explanation?: string;
  headerValue?: number;
  year?: string;
  columns?: string[];
  data?: TableRow[] | ChartDataItem[] | SummaryData | WaterBalanceData;
  visualizations?: Visualization[];
  children?: Visualization[];
  defaultOpen?: boolean;
  locationId?: string;
  locationName?: string;
  threshold?: { safe: number; critical: number; overExploited: number };
  color?: string;
  colorByValue?: boolean;
  lines?: string[];
}

// ============================================================================
// TEXT SUMMARY - Generated deterministically from data
// ============================================================================

export type MetricStatus = "safe" | "semi-critical" | "critical" | "over-exploited" | null;

export interface KeyMetric {
  label: string;
  value: string | number;
  unit?: string;
  status?: MetricStatus;
}

export interface TextSummary {
  title: string;
  subtitle?: string;
  keyMetrics?: KeyMetric[];
  insights?: string[];
}

// ============================================================================
// SSE EVENT TYPES - What the frontend receives from streaming
// ============================================================================

export type SSEEventType = "tool_call" | "tool_result" | "data" | "suggestions" | "error" | "done";

export interface SSEToolCallEvent {
  type: "tool_call";
  tool: string;
  args: Record<string, unknown>;
}

export interface SSEToolResultEvent {
  type: "tool_result";
  tool: string;
  found: boolean;
  summary?: string;
}

export interface SSEDataEvent {
  type: "data";
  visualizations: Visualization[];
  summary?: TextSummary;
}

export interface SSESuggestionsEvent {
  type: "suggestions";
  suggestions: string[];
}

export interface SSEErrorEvent {
  type: "error";
  error: string;
}

export interface SSEDoneEvent {
  type: "done";
}

export type SSEEvent = SSEToolCallEvent | SSEToolResultEvent | SSEDataEvent | SSESuggestionsEvent | SSEErrorEvent | SSEDoneEvent;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Non-streaming API response
 */
export interface GroundwaterChatResponse {
  visualizations: Visualization[];
  summary?: TextSummary;
  suggestions?: string[];
}

/**
 * Helper to check if a value is null/undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Safe number formatting with null check
 */
export function formatNumber(value: number | null | undefined, decimals = 2, fallback = "N/A"): string {
  if (isNullish(value)) return fallback;
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Get status color class from metric status
 */
export function getStatusColor(status: MetricStatus): string {
  switch (status) {
    case "safe":
      return "text-green-500";
    case "semi-critical":
      return "text-yellow-500";
    case "critical":
      return "text-orange-500";
    case "over-exploited":
      return "text-red-500";
    default:
      return "text-zinc-400";
  }
}
