import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  Search,
  ShieldAlert,
  Server,
  TrendingDown,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

interface HealthRecord {
  server_id: string;
  health_score: number;
  risk_level: string;
  cpu_utilization?: number;
  memory_utilization?: number;
  disk_utilization?: number;
  compliance_status?: string;
  classification?: string;
}

function Health() {
  const { user } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === "ADMIN";

  const [healthData, setHealthData] =
    useState<HealthRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const loadHealthData = async () => {
    try {
      setError("");

      const response =
        await api.get("/health");

      const data = response.data;

      if (Array.isArray(data)) {
        setHealthData(data);
      } else if (
        Array.isArray(data?.data)
      ) {
        setHealthData(data.data);
      } else if (
        Array.isArray(data?.health_scores)
      ) {
        setHealthData(
          data.health_scores
        );
      } else {
        setHealthData([]);
      }
    } catch (err) {
      console.error(
        "Failed to load health data:",
        err
      );

      setError(
        "Unable to load infrastructure health data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const filteredData = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return healthData;
    }

    return healthData.filter(
      (server) =>
        [
          server.server_id,
          server.risk_level,
          server.compliance_status,
          server.classification,
        ]
          .filter(Boolean)
          .some((field) =>
            String(field)
              .toLowerCase()
              .includes(value)
          )
    );
  }, [healthData, search]);

  const totalServers =
    healthData.length;

  const healthyServers =
    healthData.filter(
      (server) =>
        Number(server.health_score) >= 80
    ).length;

  const mediumRiskServers =
    healthData.filter(
      (server) =>
        Number(server.health_score) >= 60 &&
        Number(server.health_score) < 80
    ).length;

  const highRiskServers =
    healthData.filter(
      (server) =>
        Number(server.health_score) >= 40 &&
        Number(server.health_score) < 60
    ).length;

  const criticalServers =
    healthData.filter(
      (server) =>
        Number(server.health_score) < 40
    ).length;

  const averageHealth =
    totalServers > 0
      ? Math.round(
          healthData.reduce(
            (sum, server) =>
              sum +
              Number(
                server.health_score || 0
              ),
            0
          ) / totalServers
        )
      : 0;

  const handleRefresh = () => {
    setRefreshing(true);
    loadHealthData();
  };

  const getRiskClass = (
    risk?: string,
    score?: number
  ) => {
    const value =
      risk?.toUpperCase();

    if (
      value === "CRITICAL" ||
      Number(score) < 40
    ) {
      return "critical";
    }

    if (
      value === "HIGH" ||
      Number(score) < 60
    ) {
      return "high";
    }

    if (
      value === "MEDIUM" ||
      Number(score) < 80
    ) {
      return "medium";
    }

    return "low";
  };

  const getRiskLabel = (
    risk?: string,
    score?: number
  ) => {
    if (risk) {
      return risk;
    }

    const numericScore =
      Number(score || 0);

    if (numericScore >= 80) {
      return "LOW";
    }

    if (numericScore >= 60) {
      return "MEDIUM";
    }

    if (numericScore >= 40) {
      return "HIGH";
    }

    return "CRITICAL";
  };

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <Sidebar
        role={
          isAdmin
            ? "admin"
            : "user"
        }
        active="Health"
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
              Infrastructure Health
            </h1>

            <p>
              Monitor infrastructure health,
              risk levels and resource conditions
              across your environment.
            </p>

          </div>

          <motion.button
            type="button"
            className="secondary-button"
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.97,
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
          </motion.button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="health-error">
            <AlertTriangle size={18} />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* KPI CARDS */}

        <div className="health-kpi-grid">

          <motion.div
            className="health-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <div className="health-kpi-icon">
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
            className="health-kpi-card"
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
            <div className="health-kpi-icon healthy">
              <CheckCircle2
                size={20}
              />
            </div>

            <div>
              <span>
                Healthy
              </span>

              <strong>
                {healthyServers}
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="health-kpi-card"
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
            <div className="health-kpi-icon warning">
              <HeartPulse
                size={20}
              />
            </div>

            <div>
              <span>
                Medium Risk
              </span>

              <strong>
                {mediumRiskServers}
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="health-kpi-card"
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
            <div className="health-kpi-icon danger">
              <ShieldAlert
                size={20}
              />
            </div>

            <div>
              <span>
                High / Critical
              </span>

              <strong>
                {highRiskServers +
                  criticalServers}
              </strong>
            </div>
          </motion.div>

        </div>

        {/* HEALTH SUMMARY */}

        <div className="health-summary-panel">

          <div className="health-summary-left">

            <div className="section-label">
              OVERALL HEALTH
            </div>

            <div className="health-score-large">
              {averageHealth}
              <span>
                /100
              </span>
            </div>

            <p>
              Average infrastructure health
              score across monitored servers.
            </p>

          </div>

          <div className="health-summary-bars">

            <div className="health-bar-row">

              <div>
                <span>
                  Healthy
                </span>

                <strong>
                  {healthyServers}
                </strong>
              </div>

              <div className="health-bar">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width:
                      totalServers > 0
                        ? `${
                            (healthyServers /
                              totalServers) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>

            </div>

            <div className="health-bar-row">

              <div>
                <span>
                  Medium Risk
                </span>

                <strong>
                  {mediumRiskServers}
                </strong>
              </div>

              <div className="health-bar">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width:
                      totalServers > 0
                        ? `${
                            (mediumRiskServers /
                              totalServers) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>

            </div>

            <div className="health-bar-row">

              <div>
                <span>
                  High Risk
                </span>

                <strong>
                  {highRiskServers}
                </strong>
              </div>

              <div className="health-bar">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width:
                      totalServers > 0
                        ? `${
                            (highRiskServers /
                              totalServers) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>

            </div>

            <div className="health-bar-row">

              <div>
                <span>
                  Critical
                </span>

                <strong>
                  {criticalServers}
                </strong>
              </div>

              <div className="health-bar">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width:
                      totalServers > 0
                        ? `${
                            (criticalServers /
                              totalServers) *
                            100
                          }%`
                        : "0%",
                  }}
                />
              </div>

            </div>

          </div>
        </div>

        {/* SERVER HEALTH TABLE */}

        <div className="health-table-panel">

          <div className="health-table-header">

            <div>
              <div className="section-label">
                SERVER HEALTH
              </div>

              <h2>
                Infrastructure Risk Overview
              </h2>
            </div>

            <div className="health-search">

              <Search size={17} />

              <input
                type="text"
                placeholder="Search servers..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

            </div>

          </div>

          {loading ? (
            <div className="health-empty">

              <div className="loading-spinner" />

              <span>
                Loading health data...
              </span>

            </div>
          ) : filteredData.length === 0 ? (
            <div className="health-empty">

              <TrendingDown
                size={28}
              />

              <strong>
                No health records found
              </strong>

              <span>
                Health information will appear
                here when server analysis is
                available.
              </span>

            </div>
          ) : (
            <div className="health-table-wrapper">

              <table className="health-table">

                <thead>
                  <tr>
                    <th>
                      Server
                    </th>

                    <th>
                      Health Score
                    </th>

                    <th>
                      Risk Level
                    </th>

                    <th>
                      CPU
                    </th>

                    <th>
                      Memory
                    </th>

                    <th>
                      Disk
                    </th>

                    <th>
                      Compliance
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredData.map(
                    (
                      server,
                      index
                    ) => {

                      const score =
                        Number(
                          server.health_score ||
                            0
                        );

                      const riskClass =
                        getRiskClass(
                          server.risk_level,
                          score
                        );

                      const riskLabel =
                        getRiskLabel(
                          server.risk_level,
                          score
                        );

                      return (
                        <motion.tr
                          key={
                            server.server_id
                          }
                          initial={{
                            opacity: 0,
                          }}
                          animate={{
                            opacity: 1,
                          }}
                          transition={{
                            delay:
                              index *
                              0.03,
                          }}
                        >

                          <td>

                            <div className="health-server">

                              <div className="server-icon">
                                <Server
                                  size={16}
                                />
                              </div>

                              <strong>
                                {
                                  server.server_id
                                }
                              </strong>

                            </div>

                          </td>

                          <td>

                            <div className="health-score">

                              <strong>
                                {score}
                              </strong>

                              <span>
                                /100
                              </span>

                            </div>

                          </td>

                          <td>

                            <span
                              className={`risk-badge ${riskClass}`}
                            >
                              {riskLabel}
                            </span>

                          </td>

                          <td>
                            {server.cpu_utilization !=
                            null
                              ? `${server.cpu_utilization}%`
                              : "—"}
                          </td>

                          <td>
                            {server.memory_utilization !=
                            null
                              ? `${server.memory_utilization}%`
                              : "—"}
                          </td>

                          <td>
                            {server.disk_utilization !=
                            null
                              ? `${server.disk_utilization}%`
                              : "—"}
                          </td>

                          <td>

                            <span
                              className={`compliance-badge ${
                                String(
                                  server.compliance_status ||
                                    ""
                                ).toLowerCase() ===
                                "compliant"
                                  ? "compliant"
                                  : "review"
                              }`}
                            >
                              {server.compliance_status ||
                                "Review"}
                            </span>

                          </td>

                        </motion.tr>
                      );
                    }
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

export default Health;