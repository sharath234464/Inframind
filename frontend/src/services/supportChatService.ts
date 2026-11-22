import api from "./api";

export interface SupportConversation {
  conversation_id: string;
  created_by: string;
  created_by_role: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  last_message?: string;
  last_message_at?: string;
  created_at?: string;
}

export interface SupportMessage {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: "USER" | "ADMIN";
  message: string;
  created_at: string;
}

export async function getConversations() {
  const response = await api.get<SupportConversation[]>("/support-chat/conversations");
  return Array.isArray(response.data) ? response.data : [];
}

export async function createConversation(subject: string, message: string) {
  const response = await api.post<SupportConversation>("/support-chat/conversations", { subject, message });
  return response.data;
}

export async function getConversationMessages(conversationId: string) {
  const response = await api.get<SupportMessage[]>(`/support-chat/conversations/${encodeURIComponent(conversationId)}/messages`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function sendConversationMessage(conversationId: string, message: string) {
  const response = await api.post<SupportMessage>(`/support-chat/conversations/${encodeURIComponent(conversationId)}/messages`, { message });
  return response.data;
}

export async function updateConversationStatus(conversationId: string, status: "OPEN" | "CLOSED") {
  const response = await api.patch<SupportConversation>(`/support-chat/conversations/${encodeURIComponent(conversationId)}/status`, { status });
  return response.data;
}
