/**
 * Structured Response Types for Groundwater Chat API
 *
 * These types define the exact structure returned from the backend
 * to be rendered directly by the frontend WITHOUT any LLM processing.
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

export interface BaseVisualization {
  type: VisualizationType;
  title: string;
  subtitle?: string;
  description?: string;
  explanation?: string;
}

export interface ChartVisualization extends BaseVisualization {
  type: "chart";
  chartType: ChartType;
  data: ChartDataItem[] | Record<string, unknown>[];
  color?: string;
  colorByValue?: boolean;
  threshold?: { safe: number; critical: number; overExploited: number };
  lines?: string[];
}

export interface TableVisualization extends BaseVisualization {
  type: "table";
  tableType?: TableType;
  columns: string[];
  data: TableRow[];
  headerValue?: number;
}

export interface StatsVisualization extends BaseVisualization {
  type: "stats" | "summary";
  data: SummaryData | WaterBalanceData;
}

export interface CollapsibleVisualization extends BaseVisualization {
  type: "collapsible";
  defaultOpen?: boolean;
  children: Visualization[];
}

export interface DataContainerVisualization extends BaseVisualization {
  type: "data_container";
  locationId?: string;
  locationName?: string;
  year?: string;
  visualizations: Visualization[];
}

export type Visualization = ChartVisualization | TableVisualization | StatsVisualization | CollapsibleVisualization | DataContainerVisualization;

// ============================================================================
// TOOL RESPONSE TYPES - Internal (what tools return)
// ============================================================================

export interface BaseToolResult {
  found: boolean;
  message?: string;
}

export interface SearchGroundwaterDataResult extends BaseToolResult {
  locationId?: string;
  locationName?: string;
  locationType?: "STATE" | "DISTRICT" | "TALUK";
  year?: string;
  isHistorical?: boolean;
  yearsAvailable?: string[];
  dataPointCount?: number;
  textSummary?: string;
}

export interface CompareLocationsResult extends BaseToolResult {
  count?: number;
  year?: string;
  isHistoricalComparison?: boolean;
  locationsCompared?: string[];
  locationIds?: string[];
  yearsAvailable?: string[];
  dataPointCount?: number;
  locationData?: Array<{
    locationName: string;
    locationId: string;
    locationType?: "STATE" | "DISTRICT" | "TALUK";
    years: string[];
  }>;
  locationType?: "STATE" | "DISTRICT" | "TALUK";
  textSummary?: string;
}

export interface GetHistoricalDataResult extends BaseToolResult {
  locationName?: string;
  locationId?: string;
  locationType?: "STATE" | "DISTRICT" | "TALUK";
  yearsAvailable?: string[];
  dataPointCount?: number;
  textSummary?: string;
}

export interface TopLocationData {
  rank: number;
  name: string;
  value: number;
  category?: string | null;
  stageOfExtraction?: number | null;
  rainfall?: number | null;
  recharge?: number | null;
  extraction?: number | null;
}

export interface TopLocationAggregatedData {
  name: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
}

export interface GetTopLocationsResult extends BaseToolResult {
  metric?: string;
  metricLabel?: string;
  metricUnit?: string;
  order?: "asc" | "desc";
  limit?: number;
  locationType?: "STATE" | "DISTRICT" | "TALUK";
  year?: string;
  isHistorical?: boolean;
  yearsAnalyzed?: string[];
  data?: TopLocationData[] | TopLocationAggregatedData[];
  trendData?: Record<string, unknown>[];
  textSummary?: string;
}

export interface ListLocationsResult extends BaseToolResult {
  count?: number;
  locations?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export type ToolResult = SearchGroundwaterDataResult | CompareLocationsResult | GetHistoricalDataResult | GetTopLocationsResult | ListLocationsResult;

// ============================================================================
// API RESPONSE TYPES - What the frontend receives
// ============================================================================

/**
 * SSE Event types for streaming response
 */
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

/**
 * Text summary for UI display - generated deterministically from data
 */
export interface TextSummary {
  title: string;
  subtitle?: string;
  keyMetrics?: KeyMetric[];
  insights?: string[];
}

export interface KeyMetric {
  label: string;
  value: string | number;
  unit?: string;
  status?: "safe" | "semi-critical" | "critical" | "over-exploited" | null;
}

/**
 * Non-streaming API response
 */
export interface GroundwaterChatResponse {
  visualizations: Visualization[];
  summary?: TextSummary;
  suggestions?: string[];
}
