import api from "./api";

export interface ClassificationCount {
  classification: string;
  count: number;
}

export interface AnalyticsSummary {
  total_records: number;
  average_cpu_utilization: number;
  average_memory_utilization: number;
  average_disk_utilization: number;
  classifications: ClassificationCount[];
}

export interface ServerTrendPoint {
  timestamp?: string;
  cpu_utilization: number;
  memory_utilization: number;
  disk_utilization: number;
}

export interface ServerAnalytics {
  server_id: string;
  total_records: number;
  average_cpu_utilization: number;
  average_memory_utilization: number;
  average_disk_utilization: number;
  trend: ServerTrendPoint[];
}

// Get analytics summary
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await api.get<AnalyticsSummary>("/analytics/summary");
  return response.data;
}

// Get server analytics trend
export async function getServerAnalytics(
  serverId: string
): Promise<ServerAnalytics> {
  const response = await api.get<ServerAnalytics>(
    `/analytics/server/${encodeURIComponent(serverId)}`
  );
  return response.data;
}
