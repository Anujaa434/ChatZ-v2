import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";
import { AuthProvider } from "./contexts/AuthContext";

// ── ErrorBoundary: catches ANY runtime crash and shows the error on screen
// instead of a blank white page. Remove after debugging is done.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "#0e0e1c", color: "#e2e2f4",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "40px", fontFamily: "monospace",
          textAlign: "left"
        }}>
          <div style={{ fontSize: 28, marginBottom: 16 }}>⚠️ App Crashed</div>
          <div style={{
            background: "#1a1a2e", border: "1px solid #e05555", borderRadius: 10,
            padding: "20px 24px", maxWidth: 700, width: "100%",
            fontSize: 12, lineHeight: 1.6, overflowX: "auto"
          }}>
            <div style={{ color: "#f87171", fontWeight: 700, marginBottom: 8 }}>
              {this.state.error?.name}: {this.state.error?.message}
            </div>
            <pre style={{ color: "#94a3b8", margin: 0, whiteSpace: "pre-wrap" }}>
              {this.state.error?.stack}
            </pre>
          </div>
          <button
            style={{ marginTop: 20, padding: "10px 24px", borderRadius: 8, border: "none",
              background: "#5227FF", color: "#fff", cursor: "pointer", fontSize: 14 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try to recover
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
