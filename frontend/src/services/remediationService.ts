import api from "./api";

export interface RemediationPlanCreate {
  server_id: string;
  issue_type: string;
  action: string;
  changes: Record<string, any>;
  reason: string;
  expected_impact: string;
  risk_level: string;
  recommendation?: string;
}

export interface RemediationPlanResponse {
  _id?: string;
  remediation_id: string;
  server_id: string;
  issue_type: string;
  action: string;
  changes: Record<string, any>;
  reason: string;
  expected_impact: string;
  risk_level: string;
  recommendation?: string;
  ai_reasoning?: string;
  ai_expected_impact?: string;
  ai_risk_explanation?: string;
  ai_recommendation?: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "CANCELLED" | "COMPLETED" | string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

// Create remediation plan
export async function createRemediationPlan(
  plan: RemediationPlanCreate
): Promise<RemediationPlanResponse> {
  const response = await api.post<RemediationPlanResponse>("/remediation", plan);
  return response.data;
}

// Get all remediation plans
export async function getRemediationPlans(): Promise<RemediationPlanResponse[]> {
  const response = await api.get<RemediationPlanResponse[]>("/remediation");
  return Array.isArray(response.data) ? response.data : [];
}

// Get plans for server
export async function getServerRemediationPlans(
  serverId: string
): Promise<RemediationPlanResponse[]> {
  const response = await api.get<RemediationPlanResponse[]>(
    `/remediation/server/${encodeURIComponent(serverId)}`
  );
  return Array.isArray(response.data) ? response.data : [];
}

// Get single remediation plan
export async function getRemediationPlan(
  remediationId: string
): Promise<RemediationPlanResponse> {
  const response = await api.get<RemediationPlanResponse>(
    `/remediation/${encodeURIComponent(remediationId)}`
  );
  return response.data;
}

// Submit remediation plan
export async function submitRemediationPlan(
  remediationId: string
): Promise<{ message: string; remediation_id: string; status: string; data: any }> {
  const response = await api.post<{
    message: string;
    remediation_id: string;
    status: string;
    data: any;
  }>(`/remediation/${encodeURIComponent(remediationId)}/submit`);
  return response.data;
}

// Create infrastructure request from plan
export async function createRequestFromRemediation(
  remediationId: string
): Promise<{ message: string; data: any }> {
  const response = await api.post<{ message: string; data: any }>(
    `/remediation/${encodeURIComponent(remediationId)}/create-request`
  );
  return response.data;
}

// Cancel remediation plan
export async function cancelRemediationPlan(
  remediationId: string
): Promise<{ message: string; remediation_id: string; status: string; data: any }> {
  const response = await api.post<{
    message: string;
    remediation_id: string;
    status: string;
    data: any;
  }>(`/remediation/${encodeURIComponent(remediationId)}/cancel`);
  return response.data;
}
