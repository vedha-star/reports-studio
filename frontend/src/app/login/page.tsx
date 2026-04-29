/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function validate(email: string, password: string) {
  const errs: string[] = [];
  if (email && /^\d/.test(email)) errs.push('Email must not start with a number.');
  if (email && !email.includes('@')) errs.push('Email must contain @.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Enter a valid email address.');
  return errs;
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Contains special char', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#EF4444', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];
  const labels = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < score ? colors[score] : '#E2E8F0', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {checks.map((c, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: c.ok ? '#10B981' : '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}>
              {c.ok ? '✓' : '○'} {c.label}
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: colors[score], flexShrink: 0 }}>{labels[score]}</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailErrors: string[] = [];
  if (touched.email) {
    if (!email) emailErrors.push('Email is required.');
    else {
      if (/^\d/.test(email)) emailErrors.push('Email must not start with a number.');
      if (!email.includes('@')) emailErrors.push('Email must contain @.');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) emailErrors.push('Enter a valid email address.');
    }
  }
  const passwordErrors: string[] = [];
  if (touched.password && !password) passwordErrors.push('Password is required.');

  const isValid = !emailErrors.length && !passwordErrors.length && email && password;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validate(email, password);
    if (errs.length || !email || !password) return;
    setServerError('');
    setLoading(true);
    try {
      const res = await api.post('/v1/auth/login', { email, password });
      localStorage.setItem('navacle_token', res.data.token);
      localStorage.setItem('navacle_user', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 14, outline: 'none',
    background: '#F8FAFC', color: '#0F172A', fontWeight: 600, boxSizing: 'border-box',
    border: `2px solid ${hasError ? '#EF4444' : '#E2E8F0'}`, transition: 'border-color 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #0F172A 0%, #1A3557 50%, #1E3A8A 100%)', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideRight { from { transform: translateX(-30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        @keyframes colorShift { 0% { color: #F59E0B; } 50% { color: #10B981; } 100% { color: #2563EB; } }
      `}</style>

      {/* Modern Marquee Bar */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'inline-block', animation: 'marquee 25s linear infinite', fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          <span style={{ animation: 'colorShift 5s infinite alternate', marginRight: 50 }}>✨ Welcome to Navacle Report Studio - The ultimate dynamic query framework for enterprise reporting ✨</span>
          <span style={{ animation: 'colorShift 5s infinite alternate-reverse', marginRight: 50 }}>🚀 131+ Endpoints available · Real-time JSON Mapping · Instant Excel Export 🚀</span>
          <span style={{ animation: 'colorShift 5s infinite alternate', marginRight: 50 }}>💎 Premium Design System Active · New Dashboard Personalization Enabled 💎</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex' }}>
        {/* LEFT */}
        <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 72px', position: 'relative', overflow: 'hidden', animation: 'slideRight 0.8s ease-out' }}>
          <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #2563EB, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>N</div>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>Navacle <span style={{ color: '#F59E0B' }}>Report Studio</span></span>
            </div>
            <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', lineHeight: 1.15, margin: '0 0 20px', letterSpacing: -1 }}>
              Welcome<br /><span style={{ background: 'linear-gradient(90deg, #F59E0B, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Back.</span>
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: 0, maxWidth: 340 }}>Sign in to access your reports, schedules and analytics — all in one place.</p>
            <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[{ icon: '📊', text: 'Real-time dynamic report builder' }, { icon: '🔒', text: 'Secure session management' }, { icon: '⚡', text: '131 cloud query endpoints' }].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, animation: `fadeIn 0.5s ease forwards ${i * 0.2}s`, opacity: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{f.icon}</div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT - FORM */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', animation: 'fadeIn 1s ease' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'rgba(255,255,255,0.97)', borderRadius: 28, padding: '44px 40px', boxShadow: '0 40px 80px rgba(0,0,0,0.3)', animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: '0 0 8px', letterSpacing: -0.5 }}>Welcome back 👋</h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Sign in to your Navacle account</p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
              {/* EMAIL */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Address</label>
                <input
                  suppressHydrationWarning
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  placeholder="you@company.com"
                  style={inputStyle(emailErrors.length > 0)}
                  onFocus={e => { if (!emailErrors.length) e.target.style.borderColor = '#2563EB'; }}
                />
                {emailErrors.map((err, i) => <div key={i} style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 5 }}>⚠ {err}</div>)}
              </div>

              {/* PASSWORD */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F172A', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    suppressHydrationWarning
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, password: true }))}
                    placeholder="••••••••"
                    style={{ ...inputStyle(passwordErrors.length > 0), padding: '13px 48px 13px 16px' }}
                  />
                  <button 
                    suppressHydrationWarning
                    type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: '#94A3B8' }}>
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {passwordErrors.map((err, i) => <div key={i} style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 5 }}>⚠ {err}</div>)}
                <PasswordStrength password={password} />
              </div>

              {serverError && (
                <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#BE123C', fontWeight: 600, animation: 'slideUp 0.3s ease' }}>⚠️ {serverError}</div>
              )}

              <button type="submit" disabled={loading || !isValid}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: loading || !isValid ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading || !isValid ? 'not-allowed' : 'pointer', letterSpacing: 0.3, marginTop: 4, boxShadow: !isValid ? 'none' : '0 4px 20px rgba(37,99,235,0.35)', transition: 'all 0.2s' }}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>

            <div style={{ marginTop: 28, textAlign: 'center', fontSize: 13, color: '#64748B' }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" style={{ color: '#2563EB', fontWeight: 800, textDecoration: 'none' }}>Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
