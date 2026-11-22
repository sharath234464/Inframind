import { useEffect, useState } from "react";
import {
  BrainCircuit,
  RefreshCw,
  Database,
  Clock3,
} from "lucide-react";
import { motion } from "framer-motion";

import { getFirstAvailable } from "../../services/endpointFallback";
import Sidebar from "../../components/layout/Sidebar";

interface MemoryRecord {
  memory_id?: string;
  decision?: string;
  context?: string;
  reasoning?: string;
  created_at?: string;
}

function DecisionMemory() {
  const [memories, setMemories] =
    useState<MemoryRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadMemories = async () => {
    try {
      const data = await getFirstAvailable<any>([
        "/admin/decision-memory",
        "/decision-memory",
      ]);

      if (Array.isArray(data)) {
        setMemories(data);
      } else if (
        Array.isArray(data?.memories)
      ) {
        setMemories(data.memories);
      } else if (
        Array.isArray(data?.data)
      ) {
        setMemories(data.data);
      } else {
        setMemories([]);
      }
    } catch (error) {
      console.error(error);
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar
        role="admin"
        active="Decision Memory"
      />

      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              COMMAND CENTER
            </div>

            <h1>
              Decision Memory
            </h1>

            <p>
              Review historical infrastructure
              decisions and reasoning used by
              the AI system.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadMemories}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="admin-feature-grid">
          <div className="admin-feature-card">
            <BrainCircuit size={22} />
            <span>
              Stored Decisions
            </span>
            <strong>
              {memories.length}
            </strong>
          </div>

          <div className="admin-feature-card">
            <Database size={22} />
            <span>
              Memory System
            </span>
            <strong>
              Active
            </strong>
          </div>
        </div>

        <div className="admin-feature-panel">
          <div className="section-label">
            AI MEMORY
          </div>

          <h2>
            Historical Decisions
          </h2>

          {loading ? (
            <div className="admin-feature-empty">
              Loading decision memory...
            </div>
          ) : memories.length === 0 ? (
            <div className="admin-feature-empty">
              <BrainCircuit size={30} />

              <strong>
                No decision memories
              </strong>

              <span>
                Historical AI decisions will
                appear here.
              </span>
            </div>
          ) : (
            <div className="memory-list">
              {memories.map(
                (memory, index) => (
                  <motion.div
                    className="memory-card"
                    key={
                      memory.memory_id ||
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
                    <div className="memory-icon">
                      <BrainCircuit
                        size={18}
                      />
                    </div>

                    <div className="memory-content">
                      <strong>
                        {memory.memory_id ||
                          "Decision Memory"}
                      </strong>

                      <span>
                        Decision:{" "}
                        {memory.decision ||
                          "—"}
                      </span>

                      <p>
                        {memory.reasoning ||
                          memory.context ||
                          "Historical infrastructure decision."}
                      </p>
                    </div>

                    <Clock3 size={15} />
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

export default DecisionMemory;