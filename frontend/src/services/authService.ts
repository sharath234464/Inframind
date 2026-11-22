import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  user_id: string;
  role: "USER" | "ADMIN";
  email: string;
  name?: string;
}

export async function loginUser(
  credentials: LoginRequest
): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>(
    "/auth/login",
    credentials
  );
  return response.data;
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser & { is_active?: boolean }>("/auth/me");
  const profile = response.data;
  return {
    user_id: profile.user_id,
    role: profile.role,
    email: profile.email,
    name: profile.name || profile.email.split("@")[0],
  };
}

export function logoutUser() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_id");
}
