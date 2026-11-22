import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Server,
  ShieldAlert
} from "lucide-react";

import { motion } from "framer-motion";

import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";


interface AnalysisResult {
  total_servers: number;
  compared_servers: number;
  has_comparison: boolean;

  compliant: number;
  non_compliant: number | null;

  properly_allocated: number;
  over_allocated: number;
  under_allocated: number;

  properly_utilized: number;
  over_utilized: number;
  under_utilized: number;
}


// ======================================================
// ERROR EXTRACTION
// ======================================================

function extractError(error: any): string {

  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((entry: any) => entry?.msg || "Invalid request")
      .join("; ");
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unknown API error."
  );
}


// ======================================================
// DASHBOARD DATA MAPPING
// ======================================================

function mapDashboard(data: any): AnalysisResult {

  const properlyAllocated = Number(
    data?.properly_allocated || 0
  );

  const overAllocated = Number(
    data?.over_allocated || 0
  );

  const underAllocated = Number(
    data?.under_allocated || 0
  );

  const compared =
    properlyAllocated +
    overAllocated +
    underAllocated;

  const compliant = Number(
    data?.compliant || 0
  );

  return {
    total_servers: Number(
      data?.total_servers || 0
    ),

    compared_servers: compared,

    has_comparison: compared > 0,

    compliant,

    non_compliant:
      compared > 0
        ? Math.max(0, compared - compliant)
        : null,

    properly_allocated: properlyAllocated,
    over_allocated: overAllocated,
    under_allocated: underAllocated,

    properly_utilized: Number(
      data?.properly_utilized || 0
    ),

    over_utilized: Number(
      data?.over_utilized || 0
    ),

    under_utilized: Number(
      data?.under_utilized || 0
    )
  };
}


// ======================================================
// MAIN COMPONENT
// ======================================================

export default function Analysis() {

  const { user } = useAuth();

  const isAdmin =
    user?.role?.toUpperCase() === "ADMIN";

  const [result, setResult] =
    useState<AnalysisResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [stageMessage, setStageMessage] =
    useState("");


  // ====================================================
  // LOAD DASHBOARD
  // ====================================================

  const loadDashboard = useCallback(
    async () => {

      const response = await api.get(
        "/dashboard"
      );

      const mapped = mapDashboard(
        response.data
      );

      setResult(mapped);

      return mapped;
    },
    []
  );


  useEffect(() => {

    void loadDashboard().catch((err) => {

      console.error(
        "Dashboard load failed:",
        err
      );

      setError(
        `Could not load analysis summary: ${extractError(err)}`
      );

    });

  }, [loadDashboard]);


  // ====================================================
  // REFRESH
  // ====================================================

  const refresh = async () => {

    setRefreshing(true);
    setError("");

    try {

      await loadDashboard();

    } catch (err) {

      setError(
        `Refresh failed: ${extractError(err)}`
      );

    } finally {

      setRefreshing(false);
    }
  };


  // ====================================================
  // RUN COMPARISON + AI ANALYSIS
  // ====================================================

  const runAnalysis = async () => {

    if (!isAdmin || loading) {
      return;
    }

    setLoading(true);
    setError("");

    setStageMessage(
      "Comparing inventory against active Golden Configuration baselines..."
    );

    try {

      // STEP 1: DETERMINISTIC COMPARISON

      const comparisonResponse = await api.post(
        "/comparison/run"
      );

      const compared = Number(
        comparisonResponse.data?.compared_servers || 0
      );

      if (
        comparisonResponse.data?.status === false ||
        compared <= 0
      ) {
        throw new Error(
          comparisonResponse.data?.message ||
          "Comparison returned zero servers."
        );
      }

      setStageMessage(
        `Comparison completed for ${compared} servers. Running the LangGraph AI workflow...`
      );

      await loadDashboard();

      // STEP 2: LANGGRAPH AI ANALYSIS

      try {

        const aiResponse = await api.post(
          "/analysis/generate"
        );

        const ai = aiResponse.data || {};

        const completed = Number(
          ai.completed || 0
        );

        const skipped = Number(
          ai.skipped || 0
        );

        const failed = Number(
          ai.failed || 0
        );

        const saved = Number(
          ai.recommendations_saved || 0
        );

        setStageMessage(
          `Comparison: ${compared} servers. AI workflow: ${completed} completed, ${skipped} skipped, ${failed} failed. Recommendations saved: ${saved}.`
        );

        if (failed > 0) {

          setError(
            `Comparison succeeded, but ${failed} AI task(s) failed. Check OPENAI_API_KEY, model access, quota and the backend terminal.`
          );
        }

      } catch (aiError) {

        console.error(
          "AI analysis stage failed:",
          aiError
        );

        setError(
          `Comparison succeeded for ${compared} servers, but AI analysis failed: ${extractError(aiError)}`
        );
      }

      // STEP 3: REFRESH FINAL RESULTS

      await loadDashboard();

    } catch (comparisonError) {

      console.error(
        "Infrastructure comparison failed:",
        comparisonError
      );

      setError(
        `Infrastructure comparison failed: ${extractError(comparisonError)}`
      );

      setStageMessage("");

    } finally {

      setLoading(false);
    }
  };


  // ====================================================
  // UI
  // ====================================================

  return (

    <div className="app-shell">

      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active="Analysis"
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
              Infrastructure Analysis
            </h1>

            <p>
              Compare infrastructure resources
              against approved Golden Configuration standards.
            </p>

          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap"
            }}
          >

            <button
              type="button"
              className="secondary-button"
              onClick={() => void refresh()}
              disabled={refreshing || loading}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "refresh-spin" : ""
                }
              />

              Refresh
            </button>

            {isAdmin ? (

              <motion.button
                type="button"
                className="primary-button"
                onClick={() => void runAnalysis()}
                disabled={loading}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <RefreshCw
                  size={17}
                  className={
                    loading ? "refresh-spin" : ""
                  }
                />

                {loading
                  ? "Analyzing..."
                  : "Run Analysis"}

              </motion.button>

            ) : (

              <span className="section-label">
                VIEW ONLY · ADMIN RUNS GLOBAL ANALYSIS
              </span>

            )}

          </div>

        </div>


        {/* ERROR */}

        {error && (

          <div
            className="analysis-error"
            role="alert"
          >
            <AlertTriangle size={18} />

            <span>{error}</span>

          </div>

        )}


        {/* PROGRESS */}

        {stageMessage && (

          <div
            className="gc-success"
            role="status"
            style={{ marginBottom: 16 }}
          >
            {stageMessage}
          </div>

        )}


        {/* NO COMPARISON YET */}

        {!result?.has_comparison && (

          <div
            className="analysis-error"
            style={{
              borderColor: "rgba(245,158,11,.35)",
              color: "#fbbf24",
              marginBottom: 18
            }}
          >

            <AlertTriangle size={18} />

            <span>
              {result?.total_servers
                ? `${result.total_servers} servers are in inventory, but no successful comparison results are stored yet. Admin must upload or approve a matching Golden Configuration and run Analysis.`
                : "No server inventory or comparison records are available yet."}
            </span>

          </div>

        )}


        {!result ? (

          <div className="analysis-empty">

            <div className="analysis-empty-icon">
              <BarChart3 size={32} />
            </div>

            <h2>
              Ready to Analyze
            </h2>

            <p>
              Upload inventory, activate matching
              Golden Configuration baselines,
              then run the comparison.
            </p>

            {isAdmin && (

              <button
                type="button"
                className="secondary-button"
                onClick={() => void runAnalysis()}
                disabled={loading}
              >
                Start Analysis
              </button>

            )}

          </div>

        ) : (

          <>

            {/* KPI CARDS */}

            <div className="analysis-kpi-grid">

              <div className="analysis-kpi-card">
                <Server size={22} />
                <span>Total Inventory Servers</span>
                <strong>
                  {result.total_servers}
                </strong>
              </div>

              <div className="analysis-kpi-card success">
                <CheckCircle2 size={22} />
                <span>Compliant</span>
                <strong>
                  {result.has_comparison
                    ? result.compliant
                    : "—"}
                </strong>
              </div>

              <div className="analysis-kpi-card danger">
                <ShieldAlert size={22} />
                <span>Non-Compliant</span>
                <strong>
                  {result.has_comparison
                    ? result.non_compliant
                    : "—"}
                </strong>
              </div>

              <div className="analysis-kpi-card warning">
                <Activity size={22} />
                <span>Over Utilized</span>
                <strong>
                  {result.has_comparison
                    ? result.over_utilized
                    : "—"}
                </strong>
              </div>

            </div>


            {/* ALLOCATION AND UTILIZATION */}

            <div className="analysis-grid">

              <div className="analysis-card">

                <div className="section-label">
                  ALLOCATION
                </div>

                <h2>
                  Resource Allocation
                </h2>

                <div className="analysis-stat-row">
                  <span>Properly Allocated</span>

                  <strong>
                    {result.has_comparison
                      ? result.properly_allocated
                      : "—"}
                  </strong>
                </div>

                <div className="analysis-stat-row">
                  <span>Over Allocated</span>

                  <strong>
                    {result.has_comparison
                      ? result.over_allocated
                      : "—"}
                  </strong>
                </div>

                <div className="analysis-stat-row">
                  <span>Under Allocated</span>

                  <strong>
                    {result.has_comparison
                      ? result.under_allocated
                      : "—"}
                  </strong>
                </div>

              </div>


              <div className="analysis-card">

                <div className="section-label">
                  UTILIZATION
                </div>

                <h2>
                  Resource Utilization
                </h2>

                <div className="analysis-stat-row">
                  <span>Properly Utilized</span>

                  <strong>
                    {result.has_comparison
                      ? result.properly_utilized
                      : "—"}
                  </strong>
                </div>

                <div className="analysis-stat-row">
                  <span>Over Utilized</span>

                  <strong>
                    {result.has_comparison
                      ? result.over_utilized
                      : "—"}
                  </strong>
                </div>

                <div className="analysis-stat-row">
                  <span>Under Utilized</span>

                  <strong>
                    {result.has_comparison
                      ? result.under_utilized
                      : "—"}
                  </strong>
                </div>

              </div>

            </div>

            {result.has_comparison && (

              <p
                className="section-label"
                style={{ marginTop: 16 }}
              >
                Successfully compared {result.compared_servers}
                {" "}server(s) out of {result.total_servers}
                {" "}inventory server(s).
              </p>

            )}

          </>

        )}

      </main>

    </div>
  );
}