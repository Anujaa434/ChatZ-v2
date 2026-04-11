// frontend/src/components/dashboard/v5/AIPanel.jsx
// Matches UKL v5 reference: header + pulse dot + messages + quick prompts + input
import { useState, useRef, useEffect } from "react";

const QUICK_PROMPTS = [
  "Summarize this note",
  "Find related notes",
  "What are the key insights?",
  "Create a study plan",
  "Extract action items",
];

function PulseStyle() {
  return (
    <style>{`
      @keyframes ai-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
      @keyframes ai-msg-in { from{opacity:0;transform:translateY(4px);} to{opacity:1;transform:translateY(0);} }
    `}</style>
  );
}

export default function AIPanel({ folder, note, onClose }) {
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const msgsEnd = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { msgsEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const contextLabel = note
    ? `Reading: ${note.title}`
    : folder
    ? `Reading: All notes in ${folder.name}`
    : "No context loaded";

  async function sendQuery(text) {
    if (!text?.trim()) return;
    const userMsg = { role: "user", content: text.trim() };
    setMsgs(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    // Simulate AI — replace with real Gemini call
    await new Promise(r => setTimeout(r, 1100 + Math.random() * 600));
    const noteCount = folder?.notes?.length || 0;
    const chatCount = folder?.chats?.length || 0;
    const reply = `Based on ${noteCount} note${noteCount!==1?"s":""} and ${chatCount} chat${chatCount!==1?"s":""}` +
      (folder ? ` in "${folder.name}"` : "") + `: ` +
      `Your query about "${text.trim()}" connects to several themes. ` +
      `I recommend reviewing your indexed notes for deeper context, then opening a chat to explore further.`;
    setMsgs(m => [...m, { role: "ai", content: reply }]);
    setLoading(false);
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuery(input); }
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 80) + "px";
  }

  return (
    <div className="ai-panel">
      <PulseStyle/>

      {/* Header */}
      <div className="ai-hd">
        <div className="ai-hd-icon">
          <svg viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M4.5 8.5c.5-1.5 1.5-2.5 2.5-2.5s2 1 2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="5.5" cy="5.5" r=".7" fill="currentColor"/>
            <circle cx="8.5" cy="5.5" r=".7" fill="currentColor"/>
          </svg>
        </div>
        <div className="ai-hd-info" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <div className="ai-hd-title">AI Assistant</div>
            <select
              style={{
                background: "var(--chip-bg)",
                border: "1px solid var(--border)",
                borderRadius: "5px",
                fontSize: "9.5px",
                color: "var(--text-dim)",
                outline: "none",
                cursor: "pointer",
                padding: "2px 4px"
              }}
            >
              <option value="gpt4">ChatGPT 4o</option>
              <option value="claude">Claude 3.5</option>
              <option value="gemini">Gemini Pro</option>
            </select>
          </div>
          <div className="ai-hd-sub">Ask about your notes</div>
        </div>
        <button className="pa-btn" onClick={onClose} title="Close AI panel"
          style={{marginLeft:"auto"}}>
          <svg viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Context indicator */}
      <div className="ai-ctx">
        <div className="ai-ctx-dot" style={{animation:"ai-pulse 2s infinite"}}/>
        {contextLabel}
      </div>

      {/* Messages + quick prompts */}
      <div className="ai-msgs" id="aiMsgs">
        {msgs.length === 0 && (
          <div className="ai-qps">
            {QUICK_PROMPTS.map(p => (
              <div key={p} className="ai-qp" onClick={() => sendQuery(p)}>{p}</div>
            ))}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ai-q" : "ai-a"}
            style={{animation:"ai-msg-in .18s ease"}}>
            {m.role === "user"
              ? <div className="ai-q-bub">{m.content}</div>
              : (
                <>
                  <div className="ai-a-bub">{m.content}</div>
                  <button className="ai-ins" onClick={() => {/* open in chat */}}
                    style={{marginTop:6}}>
                    <svg viewBox="0 0 12 12" fill="none">
                      <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Open in Chat →
                  </button>
                </>
              )
            }
          </div>
        ))}

        {loading && (
          <div className="ai-a" style={{animation:"ai-msg-in .15s ease"}}>
            <div className="ai-a-bub" style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {[0,120,240].map(delay=>(
                  <span key={delay} style={{width:5,height:5,borderRadius:"50%",
                    background:"var(--accent3)",display:"inline-block",
                    animation:`ai-pulse .7s ${delay}ms infinite`}}/>
                ))}
              </div>
              Thinking…
            </div>
          </div>
        )}

        <div ref={msgsEnd}/>
      </div>

      {/* Input */}
      <div className="ai-input-area">
        <div className="ai-box">
          <textarea
            ref={textareaRef}
            id="aiInput"
            placeholder="Ask about your notes…"
            rows={1}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={onKey}
            style={{resize:"none"}}
          />
          <button className="ai-send" onClick={() => sendQuery(input)} disabled={!input.trim()||loading}>
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M1 11L11 6 1 1v3.5l7 1.5-7 1.5V11z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
