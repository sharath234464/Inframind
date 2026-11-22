import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
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

import api from "../../services/api";
import "../../styles/Auth.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        name: cleanName,
        email: cleanEmail,
        password,
      });

      setSuccess(
        "User account created successfully. Redirecting to login..."
      );

      window.setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      console.error("Registration error:", err);

      const detail = err?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(
          detail
            .map((item: any) => item?.msg || "Invalid registration details.")
            .join(" ")
        );
      } else if (err?.response?.status === 409) {
        setError("An account with this email already exists.");
      } else if (!err?.response) {
        setError("Cannot connect to FastAPI. Make sure the backend is running.");
      } else {
        setError("Unable to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-grid" />
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-orb auth-orb-three" />
      </div>

      <motion.header
        className="auth-navbar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/login" className="auth-brand">
          <div className="auth-brand-icon">
            <BrainCircuit size={23} />
          </div>
          <div>
            <div className="auth-brand-name">
              INFRA<span>MIND</span>
            </div>
            <div className="auth-brand-caption">ENTERPRISE AI</div>
          </div>
        </Link>

        <div className="auth-navbar-status">
          <span />
          Secure account registration
        </div>
      </motion.header>

      <main className="auth-main">
        <motion.section
          className="auth-hero"
          initial={{ opacity: 0, x: -45 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="auth-eyebrow">
            <Sparkles size={14} />
            JOIN THE INTELLIGENCE
          </div>

          <h1>
            Build your
            <br />
            <span>workspace.</span>
          </h1>

          <p className="auth-hero-description">
            Create an infrastructure workspace with intelligent resource analysis,
            compliance monitoring, health intelligence and AI-powered operational decisions.
          </p>

          <div className="auth-feature-list">
            <motion.div className="auth-feature" whileHover={{ x: 8 }}>
              <div className="auth-feature-icon"><BrainCircuit size={20} /></div>
              <div>
                <h3>Resource Intelligence</h3>
                <p>Monitor allocation and utilization across your infrastructure.</p>
              </div>
            </motion.div>

            <motion.div className="auth-feature" whileHover={{ x: 8 }}>
              <div className="auth-feature-icon"><ShieldCheck size={20} /></div>
              <div>
                <h3>Secure Workspace</h3>
                <p>Role-based access keeps infrastructure operations protected.</p>
              </div>
            </motion.div>

            <motion.div className="auth-feature" whileHover={{ x: 8 }}>
              <div className="auth-feature-icon"><Sparkles size={20} /></div>
              <div>
                <h3>AI-Powered Operations</h3>
                <p>Turn infrastructure data into intelligent operational decisions.</p>
              </div>
            </motion.div>
          </div>

          <div className="auth-hero-footer">
            <CheckCircle2 size={15} />
            Secure user registration
          </div>
        </motion.section>

        <motion.section
          className="auth-card"
          initial={{ opacity: 0, x: 45, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="auth-card-header">
            <div className="auth-card-icon">
              <UserRound size={22} />
            </div>
            <div className="auth-secure">
              <span />
              USER REGISTRATION
            </div>
          </div>

          <div className="auth-card-heading">
            <div className="auth-card-eyebrow">GET STARTED</div>
            <h2>Create User Account</h2>
            <p>Register an account and access the infrastructure workspace.</p>
          </div>

          <div className="auth-role-note">
            <ShieldCheck size={14} />
            New public registrations are created as USER accounts by the existing backend. Administrator accounts are managed by the backend.
          </div>

          {error && (
            <motion.div
              className="auth-error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              className="auth-success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {success}
            </motion.div>
          )}

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>
              <div className="auth-input">
                <UserRound size={18} />
                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email address</label>
              <div className="auth-input">
                <Mail size={18} />
                <input
                  id="register-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <div className="auth-input">
                <LockKeyhole size={18} />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm">Confirm password</label>
              <div className="auth-input">
                <LockKeyhole size={18} />
                <input
                  id="register-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              className="auth-submit"
              type="submit"
              disabled={isLoading}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <span className="button-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <div className="auth-divider"><span>OR</span></div>

          <div className="auth-bottom-link">
            Already have an account?
            <Link to="/login">Sign in</Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

export default Register;
