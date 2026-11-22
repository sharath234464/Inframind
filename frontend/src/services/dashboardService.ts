import api from "./api";

export interface DashboardResponse {
  status: boolean;
  message: string;
  total_servers: number;
  properly_allocated: number;
  under_allocated: number;
  over_allocated: number;
  properly_utilized: number;
  under_utilized: number;
  over_utilized: number;
  compliant: number;
  needs_review: number;
}

export interface OperationsSummary {
  total_servers: number;
  compliant_servers: number;
  non_compliant_servers: number;
  open_alerts: number;
  critical_alerts: number;
  high_risk_servers: number | null;
  pending_requests: number;
  active_scheduled_jobs: number;
  pending_golden_proposals: number;
  recent_activity: any[];
}

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>("/dashboard");
  return response.data;
}

export async function getOperationsSummary(): Promise<OperationsSummary> {
  const response = await api.get<OperationsSummary>("/operations/summary");
  return response.data;
}
