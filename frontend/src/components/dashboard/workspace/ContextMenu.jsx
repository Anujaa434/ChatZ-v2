// frontend/src/components/dashboard/v5/ContextMenu.jsx
import { useEffect } from 'react';

const MENUS = {
  chat: [
    { label: 'Rename', icon: '✏️', action: 'rename' },
    { label: 'Move to folder…', icon: '📁', action: 'move' },
    null,
    { label: 'Delete', icon: '🗑', action: 'delete', danger: true },
  ],
  note: [
    { label: 'Rename', icon: '✏️', action: 'rename' },
    { label: 'Move to folder…', icon: '📁', action: 'move' },
    null,
    { label: 'Export as Markdown', icon: '⬇️', action: 'export' },
    null,
    { label: 'Delete', icon: '🗑', action: 'delete', danger: true },
  ],
  folder: [
    { label: 'Rename folder', icon: '✏️', action: 'rename' },
    null,
    { label: 'Delete folder', icon: '🗑', action: 'delete', danger: true },
  ],
};

export default function ContextMenu({ show, x, y, type, meta = {}, onClose, onShowToast, onDelete, onRename }) {
  useEffect(() => {
    if (!show) return;
    const handler = () => onClose();
    document.addEventListener('pointerdown', handler, { once: true });
    return () => document.removeEventListener('pointerdown', handler);
  }, [show, onClose]);

  if (!show || !type || !MENUS[type]) return null;

  const items = MENUS[type];
  const style = { top: y, left: x };
  if (x + 190 > window.innerWidth) style.left = x - 190;
  if (y + items.length * 34 > window.innerHeight) style.top = y - items.length * 34;

  function handleAction(action) {
    onClose();
    if (action === 'delete') {
      if (onDelete) onDelete();
      else onShowToast('🗑 Deleted');
    } else if (action === 'rename') {
      if (onRename) onRename();
      else onShowToast('✏️ Rename — coming soon');
    } else {
      onShowToast(`📋 ${action} — coming soon`);
    }
  }

  return (
    <div className="ctx-menu show" style={{ position: 'fixed', ...style }} onPointerDown={e => e.stopPropagation()}>
      {items.map((item, i) => {
        if (!item) return <div key={i} className="cm-sep"/>;
        return (
          <div
            key={item.action}
            className={`cm-item${item.danger ? ' danger' : ''}`}
            onClick={() => handleAction(item.action)}
          >
            <span>{item.icon}</span>
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
