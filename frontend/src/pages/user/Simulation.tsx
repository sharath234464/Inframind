import { useEffect, useState } from "react";
import {
  SlidersHorizontal,
  Play,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

import { postFirstAvailable } from "../../services/endpointFallback";
import {
  getAllHealthScores,
  type HealthRecord,
} from "../../services/healthService";
import Sidebar from "../../components/layout/Sidebar";
import { useAuth } from "../../context/AuthContext";

interface ResourceValues {
  vcpu?: number;
  memory?: number;
  disk?: number;
}

interface SimulationResult {
  server_id: string;
  instance_type?: string;
  current: {
    resources: ResourceValues;
    allocation_state?: string;
    utilization_state?: string;
    classification?: string;
  };
  simulated: {
    resources: ResourceValues;
    estimated_cpu_utilization?: number;
    estimated_memory_utilization?: number;
    estimated_disk_utilization?: number;
    allocation_state?: string;
    utilization_state?: string;
    classification?: string;
  };
  allocation_change?: string;
  utilization_change?: string;
  current_classification?: string;
  simulated_classification?: string;
  recommendation?: string;
  reason?: string | null;
  note?: string;
}

function formatValue(value?: number, suffix = "") {
  if (value === undefined || value === null) return "N/A";
  return `${Number(value).toLocaleString()}${suffix}`;
}

function statusClass(value?: string) {
  const text = (value || "").toLowerCase();

  if (text.includes("over allocated") || text.includes("over-utilized")) {
    return "simulation-status-warning";
  }

  if (text.includes("under allocated") || text.includes("under-utilized")) {
    return "simulation-status-warning";
  }

  if (text.includes("compliant") || text.includes("properly")) {
    return "simulation-status-success";
  }

  return "simulation-status-neutral";
}

function Simulation() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";

  const [serverId, setServerId] = useState("");
  const [availableServers, setAvailableServers] = useState<HealthRecord[]>([]);
  const [vcpu, setVcpu] = useState("");
  const [memory, setMemory] = useState("");
  const [disk, setDisk] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllHealthScores()
      .then((records) => {
        setAvailableServers(records);
        if (records.length > 0) {
          setServerId((current) => current || records[0].server_id);
        }
      })
      .catch((loadError) => {
        console.error("Unable to load server IDs:", loadError);
      });
  }, []);

  const runSimulation = async () => {
    if (!serverId.trim()) {
      setError("Please enter a server ID.");
      return;
    }

    const numericValues = [
      ["vCPU", vcpu],
      ["Memory", memory],
      ["Disk", disk],
    ] as const;

    for (const [label, value] of numericValues) {
      if (value.trim() && (!Number.isFinite(Number(value)) || Number(value) <= 0)) {
        setError(`${label} must be a positive number.`);
        return;
      }
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await postFirstAvailable<SimulationResult>(
  ["/simulation/resource"],
        {
          server_id: serverId.trim().toUpperCase(),
          vcpu: vcpu ? Number(vcpu) : undefined,
          memory: memory ? Number(memory) : undefined,
          disk: disk ? Number(disk) : undefined,
        }
      );

      if (!data || !data.current || !data.simulated) {
        throw new Error("The simulation API returned an incomplete result.");
      }

      setResult(data);
    } catch (err: any) {
      console.error("Simulation failed:", err);
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item: any) => item.msg || "Invalid input").join(", ")
            : err?.message || "Unable to run simulation. Check the server ID."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        role={isAdmin ? "admin" : "user"}
        active="What-If Simulation"
      />

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              {isAdmin ? "COMMAND CENTER" : "WORKSPACE"}
            </div>
            <h1>What-If Simulation</h1>
            <p>
              Simulate infrastructure resource changes before applying
              them to a real server. No live configuration is changed.
            </p>
          </div>
        </div>

        {error && (
          <div className="analysis-error">
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        <div className="analysis-grid">
          <div className="analysis-card">
            <div className="section-label">SIMULATION INPUT</div>
            <h2>Resource Scenario</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              <div className="auth-field">
                <label>Server ID</label>
                <div className="health-search">
                  <Server size={16} />
                  <input
                    value={serverId}
                    onChange={(event) => setServerId(event.target.value)}
                    placeholder="Enter an existing server ID"
                    list="simulation-server-ids"
                    autoComplete="off"
                  />
                  <datalist id="simulation-server-ids">
                    {availableServers.map((server) => (
                      <option key={server.server_id} value={server.server_id} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="auth-field">
                <label>vCPU</label>
                <div className="health-search">
                  <Cpu size={16} />
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={vcpu}
                    onChange={(event) => setVcpu(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Memory (GB)</label>
                <div className="health-search">
                  <MemoryStick size={16} />
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={memory}
                    onChange={(event) => setMemory(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Disk (GB)</label>
                <div className="health-search">
                  <HardDrive size={16} />
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={disk}
                    onChange={(event) => setDisk(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <button
                className="primary-button"
                type="button"
                onClick={runSimulation}
                disabled={loading}
              >
                <Play size={16} />
                {loading ? "Running..." : "Run Simulation"}
              </button>
            </div>
          </div>

          <div className="analysis-card">
            <div className="section-label">SIMULATION RESULT</div>
            <h2>Predicted Impact</h2>

            {!result ? (
              <div className="admin-feature-empty">
                <SlidersHorizontal size={34} />
                <strong>No simulation yet</strong>
                <span>
                  Configure a scenario and run the simulation to see
                  the predicted impact.
                </span>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CheckCircle2 size={22} color="#22c55e" />
                  <strong>Simulation completed</strong>
                </div>

                <div className="simulation-result-grid">
                  <div className="simulation-metric">
                    <span>Estimated CPU utilization</span>
                    <strong>
                      {formatValue(
                        result.simulated.estimated_cpu_utilization,
                        "%"
                      )}
                    </strong>
                  </div>

                  <div className="simulation-metric">
                    <span>Estimated memory utilization</span>
                    <strong>
                      {formatValue(
                        result.simulated.estimated_memory_utilization,
                        "%"
                      )}
                    </strong>
                  </div>
                </div>

                <section className="simulation-result-section">
                  <h3>
                    <Activity size={17} /> Resource comparison
                  </h3>

                  <div className="simulation-table-wrap">
                    <table className="simulation-table">
                      <thead>
                        <tr>
                          <th>Resource</th>
                          <th>Current</th>
                          <th>Simulated</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>vCPU</td>
                          <td>{formatValue(result.current.resources?.vcpu)}</td>
                          <td>{formatValue(result.simulated.resources?.vcpu)}</td>
                        </tr>
                        <tr>
                          <td>Memory</td>
                          <td>{formatValue(result.current.resources?.memory, " GB")}</td>
                          <td>{formatValue(result.simulated.resources?.memory, " GB")}</td>
                        </tr>
                        <tr>
                          <td>Disk</td>
                          <td>{formatValue(result.current.resources?.disk, " GB")}</td>
                          <td>{formatValue(result.simulated.resources?.disk, " GB")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="simulation-result-section">
                  <h3>
                    <ShieldCheck size={17} /> Classification impact
                  </h3>

                  <div className="simulation-classification">
                    <div>
                      <span>Current classification</span>
                      <strong className={statusClass(result.current_classification)}>
                        {result.current_classification || result.current.classification || "N/A"}
                      </strong>
                    </div>

                    <ArrowRight size={20} />

                    <div>
                      <span>Simulated classification</span>
                      <strong className={statusClass(result.simulated_classification)}>
                        {result.simulated_classification || result.simulated.classification || "N/A"}
                      </strong>
                    </div>
                  </div>

                  <p>
                    <b>Allocation:</b>{" "}
                    {result.allocation_change || "No change reported"}
                  </p>
                  <p>
                    <b>Utilization:</b>{" "}
                    {result.utilization_change || "No change reported"}
                  </p>
                </section>

                {result.recommendation && (
                  <section className="simulation-recommendation">
                    <h3>Recommendation</h3>
                    <p>{result.recommendation}</p>
                  </section>
                )}

                {result.note && (
                  <p className="simulation-note">{result.note}</p>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Simulation;