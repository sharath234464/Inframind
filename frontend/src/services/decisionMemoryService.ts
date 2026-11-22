import api from "./api";

export interface DecisionMemoryRecord {
  _id?: string;
  memory_id: string;
  server_id?: string;
  issue_type: string;
  classification?: string;
  decision: string;
  action: string;
  reason?: string;
  outcome?: string;
  created_by?: string;
  created_at?: string;
}

export interface DecisionMemoryCreate {
  server_id?: string;
  issue_type: string;
  classification?: string;
  decision: string;
  action: string;
  reason?: string;
  outcome?: string;
}

// Get all decisions (Admin)
export async function getAllDecisions(): Promise<DecisionMemoryRecord[]> {
  const response = await api.get<DecisionMemoryRecord[]>("/decision-memory");
  return Array.isArray(response.data) ? response.data : [];
}

// Find similar decisions
export async function findSimilarDecisions(
  issueType: string,
  classification?: string
): Promise<DecisionMemoryRecord[]> {
  const response = await api.get<DecisionMemoryRecord[]>(
    "/decision-memory/similar",
    {
      params: {
        issue_type: issueType,
        ...(classification ? { classification } : {}),
      },
    }
  );
  return Array.isArray(response.data) ? response.data : [];
}

// Store decision (Admin)
export async function storeDecision(
  data: DecisionMemoryCreate
): Promise<DecisionMemoryRecord> {
  const response = await api.post<DecisionMemoryRecord>(
    "/decision-memory",
    data
  );
  return response.data;
}
