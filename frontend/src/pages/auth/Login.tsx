import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "../../context/AuthContext";
import "../../styles/Auth.css";

function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"USER" | "ADMIN">("USER");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return (
      <Navigate
        to={
          user.role.toUpperCase() === "ADMIN"
            ? "/admin"
            : "/user"
        }
        replace
      />
    );
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email address and password."
      );
      return;
    }

    setLoading(true);

    try {
      const currentUser = await login(
        email.trim(),
        password
      );

      const actualRole = currentUser.role.toUpperCase();
      if (actualRole !== selectedRole) {
        logout();
        setError(
          `This account is registered as ${actualRole}. Select ${actualRole === "ADMIN" ? "Admin Access" : "User Access"} and sign in again. Selecting a role does not create or promote an account.`
        );
        return;
      }
      navigate(actualRole === "ADMIN" ? "/admin" : "/user");
    } catch (err: any) {
      console.error("Login error:", err);

      setError(
        err?.response?.data?.detail ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* BACKGROUND */}

      <div className="auth-background">
        <div className="auth-grid" />

        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-orb auth-orb-three" />
      </div>

      {/* NAVBAR */}

      <motion.header
        className="auth-navbar"
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
      >
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <BrainCircuit size={23} />
          </div>

          <div>
            <div className="auth-brand-name">
              INFRA<span>MIND</span>
            </div>

            <div className="auth-brand-caption">
              ENTERPRISE AI
            </div>
          </div>
        </div>

        <div className="auth-navbar-status">
          <span />
          Infrastructure intelligence platform
        </div>
      </motion.header>

      {/* MAIN */}

      <main className="auth-main">

        {/* LEFT */}

        <motion.section
          className="auth-hero"
          initial={{
            opacity: 0,
            x: -45,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.8,
          }}
        >
          <div className="auth-eyebrow">
            <Sparkles size={14} />
            AI INFRASTRUCTURE INTELLIGENCE
          </div>

          <h1>
            Infrastructure
            <br />
            <span>Intelligence.</span>
          </h1>

          <p className="auth-hero-description">
            Intelligent infrastructure resource management
            powered by AI-driven analysis, compliance,
            health monitoring and automated remediation.
          </p>

          <div className="auth-feature-list">

            <motion.div
              className="auth-feature"
              whileHover={{ x: 8 }}
            >
              <div className="auth-feature-icon">
                <BrainCircuit size={20} />
              </div>

              <div>
                <h3>Resource Intelligence</h3>
                <p>
                  Analyze allocation and utilization
                  across your infrastructure.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="auth-feature"
              whileHover={{ x: 8 }}
            >
              <div className="auth-feature-icon">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h3>Compliance Control</h3>
                <p>
                  Compare infrastructure against
                  approved Golden Configuration.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="auth-feature"
              whileHover={{ x: 8 }}
            >
              <div className="auth-feature-icon">
                <Sparkles size={20} />
              </div>

              <div>
                <h3>AI-Powered Decisions</h3>
                <p>
                  Recommendations, remediation and
                  intelligent operational insights.
                </p>
              </div>
            </motion.div>

          </div>
        </motion.section>

        {/* RIGHT LOGIN */}

        <motion.section
          className="auth-card"
          initial={{
            opacity: 0,
            x: 45,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.8,
          }}
        >
          <div className="auth-card-header">

            <div className="auth-card-icon">
              <LockKeyhole size={22} />
            </div>

            <div className="auth-secure">
              <span />
              SECURE ACCESS
            </div>

          </div>

          <div className="auth-card-heading">
            <div className="auth-card-eyebrow">
              WELCOME BACK
            </div>

            <h2>
              Sign in to your workspace
            </h2>

            <p>
              Access your infrastructure command
              center and AI-powered operations.
            </p>
          </div>

          {/* ROLE INFORMATION */}

          <div className="auth-role-info" role="group" aria-label="Choose account type">
            <button
              type="button"
              className={`auth-role ${selectedRole === "ADMIN" ? "selected" : ""}`}
              aria-pressed={selectedRole === "ADMIN"}
              onClick={() => { setSelectedRole("ADMIN"); setError(""); }}
            >
              <div className="auth-role-icon admin"><ShieldCheck size={17} /></div>
              <div><strong>Admin Access</strong><span>Command center & enterprise controls</span></div>
            </button>
            <button
              type="button"
              className={`auth-role ${selectedRole === "USER" ? "selected" : ""}`}
              aria-pressed={selectedRole === "USER"}
              onClick={() => { setSelectedRole("USER"); setError(""); }}
            >
              <div className="auth-role-icon user"><UserRound size={17} /></div>
              <div><strong>User Access</strong><span>Infrastructure workspace & operations</span></div>
            </button>
          </div>

          <div className="auth-role-note">
            <CheckCircle2 size={14} />
            Select the account type that matches your registered account. Admin accounts are created by the administrator setup script.
          </div>

          {/* ERROR */}

          {error && (
            <motion.div
              className="auth-error"
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              {error}
            </motion.div>
          )}

          {/* FORM */}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            <div className="auth-field">

              <label htmlFor="login-email">
                Email address
              </label>

              <div className="auth-input">

                <Mail size={18} />

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@company.com"
                  autoComplete="email"
                />

              </div>

            </div>

            <div className="auth-field">

              <div className="auth-password-label">

                <label htmlFor="login-password">
                  Password
                </label>

                <button
                  type="button"
                  className="auth-forgot"
                  onClick={() =>
                    setError(
                      "Password recovery is not configured yet."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>

              <div className="auth-input">

                <LockKeyhole size={18} />

                <input
                  id="login-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>

            <motion.button
              className="auth-submit"
              type="submit"
              disabled={loading}
              whileHover={{
                scale: loading ? 1 : 1.015,
              }}
              whileTap={{
                scale: loading ? 1 : 0.98,
              }}
            >
              <span>
                {loading
                  ? "Authenticating..."
                  : "Sign in"}
              </span>

              {!loading && (
                <ArrowRight size={19} />
              )}
            </motion.button>

          </form>

          <div className="auth-divider">
            <span />
            <small>OR</small>
            <span />
          </div>

          <div className="auth-register">
            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create User Account
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="auth-security">
            <ShieldCheck size={15} />
            Secure role-based enterprise access
          </div>

        </motion.section>
      </main>

      <div className="auth-copyright">
        © 2026 InfraMind · Enterprise AI Infrastructure Management
      </div>
    </div>
  );
}

export default Login;