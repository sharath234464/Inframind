import api from "./api";

export type RequestType =
  | "ADD_SERVER"
  | "UPDATE_SERVER"
  | "DELETE_SERVER"
  | "RESOURCE_CHANGE"
  | "GOLDEN_CONFIG_CHANGE"
  | "INVENTORY_UPLOAD"
  | "GOLDEN_CONFIG_GENERATION";

export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "FAILED";

export interface InfrastructureRequestCreate {
  request_type: RequestType;
  target_id?: string | null;
  payload?: Record<string, any>;
  reason: string;
}

export interface InfrastructureRequest {
  _id?: string;
  request_id: string;
  request_type: RequestType;
  target_id?: string | null;
  payload?: Record<string, any>;
  reason: string;
  status: RequestStatus | string;
  requested_by?: string;
  decided_by?: string;
  decision_comment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryApprovalResponse {
  request_id: string;
  request_type: "INVENTORY_UPLOAD";
  requested_by?: string;
  status: RequestStatus | string;
  uploaded_records: number;
  message: string;
}

// USER: CREATE INFRASTRUCTURE REQUEST

export async function createRequest(
  data: InfrastructureRequestCreate
): Promise<InfrastructureRequest> {
  const response = await api.post<InfrastructureRequest>(
    "/requests",
    data
  );

  return response.data;
}

// USER: VIEW OWN REQUESTS

export async function getMyRequests(): Promise<
  InfrastructureRequest[]
> {
  const response = await api.get<InfrastructureRequest[]>(
    "/requests/mine"
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

// ADMIN: VIEW ALL REQUESTS

export async function getAllRequests(
  status?: string
): Promise<InfrastructureRequest[]> {
  const response = await api.get<InfrastructureRequest[]>(
    "/requests/admin",
    {
      params: status ? { status } : undefined,
    }
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

// ADMIN: APPROVE OR REJECT REQUEST

export async function decideRequest(
  requestId: string,
  decision: "APPROVE" | "REJECT",
  comment?: string
): Promise<any> {
  const response = await api.post(
    `/requests/${encodeURIComponent(requestId)}/decision`,
    {
      decision,
      comment: comment || null,
    }
  );

  return response.data;
}

/**
 * USER: SUBMIT INVENTORY FOR ADMIN APPROVAL.
 *
 * Backend endpoint:
 * POST /requests/inventory-upload
 *
 * This validates the Excel workbook and creates a pending request.
 * It does NOT write server records into active inventory.
 * Records are inserted after Admin approval.
 */
export async function submitInventoryForApproval(
  file: File
): Promise<InventoryApprovalResponse> {
  if (!(file instanceof File)) {
    throw new Error(
      "Please select an Excel inventory file first."
    );
  }

  const formData = new FormData();

  formData.append("file", file, file.name);

  const response = await api.post<InventoryApprovalResponse>(
    "/requests/inventory-upload",
    formData
  );

  return response.data;
}