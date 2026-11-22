import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  RefreshCw,
  Server,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Cpu,
  HardDrive,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

interface AnalyticsData {
  total_servers?: number;
  compliant_servers?: number;
  non_compliant_servers?: number;

  average_cpu_utilization?: number;
  average_memory_utilization?: number;
  average_disk_utilization?: number;

  over_allocated?: number;
  under_allocated?: number;

  properly_allocated?: number;
  properly_utilized?: number;

  over_utilized?: number;
  under_utilized?: number;
}

function Analytics() {
  const { user } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === "ADMIN";

  const [data, setData] =
    useState<AnalyticsData>({});

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadAnalytics = async () => {
    try {
      setError("");

      const response =
        await api.get("/analytics/summary");

      setData(response.data || {});
    } catch (err) {
      console.error(
        "Failed to load analytics:",
        err
      );

      setError(
        "Unable to load infrastructure analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const cpu = Number(
    data.average_cpu_utilization || 0
  );

  const memory = Number(
    data.average_memory_utilization || 0
  );

  const disk = Number(
    data.average_disk_utilization || 0
  );

  const totalServers =
    Number(data.total_servers || 0);

  const compliant =
    Number(data.compliant_servers || 0);

  const nonCompliant =
    Number(data.non_compliant_servers || 0);

  const complianceRate =
    totalServers > 0
      ? Math.round(
          (compliant / totalServers) * 100
        )
      : 0;

  return (
    <div className="app-shell">
      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active="Analytics"
      />

      <main className="main-content">

        {/* HEADER */}

        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              {isAdmin
                ? "COMMAND CENTER"
                : "WORKSPACE"}
            </div>

            <h1>
              Infrastructure Analytics
            </h1>

            <p>
              Analyze infrastructure utilization,
              compliance and resource allocation
              across your environment.
            </p>
          </div>

          <motion.button
            type="button"
            className="secondary-button"
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
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
          </motion.button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="analytics-error">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="analytics-empty">
            <div className="loading-spinner" />

            <span>
              Loading analytics...
            </span>
          </div>
        ) : (
          <>
            {/* KPI CARDS */}

            <div className="analytics-kpi-grid">

              <motion.div
                className="analytics-kpi-card"
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                <div className="analytics-kpi-icon">
                  <Server size={20} />
                </div>

                <div>
                  <span>
                    Total Servers
                  </span>

                  <strong>
                    {totalServers}
                  </strong>
                </div>
              </motion.div>

              <motion.div
                className="analytics-kpi-card success"
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
                <div className="analytics-kpi-icon success">
                  <CheckCircle2 size={20} />
                </div>

                <div>
                  <span>
                    Compliant
                  </span>

                  <strong>
                    {compliant}
                  </strong>
                </div>
              </motion.div>

              <motion.div
                className="analytics-kpi-card danger"
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
                <div className="analytics-kpi-icon danger">
                  <ShieldAlert size={20} />
                </div>

                <div>
                  <span>
                    Non-Compliant
                  </span>

                  <strong>
                    {nonCompliant}
                  </strong>
                </div>
              </motion.div>

              <motion.div
                className="analytics-kpi-card"
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
                <div className="analytics-kpi-icon">
                  <BarChart3 size={20} />
                </div>

                <div>
                  <span>
                    Compliance Rate
                  </span>

                  <strong>
                    {complianceRate}%
                  </strong>
                </div>
              </motion.div>

            </div>

            {/* MAIN ANALYTICS */}

            <div className="analytics-grid">

              {/* UTILIZATION */}

              <motion.div
                className="analytics-card"
                initial={{
                  opacity: 0,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
              >
                <div className="section-label">
                  RESOURCE UTILIZATION
                </div>

                <h2>
                  Average Utilization
                </h2>

                <div className="analytics-resource-row">

                  <div className="analytics-resource-title">
                    <Cpu size={18} />
                    <span>CPU</span>
                  </div>

                  <div className="analytics-resource-bar">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${Math.min(
                          cpu,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {cpu}%
                  </strong>

                </div>

                <div className="analytics-resource-row">

                  <div className="analytics-resource-title">
                    <Activity size={18} />
                    <span>Memory</span>
                  </div>

                  <div className="analytics-resource-bar">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${Math.min(
                          memory,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {memory}%
                  </strong>

                </div>

                <div className="analytics-resource-row">

                  <div className="analytics-resource-title">
                    <HardDrive size={18} />
                    <span>Disk</span>
                  </div>

                  <div className="analytics-resource-bar">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${Math.min(
                          disk,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {disk}%
                  </strong>

                </div>
              </motion.div>

              {/* ALLOCATION */}

              <motion.div
                className="analytics-card"
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
                <div className="section-label">
                  RESOURCE ALLOCATION
                </div>

                <h2>
                  Allocation Overview
                </h2>

                <div className="analytics-stat-row">

                  <div className="analytics-stat-label">
                    <CheckCircle2
                      size={17}
                    />

                    <span>
                      Properly Allocated
                    </span>
                  </div>

                  <strong>
                    {data.properly_allocated ??
                      0}
                  </strong>

                </div>

                <div className="analytics-stat-row">

                  <div className="analytics-stat-label">
                    <TrendingUp
                      size={17}
                    />

                    <span>
                      Over Allocated
                    </span>
                  </div>

                  <strong>
                    {data.over_allocated ??
                      0}
                  </strong>

                </div>

                <div className="analytics-stat-row">

                  <div className="analytics-stat-label">
                    <TrendingDown
                      size={17}
                    />

                    <span>
                      Under Allocated
                    </span>
                  </div>

                  <strong>
                    {data.under_allocated ??
                      0}
                  </strong>

                </div>
              </motion.div>

            </div>

            {/* UTILIZATION STATUS */}

            <motion.div
              className="analytics-card analytics-utilization-card"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              <div className="section-label">
                UTILIZATION STATUS
              </div>

              <h2>
                Infrastructure Utilization
              </h2>

              <div className="analytics-status-grid">

                <div className="analytics-status-item">
                  <CheckCircle2
                    size={20}
                  />

                  <span>
                    Properly Utilized
                  </span>

                  <strong>
                    {data.properly_utilized ??
                      0}
                  </strong>
                </div>

                <div className="analytics-status-item warning">
                  <TrendingDown
                    size={20}
                  />

                  <span>
                    Under Utilized
                  </span>

                  <strong>
                    {data.under_utilized ??
                      0}
                  </strong>
                </div>

                <div className="analytics-status-item danger">
                  <TrendingUp
                    size={20}
                  />

                  <span>
                    Over Utilized
                  </span>

                  <strong>
                    {data.over_utilized ??
                      0}
                  </strong>
                </div>

              </div>
            </motion.div>
          </>
        )}

      </main>
    </div>
  );
}

export default Analytics;