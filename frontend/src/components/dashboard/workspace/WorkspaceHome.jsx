// frontend/src/components/dashboard/v5/WorkspaceHome.jsx
// Shows real folder contents from props — no hardcoded data

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
    <line x1="3.5" y1="7.5" x2="5.5" y2="7.5" stroke="currentColor" strokeWidth="1"/>
  </svg>
);

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

export default function WorkspaceHome({ folder, onOpenChat, onOpenNote, onCreateChat, onCreateNote, onShowToast, onCtx }) {
  // folder may have chats[], notes[] if it was selected from the tree
  const chats = folder?.chats || [];
  const notes = folder?.notes || [];
  const isWorkspaceRoot = !folder?.id;

  const chatCount  = chats.length;
  const noteCount  = notes.length;
  const totalItems = chatCount + noteCount;

  return (
    <>
      {/* Folder / Workspace header */}
      <div className="wsh-folder-hd">
        <div className="wsh-color" style={{ background: folder?.color || "var(--accent)" }}/>
        <div className="wsh-title">{folder?.name || "Workspace"}</div>
      </div>
      <div className="wsh-stats">
        <span>{totalItems} items</span>
        {chatCount > 0 && <>
          <span style={{ color: "var(--border)" }}>·</span>
          <span>{chatCount} chats</span>
        </>}
        {noteCount > 0 && <>
          <span style={{ color: "var(--border)" }}>·</span>
          <span>{noteCount} notes</span>
        </>}
        {totalItems === 0 && <span style={{ color: "var(--faint)" }}>Empty folder — create something</span>}
      </div>

      {/* Chats section */}
      <div className="wsh-section">Chats</div>
      <div className="wsh-cards">
        {chats.map(c => (
          <div key={c.id} className="wsh-card" onClick={() => onOpenChat(c)}>
            <div className="wsh-card-hd">
              <div className="wch-icon-wrap chat"><ChatIcon /></div>
              <span className="wch-title">{c.title}</span>
              {c.pinned && <span className="wch-badge">📌</span>}
              <button className="fi-menu" style={{marginLeft: "auto", border: "none", background: "transparent", color: "var(--faint)", cursor: "pointer"}} onClick={e=>{e.stopPropagation(); if (onCtx) onCtx(e, "chat", c.id, { onDelete: () => {}, onRename: () => {} });}}>⋮</button>
            </div>
            <div className="wsh-snip">{c.last_message || "No messages yet"}</div>
            <div className="wsh-foot">
              <span className="wsh-time">{relativeTime(c.updated_at)}</span>
            </div>
          </div>
        ))}
        {/* New chat button */}
        <button
          className="wsh-new"
          onClick={onCreateChat}
          title={folder?.id ? `New chat in ${folder.name}` : "New chat in inbox"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1h9a.5.5 0 01.5.5v6a.5.5 0 01-.5.5H3L1 10V1.5A.5.5 0 011 1z"
              stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <line x1="5" y1="12" x2="13" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="9" y1="8" x2="9" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          New chat
        </button>
      </div>

      {/* Notes section */}
      <div className="wsh-section" style={{ marginTop: 12 }}>Notes</div>
      <div className="wsh-cards">
        {notes.map(n => (
          <div key={n.id} className="wsh-card" onClick={() => onOpenNote(n)}>
            <div className="wsh-card-hd">
              <div className="wch-icon-wrap note"><NoteIcon /></div>
              <span className="wch-title">{n.title}</span>
              <button className="fi-menu" style={{marginLeft: "auto", border: "none", background: "transparent", color: "var(--faint)", cursor: "pointer"}} onClick={e=>{e.stopPropagation(); if (onCtx) onCtx(e, "note", n.id, { onDelete: () => {} });}}>⋮</button>
            </div>
            <div className="wsh-snip">{n.content?.slice(0, 100) || "Empty note"}</div>
            <div className="wsh-foot">
              <span className="wsh-time">{relativeTime(n.updated_at)}</span>
            </div>
          </div>
        ))}
        {/* New note button */}
        <button
          className="wsh-new"
          onClick={onCreateNote}
          title={folder?.id ? `New note in ${folder.name}` : "New note in inbox"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="1.5" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="10" y1="7" x2="10" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          New note
        </button>
      </div>

      {/* Empty state when folder has nothing */}
      {isWorkspaceRoot && chatCount === 0 && noteCount === 0 && (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--faint)", fontSize: 12 }}>
          Select a folder from the sidebar, or create chats and notes in your Inbox
        </div>
      )}
    </>
  );
}
