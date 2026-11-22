import { useEffect, useState } from "react";
import {
  Lightbulb,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Server,
} from "lucide-react";
import { motion } from "framer-motion";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

interface Recommendation {
  recommendation_id?: string;
  server_id?: string;
  server_name?: string;
  title?: string;
  recommendation?: string;
  reason?: string;
  severity?: string;
  priority?: string;
  status?: string;
  created_at?: string;
}

function AIRecommendations() {
  const { user } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === "ADMIN";

  const [recommendations, setRecommendations] =
    useState<Recommendation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [generating, setGenerating] =
    useState(false);

  const loadRecommendations = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/recommendations"
      );

      const data = response.data;

      if (Array.isArray(data)) {
        setRecommendations(data);
      } else if (
        Array.isArray(data?.recommendations)
      ) {
        setRecommendations(
          data.recommendations
        );
      } else if (
        Array.isArray(data?.data)
      ) {
        setRecommendations(data.data);
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error(err);
      setError(
        "Unable to load AI recommendations."
      );
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const generateAIRecommendations = async () => {
    setGenerating(true);
    setError("");

    try {
      await api.post("/recommendations/ai");
      await loadRecommendations();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          "Unable to generate AI recommendations."
      );
    } finally {
      setGenerating(false);
    }
  };

  const criticalCount =
    recommendations.filter(
      (item) =>
        String(
          item.severity ||
            item.priority ||
            ""
        ).toUpperCase() === "CRITICAL"
    ).length;

  const highCount =
    recommendations.filter(
      (item) =>
        String(
          item.severity ||
            item.priority ||
            ""
        ).toUpperCase() === "HIGH"
    ).length;

  return (
    <div className="app-shell">
      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active="AI Recommendations"
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
              AI Recommendations
            </h1>

            <p>
              AI-generated recommendations
              for infrastructure optimization,
              compliance and resource
              management.
            </p>
          </div>

          <div className="page-header-actions">
            {isAdmin && <motion.button
              className="primary-button"
              onClick={generateAIRecommendations}
              disabled={generating}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {generating ? (
                <>
                  <span className="button-spinner" /> Generating...
                </>
              ) : (
                <>
                  <Lightbulb size={17} /> Generate AI Recommendations
                </>
              )}
            </motion.button>}

            <button
              className="secondary-button"
              onClick={loadRecommendations}
              disabled={loading}
            >
              <RefreshCw
                size={17}
                className={loading ? "refresh-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="analysis-error">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        <div className="admin-feature-grid">

          <div className="admin-feature-card">
            <Lightbulb size={22} />

            <span>
              Total Recommendations
            </span>

            <strong>
              {recommendations.length}
            </strong>
          </div>

          <div className="admin-feature-card">
            <AlertTriangle size={22} />

            <span>
              Critical
            </span>

            <strong>
              {criticalCount}
            </strong>
          </div>

          <div className="admin-feature-card">
            <AlertTriangle size={22} />

            <span>
              High Priority
            </span>

            <strong>
              {highCount}
            </strong>
          </div>

          <div className="admin-feature-card">
            <CheckCircle2 size={22} />

            <span>
              Actionable Insights
            </span>

            <strong>
              {recommendations.length}
            </strong>
          </div>

        </div>

        <div className="admin-feature-panel">

          <div className="section-label">
            INTELLIGENCE
          </div>

          <h2>
            Infrastructure Recommendations
          </h2>

          {loading ? (
            <div className="admin-feature-empty">
              Loading AI recommendations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="admin-feature-empty">
              <Lightbulb size={32} />

              <strong>
                No recommendations available
              </strong>

              <span>
                AI recommendations will
                appear here after infrastructure
                analysis.
              </span>
            </div>
          ) : (
            <div className="memory-list">

              {recommendations.map(
                (item, index) => (
                  <motion.div
                    key={
                      item.recommendation_id ||
                      index
                    }
                    className="memory-card"
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                  >

                    <div className="memory-icon">
                      <Lightbulb
                        size={19}
                      />
                    </div>

                    <div className="memory-content">

                      <strong>
                        {item.title ||
                          item.recommendation ||
                          "Infrastructure Recommendation"}
                      </strong>

                      <span>
                        {item.server_name ||
                          item.server_id ||
                          "Infrastructure"}
                      </span>

                      <p>
                        {item.reason ||
                          item.recommendation ||
                          "AI-generated optimization recommendation."}
                      </p>

                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          marginTop: "10px",
                        }}
                      >
                        <span
                          className="admin-status"
                        >
                          {item.priority ||
                            item.severity ||
                            "INFO"}
                        </span>

                        {item.status && (
                          <span
                            className="admin-status"
                          >
                            {item.status}
                          </span>
                        )}
                      </div>

                    </div>

                    <Server size={17} />

                  </motion.div>
                )
              )}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default AIRecommendations;