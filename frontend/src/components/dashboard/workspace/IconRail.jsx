// frontend/src/components/dashboard/v5/IconRail.jsx
export default function IconRail({ active, onSelect }) {
  return (
    <div className="rail">
      {/* Workspace */}
      <div className={`ri${active === 'ws' ? ' active' : ''}`} onClick={() => onSelect('ws')}>
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M2 5a2 2 0 012-2h3l1.5 1.5H12A2 2 0 0114 6.5V12a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
        <span className="ri-tip">Workspace</span>
      </div>

      {/* All Notes */}
      <div className={`ri${active === 'notes' ? ' active' : ''}`} onClick={() => onSelect('notes')}>
        <svg viewBox="0 0 16 16" fill="none">
          <rect x="2.5" y="2" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <line x1="5" y1="5.5" x2="9.5" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="5" y1="8" x2="9.5" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="5" y1="10.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M10.5 9.5l2 2-1 1-2-2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="ri-tip">All Notes</span>
      </div>

      {/* Search */}
      <div className={`ri${active === 'search' ? ' active' : ''}`} onClick={() => onSelect('search')}>
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
          <line x1="10" y1="10" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span className="ri-tip">Search ⌘K</span>
      </div>

      <div className="ri-sep"/>

      {/* Settings */}
      <div className={`ri${active === 'settings' ? ' active' : ''}`} onClick={() => onSelect('settings')}>
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="ri-tip">Settings</span>
      </div>

      <div className="ri-spacer"/>

      {/* Profile */}
      <div className="ri" onClick={() => onSelect('settings')}>
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M2 13.5c0-2.5 2.7-4.5 6-4.5s6 2 6 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        <span className="ri-tip">Profile</span>
      </div>
    </div>
  );
}
