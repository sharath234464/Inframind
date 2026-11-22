import api from "./api";

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
}

// Ask AI infrastructure chatbot
export async function askChatbot(question: string): Promise<string> {
  const response = await api.post<ChatResponse>("/chatbot/chat", {
    question,
  });
  return response.data?.answer || "No response generated.";
}
