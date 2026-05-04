/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import api from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PreviewPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading Preview...</div>}>
      <PreviewContent />
    </Suspense>
  );
}

function getCell(row: any, col: any): string {
  if (!row) return '';
  let v = row[col.field];
  if (v === undefined) v = row[col.label];
  if (v === undefined && col.field) {
    const k = Object.keys(row).find(k => k.toLowerCase() === col.field.toLowerCase());
    if (k) v = row[k];
  }
  if (v === undefined && col.label) {
    const k = Object.keys(row).find(k => k.toLowerCase() === col.label.toLowerCase());
    if (k) v = row[k];
  }
  if (v === undefined) return '';
  return typeof v === 'object' ? JSON.stringify(v) : String(v);
}

function buildColumns(report: any, firstRow: any): any[] {
  const colMap: any[] = (report?.columnMap || []).filter((c: any) => c.vis);
  if (colMap.length > 0 && firstRow) {
    const dataKeys = Object.keys(firstRow).map(k => k.toLowerCase());
    const anyMatch = colMap.some((c: any) =>
      dataKeys.includes((c.field || '').toLowerCase()) ||
      dataKeys.includes((c.label || '').toLowerCase())
    );
    if (anyMatch) return colMap;
  }
  if (firstRow) {
    return Object.keys(firstRow).map(k => ({
      id: k, field: k,
      label: k.replace(/_/g, ' ').toUpperCase(),
      align: 'left', vis: true,
    }));
  }
  return colMap;
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fmt, setFmt] = useState('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    api.get('/v1/reports').then(res => {
      const data: any[] = res.data || [];
      setReports(data);
      if (data.length > 0) setSelectedReportId(initialId || data[0].id);
    }).catch(console.error);
  }, [initialId]);

  useEffect(() => {
    if (!selectedReportId || reports.length === 0) return;
    const report = reports.find(r => r.id === selectedReportId);
    // eslint-disable-next-line react-hooks/immutability
    if (report) fetchData(report);
  }, [selectedReportId, reports]);

  async function fetchData(report: any) {
    if (!report?.endpoint) { setPreviewData([]); return; }
    setIsLoading(true);
    setPreviewData([]);
    try {
      const res = await api.post(`/v1/reports/${report.id}/execute`, {
        parameters: {},
      });
      
      const data = Array.isArray(res.data) ? res.data : 
                 (res.data?.data && Array.isArray(res.data.data)) ? res.data.data :
                 (res.data?.results && Array.isArray(res.data.results)) ? res.data.results : [];

      setPreviewData(data);
    } catch (e) {
      console.error(e); 
      setPreviewData([]);
    } finally { setIsLoading(false); }
  }

  const selectedReport = reports.find(r => r.id === selectedReportId);
  const filteredRows = previewData.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredRows.length / (rowsPerPage || 10));
  const paginatedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const columns = buildColumns(selectedReport, filteredRows[0] ?? previewData[0]);

  const saveFile = (blob: Blob, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  async function exportData() {
    if (filteredRows.length === 0 || fmt === 'grid') return;
    const fn = `${selectedReport?.slug || selectedReport?.name || 'report'}_preview`;
    
    if (fmt === 'excel') {
      try {
        const res = await api.get(`/v1/reports/${selectedReport.id}/export`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${fn}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (e) {
        console.error('Server-side export failed', e);
      }
      return;
    }

    if (fmt === 'csv') {
      const hdr = columns.map((c: any) => `"${c.label}"`).join(',');
      const rows = filteredRows.map(row => columns.map((c: any) => `"${getCell(row, c).replace(/"/g, '""')}"`).join(','));
      saveFile(new Blob([[hdr, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' }), `${fn}.csv`);
    } else if (fmt === 'pdf') {
      const doc = new jsPDF();
      const toggles = selectedReport?.config?.toggles || { header: true, date: true, footer: true };
      
      let startY = 15;
      if (toggles.header !== false) {
        doc.setFontSize(16);
        doc.text(selectedReport?.name || 'Report', 14, startY);
        startY += 7;
      }
      
      if (toggles.date !== false) {
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, startY);
        startY += 8;
      } else {
        startY += 5;
      }
      
      autoTable(doc, {
        head: [columns.map((c: any) => c.label)],
        body: filteredRows.map(row => columns.map((c: any) => getCell(row, c))),
        startY: startY,
        theme: 'grid',
        headStyles: { fillColor: [26, 53, 87] },
      });
      
      doc.save(`${fn}.pdf`);
    }
  }

  const thStyle: any = { padding: '16px 20px', color: 'var(--surface)', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, borderRight: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' };
  const tdStyle: any = { padding: '13px 20px', color: 'var(--text-primary)', fontSize: 13, borderRight: '1px solid var(--background)', fontWeight: 500 };

  return (
    <div style={{ display: 'flex', height: '100vh', color: 'var(--text-primary)', background: 'var(--background)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />

        {/* TOOLBAR */}
        <div style={{ padding: '12px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Select Template</div>
            <select value={selectedReportId} onChange={e => { setSelectedReportId(e.target.value); setSearchQuery(''); setCurrentPage(1); }}
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, fontWeight: 700, outline: 'none', background: 'var(--background)', minWidth: 220 }}>
              {reports.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div style={{ height: 32, width: 1, background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Instant Search</div>
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Filter data..."
              style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--background)', width: 200 }} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {['grid', 'excel', 'csv', 'pdf'].map(f => (
              <div key={f} onClick={() => setFmt(f)}
                style={{ padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: fmt === f ? 'var(--primary)' : 'var(--surface)', color: fmt === f ? 'var(--surface)' : 'var(--text-muted)', border: '1px solid', borderColor: fmt === f ? 'var(--primary)' : 'var(--border)', textTransform: 'uppercase' }}>
                {f}
              </div>
            ))}
            <button onClick={exportData} disabled={filteredRows.length === 0 || fmt === 'grid'}
              style={{ padding: '9px 20px', background: filteredRows.length > 0 && fmt !== 'grid' ? 'linear-gradient(135deg,#22C55E,var(--accent))' : '#CBD5E1', color: 'var(--surface)', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: filteredRows.length > 0 && fmt !== 'grid' ? 'pointer' : 'not-allowed' }}>
              ⬇ EXPORT
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'linear-gradient(180deg,var(--background),var(--background))' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            
            {/* HEADER AND DATE SECTION */}
            {(selectedReport?.config?.toggles?.header !== false || selectedReport?.config?.toggles?.date !== false) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                  {selectedReport?.config?.toggles?.header !== false && (
                    <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{selectedReport?.name || 'Select a Report'}</h1>
                  )}
                  {selectedReport?.config?.toggles?.date !== false && (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>
                      System: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedReport?.database || 'ERP'}</span>
                      {' • '}Generated: <span style={{ fontWeight: 600 }}>{isMounted ? new Date().toLocaleDateString() : '—'}</span>
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Records</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{filteredRows.length}</div>
                </div>
              </div>
            )}

            <div style={{ background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
              {isLoading ? (
                <div style={{ padding: 100, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Loading data...</div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div style={{ padding: 100, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-muted)' }}>
                    {previewData.length === 0 ? 'No data returned. Check the endpoint in Report Builder.' : 'No results match your search.'}
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#1A3557' }}>
                        {columns.map((col: any) => (
                          <th key={col.id || col.field} style={{ ...thStyle, textAlign: col.align || 'left' }}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--background)', background: i % 2 === 1 ? 'var(--background)' : 'var(--surface)' }}>
                          {columns.map((col: any) => (
                            <td key={col.id || col.field} style={{ ...tdStyle, textAlign: col.align || 'left' }}>
                              {getCell(row, col)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* PAGINATION CONTROLS */}
              {!isLoading && filteredRows.length > 0 && (
                <div style={{ padding: '16px 24px', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Rows per page:</span>
                    <select 
                      value={rowsPerPage} 
                      onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                    >
                      {[5, 10, 15, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 12 }}>
                      Showing <b>{(currentPage - 1) * rowsPerPage + 1}</b> to <b>{Math.min(currentPage * rowsPerPage, filteredRows.length)}</b> of <b>{filteredRows.length}</b>
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1}
                      style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: currentPage === 1 ? 'var(--background)' : 'var(--surface)', color: currentPage === 1 ? '#CBD5E1' : 'var(--text-primary)', fontSize: 12, fontWeight: 800, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                    >
                      PREV
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', padding: '0 12px' }}>
                      Page {currentPage} of {totalPages}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages}
                      style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: currentPage === totalPages ? 'var(--background)' : 'var(--surface)', color: currentPage === totalPages ? '#CBD5E1' : 'var(--text-primary)', fontSize: 12, fontWeight: 800, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                    >
                      NEXT
                    </button>
                  </div>
                </div>
              )}
              
              {/* FOOTER SECTION */}
              {selectedReport?.config?.toggles?.footer !== false && (
                <div style={{ padding: '10px 24px', background: '#1A3557', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>NAVACLE REPORT SERVICE v2.0</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>SECURE CLOUD DATA STREAM</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}