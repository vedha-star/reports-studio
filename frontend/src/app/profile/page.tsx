/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import AuthGuard from '@/components/shared/AuthGuard';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('navacle_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <AuthGuard>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--background)' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Topbar />
          <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px' }}>
            
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>My Profile</h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Manage your account settings and preferences</p>
              </div>

              <div style={{ background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)', padding: 40, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 48, borderBottom: '1px solid var(--border)', paddingBottom: 40 }}>
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#fff', boxShadow: '0 10px 30px rgba(37,99,235,0.2)' }}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{user?.name}</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
                    <div style={{ marginTop: 12, display: 'inline-block', padding: '4px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      Verified Account
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Email Address</label>
                    <div style={{ padding: '14px 18px', background: 'var(--background)', borderRadius: 14, border: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Member Since</label>
                    <div style={{ padding: '14px 18px', background: 'var(--background)', borderRadius: 14, border: '1px solid var(--border)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      April 2026
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Account ID</label>
                    <div style={{ padding: '14px 18px', background: 'var(--background)', borderRadius: 14, border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12 }}>
                      {user?.id}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 48, display: 'flex', gap: 16 }}>
                  <button style={{ padding: '12px 28px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    Edit Profile
                  </button>
                  <button style={{ padding: '12px 28px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    Change Password
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 40, background: '#FFF1F2', borderRadius: 20, padding: 24, border: '1px solid #FECDD3' }}>
                <h4 style={{ margin: 0, color: '#BE123C', fontSize: 14, fontWeight: 800 }}>Danger Zone</h4>
                <p style={{ margin: '8px 0 16px', color: '#E11D48', fontSize: 13 }}>Deleting your account will permanently remove all your reports and data.</p>
                <button style={{ padding: '10px 20px', background: '#BE123C', color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                  Delete Account
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
