import api from "./api";

export interface ServerUploadResponse {
  status: boolean;
  message: string;
  filename: string;
  uploaded_records: number;
}

/**
 * Admin direct server inventory upload.
 *
 * Backend endpoint:
 * POST /upload/server
 *
 * The browser/Axios automatically adds the multipart boundary.
 */
export async function uploadServerInventory(
  file: File
): Promise<ServerUploadResponse> {
  if (!(file instanceof File)) {
    throw new Error(
      "Please select an Excel inventory file first."
    );
  }

  const formData = new FormData();

  formData.append("file", file, file.name);

  const response = await api.post<ServerUploadResponse>(
    "/upload/server",
    formData
  );

  return response.data;
}
