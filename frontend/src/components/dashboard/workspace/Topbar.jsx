// frontend/src/components/dashboard/v5/Topbar.jsx
import { useState, useRef, useEffect } from "react";

export default function Topbar({
  theme, onToggleTheme,
  breadcrumbs = [],
  view, splitMode, onToggleSplit, activeChat,
  ctxPanelOpen, onToggleCtxPanel,
  sidebarCollapsed, onToggleSidebarCollapse,
  user, onLogout
}) {
  const initials = user?.name?.slice(0, 2).toUpperCase()
    || user?.email?.slice(0, 2).toUpperCase() || "U";
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropOpen) return;
    function handleClick(e) {
      if (!dropRef.current?.contains(e.target)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropOpen]);

  async function handleLogout() {
    setDropOpen(false);
    await onLogout();
  }

  return (
    <div className="topbar" style={{ left: 0, zIndex: 400 }}>
      <div className="topbar-left">
        <div className="logo-rail">
          <div className="logo">UKL</div>
        </div>
        {/* Sidebar collapse/expand toggle */}
        <button
          onClick={onToggleSidebarCollapse}
          title={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
          style={{
            width: 28, height: 28, borderRadius: 7, border: "1px solid var(--border)",
            background: "none", color: "var(--faint)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginLeft: 8, transition: "all .15s", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--chip-bg)"; e.currentTarget.style.color = "var(--text-dim)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--faint)"; }}
        >
          <svg viewBox="0 0 14 14" fill="none" style={{ width: 13, height: 13 }}>
            {sidebarCollapsed
              ? <><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="5" y1="2" x2="5" y2="12" stroke="currentColor" strokeWidth="1.2"/><path d="M7 5.5l2 1.5-2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></>
              : <><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="5" y1="2" x2="5" y2="12" stroke="currentColor" strokeWidth="1.2"/><path d="M9 5.5l-2 1.5 2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></>
            }
          </svg>
        </button>
        <div className="breadcrumb">
          {breadcrumbs.map((label, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span className="bc-sep">›</span>}
              <span className={`bc-item${i === breadcrumbs.length - 1 ? " active" : ""}`}>{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="topbar-right">
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle theme">
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        {/* Split view toggle — visible only for chats */}
        {(view === "chat" || view === "split") && (
          <div className="view-sw">
            <button
              className={`vs-btn${!splitMode ? " active" : ""}`}
              title="Single pane"
              onClick={() => splitMode && onToggleSplit()}
            >
              <svg viewBox="0 0 13 13" fill="none">
                <rect x="1.5" y="1.5" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </button>
            <button
              className={`vs-btn${splitMode ? " active" : ""}`}
              title="Split: Chat + Note"
              onClick={() => !splitMode && onToggleSplit()}
            >
              <svg viewBox="0 0 13 13" fill="none">
                <rect x="1" y="1.5" width="4.8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="7.2" y="1.5" width="4.8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </button>
          </div>
        )}

        {/* AI Panel toggle (only for notes) */}
        {view === "note" && (
          <button
            className={`tb-btn${ctxPanelOpen ? " on" : ""}`}
            onClick={onToggleCtxPanel}
            title={ctxPanelOpen ? "Close AI panel" : "Open AI assistant"}
          >
            <svg viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.5 3 3 1.5-3 1.5L7 10l-1.5-3-3-1.5 3-1.5L7 1z"
                stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M11.5 10l.8 1.5 1.5.8-1.5.8-.8 1.5-.8-1.5-1.5-.8 1.5-.8z"
                stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
            </svg>
            AI
          </button>
        )}

        {/* Avatar + dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <div
            className="avatar-btn"
            title={user?.email || "User"}
            onClick={() => setDropOpen(o => !o)}
            style={{ userSelect: "none" }}
          >
            {initials}
          </div>

          {dropOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 11, minWidth: 190,
              boxShadow: "0 10px 44px rgba(0,0,0,.32)",
              animation: "dropIn .12s ease", zIndex: 600, overflow: "hidden",
            }}>
              {/* User info */}
              <div style={{
                padding: "12px 14px 10px",
                borderBottom: "1px solid var(--border)"
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>
                  {user?.name || "User"}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--faint)", wordBreak: "break-all" }}>
                  {user?.email}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "10px 14px", textAlign: "left",
                  background: "transparent", border: "none",
                  color: "var(--red)", fontSize: 12.5, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "background .1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(224,85,85,.07)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <svg viewBox="0 0 14 14" fill="none" style={{ width: 13, height: 13 }}>
                  <path d="M5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
