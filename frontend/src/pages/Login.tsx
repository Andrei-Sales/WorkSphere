import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

import "./css/Login.css";

export default function Login() {
  const navigate = useNavigate();

  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);

      navigate("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        {/* LEFT PANEL */}
        <section className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-brand-mark">W</div>

            <div className="login-brand-name">WorkSphere</div>

            <div className="login-brand-tagline">
              Employee Management System
            </div>

            <div className="login-brand-description">
              Manage employees, departments, and user accounts from one secure
              workspace.
            </div>

            <div className="login-feature-list">
              <div className="login-feature">
                <span className="login-feature-icon">✓</span>

                <span>Centralized employee management</span>
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">✓</span>

                <span>Department and user administration</span>
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">✓</span>

                <span>Role-based access control</span>
              </div>
            </div>
          </div>

          <div className="login-brand-footer">WorkSphere</div>
        </section>

        {/* RIGHT PANEL */}
        <section className="login-form-panel">
          <div className="login-form-container">
            <div className="login-mobile-brand">
              <div className="login-mobile-brand-mark">W</div>

              <div>
                <div className="login-mobile-brand-name">WorkSphere</div>

                <div className="login-mobile-brand-subtitle">
                  Employee Management
                </div>
              </div>
            </div>

            <div className="login-heading">
              <div className="login-eyebrow">SECURE ACCESS</div>

              <h1>Welcome back</h1>

              <p>Sign in to continue to your WorkSphere account.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="email" className="login-label">
                  Email address
                </label>

                <div className="login-input-wrapper">
                  <span className="login-input-icon" aria-hidden="true">
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    className="form-control login-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="login-field">
                <div className="login-label-row">
                  <label htmlFor="password" className="login-label">
                    Password
                  </label>
                </div>

                <div className="login-input-wrapper">
                  <span className="login-input-icon" aria-hidden="true">
                    •
                  </span>

                  <input
                    id="password"
                    type="password"
                    className="form-control login-input"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  <span className="login-error-icon">!</span>

                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn login-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    />

                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <span className="login-submit-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="login-security-note">
              <span className="login-security-icon">🔒</span>

              <span>Your session is protected with secure authentication.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
