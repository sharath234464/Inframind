import "./App.css";
import "./styles/FeatureWorkflows.css";

import { AnimatePresence, motion } from "framer-motion";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AuditLogs from "./pages/admin/AuditLogs";
import DecisionMemory from "./pages/admin/DecisionMemory";
import GoldenConfiguration from "./pages/admin/GoldenConfiguration";
import GoldenConfigurationRequest from "./pages/user/GoldenConfigurationRequest";
import ScheduledJobs from "./pages/admin/ScheduledJobs";

import UserDashboard from "./pages/user/UserDashboard";
import Servers from "./pages/user/Servers";
import Health from "./pages/user/Health";
import Alerts from "./pages/user/Alerts";
import Analysis from "./pages/user/Analysis";
import Remediation from "./pages/user/Remediation";
import Requests from "./pages/user/Requests";
import Analytics from "./pages/user/Analytics";
import AIAssistant from "./pages/user/AIAssistant";
import AIRecommendations from "./pages/user/AIRecommendations";
import Simulation from "./pages/user/Simulation";
import Reports from "./pages/user/Reports";
import SupportChat from "./pages/user/SupportChat";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";


function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        style={{ minHeight: "100vh" }}
      >
        <Routes location={location}>

          {/* =====================================================
              PUBLIC AUTHENTICATION
              ===================================================== */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />


          {/* =====================================================
              ADMIN WORKSPACE
              ===================================================== */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/servers"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Servers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analysis"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Analysis />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/alerts"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Alerts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/health"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Health />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/recommendations"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AIRecommendations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/remediation"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Remediation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Requests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/scheduled-jobs"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <ScheduledJobs role="admin" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/golden-configuration"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <GoldenConfiguration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/decision-memory"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <DecisionMemory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/simulation"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Simulation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Analytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AuditLogs />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <SupportChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-assistant"
            element={
              <ProtectedRoute allowedRole="ADMIN">
                <AIAssistant />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              USER WORKSPACE
              ===================================================== */}

          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRole="USER">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/servers"
            element={
              <ProtectedRoute allowedRole="USER">
                <Servers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/analysis"
            element={
              <ProtectedRoute allowedRole="USER">
                <Analysis />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/alerts"
            element={
              <ProtectedRoute allowedRole="USER">
                <Alerts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/health"
            element={
              <ProtectedRoute allowedRole="USER">
                <Health />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/recommendations"
            element={
              <ProtectedRoute allowedRole="USER">
                <AIRecommendations />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/remediation"
            element={
              <ProtectedRoute allowedRole="USER">
                <Remediation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/golden-configuration"
            element={
              <ProtectedRoute allowedRole="USER">
                <GoldenConfigurationRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/requests"
            element={
              <ProtectedRoute allowedRole="USER">
                <Requests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/simulation"
            element={
              <ProtectedRoute allowedRole="USER">
                <Simulation />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/analytics"
            element={
              <ProtectedRoute allowedRole="USER">
                <Analytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/reports"
            element={
              <ProtectedRoute allowedRole="USER">
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/messages"
            element={
              <ProtectedRoute allowedRole="USER">
                <SupportChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/ai-assistant"
            element={
              <ProtectedRoute allowedRole="USER">
                <AIAssistant />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/scheduled-jobs"
            element={
              <ProtectedRoute allowedRole="USER">
                <ScheduledJobs role="user" />
              </ProtectedRoute>
            }
          />


          {/* =====================================================
              UNKNOWN ROUTES
              ===================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;