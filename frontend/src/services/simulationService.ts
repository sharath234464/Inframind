import api from "./api";

export interface ResourceSimulationRequest {
  server_id: string;
  vcpu?: number | null;
  memory?: number | null;
  disk?: number | null;
  reason?: string | null;
}

export interface SimulationResourceState {
  vcpu: number;
  memory: number;
  disk: number;
  cpu_utilization?: number;
  memory_utilization?: number;
  disk_utilization?: number;
}

export interface SimulationResult {
  server_id: string;
  current: Record<string, any>;
  simulated: Record<string, any>;
  allocation_change: string;
  utilization_change: string;
  current_classification: string;
  simulated_classification: string;
  recommendation: string;
}

// Simulate resource change
export async function simulateResourceChange(
  data: ResourceSimulationRequest
): Promise<SimulationResult> {
  const response = await api.post<SimulationResult>(
    "/simulation/resource",
    data
  );
  return response.data;
}
