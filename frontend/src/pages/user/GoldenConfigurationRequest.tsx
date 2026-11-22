import { useEffect, useState } from "react";
import { BrainCircuit, Clock3, RefreshCw, Sparkles } from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import {
  generateGoldenProposals,
  getGoldenProposals,
  type GoldenProposal,
} from "../../services/goldenConfigurationService";

export default function GoldenConfigurationRequest() {
  const [proposals, setProposals] = useState<GoldenProposal[]>([]);
  const [instanceType, setInstanceType] = useState("");
  const [minimum, setMinimum] = useState(5);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setRefreshing(true);
    setError("");
    try {
      setProposals(await getGoldenProposals());
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not load your Golden Configuration proposals.");
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const generate = async () => {
    setLoading(true); setError(""); setNotice("");
    try {
      const result = await generateGoldenProposals({
        instance_type: instanceType.trim() || undefined,
        minimum_healthy_servers: Math.max(1, minimum),
      });
      setNotice(result.message || `${result.proposals.length} proposal(s) submitted for Admin approval.`);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Generation failed. Confirm approved inventory and OPENAI_API_KEY are available.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar role="user" active="Golden Configuration" />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">WORKSPACE · AI BASELINE GENERATION</div>
            <h1>AI-Assisted Golden Configuration</h1>
            <p>Generate an inventory-based baseline proposal with AI reasoning. Nothing becomes active until an Admin approves it.</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => void load()} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? "refresh-spin" : ""} /> Refresh
          </button>
        </div>

        <section className="admin-feature-panel" style={{ marginBottom: 22 }}>
          <div className="section-label">PROPOSAL GENERATOR</div>
          <h2><BrainCircuit size={20} style={{ verticalAlign: "middle", marginRight: 8 }} />Create a proposal from approved inventory</h2>
          <p>Numeric resource values are derived from healthy server inventory. AI explains the evidence, sizing rationale and review considerations.</p>
          <div className="gc-request-form">
            <label>Instance type (optional)
              <input value={instanceType} onChange={(e) => setInstanceType(e.target.value)} placeholder="Leave blank to process all eligible types" />
            </label>
            <label>Minimum healthy servers per type
              <input type="number" min={1} max={500} value={minimum} onChange={(e) => setMinimum(Math.max(1, Number(e.target.value) || 1))} />
            </label>
          </div>
          <button type="button" className="primary-button" onClick={() => void generate()} disabled={loading}>
            <Sparkles size={16} /> {loading ? "Generating proposal..." : "Generate and Submit for Admin Approval"}
          </button>
          {notice && <p className="gc-success" role="status">{notice}</p>}
          {error && <p className="gc-error" role="alert">{error}</p>}
        </section>

        <section className="admin-feature-panel">
          <div className="section-label">YOUR SUBMISSIONS</div>
          <h2>Golden Configuration Proposals</h2>
          {refreshing ? <div className="admin-feature-empty"><RefreshCw size={22} />Loading proposals...</div> : proposals.length === 0 ? (
            <div className="admin-feature-empty"><Clock3 size={26} /><strong>No proposals yet</strong><span>Upload inventory and wait for Admin approval before generating a proposal.</span></div>
          ) : (
            <div className="gc-proposal-list">
              {proposals.map((p) => (
                <article className="gc-proposal-card" key={p.proposal_id}>
                  <div className="gc-proposal-heading">
                    <div><span className="section-label">{p.proposal_id}</span><h3>{p.instance_type}</h3></div>
                    <span className={`status-badge ${p.status === "APPROVED" ? "success" : p.status === "REJECTED" ? "danger" : "warning"}`}>{p.status.replace(/_/g, " ")}</span>
                  </div>
                  <div className="gc-spec-grid">
                    <div><span>vCPU</span><strong>{p.vcpu}</strong></div>
                    <div><span>Memory</span><strong>{p.memory} GB</strong></div>
                    <div><span>Disk</span><strong>{p.disk} GB</strong></div>
                    <div><span>Healthy servers</span><strong>{p.source_server_count}</strong></div>
                  </div>
                  <p><strong>CPU target:</strong> {p.target_cpu_utilization_min}%–{p.target_cpu_utilization_max}%</p>
                  <p><strong>Memory target:</strong> {p.target_memory_utilization_min}%–{p.target_memory_utilization_max}%</p>
                  {p.ai_reasoning && <details className="gc-reasoning"><summary><Sparkles size={14} /> AI reasoning</summary><p>{p.ai_reasoning}</p></details>}
                  {p.status === "PENDING_APPROVAL" && <p className="gc-pending-note">Awaiting Admin review. This proposal is not active.</p>}
                  {p.status === "APPROVED" && <p className="gc-success">Approved and active.</p>}
                  {p.status === "REJECTED" && <p className="gc-error">Rejected: {p.rejection_reason || "No reason provided."}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
