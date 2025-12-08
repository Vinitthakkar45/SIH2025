export interface TableRow {
  [key: string]: unknown;
}

export interface ChartDataItem {
  name: string;
  value?: number;
  command?: number;
  nonCommand?: number;
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

export interface WaterBalanceData {
  recharge?: number;
  naturalDischarge?: number;
  extractable?: number;
  extraction?: number;
  availabilityForFuture?: number;
}

export interface Visualization {
  type:
    | "chart"
    | "stats"
    | "table"
    | "summary"
    | "trend_summary"
    | "data_container";
  chartType?:
    | "bar"
    | "pie"
    | "grouped_bar"
    | "waterBalance"
    | "line"
    | "multi_line"
    | "area";
  tableType?:
    | "recharge"
    | "discharges"
    | "extractable"
    | "extraction"
    | "locations"
    | "trend";
  title: string;
  subtitle?: string;
  description?: string;
  headerValue?: number;
  year?: string;
  columns?: string[];
  data?: TableRow[] | ChartDataItem[] | SummaryData | WaterBalanceData;
  visualizations?: Visualization[];
  locationId?: string;
  locationName?: string;
  threshold?: { safe: number; critical: number; overExploited: number };
}
