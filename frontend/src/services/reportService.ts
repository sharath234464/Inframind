import api from "./api";

export interface ReportResponse {
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

// Generate / get current infrastructure report
export async function getReport(): Promise<ReportResponse> {
  const response = await api.get<ReportResponse>("/reports");
  return response.data;
}
