import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth";
import "../../styles/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      setMsg(res?.message || "Reset link has been sent.");
    } catch {
      // intentionally generic (security best practice)
      setMsg("You'll receive an email with reset instructions shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="signup-page">
      <div className="wrapper auth-card">
        <div className="form">
          <div className="heading">Forgot Password</div>
          <p className="subheading">
            We'll send a secure reset link to your email address.
          </p>

          {msg && (
            <p className="subheading" style={{ fontSize: "0.82rem" }}>
              {msg}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div>
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="switch-text">
            <Link to="/login" className="link-accent">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
