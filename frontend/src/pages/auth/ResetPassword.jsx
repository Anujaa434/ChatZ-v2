import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../../api/auth.axios";
import "../../styles/auth.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [msg, setMsg] = useState("");

  const validatePassword = (pw) => {
    if (!pw) return "";
    const ok = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
    return ok
      ? ""
      : "Min 8 chars, include upper, lower, number, special";
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const err = validatePassword(password);
      if (err) {
        setMsg("Password does not meet requirements");
        return;
      }
      const res = await resetPassword(token, password);
      setMsg(res.message || "Password updated");
    } catch {
      setMsg("Invalid or expired link");
    }
  }

  return (
    <div className="signup-page">
      <div className="wrapper auth-card">
        <div className="form">
          <div className="heading">Reset Password</div>

          {msg && <p className="subheading">{msg}</p>}

          <form onSubmit={handleSubmit}>
            <div>
              <label>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPassword(v);
                    setPasswordError(validatePassword(v));
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    color: "#888",
                    padding: 4,
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              {password && passwordError && (
                <div className="error-text small" style={{ marginTop: 4 }}>{passwordError}</div>
              )}
            </div>

            <button className="primary-btn" disabled={!!passwordError}>Update Password</button>
          </form>

          <p className="switch-text">
            <Link to="/login" className="link-accent">Go to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
