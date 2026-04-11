import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmail } from "../../api/auth.axios";
import "../../styles/auth.css";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [msg, setMsg] = useState("Verifying email...");

  useEffect(() => {
    async function verify() {
      try {
        const res = await verifyEmail(token);
        setMsg(res.message || "Email verified successfully");
      } catch {
        setMsg("Invalid or expired verification link");
      }
    }
    verify();
  }, [token]);

  return (
    <div className="signup-page">
      <div className="wrapper auth-card">
        <div className="form">
          <div className="heading">Email Verification</div>
          <p className="subheading">{msg}</p>

          <p className="switch-text">
            <Link to="/login" className="link-accent">Go to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
