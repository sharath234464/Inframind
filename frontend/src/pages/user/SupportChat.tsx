import { useEffect, useMemo, useState, type FormEvent } from "react";
import { MessageCircle, Plus, RefreshCw, Send, ShieldCheck, UserRound } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  createConversation,
  getConversationMessages,
  getConversations,
  sendConversationMessage,
  updateConversationStatus,
  type SupportConversation,
  type SupportMessage,
} from "../../services/supportChatService";

export default function SupportChat() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [reply, setReply] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversation_id === activeId) || null,
    [conversations, activeId],
  );

  const loadConversations = async (selectFirst = false) => {
    setLoading(true); setError("");
    try {
      const list = await getConversations();
      setConversations(list);
      if (selectFirst || !activeId) {
        setActiveId(list[0]?.conversation_id || "");
      } else if (!list.some((item) => item.conversation_id === activeId)) {
        setActiveId(list[0]?.conversation_id || "");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not load conversations.");
    } finally { setLoading(false); }
  };

  const loadMessages = async (id: string) => {
    if (!id) { setMessages([]); return; }
    try {
      setMessages(await getConversationMessages(id));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not load conversation messages.");
    }
  };

  useEffect(() => { void loadConversations(true); }, []);
  useEffect(() => { void loadMessages(activeId); }, [activeId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault(); setSending(true); setError(""); setNotice("");
    try {
      const conversation = await createConversation(subject, newMessage);
      setSubject(""); setNewMessage(""); setShowNew(false);
      setNotice("Your message has been sent to the Admin team.");
      await loadConversations(true);
      setActiveId(conversation.conversation_id);
      await loadMessages(conversation.conversation_id);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not create the conversation.");
    } finally { setSending(false); }
  };

  const handleReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeId || !reply.trim()) return;
    setSending(true); setError("");
    try {
      await sendConversationMessage(activeId, reply.trim());
      setReply("");
      await Promise.all([loadMessages(activeId), loadConversations()]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Message could not be sent.");
    } finally { setSending(false); }
  };

  const toggleStatus = async () => {
    if (!activeConversation || !isAdmin) return;
    const next = activeConversation.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await updateConversationStatus(activeId, next);
      await loadConversations();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not update conversation status.");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar role={isAdmin ? "admin" : "user"} active="Messages" />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">{isAdmin ? "ADMIN COMMUNICATIONS" : "WORKSPACE · SUPPORT"}</div>
            <h1>User–Admin Messages</h1>
            <p>{isAdmin ? "Review infrastructure reports and reply to User conversations." : "Report infrastructure issues and communicate directly with the Admin team."}</p>
          </div>
          <div className="page-header-actions">
            {!isAdmin && <button className="primary-button" type="button" onClick={() => setShowNew((v) => !v)}><Plus size={16} /> New message</button>}
            <button className="secondary-button" type="button" onClick={() => void loadConversations()} disabled={loading}><RefreshCw size={16} /> Refresh</button>
          </div>
        </div>

        {error && <div className="analysis-error" role="alert">{error}</div>}
        {notice && <div className="gc-success" role="status">{notice}</div>}

        {showNew && !isAdmin && (
          <form className="support-new-form admin-feature-panel" onSubmit={handleCreate}>
            <div className="section-label">NEW INFRASTRUCTURE REPORT</div>
            <label>Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} minLength={3} maxLength={140} required placeholder="e.g. SRV-10012 high memory utilization" /></label>
            <label>Message<textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} minLength={1} maxLength={5000} rows={4} required placeholder="Describe the issue or information you want to report..." /></label>
            <button className="primary-button" type="submit" disabled={sending}><Send size={15} /> {sending ? "Sending..." : "Send to Admin"}</button>
          </form>
        )}

        <div className="support-chat-layout">
          <section className="support-conversation-list admin-feature-panel">
            <div className="section-label">CONVERSATIONS</div>
            <h2>{isAdmin ? "User reports" : "Your messages"}</h2>
            {loading ? <div className="admin-feature-empty">Loading conversations...</div> : conversations.length === 0 ? <div className="admin-feature-empty"><MessageCircle size={28} /><strong>No conversations yet</strong><span>{isAdmin ? "User reports will appear here." : "Create a message to contact the Admin team."}</span></div> : conversations.map((item) => (
              <button type="button" key={item.conversation_id} className={`support-conversation-item ${activeId === item.conversation_id ? "active" : ""}`} onClick={() => setActiveId(item.conversation_id)}>
                <strong>{item.subject}</strong><span>{item.last_message || "No messages"}</span><small>{item.conversation_id} · {item.status}</small>
              </button>
            ))}
          </section>

          <section className="support-thread admin-feature-panel">
            {activeConversation ? (
              <>
                <div className="support-thread-header">
                  <div><div className="section-label">{activeConversation.conversation_id}</div><h2>{activeConversation.subject}</h2><span className={`status-badge ${activeConversation.status === "OPEN" ? "success" : "warning"}`}>{activeConversation.status}</span></div>
                  {isAdmin && <button type="button" className="secondary-button" onClick={() => void toggleStatus()}>{activeConversation.status === "OPEN" ? "Close report" : "Reopen report"}</button>}
                </div>
                <div className="support-thread-messages">
                  {messages.map((message) => (
                    <div key={message.message_id} className={`support-message ${message.sender_role === (isAdmin ? "ADMIN" : "USER") ? "mine" : "theirs"}`}>
                      <div className="support-message-meta">{message.sender_role === "ADMIN" ? <ShieldCheck size={13} /> : <UserRound size={13} />} {message.sender_role} · {new Date(message.created_at).toLocaleString()}</div>
                      <p>{message.message}</p>
                    </div>
                  ))}
                  {messages.length === 0 && <p className="support-empty-thread">No messages in this conversation.</p>}
                </div>
                {activeConversation.status === "OPEN" ? (
                  <form className="support-reply-form" onSubmit={handleReply}>
                    <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={5000} placeholder="Write a reply..." required />
                    <button className="primary-button" type="submit" disabled={sending || !reply.trim()}><Send size={15} /> Send</button>
                  </form>
                ) : <div className="support-closed-note">This conversation is closed. {isAdmin ? "Reopen it to reply." : "Contact Admin if further assistance is needed."}</div>}
              </>
            ) : <div className="admin-feature-empty"><MessageCircle size={28} /><strong>Select a conversation</strong><span>Messages and replies will appear here.</span></div>}
          </section>
        </div>
      </main>
    </div>
  );
}
