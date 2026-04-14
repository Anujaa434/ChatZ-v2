// frontend/src/pages/auth/Login.jsx
// Phase 2 upgrade: handles new backend error codes (423 lockout, 401 bad creds)
// Connects to /api/auth/login → { accessToken, refreshToken, user }
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/auth.css";

// ── Map backend HTTP status codes to user-facing messages ────────────────
function getLoginError(err) {
  const status = err?.response?.status;
  const msg    = err?.response?.data?.error || err?.response?.data?.message || "";

  if (status === 423) {
    // Brute-force lockout
    const wait = err?.response?.data?.lockoutMinutes;
    return wait
      ? `Account temporarily locked. Try again in ${wait} minute${wait > 1 ? "s" : ""}.`
      : "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.";
  }
  if (status === 401) return "Incorrect email or password. Please try again.";
  if (status === 403) return msg || "Your account is not verified. Check your email.";
  if (status === 429) return "Too many requests. Please slow down and try again.";
  return msg || "Something went wrong. Please try again.";
}

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [form, setForm]                 = useState({ email: "", password: "" });
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // clear error on typing
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(getLoginError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ukl-auth-page">
      {/* ── Animated background orbs ─────────────────────── */}
      <div className="ukl-bg-orb ukl-bg-orb--1" />
      <div className="ukl-bg-orb ukl-bg-orb--2" />

      <div className="ukl-card" style={{ width: "100%", maxWidth: 440, padding: "48px 40px" }}>
        {/* ambient glow */}
        <div className="ukl-card-glow" />

        {/* ── Logo ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <div className="ukl-logo">UKL</div>
        </div>

        {/* ── Heading ── */}
        <div className="ukl-title">Welcome back</div>
        <div className="ukl-sub" style={{ marginBottom: 28 }}>
          Sign in to your knowledge library
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="ukl-error" style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Email */}
          <input
            className="ukl-field"
            id="login-email"
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            autoFocus
          />

          {/* Password */}
          <div className="ukl-field-wrap">
            <input
              className="ukl-field"
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="ukl-eye-toggle"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword
                ? <EyeOff size={16} aria-hidden="true" />
                : <Eye    size={16} aria-hidden="true" />}
            </button>
          </div>

          {/* Forgot */}
          <div style={{ textAlign: "right", marginTop: -4 }}>
            <Link to="/forgot-password" className="ukl-forgot">
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit"
            className={`ukl-btn${loading ? " ukl-btn--loading" : ""}`}
            disabled={loading}
            style={{ marginTop: 6 }}
          >
            {loading
              ? <><span className="ukl-spinner" /> Signing in…</>
              : "Sign in"}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="ukl-divider" style={{ margin: "18px 0" }}>
          <div className="ukl-divider-line" />
          <span className="ukl-divider-text">or continue with</span>
          <div className="ukl-divider-line" />
        </div>

        {/* ── Google ── */}
        <button className="ukl-google-btn" type="button" id="login-google">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* ── Footer ── */}
        <p className="ukl-footer-text" style={{ marginTop: 18 }}>
          Don't have an account?{" "}
          <Link to="/signup">Create one →</Link>
        </p>
      </div>
    </div>
  );
}
