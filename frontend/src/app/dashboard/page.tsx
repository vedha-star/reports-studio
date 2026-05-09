/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import AuthGuard from '@/components/shared/AuthGuard';
import api from '@/lib/api';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good Morning');
  const [stats, setStats] = useState([
    { label: 'Your Reports', val: '0', sub: 'In your workspace', icon: '📊', accent: 'var(--primary)', iconBg: 'var(--primary-light)' },
    { label: 'Categories', val: '0', sub: 'Available tags', icon: '📁', accent: '#7C3AED', iconBg: '#F5F3FF' },
    { label: 'Today\'s Runs', val: '0', sub: 'Successful executions', icon: '⚡', accent: '#D97706', iconBg: '#FEF3C7' },
    { label: 'Cloud Status', val: '99.9%', sub: 'System uptime', icon: '🌐', accent: '#0D9488', iconBg: '#F0FDFA' },
  ]);

  useEffect(() => {
    // Dynamic Greeting Logic
    const updateGreeting = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;

      if (hours >= 6 && hours < 12) {
        setGreeting('Good Morning');
      } else if (hours >= 12 && hours < 16) {
        setGreeting('Good Afternoon');
      } else if (hours >= 17 && totalMinutes <= (20 * 60 + 30)) {
        setGreeting('Good Evening');
      } else {
        setGreeting('Hello'); // Default for other times
      }
    };

    updateGreeting();
    const userData = localStorage.getItem('navacle_user');
    let parsedUser: any = null;
    if (userData) {
      try {
        parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        console.error('User parse error', e);
      }
    }

    const fetchData = async () => {
      try {
        const [repRes, statsRes] = await Promise.all([
          api.get('/v1/reports'),
          api.get('/v1/reports/dashboard/stats')
        ]);
        
        const currentUserId = parsedUser?.id || parsedUser?.userId;
        const myReports = currentUserId 
          ? repRes.data.filter((r: any) => r.authorId === currentUserId) 
          : repRes.data;
          
        setReports(myReports);

        if (statsRes.data) {
          setStats([
            { label: 'Your Reports', val: statsRes.data.totalReports.toString(), sub: 'In your workspace', icon: '📊', accent: 'var(--primary)', iconBg: 'var(--primary-light)' },
            { label: 'Categories', val: statsRes.data.totalCategories.toString(), sub: 'Available tags', icon: '📁', accent: '#7C3AED', iconBg: '#F5F3FF' },
            { label: 'Today\'s Runs', val: statsRes.data.todayRuns.toString(), sub: 'Successful executions', icon: '⚡', accent: '#D97706', iconBg: '#FEF3C7' },
            { label: 'Cloud Status', val: statsRes.data.uptime, sub: 'System uptime', icon: '🌐', accent: '#0D9488', iconBg: '#F0FDFA' },
          ]);
        }
      } catch (e) {
        console.error('Dashboard data fetch failed', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync with global search from Topbar
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== searchQuery) {
      setSearchQuery(s);
    }
  }, [searchParams, searchQuery]);

  const quickActions = [
    { name: 'New Report', icon: '📝', path: '/builder', color: 'var(--primary)' },
    { name: 'Import JSON', icon: '📥', path: '/reports', color: '#10B981' },
    { name: 'Manage Schedules', icon: '📅', path: '/schedules', color: '#F59E0B' },
    { name: 'Account Settings', icon: '⚙️', path: '/profile', color: '#64748B' },
  ];

  return (
    <AuthGuard>
      <div style={{ display: 'flex', height: '100vh', fontSize: 13, color: 'var(--text-primary)', background: 'var(--background)' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar />
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>

            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Synchronizing workspace...</div>
              </div>
            ) : reports.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ width: 96, height: 96, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 32, boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.3)' }}>
                  ✨
                </div>
                <h1 style={{ fontSize: 40, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -1, marginBottom: 16 }}>Welcome to Navacle Report Studio!</h1>
                <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 500, lineHeight: 1.6, marginBottom: 48 }}>
                  Your personal workspace is empty. Let&apos;s build your very first dynamic report by connecting to a data source.
                </p>
                
                <div style={{ display: 'flex', gap: 16, marginBottom: 64 }}>
                  <button onClick={() => router.push('/builder')} style={{ padding: '16px 32px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)', transition: 'transform 0.2s' }} className="hover-btn">
                    + Create Your First Report
                  </button>
                  <button onClick={() => router.push('/reports')} style={{ padding: '16px 32px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s' }} className="hover-btn">
                    Import Workspace
                  </button>
                </div>
                
                <div style={{ width: '100%', maxWidth: 800, textAlign: 'left', background: 'var(--surface)', borderRadius: 24, padding: 40, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 24, color: 'var(--text-primary)' }}>Getting Started Guide</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>1</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Connect Endpoint</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select a dynamic database endpoint to discover schema automatically.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>2</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Map Columns</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Format data types, labels, and visibilities with zero code.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>3</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Set Parameters</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configure contextual default filters to make the report dynamic.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>4</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Publish & Schedule</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Save your work and set up automated email schedules!</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                {/* PREMIUM WELCOME BANNER */}
                <div style={{ 
                  background: 'linear-gradient(110deg, var(--primary-dark) 0%, var(--primary) 100%)', 
                  borderRadius: 24, padding: '40px 48px', marginBottom: 36, position: 'relative', overflow: 'hidden',
                  boxShadow: '0 20px 40px -10px rgba(37,99,235,0.25)'
                }}>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: 100, fontSize: 10, fontWeight: 900, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>Workspace Overview</span>
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -1 }}>
                      {greeting}, {user?.name || 'Explorer'}! 👋
                    </h1>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 10, maxWidth: 500, lineHeight: 1.5 }}>
                      You have <b>{reports.length} reports</b> active in your personal workspace today. Ready to build something new?
                    </p>
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                      <button onClick={() => router.push('/builder')} style={{ padding: '12px 24px', background: '#fff', color: 'var(--primary)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        + Start Building
                      </button>
                      <button onClick={() => router.push('/reports')} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                        Browse Gallery
                      </button>
                    </div>
                  </div>
                  {/* Decorative Circles */}
                  <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
                  <div style={{ position: 'absolute', bottom: -30, right: 100, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: 32 }}>
                  <div>
                    {/* STAT CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
                      {stats.map((s, i) => (
                        <div key={i} style={{ background: 'var(--surface)', borderRadius: 24, padding: '28px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                          <div style={{ width: 56, height: 56, borderRadius: 16, background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{s.icon}</div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -1, lineHeight: 1 }}>{isLoading ? '...' : s.val}</div>
                            <div style={{ fontSize: 11, color: s.accent, fontWeight: 700, marginTop: 8 }}>{s.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* RECENT REPORTS */}
                    <div style={{ background: 'var(--surface)', borderRadius: 28, padding: 32, border: '1px solid var(--border)', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: -0.5 }}>Recent Work</h3>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Pick up where you left off</div>
                        </div>
                        <button onClick={() => router.push('/reports')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>VIEW ALL ACTIVITY →</button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {reports
                          .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.database.toLowerCase().includes(searchQuery.toLowerCase()))
                          .slice(0, 5)
                          .map((r: any, i: number) => (
                          <div key={i} onClick={() => router.push(`/preview?id=${r.id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 18, background: 'var(--background)', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--background)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, flexShrink: 0 }}>
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>{r.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Modified {new Date(r.updatedAt).toLocaleDateString()} · {r.database}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <span style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{r.format}</span>
                              <div style={{ color: 'var(--text-muted)', fontSize: 16 }}>›</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACTIONS SIDEBAR */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ background: 'var(--surface)', borderRadius: 28, padding: 28, border: '1px solid var(--border)', boxShadow: '0 4px 25px rgba(0,0,0,0.03)' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 20px', letterSpacing: 0.5, textTransform: 'uppercase' }}>Quick Actions</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                        {quickActions.map((action, i) => (
                          <button key={i} onClick={() => router.push(action.path)} style={{ 
                            display: 'flex', alignItems: 'center', gap: 16, padding: '16px', 
                            background: 'var(--background)', border: '1px solid var(--border)', 
                            borderRadius: 18, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--background)'; }}
                          >
                            <span style={{ fontSize: 20 }}>{action.icon}</span>
                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{action.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: 'var(--primary-light)', borderRadius: 28, padding: 28, border: '1px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary-dark)', margin: '0 0 12px' }}>Pro Tip 💡</h4>
                      <p style={{ fontSize: 12, color: 'var(--primary-dark)', lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
                        Did you know you can schedule reports to run automatically every morning? Head over to <b>Schedules</b> to set it up!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading workspace...</div>}>
      <DashboardContent />
    </Suspense>
  );
}