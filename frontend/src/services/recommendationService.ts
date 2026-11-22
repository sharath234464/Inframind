import api from "./api";

export interface RecommendationItem {
  _id?: string;
  server_id: string;
  classification?: string;
  recommendation: string;
  priority?: string;
  reason?: string;
}

export interface RecommendationResponse {
  status: boolean;
  message: string;
  generated_recommendations: number;
}

// Get all recommendations
export async function getRecommendations(): Promise<RecommendationItem[]> {
  const response = await api.get<RecommendationItem[]>("/recommendations");
  return Array.isArray(response.data) ? response.data : [];
}

// Get recommendation by server ID
export async function getRecommendationByServer(
  serverId: string
): Promise<RecommendationItem> {
  const response = await api.get<RecommendationItem>(
    `/recommendations/${encodeURIComponent(serverId)}`
  );
  return response.data;
}

// Generate LLM AI Recommendations
export async function generateAiRecommendations(): Promise<{
  message: string;
  total_saved: number;
}> {
  const response = await api.post<{ message: string; total_saved: number }>(
    "/recommendations/ai"
  );
  return response.data;
}

// Generate rule-based recommendations
export async function generateRuleRecommendations(): Promise<RecommendationResponse> {
  const response = await api.post<RecommendationResponse>(
    "/recommendations/generate"
  );
  return response.data;
}
