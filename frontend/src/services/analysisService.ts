import api from "./api";

export interface ComparisonResponse {
  status: boolean;
  message: string;
  compared_servers: number;
}

export interface AiAnalysisResponse {
  status: boolean;
  message: string;
  completed: number;
  skipped: number;
  failed: number;
}

// Stage 1: Deterministic Comparison & Classification
export async function runComparison(): Promise<ComparisonResponse> {
  const response = await api.post<ComparisonResponse>("/comparison/run");
  return response.data;
}

// Stage 2: LangGraph Agentic AI Analysis
export async function generateAiAnalysis(): Promise<AiAnalysisResponse> {
  const response = await api.post<AiAnalysisResponse>("/analysis/generate");
  return response.data;
}
