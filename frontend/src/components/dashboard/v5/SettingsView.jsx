// frontend/src/components/dashboard/v5/SettingsView.jsx
import { useState } from 'react';

function Toggle({ on, onChange }) {
  return (
    <div className={`set-toggle${on ? ' on' : ' off'}`} onClick={() => onChange(!on)}>
      <div className="set-toggle-thumb"/>
    </div>
  );
}

// ── Account Tab ────────────────────────────────────
function AccountTab({ onShowToast }) {
  const [twoFA, setTwoFA] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);

  return (
    <div>
      <div className="set-page-title">Account</div>
      <div className="set-page-sub">Manage your profile, email, security and active sessions</div>

      {/* Plan banner */}
      <div className="plan-banner" style={{ background: 'linear-gradient(135deg,var(--accent-glow) 0%,rgba(144,64,255,.08) 100%)', border: '1px solid var(--accent-border)', borderRadius: 12, padding: '16px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 18 18" fill="none" style={{width:18,height:18}}>
            <path d="M9 2l1.8 3.6L15 6.3l-3 2.9.7 4.1L9 11.1l-3.7 2.2.7-4.1-3-2.9 4.2-.7L9 2z" fill="currentColor" stroke="none"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>You're on the Pro plan ✦</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>100 MB storage · Unlimited AI queries · All models · Priority support</div>
        </div>
        <button className="set-btn" onClick={() => onShowToast('🚀 Manage plan — coming soon!')}>Manage Plan</button>
      </div>

      {/* Profile */}
      <div className="set-card">
        <div className="set-card-title">Profile</div>
        <div className="set-card-desc">Your display name and avatar used across all workspaces</div>
        <div className="prof-avatar-row">
          <div className="prof-avatar">AP</div>
          <div>
            <div className="prof-avatar-name">Anuja Patil</div>
            <div className="prof-avatar-email" style={{ fontSize: 12, color: 'var(--faint)', margin: '2px 0' }}>anuja@example.com</div>
            <span className="prof-avatar-change" style={{ fontSize: 11.5, color: 'var(--accent3)', cursor: 'pointer' }} onClick={() => onShowToast('🖼 Avatar upload — coming soon!')}>Change avatar →</span>
          </div>
        </div>
        <div className="prof-row"><span className="prof-label">Display name</span><span className="prof-val">Anuja Patil</span></div>
        <div className="prof-row"><span className="prof-label">Email</span><span className="prof-val">anuja@example.com</span></div>
        <div className="prof-row"><span className="prof-label">Username</span><span className="prof-val" style={{ color: 'var(--faint)' }}>@anujapatil</span></div>
        <div className="prof-row"><span className="prof-label">Plan</span><span className="prof-val"><span className="prof-badge">✦ Pro</span></span></div>
        <div className="prof-row"><span className="prof-label">Member since</span><span className="prof-val" style={{ color: 'var(--faint)' }}>January 2024</span></div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button className="set-btn" onClick={() => onShowToast('✏️ Edit mode enabled!')}>Edit Profile</button>
          <button className="set-btn-ghost" onClick={() => onShowToast('🔒 Password change email sent!')}>Change Password</button>
        </div>
      </div>

      {/* Security */}
      <div className="set-card">
        <div className="set-card-title">Security</div>
        <div className="set-card-desc">Two-factor authentication and login preferences</div>
        <div className="set-row">
          <div className="set-row-info"><div className="set-row-label">Two-factor authentication</div><div className="set-row-sub">Adds a second verification step on each login</div></div>
          <Toggle on={twoFA} onChange={setTwoFA}/>
        </div>
        <div className="set-row">
          <div className="set-row-info"><div className="set-row-label">Login alerts via email</div><div className="set-row-sub">Get notified of new sign-ins from unrecognised devices</div></div>
          <Toggle on={loginAlerts} onChange={setLoginAlerts}/>
        </div>
        <div className="set-row">
          <div className="set-row-info"><div className="set-row-label">Auto-logout on inactivity</div><div className="set-row-sub">Sign out after 7 days of no activity</div></div>
          <Toggle on={autoLogout} onChange={setAutoLogout}/>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="set-btn-ghost" onClick={() => onShowToast('🔑 Recovery codes generated!')}>Generate Recovery Codes</button>
        </div>
      </div>

      {/* Sessions */}
      <div className="set-card">
        <div className="set-card-title">Active Sessions</div>
        <div className="set-card-desc">Devices currently signed into your account</div>
        {[
          { device: 'Windows PC — Chrome', loc: 'Mumbai, India', active: true },
          { device: 'iPhone 15 Pro — Safari', loc: 'Pune, India · 2 hours ago', active: false },
        ].map(s => (
          <div key={s.device} className="session-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--input-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              {s.device.includes('iPhone') ? '📱' : '💻'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-dim)' }}>{s.device}</div>
              <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 2 }}>
                {s.loc}
                {s.active && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34,201,122,.08)', border: '1px solid rgba(34,201,122,.2)', borderRadius: 4, padding: '1px 7px', fontSize: 10.5, color: 'var(--green)', fontWeight: 500, marginLeft: 8 }}>● Active now</span>
                )}
              </div>
            </div>
            {s.active ? (
              <span style={{ fontSize: 11, color: 'var(--faint)' }}>This device</span>
            ) : (
              <button className="set-btn-ghost" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => onShowToast('✅ Session revoked')}>Revoke</button>
            )}
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <button className="set-btn-danger" onClick={() => onShowToast('🔒 All other sessions revoked!')}>Revoke All Other Sessions</button>
        </div>
      </div>
    </div>
  );
}

// ── Appearance Tab ─────────────────────────────────
function AppearanceTab({ theme, onToggleTheme, onShowToast }) {
  const [fontSz, setFontSz] = useState('Default (13px)');
  const toggleMap = {
    compact: [false, null],
    icons: [true, null],
    animations: [true, null],
    timestamps: [true, null],
    motion: [false, null],
  };
  const [toggles, setToggles] = useState({ compact: false, icons: true, animations: true, timestamps: true, motion: false });

  return (
    <div>
      <div className="set-page-title">Appearance</div>
      <div className="set-page-sub">Customize how UKL looks, feels and behaves</div>

      <div className="set-card">
        <div className="set-card-title">Theme</div>
        <div className="set-card-desc">Choose your preferred color scheme</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {['dark', 'light'].map(t => (
            <div
              key={t}
              onClick={onToggleTheme}
              style={{
                border: `2px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 11, padding: 14, cursor: 'pointer',
                background: theme === t ? 'var(--accent-glow)' : 'transparent',
                transition: 'all .15s', textAlign: 'center'
              }}
            >
              <div style={{ width: '100%', height: 54, borderRadius: 7, marginBottom: 10, background: t === 'dark' ? '#0e0e1c' : '#f5f4f2', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', display: 'flex' }}>
                  <div style={{ width: '30%', background: t === 'dark' ? '#0c0c18' : '#eceaf8', borderRight: `1px solid ${t === 'dark' ? '#1e1e38' : '#e0dff0'}` }}/>
                  <div style={{ flex: 1, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ height: 14, borderRadius: 6, background: t === 'dark' ? '#14142a' : '#fff' }}/>
                    <div style={{ height: 10, borderRadius: 4, background: t === 'dark' ? '#1e1e38' : '#eeedf8', width: '70%' }}/>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme === t ? 'var(--accent3)' : 'var(--text-dim)' }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="set-card">
        <div className="set-card-title">Accent Color</div>
        <div className="set-card-desc">Change the primary highlight color</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {[['#5227FF', 'Purple'], ['#0ea5e9', 'Sky'], ['#10b981', 'Emerald'], ['#f59e0b', 'Amber'], ['#ef4444', 'Red'], ['#ec4899', 'Pink'], ['#8b5cf6', 'Violet']].map(([color, name]) => (
            <div
              key={color}
              title={name}
              onClick={() => onShowToast(`🎨 ${name} applied`)}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: color,
                cursor: 'pointer', border: color === '#5227FF' ? '2px solid var(--text)' : '2px solid transparent',
                boxShadow: color === '#5227FF' ? '0 0 0 3px rgba(255,255,255,.12)' : 'none',
                transition: 'all .15s'
              }}
            />
          ))}
        </div>
      </div>

      <div className="set-card">
        <div className="set-card-title">Layout & Display</div>
        <div className="set-card-desc">Control density, animations and visual elements</div>
        {[
          { key: 'compact', label: 'Compact sidebar density', sub: 'Reduces spacing in folder tree items' },
          { key: 'icons', label: 'Vibrant file type icons', sub: 'Color-coded chat (blue) and note (amber) icons' },
          { key: 'animations', label: 'Message animations', sub: 'Smooth slide-in when messages arrive' },
          { key: 'timestamps', label: 'Show timestamps in chat', sub: 'Display time next to every message' },
          { key: 'motion', label: 'Reduce motion', sub: 'Minimise animations for accessibility' },
        ].map(r => (
          <div key={r.key} className="set-row">
            <div className="set-row-info"><div className="set-row-label">{r.label}</div><div className="set-row-sub">{r.sub}</div></div>
            <Toggle on={toggles[r.key]} onChange={v => setToggles(t => ({ ...t, [r.key]: v }))}/>
          </div>
        ))}
      </div>

      <div className="set-card">
        <div className="set-card-title">Keyboard Shortcuts</div>
        <div className="set-card-desc">Quick actions to navigate UKL faster</div>
        {[
          { label: 'Search everything', keys: ['⌘', 'K'] },
          { label: 'Send message', keys: ['⌘', '↵'] },
          { label: 'New chat', keys: ['⌘', 'N'] },
          { label: 'New note', keys: ['⌘', '⇧', 'N'] },
          { label: 'Toggle note panel', keys: ['⌘', '⇧', 'E'] },
          { label: 'Toggle theme', keys: ['⌘', '⇧', 'L'] },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{s.label}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {s.keys.map(k => (
                <span key={k} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '2px 7px', borderRadius: 5, background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{k}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Models Tab ─────────────────────────────────────
function ModelsTab({ onShowToast }) {
  const [selectedModel, setSelectedModel] = useState(0);
  const models = [
    { name: 'Gemini 1.5 Pro', sub: 'Google · Best for long context · 1M tokens', dot: '#4285F4' },
    { name: 'GPT-4o', sub: 'OpenAI · Balanced speed + quality · 128K', dot: '#10a37f' },
    { name: 'Llama 3 70B', sub: 'Groq · Fastest inference · Free tier', dot: '#f5820d' },
    { name: 'Claude 3.5 Sonnet', sub: 'Anthropic · Nuanced reasoning · 200K', dot: '#d4650a' },
  ];

  return (
    <div>
      <div className="set-page-title">AI Models</div>
      <div className="set-page-sub">Choose your default model, context behaviour and RAG configuration</div>
      <div className="set-card">
        <div className="set-card-title">Default AI Model</div>
        <div className="set-card-desc">Used when no per-folder override is set</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
          {models.map((m, i) => (
            <div
              key={m.name}
              onClick={() => { setSelectedModel(i); onShowToast(`✅ ${m.name} selected`); }}
              style={{
                background: i === selectedModel ? 'var(--accent-glow)' : 'var(--input-bg)',
                border: `1px solid ${i === selectedModel ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                transition: 'all .15s', position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: i === selectedModel ? 'var(--accent3)' : 'var(--text-dim)', marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.dot }}/>
                {m.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--faint)', lineHeight: 1.4 }}>{m.sub}</div>
              {i === selectedModel && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 10 10" fill="none" style={{width:9,height:9}}>
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="set-card">
        <div className="set-card-title">API Keys (BYOK)</div>
        <div className="set-card-desc">Add your own API keys to use your own quota and unlock additional models</div>
        {[
          { tag: 'OPENAI', status: 'Connected', age: '2 months ago', ok: true },
          { tag: 'GOOGLE', status: 'Connected', age: '1 month ago', ok: true },
          { tag: 'ANTHROPIC', status: 'Not set', age: '', ok: false },
          { tag: 'GROQ', status: 'Not set', age: '', ok: false },
        ].map(k => (
          <div key={k.tag} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--muted)', flexShrink: 0 }}>{k.tag}</span>
            {k.ok ? (
              <span style={{ fontSize: 11.5, color: 'var(--green)', flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }}/>
                {k.status}
              </span>
            ) : (
              <span style={{ fontSize: 11.5, color: 'var(--faint)', flex: 1 }}>{k.status}</span>
            )}
            {k.age && <span style={{ fontSize: 11, color: 'var(--faint)' }}>{k.age}</span>}
            <button style={{ padding: '3px 9px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--faint)', fontSize: 11, cursor: 'pointer' }} onClick={() => onShowToast(k.ok ? '🔑 Key updated' : '🔑 Key added')}>
              {k.ok ? 'Rotate' : 'Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────
function NotificationsTab({ onShowToast }) {
  const [t, setT] = useState({ aiReady: true, indexing: true, indexFail: true, daily: false, weekly: false, signin: true, updates: true, storage: true });
  const rows = [
    { section: 'AI Activity', items: [
      { key: 'aiReady', label: 'AI response ready', sub: 'Notify when a long-running AI query finishes' },
      { key: 'indexing', label: 'Indexing complete', sub: 'When new notes are fully embedded and searchable' },
      { key: 'indexFail', label: 'Index failure alert', sub: 'Notify if a note fails to embed after saving' },
    ]},
    { section: 'Digests & Summaries', items: [
      { key: 'daily', label: 'Daily digest', sub: 'Morning summary of note changes and chat activity' },
      { key: 'weekly', label: 'Weekly workspace report', sub: 'Overview of notes, chats, and AI usage' },
    ]},
    { section: 'System Alerts', items: [
      { key: 'signin', label: 'New sign-in detected', sub: 'Email when a new device logs into your account' },
      { key: 'updates', label: 'Product updates', sub: 'New features, improvements and release notes' },
      { key: 'storage', label: 'Storage limit warnings', sub: 'Alert when usage hits 80% and 95% of quota' },
    ]},
  ];
  return (
    <div>
      <div className="set-page-title">Notifications</div>
      <div className="set-page-sub">Control what alerts, digests and summaries you receive</div>
      {rows.map(section => (
        <div key={section.section} className="set-card">
          <div className="set-card-title">{section.section}</div>
          {section.items.map(r => (
            <div key={r.key} className="set-row">
              <div className="set-row-info"><div className="set-row-label">{r.label}</div><div className="set-row-sub">{r.sub}</div></div>
              <Toggle on={t[r.key]} onChange={v => setT(prev => ({ ...prev, [r.key]: v }))}/>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Danger Zone Tab ────────────────────────────────
function DangerTab({ onShowToast }) {
  return (
    <div>
      <div className="set-page-title" style={{ color: 'var(--red)' }}>Danger Zone</div>
      <div className="set-page-sub">Irreversible actions. Please read carefully before proceeding.</div>
      <div className="set-card" style={{ border: '1px solid rgba(224,85,85,.2)' }}>
        <div className="set-card-title">Export All Data</div>
        <div className="set-card-desc">Download a complete archive of all your chats, notes, and settings as a ZIP file.</div>
        <button className="set-btn-ghost" onClick={() => onShowToast('⬇️ Export started — check your email!')}>Export Data</button>
      </div>
      <div className="set-card" style={{ border: '1px solid rgba(224,85,85,.2)' }}>
        <div className="set-card-title">Delete All Content</div>
        <div className="set-card-desc">Permanently delete all chats, notes, and folders. Your account will remain active.</div>
        <button className="set-btn-danger" onClick={() => onShowToast('⚠️ Type "DELETE" to confirm')}>Delete All Content</button>
      </div>
      <div className="set-card" style={{ border: '1px solid rgba(224,85,85,.35)' }}>
        <div className="set-card-title" style={{ color: 'var(--red)' }}>Delete Account</div>
        <div className="set-card-desc">Permanently delete your account and all associated data. This cannot be undone.</div>
        <button className="set-btn-danger" onClick={() => onShowToast('⚠️ Account deletion — coming soon')}>Delete My Account</button>
      </div>
    </div>
  );
}

// ── NAV ITEMS ──────────────────────────────────────
const NAV = [
  { id: 'account', label: 'Account', section: 'General' },
  { id: 'appearance', label: 'Appearance', section: 'General' },
  { id: 'notifications', label: 'Notifications', section: 'General' },
  { id: 'models', label: 'Models', section: 'AI & Models' },
  { id: 'danger', label: 'Danger Zone', section: 'Data', danger: true },
];

// ── MAIN EXPORT ────────────────────────────────────
export default function SettingsView({ onBack, onShowToast, theme, onToggleTheme }) {
  const [tab, setTab] = useState('account');

  const sections = [...new Set(NAV.map(n => n.section))];

  return (
    <div className="settings-view active">
      {/* Settings sidebar nav */}
      <div className="set-sidebar">
        <div className="set-sb-hd">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.5" stroke="var(--accent3)" strokeWidth="1.3"/>
            <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="var(--accent3)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="set-sb-title">Settings</span>
        </div>
        <div className="set-back-btn" onClick={onBack}>
          <svg viewBox="0 0 10 10" fill="none" style={{width:11,height:11}}>
            <path d="M7 2L3 5l4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to workspace
        </div>
        {sections.map(section => (
          <div key={section}>
            <div className="set-sec-label">{section}</div>
            {NAV.filter(n => n.section === section).map(n => (
              <div
                key={n.id}
                className={`set-nav-item${tab === n.id ? ' active' : ''}${n.danger ? ' danger' : ''}`}
                onClick={() => setTab(n.id)}
              >
                {n.label}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Settings main content */}
      <div className="set-main">
        {tab === 'account' && <AccountTab onShowToast={onShowToast}/>}
        {tab === 'appearance' && <AppearanceTab theme={theme} onToggleTheme={onToggleTheme} onShowToast={onShowToast}/>}
        {tab === 'notifications' && <NotificationsTab onShowToast={onShowToast}/>}
        {tab === 'models' && <ModelsTab onShowToast={onShowToast}/>}
        {tab === 'danger' && <DangerTab onShowToast={onShowToast}/>}
      </div>
    </div>
  );
}
