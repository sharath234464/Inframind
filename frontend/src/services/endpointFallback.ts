import api from "./api";

// Uses the canonical endpoint (the final path supplied by the caller).
// Keep fallback lists only where legacy route support is intentionally required.
export async function getFirstAvailable<T>(paths: string[]): Promise<T> {
  const path = paths[paths.length - 1]; // Use canonical last path
  const response = await api.get<T>(path);
  return response.data;
}

export async function postFirstAvailable<T>(
  paths: string[],
  data?: unknown
): Promise<T> {
  const path = paths[paths.length - 1];
  const response = await api.post<T>(path, data);
  return response.data;
}
