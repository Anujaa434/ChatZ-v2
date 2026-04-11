// frontend/src/components/dashboard/DashboardV5.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/ukl.css";

import IconRail      from "./v5/IconRail";
import Sidebar       from "./v5/Sidebar";
import Topbar        from "./v5/Topbar";
import WorkspaceHome from "./v5/WorkspaceHome";
import ChatPane      from "./v5/ChatPane";
import NotePane      from "./v5/NotePane";
import AIPanel       from "./v5/AIPanel";
import ContextPanel  from "./v5/ContextPanel";
import ContextMenu   from "./v5/ContextMenu";
import SettingsView  from "./v5/SettingsView";
import Toast         from "./v5/Toast";

import {
  syncDashboard,
  createFolder, updateFolder, deleteFolder,
  createChat, updateChat, deleteChat, getMessages, sendMessage,
  createNote, getNote, updateNote, deleteNote, renameChat,
} from "../../api/dashboard";

export default function DashboardV5() {
  const { user, logout } = useAuth();

  /* ── Layout ─────────────────────────────────────────── */
  const [section, setSection]               = useState("ws");
  const [theme, setTheme]                   = useState("dark");
  const [view, setView]                     = useState("home");
  const [splitMode, setSplitMode]           = useState(false);
  const [ctxPanelOpen, setCtxPanelOpen]     = useState(false);
  const [ctxPanelTab, setCtxPanelTab]       = useState("chats");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Split panel picker — tracks which note is pinned in right pane of split
  const [splitNote, setSplitNote]         = useState(null);
  const [showSplitPicker, setShowSplitPicker] = useState(false);
  const [splitFilter, setSplitFilter]     = useState("all");

  /* ── Data ───────────────────────────────────────────── */
  const [folders, setFolders]         = useState([]);
  const [inbox, setInbox]             = useState({ chats: [], notes: [] });
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeChat, setActiveChat]   = useState(null);
  const [activeNote, setActiveNote]   = useState(null);
  const [messages, setMessages]       = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  /* ── UI ─────────────────────────────────────────────── */
  const [toast, setToast]             = useState({ msg: "", show: false });
  const [ctxMenu, setCtxMenu]         = useState({ show: false, x: 0, y: 0, type: null, meta: {} });
  const toastTimer = useRef(null);

  /* ── Load ───────────────────────────────────────────── */
  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    setDataLoading(true);
    try {
      const data = await syncDashboard();
      const newFolders = data.folders || [];
      setFolders(newFolders);
      setInbox(data.inbox || { chats: [], notes: [] });
      // Keep activeFolder in sync with fresh data
      setActiveFolder(prev => {
        if (!prev) return null;
        return findFolderInTree(newFolders, prev.id) || prev;
      });
    } catch (e) {
      console.error("Sync failed", e);
      showToast("⚠️ Could not load workspace");
    } finally {
      setDataLoading(false);
    }
  }


  /* ── Toast ──────────────────────────────────────────── */
  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2800);
  }

  /* ── Theme ──────────────────────────────────────────── */
  function toggleTheme() {
    setTheme(t => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }

  /* ── Open Chat ──────────────────────────────────────── */
  async function openChat(chat) {
    setActiveChat(chat);
    setView("chat");
    setSplitMode(false);
    setShowSplitPicker(false);
    if (chat?.id) {
      try {
        const msgs = await getMessages(chat.id);
        setMessages(msgs);
      } catch { setMessages([]); }
    } else {
      setMessages([]);
    }
  }

  /* ── Open Note ──────────────────────────────────────── */
  async function openNote(note) {
    setActiveNote(note);
    setSplitMode(false);
    setShowSplitPicker(false);
    setView("note");
    if (note?.id) {
      try {
        const full = await getNote(note.id);
        setActiveNote(full);
      } catch {}
    }
  }

  /* ── Create Folder ──────────────────────────────────── */
  async function handleCreateFolder(name, color, parentId = null) {
    if (!name) return;
    try {
      const folder = await createFolder({ name, color: color || "#5a8cff", parentId });
      await loadDashboard();          // reload so nested tree is accurate
      setActiveFolder(folder);
      showToast(`📁 "${folder.name}" created`);
    } catch {
      showToast("⚠️ Failed to create folder");
    }
  }


  /* ── Rename Folder ──────────────────────────────────── */
  async function handleRenameFolder(folderId, name) {
    if (!name) return;
    try {
      await updateFolder(folderId, { name });
      setFolders(f => updateFolderInTree(f, folderId, { name }));
      showToast(`✏️ Renamed to "${name}"`);
    } catch {
      showToast("⚠️ Rename failed");
    }
  }

  /* ── Delete Folder ──────────────────────────────────── */
  async function handleDeleteFolder(folderId) {
    if (!confirm("Delete this folder and all its contents?")) return;
    try {
      await deleteFolder(folderId);
      setFolders(f => removeFolderFromTree(f, folderId));
      if (activeFolder?.id === folderId) { setActiveFolder(null); setView("home"); }
      showToast("🗑 Folder deleted");
    } catch {
      showToast("⚠️ Delete failed");
    }
  }

  /* ── Create Chat ────────────────────────────────────── */
  async function handleCreateChat(folderId) {
    // Start locally first. Chat is only saved when first message is sent
    const tempChat = { id: null, title: "New Chat", folder_id: folderId || null };
    openChat(tempChat);
  }

  /* ── Create Note ────────────────────────────────────── */
  async function handleCreateNote(folderId, title, color) {
    try {
      const note = await createNote({
        title: title || "Untitled Note",
        folderId: folderId || null,
        color: color || null,
      });
      await loadDashboard();
      openNote(note);
      showToast("📝 New note created");
    } catch {
      showToast("⚠️ Failed to create note");
    }
  }

  /* ── Move Item (cross-folder DnD) ────────────────────── */
  async function handleMoveItem(item, targetFolderId) {
    try {
      if (item._type === "note") {
        await updateNote(item.id, { folder_id: targetFolderId });
      } else {
        await updateChat(item.id, { folder_id: targetFolderId });
      }
      await loadDashboard();
      showToast(`📁 Moved "${item.title}" to new folder`);
    } catch {
      showToast("⚠️ Could not move item — try again");
    }
  }

  /* ── Delete Chat ─────────────────────────────────────────── */
  // WHAT: Deletes a chat permanently from the database.
  // WHY:  The sidebar ⋮ menu on chats previously opened a context menu
  //       with a Delete button that did nothing (no callback was passed).
  // HOW:  Calls DELETE /api/chats/:chatId, then reloads dashboard tree.
  //       If the deleted chat was active, resets to home view.
  async function handleDeleteChat(chatId) {
    if (!chatId) return;
    if (!confirm("Delete this chat and all its messages?")) return;
    try {
      await deleteChat(chatId);
      if (activeChat?.id === chatId) { setActiveChat(null); setView("home"); setMessages([]); }
      await loadDashboard();
      showToast("🗑 Chat deleted");
    } catch {
      showToast("⚠️ Could not delete chat");
    }
  }

  /* ── Delete Note ─────────────────────────────────────────── */
  // WHAT: Deletes a note permanently.
  // WHY:  Same as chat — the ⋮ menu callback onDelete was never set.
  // HOW:  Calls DELETE /api/dashboard/notes/:noteId, reloads sidebar.
  async function handleDeleteNote(noteId) {
    if (!noteId) return;
    if (!confirm("Delete this note permanently?")) return;
    try {
      await deleteNote(noteId);
      if (activeNote?.id === noteId) { setActiveNote(null); setView("home"); }
      await loadDashboard();
      showToast("🗑 Note deleted");
    } catch {
      showToast("⚠️ Could not delete note");
    }
  }

  /* ── Rename Chat ────────────────────────────────────────── */
  // WHAT: Renames a chat's title.
  // WHY:  Users needed a way to rename chats from the sidebar context menu.
  //       Auto-generated titles from AI are often not descriptive enough.
  // HOW:  Calls PUT /api/chats/:chatId, then updates local activeChat state
  //       if it's the one being renamed, plus reloads sidebar tree.
  async function handleRenameChat(chatId, newTitle) {
    if (!chatId || !newTitle?.trim()) return;
    try {
      await renameChat(chatId, newTitle.trim());
      if (activeChat?.id === chatId) setActiveChat(c => ({ ...c, title: newTitle.trim() }));
      await loadDashboard();
      showToast(`✏️ Chat renamed to "${newTitle.trim()}"`);
    } catch {
      showToast("⚠️ Could not rename chat");
    }
  }

  /* ── Send Message ───────────────────────────────────── */
  async function handleSendMessage(text, chatId) {
    if (!text?.trim()) return;
    const tempId = Date.now();
    setMessages(m => [...m, { id: tempId, role: "user", content: text, created_at: new Date().toISOString() }]);
    try {
      // Pass the activeChat.folder_id if we are making a new chat
      const res = await sendMessage({ 
        chatId: chatId || null, 
        message: text,
        folderId: !chatId && activeChat ? activeChat.folder_id : null 
      });
      
      // If this was a temporary chat, update active chat and reload tree
      if (!chatId && res.chat) {
        setActiveChat(res.chat);
        await loadDashboard(); // refresh sidebar 
      }

      setMessages(m => [...m, { id: tempId + 1, role: "ai", content: res.reply || res.message || "…", created_at: new Date().toISOString() }]);
    } catch {
      showToast("⚠️ AI reply failed — check GEMINI_API_KEY");
      setMessages(m => m.filter(msg => msg.id !== tempId));
    }
  }

  /* ── Save Note ──────────────────────────────────────── */
  async function handleSaveNote(noteId, data) {
    if (!noteId) return;
    try {
      const updated = await updateNote(noteId, data);
      setActiveNote(updated);
    } catch {
      showToast("⚠️ Save failed");
    }
  }

  /* ── Icon rail section change ───────────────────────── */
  function handleSectionChange(s) {
    if (s === "settings") { setView("settings"); setSection("settings"); }
    else { setSection(s); if (view === "settings") setView("home"); }
  }

  /* ── Context menu ───────────────────────────────────── */
  function showCtxMenu(e, type, id, meta = {}) {
    e.preventDefault();
    setCtxMenu({ show: true, x: e.clientX, y: e.clientY, type, id, meta });
  }

  /* ── Breadcrumbs ────────────────────────────────────── */
  const breadcrumbs = [];
  if (activeFolder) breadcrumbs.push(activeFolder.name);
  if (view === "chat"  && activeChat) breadcrumbs.push(activeChat.title);
  if ((view === "note" || view === "split") && activeNote) breadcrumbs.push(activeNote.title);

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="layout" data-theme={theme} style={{ paddingTop: "var(--topbar)" }}>

      {/* Topbar — fixed above everything */}
      <Topbar
        breadcrumbs={["Workspace", ...breadcrumbs]}
        theme={theme} onToggleTheme={toggleTheme}
        view={view} splitMode={splitMode}
        activeChat={activeChat}
        onToggleSplit={() => {
          if (splitMode) {
            setSplitMode(false);
            setSplitNote(null);
            setView(activeChat ? "chat" : activeNote ? "note" : "home");
          } else {
            setSplitMode(true);
            setShowSplitPicker(true);
            setView("split");
          }
        }}
        ctxPanelOpen={ctxPanelOpen}
        onToggleCtxPanel={() => setCtxPanelOpen(o => !o)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebarCollapse={() => setSidebarCollapsed(c => !c)}
        user={user} onLogout={logout}
      />

      {/* Icon Rail */}
      <IconRail active={section} onSelect={handleSectionChange}/>

      {/* Sidebar */}
      {view !== "settings" && (
        <Sidebar
          section={section}
          folders={folders} inbox={inbox}
          activeChat={activeChat} activeNote={activeNote} activeFolder={activeFolder}
          loading={dataLoading}
          onOpenChat={openChat} onOpenNote={openNote}
          onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateChat={handleCreateChat}
          onCreateNote={handleCreateNote}
          onDeleteChat={handleDeleteChat}
          onDeleteNote={handleDeleteNote}
          onRenameChat={handleRenameChat}
          onSelectFolder={f => { setActiveFolder(f); setView("home"); }}
          onCtx={showCtxMenu}
          onShowToast={showToast}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
          onMoveItem={handleMoveItem}
        />
      )}

      {/* Main column */}
      <div className="main">

        {/* Settings */}
        {view === "settings" && (
          <SettingsView
            onBack={() => { setView("home"); setSection("ws"); }}
            onShowToast={showToast}
            theme={theme} onToggleTheme={toggleTheme}
          />
        )}

        {/* Workspace home */}
        {view === "home" && (
          <div className="ws-home active" style={{ display: "block" }}>
            <WorkspaceHome
              folder={activeFolder
                ? (findFolderInTree(folders, activeFolder.id) || activeFolder)
                : { name: "Workspace", color: "var(--accent)" }
              }
              onOpenChat={openChat}
              onOpenNote={openNote}
              onCreateChat={() => handleCreateChat(activeFolder?.id)}
              onCreateNote={(fId, title, color) => handleCreateNote(fId ?? activeFolder?.id, title, color)}
              onShowToast={showToast}
            />
          </div>
        )}


        {/* ── CHAT VIEW: just chat pane ── */}
        {view === "chat" && activeChat && (
          <div className="split-pane">
            <ChatPane
              chat={activeChat}
              messages={messages}
              onSend={text => handleSendMessage(text, activeChat.id)}
              onOpenNote={openNote}
              onShowToast={showToast}
              onShowCtx={showCtxMenu}
            />
          </div>
        )}

        {/* ── NOTE VIEW: note pane + AI panel (always visible) ── */}
        {view === "note" && activeNote && (
          <div className="split-pane">
            <NotePane
              note={activeNote}
              fullWidth={true}
              onSave={handleSaveNote}
              onShowToast={showToast}
            />
            {ctxPanelOpen && (
              <AIPanel
                folder={activeFolder}
                note={activeNote}
                onClose={() => setCtxPanelOpen(false)}
              />
            )}
          </div>
        )}

        {/* ── SPLIT VIEW: chat left + chosen note right ── */}
        {view === "split" && (
          <div className="split-pane">
            {activeChat && (
              <ChatPane
                chat={activeChat}
                messages={messages}
                onSend={text => handleSendMessage(text, activeChat.id)}
                onOpenNote={openNote}
                onShowToast={showToast}
                onShowCtx={showCtxMenu}
              />
            )}

            {/* Picker: user selects a note to show in right pane */}
            {showSplitPicker && !splitNote && (
              <div style={{
                width: 280, flexShrink: 0, display: "flex", flexDirection: "column",
                borderLeft: "1px solid var(--border)",
                background: "var(--panel)", overflow: "hidden",
              }}>
                <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)", fontFamily: "'Syne',sans-serif", marginBottom: 6 }}>Pick a note for split view</div>
                  <select
                    value={splitFilter}
                    onChange={(e) => setSplitFilter(e.target.value)}
                    style={{
                      width: "100%", padding: "6px 8px", background: "var(--input-bg)",
                      border: "1px solid var(--border)", borderRadius: "6px",
                      fontSize: "11.5px", color: "var(--text-dim)", outline: "none",
                      fontFamily: "'DM Sans', sans-serif"
                    }}
                  >
                    <option value="all">All Notes</option>
                    <option value="inbox">Inbox Notes</option>
                    {folders?.map(f => (
                      <option key={f.id} value={f.id}>Folder: {f.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
                  {(() => {
                    const allInboxNotes = (inbox?.notes || []).map(n => ({ ...n, folderName: "Inbox" }));
                    const allFolderNotes = (folders || []).flatMap(f => (f.notes || []).map(n => ({ ...n, folderName: f.name })));
                    const filteredNotes = splitFilter === "all" ? [...allInboxNotes, ...allFolderNotes] :
                      splitFilter === "inbox" ? allInboxNotes :
                      allFolderNotes.filter(n => String(n.folder_id) === String(splitFilter));

                    if (filteredNotes.length === 0) {
                      return <div style={{ textAlign: "center", color: "var(--faint)", fontSize: 12, padding: 20 }}>No notes found</div>;
                    }

                    return filteredNotes.map(n => (
                      <div key={n.id}
                        onClick={() => { setSplitNote(n); setShowSplitPicker(false); }}
                        style={{
                          padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                          display: "flex", flexDirection: "column", gap: 3,
                          transition: "background .1s", marginBottom: 2,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--chip-bg)"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {n.color && (
                            <span style={{ width: 8, height: 8, borderRadius: "50%",
                              background: n.color, flexShrink: 0 }}/>
                          )}
                          <span style={{ fontSize: 12.5, color: "var(--text-dim)",
                            flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.title || "Untitled"}
                          </span>
                        </div>
                        <div style={{ fontSize: 9.5, color: "var(--faint)", paddingLeft: 16 }}>{n.folderName}</div>
                      </div>
                    ));
                  })()}
                </div>
                <button
                  onClick={() => { setShowSplitPicker(false); setSplitMode(false); setView("chat"); }}
                  style={{
                    margin: 10, padding: "7px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "transparent", color: "var(--faint)", cursor: "pointer", fontSize: 12,
                  }}
                >Cancel split</button>
              </div>
            )}

            {/* Split right: selected note */}
            {splitNote && !showSplitPicker && (
              <NotePane
                note={splitNote}
                onSave={handleSaveNote}
                onShowToast={showToast}
              />
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        show={ctxMenu.show}
        x={ctxMenu.x} y={ctxMenu.y}
        type={ctxMenu.type}
        meta={ctxMenu.meta}
        onClose={() => setCtxMenu(m => ({ ...m, show: false }))}
        onShowToast={showToast}
        onDelete={() => {
          const m = ctxMenu.meta || {};
          if (m.onDelete) { setCtxMenu(c => ({...c, show:false})); m.onDelete(); }
        }}
        onRename={() => {
          const m = ctxMenu.meta || {};
          setCtxMenu(c => ({...c, show: false}));
          // Folder rows use m.setRenaming (sets inline rename state)
          // Chat/note inbox items use m.onRename (prompt-based or inline)
          if (m.setRenaming) m.setRenaming(true);
          else if (m.onRename) m.onRename();
        }}
      />

      {/* Toast */}
      <Toast msg={toast.msg} show={toast.show}/>
    </div>
  );
}

/* ── Tree helpers ──────────────────────────────────────── */
function updateFolderInTree(folders, id, patch) {
  return folders.map(f => {
    if (f.id === id) return { ...f, ...patch };
    return { ...f, children: updateFolderInTree(f.children || [], id, patch) };
  });
}
function removeFolderFromTree(folders, id) {
  return folders
    .filter(f => f.id !== id)
    .map(f => ({ ...f, children: removeFolderFromTree(f.children || [], id) }));
}
function findFolderInTree(folders, id) {
  for (const f of folders) {
    if (f.id === id) return f;
    const found = findFolderInTree(f.children || [], id);
    if (found) return found;
  }
  return null;
}
