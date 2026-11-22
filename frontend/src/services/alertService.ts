import api from "./api";

export interface AlertRecord {
  _id?: string;
  alert_id: string;
  server_id: string;
  alert_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  recommendation?: string;
  status: "OPEN" | "RESOLVED" | string;
  created_at?: string;
  resolved_at?: string;
}

// Get all alerts
export async function getAlerts(): Promise<AlertRecord[]> {
  const response = await api.get<AlertRecord[]>("/alerts");
  return Array.isArray(response.data) ? response.data : [];
}

// Get alert by ID
export async function getAlert(alertId: string): Promise<AlertRecord> {
  const response = await api.get<AlertRecord>(
    `/alerts/${encodeURIComponent(alertId)}`
  );
  return response.data;
}

// Get alerts for server
export async function getServerAlerts(
  serverId: string
): Promise<AlertRecord[]> {
  const response = await api.get<AlertRecord[]>(
    `/alerts/server/${encodeURIComponent(serverId)}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

// Resolve alert
export async function resolveAlert(alertId: string): Promise<AlertRecord> {
  const response = await api.post<AlertRecord>(
    `/alerts/${encodeURIComponent(alertId)}/resolve`
  );
  return response.data;
}
