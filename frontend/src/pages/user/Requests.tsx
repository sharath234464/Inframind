import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  RefreshCw,
  XCircle,
  Check,
  Ban,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { decideRequest } from "../../services/requestService";

interface RequestRecord {
  request_id?: string;
  request_type?: string;
  target_id?: string;
  reason?: string;
  status?: string;
  created_at?: string;
  requested_by?: string;
  payload?: Record<string, any>;
}

function Requests() {
  const { user } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === "ADMIN";

  const [requests, setRequests] =
    useState<RequestRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [decisionLoadingId, setDecisionLoadingId] = useState<string | null>(null);

  const handleDecision = async (request: RequestRecord, decision: "APPROVE" | "REJECT") => {
    const requestId = request.request_id;
    if (!requestId || decisionLoadingId) return;
    const comment = decision === "REJECT" ? window.prompt("Optional rejection reason:") : undefined;
    if (decision === "REJECT" && comment === null) return;
    setDecisionLoadingId(requestId);
    try {
      const result = await decideRequest(requestId, decision, comment || undefined);
      setRequests((previous) => previous.map((item) => item.request_id === requestId ? { ...item, status: result.status || (decision === "APPROVE" ? "COMPLETED" : "REJECTED") } : item));
      await loadRequests();
    } catch (err: any) {
      setError(err?.response?.data?.detail || `Unable to ${decision.toLowerCase()} request ${requestId}.`);
      await loadRequests();
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const loadRequests = async () => {
    try {
      setError("");

      const endpoint =
        isAdmin
          ? "/requests/admin"
          : "/requests/mine";

      const response =
        await api.get(endpoint);

      const data = response.data;

      if (Array.isArray(data)) {
        setRequests(data);
      } else if (Array.isArray(data?.data)) {
        setRequests(data.data);
      } else if (
        Array.isArray(data?.requests)
      ) {
        setRequests(data.requests);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load infrastructure requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [isAdmin]);

  const pending =
    requests.filter(
      (request) =>
        String(request.status || "")
          .toUpperCase() === "PENDING"
    ).length;

  const approved =
    requests.filter(
      (request) =>
        ["APPROVED", "COMPLETED"].includes(
          String(request.status || "")
            .toUpperCase()
        )
    ).length;

  const rejected =
    requests.filter(
      (request) =>
        String(request.status || "")
          .toUpperCase() === "REJECTED"
    ).length;

  return (
    <div className="app-shell">
      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active={
          isAdmin
            ? "Requests & Approvals"
            : "My Requests"
        }
      />

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              {isAdmin
                ? "COMMAND CENTER"
                : "WORKSPACE"}
            </div>

            <h1>
              {isAdmin
                ? "Requests & Approvals"
                : "My Requests"}
            </h1>

            <p>
              {isAdmin
                ? "Review and manage infrastructure change requests."
                : "Track your infrastructure requests and their status."}
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() => {
              setRefreshing(true);
              loadRequests();
            }}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "refresh-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <div className="requests-kpi-grid">
          <div className="requests-kpi-card">
            <ClipboardCheck size={20} />
            <span>Total</span>
            <strong>
              {requests.length}
            </strong>
          </div>

          <div className="requests-kpi-card warning">
            <Clock3 size={20} />
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>

          <div className="requests-kpi-card success">
            <CheckCircle2 size={20} />
            <span>Approved / Completed</span>
            <strong>{approved}</strong>
          </div>

          <div className="requests-kpi-card danger">
            <XCircle size={20} />
            <span>Rejected</span>
            <strong>{rejected}</strong>
          </div>
        </div>

        {error && (
          <div className="requests-error">
            {error}
          </div>
        )}

        <div className="requests-panel">
          <div className="section-label">
            INFRASTRUCTURE REQUESTS
          </div>

          <h2>
            Request Management
          </h2>

          {loading ? (
            <div className="requests-empty">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="requests-empty">
              <ClipboardCheck size={30} />

              <strong>
                No requests found
              </strong>

              <span>
                Infrastructure requests will
                appear here.
              </span>
            </div>
          ) : (
            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Type</th>
                    <th>Target / File</th>
                    {isAdmin && <th>Requested By</th>}
                    <th>Reason / Details</th>
                    <th>Status</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {requests.map(
                    (request, index) => (
                      <motion.tr
                        key={
                          request.request_id ||
                          index
                        }
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                      >
                        <td>
                          <strong>
                            {request.request_id ||
                              "—"}
                          </strong>
                        </td>

                        <td>
                          {request.request_type ||
                            "—"}
                        </td>

                        <td>
                          {request.target_id || request.payload?.instance_type || request.payload?.filename || "—"}
                          {request.request_type === "INVENTORY_UPLOAD" && request.payload?.records && (
                            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{request.payload.records.length} server records</div>
                          )}
                        </td>
                        {isAdmin && <td>{request.requested_by || "—"}</td>}
                        <td>
                          {request.reason || "—"}
                          {request.request_type === "ADD_SERVER" && request.payload?.server_name && (
                            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>{request.payload.server_name} · {request.payload.instance_type || "Instance type not set"}</div>
                          )}
                        </td>

                        <td>
                          <span className="request-status">
                            {request.status || "PENDING"}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            {String(request.status || "").toUpperCase() === "PENDING" ? (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button type="button" className="primary-button" disabled={decisionLoadingId === request.request_id} onClick={() => handleDecision(request, "APPROVE")}>
                                  <Check size={14} /> {decisionLoadingId === request.request_id ? "Processing…" : "Approve"}
                                </button>
                                <button type="button" className="secondary-button" disabled={decisionLoadingId === request.request_id} onClick={() => handleDecision(request, "REJECT")}>
                                  <Ban size={14} /> Reject
                                </button>
                              </div>
                            ) : <span>{request.status}</span>}
                          </td>
                        )}
                      </motion.tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Requests;