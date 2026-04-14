// frontend/src/components/dashboard/v5/Sidebar.jsx
// FULL REWRITE — collapsible sidebar, global +menu, note colors, cross-folder DnD
import { useState, useRef, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

/* ── dnd-kit transform helper ── */
function toTransformStyle(t) {
  if (!t) return undefined;
  return `translate3d(${t.x}px,${t.y}px,0) scaleX(${t.scaleX}) scaleY(${t.scaleY})`;
}

/* ── Palettes ── */
const FOLDER_COLORS = [
  "#5a8cff","#7c5af7","#f75a9a","#f7915a",
  "#f7d05a","#5af7a0","#5ad4f7","#b0b8d0",
];
const NOTE_COLORS = [
  "#ffffff","#fef9c3","#fce7f3","#dbeafe",
  "#d1fae5","#ede9fe","#ffedd5","#f1f5f9",
];
const NOTE_COLOR_LABELS = [
  "Default","Yellow","Pink","Blue",
  "Green","Purple","Orange","Slate",
];

/* ── SVG Icons ── */
const ChatIcon  = () => (<svg viewBox="0 0 12 12" fill="none"><path d="M1.5 2.5h9a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H4L1.5 10V3a.5.5 0 010 0z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>);
const NoteIcon  = () => (<svg viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1" width="7" height="9.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><line x1="3.5" y1="3.5" x2="7" y2="3.5" stroke="currentColor" strokeWidth="1"/><line x1="3.5" y1="5.5" x2="7" y2="5.5" stroke="currentColor" strokeWidth="1"/><line x1="3.5" y1="7.5" x2="5.5" y2="7.5" stroke="currentColor" strokeWidth="1"/></svg>);
const ChevIcon  = () => (<svg viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const SearchIcon= () => (<svg viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/><line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>);
const InboxIcon = () => (<svg viewBox="0 0 12 12" fill="none"><path d="M1.5 7.5h2l1 2h3l1-2h2M1.5 7.5V3a.5.5 0 01.5-.5h8a.5.5 0 01.5.5v4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const FolderPlusIcon = () => (<svg viewBox="0 0 14 14" fill="none"><path d="M2 4a1.5 1.5 0 011.5-1.5h2L7 4h4.5A1.5 1.5 0 0113 5.5V10A1.5 1.5 0 0111.5 11.5h-9A1.5 1.5 0 011 10V4z" stroke="currentColor" strokeWidth="1.3"/><line x1="7" y1="6.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5.5" y1="8" x2="8.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>);
const GripIcon  = () => (<svg viewBox="0 0 8 14" fill="none" style={{width:8,height:14,flexShrink:0}}><circle cx="2" cy="3" r="1" fill="currentColor"/><circle cx="6" cy="3" r="1" fill="currentColor"/><circle cx="2" cy="7" r="1" fill="currentColor"/><circle cx="6" cy="7" r="1" fill="currentColor"/><circle cx="2" cy="11" r="1" fill="currentColor"/><circle cx="6" cy="11" r="1" fill="currentColor"/></svg>);
const SidebarToggleIcon = ({ collapsed }) => (
  <svg viewBox="0 0 14 14" fill="none" style={{width:13,height:13}}>
    {collapsed
      ? <><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="5" y1="2" x2="5" y2="12" stroke="currentColor" strokeWidth="1.3"/><path d="M7 5l2.5 2-2.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></>
      : <><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><line x1="5" y1="2" x2="5" y2="12" stroke="currentColor" strokeWidth="1.3"/><path d="M9 5l-2.5 2L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></>
    }
  </svg>
);

/* ── Inline rename ── */
function InlineInput({ placeholder, onCommit, onCancel }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  function onKey(e) {
    if (e.key === "Enter")  { e.preventDefault(); onCommit(ref.current.value.trim()); }
    if (e.key === "Escape") onCancel();
  }
  return (
    <input ref={ref} defaultValue="" placeholder={placeholder} onKeyDown={onKey}
      onBlur={() => onCommit(ref.current?.value.trim())}
      style={{ flex:1, background:"var(--input-bg)", border:"1px solid var(--accent-border)",
        borderRadius:6, color:"var(--text)", fontSize:12, padding:"3px 8px",
        outline:"none", fontFamily:"'DM Sans',sans-serif" }}
    />
  );
}

/* ═══ FOLDER CREATION MODAL ═══════════════════════════════════════════ */
function FolderModal({ folders, onCommit, onCancel }) {
  const inputRef = useRef(null);
  const [name,     setName]     = useState("");
  const [color,    setColor]    = useState(FOLDER_COLORS[0]);
  const [parentId, setParentId] = useState(null);
  const [pOpen,    setPOpen]    = useState(false);
  const dropRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (!pOpen) return;
    const h = e => { if (!dropRef.current?.contains(e.target)) setPOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [pOpen]);

  const flatFolders = [];
  (function flatten(arr, depth) {
    arr.forEach(f => { flatFolders.push({id:f.id,name:f.name,color:f.color,depth}); flatten(f.children||[],depth+1); });
  })(folders, 0);

  function submit() {
    const t = name.trim();
    if (!t) { inputRef.current?.focus(); return; }
    onCommit(t, color, parentId);
  }
  function onKey(e) {
    if (e.key==="Enter") { e.preventDefault(); submit(); }
    if (e.key==="Escape") onCancel();
  }
  const parentLabel = parentId ? (flatFolders.find(f=>f.id===parentId)?.name||"Unknown") : "Root (No parent)";

  return (
    <div onClick={e => { if (e.target===e.currentTarget) onCancel(); }}
      style={{ position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.55)",display:"flex",
        alignItems:"center",justifyContent:"center",backdropFilter:"blur(3px)" }}>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,
        padding:"28px 28px 22px",width:460,boxShadow:"0 20px 60px rgba(0,0,0,.5)",
        animation:"dropIn .15s ease" }}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,color:"var(--text)",marginBottom:4}}>
              New Folder
            </div>
            <div style={{fontSize:12,color:"var(--faint)"}}>Organize your chats and notes</div>
          </div>
          <button onClick={onCancel} style={{background:"none",border:"none",color:"var(--faint)",fontSize:18,cursor:"pointer",padding:"2px 4px"}}>✕</button>
        </div>
        {/* Name */}
        <div style={{marginBottom:18}}>
          <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"var(--text-dim)",marginBottom:6}}>Folder Name</label>
          <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)} onKeyDown={onKey}
            placeholder="e.g., Work / Research"
            style={{width:"100%",padding:"10px 13px",background:"var(--input-bg)",border:"1px solid var(--border)",
              borderRadius:9,color:"var(--text)",fontSize:13,outline:"none",
              fontFamily:"'DM Sans',sans-serif",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="var(--accent-border)"}
            onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        </div>
        {/* Color */}
        <div style={{marginBottom:18}}>
          <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"var(--text-dim)",marginBottom:8}}>Color</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {FOLDER_COLORS.map(c=>(
              <div key={c} onClick={()=>setColor(c)} style={{
                width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",
                border:color===c?"3px solid var(--text)":"3px solid transparent",
                outline:color===c?`2px solid ${c}88`:"none",outlineOffset:2,transition:"border .15s,outline .15s"}}/>
            ))}
          </div>
        </div>
        {/* Parent */}
        <div style={{marginBottom:24}} ref={dropRef}>
          <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"var(--text-dim)",marginBottom:6}}>Parent Folder</label>
          <div style={{position:"relative"}}>
            <div onClick={()=>setPOpen(o=>!o)}
              style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"9px 13px",background:"var(--input-bg)",border:"1px solid var(--border)",
                borderRadius:9,cursor:"pointer",fontSize:13,color:"var(--text)",userSelect:"none"}}>
              <span>{parentLabel}</span>
              <svg viewBox="0 0 10 10" fill="none" style={{width:12,height:12,color:"var(--faint)",
                transform:pOpen?"rotate(180deg)":"rotate(0)",transition:"transform .15s"}}>
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {pOpen&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:100,
                background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,
                boxShadow:"0 10px 32px rgba(0,0,0,.35)",maxHeight:200,overflowY:"auto",animation:"dropIn .12s ease"}}>
                <div onClick={()=>{setParentId(null);setPOpen(false);}}
                  style={{padding:"10px 14px",cursor:"pointer",fontSize:13,
                    background:parentId===null?"var(--accent-glow)":"transparent",
                    color:parentId===null?"var(--accent3)":"var(--text)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  Root (No parent) {parentId===null&&<span>✓</span>}
                </div>
                {flatFolders.map(f=>(
                  <div key={f.id} onClick={()=>{setParentId(f.id);setPOpen(false);}}
                    style={{padding:"10px 14px",paddingLeft:14+f.depth*14,cursor:"pointer",fontSize:13,
                      background:parentId===f.id?"var(--accent-glow)":"transparent",
                      color:parentId===f.id?"var(--accent3)":"var(--text-dim)",
                      display:"flex",alignItems:"center",gap:8}}
                    onMouseEnter={e=>{if(parentId!==f.id)e.currentTarget.style.background="var(--chip-bg)";}}
                    onMouseLeave={e=>{if(parentId!==f.id)e.currentTarget.style.background="transparent";}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:f.color||"var(--accent)",display:"inline-block",flexShrink:0}}/>
                    {f.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Actions */}
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button onClick={onCancel}
            style={{padding:"9px 20px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",fontSize:13,cursor:"pointer"}}>
            Cancel</button>
          <button onClick={submit}
            style={{padding:"9px 22px",borderRadius:9,border:"none",background:color,color:"#fff",
              fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:`0 4px 16px ${color}55`}}>
            Create Folder</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ NOTE CREATION FORM ════════════════════════════════════════════════ */
function NewNoteForm({ onCommit, onCancel }) {
  const inputRef = useRef(null);
  const [name,  setName]  = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  function submit() { onCommit(name.trim()||"Untitled Note", color); }
  function onKey(e) {
    if (e.key==="Enter")  { e.preventDefault(); submit(); }
    if (e.key==="Escape") onCancel();
  }
  return (
    <div style={{margin:"6px 8px",background:"var(--card)",border:"1px solid var(--accent-border)",
      borderRadius:10,padding:"10px 10px",boxShadow:"0 4px 18px rgba(0,0,0,.22)",
      animation:"dropIn .12s ease",boxSizing:"border-box"}}>
      <div style={{fontSize:10.5,fontWeight:600,color:"var(--faint)",marginBottom:8,letterSpacing:".04em",textTransform:"uppercase"}}>
        📝 New Note
      </div>
      {/* Color swatches grid 4×2 */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:8}}>
        {NOTE_COLORS.map((c,i)=>(
          <div key={c} onClick={()=>setColor(c)} title={NOTE_COLOR_LABELS[i]} style={{
            height:22,borderRadius:5,cursor:"pointer",
            background:c==="#ffffff"?"rgba(255,255,255,.85)":c,
            border:color===c?"2.5px solid var(--accent3)":"1.5px solid var(--border)",
            boxShadow:color===c?`0 0 0 2px ${c==="#ffffff"?"rgba(255,255,255,.3)":c+"44"}`:"none",
            transition:"border .12s"}}/>
        ))}
      </div>
      {/* Color preview strip */}
      <div style={{height:3,borderRadius:2,marginBottom:10,
        background:color==="#ffffff"?"rgba(255,255,255,.25)":color,transition:"background .2s"}}/>
      {/* Name input */}
      <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)} onKeyDown={onKey}
        placeholder="Note name (optional)…"
        style={{width:"100%",boxSizing:"border-box",background:"var(--input-bg)",
          border:"1px solid var(--accent-border)",borderRadius:7,color:"var(--text)",
          fontSize:12.5,padding:"7px 10px",outline:"none",fontFamily:"'DM Sans',sans-serif",display:"block"}}/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:6,marginTop:8}}>
        <button onClick={onCancel}
          style={{padding:"5px 12px",borderRadius:7,border:"1px solid var(--border)",background:"transparent",color:"var(--text-dim)",fontSize:12,cursor:"pointer"}}>
          Cancel</button>
        <button onClick={submit}
          style={{padding:"5px 14px",borderRadius:7,border:"none",background:"var(--accent)",
            color:"#fff",fontSize:12,cursor:"pointer",fontWeight:600}}>
          Create →</button>
      </div>
    </div>
  );
}

/* ═══ GLOBAL + MENU (top of sidebar) ═══════════════════════════════════ */
function GlobalAddMenu({ onCreateFolder, onCreateChat, onCreateNote, onClose }) {
  const menuRef = useRef(null);
  useEffect(() => {
    const h = e => { if (!menuRef.current?.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={menuRef} style={{
      position:"absolute",top:"calc(100% + 6px)",right:0,zIndex:500,
      background:"var(--card)",border:"1px solid var(--border)",
      borderRadius:12,padding:6,minWidth:210,
      boxShadow:"0 12px 48px rgba(0,0,0,.4)",animation:"dropIn .12s ease",
      display:"flex",flexDirection:"column",gap:2
    }}>
      <div className="cm-item" onClick={()=>{onCreateChat();onClose();}} style={{padding:"8px 10px",borderRadius:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--chip-bg)",border:"1px solid var(--border)",color:"var(--text-dim)"}}>
            <ChatIcon/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>New Chat</div>
            <div style={{fontSize:10.5,color:"var(--faint)",marginTop:1}}>Talk to AI with context</div>
          </div>
        </div>
      </div>
      <div className="cm-item" onClick={()=>{onCreateNote();onClose();}} style={{padding:"8px 10px",borderRadius:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--chip-bg)",border:"1px solid var(--border)",color:"var(--text-dim)"}}>
            <NoteIcon/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>New Note</div>
            <div style={{fontSize:10.5,color:"var(--faint)",marginTop:1}}>Write down your thoughts</div>
          </div>
        </div>
      </div>
      <div style={{height:1,background:"var(--border)",margin:"4px 8px"}}/>
      <div className="cm-item" onClick={()=>{onCreateFolder();onClose();}} style={{padding:"8px 10px",borderRadius:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--accent-glow)",border:"1px solid var(--accent-border)",color:"var(--accent3)"}}>
            <FolderPlusIcon/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>New Folder</div>
            <div style={{fontSize:10.5,color:"var(--faint)",marginTop:1}}>Organize your workspace</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ FOLDER + POP (per-folder +) ═══════════════════════════════════════ */
function AddPop({ onAddChat, onRequestNoteForm, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <div ref={ref} style={{position:"absolute",zIndex:200,top:"100%",right:0,
      background:"var(--card)",border:"1px solid var(--border)",
      borderRadius:11,padding:4,minWidth:160,
      boxShadow:"0 10px 44px rgba(0,0,0,.32)",animation:"dropIn .12s ease"}}>
      <div className="cm-item" onClick={()=>{onAddChat();onClose();}}>
        <div className="fi-icon-wrap chat-icon" style={{width:20,height:20}}><ChatIcon/></div>
        New Chat
      </div>
      <div className="cm-item" onClick={()=>{onClose();onRequestNoteForm();}}>
        <div className="fi-icon-wrap note-icon" style={{width:20,height:20}}><NoteIcon/></div>
        New Note…
      </div>
    </div>
  );
}

/* ═══ DROPPABLE FOLDER ZONE (for cross-folder DnD) ═══════════════════ */
function DroppableFolder({ folderId, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: `dropzone-folder-${folderId}` });
  return (
    <div ref={setNodeRef} style={{
      outline: isOver ? "2px dashed var(--accent-border)" : "none",
      borderRadius: 8, transition: "outline .1s",
    }}>
      {children}
    </div>
  );
}

/* ═══ SORTABLE ITEM (chat or note row) ═══════════════════════════════ */
function SortableFolderItem({ id, name, type, color, active, onClick, onCtx }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const noteColor = type === "note" && color && color !== "#ffffff" ? color : null;

  return (
    <div ref={setNodeRef} style={{ transform:toTransformStyle(transform), transition, opacity:isDragging?0.3:1 }}>
      <div className={`fi${active?" active":""}`} onClick={onClick} style={{display:"flex",alignItems:"center"}}>
        {/* Drag grip */}
        <span {...attributes} {...listeners} onClick={e=>e.stopPropagation()}
          style={{display:"flex",alignItems:"center",color:"var(--faint)",cursor:"grab",
            padding:"0 3px",opacity:0.45,touchAction:"none",flexShrink:0}}
          title="Drag to reorder or move">
          <GripIcon/>
        </span>
        {/* Note color dot */}
        {noteColor && (
          <span style={{width:6,height:6,borderRadius:"50%",background:noteColor,
            flexShrink:0,marginRight:2,boxShadow:`0 0 0 2px ${noteColor}44`}}/>
        )}
        <div className={`fi-icon-wrap ${type==="chat"?"chat-icon":"note-icon"}`}
          style={noteColor?{borderColor:`${noteColor}55`}:{}}>
          {type==="chat"?<ChatIcon/>:<NoteIcon/>}
        </div>
        <span className="fi-name" style={noteColor?{color:`var(--text-dim)`}:{}}>{name}</span>
        <button className="fi-menu" onClick={e=>{e.stopPropagation();onCtx(e,type);}}>⋮</button>
      </div>
    </div>
  );
}

/* ═══ DRAG OVERLAY ════════════════════════════════════════════════════ */
function DragOverlayItem({ name, type, color }) {
  const noteColor = type==="note"&&color&&color!=="#ffffff"?color:null;
  return (
    <div className="fi" style={{background:"var(--card)",border:"1px solid var(--accent-border)",
      borderRadius:7,boxShadow:"0 8px 32px rgba(0,0,0,.4)",opacity:0.95,
      display:"flex",alignItems:"center",gap:6,padding:"5px 8px",minWidth:180}}>
      {noteColor&&<span style={{width:6,height:6,borderRadius:"50%",background:noteColor,flexShrink:0}}/>}
      <div className={`fi-icon-wrap ${type==="chat"?"chat-icon":"note-icon"}`}>{type==="chat"?<ChatIcon/>:<NoteIcon/>}</div>
      <span className="fi-name">{name}</span>
    </div>
  );
}

/* ═══ FOLDER ROW (with local sort only) ════════════════════════════════ */
function FolderRow({
  folder, activeChat, activeNote, activeFolder,
  onOpenChat, onOpenNote, onCreateChat, onCreateNote,
  onSelectFolder, onRenameFolder, onDeleteFolder, onCtx, depth=0,
}) {
  const [open,         setOpen]         = useState(depth===0);
  const [addPop,       setAddPop]       = useState(false);
  const [renaming,     setRenaming]     = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [chats,        setChats]        = useState(folder.chats||[]);
  const [notes,        setNotes]        = useState(folder.notes||[]);
  const [ragScope,     setRagScope]     = useState(true);
  useEffect(()=>{ setChats(folder.chats||[]); },[folder.chats]);
  useEffect(()=>{ setNotes(folder.notes||[]); },[folder.notes]);

  const children = folder.children||[];
  const isActive = activeFolder?.id===folder.id;
  const dndItems = [
    ...chats.map(c=>({...c,_type:"chat"})),
    ...notes.map(n=>({...n,_type:"note"})),
  ];
  const [activeItem, setActiveItem] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}));

  // Instead of handling drag end locally, we rely on WorkspaceView's global DndContext
  // We just render the SortableContext here.

  function handleFolderClick() { setOpen(o=>!o); onSelectFolder(folder); }
  function commitRename(n) { setRenaming(false); if(n) onRenameFolder(folder.id,n); }

  return (
    <DroppableFolder folderId={folder.id}>
      <div className="fw">
        <div className={`frow${isActive?" active":""}`} onClick={handleFolderClick}>
          <div className={`fr-chev${open?" open":""}`}><ChevIcon/></div>
          <div className="fr-dot" style={{background:folder.color||"var(--accent)"}}/>
          {renaming
            ? <InlineInput placeholder={folder.name} onCommit={commitRename} onCancel={()=>setRenaming(false)}/>
            : <span className="fr-name" onDoubleClick={e=>{e.stopPropagation();setRenaming(true);}}>
                {folder.name}
              </span>
          }
          <div className="fr-acts" onClick={e=>e.stopPropagation()} style={{position:"relative"}}>
            <div className="rag-scope-toggle" title={`RAG scope: ${ragScope ? 'within folder' : 'global'}`} onClick={(e)=>{e.stopPropagation(); setRagScope(c=>!c);}}>
              <div className={`rst-track ${ragScope ? 'on' : 'off'}`}>
                <div className="rst-thumb"></div>
              </div>
              <span className="rst-label">{ragScope ? 'IN' : 'GL'}</span>
            </div>
            <button className="fr-btn" title="Add" onClick={e=>{e.stopPropagation();setAddPop(p=>!p);}}>＋</button>
            <button className="fr-btn" title="More" onClick={e=>{e.stopPropagation();onCtx(e,"folder",folder.id,{setRenaming,onDelete:()=>onDeleteFolder(folder.id)});}}>···</button>
            {addPop&&(
              <AddPop
                onAddChat={()=>{onCreateChat(folder.id);setAddPop(false);}}
                onRequestNoteForm={()=>{setShowNoteForm(true);setOpen(true);}}
                onClose={()=>setAddPop(false)}
              />
            )}
          </div>
        </div>

        {showNoteForm&&(
          <div style={{paddingLeft:22}}>
            <NewNoteForm
              onCommit={(title,color)=>{setShowNoteForm(false);onCreateNote(folder.id,title,color);}}
              onCancel={()=>setShowNoteForm(false)}
            />
          </div>
        )}

        {open&&(
          <div className="fchildren open">
            {children.map(child=>(
              <FolderRow key={child.id} folder={child}
                activeChat={activeChat} activeNote={activeNote} activeFolder={activeFolder}
                onOpenChat={onOpenChat} onOpenNote={onOpenNote}
                onCreateChat={onCreateChat} onCreateNote={onCreateNote}
                onSelectFolder={onSelectFolder}
                onRenameFolder={onRenameFolder} onDeleteFolder={onDeleteFolder}
                onCtx={onCtx} depth={depth+1}/>
            ))}

            {dndItems.length>0?(
              <SortableContext items={dndItems.map(i=>`item-${i._type}-${i.id}`)} strategy={verticalListSortingStrategy}>
                {dndItems.map(item=>(
                  <SortableFolderItem
                    key={`item-${item._type}-${item.id}`} id={`item-${item._type}-${item.id}`}
                    name={item.title} type={item._type} color={item.color}
                    active={item._type==="chat"?activeChat?.id===item.id:activeNote?.id===item.id}
                    onClick={()=>item._type==="chat"?onOpenChat(item):onOpenNote(item)}
                    onCtx={onCtx}
                  />
                ))}
              </SortableContext>
            ):children.length===0?(
              <div style={{padding:"4px 8px 4px 22px",color:"var(--faint)",fontSize:11}}>
                Empty — click ＋ to add
              </div>
            ):null}
          </div>
        )}
      </div>
    </DroppableFolder>
  );
}

/* ═══ CROSS-FOLDER DND WRAPPER REMOVED (integrated below) ════════════ */

/* ═══ SORTABLE FOLDER ROW WRAPPER ════════════════════════════════════ */
function SortableFolderRow({ folder, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `folder-${folder.id}` });
  return (
    <div ref={setNodeRef} style={{transform:toTransformStyle(transform),transition,opacity:isDragging?0.4:1}}>
      <div style={{display:"flex",alignItems:"flex-start"}}>
        <span {...attributes} {...listeners}
          style={{display:"flex",alignItems:"center",padding:"8px 3px 0",color:"var(--faint)",
            cursor:"grab",opacity:0.4,touchAction:"none",flexShrink:0}}
          title="Drag folder to reorder">
          <GripIcon/>
        </span>
        <div style={{flex:1,minWidth:0}}>
          <FolderRow folder={folder} {...props}/>
        </div>
      </div>
    </div>
  );
}

/* ═══ WORKSPACE VIEW (main sidebar panel) ════════════════════════════ */
function WorkspaceView({
  folders, inbox, activeChat, activeNote, activeFolder, loading,
  onOpenChat, onOpenNote,
  onCreateFolder, onCreateChat, onCreateNote,
  onSelectFolder, onRenameFolder, onDeleteFolder,
  onDeleteChat, onDeleteNote, onRenameChat,
  onCtx, onShowToast, onMoveItem,
}) {
  const [inboxOpen,       setInboxOpen]       = useState(true);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [creatingNote,    setCreatingNote]    = useState(false);
  const [globalMenu,      setGlobalMenu]      = useState(false);
  const globalMenuRef = useRef(null);

  const [folderOrder, setFolderOrder] = useState(folders.map(f=>`folder-${f.id}`));
  useEffect(()=>{ setFolderOrder(folders.map(f=>`folder-${f.id}`)); },[folders]);
  const sortedFolders = folderOrder.map(id=>folders.find(f=>`folder-${f.id}`===id)).filter(Boolean);

  const [activeDragFolder, setActiveDragFolder] = useState(null);
  const [activeDragItem, setActiveDragItem] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}));

  // Flatten all items for lookup across the entire tree
  const allItems = [];
  (function collect(arr) {
    arr.forEach(f=>{
      (f.chats||[]).forEach(c=>allItems.push({...c,_type:"chat",folderId:f.id}));
      (f.notes||[]).forEach(n=>allItems.push({...n,_type:"note",folderId:f.id}));
      collect(f.children||[]);
    });
  })(folders);

  function handleGlobalDragStart(e) {
    if (String(e.active.id).startsWith("folder-")) {
      setActiveDragFolder(folders.find(f=>`folder-${f.id}`===String(e.active.id))||null);
    } else if (String(e.active.id).startsWith("item-")) {
      const item = allItems.find(i=>`item-${i._type}-${i.id}`===String(e.active.id));
      setActiveDragItem(item || null);
    }
  }

  function handleGlobalDragEnd(e) {
    setActiveDragFolder(null);
    setActiveDragItem(null);
    const { active, over } = e;
    if (!over) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);

    // 1) Folder reordering
    if (activeId.startsWith("folder-") && overId.startsWith("folder-")) {
      if (activeId === overId) return;
      const o = folderOrder.indexOf(activeId);
      const n = folderOrder.indexOf(overId);
      if (o>=0 && n>=0) setFolderOrder(fo=>arrayMove(fo,o,n));
      return;
    }

    // 2) Moving an item to a folder dropzone
    if (activeId.startsWith("item-") && overId.startsWith("dropzone-folder-")) {
      const targetFolderId = Number(overId.replace("dropzone-folder-",""));
      const item = allItems.find(i=>`item-${i._type}-${i.id}`===activeId);
      if (item && item.folderId !== targetFolderId) {
        onMoveItem(item, targetFolderId);
      }
    }
  }

  return (
    <div className="sb-view active">
      {/* Header with collapsible-aware global + btn */}
      <div className="sb-hd">
        <div className="sb-hd-row">
          <span className="sb-hd-label">Workspace</span>
          <div className="sb-hd-actions">
            {/* Global + button */}
            <div style={{position:"relative"}} ref={globalMenuRef}>
              <button className="sib" title="Create new…" onClick={()=>setGlobalMenu(g=>!g)}
                style={{
                  width:26,height:26,borderRadius:7,border:"none",
                  background:globalMenu?"var(--accent-glow)":"none",
                  color:globalMenu?"var(--accent3)":"var(--faint)",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",transition:"all .12s",
                }}>
                <svg viewBox="0 0 14 14" fill="none" style={{width:14,height:14}}>
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              {globalMenu&&(
                <GlobalAddMenu
                  onCreateFolder={()=>setShowFolderModal(true)}
                  onCreateChat={()=>onCreateChat(activeFolder?.id||null)}
                  onCreateNote={()=>setCreatingNote(true)}
                  onClose={()=>setGlobalMenu(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sb-scroll">
        {loading&&<div style={{padding:"20px 12px",color:"var(--faint)",fontSize:12}}>Loading…</div>}

        {creatingNote&&(
          <NewNoteForm
            onCommit={async(title,color)=>{setCreatingNote(false);await onCreateNote(activeFolder?.id||null,title,color);}}
            onCancel={()=>setCreatingNote(false)}
          />
        )}

        {/* INBOX */}
        {!loading&&((inbox.chats?.length||0)+(inbox.notes?.length||0))>0&&(
          <div className="inbox-section">
            <div className={`inbox-hd${inboxOpen?" open":""}`} onClick={()=>setInboxOpen(o=>!o)}>
              <div className="inbox-icon"><InboxIcon/></div>
              <span className="inbox-title">Inbox</span>
              <span className="inbox-count">{(inbox.chats?.length||0)+(inbox.notes?.length||0)}</span>
              <div className={`inbox-chev${inboxOpen?" open":""}`}><ChevIcon/></div>
            </div>
            {inboxOpen&&(
              <div className="inbox-body open">
                {(inbox.chats?.length||0)>0&&<>
                  <div className="inbox-section-label">Chats</div>
                  {inbox.chats.map(c => (
                    <div key={c.id} className={`fi${activeChat?.id===c.id?" active":""}`} onClick={()=>onOpenChat(c)}>
                      <div className="fi-icon-wrap chat-icon"><ChatIcon/></div>
                      <span className="fi-name">{c.title}</span>
                      <button className="fi-menu" onClick={e=>{
                        e.stopPropagation();
                        onCtx(e, "chat", c.id, {
                          onDelete: () => onDeleteChat(c.id),
                          onRename: () => {
                            const newTitle = window.prompt("Rename chat:", c.title);
                            if (newTitle?.trim()) onRenameChat(c.id, newTitle.trim());
                          },
                        });
                      }}>⋮</button>
                    </div>
                  ))}
                </>}
                {(inbox.chats?.length||0)>0&&(inbox.notes?.length||0)>0&&<div className="inbox-divider"/>}
                {(inbox.notes?.length||0)>0&&<>
                  <div className="inbox-section-label">Notes</div>
                  {inbox.notes.map(n => {
                    const nc = n.color&&n.color!=="#ffffff"?n.color:null;
                    return (
                      <div key={n.id} className={`fi${activeNote?.id===n.id?" active":""}`} onClick={()=>onOpenNote(n)}>
                        {nc&&<span style={{width:6,height:6,borderRadius:"50%",background:nc,flexShrink:0,marginRight:2}}/>}
                        <div className="fi-icon-wrap note-icon" style={nc?{borderColor:`${nc}55`}:{}}><NoteIcon/></div>
                        <span className="fi-name">{n.title}</span>
                        <button className="fi-menu" onClick={e=>{
                          e.stopPropagation();
                          onCtx(e, "note", n.id, {
                            onDelete: () => onDeleteNote(n.id),
                          });
                        }}>⋮</button>
                      </div>
                    );
                  })}
                </>}
              </div>
            )}
          </div>
        )}

        {!loading&&folders.length>0&&<div className="sb-section-sep"/>}

        {/* FOLDER TREE — outer folder sort DnD */}
        {!loading&&(
          <DndContext sensors={sensors} collisionDetection={closestCenter}
            onDragStart={handleGlobalDragStart} onDragEnd={handleGlobalDragEnd}>
            <SortableContext items={folderOrder} strategy={verticalListSortingStrategy}>
              {sortedFolders.map(folder=>(
                <SortableFolderRow key={`folder-${folder.id}`} folder={folder}
                  activeChat={activeChat} activeNote={activeNote} activeFolder={activeFolder}
                  onOpenChat={onOpenChat} onOpenNote={onOpenNote}
                  onCreateChat={onCreateChat} onCreateNote={onCreateNote}
                  onSelectFolder={onSelectFolder}
                  onRenameFolder={onRenameFolder} onDeleteFolder={onDeleteFolder}
                  onCtx={onCtx} onShowToast={onShowToast}/>
              ))}
            </SortableContext>
            <DragOverlay>
              {activeDragFolder?(
                <div style={{background:"var(--card)",border:"1px solid var(--accent-border)",borderRadius:8,
                  padding:"6px 10px",boxShadow:"0 8px 32px rgba(0,0,0,.4)",display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:activeDragFolder.color||"var(--accent)"}}/>
                  <span style={{fontSize:12.5,color:"var(--text)"}}>{activeDragFolder.name}</span>
                </div>
              ):null}
              {activeDragItem?(
                <DragOverlayItem name={activeDragItem.title} type={activeDragItem._type} color={activeDragItem.color}/>
              ):null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Empty state */}
        {!loading&&folders.length===0&&!inbox.chats?.length&&!inbox.notes?.length&&!creatingNote&&(
          <div style={{padding:"36px 16px",textAlign:"center"}}>
            <div style={{fontSize:30,marginBottom:10}}>📁</div>
            <div style={{fontSize:13,color:"var(--text-dim)",marginBottom:6}}>No folders yet</div>
            <div style={{fontSize:11.5,color:"var(--faint)",marginBottom:16}}>
              Click <strong>+</strong> at top to create a folder, chat, or note
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={()=>setCreatingNote(true)}
                style={{padding:"7px 14px",borderRadius:8,border:"1px solid var(--accent-border)",background:"var(--accent-glow)",color:"var(--accent3)",fontSize:12,cursor:"pointer"}}>📝 New Note</button>
              <button onClick={()=>setShowFolderModal(true)}
                style={{padding:"7px 14px",borderRadius:8,border:"1px solid var(--accent-border)",background:"var(--accent-glow)",color:"var(--accent3)",fontSize:12,cursor:"pointer"}}>+ New Folder</button>
            </div>
          </div>
        )}
      </div>

      {showFolderModal&&(
        <FolderModal folders={folders}
          onCommit={(name,color,parentId)=>{setShowFolderModal(false);onCreateFolder(name,color,parentId);}}
          onCancel={()=>setShowFolderModal(false)}/>
      )}
    </div>
  );
}

/* ═══ NOTES TAB ════════════════════════════════════════════════════════ */
function NotesView({ folders, inbox, activeNote, onOpenNote, onCreateNote }) {
  const [q,            setQ]            = useState("");
  const [creatingNote, setCreatingNote] = useState(false);

  const allNotes = [];
  (function collect(arr) {
    arr.forEach(f=>{
      (f.notes||[]).forEach(n=>allNotes.push({...n,folderName:f.name}));
      collect(f.children||[]);
    });
  })(folders);
  (inbox.notes||[]).forEach(n=>allNotes.push({...n,folderName:"Inbox"}));
  const filtered = allNotes.filter(n=>!q||n.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="sb-view active">
      <div className="sb-hd">
        <div className="sb-hd-row">
          <span className="sb-hd-label">All Notes</span>
          <button className="sib" title="New note" onClick={()=>setCreatingNote(true)}>
            <svg viewBox="0 0 14 14" fill="none"><path d="M2.5 2.5h9v9h-9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><line x1="7" y1="5" x2="7" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="sb-search" style={{marginBottom:0}}>
          <SearchIcon/>
          <input placeholder="Filter notes…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
      </div>
      <div className="sb-scroll">
        {creatingNote&&(
          <NewNoteForm
            onCommit={async(title,color)=>{setCreatingNote(false);await onCreateNote(null,title,color);}}
            onCancel={()=>setCreatingNote(false)}/>
        )}
        {filtered.length===0&&!creatingNote&&(
          <div style={{padding:"24px 12px",color:"var(--faint)",fontSize:12,textAlign:"center"}}>
            {q?"No notes match":(
              <div>
                <div style={{fontSize:24,marginBottom:8}}>📝</div>
                <div style={{marginBottom:4}}>No notes yet</div>
                <button onClick={()=>setCreatingNote(true)}
                  style={{marginTop:8,padding:"6px 14px",borderRadius:8,border:"1px solid var(--accent-border)",background:"var(--accent-glow)",color:"var(--accent3)",fontSize:12,cursor:"pointer"}}>
                  + New Note</button>
              </div>
            )}
          </div>
        )}
        {filtered.map(n=>{
          const nc = n.color&&n.color!=="#ffffff"?n.color:null;
          return (
            <div key={n.id} className={`note-row${activeNote?.id===n.id?" active":""}`} onClick={()=>onOpenNote(n)}
              style={nc?{borderLeft:`3px solid ${nc}`,paddingLeft:8}:{}}>
              <div className="nr-bar" style={{background:nc||"var(--accent)"}}/>
              <div className="nr-body">
                <div className="nr-title">{n.title}</div>
                <div className="nr-snip">{n.content?.slice(0,80)||"—"}</div>
                <div className="nr-meta">
                  <span className="nr-folder">📂 {n.folderName}</span>
                  <span className="nr-time">{n.updated_at?new Date(n.updated_at).toLocaleDateString():""}</span>
                  {nc&&<span style={{width:8,height:8,borderRadius:"50%",background:nc,flexShrink:0,marginLeft:"auto"}}/>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ SEARCH TAB ════════════════════════════════════════════════════════ */
function SearchView({ folders, inbox, onOpenChat, onOpenNote }) {
  const [q, setQ] = useState("");
  const allChats = [], allNotes = [];
  (function collect(arr) {
    arr.forEach(f=>{
      (f.chats||[]).forEach(c=>allChats.push({...c,folderName:f.name}));
      (f.notes||[]).forEach(n=>allNotes.push({...n,folderName:f.name}));
      collect(f.children||[]);
    });
  })(folders);
  (inbox.chats||[]).forEach(c=>allChats.push({...c,folderName:"Inbox"}));
  (inbox.notes||[]).forEach(n=>allNotes.push({...n,folderName:"Inbox"}));
  const lq     = q.toLowerCase();
  const fChats = q?allChats.filter(c=>c.title.toLowerCase().includes(lq)):allChats.slice(0,6);
  const fNotes = q?allNotes.filter(n=>n.title.toLowerCase().includes(lq)):allNotes.slice(0,6);

  return (
    <div className="sb-view active">
      <div className="sb-hd">
        <div className="sb-hd-row"><span className="sb-hd-label">Search</span></div>
        <div className="sb-search"><SearchIcon/><input placeholder="Search everything…" autoFocus value={q} onChange={e=>setQ(e.target.value)}/></div>
      </div>
      <div className="sb-scroll">
        {fChats.length>0&&<>
          <div style={{fontSize:"9.5px",fontWeight:700,color:"var(--faint)",letterSpacing:".1em",textTransform:"uppercase",padding:"4px 4px 6px"}}>Chats</div>
          {fChats.map(c=>(
            <div key={c.id} className="fi" onClick={()=>onOpenChat(c)}>
              <div className="fi-icon-wrap chat-icon"><ChatIcon/></div>
              <span className="fi-name">{c.title}</span>
              <span style={{fontSize:10,color:"var(--faint)"}}>{c.folderName}</span>
            </div>
          ))}
        </>}
        {fNotes.length>0&&<>
          <div style={{fontSize:"9.5px",fontWeight:700,color:"var(--faint)",letterSpacing:".1em",textTransform:"uppercase",padding:"10px 4px 6px"}}>Notes</div>
          {fNotes.map(n=>{
            const nc=n.color&&n.color!=="#ffffff"?n.color:null;
            return (
              <div key={n.id} className="fi" onClick={()=>onOpenNote(n)}>
                {nc&&<span style={{width:6,height:6,borderRadius:"50%",background:nc,flexShrink:0}}/>}
                <div className="fi-icon-wrap note-icon" style={nc?{borderColor:`${nc}55`}:{}}><NoteIcon/></div>
                <span className="fi-name">{n.title}</span>
                <span style={{fontSize:10,color:"var(--faint)"}}>{n.folderName}</span>
              </div>
            );
          })}
        </>}
        {fChats.length===0&&fNotes.length===0&&(
          <div style={{padding:"24px 12px",color:"var(--faint)",fontSize:12,textAlign:"center"}}>
            {q?"Nothing found":"Start typing to search"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ MAIN EXPORT ═══════════════════════════════════════════════════════ */
export default function Sidebar({
  section, folders=[], inbox={chats:[],notes:[]},
  activeChat, activeNote, activeFolder, loading,
  onOpenChat, onOpenNote,
  onCreateFolder, onRenameFolder, onDeleteFolder,
  onCreateChat, onCreateNote,
  onDeleteChat, onDeleteNote, onRenameChat,
  onSelectFolder, onCtx, onShowToast,
  collapsed, onToggleCollapse,
  onMoveItem,
}) {
  return (
    <div className="sidebar" style={{
      width: collapsed ? "0" : "var(--sb)",
      overflow: collapsed ? "hidden" : "visible",
      transition: "width .2s ease",
      flexShrink: 0,
    }}>
      {/* Content based on section */}
      {!collapsed && section==="ws" && (
        <WorkspaceView
          folders={folders} inbox={inbox}
          activeChat={activeChat} activeNote={activeNote} activeFolder={activeFolder}
          loading={loading}
          onOpenChat={onOpenChat} onOpenNote={onOpenNote}
          onCreateFolder={onCreateFolder}
          onCreateChat={onCreateChat} onCreateNote={onCreateNote}
          onSelectFolder={onSelectFolder}
          onRenameFolder={onRenameFolder} onDeleteFolder={onDeleteFolder}
          onDeleteChat={onDeleteChat} onDeleteNote={onDeleteNote} onRenameChat={onRenameChat}
          onCtx={onCtx} onShowToast={onShowToast}
          onMoveItem={onMoveItem}/>
      )}
      {!collapsed && section==="notes" && (
        <NotesView folders={folders} inbox={inbox} activeNote={activeNote} onOpenNote={onOpenNote} onCreateNote={onCreateNote}/>
      )}
      {!collapsed && section==="search" && (
        <SearchView folders={folders} inbox={inbox} onOpenChat={onOpenChat} onOpenNote={onOpenNote}/>
      )}
    </div>
  );
}
