/* eslint-disable react-hooks/immutability */
'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import api from '@/lib/api';

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [runs, setRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Sync with global search from Topbar
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== query) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(s);
    }
  }, [searchParams, query]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/v1/history');
      setRuns(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRuns = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return runs.filter(run => {
      // ONLY TODAY FILTER
      const runDate = new Date(run.executedAt).toISOString().split('T')[0];
      if (runDate !== today) return false;

      const queryText = query.trim().toLowerCase();
      const name = (run.reportName || '').toLowerCase();
      if (queryText && !name.includes(queryText)) return false;
      if (statusFilter !== 'all' && statusFilter !== run.status) return false;
      return true;
    });
  }, [runs, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRuns.length / pageSize));
  const pagedRuns = filteredRuns.slice((page - 1) * pageSize, page * pageSize);

  const movePage = (value: number) => {
    setPage(prev => Math.min(Math.max(1, prev + value), pageCount));
  };

  const getStatusColor = (status: string) => {
    if (status === 'success') return { bg: '#DCFCE7', text: '#166534' };
    if (status === 'failed') return { bg: '#FEE2E2', text: '#991B1B' };
    return { bg: 'var(--background)', text: 'var(--text-primary)' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: -0.5 }}>Run History</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Live execution audit log and testing results</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => router.push('/builder')}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--primary), #1D4ED8)', color: 'var(--surface)', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                ➕ NEW REPORT
              </button>
              <button 
                onClick={fetchHistory}
                style={{ padding: '10px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                🔄 REFRESH
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 24px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <input 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                placeholder="Search report name..."
                style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', outline: 'none', fontSize: 13, background: 'var(--background)' }}
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
              <span>Rows:</span>
              <select 
                value={pageSize} 
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 12, outline: 'none', cursor: 'pointer', fontWeight: 800 }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1fr', padding: '16px 24px', background: 'var(--background)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              <div>Report Name</div>
              <div>Trigger</div>
              <div>Timestamp</div>
              <div>Duration</div>
              <div>Records</div>
              <div>Status</div>
            </div>

            {isLoading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Syncing history...</div>
            ) : pagedRuns.map(run => {
              const status = getStatusColor(run.status);
              return (
                <div key={run.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid var(--background)', alignItems: 'center', fontSize: 13, transition: 'background 0.2s' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{run.reportName}</div>
                  <div>
                    {run.trigger === 'scheduled' ? (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#9333EA', background: '#FAF5FF', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                        ⏰ Scheduled
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-light)', padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                        {run.trigger === 'manual_export' ? '📊 Excel' : '⚡ Testing'}
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>{new Date(run.executedAt).toLocaleString()}</div>
                  <div style={{ color: 'var(--text-muted)',  }}>{(run.duration / 1000).toFixed(3)}s</div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{run.rowCount?.toLocaleString() || 0}</div>
                  <div>
                    <span style={{ background: status.bg, color: status.text, padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      {run.status}
                    </span>
                  </div>
                </div>
              );
            })}

            {pagedRuns.length === 0 && !isLoading && (
              <div style={{ padding: 100, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📜</div>
                <div style={{ fontWeight: 700 }}>No execution history found</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Showing {pagedRuns.length} of {filteredRuns.length} total runs</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={page === 1} onClick={() => movePage(-1)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>Previous</button>
              <button disabled={page === pageCount} onClick={() => movePage(1)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, cursor: page === pageCount ? 'not-allowed' : 'pointer', fontSize: 12 }}>Next</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div>Loading history...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
