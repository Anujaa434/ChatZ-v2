// frontend/src/components/dashboard/v5/NotePane.jsx
import { useState, useEffect, useRef } from "react";

export default function NotePane({ note, fullWidth, onSave, onShowToast }) {
  const [title,   setTitle]   = useState(note?.title   || "Untitled Note");
  const [content, setContent] = useState(note?.content || "");
  const [saved,   setSaved]   = useState(true);
  const autoTimer             = useRef(null);

  useEffect(() => {
    setTitle(note?.title   || "Untitled Note");
    setContent(note?.content || "");
    setSaved(true);
  }, [note?.id]);

  function scheduleAutoSave(newTitle, newContent) {
    setSaved(false);
    clearTimeout(autoTimer.current);
    autoTimer.current = setTimeout(async () => {
      if (note?.id) {
        try {
          await onSave(note.id, { title: newTitle, content: newContent });
          setSaved(true);
        } catch {
          onShowToast?.("⚠️ Auto-save failed");
        }
      }
    }, 1500);
  }

  function handleTitleChange(e) { setTitle(e.target.value); scheduleAutoSave(e.target.value, content); }
  function handleContentChange(e) { setContent(e.target.value); scheduleAutoSave(title, e.target.value); }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  const noteColor = note?.color;
  const hasColor  = noteColor && noteColor !== "#ffffff";

  /* ── Color-derived styles ── */
  // 1. Top border — solid, vivid
  const topBorderStyle = hasColor
    ? { borderTop: `3px solid ${noteColor}` }
    : { borderTop: "3px solid var(--accent)" };

  // 2. Header bg — gradient from color (25% opacity) → transparent
  const headerBg = hasColor
    ? `linear-gradient(135deg, ${noteColor}40 0%, ${noteColor}10 100%)`
    : "var(--bg)";

  // 3. Body remains theme bg (no full-page tint)
  return (
    <div className={`note-pane${fullWidth ? " flex-full" : ""}`} style={topBorderStyle}>

      {/* ── COLORED HEADER ── */}
      <div
        className="pane-hd"
        style={{ background: headerBg, transition: "background .3s", borderBottom: "1px solid var(--border)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          {/* Color swatch pill */}
          {hasColor && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: `${noteColor}30`, border: `1.5px solid ${noteColor}80`,
              borderRadius: 6, padding: "2px 7px", flexShrink: 0,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: noteColor, display: "inline-block" }}/>
            </span>
          )}
          <input
            className="pane-title-input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            style={{ flex: 1, minWidth: 0, background: "transparent" }}
          />
        </div>
        <div className="pane-actions">
          <button className="pa-btn" title="Export" onClick={() => onShowToast?.("⬇️ Exported!")}>
            <svg viewBox="0 0 14 14" fill="none">
              <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="note-toolbar">
        {[["B","Bold"],["I","Italic"]].map(([k,label]) => (
          <button key={k} className="nt-btn" title={label}>
            <span style={{ fontWeight: k==="B"?700:400, fontStyle: k==="I"?"italic":"normal" }}>{k}</span>
          </button>
        ))}
        <div className="nt-sep"/>
        {["H1","H2"].map(k => <button key={k} className="nt-btn">{k}</button>)}
        <div className="nt-sep"/>
        <button className="nt-btn" title="Bullet list">
          <svg viewBox="0 0 12 12" fill="none" style={{ width: 13, height: 13 }}>
            <line x1="4" y1="3" x2="11" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="4" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="4" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="1.5" cy="3" r=".8" fill="currentColor"/>
            <circle cx="1.5" cy="6" r=".8" fill="currentColor"/>
            <circle cx="1.5" cy="9" r=".8" fill="currentColor"/>
          </svg>
        </button>
        <button className="nt-btn" title="Code">{"</>"}</button>
        <div style={{ flex: 1 }}/>
        <button className="pa-btn" style={{ width: 26, height: 26 }} title="AI enhance"
          onClick={() => onShowToast?.("✨ AI enhancing…")}>
          <svg viewBox="0 0 14 14" fill="none">
            <path d="M7 1l1.5 3 3 1.5-3 1.5L7 10l-1.5-3-3-1.5 3-1.5L7 1z" stroke="var(--accent3)" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── CONTENT ── */}
      <div className="note-body">
        <textarea
          className="note-content-input"
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing…"
          style={{ width: "100%", minHeight: 300 }}
        />
      </div>

      {/* ── STATUS BAR ── */}
      <div className="note-status">
        <span>{wordCount} words</span>
        <span style={{ color: "var(--border)" }}>·</span>
        <span>{charCount} chars</span>
        <span style={{ color: "var(--border)" }}>·</span>
        <span style={{ color: saved ? "var(--green)" : "var(--amber)" }}>
          {saved ? "Saved ✓" : "Saving…"}
        </span>
        {note?.ai_indexed && <span className="emb-badge" style={{ marginLeft: "auto" }}>🧠 AI indexed</span>}
      </div>
    </div>
  );
}
