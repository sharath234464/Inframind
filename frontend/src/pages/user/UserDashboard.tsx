import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Server,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";
import { getOperationsSummary } from "../../services/operationsService";
import Sidebar from "../../components/layout/Sidebar";

interface DashboardData {
  total_servers: number;
  compliant: number;
  needs_review: number;
  properly_allocated: number;
  under_allocated: number;
  over_allocated: number;
  properly_utilized: number;
  under_utilized: number;
  over_utilized: number;
}

interface OperationsData {
  total_servers: number;
  compliant_servers: number;
  non_compliant_servers: number;
  open_alerts: number;
  critical_alerts: number;
  high_risk_servers: number | null;
  pending_requests: number;
  active_scheduled_jobs: number;
  pending_golden_proposals: number;
}

interface InfrastructureRequest {
  _id?: string;
  request_id: string;
  request_type: string;
  target_id?: string | null;
  reason: string;
  status: string;
  requested_by?: string;
  created_at?: string;
  updated_at?: string;
}

const requestTypeLabels: Record<string, string> = {
  ADD_SERVER: "Add Server",
  UPDATE_SERVER: "Update Server",
  DELETE_SERVER: "Delete Server",
  RESOURCE_CHANGE: "Resource Change",
  GOLDEN_CONFIG_CHANGE: "Golden Config Change",
};

function UserDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [operations, setOperations] =
    useState<OperationsData | null>(null);

  const [requests, setRequests] =
    useState<InfrastructureRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        api.get<DashboardData>("/dashboard"),
        getOperationsSummary(),
        api.get<InfrastructureRequest[]>("/requests/mine"),
      ]);

      const [dashboardResult, operationsResult, requestsResult] = results;

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value.data);
      }

      if (operationsResult.status === "fulfilled") {
        setOperations(operationsResult.value);
      }

      if (requestsResult.status === "fulfilled") {
        const requestData = Array.isArray(requestsResult.value.data)
          ? requestsResult.value.data
          : [];
        setRequests(requestData);
      }

      const failures = results.filter((item) => item.status === "rejected");
      if (failures.length === results.length) {
        throw new Error("Unable to load infrastructure workspace.");
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load your infrastructure workspace."
      );
    } finally {
      setLoading(false);
    }
  };

  const requestStats = useMemo(() => {
    return {
      pending: requests.filter(
        (item) => item.status === "PENDING"
      ).length,

      approved: requests.filter(
        (item) =>
          item.status === "APPROVED" ||
          item.status === "COMPLETED"
      ).length,

      rejected: requests.filter(
        (item) => item.status === "REJECTED"
      ).length,

      failed: requests.filter(
        (item) => item.status === "FAILED"
      ).length,
    };
  }, [requests]);

  const compliancePercentage =
    dashboard && dashboard.total_servers > 0
      ? Math.round(
          (dashboard.compliant /
            dashboard.total_servers) *
            100
        )
      : 0;

  const recentRequests = requests.slice(0, 5);

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar
          role="user"
          active="Dashboard"
        />

        <main className="main-content">
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <span>
              Loading infrastructure workspace...
            </span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        role="user"
        active="Dashboard"
      />

      <main className="main-content">
        {/* TOP BAR */}
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-eyebrow">
              INFRASTRUCTURE WORKSPACE
            </p>

            <h1 className="dashboard-title">
              User Command Center
            </h1>

            <p className="dashboard-subtitle">
              Monitor infrastructure health, compliance,
              requests and operational activity.
            </p>
          </div>

          <div className="dashboard-top-actions">
            <button
              type="button"
              className="dashboard-refresh-button"
              onClick={loadDashboard}
            >
              <Activity size={15} />
              Refresh
            </button>
          </div>
        </header>

        {/* ERROR */}
        {error && (
          <div className="dashboard-error">
            <AlertTriangle size={17} />
            <span>{error}</span>
          </div>
        )}

        {/* KPI CARDS */}
        <section className="user-kpi-grid">
          <motion.div
            className="user-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <div className="user-kpi-icon blue">
              <Server size={20} />
            </div>

            <div>
              <span className="user-kpi-label">
                Total Servers
              </span>

              <strong>
                {dashboard?.total_servers ?? 0}
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="user-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.05,
            }}
          >
            <div className="user-kpi-icon green">
              <ShieldCheck size={20} />
            </div>

            <div>
              <span className="user-kpi-label">
                Compliance
              </span>

              <strong>
                {compliancePercentage}%
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="user-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
          >
            <div className="user-kpi-icon amber">
              <AlertTriangle size={20} />
            </div>

            <div>
              <span className="user-kpi-label">
                Open Alerts
              </span>

              <strong>
                {operations?.open_alerts ?? 0}
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="user-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.15,
            }}
          >
            <div className="user-kpi-icon purple">
              <FileText size={20} />
            </div>

            <div>
              <span className="user-kpi-label">
                My Requests
              </span>

              <strong>
                {requests.length}
              </strong>
            </div>
          </motion.div>
        </section>

        {/* COMPLIANCE + REQUEST STATUS */}
        <section className="user-dashboard-grid">
          {/* COMPLIANCE */}
          <motion.div
            className="user-panel compliance-panel"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
          >
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  INFRASTRUCTURE
                </span>

                <h2>
                  Compliance Overview
                </h2>
              </div>

              <ShieldCheck size={19} />
            </div>

            <div className="compliance-content">
              <div className="compliance-ring">
                <div
                  className="compliance-ring-progress"
                  style={{
                    background: `conic-gradient(
                      #60a5fa ${
                        compliancePercentage * 3.6
                      }deg,
                      rgba(255,255,255,0.06) 0deg
                    )`,
                  }}
                >
                  <div className="compliance-ring-inner">
                    <strong>
                      {compliancePercentage}%
                    </strong>

                    <span>
                      Compliant
                    </span>
                  </div>
                </div>
              </div>

              <div className="compliance-details">
                <div className="status-line">
                  <span>
                    <i className="status-dot green-dot" />
                    Compliant
                  </span>

                  <strong>
                    {dashboard?.compliant ?? 0}
                  </strong>
                </div>

                <div className="status-line">
                  <span>
                    <i className="status-dot red-dot" />
                    Needs Review
                  </span>

                  <strong>
                    {dashboard?.needs_review ?? 0}
                  </strong>
                </div>

                <div className="status-line">
                  <span>
                    <i className="status-dot amber-dot" />
                    High Risk
                  </span>

                  <strong>
                    {operations?.high_risk_servers ?? "—"}
                  </strong>
                </div>
              </div>
            </div>
          </motion.div>

          {/* REQUEST STATUS */}
          <motion.div
            className="user-panel"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.25,
            }}
          >
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  WORKFLOW
                </span>

                <h2>
                  Request Status
                </h2>
              </div>

              <Clock3 size={19} />
            </div>

            <div className="request-status-grid">
              <div className="request-status-card pending">
                <Clock3 size={18} />

                <strong>
                  {requestStats.pending}
                </strong>

                <span>
                  Pending
                </span>
              </div>

              <div className="request-status-card approved">
                <CheckCircle2 size={18} />

                <strong>
                  {requestStats.approved}
                </strong>

                <span>
                  Approved / Completed
                </span>
              </div>

              <div className="request-status-card rejected">
                <XCircle size={18} />

                <strong>
                  {requestStats.rejected}
                </strong>

                <span>
                  Rejected
                </span>
              </div>

              <div className="request-status-card failed">
                <AlertTriangle size={18} />

                <strong>
                  {requestStats.failed}
                </strong>

                <span>
                  Failed
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* RESOURCE STATUS */}
        <section className="user-panel resource-panel">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">
                RESOURCE ANALYSIS
              </span>

              <h2>
                Allocation & Utilization
              </h2>
            </div>

            <Server size={19} />
          </div>

          <div className="resource-stat-grid">
            <div className="resource-stat">
              <span>
                Properly Allocated
              </span>

              <strong>
                {dashboard?.properly_allocated ?? 0}
              </strong>
            </div>

            <div className="resource-stat warning">
              <span>
                Under Allocated
              </span>

              <strong>
                {dashboard?.under_allocated ?? 0}
              </strong>
            </div>

            <div className="resource-stat danger">
              <span>
                Over Allocated
              </span>

              <strong>
                {dashboard?.over_allocated ?? 0}
              </strong>
            </div>

            <div className="resource-stat">
              <span>
                Properly Utilized
              </span>

              <strong>
                {dashboard?.properly_utilized ?? 0}
              </strong>
            </div>

            <div className="resource-stat warning">
              <span>
                Under Utilized
              </span>

              <strong>
                {dashboard?.under_utilized ?? 0}
              </strong>
            </div>

            <div className="resource-stat danger">
              <span>
                Over Utilized
              </span>

              <strong>
                {dashboard?.over_utilized ?? 0}
              </strong>
            </div>
          </div>
        </section>

        {/* RECENT REQUESTS + QUICK ACTIONS */}
        <section className="user-bottom-grid">
          {/* RECENT REQUESTS */}
          <div className="user-panel requests-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  MY ACTIVITY
                </span>

                <h2>
                  Recent Requests
                </h2>
              </div>

              <FileText size={19} />
            </div>

            {recentRequests.length === 0 ? (
              <div className="empty-state">
                <FileText size={28} />

                <p>
                  No infrastructure requests yet.
                </p>

                <span>
                  Your submitted requests will appear
                  here.
                </span>
              </div>
            ) : (
              <div className="request-list">
                {recentRequests.map(
                  (request) => (
                    <div
                      className="request-row"
                      key={
                        request.request_id ||
                        request._id
                      }
                    >
                      <div className="request-main">
                        <div className="request-icon">
                          <FileText size={16} />
                        </div>

                        <div>
                          <strong>
                            {request.request_id}
                          </strong>

                          <span>
                            {requestTypeLabels[
                              request.request_type
                            ] ||
                              request.request_type}
                          </span>
                        </div>
                      </div>

                      <div className="request-meta">
                        <span
                          className={`request-status ${request.status.toLowerCase()}`}
                        >
                          {request.status}
                        </span>

                        {request.created_at && (
                          <small>
                            {new Date(
                              request.created_at
                            ).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* QUICK ACTIONS */}
          <div className="user-panel quick-actions-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">
                  ACTIONS
                </span>

                <h2>
                  Quick Access
                </h2>
              </div>

              <Activity size={19} />
            </div>

            <div className="quick-actions">
              <button
                type="button"
                className="quick-action"
                onClick={() => navigate("/user/requests")}
              >
                <div className="quick-action-icon blue">
                  <Plus size={18} />
                </div>

                <div>
                  <strong>
                    Create Request
                  </strong>

                  <span>
                    Submit an infrastructure change
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={() => navigate("/user/ai-assistant")}
              >
                <div className="quick-action-icon purple">
                  <Bot size={18} />
                </div>

                <div>
                  <strong>
                    AI Assistant
                  </strong>

                  <span>
                    Ask about your infrastructure
                  </span>
                </div>
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={() => navigate("/user/health")}
              >
                <div className="quick-action-icon green">
                  <Activity size={18} />
                </div>

                <div>
                  <strong>
                    View Health
                  </strong>

                  <span>
                    Review server health and risk
                  </span>
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;