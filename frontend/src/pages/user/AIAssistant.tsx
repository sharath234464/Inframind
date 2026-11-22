
import { useState, type KeyboardEvent } from "react";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function getErrorMessage(error: any): string {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  const responseMessage = error?.response?.data?.message;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => item.msg || "Invalid request")
      .join(", ");
  }

  if (typeof responseMessage === "string") {
    return responseMessage;
  }

  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (status === 403) {
    return "You are not authorized to perform this operation.";
  }

  if (status === 404) {
    return "The AI Assistant API endpoint was not found. Check the backend router registration.";
  }

  if (status === 422) {
    return "The request format is invalid. Please check your message and try again.";
  }

  if (status >= 500) {
    return `Backend error (${status}). Please check the FastAPI terminal for the actual error.`;
  }

  if (error?.code === "ECONNABORTED") {
    return "The AI Assistant request timed out. Please try again.";
  }

  if (!error?.response) {
    return "Cannot connect to the backend. Make sure FastAPI is running on port 8000 and the Vite proxy is configured.";
  }

  return error?.message || "Something went wrong. Please try again.";
}

function AIAssistant() {
  const { user } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === "ADMIN";

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = question.trim();

    if (!text || loading) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post(
        "/chatbot/chat",
        {
          question: text,
        },
        {
          timeout: 60000,
        }
      );

      const answer =
        response.data?.answer ??
        response.data?.message ??
        "InfraMind could not generate a response.";

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            typeof answer === "string"
              ? answer
              : JSON.stringify(answer, null, 2),
        },
      ]);
    } catch (error: any) {
      console.error(
        "InfraMind AI Assistant request failed:",
        {
          status: error?.response?.status,
          response: error?.response?.data,
          message: error?.message,
          url: error?.config?.url,
        }
      );

      const errorMessage = getErrorMessage(error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: `Unable to complete your request.\n\n${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      sendMessage();
    }
  };

  const useSuggestion = (suggestion: string) => {
    setQuestion(suggestion);
  };

  const clearChat = () => {
    if (loading) return;
    setMessages([]);
    setQuestion("");
  };

  return (
    <div className="app-shell">
      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active="AI Assistant"
      />

      <main className="main-content">
        {/* PAGE HEADER */}

        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              {isAdmin ? "COMMAND CENTER" : "WORKSPACE"}
            </div>

            <h1>AI Assistant</h1>

            <p>
              Ask questions about your infrastructure,
              server health, compliance, alerts, analysis
              and recommendations. For infrastructure
              changes, describe the action clearly;
              User requests are sent to an administrator
              for approval before data changes.
            </p>
          </div>
        </div>

        {/* AI ASSISTANT PANEL */}

        <div className="ai-assistant-panel">

          {/* HEADER */}

          <div className="ai-assistant-header">
            <div className="ai-assistant-icon">
              <Sparkles size={22} />
            </div>

            <div>
              <strong>InfraMind AI</strong>

              <span>
                Enterprise infrastructure intelligence assistant
              </span>
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                disabled={loading}
                title="Clear conversation"
                aria-label="Clear conversation"
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: loading ? "not-allowed" : "pointer",
                  padding: "8px",
                }}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {/* CHAT AREA */}

          <div className="ai-chat-area">

            {messages.length === 0 ? (

              /* WELCOME SCREEN */

              <div className="ai-welcome">
                <div className="ai-welcome-icon">
                  <Bot size={32} />
                </div>

                <h2>How can I help?</h2>

                <p>
                  Ask InfraMind about your infrastructure
                  environment, server health, compliance,
                  alerts or resource optimization.
                </p>

                <div className="ai-suggestions">

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "Give me a summary of the infrastructure health."
                      )
                    }
                  >
                    Infrastructure health
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "Which servers need attention?"
                      )
                    }
                  >
                    Servers needing attention
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "Show me the current infrastructure analysis."
                      )
                    }
                  >
                    Infrastructure analysis
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "What are the important infrastructure alerts?"
                      )
                    }
                  >
                    Important alerts
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "Generate Golden Configuration from inventory for General Purpose"
                      )
                    }
                  >
                    Request Golden Configuration approval
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      useSuggestion(
                        "Delete server SRV-1001"
                      )
                    }
                  >
                    Request a server change
                  </button>

                </div>
              </div>

            ) : (

              /* CHAT MESSAGES */

              <div className="ai-messages">

                {messages.map((message, index) => (
                  <motion.div
                    key={`${message.role}-${index}`}
                    className={`ai-message ${message.role}`}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.2,
                    }}
                  >

                    <div className="ai-message-icon">
                      {message.role === "user" ? (
                        <User size={16} />
                      ) : (
                        <Bot size={16} />
                      )}
                    </div>

                    <div className="ai-message-content">

                      <span>
                        {message.role === "user"
                          ? "You"
                          : "InfraMind AI"}
                      </span>

                      <p
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {message.content}
                      </p>

                    </div>

                  </motion.div>
                ))}

                {/* LOADING INDICATOR */}

                {loading && (
                  <motion.div
                    className="ai-message assistant"
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                  >

                    <div className="ai-message-icon">
                      <Bot size={16} />
                    </div>

                    <div className="ai-message-content">

                      <span>InfraMind AI</span>

                      <p
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Loader2
                          size={15}
                          className="refresh-spin"
                        />

                        Thinking...
                      </p>

                    </div>

                  </motion.div>
                )}

              </div>
            )}

          </div>

          {/* INPUT AREA */}

          <div className="ai-input-area">

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Ask InfraMind anything..."
              rows={2}
              disabled={loading}
            />

            <button
              type="button"
              onClick={sendMessage}
              disabled={
                loading || !question.trim()
              }
              aria-label="Send message"
              title="Send message"
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="refresh-spin"
                />
              ) : (
                <Send size={18} />
              )}
            </button>

          </div>

          <div
            style={{
              padding: "0 20px 12px",
              color: "#64748b",
              fontSize: "11px",
            }}
          >
            {isAdmin
              ? "Admin mode: infrastructure changes are executed according to your permissions."
              : "User mode: infrastructure change requests require administrator approval."}
          </div>

        </div>
      </main>
    </div>
  );
}

export default AIAssistant;
