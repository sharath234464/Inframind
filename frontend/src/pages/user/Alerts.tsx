import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import { getFirstAvailable } from "../../services/endpointFallback";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

interface AlertRecord {
  alert_id?: string;
  server_id?: string;
  alert_type?: string;
  severity?: string;
  status?: string;
  message?: string;
  created_at?: string;
}

function Alerts() {
  const { user } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === "ADMIN";

  const [alerts, setAlerts] = useState<
    AlertRecord[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [error, setError] =
    useState("");

  const loadAlerts = async () => {
    try {
      setError("");

      const data = await getFirstAvailable<any>([
        "/policies/alerts",
        "/alerts",
      ]);

      if (Array.isArray(data)) {
        setAlerts(data);
      } else if (Array.isArray(data?.data)) {
        setAlerts(data.data);
      } else if (
        Array.isArray(data?.alerts)
      ) {
        setAlerts(data.alerts);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error(
        "Failed to load alerts:",
        err
      );

      setError(
        "Unable to load infrastructure alerts."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const searchValue =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        [
          alert.alert_id,
          alert.server_id,
          alert.alert_type,
          alert.severity,
          alert.status,
          alert.message,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(searchValue)
          );

      const matchesStatus =
        statusFilter === "ALL" ||
        String(alert.status || "")
          .toUpperCase() === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [alerts, search, statusFilter]);

  const totalAlerts =
    alerts.length;

  const openAlerts =
    alerts.filter(
      (alert) =>
        String(alert.status || "")
          .toUpperCase() === "OPEN"
    ).length;

  const criticalAlerts =
    alerts.filter(
      (alert) =>
        String(alert.severity || "")
          .toUpperCase() === "CRITICAL"
    ).length;

  const resolvedAlerts =
    alerts.filter(
      (alert) =>
        String(alert.status || "")
          .toUpperCase() === "RESOLVED"
    ).length;

  const handleRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const getSeverityClass = (
    severity?: string
  ) => {
    const value =
      String(severity || "").toUpperCase();

    if (value === "CRITICAL") {
      return "critical";
    }

    if (value === "HIGH") {
      return "high";
    }

    if (value === "MEDIUM") {
      return "medium";
    }

    return "low";
  };

  const getStatusClass = (
    status?: string
  ) => {
    const value =
      String(status || "").toUpperCase();

    if (value === "OPEN") {
      return "open";
    }

    if (value === "RESOLVED") {
      return "resolved";
    }

    return "other";
  };

  const formatDate = (
    value?: string
  ) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  return (
    <div className="app-shell">
      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active="Alerts"
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
              Infrastructure Alerts
            </h1>

            <p>
              Monitor infrastructure events,
              risks and policy violations
              across your environment.
            </p>
          </div>

          <motion.button
            type="button"
            className="secondary-button"
            onClick={handleRefresh}
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
          <div className="alerts-error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* KPI CARDS */}

        <div className="alerts-kpi-grid">
          <motion.div
            className="alerts-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <div className="alerts-kpi-icon">
              <AlertTriangle size={20} />
            </div>

            <div>
              <span>Total Alerts</span>
              <strong>
                {totalAlerts}
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="alerts-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{ delay: 0.05 }}
          >
            <div className="alerts-kpi-icon warning">
              <Clock3 size={20} />
            </div>

            <div>
              <span>Open Alerts</span>
              <strong>
                {openAlerts}
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="alerts-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{ delay: 0.1 }}
          >
            <div className="alerts-kpi-icon danger">
              <ShieldAlert size={20} />
            </div>

            <div>
              <span>Critical</span>
              <strong>
                {criticalAlerts}
              </strong>
            </div>
          </motion.div>

          <motion.div
            className="alerts-kpi-card"
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{ delay: 0.15 }}
          >
            <div className="alerts-kpi-icon success">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Resolved</span>
              <strong>
                {resolvedAlerts}
              </strong>
            </div>
          </motion.div>
        </div>

        {/* ALERT TABLE */}

        <div className="alerts-panel">
          <div className="alerts-panel-header">
            <div>
              <div className="section-label">
                ALERT CENTER
              </div>

              <h2>
                Infrastructure Events
              </h2>
            </div>

            <div className="alerts-controls">
              <div className="alerts-search">
                <Search size={17} />

                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>

              <select
                className="alerts-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="OPEN">
                  Open
                </option>

                <option value="RESOLVED">
                  Resolved
                </option>

                <option value="CLOSED">
                  Closed
                </option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="alerts-empty">
              <div className="loading-spinner" />

              <span>
                Loading alerts...
              </span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="alerts-empty">
              <XCircle size={30} />

              <strong>
                No alerts found
              </strong>

              <span>
                There are no alerts matching
                the current filters.
              </span>
            </div>
          ) : (
            <div className="alerts-table-wrapper">
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th>Alert ID</th>
                    <th>Server</th>
                    <th>Alert Type</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAlerts.map(
                    (alert, index) => (
                      <motion.tr
                        key={
                          alert.alert_id ||
                          `${alert.server_id}-${index}`
                        }
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        transition={{
                          delay:
                            index * 0.03,
                        }}
                      >
                        <td>
                          <div className="alert-id-cell">
                            <AlertTriangle
                              size={15}
                            />

                            <strong>
                              {alert.alert_id ||
                                "—"}
                            </strong>
                          </div>
                        </td>

                        <td>
                          {alert.server_id ||
                            "—"}
                        </td>

                        <td>
                          {alert.alert_type ||
                            alert.message ||
                            "Infrastructure Alert"}
                        </td>

                        <td>
                          <span
                            className={`alert-severity ${getSeverityClass(
                              alert.severity
                            )}`}
                          >
                            {alert.severity ||
                              "LOW"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`alert-status ${getStatusClass(
                              alert.status
                            )}`}
                          >
                            {alert.status ||
                              "UNKNOWN"}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            alert.created_at
                          )}
                        </td>
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

export default Alerts;