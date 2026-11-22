import api from "./api";

export interface HealthRecord {
  _id?: string;
  server_id: string;
  health_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk_factors: string[];
  recommendation: string;
  created_at?: string;
  updated_at?: string;
  cpu_utilization?: number;
  memory_utilization?: number;
  disk_utilization?: number;
  classification?: string;
  compliance_status?: string;
}

// Get all health scores
export async function getAllHealthScores(): Promise<HealthRecord[]> {
  const response = await api.get<HealthRecord[]>("/health");
  return Array.isArray(response.data) ? response.data : [];
}

// Get or calculate health score for single server
export async function getServerHealth(
  serverId: string
): Promise<HealthRecord> {
  const response = await api.get<HealthRecord>(
    `/health/${encodeURIComponent(serverId)}`
  );
  return response.data;
}
