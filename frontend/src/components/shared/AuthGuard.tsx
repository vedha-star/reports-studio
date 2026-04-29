'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem('navacle_token')) {
      router.replace('/login');
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOk(true);
    }
  }, [router]);
  if (!ok) return (
    <div style={{ 
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
      background: 'linear-gradient(135deg, #0F172A 0%, #1A3557 100%)',
      flexDirection: 'column', gap: 20
    }}>
      <div style={{ 
        width: 60, height: 60, borderRadius: 16, 
        background: 'linear-gradient(135deg, #2563EB, #10B981)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30, fontWeight: 900, color: '#fff',
        boxShadow: '0 10px 30px rgba(37,99,235,0.3)',
        animation: 'pulse 2s infinite ease-in-out'
      }}>N</div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
        Verifying Session...
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.9); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
  return <>{children}</>;
}
