import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

interface RemediationRecord {
  remediation_id?: string;
  server_id?: string;
  issue?: string;
  reason?: string;
  recommendation?: string;
  status?: string;
  created_at?: string;
}

function Remediation() {
  const { user } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === "ADMIN";

  const [items, setItems] = useState<
    RemediationRecord[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadRemediation = async () => {
    try {
      setError("");

      const response =
        await api.get("/remediation");

      const data = response.data;

      if (Array.isArray(data)) {
        setItems(data);
      } else if (Array.isArray(data?.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load remediation plans."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRemediation();
  }, []);

  const pending =
    items.filter(
      (item) =>
        String(item.status || "")
          .toUpperCase() === "PENDING"
    ).length;

  const completed =
    items.filter(
      (item) =>
        String(item.status || "")
          .toUpperCase() === "COMPLETED"
    ).length;

  const active =
    items.filter(
      (item) =>
        !["COMPLETED", "CANCELLED"].includes(
          String(item.status || "").toUpperCase()
        )
    ).length;

  return (
    <div className="app-shell">
      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active="Remediation"
      />

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              {isAdmin
                ? "COMMAND CENTER"
                : "WORKSPACE"}
            </div>

            <h1>Remediation</h1>

            <p>
              Review infrastructure remediation
              plans and recommended corrective
              actions.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() => {
              setRefreshing(true);
              loadRemediation();
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

        {error && (
          <div className="remediation-error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div className="remediation-kpi-grid">
          <div className="remediation-kpi-card">
            <Wrench size={20} />
            <span>Total Plans</span>
            <strong>
              {items.length}
            </strong>
          </div>

          <div className="remediation-kpi-card warning">
            <Clock3 size={20} />
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>

          <div className="remediation-kpi-card">
            <ShieldAlert size={20} />
            <span>Active</span>
            <strong>{active}</strong>
          </div>

          <div className="remediation-kpi-card success">
            <CheckCircle2 size={20} />
            <span>Completed</span>
            <strong>{completed}</strong>
          </div>
        </div>

        <div className="remediation-panel">
          <div className="section-label">
            REMEDIATION PLANS
          </div>

          <h2>
            Recommended Infrastructure Actions
          </h2>

          {loading ? (
            <div className="remediation-empty">
              Loading remediation plans...
            </div>
          ) : items.length === 0 ? (
            <div className="remediation-empty">
              <Wrench size={30} />

              <strong>
                No remediation plans
              </strong>

              <span>
                Remediation plans will appear
                when infrastructure issues require
                corrective action.
              </span>
            </div>
          ) : (
            <div className="remediation-list">
              {items.map((item, index) => (
                <motion.div
                  className="remediation-item"
                  key={
                    item.remediation_id ||
                    index
                  }
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  <div className="remediation-item-icon">
                    <Wrench size={18} />
                  </div>

                  <div className="remediation-item-content">
                    <strong>
                      {item.remediation_id ||
                        "Remediation Plan"}
                    </strong>

                    <span>
                      Server:{" "}
                      {item.server_id ||
                        "Unknown"}
                    </span>

                    <p>
                      {item.recommendation ||
                        item.reason ||
                        item.issue ||
                        "Infrastructure corrective action required."}
                    </p>
                  </div>

                  <span className="remediation-status">
                    {item.status ||
                      "PENDING"}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Remediation;