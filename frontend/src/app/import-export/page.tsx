/* eslint-disable react-hooks/immutability */
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import api from '@/lib/api';

interface Report {
  id: string;
  name: string;
  slug: string;
  format: string;
  database: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ImportExportPage() {
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newReport, setNewReport] = useState({
    name: '',
    slug: '',
    description: '',
    format: 'json',
    database: 'ERP',
  });
  const [validationError, setValidationError] = useState('');

  const fmtColor: Record<string, { bg: string; color: string }> = {
    json: { bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
    xlsx: { bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
    csv: { bg: '#FEF3C7', color: '#92400E' },
    pdf: { bg: '#EDE9FE', color: '#4C1D95' },
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Sync with global search from Topbar
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== search) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(s);
    }
  }, [searchParams, search]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/reports');
      setReports(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setExporting(true);
      const response = await api.post('/v1/reports/export/all');
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `full-workspace-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export reports:', error);
      alert('Failed to export reports');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCategories = async () => {
    try {
      setExporting(true);
      const response = await api.post('/v1/reports/export/categories');
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `categories-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export categories:', error);
      alert('Failed to export categories');
    } finally {
      setExporting(false);
    }
  };

  const handleExportTemplates = async () => {
    try {
      setExporting(true);
      // We use the same all endpoint but could filter or have a specific one
      // For now, let's just fetch reports and download them
      const response = await api.get('/v1/reports');
      const dataStr = JSON.stringify({ version: '1.0', reports: response.data }, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `templates-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export templates:', error);
      alert('Failed to export templates');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSingle = async (report: Report) => {
    try {
      const dataStr = JSON.stringify([report], null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.slug}-export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
      alert('Failed to export report');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);

      // Handle both direct array and { reports: [...], categories: [...] } format
      const reportsToImport = Array.isArray(data) ? data : data.reports || [];
      const categoriesToImport = data.categories || [];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await api.post('/v1/reports/import/json', {
        reports: reportsToImport,
        categories: categoriesToImport,
      });

      setImporting(false);
      
      setImportDone(true);

      // Refresh the list
      await fetchReports();

      // Reset success message after 3 seconds
      setTimeout(() => setImportDone(false), 3000);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to import reports:', error);
      alert('Failed to import reports. Please check the file format.');
      setImporting(false);
    }
  };

  const handleDuplicate = async (report: Report) => {
    try {
      await api.post(`/v1/reports/${report.id}/duplicate`);
      await fetchReports();
    } catch (error) {
      console.error('Failed to duplicate report:', error);
      alert('Failed to duplicate report');
    }
  };

  const handleDelete = async (report: Report) => {
    if (!confirm(`Are you sure you want to delete "${report.name}"?`)) return;

    try {
      await api.delete(`/v1/reports/${report.id}`);
      await fetchReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      alert('Failed to delete report');
    }
  };

  const handleAddNewReport = async () => {
    setValidationError('');

    // Validation
    if (!newReport.name.trim()) {
      setValidationError('Report name is required');
      return;
    }
    if (!newReport.slug.trim()) {
      setValidationError('Report slug is required');
      return;
    }

    try {
      await api.post('/v1/reports', {
        name: newReport.name,
        slug: newReport.slug.toLowerCase().replace(/\s+/g, '-'),
        description: newReport.description || '',
        format: newReport.format,
        database: newReport.database,
        config: {},
      });

      // Reset form
      setNewReport({
        name: '',
        slug: '',
        description: '',
        format: 'json',
        database: 'ERP',
      });
      setShowNewReportForm(false);

      // Refresh list
      await fetchReports();
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Failed to create report');
    }
  };

  const filteredReports = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return reports;
    return reports.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.slug.toLowerCase().includes(q) || 
      r.database.toLowerCase().includes(q)
    );
  }, [reports, search]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontSize: 13, color: 'var(--text-primary)', background: 'var(--background)' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* PAGE HEADER */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Import / Export</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Template portability — export and import report configurations as JSON</div>
            </div>
            <button onClick={() => setShowNewReportForm(true)}
              style={{ padding: '8px 16px', background: 'var(--primary)', color: 'var(--surface)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ➕ New Report
            </button>
          </div>

          {/* IE GRID — from index.html .ie-grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

            {/* EXPORT CARD */}
            <div style={{ border: '1.5px dashed var(--border)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--surface)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⬇</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Export Templates</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Download all report templates as a JSON file for backup or migration</div>
              <button onClick={handleExportAll} disabled={exporting}
                style={{ padding: '7px 18px', background: 'var(--primary)', color: 'var(--surface)', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: exporting ? 0.7 : 1 }}>
                {exporting ? '⏳ Exporting...' : '⬇ Export All Templates'}
              </button>
            </div>

            {/* IMPORT CARD */}
            <div style={{ border: '1.5px dashed var(--border)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--surface)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⬆</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Import Templates</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Upload a JSON file to restore or migrate report templates</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              {importDone ? (
                <div style={{ background: '#DCFCE7', color: '#166534', padding: '7px 18px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                  ✓ Import successful!
                </div>
              ) : (
                <button onClick={handleImportClick} disabled={importing}
                  style={{ padding: '7px 18px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: importing ? 0.7 : 1 }}>
                  {importing ? '⏳ Importing...' : '⬆ Choose JSON File'}
                </button>
              )}
            </div>
          </div>

          {/* NEW REPORT FORM MODAL */}
          {showNewReportForm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 24, maxWidth: 500, width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Create New Report</div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Report Name *</label>
                  <input
                    type="text"
                    value={newReport.name}
                    onChange={e => setNewReport({ ...newReport, name: e.target.value })}
                    placeholder="e.g., Monthly Revenue Report"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Report Slug *</label>
                  <input
                    type="text"
                    value={newReport.slug}
                    onChange={e => setNewReport({ ...newReport, slug: e.target.value })}
                    placeholder="e.g., monthly-revenue-report"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>URL-friendly identifier (auto-formatted)</div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Description</label>
                  <textarea
                    value={newReport.description}
                    onChange={e => setNewReport({ ...newReport, description: e.target.value })}
                    placeholder="What does this report do?"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, minHeight: 70,  }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Format</label>
                    <select
                      value={newReport.format}
                      onChange={e => setNewReport({ ...newReport, format: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                    >
                      <option value="json">JSON</option>
                      <option value="xlsx">XLSX</option>
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Database</label>
                    <select
                      value={newReport.database}
                      onChange={e => setNewReport({ ...newReport, database: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                    >
                      <option value="ERP">ERP</option>
                      <option value="HR">HR</option>
                      <option value="CRM">CRM</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                {validationError && (
                  <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px 12px', borderRadius: 6, fontSize: 11, marginBottom: 16 }}>
                    ⚠️ {validationError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowNewReportForm(false)}
                    style={{ padding: '8px 16px', background: 'var(--background)', color: 'var(--text-primary)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleAddNewReport}
                    style={{ padding: '8px 16px', background: 'var(--primary)', color: 'var(--surface)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Create Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATES LIST */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>Report Templates</div>
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter templates..." 
                  style={{ maxWidth: 240, padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 11, outline: 'none', background: 'var(--background)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filteredReports.length} templates</span>
                <button onClick={handleExportAll} disabled={exporting || loading}
                  style={{ padding: '4px 10px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', opacity: exporting || loading ? 0.7 : 1 }}>
                  ⬇ Export All
                </button>
              </div>
            </div>

            {/* Template Items */}
            <div style={{ padding: 12 }}>
              {loading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading reports...</div>
              ) : filteredReports.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No reports match your search.</div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6, background: 'var(--surface)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--background)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>

                    {/* Icon */}
                    <div style={{ width: 36, height: 36, background: 'var(--primary-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📋</div>

                    {/* Name & Meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{report.slug} · {report.database} · {new Date(report.createdAt || '').toLocaleDateString()}</div>
                    </div>

                    {/* Format Badge */}
                    <span style={{ ...fmtColor[report.format], padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{report.format}</span>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleExportSingle(report)}
                        style={{ padding: '4px 10px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                        ⬇ Export
                      </button>
                      <button onClick={() => handleDuplicate(report)}
                        style={{ padding: '4px 10px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                        📋 Duplicate
                      </button>
                      <button onClick={() => handleDelete(report)}
                        style={{ padding: '4px 10px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EXPORT OPTIONS */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Export Options</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { icon: '📦', title: 'Full Export', desc: 'All templates + categories + schedules', btn: 'Export All', color: 'var(--primary)', action: handleExportAll },
                { icon: '📋', title: 'Templates Only', desc: 'Just report template configurations', btn: 'Export Templates', color: '#7C3AED', action: handleExportTemplates },
                { icon: '🗂', title: 'Categories Only', desc: 'Folder structure and assignments', btn: 'Export Categories', color: 'var(--accent)', action: handleExportCategories },
              ].map(opt => (
                <div key={opt.title} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{opt.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{opt.desc}</div>
                  <button onClick={opt.action} disabled={exporting}
                    style={{ padding: '6px 14px', background: opt.color, color: 'var(--surface)', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', width: '100%', opacity: exporting ? 0.7 : 1 }}>
                    ⬇ {opt.btn}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}