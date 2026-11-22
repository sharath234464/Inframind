import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  RefreshCw,
  Shield,
  Sparkles,
  UploadCloud,
  X,
  AlertTriangle,
  CheckCheck,
  Ban,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "../../components/layout/Sidebar";
import {
  uploadGoldenConfiguration,
  generateGoldenProposals,
  getGoldenProposals,
  getGoldenConfigurations,
  approveGoldenProposal,
  rejectGoldenProposal,
  type GoldenProposal,
  type GoldenUploadResponse,
  type GoldenConfigurationRecord,
} from "../../services/goldenConfigurationService";

function GoldenConfiguration() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [lastUpload, setLastUpload] = useState<GoldenUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState("");

  // Proposals State
  const [proposals, setProposals] = useState<GoldenProposal[]>([]);
  const [goldenConfigurations, setGoldenConfigurations] = useState<GoldenConfigurationRecord[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Generator Modal / State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genInstanceType, setGenInstanceType] = useState("");
  const [genMinServers, setGenMinServers] = useState(5);
  const [generating, setGenerating] = useState(false);

  // Approval / Rejection Action State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectModalProposal, setRejectModalProposal] = useState<GoldenProposal | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 5000);
  };

  const loadProposals = async () => {
    setLoadingProposals(true);
    try {
      const [data, baselines] = await Promise.all([
        getGoldenProposals(statusFilter === "ALL" ? undefined : statusFilter),
        getGoldenConfigurations(),
      ]);
      setProposals(data);
      setGoldenConfigurations(baselines);
    } catch (err: any) {
      console.error("Failed to load golden proposals:", err);
      showToast("error", err?.response?.data?.detail || "Unable to load proposals from server.");
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [statusFilter]);

  // File selection
  const handleFileSelect = (file: File | null) => {
    setUploadError("");
    setLastUpload(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isValid = /\.(xlsx|xls)$/i.test(file.name);
    if (!isValid) {
      setSelectedFile(null);
      setUploadError("Invalid file type. Please select a valid Excel file (.xlsx or .xls).");
      return;
    }

    setSelectedFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = () => {
    setDragActive(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setLastUpload(null);
    setUploadProgress(20);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev < 90 ? prev + 15 : prev));
    }, 150);

    try {
      const result = await uploadGoldenConfiguration(selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setLastUpload(result);
      showToast("success", result.message || `Uploaded ${result.uploaded_records} baseline configurations.`);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await loadProposals();
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("Upload error:", err);
      const detail = err?.response?.data?.detail;
      setUploadError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || "Validation error").join(", ")
          : "Golden configuration upload failed. Verify the file format and required columns."
      );
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateGoldenProposals({
        instance_type: genInstanceType.trim() || undefined,
        minimum_healthy_servers: genMinServers > 0 ? genMinServers : 5,
      });

      showToast("success", result.message || `Generated ${result.proposals?.length || 0} proposal(s).`);
      setShowGenModal(false);
      setGenInstanceType("");
      await loadProposals();
    } catch (err: any) {
      console.error("Generate error:", err);
      showToast("error", err?.response?.data?.detail || "Unable to generate proposal. Ensure healthy servers exist in inventory.");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    setActionLoadingId(proposalId);
    try {
      const result = await approveGoldenProposal(proposalId);
      showToast("success", result.message || `Proposal ${proposalId} approved and saved as active Golden Configuration.`);
      await loadProposals();
    } catch (err: any) {
      console.error("Approve error:", err);
      showToast("error", err?.response?.data?.detail || `Failed to approve proposal ${proposalId}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalProposal) return;
    const proposalId = rejectModalProposal.proposal_id;
    setActionLoadingId(proposalId);
    try {
      const result = await rejectGoldenProposal(proposalId, rejectReason.trim() || undefined);
      showToast("success", result.message || `Proposal ${proposalId} rejected.`);
      setRejectModalProposal(null);
      setRejectReason("");
      await loadProposals();
    } catch (err: any) {
      console.error("Reject error:", err);
      showToast("error", err?.response?.data?.detail || `Failed to reject proposal ${proposalId}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pendingCount = proposals.filter((p) => p.status === "PENDING_APPROVAL").length;
  const rejectedCount = proposals.filter((p) => p.status === "REJECTED").length;

  return (
    <div className="app-shell">
      <Sidebar role="admin" active="Golden Configuration" />

      <main className="main-content">
        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {notification && (
            <motion.div
              className={`toast-notification ${notification.type}`}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {notification.type === "success" ? (
                <CheckCircle2 size={18} className="toast-icon success" />
              ) : (
                <AlertTriangle size={18} className="toast-icon error" />
              )}
              <span>{notification.text}</span>
              <button
                type="button"
                className="toast-close"
                onClick={() => setNotification(null)}
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PAGE HEADER */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">COMMAND CENTER · INFRASTRUCTURE BASELINE</div>
            <h1>Golden Configuration</h1>
            <p>
              Upload approved infrastructure standards via Excel, or utilize autonomous AI to synthesize baseline proposals from healthy production telemetry.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <motion.button
              type="button"
              className="secondary-button"
              onClick={loadProposals}
              disabled={loadingProposals}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw size={16} className={loadingProposals ? "refresh-spin" : ""} />
              Refresh
            </motion.button>

            <motion.button
              type="button"
              className="primary-button"
              onClick={() => setShowGenModal(true)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Sparkles size={16} />
              Generate AI Proposal
            </motion.button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="admin-feature-grid" style={{ marginBottom: "24px" }}>
          <div className="admin-feature-card">
            <Shield size={22} className="accent-cyan" />
            <span>Total Proposals</span>
            <strong>{proposals.length}</strong>
          </div>

          <div className="admin-feature-card">
            <Clock3 size={22} className="accent-amber" />
            <span>Pending Review</span>
            <strong style={{ color: pendingCount > 0 ? "var(--warning, #f59e0b)" : undefined }}>
              {pendingCount}
            </strong>
          </div>

          <div className="admin-feature-card">
            <CheckCheck size={22} className="accent-emerald" />
            <span>Approved Baselines</span>
            <strong>{goldenConfigurations.length}</strong>
          </div>

          <div className="admin-feature-card">
            <Ban size={22} className="accent-rose" />
            <span>Rejected</span>
            <strong>{rejectedCount}</strong>
          </div>
        </div>

        {/* UPLOAD SECTION (SECTION 3A & 20 UX) */}
        <div className="admin-feature-panel" style={{ marginBottom: "30px" }}>
          <div className="section-label">EXCEL INGESTION</div>
          <h2>Upload Golden Configuration Baseline</h2>
          <p style={{ color: "rgba(226, 232, 240, 0.7)", fontSize: "14px", marginTop: "4px" }}>
            Upload the authoritative enterprise infrastructure baseline spreadsheet (.xlsx or .xls) to validate server compliance.
          </p>

          <div
            className={`upload-dropzone ${dragActive ? "drag-active" : ""} ${selectedFile ? "has-file" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !selectedFile && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files?.[0] || null)}
            />

            {!selectedFile ? (
              <div className="upload-dropzone-inner">
                <div className="upload-icon-bubble">
                  <UploadCloud size={32} />
                </div>
                <h3>Drag & Drop Golden Configuration Excel</h3>
                <p>or click to browse your computer for .xlsx or .xls files</p>
                <div className="upload-badge-pill">Required Columns: instance_type, vcpu, memory, disk, targets...</div>
              </div>
            ) : (
              <div className="upload-selected-card">
                <div className="file-info-row">
                  <div className="file-icon-box">
                    <FileSpreadsheet size={28} />
                  </div>
                  <div className="file-details">
                    <strong>{selectedFile.name}</strong>
                    <span>{formatFileSize(selectedFile.size)} · Ready to upload</span>
                  </div>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    disabled={uploading}
                  >
                    <X size={18} />
                  </button>
                </div>

                {uploading && (
                  <div className="upload-progress-wrapper">
                    <div className="upload-progress-header">
                      <span>Uploading to FastAPI and validating schema...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <motion.div
                        className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: "easeOut", duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                <div className="upload-actions-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpload();
                    }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <RefreshCw size={16} className="refresh-spin" />
                        Uploading Configuration...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} />
                        Upload Configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* UPLOAD SUCCESS STATE */}
          {lastUpload && (
            <motion.div
              className="alert-banner success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle2 size={18} />
              <div>
                <strong>Golden configuration uploaded successfully!</strong>
                <p>
                  File <code>{lastUpload.filename}</code> ingested. {lastUpload.uploaded_records} baseline configurations saved to MongoDB.
                </p>
              </div>
            </motion.div>
          )}

          {/* UPLOAD ERROR STATE */}
          {uploadError && (
            <motion.div
              className="alert-banner danger"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertTriangle size={18} />
              <div>
                <strong>Upload Failed</strong>
                <p>{uploadError}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* EXISTING BASELINES: loaded from the existing MongoDB collection */}
        <div className="admin-feature-panel" style={{ marginBottom: "30px" }}>
          <div className="panel-header-row">
            <div>
              <div className="section-label">MONGODB · GOLDEN CONFIGURATION</div>
              <h2>Active Approved Baselines</h2>
              <p style={{ color: "rgba(226, 232, 240, 0.68)", fontSize: "13px", marginTop: "5px" }}>
                Read-only view of the baselines already stored in your configured database. This view does not re-upload or replace existing data.
              </p>
            </div>
            <span className="status-badge success">{goldenConfigurations.length} baseline{goldenConfigurations.length === 1 ? "" : "s"}</span>
          </div>
          {loadingProposals ? (
            <div className="admin-feature-empty"><RefreshCw size={24} className="refresh-spin" /><p>Loading saved baselines…</p></div>
          ) : goldenConfigurations.length === 0 ? (
            <div className="admin-feature-empty"><Shield size={30} /><strong>No approved baselines found</strong><span>Connect the app to the database that contains your existing golden_configuration collection, or upload a baseline if this is a new environment.</span></div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-feature-table">
                <thead><tr><th>Instance type</th><th>vCPU</th><th>Memory</th><th>Disk</th><th>CPU target</th><th>Memory target</th></tr></thead>
                <tbody>{goldenConfigurations.map((item) => (
                  <motion.tr key={item.instance_type} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                    <td><strong>{item.instance_type}</strong></td>
                    <td>{item.vcpu}</td><td>{item.memory}</td><td>{item.disk}</td>
                    <td>{item.target_cpu_utilization_min ?? "—"}% – {item.target_cpu_utilization_max ?? "—"}%</td>
                    <td>{item.target_memory_utilization_min ?? "—"}% – {item.target_memory_utilization_max ?? "—"}%</td>
                  </motion.tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>

        {/* PROPOSALS SECTION (SECTION 3B, 3C, 3D) */}
        <div className="admin-feature-panel">
          <div className="panel-header-row">
            <div>
              <div className="section-label">AI PROPOSALS & ACTIVE BASELINES</div>
              <h2>Golden Configuration Proposals</h2>
            </div>

            <div className="filter-pill-group">
              {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`filter-pill ${statusFilter === st ? "active" : ""}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st === "ALL" ? "All" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {loadingProposals ? (
            <div className="admin-feature-empty">
              <RefreshCw size={26} className="refresh-spin accent-cyan" />
              <p>Loading golden configuration proposals...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="admin-feature-empty">
              <BrainCircuit size={36} className="accent-cyan" />
              <h3>No Golden Configuration Proposals Found</h3>
              <p>
                {statusFilter === "ALL"
                  ? "No proposals or baselines exist yet. Upload a golden configuration Excel file above, or click 'Generate AI Proposal' to analyze healthy inventory telemetry."
                  : `No proposals match status filter '${statusFilter}'.`}
              </p>
              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: "12px" }}
                onClick={() => setShowGenModal(true)}
              >
                <Sparkles size={16} />
                Generate AI Proposal
              </button>
            </div>
          ) : (
            <div className="proposals-grid">
              {proposals.map((proposal) => {
                const isPending = proposal.status === "PENDING_APPROVAL";
                const isApproved = proposal.status === "APPROVED";
                const isRejected = proposal.status === "REJECTED";
                const isLoadingThis = actionLoadingId === proposal.proposal_id;

                return (
                  <motion.div
                    key={proposal.proposal_id}
                    className={`proposal-card ${proposal.status.toLowerCase()}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="proposal-card-header">
                      <div>
                        <span className="proposal-id">{proposal.proposal_id}</span>
                        <h3 className="proposal-instance">{proposal.instance_type}</h3>
                      </div>

                      <span
                        className={`status-badge ${
                          isApproved ? "success" : isRejected ? "danger" : "warning"
                        }`}
                      >
                        {proposal.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* SPECS GRID */}
                    <div className="proposal-specs-grid">
                      <div className="spec-item">
                        <span className="spec-label">vCPU</span>
                        <strong className="spec-val">{proposal.vcpu} Cores</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Memory</span>
                        <strong className="spec-val">{proposal.memory} GB</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Disk</span>
                        <strong className="spec-val">{proposal.disk} GB</strong>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Healthy Servers Sampled</span>
                        <strong className="spec-val">{proposal.source_server_count}</strong>
                      </div>
                    </div>

                    {/* UTILIZATION TARGETS */}
                    <div className="utilization-targets-card">
                      <div className="target-row">
                        <span className="target-title">Target CPU Utilization:</span>
                        <span className="target-range">
                          {proposal.target_cpu_utilization_min}% – {proposal.target_cpu_utilization_max}%
                        </span>
                      </div>
                      <div className="target-row">
                        <span className="target-title">Target Memory Utilization:</span>
                        <span className="target-range">
                          {proposal.target_memory_utilization_min}% – {proposal.target_memory_utilization_max}%
                        </span>
                      </div>
                    </div>

                    {/* AI REASONING */}
                    {proposal.ai_reasoning && (
                      <div className="proposal-reasoning">
                        <Sparkles size={14} className="accent-cyan" />
                        <p>{proposal.ai_reasoning}</p>
                      </div>
                    )}

                    {/* REJECTION REASON (IF REJECTED) */}
                    {isRejected && proposal.rejection_reason && (
                      <div className="proposal-rejection-box">
                        <AlertTriangle size={14} />
                        <span>Rejection Reason: {proposal.rejection_reason}</span>
                      </div>
                    )}

                    {/* CARD FOOTER WITH APPROVE / REJECT ACTIONS */}
                    <div className="proposal-card-footer">
                      <span className="proposal-timestamp">
                        {proposal.created_at ? new Date(proposal.created_at).toLocaleDateString() : ""}
                      </span>

                      {isPending && (
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="danger-button-sm"
                            onClick={() => {
                              setRejectModalProposal(proposal);
                              setRejectReason("");
                            }}
                            disabled={isLoadingThis}
                          >
                            <X size={15} />
                            Reject
                          </button>

                          <button
                            type="button"
                            className="primary-button-sm"
                            onClick={() => handleApprove(proposal.proposal_id)}
                            disabled={isLoadingThis}
                          >
                            {isLoadingThis ? (
                              <RefreshCw size={15} className="refresh-spin" />
                            ) : (
                              <Check size={15} />
                            )}
                            Approve
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="approved-pill">
                          <CheckCircle2 size={15} /> Active Golden Baseline
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL: GENERATE AI PROPOSAL */}
        <AnimatePresence>
          {showGenModal && (
            <div className="modal-backdrop" onClick={() => !generating && setShowGenModal(false)}>
              <motion.div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="modal-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Sparkles size={20} className="accent-cyan" />
                    <h3>Generate AI Golden Proposal</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={() => setShowGenModal(false)}
                    disabled={generating}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body">
                  <p style={{ fontSize: "14px", color: "rgba(226, 232, 240, 0.7)", marginBottom: "18px" }}>
                    The backend analyzes production inventory telemetry, filters healthy servers operating within standard thresholds, and calculates median resource specs to propose an optimal baseline.
                  </p>

                  <div className="form-group">
                    <label>Target Instance Type (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. t3.large, m5.xlarge (leave blank for all)"
                      value={genInstanceType}
                      onChange={(e) => setGenInstanceType(e.target.value)}
                      disabled={generating}
                    />
                    <small>Leave empty to synthesize proposals for all instance types found in inventory.</small>
                  </div>

                  <div className="form-group">
                    <label>Minimum Healthy Servers Required</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      max={100}
                      value={genMinServers}
                      onChange={(e) => setGenMinServers(parseInt(e.target.value) || 1)}
                      disabled={generating}
                    />
                    <small>Default is 5 healthy servers required before establishing a statistical baseline.</small>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowGenModal(false)}
                    disabled={generating}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <RefreshCw size={16} className="refresh-spin" />
                        Synthesizing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Run Proposal Generation
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: REJECT PROPOSAL WITH REASON */}
        <AnimatePresence>
          {rejectModalProposal && (
            <div className="modal-backdrop" onClick={() => !actionLoadingId && setRejectModalProposal(null)}>
              <motion.div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="modal-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertTriangle size={20} className="accent-rose" />
                    <h3>Reject Proposal {rejectModalProposal.proposal_id}</h3>
                  </div>
                  <button
                    type="button"
                    className="modal-close"
                    onClick={() => setRejectModalProposal(null)}
                    disabled={!!actionLoadingId}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body">
                  <p style={{ fontSize: "14px", color: "rgba(226, 232, 240, 0.7)", marginBottom: "16px" }}>
                    Rejecting will mark proposal <strong>{rejectModalProposal.proposal_id}</strong> ({rejectModalProposal.instance_type}) as REJECTED in MongoDB audit logs.
                  </p>

                  <div className="form-group">
                    <label>Rejection Reason (Optional)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g. Memory allocation too low for target workloads..."
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      disabled={!!actionLoadingId}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setRejectModalProposal(null)}
                    disabled={!!actionLoadingId}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={handleReject}
                    disabled={!!actionLoadingId}
                  >
                    {actionLoadingId ? (
                      <>
                        <RefreshCw size={16} className="refresh-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <X size={16} />
                        Confirm Rejection
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default GoldenConfiguration;
