import api from "./api";

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

export async function getOperationsSummary(): Promise<OperationsSummary> {
  const response = await api.get<OperationsSummary>("/operations/summary");
  return response.data;
}
