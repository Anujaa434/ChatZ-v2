// frontend/src/components/dashboard/v5/ChatPane.jsx
//
// WHAT: Rich per-message actions:
//   User prompt ⋮ menu → Pin | Save to Note (prompt+response) | Delete (+cascades AI response)
//   AI response → inline Copy icon only
// WHY:  Keeps the UI clean — prompts own the conversation context actions,
//       responses are read-only (copy is the only sensible action).

import { useState, useRef, useEffect } from "react";
import api from "../../../api/axios";
import { createNote } from "../../../api/dashboard";

// ── Icons ─────────────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" style={{ width: 12, height: 12 }}>
    <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M2 10V3a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const PinIcon = ({ active }) => (
  <svg viewBox="0 0 14 14" fill="none" style={{ width: 12, height: 12 }}>
    <path d="M9.5 2l-5 5 1 1 5-5-1-1zM5 9l-3 3M8.5 3.5l2 2"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    {active && <circle cx="9" cy="5" r="2" fill="currentColor" opacity="0.4"/>}
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" style={{ width: 12, height: 12 }}>
    <path d="M2 4h10M5 4V2.5A.5.5 0 015.5 2h3a.5.5 0 01.5.5V4M11 4l-.8 7.5A1 1 0 019.2 12H4.8a1 1 0 01-1-.9L3 4"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const NoteIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" style={{ width: 12, height: 12 }}>
    <rect x="2" y="1.5" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <line x1="4.5" y1="5"    x2="7.5" y2="5"    stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="4.5" y1="7"    x2="7.5" y2="7"    stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="10"  y1="8"    x2="13"  y2="8"    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <line x1="11.5" y1="6.5" x2="11.5" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────
export default function ChatPane({
  chat, messages = [], onSend, onShowToast, onShowCtx, onOpenNote, onRefreshMessages,
}) {
  const [input, setInput]              = useState("");
  const [sending, setSending]          = useState(false);
  const [pinBarVisible, setPinBar]     = useState(true);
  const [localMsgs, setLocalMsgs]      = useState(messages);
  const [dropdown, setDropdown]        = useState(null); // { msgId, x, y }
  const [pinnedCursor, setPinnedCursor] = useState(0);

  const msgsRef         = useRef(null);
  const dropRef         = useRef(null);
  const msgRefs         = useRef(new Map());
  const prevPinnedCount = useRef(0);

  // Sync messages from parent
  useEffect(() => { setLocalMsgs(messages); }, [messages]);

  // Reset pin cursor when pin count changes
  useEffect(() => {
    const count = localMsgs.filter(m => m.pinned).length;
    if (count !== prevPinnedCount.current) {
      setPinnedCursor(0);
      prevPinnedCount.current = count;
    }
  }, [localMsgs]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [localMsgs, sending]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdown) return;
    function onDown(e) { if (!dropRef.current?.contains(e.target)) setDropdown(null); }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [dropdown]);

  // ── Send ──────────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try { await onSend(text); } finally { setSending(false); }
  }
  function handleKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSend();
  }

  // ── Open dropdown (prompt ⋮ only) ─────────────────────────────────────────
  function openDropdown(e, msgId) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdown({ msgId, x: rect.left - 148, y: rect.bottom + 4 });
  }

  // ── Pin / Unpin ───────────────────────────────────────────────────────────
  // DB field: `pinned` (boolean). Backend cap = 3 pins per chat.
  async function handleTogglePin(msg) {
    if (!chat?.id || !msg.id) return;
    const willPin = !msg.pinned;
    setDropdown(null);
    setLocalMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: willPin } : m));
    if (willPin) setPinBar(true);
    try {
      await api.patch(`/api/chats/${chat.id}/messages/${msg.id}/pin`, { pinned: willPin });
      onShowToast(willPin ? "📌 Message pinned" : "📌 Message unpinned");
    } catch (err) {
      setLocalMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: msg.pinned } : m));
      const e = err?.response?.data?.error || "";
      onShowToast(
        e.includes("3") || e.includes("pin")
          ? "⚠️ Max 3 messages can be pinned"
          : "⚠️ Could not pin message"
      );
    }
  }

  // ── Delete prompt + cascade AI response ───────────────────────────────────
  // WHY: A prompt and its AI response are a logical pair — deleting one
  //      without the other leaves a dangling orphan in the conversation.
  async function handleDeleteMsg(msg) {
    if (!chat?.id || !msg.id) return;
    setDropdown(null);

    const idx     = localMsgs.findIndex(m => m.id === msg.id);
    const nextMsg = localMsgs[idx + 1];
    // Role from DB is 'assistant' (not 'ai')
    const hasPair = msg.role === "user" && nextMsg?.role === "assistant";

    const removeIds = new Set([msg.id]);
    if (hasPair) removeIds.add(nextMsg.id);
    setLocalMsgs(prev => prev.filter(m => !removeIds.has(m.id)));

    try {
      await api.delete(`/api/chats/${chat.id}/messages/${msg.id}`);
      if (hasPair) await api.delete(`/api/chats/${chat.id}/messages/${nextMsg.id}`);
      onShowToast(hasPair ? "🗑 Message pair deleted" : "🗑 Message deleted");
    } catch {
      // Revert both
      setLocalMsgs(prev => {
        const arr = [...prev];
        const at  = arr.findIndex(m => m.id > msg.id);
        const ins = hasPair ? [msg, nextMsg] : [msg];
        if (at === -1) arr.push(...ins); else arr.splice(at, 0, ...ins);
        return arr;
      });
      onShowToast("⚠️ Could not delete message");
    }
  }

  // ── Save to Note ──────────────────────────────────────────────────────────
  // WHAT: Creates a note titled with the chat name, containing:
  //         Prompt: <user message>
  //         Response: <AI response>  (if one exists right after)
  // WHY:  User wants to capture both sides of the conversation as a note.
  async function handleSaveToNote(msg) {
    setDropdown(null);
    try {
      const idx     = localMsgs.findIndex(m => m.id === msg.id);
      // Role from DB is 'assistant' (not 'ai')
      const aiReply = localMsgs[idx + 1]?.role === "assistant" ? localMsgs[idx + 1] : null;

      const title   = chat?.title || "Note from chat";
      const content = aiReply
        ? `Prompt:\n${msg.content}\n\nResponse:\n${aiReply.content}`
        : `Prompt:\n${msg.content}`;

      await createNote({ title, content, folderId: chat?.folder_id ?? null });
      onShowToast("📝 Saved to notes!");
    } catch {
      onShowToast("⚠️ Could not save to note");
    }
  }

  // ── Telegram pin bar: cycle newest → older → oldest → wrap ───────────────
  function handlePinBarClick() {
    const pinned = [...localMsgs].filter(m => m.pinned).reverse(); // newest first
    if (pinned.length === 0) return;
    const target = pinned[pinnedCursor % pinned.length];
    const el = msgRefs.current.get(target.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "background .15s";
      el.style.background = "var(--accent-glow)";
      setTimeout(() => { el.style.background = ""; }, 800);
    }
    setPinnedCursor(c => (c + 1) % pinned.length);
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const pinnedMsgs    = localMsgs.filter(m => m.pinned);
  const pinnedOrdered = [...pinnedMsgs].reverse(); // newest first
  const pinCur        = pinnedOrdered.length > 0 ? pinnedCursor % pinnedOrdered.length : 0;
  const pinCurHuman   = pinCur + 1; // 1-based for display — avoids JSX ++ ambiguity
  const shownPin      = pinnedOrdered[pinCur];
  const dropMsg       = dropdown ? localMsgs.find(m => m.id === dropdown.msgId) : null;


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="chat-pane">

      {/* ── Header ── */}
      <div className="pane-hd">
        <div className="pane-title">{chat?.title || "Chat"}</div>
        <div className="pane-actions">
          <div className="model-chip"><div className="mc-dot"/>Gemini 1.5 Pro</div>
          <button className="pa-btn" title="Chat options" onClick={e => onShowCtx(e, "chat")}>
            <svg viewBox="0 0 14 14" fill="none">
              <circle cx="2.5"  cy="7" r="1.2" fill="currentColor"/>
              <circle cx="7"    cy="7" r="1.2" fill="currentColor"/>
              <circle cx="11.5" cy="7" r="1.2" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Telegram-style pin bar ── */}
      {pinnedMsgs.length > 0 && pinBarVisible && (
        <div
          className="pin-bar"
          onClick={handlePinBarClick}
          title={`Pinned message ${pinCurHuman} of ${pinnedOrdered.length} — click to jump`}
        >
          {/* Left stripes: one per pinned, active = full opacity */}
          <div style={{
            display: "flex", flexDirection: "column", gap: 2,
            width: 3, flexShrink: 0, marginRight: 10,
            alignSelf: "stretch", justifyContent: "center",
          }}>
            {pinnedOrdered.map((_, i) => (
              <div key={i} style={{
                flex: 1, minHeight: 4, maxHeight: 11, borderRadius: 2,
                background: "var(--accent3)",
                opacity: i === pinCur ? 1 : 0.22,
                transition: "opacity .2s",
              }}/>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: "var(--accent3)",
              letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 2,
            }}>
              Pinned Message
              {pinnedOrdered.length > 1 && (
                <span style={{ opacity: 0.6, fontWeight: 500, marginLeft: 5 }}>
                  {pinCurHuman} / {pinnedOrdered.length}
                </span>
              )}
            </div>
            <div style={{
              fontSize: 12, color: "var(--text-dim)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              fontStyle: "italic",
            }}>
              {shownPin?.content?.slice(0, 90)}{shownPin?.content?.length > 90 ? "…" : ""}
            </div>
          </div>

          <button
            className="pin-bar-close"
            onClick={e => { e.stopPropagation(); setPinBar(false); }}
            title="Hide pin bar"
          >✕</button>
        </div>
      )}

      {/* ── Message list ── */}
      <div className="chat-msgs" ref={msgsRef}>

        {/* Empty state */}
        {localMsgs.length === 0 && !sending && (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "100%", gap: 12,
          }}>
            <div style={{ fontSize: 32 }}>✦</div>
            <div style={{ fontSize: 14, color: "var(--text-dim)", fontWeight: 500 }}>
              Start a conversation
            </div>
            <div style={{ fontSize: 12, color: "var(--faint)" }}>
              Ask anything — AI will respond using your workspace context
            </div>
          </div>
        )}

        {localMsgs.map(m => (
          <div
            key={m.id}
            ref={el => { if (el) msgRefs.current.set(m.id, el); else msgRefs.current.delete(m.id); }}
            className={`msg${m.role === "user" ? " user" : " ai"}${m.pinned ? " pinned" : ""}`}
          >
            <div className={`m-av${m.role !== "user" ? " ai-av" : " u-av"}`}>
              {m.role !== "user" ? "✦" : "U"}
            </div>

            <div className="m-body">
              {/* Pinned label */}
              {m.pinned && (
                <span style={{
                  fontSize: 10, color: "var(--accent3)",
                  marginBottom: 2, display: "block", fontWeight: 600,
                }}>📌 pinned</span>
              )}

              {/* Message bubble */}
              <div className="m-bubble" style={{ whiteSpace: "pre-line" }}>{m.content}</div>

              {/* USER PROMPT → ⋮ three-dot menu */}
              {m.role === "user" && (
                <div className="m-hover-acts">
                  <button
                    className="m-ha-btn"
                    title="Message actions"
                    onClick={e => openDropdown(e, m.id)}
                    style={{ fontWeight: 700, letterSpacing: 1, fontSize: 14 }}
                  >⋮</button>
                </div>
              )}

              {/* AI RESPONSE → Copy icon only (role is 'assistant' in DB) */}
              {m.role !== "user" && (
                <div className="m-hover-acts">
                  <button
                    className="m-ha-btn"
                    title="Copy response"
                    onClick={() => {
                      navigator.clipboard.writeText(m.content);
                      onShowToast("📋 Copied!");
                    }}
                  >
                    <CopyIcon/> Copy
                  </button>
                </div>
              )}

              <div className="m-time">
                {m.created_at
                  ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="msg ai">
            <div className="m-av ai-av">✦</div>
            <div className="m-body">
              <div className="m-bubble">
                <div className="typing-dots"><span/><span/><span/></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ⋮ Dropdown — user prompt only ── */}
      {dropdown && dropMsg && dropMsg.role === "user" && (
        <div ref={dropRef} style={{
          position: "fixed", top: dropdown.y,
          left: Math.max(8, dropdown.x), zIndex: 800,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 11, padding: 5, minWidth: 178,
          boxShadow: "0 12px 40px rgba(0,0,0,.45)",
          animation: "dropIn .12s ease",
        }}>
          {/* Pin / Unpin */}
          <button className="msg-drop-btn" onClick={() => handleTogglePin(dropMsg)}>
            <PinIcon active={dropMsg.pinned}/>
            {dropMsg.pinned ? "Unpin message" : "Pin message"}
          </button>

          {/* Save to Note: prompt + AI response */}
          <button className="msg-drop-btn" onClick={() => handleSaveToNote(dropMsg)}>
            <NoteIcon/> Save to note
          </button>

          <div style={{ height: 1, background: "var(--border)", margin: "4px 6px" }}/>

          {/* Also show (+ response) hint when there's an assistant reply after it */}
          <button className="msg-drop-btn danger" onClick={() => handleDeleteMsg(dropMsg)}>
            <TrashIcon/>
            Delete
            {(() => {
              const idx = localMsgs.findIndex(m => m.id === dropMsg.id);
              return localMsgs[idx + 1]?.role === "assistant"
                ? <span style={{ fontSize: 10, opacity: 0.5, marginLeft: 4 }}>(+ response)</span>
                : null;
            })()}
          </button>
        </div>
      )}

      {/* ── Input ── */}
      <div className="chat-input-area">
        <div className="input-box">
          <textarea
            className="chat-ta"
            placeholder="Ask anything… (⌘↵ to send)"
            value={input}
            disabled={sending}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button className="send-btn" onClick={handleSend} disabled={sending || !input.trim()}>
            <svg viewBox="0 0 13 13" fill="none">
              <path d="M1 12L12 6.5 1 1v4.5l7 2-7 2V12z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <div className="input-hints">
          <span className="rag-badge"><span className="rag-dot"/>Gemini 1.5 Pro</span>
          <span><span className="hk">⌘↵</span> send</span>
          <span><span className="hk">⇧↵</span> newline</span>
        </div>
      </div>
    </div>
  );
}
