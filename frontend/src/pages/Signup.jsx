// frontend/src/pages/auth/Signup.jsx
// Phase 2 upgrade: connects to new backend → { accessToken, refreshToken, message, user }
// On success: stores both tokens, redirects to /dashboard immediately  
// (no email verification required in current backend build)
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../../api/auth.axios";
import { setAuthToken } from "../../api/axios";
import "../../styles/auth.css";

const STEPS = 3;

// ── Password strength validator ────────────────────────────────────────────
function validatePassword(pw) {
  if (!pw) return "";
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw)
    ? ""
    : "Min 8 chars — uppercase, lowercase, number & special character required";
}

// ── Map backend errors to user-facing messages ─────────────────────────────
function getSignupError(err) {
  const status = err?.response?.status;
  const msg    = err?.response?.data?.error || err?.response?.data?.message || "";
  if (status === 409) return "An account with this email already exists.";
  if (status === 400) return msg || "Please check your details and try again.";
  return msg || "Something went wrong. Please try again.";
}

export default function Signup() {
  const navigate = useNavigate();

  // form fields
  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [agreed,    setAgreed]    = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [showCPw,   setShowCPw]   = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [cpwError,  setCpwError]  = useState("");

  // submission
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // visual progress step (cosmetic 3-dot bar)
  const visualStep = !name || !email ? 1 : !password || !confirmPw ? 2 : 3;

  function handlePasswordChange(v) {
    setPassword(v);
    setPwError(validatePassword(v));
    if (confirmPw) setCpwError(v !== confirmPw ? "Passwords do not match" : "");
  }

  function handleConfirmChange(v) {
    setConfirmPw(v);
    setCpwError(v !== password ? "Passwords do not match" : "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // client-side guards
    if (!name.trim() || !email || !password || !confirmPw) {
      setError("Please fill in all fields.");
      return;
    }
    const pErr = validatePassword(password);
    if (pErr) { setError(pErr); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (!agreed) { setError("Please accept the Terms of Service and Privacy Policy."); return; }

    setBusy(true);
    try {
      const data = await signup({ name: name.trim(), email, password });

      // ── Backend Phase 2 response shape: ──────────────────────────────
      // { message, accessToken, refreshToken, user }
      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        setAuthToken(data.accessToken);
        setSuccessMsg("Account created! Taking you in…");
        setTimeout(() => navigate("/dashboard"), 900);
      } else {
        // Fallback: backend returned a message but no token (e.g. verify email flow later)
        setSuccessMsg(data.message || "Account created! Please check your email.");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      setError(getSignupError(err));
    } finally {
      setBusy(false);
    }
  }

  const dotClass = (n) => {
    if (n < visualStep)  return "ukl-prog-dot done";
    if (n === visualStep) return "ukl-prog-dot active";
    return "ukl-prog-dot todo";
  };

  return (
    <div className="ukl-auth-page">
      {/* ── Animated background orbs ─────────────────────── */}
      <div className="ukl-bg-orb ukl-bg-orb--1" />
      <div className="ukl-bg-orb ukl-bg-orb--2" />

      <div className="ukl-card" style={{ width: "100%", maxWidth: 500, padding: "44px 44px" }}>
        <div className="ukl-card-glow" />

        {/* ── Progress dots ── */}
        <div className="ukl-prog-bar">
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className={dotClass(i + 1)} />
          ))}
        </div>

        {/* ── Logo ── */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div className="ukl-logo">UKL</div>
        </div>

        {/* ── Heading ── */}
        <div className="ukl-title">Create your account</div>
        <div className="ukl-sub" style={{ marginBottom: 24 }}>
          Set up your knowledge library
        </div>

        {/* ── Messages ── */}
        {error      && <div className="ukl-error"   style={{ marginBottom: 14 }}>{error}</div>}
        {successMsg && <div className="ukl-success" style={{ marginBottom: 14 }}>{successMsg}</div>}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Full name */}
          <input
            id="signup-name"
            className="ukl-field"
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => { setName(e.target.value); if(error) setError(null); }}
            autoComplete="name"
            autoFocus
          />

          {/* Email */}
          <input
            id="signup-email"
            className="ukl-field"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if(error) setError(null); }}
            autoComplete="email"
          />

          {/* Password */}
          <div className="ukl-field-wrap">
            <input
              id="signup-password"
              className={`ukl-field${pwError ? " ukl-input-error" : ""}`}
              type={showPw ? "text" : "password"}
              placeholder="Create password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="ukl-eye-toggle"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {pwError && <div className="ukl-field-error">{pwError}</div>}

          {/* Confirm password */}
          <div className="ukl-field-wrap">
            <input
              id="signup-confirm"
              className={`ukl-field${cpwError ? " ukl-input-error" : ""}`}
              type={showCPw ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPw}
              onChange={(e) => handleConfirmChange(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="ukl-eye-toggle"
              onClick={() => setShowCPw((s) => !s)}
              aria-label={showCPw ? "Hide password" : "Show password"}
            >
              {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {cpwError && <div className="ukl-field-error">{cpwError}</div>}

          {/* Terms */}
          <div className="ukl-terms-row">
            <button
              type="button"
              id="signup-terms-toggle"
              className="ukl-checkbox"
              style={{
                background: agreed ? "var(--ukl-accent)" : "#242434",
                border: agreed ? "none" : "1px solid #343550",
              }}
              onClick={() => setAgreed((a) => !a)}
              aria-pressed={agreed}
              aria-label="Agree to terms"
            >
              {agreed && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
                  <path d="M1 3.5L3.5 6L8 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className="ukl-terms-text">
              I agree to the{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </span>
          </div>

          {/* Submit */}
          <button
            id="signup-submit"
            type="submit"
            className={`ukl-btn${busy ? " ukl-btn--loading" : ""}`}
            disabled={busy || !!pwError || !!cpwError}
            style={{ marginTop: 8 }}
          >
            {busy
              ? <><span className="ukl-spinner" /> Creating account…</>
              : "Create account →"}
          </button>
        </form>

        {/* ── Footer ── */}
        <p className="ukl-footer-text" style={{ marginTop: 14 }}>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
