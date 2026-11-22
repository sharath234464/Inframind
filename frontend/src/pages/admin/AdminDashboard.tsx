import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  FileWarning,
  HeartPulse,
  MemoryStick,
  Server,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import Sidebar from "../../components/layout/Sidebar";
import api from "../../services/api";
import { getOperationsSummary } from "../../services/operationsService";

interface DashboardData {
  status: boolean;
  message: string;

  total_servers: number;

  properly_allocated: number;
  under_allocated: number;
  over_allocated: number;

  properly_utilized: number;
  under_utilized: number;
  over_utilized: number;

  compliant: number;
  needs_review: number;
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
  recent_activity: unknown[];
}

interface PieItem {
  name: string;
  value: number;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [operations, setOperations] =
    useState<OperationsData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [operationsWarning, setOperationsWarning] =
    useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [dashboardResult, operationsResult] =
          await Promise.allSettled([
            api.get<DashboardData>("/dashboard"),
            getOperationsSummary(),
          ]);

        const warnings: string[] = [];

        if (dashboardResult.status === "fulfilled") {
          setDashboard(dashboardResult.value.data);
        } else {
          setDashboard({
            status: false,
            message: "Dashboard metrics are temporarily unavailable.",
            total_servers: 0,
            properly_allocated: 0,
            under_allocated: 0,
            over_allocated: 0,
            properly_utilized: 0,
            under_utilized: 0,
            over_utilized: 0,
            compliant: 0,
            needs_review: 0,
          });
          warnings.push("Infrastructure classification metrics could not be loaded.");
        }

        if (operationsResult.status === "fulfilled") {
          setOperations(operationsResult.value);
        } else {
          // Keep the main dashboard visible if the optional operational
          // summary endpoint is unavailable; surface a warning instead.
          setOperations({
            total_servers: 0,
            compliant_servers: 0,
            non_compliant_servers: 0,
            open_alerts: 0,
            critical_alerts: 0,
            high_risk_servers: null,
            pending_requests: 0,
            active_scheduled_jobs: 0,
            pending_golden_proposals: 0,
            recent_activity: [],
          });
          warnings.push("Operational summary metrics could not be loaded.");
        }

        setOperationsWarning(warnings.join(" "));

        if (
          dashboardResult.status === "rejected" &&
          operationsResult.status === "rejected"
        ) {
          throw dashboardResult.reason;
        }
      } catch (err: any) {
        console.error(
          "Dashboard loading failed:",
          err
        );

        if (err?.response?.status === 401) {
          setError(
            "Your session has expired. Please sign in again."
          );
        } else {
          setError(
            "Unable to load infrastructure dashboard."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const complianceData: PieItem[] =
    dashboard
      ? [
          {
            name: "Compliant",
            value: dashboard.compliant,
          },
          {
            name: "Needs Review",
            value: dashboard.needs_review,
          },
        ]
      : [];

  const allocationData: PieItem[] =
    dashboard
      ? [
          {
            name: "Properly Allocated",
            value: dashboard.properly_allocated,
          },
          {
            name: "Under Allocated",
            value: dashboard.under_allocated,
          },
          {
            name: "Over Allocated",
            value: dashboard.over_allocated,
          },
        ]
      : [];

  const utilizationData: PieItem[] =
    dashboard
      ? [
          {
            name: "Properly Utilized",
            value: dashboard.properly_utilized,
          },
          {
            name: "Under Utilized",
            value: dashboard.under_utilized,
          },
          {
            name: "Over Utilized",
            value: dashboard.over_utilized,
          },
        ]
      : [];

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar
          role="admin"
          active="Command Center"
        />

        <main className="main-content">
          <div className="dashboard-loading">
            <div className="loading-spinner" />
            <h3>
              Loading infrastructure intelligence...
            </h3>
            <p>
              Fetching your latest infrastructure
              data.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <Sidebar
          role="admin"
          active="Command Center"
        />

        <main className="main-content">
          <div className="dashboard-error">
            <TriangleAlert size={32} />

            <h3>
              Dashboard unavailable
            </h3>

            <p>{error}</p>

            <button
              onClick={() =>
                window.location.reload()
              }
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!dashboard || !operations) {
    return null;
  }

  const compliancePercentage =
    dashboard.total_servers > 0
      ? Math.round(
          (dashboard.compliant /
            dashboard.total_servers) *
            100
        )
      : 0;

  return (
    <div className="app-shell">
      <Sidebar
        role="admin"
        active="Command Center"
      />

      <main className="main-content">

        {operationsWarning && (
          <div className="analysis-error" role="status" style={{ marginBottom: 16 }}>
            {operationsWarning}
          </div>
        )}

        {/* ==================================================
            TOP BAR
        ================================================== */}

        <header className="topbar">

          <div>
            <div className="breadcrumb">
              ADMIN COMMAND CENTER
            </div>

            <h1>
              Infrastructure Overview
            </h1>

            <p>
              Real-time intelligence across your
              infrastructure environment.
            </p>
          </div>

          <div className="topbar-actions">

            <button
              type="button"
              className="icon-button"
              title="Alerts"
              onClick={() => navigate("/admin/alerts")}
            >
              <AlertTriangle size={19} />

              {operations.open_alerts > 0 && (
                <span className="notification-dot" />
              )}
            </button>

            <div className="profile-chip">

              <div className="profile-avatar">
                A
              </div>

              <div>
                <strong>
                  Administrator
                </strong>

                <span>
                  System Admin
                </span>
              </div>

            </div>

          </div>

        </header>


        {/* ==================================================
            KPI CARDS
        ================================================== */}

        <section className="stats-grid">

          <AnimatedStatCard
            title="Total Servers"
            value={dashboard.total_servers}
            icon={Server}
            index={0}
          />

          <AnimatedStatCard
            title="Compliant Servers"
            value={operations.compliant_servers}
            icon={ShieldCheck}
            index={1}
            suffix={`${compliancePercentage}%`}
          />

          <AnimatedStatCard
            title="Open Alerts"
            value={operations.open_alerts}
            icon={AlertTriangle}
            index={2}
            suffix={`${operations.critical_alerts} critical`}
          />

          <AnimatedStatCard
            title="High Risk Servers"
            value={operations.high_risk_servers ?? "—"}
            icon={HeartPulse}
            index={3}
          />

        </section>


        {/* ==================================================
            SECONDARY KPI ROW
        ================================================== */}

        <section className="secondary-stats-grid">

          <MiniStat
            icon={ClipboardIcon}
            title="Pending Requests"
            value={operations.pending_requests}
          />

          <MiniStat
            icon={Activity}
            title="Active Jobs"
            value={
              operations.active_scheduled_jobs
            }
          />

          <MiniStat
            icon={FileWarning}
            title="Golden Proposals"
            value={
              operations.pending_golden_proposals
            }
          />

          <MiniStat
            icon={BrainCircuit}
            title="AI Analysis"
            value={
              dashboard.total_servers
            }
          />

        </section>


        {/* ==================================================
            MAIN ANALYTICS
        ================================================== */}

        <section className="dashboard-grid">

          {/* COMPLIANCE */}

          <motion.div
            className="dashboard-card chart-card"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.15,
            }}
          >

            <div className="card-header">

              <div>
                <h3>
                  Compliance Overview
                </h3>

                <p>
                  Infrastructure compliance
                  against approved standards.
                </p>
              </div>

              <ShieldCheck
                size={20}
              />

            </div>

            <div className="chart-layout">

              <div className="donut-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={complianceData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      animationDuration={1000}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#475569" />
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0b1728",
                        border:
                          "1px solid #263a59",
                        borderRadius:
                          "10px",
                        color:
                          "#e2e8f0",
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>

                <div className="donut-center">

                  <strong>
                    {compliancePercentage}%
                  </strong>

                  <span>
                    Compliant
                  </span>

                </div>

              </div>

              <div className="chart-legend">

                <LegendRow
                  label="Compliant"
                  value={
                    dashboard.compliant
                  }
                  className="legend-blue"
                />

                <LegendRow
                  label="Needs Review"
                  value={
                    dashboard.needs_review
                  }
                  className="legend-gray"
                />

              </div>

            </div>

          </motion.div>


          {/* ALLOCATION */}

          <motion.div
            className="dashboard-card chart-card"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.25,
            }}
          >

            <div className="card-header">

              <div>
                <h3>
                  Resource Allocation
                </h3>

                <p>
                  Capacity allocation across
                  infrastructure.
                </p>
              </div>

              <Database
                size={20}
              />

            </div>

            <div className="chart-layout">

              <div className="donut-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={allocationData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      animationDuration={1000}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#8b5cf6" />
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0b1728",
                        border:
                          "1px solid #263a59",
                        borderRadius:
                          "10px",
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>

              </div>

              <div className="chart-legend">

                <LegendRow
                  label="Properly Allocated"
                  value={
                    dashboard.properly_allocated
                  }
                  className="legend-green"
                />

                <LegendRow
                  label="Under Allocated"
                  value={
                    dashboard.under_allocated
                  }
                  className="legend-yellow"
                />

                <LegendRow
                  label="Over Allocated"
                  value={
                    dashboard.over_allocated
                  }
                  className="legend-purple"
                />

              </div>

            </div>

          </motion.div>

        </section>


        {/* ==================================================
            UTILIZATION + AI
        ================================================== */}

        <section className="dashboard-grid">

          <motion.div
            className="dashboard-card chart-card"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.35,
            }}
          >

            <div className="card-header">

              <div>
                <h3>
                  Resource Utilization
                </h3>

                <p>
                  Current utilization classification.
                </p>
              </div>

              <Cpu size={20} />

            </div>

            <div className="chart-layout">

              <div className="donut-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <PieChart>

                    <Pie
                      data={utilizationData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      animationDuration={1000}
                    >
                      <Cell fill="#06b6d4" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        background:
                          "#0b1728",
                        border:
                          "1px solid #263a59",
                        borderRadius:
                          "10px",
                      }}
                    />

                  </PieChart>
                </ResponsiveContainer>

              </div>

              <div className="chart-legend">

                <LegendRow
                  label="Properly Utilized"
                  value={
                    dashboard.properly_utilized
                  }
                  className="legend-cyan"
                />

                <LegendRow
                  label="Under Utilized"
                  value={
                    dashboard.under_utilized
                  }
                  className="legend-yellow"
                />

                <LegendRow
                  label="Over Utilized"
                  value={
                    dashboard.over_utilized
                  }
                  className="legend-red"
                />

              </div>

            </div>

          </motion.div>


          {/* AI INSIGHT */}

          <motion.div
            className="dashboard-card ai-card"
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.45,
            }}
          >

            <div className="ai-card-glow" />

            <div className="ai-icon">
              <BrainCircuit size={24} />
            </div>

            <span className="ai-label">
              AI INFRASTRUCTURE INTELLIGENCE
            </span>

            <h3>
              Your infrastructure
              is being monitored.
            </h3>

            <p>
              {operations.high_risk_servers == null
                ? "Health risk scoring is not exposed by the current backend. "
                : `${operations.high_risk_servers} servers are currently classified as high risk. `}
              There are {operations.open_alerts} open infrastructure alerts requiring attention.
            </p>

            <div className="ai-insight-list">

              <div>
                <span className="insight-dot red" />
                <span>
                  {operations.critical_alerts}
                  {" "}critical alerts
                </span>
              </div>

              <div>
                <span className="insight-dot yellow" />
                <span>
                  {operations.pending_requests}
                  {" "}pending requests
                </span>
              </div>

              <div>
                <span className="insight-dot blue" />
                <span>
                  {operations.pending_golden_proposals}
                  {" "}Golden Config proposals
                </span>
              </div>

            </div>

            <button
              type="button"
              className="ai-button"
              onClick={() => navigate("/admin/ai-assistant")}
            >
              Open AI Assistant
              <ArrowUpRight size={17} />
            </button>

          </motion.div>

        </section>


        {/* ==================================================
            ALLOCATION / UTILIZATION DETAILS
        ================================================== */}

        <section className="dashboard-card">

          <div className="card-header">

            <div>
              <h3>
                Infrastructure Classification
              </h3>

              <p>
                Current allocation and utilization
                distribution.
              </p>
            </div>

            <BarSummary
              total={dashboard.total_servers}
            />

          </div>

          <div className="classification-grid">

            <ClassificationCard
              title="Properly Allocated"
              value={
                dashboard.properly_allocated
              }
              icon={CheckCircle2}
              type="green"
            />

            <ClassificationCard
              title="Under Allocated"
              value={
                dashboard.under_allocated
              }
              icon={TriangleAlert}
              type="yellow"
            />

            <ClassificationCard
              title="Over Allocated"
              value={
                dashboard.over_allocated
              }
              icon={Database}
              type="purple"
            />

            <ClassificationCard
              title="Properly Utilized"
              value={
                dashboard.properly_utilized
              }
              icon={Activity}
              type="cyan"
            />

            <ClassificationCard
              title="Under Utilized"
              value={
                dashboard.under_utilized
              }
              icon={MemoryStick}
              type="yellow"
            />

            <ClassificationCard
              title="Over Utilized"
              value={
                dashboard.over_utilized
              }
              icon={Cpu}
              type="red"
            />

          </div>

        </section>


        {/* ==================================================
            OPERATIONS
        ================================================== */}

        <section className="dashboard-card operations-card">

          <div className="card-header">

            <div>
              <h3>
                Operations Overview
              </h3>

              <p>
                Current administrative workload.
              </p>
            </div>

            <Activity size={20} />

          </div>

          <div className="operations-grid">

            <OperationItem
              label="Pending Requests"
              value={
                operations.pending_requests
              }
              icon={ClipboardIcon}
            />

            <OperationItem
              label="Active Scheduled Jobs"
              value={
                operations.active_scheduled_jobs
              }
              icon={Activity}
            />

            <OperationItem
              label="Golden Config Proposals"
              value={
                operations.pending_golden_proposals
              }
              icon={ShieldCheck}
            />

            <OperationItem
              label="Critical Alerts"
              value={
                operations.critical_alerts
              }
              icon={AlertTriangle}
            />

          </div>

        </section>

      </main>
    </div>
  );
}


/* ============================================================
   COMPONENTS
============================================================ */

function AnimatedStatCard({
  title,
  value,
  icon: Icon,
  index,
  suffix,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  index: number;
  suffix?: string;
}) {
  return (
    <motion.div
      className="stat-card"
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.08,
      }}
      whileHover={{
        y: -5,
      }}
    >

      <div className="stat-card-top">

        <div className="stat-icon">
          <Icon size={19} />
        </div>

        <ArrowUpRight size={17} />

      </div>

      <motion.div
        className="stat-value"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
      >
        {value.toLocaleString()}
      </motion.div>

      <div className="stat-title">
        {title}
      </div>

      {suffix && (
        <div className="stat-change">
          {suffix}
        </div>
      )}

    </motion.div>
  );
}


function MiniStat({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
}) {
  return (
    <motion.div
      className="mini-stat-card"
      whileHover={{
        y: -3,
      }}
    >
      <div className="mini-stat-icon">
        <Icon size={17} />
      </div>

      <div>
        <strong>
          {value.toLocaleString()}
        </strong>

        <span>
          {title}
        </span>
      </div>
    </motion.div>
  );
}


function LegendRow({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="legend-row">

      <span
        className={`legend-dot ${className}`}
      />

      <span className="legend-label">
        {label}
      </span>

      <strong>
        {value.toLocaleString()}
      </strong>

    </div>
  );
}


function ClassificationCard({
  title,
  value,
  icon: Icon,
  type,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  type:
    | "green"
    | "yellow"
    | "purple"
    | "cyan"
    | "red";
}) {
  return (
    <motion.div
      className={`classification-card ${type}`}
      whileHover={{
        y: -3,
      }}
    >

      <div className="classification-icon">
        <Icon size={18} />
      </div>

      <div>
        <strong>
          {value.toLocaleString()}
        </strong>

        <span>
          {title}
        </span>
      </div>

    </motion.div>
  );
}


function OperationItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <div className="operation-item">

      <div className="operation-icon">
        <Icon size={18} />
      </div>

      <div>
        <strong>
          {value.toLocaleString()}
        </strong>

        <span>
          {label}
        </span>
      </div>

    </div>
  );
}


function BarSummary({
  total,
}: {
  total: number;
}) {
  return (
    <div className="bar-summary">
      <span>
        {total.toLocaleString()} servers
      </span>
    </div>
  );
}


function ClipboardIcon({
  size,
}: {
  size?: number;
}) {
  return (
    <FileWarning size={size} />
  );
}

export default AdminDashboard;