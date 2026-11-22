import { useEffect, useState } from "react";
import {
  History,
  RefreshCw,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";

import { getFirstAvailable } from "../../services/endpointFallback";
import Sidebar from "../../components/layout/Sidebar";

interface AuditRecord {
  audit_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  performed_by?: string;
  created_at?: string;
}

function AuditLogs() {
  const [logs, setLogs] =
    useState<AuditRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadLogs = async () => {
    try {
      const data = await getFirstAvailable<any>([
        "/admin/audit-logs",
        "/audit",
      ]);

      if (Array.isArray(data)) {
        setLogs(data);
      } else if (
        Array.isArray(data?.logs)
      ) {
        setLogs(data.logs);
      } else if (
        Array.isArray(data?.data)
      ) {
        setLogs(data.data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error(error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (
    value?: string
  ) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString();
  };

  return (
    <div className="app-shell">
      <Sidebar
        role="admin"
        active="Audit Logs"
      />

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              COMMAND CENTER
            </div>

            <h1>
              Audit Logs
            </h1>

            <p>
              Review administrative actions and
              infrastructure activity history.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadLogs}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="admin-feature-grid">
          <div className="admin-feature-card">
            <History size={22} />
            <span>
              Total Events
            </span>
            <strong>
              {logs.length}
            </strong>
          </div>

          <div className="admin-feature-card">
            <Shield size={22} />
            <span>
              Audit Monitoring
            </span>
            <strong>
              Active
            </strong>
          </div>
        </div>

        <div className="admin-feature-panel">
          <div className="section-label">
            GOVERNANCE
          </div>

          <h2>
            Activity History
          </h2>

          {loading ? (
            <div className="admin-feature-empty">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="admin-feature-empty">
              <History size={30} />

              <strong>
                No audit events
              </strong>

              <span>
                Administrative activity will
                appear here.
              </span>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-feature-table">
                <thead>
                  <tr>
                    <th>Audit ID</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Entity ID</th>
                    <th>Performed By</th>
                    <th>Time</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map(
                    (log, index) => (
                      <motion.tr
                        key={
                          log.audit_id ||
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
                          {log.audit_id ||
                            "—"}
                        </td>

                        <td>
                          {log.action ||
                            "—"}
                        </td>

                        <td>
                          {log.entity_type ||
                            "—"}
                        </td>

                        <td>
                          {log.entity_id ||
                            "—"}
                        </td>

                        <td>
                          {log.performed_by ||
                            "—"}
                        </td>

                        <td>
                          {formatDate(
                            log.created_at
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

export default AuditLogs;