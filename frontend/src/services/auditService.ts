import api from "./api";

export interface AuditRecord {
  _id?: string;
  audit_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description?: string;
  status: string;
  created_at: string;
}

// Get all audit logs (Admin)
export async function getAllAuditLogs(): Promise<AuditRecord[]> {
  const response = await api.get<AuditRecord[]>("/audit");
  return Array.isArray(response.data) ? response.data : [];
}

// Get user audit history
export async function getMyAuditHistory(): Promise<AuditRecord[]> {
  const response = await api.get<AuditRecord[]>("/audit/mine");
  return Array.isArray(response.data) ? response.data : [];
}

// Get entity audit history (Admin)
export async function getEntityAuditHistory(
  entityType: string,
  entityId: string
): Promise<AuditRecord[]> {
  const response = await api.get<AuditRecord[]>(
    `/audit/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`
  );
  return Array.isArray(response.data) ? response.data : [];
}
