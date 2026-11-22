import { useEffect, useState } from "react";
import { BarChart3, CheckCircle2, Download, FileText, RefreshCw, ShieldAlert, Server } from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

interface InfrastructureReport {
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

function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const [report, setReport] = useState<InfrastructureReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<InfrastructureReport>("/reports");
      setReport(response.data);
    } catch (err: any) {
      console.error("Report request failed", err);
      setError(err?.response?.data?.detail || "Unable to load the infrastructure report. Check the backend connection and your login session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReport(); }, []);

  const downloadCsv = () => {
    if (!report) return;
    const rows: [string, string | number][] = [
      ["Metric", "Value"],
      ["Generated message", report.message],
      ["Total servers analyzed", report.total_servers],
      ["Compliant servers", report.compliant],
      ["Needs review", report.needs_review],
      ["Properly allocated", report.properly_allocated],
      ["Under allocated", report.under_allocated],
      ["Over allocated", report.over_allocated],
      ["Properly utilized", report.properly_utilized],
      ["Under utilized", report.under_utilized],
      ["Over utilized", report.over_utilized],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `inframind-infrastructure-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const metrics = report ? [
    { label: "Total servers", value: report.total_servers, icon: Server, tone: "blue" },
    { label: "Compliant", value: report.compliant, icon: CheckCircle2, tone: "green" },
    { label: "Needs review", value: report.needs_review, icon: ShieldAlert, tone: "amber" },
    { label: "Allocation exceptions", value: report.under_allocated + report.over_allocated, icon: BarChart3, tone: "violet" },
  ] : [];

  const rows = report ? [
    ["Properly allocated", report.properly_allocated],
    ["Under allocated", report.under_allocated],
    ["Over allocated", report.over_allocated],
    ["Properly utilized", report.properly_utilized],
    ["Under utilized", report.under_utilized],
    ["Over utilized", report.over_utilized],
  ] as [string, number][] : [];

  return (
    <div className="app-shell">
      <Sidebar role={isAdmin ? "admin" : "user"} active="Reports" />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">{isAdmin ? "COMMAND CENTER" : "WORKSPACE"} · REPORTING</div>
            <h1>Infrastructure Reports</h1>
            <p>Live compliance and resource-allocation summary calculated from your saved analysis results.</p>
          </div>
          <div className="page-header-actions">
            <motion.button className="secondary-button" onClick={loadReport} disabled={loading} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <RefreshCw size={16} className={loading ? "refresh-spin" : ""} /> Refresh
            </motion.button>
            <motion.button className="primary-button" onClick={downloadCsv} disabled={!report || loading} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Download size={16} /> Export CSV
            </motion.button>
          </div>
        </div>

        {error && <div className="analysis-error" role="alert">{error}</div>}
        {loading ? (
          <div className="dashboard-loading"><div className="loading-spinner" /><h3>Building your report…</h3><p>Reading saved infrastructure analysis from the backend.</p></div>
        ) : report ? (
          <>
            <div className="admin-feature-grid">
              {metrics.map((metric, index) => {
                const Icon = metric.icon;
                return <motion.div className={`admin-feature-card report-metric ${metric.tone}`} key={metric.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                  <Icon size={22} /><span>{metric.label}</span><strong>{metric.value.toLocaleString()}</strong>
                </motion.div>;
              })}
            </div>
            <motion.section className="admin-feature-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="section-label">SAVED ANALYSIS · RESOURCE STATE</div>
              <h2>Allocation & utilization breakdown</h2>
              <p className="report-status-line"><CheckCircle2 size={16} /> {report.message || "Report loaded from the backend."}</p>
              <div className="admin-table-wrapper">
                <table className="admin-feature-table">
                  <thead><tr><th>Infrastructure metric</th><th>Server count</th><th>Share of analyzed servers</th></tr></thead>
                  <tbody>{rows.map(([label, value], index) => {
                    const pct = report.total_servers > 0 ? (value / report.total_servers) * 100 : 0;
                    return <motion.tr key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }}>
                      <td><span className="report-row-label"><FileText size={15} />{label}</span></td>
                      <td>{value.toLocaleString()}</td>
                      <td><div className="report-share"><div className="report-share-track"><motion.div className="report-share-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} transition={{ duration: 0.6, delay: index * 0.04 }} /></div><span>{pct.toFixed(1)}%</span></div></td>
                    </motion.tr>;
                  })}</tbody>
                </table>
              </div>
            </motion.section>
          </>
        ) : (
          <div className="admin-feature-panel"><div className="admin-feature-empty"><FileText size={32} /><strong>No report data returned</strong><span>Run an analysis as an administrator, then refresh this page.</span></div></div>
        )}
      </main>
    </div>
  );
}

export default Reports;
