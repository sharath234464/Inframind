import api from "./api";

export interface JobRecord {
  job_id: string;
  name: string;
  job_type: string;
  cron_expression: string;
  description?: string | null;
  enabled: boolean;
  created_by?: string;
  created_by_role?: string;
  created_at?: string | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
}

export interface JobCreateRequest {
  name: string;
  job_type: "OVER_ALLOCATED_COUNT" | "UNDER_ALLOCATED_COUNT" | "NON_COMPLIANT_COUNT" | "PROBLEM_SERVERS" | "COMPLIANCE_SUMMARY";
  cron_expression: string;
  description?: string;
  enabled?: boolean;
}

export interface JobUpdateRequest {
  name?: string;
  cron_expression?: string;
  description?: string;
  enabled?: boolean;
}

export async function getJobs(): Promise<JobRecord[]> {
  const response = await api.get<JobRecord[]>("/jobs");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getJob(jobId: string): Promise<JobRecord> {
  const response = await api.get<JobRecord>(`/jobs/${encodeURIComponent(jobId)}`);
  return response.data;
}

export async function createJob(data: JobCreateRequest): Promise<JobRecord> {
  const response = await api.post<JobRecord>("/jobs", data);
  return response.data;
}

export async function updateJob(jobId: string, data: JobUpdateRequest): Promise<JobRecord> {
  const response = await api.put<JobRecord>(`/jobs/${encodeURIComponent(jobId)}`, data);
  return response.data;
}

export async function deleteJob(jobId: string): Promise<{ message: string; job_id: string }> {
  const response = await api.delete<{ message: string; job_id: string }>(`/jobs/${encodeURIComponent(jobId)}`);
  return response.data;
}

export async function getJobHistory(jobId: string): Promise<unknown[]> {
  const response = await api.get<unknown[]>(`/jobs/${encodeURIComponent(jobId)}/history`);
  return Array.isArray(response.data) ? response.data : [];
}
