
import { motion } from "framer-motion";
import type { ElementType } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  HeartPulse,
  History,
  Home,
  Lightbulb,
  LogOut,
  MessageSquare,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  role: "admin" | "user";
  active: string;
}

interface SidebarItem {
  label: string;
  icon: ElementType;
  path: string;
}

function Sidebar({ role, active }: SidebarProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Use the authenticated backend profile as the source of truth.
  const displayRole = (
    user?.role || role || "user"
  ).toUpperCase();

  const adminItems: SidebarItem[] = [
    { label: "Command Center", icon: Home, path: "/admin" },
    { label: "Servers", icon: Database, path: "/admin/servers" },
    { label: "Analysis", icon: BarChart3, path: "/admin/analysis" },
    { label: "Alerts", icon: AlertTriangle, path: "/admin/alerts" },
    { label: "Health & Risk", icon: HeartPulse, path: "/admin/health" },
    { label: "AI Recommendations", icon: Lightbulb, path: "/admin/recommendations" },
    { label: "Remediation", icon: Wrench, path: "/admin/remediation" },
    { label: "Requests & Approvals", icon: ClipboardCheck, path: "/admin/requests" },
    { label: "Scheduled Jobs", icon: Activity, path: "/admin/scheduled-jobs" },
    { label: "Golden Configuration", icon: Shield, path: "/admin/golden-configuration" },
    { label: "Decision Memory", icon: BrainCircuit, path: "/admin/decision-memory" },
    { label: "What-If Simulation", icon: SlidersHorizontal, path: "/admin/simulation" },
    { label: "Analytics", icon: Gauge, path: "/admin/analytics" },
    { label: "Audit Logs", icon: History, path: "/admin/audit-logs" },
    { label: "Reports", icon: FileText, path: "/admin/reports" },
    { label: "AI Assistant", icon: Sparkles, path: "/admin/ai-assistant" },
    { label: "Messages", icon: MessageSquare, path: "/admin/messages" },
  ];

  const userItems: SidebarItem[] = [
    { label: "Dashboard", icon: Home, path: "/user" },
    { label: "Servers", icon: Database, path: "/user/servers" },
    { label: "Analysis", icon: BarChart3, path: "/user/analysis" },
    { label: "Alerts", icon: AlertTriangle, path: "/user/alerts" },
    { label: "Health", icon: HeartPulse, path: "/user/health" },
    { label: "AI Recommendations", icon: Lightbulb, path: "/user/recommendations" },
    { label: "Remediation", icon: Wrench, path: "/user/remediation" },
    { label: "My Requests", icon: ClipboardCheck, path: "/user/requests" },
    { label: "Golden Configuration", icon: Shield, path: "/user/golden-configuration" },
    { label: "Scheduled Jobs", icon: Activity, path: "/user/scheduled-jobs" },
    { label: "What-If Simulation", icon: SlidersHorizontal, path: "/user/simulation" },
    { label: "Analytics", icon: Gauge, path: "/user/analytics" },
    { label: "Reports", icon: FileText, path: "/user/reports" },
    { label: "AI Assistant", icon: Sparkles, path: "/user/ai-assistant" },
    { label: "Messages", icon: MessageSquare, path: "/user/messages" },
  ];

  const items =
    displayRole === "ADMIN" ? adminItems : userItems;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <BrainCircuit size={24} />
        </div>

        <div>
          <strong>InfraMind</strong>
          <span>AI Infrastructure</span>
        </div>
      </div>

      {/* LOGGED-IN PROFILE */}

      <div className="sidebar-user-profile">
        <div className="sidebar-profile-icon">
          {displayRole === "ADMIN" ? (
            <Shield size={19} />
          ) : (
            <User size={19} />
          )}
        </div>

        <div className="sidebar-profile-info">
          <span>LOGGED IN AS</span>
          <strong>{displayRole}</strong>
          <small>
            {user?.email || "Authenticated account"}
          </small>
        </div>

        <div
          className="sidebar-online-indicator"
          title="Session active"
        />
      </div>

      {/* SECTION TITLE */}

      <div className="sidebar-section-title">
        {displayRole === "ADMIN"
          ? "COMMAND CENTER"
          : "WORKSPACE"}
      </div>

      {/* NAVIGATION */}

      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;

          return (
            <motion.button
              key={item.label}
              type="button"
              className={`sidebar-item ${isActive ? "active" : ""}`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation(item.path)}
            >
              {isActive && (
                <motion.div
                  className="active-indicator"
                  layoutId={`activeIndicator-${displayRole}`}
                />
              )}

              <Icon size={18} />

              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* BOTTOM */}

      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-item logout-item"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
