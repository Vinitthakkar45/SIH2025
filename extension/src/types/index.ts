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
  extractableTotal?: number;
  extractionTotal?: number;
  rainfall?: number;
  rechargeTotal?: number;
  naturalDischarges?: number;
  stageOfExtraction?: number;
  category?: string;
  [key: string]: unknown;
}

export interface Visualization {
  type: "chart" | "stats" | "table" | "summary" | "trend_summary" | "data_container" | "collapsible";
  chartType?: "bar" | "pie" | "grouped_bar" | "waterBalance" | "line" | "multi_line" | "area";
  tableType?: string;
  title: string;
  subtitle?: string;
  description?: string;
  explanation?: string;
  headerValue?: number;
  year?: string;
  columns?: string[];
  data?: TableRow[] | ChartDataItem[] | SummaryData;
  visualizations?: Visualization[];
  children?: Visualization[];
  defaultOpen?: boolean;
  color?: string;
  colorByValue?: boolean;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  charts?: Visualization[];
  suggestions?: string[];
  isStreaming?: boolean;
}

export interface Source {
  id: string;
  text: string;
  metadata: {
    state?: string;
    year?: string;
    source_type?: string;
    [key: string]: unknown;
  };
  relevance: number;
}

export interface ChatFilters {
  state?: string;
  year?: string;
  source_type?: string;
}

export interface StreamResponse {
  type: "sources" | "token" | "suggestions" | "done" | "error" | "chart" | "stats" | "table" | "summary" | "trend_summary" | "data_container";
  content?: string;
  sources?: Source[];
  suggestions?: string[];
  error?: string;
  // Visualization data
  chartType?: string;
  title?: string;
  description?: string;
  explanation?: string;
  data?: unknown;
  columns?: string[];
  visualizations?: Visualization[];
}
