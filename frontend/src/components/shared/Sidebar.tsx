'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { section: 'MAIN', items: [
      { icon: '📊', label: 'Dashboard', path: '/dashboard' },
      { icon: '📋', label: 'Report List', path: '/reports' },
    ]},
    { section: 'BUILD', items: [
      { icon: '📝', label: 'Report Builder', path: '/builder' },
      { icon: '👁️', label: 'Preview', path: '/preview' },
      { icon: '▶️', label: 'Tester', path: '/tester' },
    ]},
    { section: 'MANAGE', items: [
      { icon: '⏰', label: 'Schedules', path: '/schedules' },
      { icon: '📄', label: 'Run History', path: '/history' },
      { icon: '🔄', label: 'Import/Export', path: '/import-export' },
      { icon: '🗂️', label: 'Categories', path: '/categories' },
    ]},
    { section: 'MFE', items: [
      { icon: '🧩', label: 'MFE', path: '/mfe' },
    ]},
  ];

  return (
    <div style={{ width: 200, background: 'var(--primary, #0F2744)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
      {/* Nav Items */}
      {navItems.map(group => (
        <div key={group.section}>
          <div style={{ padding: '12px 10px 4px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.7 }}>
            {group.section}
          </div>
          {group.items.map(item => (
            <div key={item.label}
              onClick={() => router.push(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px',
                borderRadius: 7, margin: '1px 6px', cursor: 'pointer',
                background: pathname === item.path ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: pathname === item.path ? 'var(--surface)' : 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 500, transition: 'all 0.13s'
              }}
              onMouseEnter={e => {
                if (pathname !== item.path) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={e => {
                if (pathname !== item.path) e.currentTarget.style.background = 'transparent';
              }}>
              <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}