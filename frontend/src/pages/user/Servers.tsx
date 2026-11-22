import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  HeartPulse,
  RefreshCw,
  Search,
  Server as ServerIcon,
  ShieldAlert,
  UploadCloud,
  X,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  getAllHealthScores,
  type HealthRecord,
} from "../../services/healthService";
import {
  getDashboard,
  type DashboardResponse,
} from "../../services/dashboardService";
import { uploadServerInventory } from "../../services/serverService";
import { submitInventoryForApproval } from "../../services/requestService";

interface UploadUiResult {
  filename: string;
  uploaded_records: number;
  message: string;
  request_id?: string;
  approval_status?: string;
}

type ToastState = {
  type: "success" | "error";
  text: string;
} | null;

function getApiErrorMessage(error: any): string {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item: any) => item?.msg || item?.message || "Invalid field")
      .join(", ");
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "The upload failed. Check the backend terminal for details."
  );
}

export default function Servers() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [servers, setServers] = useState<HealthRecord[]>([]);
  const [dashboard, setDashboard] =
    useState<DashboardResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [pageError, setPageError] = useState("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDragActive, setUploadDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadResult, setUploadResult] =
    useState<UploadUiResult | null>(null);

  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback(
    (type: "success" | "error", text: string) => {
      setToast({ type, text });

      window.setTimeout(() => {
        setToast((current) =>
          current?.text === text ? null : current
        );
      }, 5000);
    },
    []
  );

  // LOAD SERVER DATA

  const loadData = useCallback(async () => {
    setPageError("");

    const [healthResult, dashboardResult] =
      await Promise.allSettled([
        getAllHealthScores(),
        getDashboard(),
      ]);

    if (healthResult.status === "fulfilled") {
      setServers(healthResult.value);
    } else {
      console.error(
        "GET /health failed:",
        healthResult.reason
      );

      setServers([]);
      setPageError(
        getApiErrorMessage(healthResult.reason)
      );
    }

    if (dashboardResult.status === "fulfilled") {
      setDashboard(dashboardResult.value);
    } else {
      console.error(
        "GET /dashboard failed:",
        dashboardResult.reason
      );

      setDashboard(null);

      if (healthResult.status === "fulfilled") {
        setPageError(
          getApiErrorMessage(dashboardResult.reason)
        );
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  // VALIDATE SELECTED EXCEL FILE

  const handleFileSelect = (file: File | null) => {
    setUploadError("");
    setUploadResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setSelectedFile(null);
      setUploadError(
        "Please select an Excel workbook ending in .xlsx or .xls."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    if (file.size === 0) {
      setSelectedFile(null);
      setUploadError(
        "The selected file is empty. Choose a valid Excel workbook."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  };

  // DRAG AND DROP

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setUploadDragActive(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setUploadDragActive(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setUploadDragActive(false);

    handleFileSelect(
      event.dataTransfer.files?.[0] || null
    );
  };

  // RESET UPLOAD FORM

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadError("");
    setUploadResult(null);
    setUploadProgress(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // SUBMIT INVENTORY

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setUploadError(
        "Choose an Excel inventory file before submitting."
      );
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadResult(null);
    setUploadProgress(20);

    try {
      if (isAdmin) {
        // ADMIN DIRECT INVENTORY UPLOAD

        const result =
          await uploadServerInventory(selectedFile);

        setUploadProgress(100);

        setUploadResult({
          filename: result.filename || selectedFile.name,
          uploaded_records: result.uploaded_records,
          message:
            result.message ||
            "Inventory uploaded successfully.",
        });

        showToast(
          "success",
          `${result.uploaded_records} server records were added to inventory.`
        );

        await loadData();
      } else {
        // USER INVENTORY SUBMISSION FOR ADMIN APPROVAL

        const result =
          await submitInventoryForApproval(selectedFile);

        setUploadProgress(100);

        setUploadResult({
          filename: selectedFile.name,
          uploaded_records: result.uploaded_records,
          message:
            result.message ||
            "Inventory submitted for Admin approval.",
          request_id: result.request_id,
          approval_status: result.status,
        });

        showToast(
          "success",
          `${result.uploaded_records} server records submitted for Admin approval.`
        );
      }

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Inventory upload failed:", error);

      const message = getApiErrorMessage(error);

      setUploadError(message);
      showToast("error", message);
    } finally {
      setUploading(false);

      window.setTimeout(() => {
        setUploadProgress(0);
      }, 1200);
    }
  };

  // SEARCH AND FILTER

  const filteredServers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return servers.filter((server) => {
      const serverId =
        String(server.server_id || "").toLowerCase();

      const risk =
        String(server.risk_level || "UNKNOWN").toUpperCase();

      const classification =
        String(server.classification || "").toLowerCase();

      const matchesSearch =
        !query ||
        serverId.includes(query) ||
        risk.toLowerCase().includes(query) ||
        classification.includes(query);

      const matchesRisk =
        riskFilter === "ALL" || risk === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [servers, search, riskFilter]);

  const totalServersCount =
    dashboard?.total_servers ?? servers.length;

  const compliantCount = dashboard?.compliant ?? 0;
  const needsReviewCount = dashboard?.needs_review ?? 0;

  return (
    <div className="app-shell">
      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active="Servers"
      />

      <main className="main-content">

        {/* TOAST */}

        <AnimatePresence>
          {toast && (
            <motion.div
              className={`toast-notification ${toast.type}`}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              role="status"
            >
              {toast.type === "success" ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}

              <span>{toast.text}</span>

              <button
                type="button"
                className="toast-close"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}

        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              {isAdmin ? "COMMAND CENTER" : "WORKSPACE"}
              {" "}· INVENTORY MANAGEMENT
            </div>

            <h1>Server Inventory &amp; Telemetry</h1>

            <p>
              Inspect server inventory, health evaluations,
              risk scores and baseline compliance.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? "refresh-spin" : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => {
                resetUploadForm();
                setShowUploadModal(true);
              }}
            >
              <UploadCloud size={16} />
              {isAdmin
                ? "Upload Inventory Excel"
                : "Submit Inventory for Approval"}
            </button>
          </div>
        </div>

        {pageError && (
          <div
            className="analysis-error"
            role="alert"
            style={{ marginBottom: 16 }}
          >
            {pageError}
          </div>
        )}

        {/* METRICS */}

        <div
          className="admin-feature-grid"
          style={{ marginBottom: 24 }}
        >
          <div className="admin-feature-card">
            <ServerIcon size={22} className="accent-cyan" />
            <span>Total Servers</span>
            <strong>{totalServersCount}</strong>
          </div>

          <div className="admin-feature-card">
            <HeartPulse size={22} className="accent-indigo" />
            <span>Evaluated Health Scores</span>
            <strong>{servers.length}</strong>
          </div>

          <div className="admin-feature-card">
            <CheckCircle2
              size={22}
              className="accent-emerald"
            />
            <span>Compliant Baseline</span>
            <strong>{compliantCount}</strong>
          </div>

          <div className="admin-feature-card">
            <ShieldAlert size={22} className="accent-rose" />
            <span>Needs Review</span>
            <strong>{needsReviewCount}</strong>
          </div>
        </div>

        {/* SERVER TABLE */}

        <section className="admin-feature-panel">
          <div
            className="panel-header-row"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <div>
              <div className="section-label">
                INFRASTRUCTURE INVENTORY
              </div>
              <h2>Registered Servers</h2>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                className="health-search"
                style={{ minWidth: 220 }}
              >
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search servers..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>

              <div className="filter-pill-group">
                {[
                  "ALL",
                  "LOW",
                  "MEDIUM",
                  "HIGH",
                  "CRITICAL",
                ].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`filter-pill ${
                      riskFilter === level ? "active" : ""
                    }`}
                    onClick={() => setRiskFilter(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="admin-feature-empty">
              <RefreshCw
                size={26}
                className="refresh-spin accent-cyan"
              />
              <p>Loading server inventory...</p>
            </div>
          ) : servers.length === 0 ? (
            <div className="admin-feature-empty">
              <ServerIcon
                size={36}
                className="accent-cyan"
              />

              <h3>No Server Health Records Available</h3>

              <p>
                {totalServersCount > 0
                  ? `${totalServersCount} servers are in inventory. Run Infrastructure Analysis to create health evaluations.`
                  : "No servers are in the active inventory yet. Upload the server inventory workbook or submit it for Admin approval."}
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  resetUploadForm();
                  setShowUploadModal(true);
                }}
              >
                <UploadCloud size={16} />
                {isAdmin
                  ? "Upload Inventory Excel"
                  : "Submit Inventory for Approval"}
              </button>
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="admin-feature-empty">
              <Search size={30} />
              <h3>No Matching Servers</h3>
              <p>
                No servers match the current search or risk filter.
              </p>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-feature-table">
                <thead>
                  <tr>
                    <th>Server ID</th>
                    <th>Health Score</th>
                    <th>Risk Level</th>
                    <th>Risk Factors</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredServers.map((server) => {
                    const score = Number(
                      server.health_score || 0
                    );

                    const risk = String(
                      server.risk_level || "LOW"
                    ).toUpperCase();

                    return (
                      <motion.tr
                        key={server.server_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <td>
                          <strong>{server.server_id}</strong>
                        </td>

                        <td>
                          <strong
                            style={{
                              color:
                                score >= 80
                                  ? "#10b981"
                                  : score >= 60
                                  ? "#f59e0b"
                                  : "#f43f5e",
                            }}
                          >
                            {score}
                          </strong>
                          {" "}/ 100
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              risk === "LOW"
                                ? "success"
                                : risk === "MEDIUM"
                                ? "warning"
                                : "danger"
                            }`}
                          >
                            {risk}
                          </span>
                        </td>

                        <td>
                          {server.risk_factors?.length
                            ? server.risk_factors.join(", ")
                            : "None detected"}
                        </td>

                        <td
                          style={{
                            maxWidth: 340,
                            fontSize: 13,
                          }}
                        >
                          {server.recommendation ||
                            "Infrastructure operating normally."}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* INVENTORY UPLOAD DIALOG */}

        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              className="server-upload-backdrop"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 3000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                background: "rgba(2, 6, 23, .82)",
                backdropFilter: "blur(7px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() =>
                !uploading && setShowUploadModal(false)
              }
            >
              <motion.section
                role="dialog"
                aria-modal="true"
                aria-labelledby="server-upload-title"
                style={{
                  width: "min(680px, 100%)",
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: "#0f172a",
                  color: "#e2e8f0",
                  border: "1px solid rgba(148,163,184,.25)",
                  borderRadius: 18,
                  boxShadow: "0 24px 80px rgba(0,0,0,.55)",
                }}
                initial={{ y: 18, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 18, scale: 0.98 }}
                onClick={(event) => event.stopPropagation()}
              >
                <header
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "18px 22px",
                    borderBottom:
                      "1px solid rgba(148,163,184,.18)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <UploadCloud size={21} />

                    <h2
                      id="server-upload-title"
                      style={{ margin: 0, fontSize: 19 }}
                    >
                      Upload Server Inventory
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    aria-label="Close upload dialog"
                  >
                    <X size={17} />
                  </button>
                </header>

                <div style={{ padding: 22 }}>
                  <p
                    style={{
                      marginTop: 0,
                      marginBottom: 18,
                      color: "#cbd5e1",
                      lineHeight: 1.6,
                      fontSize: 14,
                    }}
                  >
                    {isAdmin
                      ? "Choose an Excel workbook. Admin uploads are validated and written directly to the active server inventory."
                      : "Choose an Excel workbook. Your upload is validated and submitted as a pending request. Server records are inserted only after Admin approval."}
                  </p>

                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    style={{
                      padding: 22,
                      borderRadius: 14,
                      border: `2px dashed ${
                        uploadDragActive
                          ? "#22d3ee"
                          : "rgba(103,232,249,.55)"
                      }`,
                      background: uploadDragActive
                        ? "rgba(34,211,238,.12)"
                        : "rgba(30,41,59,.5)",
                      textAlign: "center",
                    }}
                  >
                    <FileSpreadsheet
                      size={38}
                      style={{ color: "#67e8f9" }}
                    />

                    <h3
                      style={{
                        margin: "10px 0 6px",
                        fontSize: 17,
                      }}
                    >
                      Select your inventory workbook
                    </h3>

                    <p
                      style={{
                        margin: "0 0 14px",
                        color: "#94a3b8",
                        fontSize: 13,
                      }}
                    >
                      Select an Excel workbook from your computer
                      or drag it here.
                      <br />
                      Supported formats: .xlsx and .xls
                    </p>

                    {!selectedFile ? (
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        disabled={uploading}
                        onChange={(
                          event: ChangeEvent<HTMLInputElement>
                        ) =>
                          handleFileSelect(
                            event.target.files?.[0] || null
                          )
                        }
                        aria-label="Browse for server inventory Excel file"
                        style={{
                          display: "block",
                          width: "100%",
                          maxWidth: "100%",
                          padding: 10,
                          color: "#e2e8f0",
                          background: "#111827",
                          border:
                            "1px solid rgba(148,163,184,.3)",
                          borderRadius: 9,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          justifyContent: "center",
                          gap: 12,
                          padding: 12,
                          borderRadius: 10,
                          background: "rgba(16,185,129,.1)",
                        }}
                      >
                        <CheckCircle2
                          size={20}
                          style={{ color: "#34d399" }}
                        />

                        <div
                          style={{
                            minWidth: 0,
                            textAlign: "left",
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {selectedFile.name}
                          </strong>

                          <span
                            style={{
                              color: "#94a3b8",
                              fontSize: 12,
                            }}
                          >
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setSelectedFile(null);

                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          disabled={uploading}
                        >
                          Remove file
                        </button>
                      </div>
                    )}
                  </div>

                  {uploading && (
                    <div style={{ marginTop: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 7,
                          fontSize: 13,
                        }}
                      >
                        <span>Uploading and validating...</span>
                        <span>{uploadProgress}%</span>
                      </div>

                      <div
                        style={{
                          height: 7,
                          borderRadius: 99,
                          background: "#334155",
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          animate={{
                            width: `${uploadProgress}%`,
                          }}
                          style={{
                            height: "100%",
                            background:
                              "linear-gradient(90deg,#22d3ee,#818cf8)",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div
                      role="alert"
                      style={{
                        marginTop: 16,
                        padding: 12,
                        borderRadius: 10,
                        color: "#fecaca",
                        background: "rgba(220,38,38,.12)",
                        border:
                          "1px solid rgba(248,113,113,.3)",
                      }}
                    >
                      <strong>Upload failed</strong>

                      <p
                        style={{
                          margin: "5px 0 0",
                          overflowWrap: "anywhere",
                          fontSize: 13,
                        }}
                      >
                        {uploadError}
                      </p>
                    </div>
                  )}

                  {uploadResult && (
                    <div
                      role="status"
                      style={{
                        marginTop: 16,
                        padding: 12,
                        borderRadius: 10,
                        color: "#bbf7d0",
                        background: "rgba(16,185,129,.12)",
                        border:
                          "1px solid rgba(52,211,153,.3)",
                      }}
                    >
                      <strong>{uploadResult.message}</strong>

                      <p
                        style={{
                          margin: "5px 0 0",
                          fontSize: 13,
                        }}
                      >
                        File: {uploadResult.filename}
                        {" · "}
                        Records: {uploadResult.uploaded_records}
                      </p>

                      {uploadResult.request_id && (
                        <p
                          style={{
                            margin: "5px 0 0",
                            fontSize: 13,
                          }}
                        >
                          Request ID: {uploadResult.request_id}
                          {" · "}
                          Status: {uploadResult.approval_status || "PENDING"}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <footer
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                    gap: 10,
                    padding: "16px 22px 20px",
                    borderTop:
                      "1px solid rgba(148,163,184,.18)",
                  }}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => void handleUploadSubmit()}
                    disabled={uploading || !selectedFile}
                  >
                    {uploading ? (
                      <>
                        <RefreshCw
                          size={16}
                          className="refresh-spin"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        {isAdmin
                          ? "Upload Servers"
                          : "Submit for Approval"}
                      </>
                    )}
                  </button>
                </footer>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}