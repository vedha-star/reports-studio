/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import api from '@/lib/api';

interface Schedule {
  id: string;
  report: string;
  cron: string;
  frequency: string;
  time: string;
  timezone: string;
  nextRun: string;
  lastRun: string;
  successRate: number;
  totalRuns: number;
  format: string;
  delivery: string;
  recipient: string;
  status: 'active' | 'paused';
  generatedFile?: string;
}

interface Report {
  id: string;
  name: string;
  categoryId?: string;
  format?: string;
}

function SchedulesContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDelivery, setFilterDelivery] = useState('');
  const [filterFmt, setFilterFmt] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [modalTab, setModalTab] = useState('basic');
  const [drawerSchedule, setDrawerSchedule] = useState<Schedule | null>(null);
  const [delivery, setDelivery] = useState('email');
  const [fmt, setFmt] = useState('xlsx');
  const [freq, setFreq] = useState('daily');
  const [report, setReport] = useState('');
  const [cron, setCron] = useState('0 8 * * *');
  const [time, setTime] = useState('08:00');
  const [weekDay, setWeekDay] = useState('1'); // 0=Sun,1=Mon...
  const [monthDay, setMonthDay] = useState('1');
  const [month, setMonth] = useState('1');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST +05:30)');
  const [recipient, setRecipient] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [runSearch, setRunSearch] = useState('');
  const [runFilterStatus, setRunFilterStatus] = useState('');
  const [runPage, setRunPage] = useState(1);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainPage, setMainPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchSchedules();
    fetchReports();
  }, []);

  // Sync with global search from Topbar
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== search) {
      setSearch(s);
    }
  }, [searchParams, search]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/schedules');
      setSchedules(res.data.map((s: any) => ({ 
        ...s, 
        generatedFile: `${(s.reportName || s.report).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${s.format}` 
      })));
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get('/v1/reports');
      setReports(res.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const [drawerRuns, setDrawerRuns] = useState<any[]>([]);

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = schedules.filter(s => {
    if (normalizedSearch) {
      const haystack = `${s.report} ${s.cron} ${s.delivery} ${s.format} ${s.recipient}`.toLowerCase();
      if (!haystack.includes(normalizedSearch)) return false;
    }
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterDelivery && s.delivery !== filterDelivery) return false;
    if (filterFmt && s.format !== filterFmt) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentMainPage = Math.min(mainPage, pageCount);
  const pagedSchedules = filtered.slice((currentMainPage - 1) * pageSize, currentMainPage * pageSize);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleAllSelect = () => {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(s => s.id));
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await api.put(`/v1/schedules/${id}`, { status: currentStatus === 'active' ? 'paused' : 'active' });
      fetchSchedules();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/v1/schedules/${deleteTargetId}`);
      fetchSchedules();
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleClearWorkspace = async () => {
    if (!confirm('Are you sure you want to clear all schedules and run history?')) return;
    try {
      await api.post('/v1/reports/bulk-clear-all');
      await fetchSchedules();
      alert('Workspace cleared.');
    } catch (error) {
      console.error('Failed to clear workspace:', error);
    }
  };

  const formatRunTimestamp = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${pad(date.getDate())} ${monthNames[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const runNow = () => {
    if (!drawerSchedule) return;
    const now = new Date();
    const newRun = {
      num: drawerSchedule.totalRuns + 1,
      timestamp: formatRunTimestamp(now),
      trigger: 'Manual',
      status: 'success',
      rows: Math.floor(1300 + Math.random() * 250),
      duration: `${(0.35 + Math.random() * 0.18).toFixed(2)}s`,
      size: `${(40 + Math.floor(Math.random() * 15))}.0 KB`,
    };

    const currentSuccess = Math.round(drawerSchedule.totalRuns * drawerSchedule.successRate / 100);
    const updatedTotalRuns = drawerSchedule.totalRuns + 1;
    const updatedSuccessRate = Math.round((currentSuccess + 1) / updatedTotalRuns * 100);

    setDrawerRuns(prev => [newRun, ...prev].slice(0, 20));
    setSchedules(prev => prev.map(s => s.id === drawerSchedule.id ? {
      ...s,
      lastRun: formatRunTimestamp(now),
      totalRuns: updatedTotalRuns,
      successRate: updatedSuccessRate,
    } : s));
    setDrawerSchedule(prev => prev ? {
      ...prev,
      lastRun: formatRunTimestamp(now),
      totalRuns: updatedTotalRuns,
      successRate: updatedSuccessRate,
    } : prev);
  };

  const filteredDrawerRuns = drawerRuns.filter(run => {
    if (runSearch && !run.timestamp.toLowerCase().includes(runSearch.toLowerCase()) && !run.trigger.toLowerCase().includes(runSearch.toLowerCase())) {
      return false;
    }
    if (runFilterStatus && run.status !== runFilterStatus) return false;
    return true;
  });

  const runsPerPage = 5;
  const runPageCount = Math.max(1, Math.ceil(filteredDrawerRuns.length / runsPerPage));
  const currentRunPage = Math.min(runPage, runPageCount);
  const visibleDrawerRuns = filteredDrawerRuns.slice((currentRunPage - 1) * runsPerPage, currentRunPage * runsPerPage);

  const setPage = (page: number) => {
    if (page < 1 || page > runPageCount) return;
    setRunPage(page);
  };

  const buildCron = (newFreq: string, newTime: string, newWeekDay: string, newMonthDay: string, newMonth: string) => {
    const [hh, mm] = newTime.split(':');
    const h = parseInt(hh, 10);
    const m = parseInt(mm, 10);
    switch (newFreq) {
      case 'daily':   return `${m} ${h} * * *`;
      case 'weekly':  return `${m} ${h} * * ${newWeekDay}`;
      case 'monthly': return `${m} ${h} ${newMonthDay} * *`;
      case 'yearly':  return `${m} ${h} ${newMonthDay} ${newMonth} *`;
      default:        return cron;
    }
  };

  const handleFreqChange = (newFreq: string) => {
    setFreq(newFreq);
    setCron(buildCron(newFreq, time, weekDay, monthDay, month));
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    setCron(buildCron(freq, newTime, weekDay, monthDay, month));
  };

  const handleWeekDayChange = (newWeekDay: string) => {
    setWeekDay(newWeekDay);
    setCron(buildCron(freq, time, newWeekDay, monthDay, month));
  };

  const handleMonthDayChange = (newMonthDay: string) => {
    setMonthDay(newMonthDay);
    setCron(buildCron(freq, time, weekDay, newMonthDay, month));
  };

  const handleMonthChange = (newMonth: string) => {
    setMonth(newMonth);
    setCron(buildCron(freq, time, weekDay, monthDay, newMonth));
  };

  const freqHumanDescription = () => {
    const [hh] = time.split(':');
    const ampm = parseInt(hh) >= 12 ? 'PM' : 'AM';
    const h12 = parseInt(hh) % 12 || 12;
    const timeStr = `${h12}:${time.split(':')[1]} ${ampm}`;
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const ordinal = (n: string) => { const num = parseInt(n); if (num===1||num===21||num===31) return num+'st'; if (num===2||num===22) return num+'nd'; if (num===3||num===23) return num+'rd'; return num+'th'; };
    switch (freq) {
      case 'daily':   return `Runs every day at ${timeStr}`;
      case 'weekly':  return `Runs every ${days[parseInt(weekDay)]} at ${timeStr}`;
      case 'monthly': return `Runs on the ${ordinal(monthDay)} of every month at ${timeStr}`;
      case 'yearly':  return `Runs on ${months[parseInt(month)-1]} ${ordinal(monthDay)} every year at ${timeStr}`;
      default:        return cron;
    }
  };

  const saveSchedule = async () => {
    if (!report.trim()) {
      alert('Please select a report');
      return;
    }
    if (!recipient.trim()) {
      alert('Please enter a recipient');
      return;
    }

    const payload = {
      reportName: report,
      cron: cron,
      frequency: freq.charAt(0).toUpperCase() + freq.slice(1),
      time: time,
      timezone: timezone.split(' ')[0],
      format: fmt,
      delivery: delivery.charAt(0).toUpperCase() + delivery.slice(1),
      recipient: recipient,
      status: enabled ? 'active' : 'paused'
    };

    try {
      await api.post('/v1/schedules', payload);
      fetchSchedules();
      setShowModal(false);
      setReport('');
      setRecipient('');
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };


  const fmtColor: Record<string, { bg: string; color: string }> = {
    xlsx: { bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
    csv: { bg: '#FEF3C7', color: '#92400E' },
    pdf: { bg: '#EDE9FE', color: '#4C1D95' },
  };

  const deliveryIcon: Record<string, string> = {
    Email: '📧', Webhook: '🔗', Storage: '💾',
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontSize: 13, color: 'var(--text-primary)', background: 'var(--background)' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* PAGE HEADER */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Schedule Manager</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Automate report delivery via cron schedules</div>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={handleClearWorkspace}
              style={{ padding: '5px 12px', border: '1px solid #FECACA', background: '#FEF2F2', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#DC2626' }}>🗑️ Clear Workspace</button>
            <button style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>⬇ Export</button>
            <button onClick={() => { setShowModal(true); setModalTab('basic'); }}
              style={{ padding: '5px 12px', border: 'none', borderRadius: 8, background: 'var(--primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--surface)' }}>+ New Schedule</button>
          </div>

          {/* STAT CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Schedules', val: schedules.length.toString(), sub: `across ${new Set(schedules.map(s => s.report)).size} reports`, color: 'var(--text-primary)' },
              { label: 'Active', val: schedules.filter(s => s.status === 'active').length.toString(), sub: 'running normally', color: 'var(--accent)' },
              { label: 'Paused', val: schedules.filter(s => s.status === 'paused').length.toString(), sub: 'manually paused', color: '#D97706' },
              { label: 'Next Run', val: '2 hrs', sub: 'Staff Attendance · 18:00', color: 'var(--primary)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* FILTER BAR */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search schedules…"
              style={{ width: 220, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12,  outline: 'none' }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ width: 130, fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <select value={filterDelivery} onChange={e => setFilterDelivery(e.target.value)}
              style={{ width: 130, fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }}>
              <option value="">All delivery</option>
              <option>Email</option><option>Webhook</option><option>Storage</option>
            </select>
            <select value={filterFmt} onChange={e => setFilterFmt(e.target.value)}
              style={{ width: 110, fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }}>
              <option value="">All formats</option>
              <option>xlsx</option><option>csv</option><option>pdf</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginLeft: 12 }}>
              <span>Rows:</span>
              <select 
                value={pageSize} 
                onChange={e => { setPageSize(Number(e.target.value)); setMainPage(1); }}
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 11, outline: 'none', cursor: 'pointer', fontWeight: 800 }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
              </select>
            </div>
            <div style={{ flex: 1 }} />
            {selected.length > 0 && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>⏸ Pause Selected</button>
                <button style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#FEF2F2', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: '#DC2626' }}>✕ Delete Selected</button>
              </div>
            )}
          </div>

          {/* TABLE */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ background: 'var(--background)', padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid var(--border)', width: 36 }}>
                    <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAllSelect} />
                  </th>
                  {['Sample Report List', 'Generated File Name', 'Frequency', 'Format', 'Delivery', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ background: 'var(--background)', padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedSchedules.map((s, i) => (
                  <tr key={s.id} style={{ background: selected.includes(s.id) ? 'var(--primary-light)' : 'transparent' }}
                    onMouseEnter={e => { if (!selected.includes(s.id)) e.currentTarget.style.background = 'var(--background)'; }}
                    onMouseLeave={e => { if (!selected.includes(s.id)) e.currentTarget.style.background = 'transparent'; }}>
                    <td style={{ padding: '9px 12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', verticalAlign: 'middle' }}>
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} />
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.report || (s as any).reportName}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Template Ref: {(s as any).reportId || 'TEMP-402'}</div>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>{ s.generatedFile || 'Pending...' }</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Last: {s.lastRun}</div>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600 }}>{s.frequency}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.time} · {s.timezone}</div>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', verticalAlign: 'middle' }}>
                      <span style={{ ...fmtColor[s.format], padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{s.format}</span>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span>{deliveryIcon[s.delivery]}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 11 }}>{s.delivery}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.recipient}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', verticalAlign: 'middle' }}>
                      <span style={{ background: s.status === 'active' ? '#DCFCE7' : '#FEF3C7', color: s.status === 'active' ? '#166534' : '#92400E', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                        {s.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setDrawerSchedule(s); setShowDrawer(true); }}
                          style={{ padding: '3px 8px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>📋 Runs</button>
                        <button onClick={() => { setShowModal(true); setModalTab('basic'); }}
                          style={{ padding: '3px 8px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => toggleStatus(s.id, s.status)}
                          style={{ padding: '3px 8px', background: s.status === 'active' ? '#FEF3C7' : '#DCFCE7', color: s.status === 'active' ? '#92400E' : '#166534', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                          {s.status === 'active' ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => { setDeleteTarget(s.report || (s as any).reportName); setDeleteTargetId(s.id); setShowDeleteConfirm(true); }}
                          style={{ padding: '3px 8px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div style={{ padding: 60, textAlign: 'center', background: 'var(--surface)' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⏰</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>No active schedules</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Click &quot;New Schedule&quot; to automate your first report.</div>
              </div>
            )}
          </div>

          {/* Pagination info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Showing {(currentMainPage - 1) * pageSize + 1}–{Math.min(currentMainPage * pageSize, filtered.length)} of {filtered.length} schedules</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={currentMainPage === 1} onClick={() => setMainPage(p => p - 1)} style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, cursor: currentMainPage === 1 ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600 }}>Previous</button>
              <button disabled={currentMainPage === pageCount} onClick={() => setMainPage(p => p + 1)} style={{ padding: '6px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, cursor: currentMainPage === pageCount ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600 }}>Next</button>
            </div>
          </div>

        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: 'var(--surface)', borderRadius: 24, width: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)' }}>
            
            <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, var(--primary-light), var(--surface))', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary-dark)' }}>New Schedule</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Configure automated report delivery</div>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0 32px', flexShrink: 0 }}>
              {[{ id: 'basic', label: '⚙ Basic' }, { id: 'delivery', label: '📤 Delivery' }, { id: 'params', label: '⚡ Parameters' }].map(tab => (
                <div key={tab.id} onClick={() => setModalTab(tab.id)}
                  style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', color: modalTab === tab.id ? 'var(--primary)' : 'var(--text-muted)', borderBottom: modalTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent', transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {tab.label}
                </div>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>

              {modalTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Report *</label>
                      <select value={report} onChange={e => setReport(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                        <option value="">— select report —</option>
                        {reports.map((r) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Output Format</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {['xlsx', 'csv', 'pdf'].map(f => (
                          <div key={f} onClick={() => setFmt(f)}
                            style={{ padding: '10px 0', textAlign: 'center', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: fmt === f ? 'var(--primary-light)' : 'var(--background)', border: fmt === f ? '2px solid var(--primary)' : '2px solid transparent', color: fmt === f ? 'var(--primary-dark)' : 'var(--text-primary)', userSelect: 'none', transition: 'all 0.2s' }}>
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Frequency</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                      {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(f => (
                        <div key={f} onClick={() => handleFreqChange(f.toLowerCase())}
                          style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: freq === f.toLowerCase() ? 'var(--primary-light)' : 'var(--background)', border: freq === f.toLowerCase() ? '2px solid var(--primary)' : '2px solid transparent', color: freq === f.toLowerCase() ? 'var(--primary-dark)' : 'var(--text-primary)', userSelect: 'none', transition: 'all 0.2s' }}>
                          {f}
                        </div>
                      ))}
                    </div>

                    {freq === 'daily' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Run Time</label>
                          <input type="time" value={time} onChange={e => handleTimeChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                      </div>
                    )}

                    {freq === 'weekly' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Day of Week</label>
                          <select value={weekDay} onChange={e => handleWeekDayChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i) => <option key={i} value={i.toString()}>{d}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Run Time</label>
                          <input type="time" value={time} onChange={e => handleTimeChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                      </div>
                    )}

                    {freq === 'monthly' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Day of Month</label>
                          <select value={monthDay} onChange={e => handleMonthDayChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                            {Array.from({length: 31}, (_,i) => <option key={i+1} value={(i+1).toString()}>{i+1}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Run Time</label>
                          <input type="time" value={time} onChange={e => handleTimeChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                      </div>
                    )}

                    {freq === 'yearly' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Month</label>
                          <select value={month} onChange={e => handleMonthChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => <option key={i} value={(i+1).toString()}>{m}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Day</label>
                          <select value={monthDay} onChange={e => handleMonthDayChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                            {Array.from({length: 31}, (_,i) => <option key={i+1} value={(i+1).toString()}>{i+1}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Run Time</label>
                          <input type="time" value={time} onChange={e => handleTimeChange(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--primary-light)', borderRadius: 10, border: '1px solid var(--primary)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)', marginBottom: 4 }}>{freqHumanDescription()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>Cron: <span style={{ color: 'var(--primary)' }}>{cron}</span></div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Timezone</label>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                      <option>Asia/Kolkata (IST +05:30)</option>
                      <option>UTC (UTC +00:00)</option>
                      <option>America/New_York (EST -05:00)</option>
                      <option>Europe/London (GMT +00:00)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--background)', borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>Enable Schedule</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Schedule will start running immediately when enabled</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                      <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                      <span style={{ position: 'absolute', inset: 0, borderRadius: 24, background: enabled ? 'var(--primary)' : 'var(--border)', transition: 'background 0.2s' }} />
                      <span style={{ position: 'absolute', width: 20, height: 20, background: 'var(--surface)', borderRadius: '50%', top: 2, left: enabled ? 22 : 2, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </label>
                  </div>
                </div>
              )}

              {modalTab === 'delivery' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Method</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {[
                        { id: 'email', icon: '📧', label: 'Email', sub: 'Send to recipients' },
                        { id: 'webhook', icon: '🔗', label: 'Webhook', sub: 'POST to endpoint' },
                        { id: 'storage', icon: '💾', label: 'Storage', sub: 'Save to S3/disk' },
                      ].map(d => (
                        <div key={d.id} onClick={() => setDelivery(d.id)}
                          style={{ border: delivery === d.id ? '2px solid var(--primary)' : '2px solid transparent', background: delivery === d.id ? 'var(--primary-light)' : 'var(--background)', borderRadius: 12, padding: '16px 12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: delivery === d.id ? '0 4px 10px rgba(0,0,0,0.05)' : 'none' }}>
                          <div style={{ fontSize: 28, marginBottom: 8 }}>{d.icon}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: delivery === d.id ? 'var(--primary-dark)' : 'var(--text-primary)' }}>{d.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>{d.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {delivery === 'email' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Recipients *</label>
                        <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="user@company.com" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject Template</label>
                        <input defaultValue="{{reportName}} — {{date}}" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>Tokens: <code style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: 4 }}>{`{{reportName}}`}</code>, <code style={{ color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: 4 }}>{`{{date}}`}</code></div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Body</label>
                        <textarea rows={3} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} placeholder="Hi, Please find the attached report." />
                      </div>
                    </div>
                  )}

                  {delivery === 'webhook' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Webhook URL *</label>
                        <input placeholder="https://hooks.yourapp.com/reports/notify" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                      </div>
                    </div>
                  )}

                  {delivery === 'storage' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Storage Provider</label>
                        <select style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                          <option>Amazon S3</option>
                          <option>Google Cloud Storage</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'params' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 12, padding: '16px', fontSize: 13, color: 'var(--primary-dark)', fontWeight: 600 }}>
                    ℹ️ These parameter values will be used for every scheduled run. Context variables like <code style={{ background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, color: 'var(--primary)' }}>{`{{tenantId}}`}</code> are resolved at runtime.
                  </div>
                  
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Query Parameters</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[{ name: 'status', value: 'SUBMITTED', type: 'string' }, { name: 'startDate', value: '{{MONTH_START}}', type: 'date' }].map((p, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--background)', padding: 12, borderRadius: 12 }}>
                          <div style={{ width: 150, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                          <input defaultValue={p.value} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, outline: 'none' }} />
                          <select style={{ width: 120, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 13, fontWeight: 600, outline: 'none' }}>
                            <option>{p.type}</option><option>string</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '20px 32px', background: 'var(--background)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={saveSchedule}
                style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                SAVE SCHEDULE
              </button>
            </div>

          </div>
        </div>
      )}

      {showDrawer && drawerSchedule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 400, display: 'flex', justifyContent: 'flex-end' }}
          onClick={e => { if (e.target === e.currentTarget) setShowDrawer(false); }}>
          <div style={{ width: 640, height: '100%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)' }}>

            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{drawerSchedule.report}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3,  }}>{drawerSchedule.cron}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => { setShowDrawer(false); setShowModal(true); }}
                  style={{ padding: '4px 10px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>✏ Edit Schedule</button>
                <button onClick={runNow}
                  style={{ padding: '4px 10px', background: 'var(--primary)', color: 'var(--surface)', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>▶ Run Now</button>
                <button onClick={() => setShowDrawer(false)}
                  style={{ border: 'none', background: 'var(--background)', color: 'var(--text-primary)', width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: 'var(--background)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, flexShrink: 0, flexWrap: 'wrap' }}>
              {[
                { label: 'Next Run', val: drawerSchedule.nextRun },
                { label: 'Cron', val: drawerSchedule.cron },
                { label: 'Delivery', val: drawerSchedule.delivery },
                { label: 'Format', val: drawerSchedule.format },
                { label: 'Status', val: drawerSchedule.status },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{item.val}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Run History</div>
              <div style={{ flex: 1 }} />
              <input value={runSearch} onChange={e => setRunSearch(e.target.value)} placeholder="Filter runs..." style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11, width: 140 }} />
              <select value={runFilterStatus} onChange={e => setRunFilterStatus(e.target.value)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11 }}>
                <option value="">Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface)' }}>
                  <tr>
                    {['#', 'Timestamp', 'Trigger', 'Status', 'Rows', 'Duration', 'Size'].map(h => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleDrawerRuns.map((run, i) => (
                    <tr key={i} onMouseEnter={e => e.currentTarget.style.background = 'var(--background)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{run.num}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{run.timestamp}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 10, background: run.trigger === 'Manual' ? 'var(--primary-light)' : 'var(--background)', color: run.trigger === 'Manual' ? 'var(--primary-dark)' : 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>{run.trigger}</span>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: run.status === 'success' ? '#166534' : '#991B1B', fontWeight: 700, fontSize: 11 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: run.status === 'success' ? '#22C55E' : '#EF4444' }}></span>
                          {run.status === 'success' ? 'SUCCESS' : 'FAILED'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>{run.rows.toLocaleString()}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>{run.duration}</td>
                      <td style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>{run.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleDrawerRuns.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No run history found.</div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Showing {(currentRunPage-1)*runsPerPage+1}–{Math.min(currentRunPage*runsPerPage, filteredDrawerRuns.length)} of {filteredDrawerRuns.length} runs</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={currentRunPage === 1} onClick={() => setPage(currentRunPage - 1)} style={{ padding: '5px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, cursor: currentRunPage === 1 ? 'not-allowed' : 'pointer', fontSize: 11 }}>Prev</button>
                <button disabled={currentRunPage === runPageCount} onClick={() => setPage(currentRunPage + 1)} style={{ padding: '5px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, cursor: currentRunPage === runPageCount ? 'not-allowed' : 'pointer', fontSize: 11 }}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 400, background: 'var(--surface)', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px auto' }}>🗑️</div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Delete Schedule</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete the schedule for <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget}</strong>? This action cannot be undone.
              </p>
            </div>
            <div style={{ padding: '20px 32px', background: 'var(--background)', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>CANCEL</button>
              <button onClick={confirmDelete} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(220,38,38,0.2)' }}>DELETE IT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchedulesPage() {
  return (
    <Suspense fallback={<div>Loading schedules...</div>}>
      <SchedulesContent />
    </Suspense>
  );
}