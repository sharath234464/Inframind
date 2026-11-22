import api from "./api";

export interface GoldenConfigurationRecord {
  instance_type: string;
  vcpu: number;
  memory: number;
  disk: number;
  os?: string;
  patch_level?: string;

  target_cpu_utilization_min?: number;
  target_cpu_utilization_max?: number;

  target_memory_utilization_min?: number;
  target_memory_utilization_max?: number;

  required_security_baseline?: string;
  security_baseline?: string;

  demand_cost_per_hour?: number;
  cost_per_hour?: number;

  estimated_monthly_cost?: number;
  monthly_cost?: number;
}

export interface GoldenUploadResponse {
  status: boolean;
  message: string;
  filename: string;
  uploaded_records: number;
}

export interface GoldenProposal {
  _id?: string;
  proposal_id: string;
  instance_type: string;

  vcpu: number;
  memory: number;
  disk: number;

  target_cpu_utilization_min: number;
  target_cpu_utilization_max: number;

  target_memory_utilization_min: number;
  target_memory_utilization_max: number;

  source_server_count: number;

  status:
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED";

  generation_method?: string;
  generated_by?: string;
  created_at?: string;

  approved_by?: string;
  approved_at?: string;

  rejected_by?: string;
  rejected_at?: string;

  rejection_reason?: string;
  ai_reasoning?: string;
}

export interface GoldenGenerationParams {
  instance_type?: string;
  minimum_healthy_servers?: number;
}

// ======================================================
// ADMIN: DIRECT EXCEL UPLOAD / UPDATE
// ======================================================

export async function uploadGoldenConfiguration(
  file: File
): Promise<GoldenUploadResponse> {

  if (!(file instanceof File)) {
    throw new Error(
      "Select a Golden Configuration Excel file first."
    );
  }

  const formData = new FormData();

  formData.append("file", file, file.name);

  const response = await api.post<GoldenUploadResponse>(
    "/upload/golden",
    formData
  );

  return response.data;
}

// ======================================================
// USER / ADMIN: AI PROPOSAL GENERATION
// ======================================================

export async function generateGoldenProposals(
  params: GoldenGenerationParams = {
    minimum_healthy_servers: 5
  }
): Promise<{
  message: string;
  proposals: GoldenProposal[];
}> {

  const response = await api.post<{
    message: string;
    proposals: GoldenProposal[];
  }>(
    "/golden-generation/generate",
    {
      instance_type:
        params.instance_type?.trim() || null,

      minimum_healthy_servers:
        params.minimum_healthy_servers ?? 5
    }
  );

  return response.data;
}

// ======================================================
// RETRIEVE PROPOSALS
// ======================================================

export async function getGoldenProposals(
  status?: string
): Promise<GoldenProposal[]> {

  const response = await api.get<GoldenProposal[]>(
    "/golden-generation/proposals",
    {
      params: status
        ? { status }
        : undefined
    }
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

// ======================================================
// RETRIEVE ONE PROPOSAL
// ======================================================

export async function getGoldenProposal(
  proposalId: string
): Promise<GoldenProposal> {

  const response = await api.get<GoldenProposal>(
    `/golden-generation/proposals/${encodeURIComponent(
      proposalId
    )}`
  );

  return response.data;
}

// ======================================================
// ACTIVE CONFIGURATIONS
// ======================================================

export async function getGoldenConfigurations(): Promise<
  GoldenConfigurationRecord[]
> {

  const response = await api.get<
    GoldenConfigurationRecord[]
  >("/golden");

  return Array.isArray(response.data)
    ? response.data
    : [];
}

// ======================================================
// ADMIN: APPROVE PROPOSAL
// ======================================================

export async function approveGoldenProposal(
  proposalId: string
): Promise<{
  message: string;
  data: any;
}> {

  const response = await api.post<{
    message: string;
    data: any;
  }>(
    `/golden-generation/proposals/${encodeURIComponent(
      proposalId
    )}/approve`
  );

  return response.data;
}

// ======================================================
// ADMIN: REJECT PROPOSAL
// ======================================================

export async function rejectGoldenProposal(
  proposalId: string,
  reason?: string
): Promise<{
  message: string;
  data: any;
}> {

  const response = await api.post<{
    message: string;
    data: any;
  }>(
    `/golden-generation/proposals/${encodeURIComponent(
      proposalId
    )}/reject`,
    null,
    {
      params: reason
        ? { reason }
        : undefined
    }
  );

  return response.data;
}