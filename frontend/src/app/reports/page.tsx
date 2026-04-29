/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import api from '@/lib/api';

export default function ReportListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [view, setView] = useState<'grouped' | 'flat'>('grouped');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterDb, setFilterDb] = useState('');
  const [filterFmt, setFilterFmt] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSched, setFilterSched] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<string[]>([]);

  // State for data
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Avoid redundant state update if already loading
      setLoading(curr => curr ? curr : true); 
      const [reportsRes, categoriesRes] = await Promise.all([
        api.get('/v1/reports'),
        api.get('/v1/reports/categories'),
      ]);
      setReports(reportsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync with global search from Topbar
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== search) {
       
      setSearch(s);
    }
  }, [searchParams, search]);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📁', color: '#3B82F6' });

  // Custom Delete Modal & Toast State
  const [reportToDelete, setReportToDelete] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Schedule Modal State
  const [scheduleTarget, setScheduleTarget] = useState<{ id: string; name: string } | null>(null);
  const [schedFreq, setSchedFreq] = useState('daily');
  const [schedTime, setSchedTime] = useState('08:00');
  const [schedWeekDay, setSchedWeekDay] = useState('1');
  const [schedMonthDay, setSchedMonthDay] = useState('1');
  const [schedMonth, setSchedMonth] = useState('1');
  const [schedTimezone, setSchedTimezone] = useState('Asia/Kolkata (IST +05:30)');
  const [schedFmt, setSchedFmt] = useState('xlsx');
  const [schedDelivery, setSchedDelivery] = useState('email');
  const [schedRecipient, setSchedRecipient] = useState('');
  const [schedLoading, setSchedLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };


  const fmtColor: Record<string, { bg: string; color: string }> = {
    xlsx: { bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
    csv: { bg: '#FEF3C7', color: '#92400E' },
    pdf: { bg: '#EDE9FE', color: '#4C1D95' },
  };

  const filtered = reports.filter(r => {
    const nameMatch = r.name?.toLowerCase().includes(search.toLowerCase());
    const slugMatch = r.slug?.toLowerCase().includes(search.toLowerCase());
    const endpointMatch = r.endpoint?.toLowerCase().includes(search.toLowerCase());
    
    if (search && !nameMatch && !slugMatch && !endpointMatch) return false;
    if (filterCat && r.categoryId !== filterCat) return false;
    if (filterDb && (r.database || r.db) !== filterDb) return false;
    if (filterFmt && r.format !== filterFmt) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterSched === 'scheduled' && !r.scheduled) return false;
    if (filterSched === 'ondemand' && r.scheduled) return false;
    return true;
  });

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const totalActive = filtered.filter(r => r.status === 'active').length;
  const totalInactive = filtered.filter(r => r.status === 'inactive').length;
  const totalScheduled = filtered.filter(r => r.scheduled).length;
 
  const handleSaveCategory = async () => {
    if (!categoryForm.name) return;
    try {
      await api.post('/v1/reports/categories', categoryForm);
      showToast('Category added successfully! ✨', 'success');
      fetchData();
      setShowCategoryModal(false);
      setCategoryForm({ name: '', icon: '📁', color: '#3B82F6' });
    } catch (error) {
      showToast('Failed to save category.', 'error');
      console.error('Error saving category:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selected.length} reports?`)) return;
    try {
      setLoading(true);
      await api.post('/v1/reports/bulk-delete', { ids: selected });
      showToast(`${selected.length} reports deleted successfully! 🗑️`, 'success');
      setSelected([]);
      fetchData();
    } catch (error) {
      showToast('Failed to delete reports.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkToggleStatus = async () => {
    if (!selected.length) return;
    try {
      setLoading(true);
      await api.post('/v1/reports/bulk-toggle-status', { ids: selected, status: 'active' });
      showToast(`${selected.length} reports marked as active! ✨`, 'success');
      setSelected([]);
      fetchData();
    } catch (error) {
      showToast('Failed to update reports.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssignCategory = async (catId: string) => {
    if (!selected.length) return;
    try {
      setLoading(true);
      await api.post('/v1/reports/bulk-assign-category', { ids: selected, categoryId: catId });
      showToast(`Moved ${selected.length} reports! 📁`, 'success');
      setSelected([]);
      fetchData();
    } catch (error) {
      showToast('Failed to move reports.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        if (!content.reports) throw new Error('Invalid export format');
        setLoading(true);
        await api.post('/v1/reports/import/json', { reports: content.reports });
        showToast('Workspace imported successfully! 🚀', 'success');
        fetchData();
      } catch (error) {
        showToast('Failed to import workspace.', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleExcelExport = async (id: string, name: string) => {
    try {
      showToast('Preparing Excel file... ⚙️', 'success');
      const res = await api.get(`/v1/reports/${id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name.toLowerCase().replace(/ /g, '_')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Export complete! ⬇️', 'success');
    } catch (error) {
      showToast('Failed to export Excel.', 'error');
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.post('/v1/reports/export/all');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `navacle_reports_export_${new Date().getTime()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      showToast('Workspace exported successfully! ⬇️', 'success');
    } catch (error) {
      showToast('Failed to export workspace.', 'error');
      console.error(error);
    }
  };

  const buildCron = (freq: string, time: string, weekDay: string, monthDay: string, month: string) => {
    const [hh, mm] = time.split(':');
    const h = parseInt(hh, 10);
    const m = parseInt(mm, 10);
    switch (freq) {
      case 'daily':   return `${m} ${h} * * *`;
      case 'weekly':  return `${m} ${h} * * ${weekDay}`;
      case 'monthly': return `${m} ${h} ${monthDay} * *`;
      case 'yearly':  return `${m} ${h} ${monthDay} ${month} *`;
      default:        return `${m} ${h} * * *`;
    }
  };

  const freqDescription = (freq: string, time: string, weekDay: string, monthDay: string, month: string) => {
    const [hh] = time.split(':');
    const ampm = parseInt(hh) >= 12 ? 'PM' : 'AM';
    const h12 = parseInt(hh) % 12 || 12;
    const timeStr = `${h12}:${time.split(':')[1]} ${ampm}`;
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const ordinal = (n: string) => { const num = parseInt(n); if (num===1||num===21||num===31) return num+'st'; if (num===2||num===22) return num+'nd'; if (num===3||num===23) return num+'rd'; return num+'th'; };
    switch (freq) {
      case 'daily':   return `Every day at ${timeStr}`;
      case 'weekly':  return `Every ${days[parseInt(weekDay)]} at ${timeStr}`;
      case 'monthly': return `On the ${ordinal(monthDay)} of every month at ${timeStr}`;
      case 'yearly':  return `On ${months[parseInt(month)-1]} ${ordinal(monthDay)} every year at ${timeStr}`;
      default:        return `Every day at ${timeStr}`;
    }
  };

  const saveScheduleFromReport = async () => {
    if (!scheduleTarget) return;
    if (!schedRecipient.trim()) { showToast('Please enter a recipient email.', 'error'); return; }
    setSchedLoading(true);
    try {
      const cron = buildCron(schedFreq, schedTime, schedWeekDay, schedMonthDay, schedMonth);
      await api.post('/v1/schedules', {
        reportName: scheduleTarget.name,
        cron,
        frequency: schedFreq.charAt(0).toUpperCase() + schedFreq.slice(1),
        time: schedTime,
        timezone: schedTimezone.split(' ')[0],
        format: schedFmt,
        delivery: schedDelivery.charAt(0).toUpperCase() + schedDelivery.slice(1),
        recipient: schedRecipient,
        status: 'active',
      });
      showToast(`Schedule created for "${scheduleTarget.name}"! ⏰`, 'success');
      setScheduleTarget(null);
      setSchedRecipient('');
    } catch (error) {
      showToast('Failed to create schedule.', 'error');
      console.error(error);
    } finally {
      setSchedLoading(false);
    }
  };

  const ReportRow = ({ r }: { r: any }) => (
    <tr style={{ background: selected.includes(r.id) ? 'var(--primary-light)' : 'transparent' }}
      onMouseEnter={e => { if (!selected.includes(r.id)) e.currentTarget.style.background = 'var(--background)'; }}
      onMouseLeave={e => { if (!selected.includes(r.id)) e.currentTarget.style.background = 'transparent'; }}>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
        <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)} />
      </td>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{r.name}</td>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
        {r.categoryId ? (
          <span style={{ background: categories.find(c => c.id === r.categoryId)?.color || 'var(--border)', color: 'var(--surface)', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
            {categories.find(c => c.id === r.categoryId)?.icon} {categories.find(c => c.id === r.categoryId)?.name}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Uncategorised</span>
        )}
      </td>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', fontSize: 11, color: 'var(--text-muted)',  }}>{r.endpoint}</td>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', fontSize: 11, color: 'var(--text-muted)' }}>{r.database || r.db}</td>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
        <span style={{ ...fmtColor[r.format], padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{r.format}</span>
      </td>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
        <span style={{ background: r.status === 'active' ? '#DCFCE7' : 'var(--background)', color: r.status === 'active' ? '#166534' : 'var(--text-muted)', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{r.status}</span>
      </td>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', fontSize: 11, color: 'var(--text-muted)' }}>{r.scheduled ? '⏰ Scheduled' : '—'}</td>
      <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            onClick={() => router.push(`/preview?id=${r.id}`)}
            style={{ padding: '3px 8px', background: '#F0FDF4', color: 'var(--accent)', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            View
          </button>
          <button 
            onClick={() => router.push('/tester')}
            style={{ padding: '3px 8px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            Run
          </button>
          <button 
            onClick={() => { setScheduleTarget({ id: r.id, name: r.name }); setSchedFreq('daily'); setSchedTime('08:00'); }}
            style={{ padding: '3px 8px', background: '#FFF7ED', color: '#C2410C', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            ⏰ Schedule
          </button>
          <button 
            onClick={() => handleExcelExport(r.id, r.name)}
            style={{ padding: '3px 8px', background: '#ECFDF5', color: '#059669', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            📊 Excel
          </button>
          <button 
            onClick={() => router.push(`/builder?id=${r.id}`)}
            style={{ padding: '3px 8px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
          >
            ✏️
          </button>
          <button 
            onClick={() => setReportToDelete({ id: r.id, name: r.name })}
            style={{ padding: '3px 8px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontSize: 13, color: 'var(--text-primary)', background: 'var(--background)' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 32, right: 32, zIndex: 9999,
          background: toast.type === 'success' ? 'var(--primary)' : '#EF4444',
          color: '#fff', padding: '16px 24px', borderRadius: 16,
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 12,
          animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <div style={{ fontSize: 20 }}>{toast.type === 'success' ? '✓' : '✕'}</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{toast.message}</div>
        </div>
      )}

      <Sidebar />

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />

        {/* STICKY HEADER */}
        <div style={{ padding: '12px 20px 10px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {/* Page title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Report List</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>All report templates · grouped by category</div>
            </div>
            <div style={{ flex: 1 }} />
            <button 
              onClick={handleExport}
              style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              ⬇ Export
            </button>
            <label style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center' }}>
              ⬆ Import
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
            <button 
              onClick={() => setShowCategoryModal(true)}
              style={{ padding: '5px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              🗂 Manage Categories
            </button>
            <button 
              onClick={() => router.push('/builder')}
              style={{ padding: '5px 12px', border: 'none', borderRadius: 8, background: 'var(--primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: 'var(--surface)' }}
            >
              + New Report
            </button>
          </div>

          {/* Filter row — PRD Section 4.3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, slug, endpoint…"
              style={{ width: 240, fontSize: 12, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }} />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              style={{ width: 150, fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterDb} onChange={e => setFilterDb(e.target.value)}
              style={{ width: 110, fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }}>
              <option value="">All DB Codes</option>
              <option>ERP</option><option>CRM</option><option>HR</option><option>Finance</option>
            </select>
            <select value={filterFmt} onChange={e => setFilterFmt(e.target.value)}
              style={{ width: 110, fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }}>
              <option value="">All Formats</option>
              <option>xlsx</option><option>csv</option><option>pdf</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ width: 120, fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={filterSched} onChange={e => setFilterSched(e.target.value)}
              style={{ width: 130, fontSize: 11, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6,  outline: 'none' }}>
              <option value="">All Schedules</option>
              <option value="scheduled">Scheduled</option>
              <option value="ondemand">On-demand</option>
            </select>
            <div style={{ flex: 1 }} />

            {/* View toggle — PRD Section 4.5 */}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
              <button onClick={() => setView('grouped')}
                style={{ padding: '5px 10px', border: 'none', background: view === 'grouped' ? 'var(--primary)' : 'var(--surface)', color: view === 'grouped' ? 'var(--surface)' : 'var(--text-primary)', cursor: 'pointer', fontSize: 12,  fontWeight: 600 }}>🗂 Grouped</button>
              <button onClick={() => setView('flat')}
                style={{ padding: '5px 10px', border: 'none', background: view === 'flat' ? 'var(--primary)' : 'var(--surface)', color: view === 'flat' ? 'var(--surface)' : 'var(--text-primary)', cursor: 'pointer', fontSize: 12,  fontWeight: 600 }}>☰ All</button>
            </div>

            {/* Bulk actions */}
            {selected.length > 0 && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>{selected.length} selected</span>
                
                <select 
                  onChange={(e) => { if (e.target.value) handleBulkAssignCategory(e.target.value); }}
                  style={{ padding: '4px 9px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="">Move to...</option>
                  <option value="uncat">Uncategorised</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <button 
                  onClick={handleBulkToggleStatus}
                  style={{ padding: '4px 9px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
                >
                  Mark Active
                </button>
                <button 
                  onClick={handleBulkDelete}
                  style={{ padding: '4px 9px', border: 'none', borderRadius: 6, background: '#FEF2F2', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: '#DC2626' }}
                >
                  Delete
                </button>
                <button onClick={() => setSelected([])} style={{ padding: '4px 9px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', fontSize: 10, fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>✕ Clear</button>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY STRIP — PRD Section 4.4 */}
        <div style={{ padding: '6px 20px', background: 'var(--background)', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span><b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b> reports</span>
          <span><b style={{ color: 'var(--accent)' }}>{totalActive}</b> active</span>
          <span><b style={{ color: '#DC2626' }}>{totalInactive}</b> inactive</span>
          <span><b style={{ color: 'var(--primary)' }}>{totalScheduled}</b> scheduled</span>
          {selected.length > 0 && <span><b style={{ color: '#F59E0B' }}>{selected.length}</b> selected</span>}
        </div>

        {/* LIST BODY */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--primary)', backdropFilter: 'blur(2px)' }}>
              <span style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 10 }}></span>
               Loading reports...
               <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['', 'Name', 'Category', 'Endpoint', 'DB', 'Format', 'Status', 'Schedule', 'Actions'].map(h => (
                    <th key={h} style={{ background: 'var(--background)', padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', top: 0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view === 'flat' ? (
                  filtered.map(r => <ReportRow key={r.id} r={r} />)
                ) : (
                  // GROUPED VIEW — PRD Section 4.1
                  <>
                    {categories.map(cat => {
                      const catReports = filtered.filter(r => r.categoryId === cat.id);
                      const isCollapsed = collapsed.includes(cat.id);
                     return (
                <Fragment key={cat.id}>
    
                          {/* Group header */}
                          <tr key={`hd-${cat.id}`} onClick={() => toggleCollapse(cat.id)} style={{ cursor: 'pointer', background: 'var(--background)' }}>
                            <td colSpan={9} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" onChange={() => {
                                  const ids = catReports.map(r => r.id);
                                  const allSelected = ids.every(id => selected.includes(id));
                                  setSelected(prev => allSelected ? prev.filter(s => !ids.includes(s)) : [...new Set([...prev, ...ids])]);
                                }} onClick={e => e.stopPropagation()} />
                                <span style={{ width: 24, height: 24, background: cat.color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{cat.icon}</span>
                                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>{cat.name}</span>
                                <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{catReports.length} reports</span>
                                <span style={{ background: '#DCFCE7', color: '#166534', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{catReports.filter(r => r.status === 'active').length} active</span>
                                <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{catReports.filter(r => r.scheduled).length} scheduled</span>
                                <div style={{ flex: 1 }} />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📁</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
                              </div>
                            </td>
                          </tr>
                          {!isCollapsed && catReports.map(r => <ReportRow key={r.id} r={r} />)}
                        </Fragment>
                      );
                    })}

                    {/* Uncategorised group */}
                    {(() => {
                      const uncat = filtered.filter(r => !r.categoryId);
                      if (uncat.length === 0) return null;
                      const isCollapsed = collapsed.includes('uncat');
                      return (
                        <>
                          <tr onClick={() => toggleCollapse('uncat')} style={{ cursor: 'pointer', background: 'var(--background)' }}>
                            <td colSpan={9} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Uncategorised</span>
                                <span style={{ background: 'var(--background)', color: 'var(--text-muted)', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{uncat.length} reports</span>
                                <div style={{ flex: 1 }} />
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', display: 'inline-block' }}>▶</span>
                              </div>
                            </td>
                          </tr>
                          {!isCollapsed && uncat.map(r => <ReportRow key={r.id} r={r} />)}
                        </>
                      );
                    })()}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* MANAGE CATEGORIES MODAL */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 440, background: 'var(--surface)', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, var(--primary-light), var(--surface))', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary-dark)' }}>Manage Categories</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Add or remove report categories</div>
              </div>
              <button onClick={() => setShowCategoryModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>✕</button>
            </div>

            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ maxHeight: 240, overflowY: 'auto', border: '2px solid var(--background)', borderRadius: 16, padding: 8 }}>
                {categories.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--background)', marginBottom: 6, border: '1px solid var(--border)' }}>
                    <span style={{ width: 32, height: 32, background: c.color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{c.icon}</span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{c.name}</span>
                    <button 
                      onClick={async () => {
                        try {
                          await api.delete(`/v1/reports/categories/${c.id}`);
                          showToast('Category deleted! 🗑️', 'success');
                          fetchData();
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        } catch (error) {
                          showToast('Failed to delete category.', 'error');
                        }
                      }} 
                      style={{ border: 'none', background: '#FEF2F2', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', color: '#DC2626', fontSize: 11, fontWeight: 700 }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>No categories found.</div>
                )}
              </div>

              <div style={{ padding: 20, background: 'var(--background)', borderRadius: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Add New Category</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="Category Name" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                     <select value={categoryForm.icon} onChange={e => setCategoryForm({...categoryForm, icon: e.target.value})} style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 14, fontWeight: 600, outline: 'none' }}>
                      <option>📁</option><option>📊</option><option>📈</option><option>👥</option><option>🎓</option><option>🏦</option>
                    </select>
                    <input type="color" value={categoryForm.color} onChange={e => setCategoryForm({...categoryForm, color: e.target.value})} style={{ width: '100%', height: 44, border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', background: 'var(--surface)', padding: 4 }} />
                  </div>
                  <button onClick={handleSaveCategory} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'var(--text-primary)', color: 'var(--surface)', fontSize: 13, fontWeight: 800, cursor: 'pointer', marginTop: 4 }}>+ Add Category</button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
      {/* Custom Delete Confirmation Modal */}
      {reportToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 400, background: 'var(--surface)', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '32px 32px 24px 32px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px auto' }}>
                🗑️
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Delete Report</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{reportToDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div style={{ padding: '20px 32px', background: 'var(--background)', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setReportToDelete(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                CANCEL
              </button>
              <button 
                onClick={async () => {
                  try {
                    await api.delete(`/v1/reports/${reportToDelete.id}`);
                    showToast('Report deleted successfully! 🗑️', 'success');
                    fetchData();
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  } catch (error) {
                    showToast('Failed to delete report.', 'error');
                  }
                  setReportToDelete(null);
                }}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(220,38,38,0.2)' }}
              >
                DELETE IT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {scheduleTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setScheduleTarget(null); }}>
          <div style={{ background: 'var(--surface)', borderRadius: 24, width: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, #FFF7ED, var(--surface))', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#C2410C' }}>⏰ Schedule Report</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Automating: <strong style={{ color: 'var(--text-primary)' }}>{scheduleTarget.name}</strong></div>
              </div>
              <button onClick={() => setScheduleTarget(null)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--background)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, fontWeight: 900 }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Frequency */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Frequency</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {['Daily','Weekly','Monthly','Yearly'].map(f => (
                    <div key={f} onClick={() => setSchedFreq(f.toLowerCase())}
                      style={{ padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
                        background: schedFreq === f.toLowerCase() ? 'var(--primary-light)' : 'var(--background)',
                        border: schedFreq === f.toLowerCase() ? '2px solid var(--primary)' : '2px solid transparent',
                        color: schedFreq === f.toLowerCase() ? 'var(--primary-dark)' : 'var(--text-primary)' }}>{f}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 16, gridTemplateColumns: schedFreq === 'yearly' ? '1fr 1fr 1fr' : schedFreq === 'daily' ? '1fr' : '1fr 1fr' }}>
                  {schedFreq === 'weekly' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Day of Week</label>
                      <select value={schedWeekDay} onChange={e => setSchedWeekDay(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                        {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i) => <option key={i} value={i.toString()}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  {schedFreq === 'yearly' && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Month</label>
                      <select value={schedMonth} onChange={e => setSchedMonth(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                        {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => <option key={i} value={(i+1).toString()}>{m}</option>)}
                      </select>
                    </div>
                  )}
                  {(schedFreq === 'monthly' || schedFreq === 'yearly') && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Day of Month</label>
                      <select value={schedMonthDay} onChange={e => setSchedMonthDay(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                        {Array.from({length: 31}, (_,i) => <option key={i+1} value={(i+1).toString()}>{i+1}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Run Time</label>
                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF7ED', borderRadius: 10, border: '1px solid #FED7AA', fontSize: 12, fontWeight: 700, color: '#C2410C' }}>
                  📅 {freqDescription(schedFreq, schedTime, schedWeekDay, schedMonthDay, schedMonth)}
                  <span style={{ marginLeft: 12, color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 400, fontSize: 11 }}>cron: {buildCron(schedFreq, schedTime, schedWeekDay, schedMonthDay, schedMonth)}</span>
                </div>
              </div>
              {/* Format & Timezone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Output Format</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['xlsx','csv','pdf'].map(f => (
                      <div key={f} onClick={() => setSchedFmt(f)}
                        style={{ flex: 1, padding: '10px 0', textAlign: 'center', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
                          background: schedFmt === f ? 'var(--primary-light)' : 'var(--background)',
                          border: schedFmt === f ? '2px solid var(--primary)' : '2px solid transparent',
                          color: schedFmt === f ? 'var(--primary-dark)' : 'var(--text-primary)' }}>{f}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Timezone</label>
                  <select value={schedTimezone} onChange={e => setSchedTimezone(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
                    <option>Asia/Kolkata (IST +05:30)</option>
                    <option>UTC (UTC +00:00)</option>
                    <option>America/New_York (EST -05:00)</option>
                    <option>Europe/London (GMT +00:00)</option>
                  </select>
                </div>
              </div>
              {/* Delivery */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[{id:'email',icon:'📧',label:'Email'},{id:'webhook',icon:'🔗',label:'Webhook'},{id:'storage',icon:'💾',label:'Storage'}].map(d => (
                    <div key={d.id} onClick={() => setSchedDelivery(d.id)}
                      style={{ border: schedDelivery === d.id ? '2px solid var(--primary)' : '2px solid transparent', background: schedDelivery === d.id ? 'var(--primary-light)' : 'var(--background)', borderRadius: 12, padding: '14px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{d.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: schedDelivery === d.id ? 'var(--primary-dark)' : 'var(--text-primary)' }}>{d.label}</div>
                    </div>
                  ))}
                </div>
                {schedDelivery === 'email' && (
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Recipient Email *</label>
                    <input value={schedRecipient} onChange={e => setSchedRecipient(e.target.value)} placeholder="user@company.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                )}
              </div>
            </div>
            {/* Footer */}
            <div style={{ padding: '20px 32px', background: 'var(--background)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setScheduleTarget(null)} style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>CANCEL</button>
              <button onClick={saveScheduleFromReport} disabled={schedLoading} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #EA580C, #C2410C)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: schedLoading ? 0.7 : 1 }}>
                {schedLoading ? 'SAVING...' : '⏰ CREATE SCHEDULE'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}