import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { Activity, Clock3, RefreshCw, CheckCircle2, Plus, Trash2, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";
import Sidebar from "../../components/layout/Sidebar";

interface Job {
  job_id: string;
  name: string;
  job_type: string;
  cron_expression: string;
  description?: string | null;
  last_run_at?: string | null;
  next_run_at?: string | null;
  enabled: boolean;
  created_by?: string;
}

interface ScheduledJobsProps {
  role?: "admin" | "user";
}

const jobTypes = [
  { value: "COMPLIANCE_SUMMARY", label: "Compliance summary" },
  { value: "NON_COMPLIANT_COUNT", label: "Count non-compliant servers" },
  { value: "OVER_ALLOCATED_COUNT", label: "Count over-allocated servers" },
  { value: "UNDER_ALLOCATED_COUNT", label: "Count under-allocated servers" },
  { value: "PROBLEM_SERVERS", label: "List problem servers" },
];

const inputStyle: CSSProperties = {
  width: "100%", padding: "11px 12px", border: "1px solid #d8e0ea",
  borderRadius: 10, background: "#fff", color: "#182235", font: "inherit",
  boxSizing: "border-box",
};

function ScheduledJobs({ role = "admin" }: ScheduledJobsProps) {
  const isAdmin = role === "admin";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [jobType, setJobType] = useState("COMPLIANCE_SUMMARY");
  const [cron, setCron] = useState("0 9 * * *");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/jobs");
      const data = response.data;
      setJobs(Array.isArray(data) ? data : Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not load scheduled jobs. Please check that the API is running and you are signed in.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadJobs(); }, []);

  const createJob = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post("/jobs", {
        name: name.trim(),
        job_type: jobType,
        cron_expression: cron.trim(),
        description: description.trim() || null,
        enabled,
      });
      setName("");
      setDescription("");
      setShowForm(false);
      setNotice("Scheduled job created successfully.");
      await loadJobs();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not create this scheduled job.");
    } finally {
      setSaving(false);
    }
  };

  const toggleJob = async (job: Job) => {
    setError(""); setNotice("");
    try {
      await api.put(`/jobs/${encodeURIComponent(job.job_id)}`, { enabled: !job.enabled });
      setNotice(`Job ${!job.enabled ? "enabled" : "paused"} successfully.`);
      await loadJobs();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not update this job.");
    }
  };

  const deleteJob = async (job: Job) => {
    if (!window.confirm(`Delete scheduled job "${job.name}"?`)) return;
    setError(""); setNotice("");
    try {
      await api.delete(`/jobs/${encodeURIComponent(job.job_id)}`);
      setNotice("Scheduled job deleted.");
      await loadJobs();
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Could not delete this job.");
    }
  };

  const activeJobs = jobs.filter((job) => job.enabled).length;

  return (
    <div className="app-shell">
      <Sidebar role={role} active="Scheduled Jobs" />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">AUTOMATION WORKSPACE</div>
            <h1>Custom Scheduled Jobs</h1>
            <p>Create recurring infrastructure reports and choose when each job runs.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="secondary-button" onClick={() => void loadJobs()} type="button">
              <RefreshCw size={17} /> Refresh
            </button>
            <button className="primary-button" onClick={() => setShowForm((v) => !v)} type="button">
              <Plus size={17} /> Create Job
            </button>
          </div>
        </div>

        {error && <div role="alert" style={{ padding: 12, marginBottom: 14, borderRadius: 10, background: "#fff0f0", color: "#a52222" }}>{error}</div>}
        {notice && <div role="status" style={{ padding: 12, marginBottom: 14, borderRadius: 10, background: "#ecfdf3", color: "#166534" }}>{notice}</div>}

        <div className="admin-feature-grid">
          <div className="admin-feature-card"><Activity size={22} /><span>Active Jobs</span><strong>{activeJobs}</strong></div>
          <div className="admin-feature-card"><Clock3 size={22} /><span>Total Jobs</span><strong>{jobs.length}</strong></div>
        </div>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onSubmit={createJob}
            style={{ background: "#fff", color: "#182235", border: "1px solid #e0e7ef", borderRadius: 16, padding: 22, margin: "22px 0", boxShadow: "0 8px 28px rgba(25,45,75,.05)" }}>
            <h2 style={{ marginTop: 0 }}>Create a scheduled job</h2>
            <p style={{ color: "#667085", marginTop: -4 }}>Schedules use a five-field cron expression and UTC time. You can create multiple jobs.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <label style={{ display: "grid", gap: 7 }}>Job name
                <input required minLength={3} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="Daily compliance summary" style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 7 }}>Task
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} style={inputStyle}>
                  {jobTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 7 }}>Cron schedule
                <input required value={cron} onChange={(e) => setCron(e.target.value)} placeholder="0 9 * * *" style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 7 }}>Description (optional)
                <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What should this job monitor?" style={inputStyle} />
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable immediately</label>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>{saving ? "Creating..." : "Save Schedule"}</button>
              </div>
            </div>
            <div style={{ color: "#667085", fontSize: 12, marginTop: 12 }}>
              Examples: <code>0 9 * * *</code> daily at 09:00 UTC · <code>*/15 * * * *</code> every 15 minutes · <code>0 8 * * 1</code> every Monday at 08:00 UTC.
            </div>
          </motion.form>
        )}

        <div className="admin-feature-panel">
          <div className="section-label">AUTOMATION</div>
          <h2>{isAdmin ? "All Scheduled Infrastructure Jobs" : "My Scheduled Infrastructure Jobs"}</h2>
          {loading ? <div className="admin-feature-empty">Loading jobs...</div> :
            jobs.length === 0 ? <div className="admin-feature-empty"><Activity size={30} /><strong>No scheduled jobs yet</strong><span>Create a job to automate recurring compliance reports and server checks.</span></div> :
            <div className="admin-table-wrapper"><table className="admin-feature-table">
              <thead><tr><th>Name</th><th>Task</th><th>Cron (UTC)</th><th>Next Run</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{jobs.map((job) => <motion.tr key={job.job_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <td><strong>{job.name}</strong><div style={{ color: "#667085", fontSize: 12 }}>{job.job_id}</div></td>
                <td>{jobTypes.find((type) => type.value === job.job_type)?.label || job.job_type}</td>
                <td><code>{job.cron_expression}</code></td>
                <td>{job.next_run_at ? new Date(job.next_run_at).toLocaleString() : "—"}</td>
                <td><span className="admin-status">{job.enabled ? <><CheckCircle2 size={13} /> Active</> : "Paused"}</span></td>
                <td><div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="secondary-button" title={job.enabled ? "Pause job" : "Enable job"} onClick={() => void toggleJob(job)}>{job.enabled ? <Pause size={15} /> : <Play size={15} />}</button>
                  <button type="button" className="secondary-button" title="Delete job" onClick={() => void deleteJob(job)}><Trash2 size={15} /></button>
                </div></td>
              </motion.tr>)}</tbody>
            </table></div>}
        </div>
      </main>
    </div>
  );
}

export default ScheduledJobs;
