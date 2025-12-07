export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Source[];
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
  type: "sources" | "token" | "suggestions" | "done" | "error";
  content?: string;
  sources?: Source[];
  suggestions?: string[];
  error?: string;
}
