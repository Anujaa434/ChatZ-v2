// frontend/src/components/dashboard/v5/ContextPanel.jsx
// AI Context Panel — shows real folder contents + AI-powered prompts
import { useState } from "react";

/* ── Mini icons ── */
const ChatIcon = () => (
  <svg viewBox="0 0 12 12" fill="none">
    <path d="M1.5 2.5h9a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H4L1.5 10V3a.5.5 0 010 0z"
      stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);
const NoteIcon = () => (
  <svg viewBox="0 0 12 12" fill="none">
    <rect x="1.5" y="1" width="7" height="9.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="3.5" y1="3.5" x2="7" y2="3.5" stroke="currentColor" strokeWidth="1"/>
    <line x1="3.5" y1="5.5" x2="7" y2="5.5" stroke="currentColor" strokeWidth="1"/>
  </svg>
);
const SparkIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" style={{ width: 12, height: 12 }}>
    <path d="M7 1l1.5 3 3 1.5-3 1.5L7 10l-1.5-3-3-1.5 3-1.5L7 1z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M11.5 10l.8 1.5 1.5.8-1.5.8-.8 1.5-.8-1.5-1.5-.8 1.5-.8z"
      stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 10 10" fill="none" style={{ width: 10, height: 10 }}>
    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" style={{ width: 11, height: 11 }}>
    <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const LinkIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" style={{ width: 11, height: 11 }}>
    <path d="M5 6a2.5 2.5 0 003.5.5l1.5-1.5a2.5 2.5 0 00-3.5-3.5L5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M7 6a2.5 2.5 0 00-3.5-.5L2 7a2.5 2.5 0 003.5 3.5L7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

/* ── AI suggested prompts based on folder context ── */
const AI_PROMPTS = [
  "Summarize all notes in this folder",
  "Find connections between these topics",
  "Create a study plan from these notes",
  "Extract key concepts as flashcards",
  "Suggest gaps in my research",
];

export default function ContextPanel({
  folder, tab, onTabChange,
  onOpenChat, onOpenNote,
  onCreateChat, onCreateNote,
  onShowToast, onClose,
}) {
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // Use REAL data from the folder prop
  const chats = folder?.chats  || [];
  const notes = folder?.notes  || [];
  const totalItems = chats.length + notes.length;

  async function runAiPrompt(prompt) {
    setAiQuery(prompt);
    setAiLoading(true);
    setAiResponse(null);
    // Simulate AI response (replace with real Gemini call later)
    await new Promise(r => setTimeout(r, 1200));
    setAiLoading(false);
    setAiResponse(`✨ Based on ${notes.length} note${notes.length !== 1 ? "s" : ""} and ${chats.length} chat${chats.length !== 1 ? "s" : ""} in "${folder?.name}": This folder contains material on ${prompt.toLowerCase()}. Connect ideas across your notes for deeper insights.`);
  }

  function handleQuickPrompt(prompt) { runAiPrompt(prompt); }

  return (
    <div className="ctx-panel">
      {/* Header */}
      <div className="cp-hd">
        <div className="cp-folder-row">
          <div className="cp-folder-dot" style={{ background: folder?.color || "var(--accent)" }}/>
          <span className="cp-folder-name">{folder?.name || "Workspace"}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: "var(--faint)", padding: "2px 7px", background: "var(--chip-bg)", borderRadius: 999 }}>
              {totalItems} items
            </span>
            <button
              onClick={onClose}
              style={{ width: 22, height: 22, border: "none", background: "none", color: "var(--faint)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "background .1s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--chip-bg)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            ><CloseIcon/></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="cp-tabs">
          <button className={`cp-tab chat-tab${tab === "chats" ? " active" : ""}`} onClick={() => onTabChange("chats")}>
            <ChatIcon/> Chats {chats.length > 0 && <span style={{ marginLeft: 3, fontSize: 9, background: "var(--chip-bg)", padding: "0 5px", borderRadius: 999 }}>{chats.length}</span>}
          </button>
          <button className={`cp-tab note-tab${tab === "notes" ? " active" : ""}`} onClick={() => onTabChange("notes")}>
            <NoteIcon/> Notes {notes.length > 0 && <span style={{ marginLeft: 3, fontSize: 9, background: "var(--chip-bg)", padding: "0 5px", borderRadius: 999 }}>{notes.length}</span>}
          </button>
          <button className={`cp-tab${tab === "ai" ? " active" : ""}`} onClick={() => onTabChange("ai")} style={{ gap: 4 }}>
            <SparkIcon/> AI
          </button>
        </div>
      </div>

      <div className="cp-scroll">

        {/* ── CHATS TAB ── */}
        {tab === "chats" && (
          <>
            <div className="cp-section-label">Chats in {folder?.name}</div>
            {chats.length === 0 ? (
              <div style={{ padding: "16px 8px", color: "var(--faint)", fontSize: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>💬</div>
                No chats yet
              </div>
            ) : chats.map(c => (
              <div key={c.id} className={`cp-item`} onClick={() => onOpenChat(c)}>
                <div className="cp-item-icon-wrap chat"><ChatIcon/></div>
                <div className="cp-item-body">
                  <div className="cp-item-name">{c.title}</div>
                  <div className="cp-item-sub">
                    {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "Chat"}
                  </div>
                </div>
                <LinkIcon/>
              </div>
            ))}
          </>
        )}

        {/* ── NOTES TAB ── */}
        {tab === "notes" && (
          <>
            <div className="cp-section-label">Notes in {folder?.name}</div>
            {notes.length === 0 ? (
              <div style={{ padding: "16px 8px", color: "var(--faint)", fontSize: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>📝</div>
                No notes yet
              </div>
            ) : notes.map(n => (
              <div key={n.id} className={`cp-item`} onClick={() => onOpenNote(n)}>
                {/* Color bar */}
                <div style={{
                  width: 3, alignSelf: "stretch", borderRadius: 2, flexShrink: 0,
                  background: n.color && n.color !== "#ffffff" ? n.color : "var(--faint)",
                  margin: "3px 6px 3px 0",
                }}/>
                <div className="cp-item-icon-wrap note"><NoteIcon/></div>
                <div className="cp-item-body">
                  <div className="cp-item-name">{n.title}</div>
                  <div className="cp-item-sub">
                    {n.content ? `${n.content.split(/\s+/).filter(Boolean).length} words` : "Empty"}
                    {n.ai_indexed ? " · 🧠 AI indexed" : ""}
                  </div>
                </div>
                <LinkIcon/>
              </div>
            ))}
          </>
        )}

        {/* ── AI TAB ── */}
        {tab === "ai" && (
          <>
            {/* AI header */}
            <div style={{
              margin: "8px 0 10px",
              padding: "10px 12px",
              background: "linear-gradient(135deg, var(--accent-glow) 0%, rgba(124,90,247,.08) 100%)",
              borderRadius: 10,
              border: "1px solid var(--accent-border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <SparkIcon/>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent3)" }}>AI Context Assistant</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 }}>
                Ask about your {totalItems} items in <strong>{folder?.name}</strong>. Notes marked 🧠 are indexed for semantic search.
              </div>
            </div>

            {/* Quick prompts */}
            <div className="cp-section-label">Quick actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {AI_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => handleQuickPrompt(p)}
                  style={{
                    textAlign: "left", padding: "7px 10px",
                    background: aiQuery === p ? "var(--accent-glow)" : "var(--card)",
                    border: `1px solid ${aiQuery === p ? "var(--accent-border)" : "var(--border)"}`,
                    borderRadius: 8, color: aiQuery === p ? "var(--accent3)" : "var(--text-dim)",
                    fontSize: 11.5, cursor: "pointer", transition: "all .12s",
                    display: "flex", alignItems: "center", gap: 7,
                  }}
                  onMouseEnter={e => { if (aiQuery !== p) { e.currentTarget.style.background = "var(--chip-bg)"; e.currentTarget.style.borderColor = "var(--accent-border)"; } }}
                  onMouseLeave={e => { if (aiQuery !== p) { e.currentTarget.style.background = "var(--card)"; e.currentTarget.style.borderColor = "var(--border)"; } }}
                >
                  <span style={{ color: "var(--accent)", fontSize: 12, flexShrink: 0 }}>✦</span>
                  {p}
                </button>
              ))}
            </div>

            {/* AI response area */}
            {aiLoading && (
              <div style={{
                padding: "16px 12px", background: "var(--card)", borderRadius: 10,
                border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent3)", animation: "pulse 1s infinite" }}/>
                <span style={{ fontSize: 12, color: "var(--faint)" }}>Thinking…</span>
              </div>
            )}
            {aiResponse && !aiLoading && (
              <div style={{
                padding: "12px", background: "var(--card)", borderRadius: 10,
                border: "1px solid var(--accent-border)",
                borderLeft: "3px solid var(--accent3)",
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--accent3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  ✨ AI Response
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{aiResponse}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => onShowToast("💬 Opening chat with AI context…")}
                    style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: "1px solid var(--accent-border)", background: "var(--accent-glow)", color: "var(--accent3)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                  >Open in Chat</button>
                  <button
                    onClick={() => { setAiQuery(""); setAiResponse(null); }}
                    style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", fontSize: 11, cursor: "pointer" }}
                  >Clear</button>
                </div>
              </div>
            )}

            {/* Indexed notes count */}
            {notes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="cp-section-label">🧠 Indexed for AI</div>
                {notes.filter(n => n.ai_indexed).length === 0 ? (
                  <div style={{ fontSize: 11, color: "var(--faint)", padding: "4px 0 8px" }}>
                    No notes are AI-indexed yet. Notes get indexed automatically after creation.
                  </div>
                ) : notes.filter(n => n.ai_indexed).map(n => (
                  <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                    <span style={{ fontSize: 11 }}>🧠</span>
                    <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>{n.title}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
