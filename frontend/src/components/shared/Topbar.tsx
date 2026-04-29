/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { themes } from '@/lib/themes';

export default function Topbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [activeThemeId, setActiveThemeId] = useState('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('navacle_theme');
    if (saved) {
      setActiveThemeId(saved);
      applyTheme(saved);
    }

    const userData = localStorage.getItem('navacle_user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  }, [search]);

  // Sync state if URL changes externally
  useEffect(() => {
    const val = searchParams.get('search') || '';
    if (val !== search) setSearch(val);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const applyTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    
    const root = document.documentElement;
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--primary-light', theme.primaryLight);
    root.style.setProperty('--primary-dark', theme.primaryDark);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--surface', theme.surface);
    root.style.setProperty('--text-primary', theme.text);
    root.style.setProperty('--text-muted', theme.textMuted);
    root.style.setProperty('--border', theme.border);
    
    localStorage.setItem('navacle_theme', themeId);
  };

  const handleThemeChange = (themeId: string) => {
    setActiveThemeId(themeId);
    applyTheme(themeId);
    setShowThemeMenu(false);
  };

  const activeTheme = themes.find(t => t.id === activeThemeId) || themes[0];

  return (
    <div style={{ height: 48, background: 'var(--primary-dark, #1A3557)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
      <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--surface)' }}>Navacle <span style={{ color: 'var(--accent, #F59E0B)' }}>Report Studio</span></span>
      
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        
        {/* THEME SWITCHER */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            suppressHydrationWarning={true}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', 
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--surface)', cursor: 'pointer' 
            }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeTheme.primary, border: '1px solid #fff' }}></span>
            {activeTheme.domain} ▼
          </button>
          
          {showThemeMenu && (
            <div style={{ 
              position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 340, 
              background: 'var(--surface)', borderRadius: 16, 
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)', 
              padding: 16, zIndex: 1000, overflow: 'hidden'
            }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, paddingLeft: 4 }}>Select Domain Theme</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                {themes.map(t => {
                  const isActive = activeThemeId === t.id;
                  return (
                    <div 
                      key={t.id} 
                      onClick={() => handleThemeChange(t.id)}
                      style={{ 
                        padding: 12, borderRadius: 12, cursor: 'pointer',
                        background: isActive ? t.primaryLight : 'var(--background)',
                        border: `2px solid ${isActive ? t.primary : 'transparent'}`,
                        transition: 'all 0.2s', position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {isActive && <div style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: t.primary, color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, border: '2px solid var(--surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>✓</div>}
                      
                      {/* Color Palette Swatches */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: t.primary, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)' }}></div>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: t.accent, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)' }}></div>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: t.primaryDark, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)' }}></div>
                      </div>
                      
                      <div style={{ fontSize: 11, fontWeight: 800, color: isActive ? t.primaryDark : 'var(--text-primary)', lineHeight: 1.2 }}>
                        {t.domain.split(' / ')[0]}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: isActive ? t.primary : 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {t.domain.split(' / ')[1] || 'Theme'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <input 
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports…" 
            suppressHydrationWarning={true} 
            style={{ width: 220, padding: '5px 10px 5px 30px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, fontSize: 12, color: 'var(--surface)', outline: 'none',  }} 
          />
          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, opacity: 0.6 }}>🔍</span>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>🔔</div>
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            title={user?.name || "User"} 
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', cursor: 'pointer' }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          {showUserMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 200, background: 'var(--surface)', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid var(--border)', padding: '8px', zIndex: 1000 }}>
              <div style={{ padding: '12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
              </div>
              <button 
                onClick={() => { router.push('/profile'); setShowUserMenu(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                👤 View Profile
              </button>
              <button 
                onClick={() => { localStorage.removeItem('navacle_token'); localStorage.removeItem('navacle_user'); router.push('/login'); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#EF4444', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}