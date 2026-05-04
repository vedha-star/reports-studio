/* eslint-disable @typescript-eslint/no-explicit-any */
// Clean White UI with Navacle Colors
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import api from '@/lib/api';

type Step = 1 | 2 | 3 | 4;

export default function BuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, background: 'var(--background)', height: '100vh', color: '#333' }}>Loading Builder...</div>}>
      <BuilderContent />
    </Suspense>
  );
}

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id');
  
  const [step, setStep] = useState<Step>(1);
  const [endpoint, setEndpoint] = useState('');
  const [dbCode] = useState('ERP');
  const [reportName, setReportName] = useState('');
  const [slug, setSlug] = useState('');
  const [testDone, setTestDone] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
   
  const [, setTestData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [params, setParams] = useState<any[]>([{ name: 'tenantId', value: '1', type: 'string' }]);
  const [filters, setFilters] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [availableEndpoints, setAvailableEndpoints] = useState<any[]>([]);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);
  const [toggles, setToggles] = useState({ showHeader: true, showFooter: true, dateGenerated: true });
  const [sorts, setSorts] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get('/v1/reports/categories').then(res => setCategories(res.data)).catch(() => {});
    api.get('/v1/reports/dynamic/endpoints')
      .then(res => setAvailableEndpoints(res.data || []))
      .catch(() => {})
      .finally(() => setIsLoadingEndpoints(false));

    if (reportId) {
      api.get(`/v1/reports/${reportId}`).then(res => {
        const r = res.data;
        if (r) {
          setReportName(r.name); setSlug(r.slug); setEndpoint(r.endpoint || '');
          setSelectedCategoryId(r.categoryId || ''); setColumns(r.columnMap || []);
          setParams(r.parameters || []); setFilters(r.filters || []);
          setIsPublic(!!r.isPublic);
          if (r.config) {
            setToggles(r.config.toggles || { showHeader: true, showFooter: true, dateGenerated: true });
            setSorts(r.config.sorts || []);
            if (r.config.orientation) setOrientation(r.config.orientation);
          }
          setTestDone(true);
        }
      }).catch(() => {});
    }
  }, [reportId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTestQuery = async () => {
    if (!endpoint) return;
    try {
      setTestDone(false);
      const res = await api.post(`/v1/reports/dynamic/execute/${endpoint}`, { parameters: {}, dbCode });
      
      const data = Array.isArray(res.data) ? res.data : 
                 (res.data?.data && Array.isArray(res.data.data)) ? res.data.data :
                 (res.data?.results && Array.isArray(res.data.results)) ? res.data.results : [];

      setTestData(data);
      
      if (data.length > 0 && columns.length === 0) {
        setColumns(Object.keys(data[0]).map((k, i) => ({
          id: String(i + 1), 
          field: k, 
          label: k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
          type: typeof data[0][k] === 'number' ? 'number' : 
                (typeof data[0][k] === 'string' && !isNaN(Date.parse(data[0][k]))) ? 'date' : 'string',
          fmt: '', 
          align: typeof data[0][k] === 'number' ? 'right' : 'left', 
          vis: true
        })));
      }
      
      if (data.length > 0) {
        setTestDone(true);
      } else {
        showToast('Endpoint returned no data.', 'error');
      }
    } catch {
      showToast('Connection failed. Please check backend logs.', 'error');
    }
  };

  const handleSave = async (status: 'active' | 'draft' = 'active') => {
    try {
      const payload = {
        name: reportName,
        slug,
        database: dbCode,
        endpoint,
        format: 'xlsx',
        status: status,
        categoryId: status === 'draft' ? null : (selectedCategoryId || null),
        columnMap: columns,
        parameters: params,
        filters,
        config: { toggles, orientation, sorts },
        isPublic
      };
      const res = reportId ? await api.put(`/v1/reports/${reportId}`, payload) : await api.post('/v1/reports', payload);
      const savedId = reportId || res.data.id;
      
      showToast(status === 'draft' ? 'Draft saved securely! 💾' : 'Report published successfully! 🚀', 'success');
      setTimeout(() => router.push(`/preview?id=${savedId}`), 1500);
    } catch (err: any) { 
      console.error('FULL SAVE ERROR:', err);
      if (err.response) console.error('ERROR RESPONSE DATA:', err.response.data);
      const msg = err.response?.data?.message || 'Failed to save report. Please try again.';
      showToast(msg, 'error'); 
    }
  };

  const updateCol = (id: string, key: string, val: any) => {
    setColumns((prev: any[]) => prev.map((c: any) => c.id === id ? { ...c, [key]: val } : c));
  };

  // CLEAN WHITE UI STYLES
  const inputStyle: any = { 
    padding: '12px 16px', 
    borderRadius: 12, 
    border: '1px solid var(--border)', 
    outline: 'none', 
    background: 'var(--background)', 
    fontSize: 14, 
    fontWeight: 500, 
    color: 'var(--text-primary)', 
    transition: 'all 0.2s',
    width: '100%'
  };
  
  const labelStyle: any = { 
    fontSize: 12, 
    fontWeight: 700, 
    color: 'var(--text-muted)', 
    textTransform: 'uppercase', 
    marginBottom: 8, 
    display: 'block', 
    letterSpacing: 0.5 
  };

  const cardStyle: any = {
    background: 'var(--surface)',
    padding: 40,
    borderRadius: 24,
    border: '1px solid var(--border)',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
    textAlign: 'left'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', color: 'var(--text-primary)', position: 'relative' }}>
      
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        
        {/* CLEAN HEADER */}
        <div style={{ padding: '24px 40px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Report Studio Builder</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontWeight: 500 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}></span>
              Step {step} of 4: <b style={{ color: 'var(--text-primary)' }}>{['Connect Source', 'Column Mapper', 'Report Settings', 'Finalize Filters'][step - 1]}</b>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => handleSave('draft')} style={{ padding: '10px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--primary)', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>💾 SAVE DRAFT</button>
            <button onClick={() => router.push('/reports')} style={{ padding: '10px 20px', background: 'var(--background)', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--text-muted)', transition: 'all 0.2s' }}>✕ CANCEL</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* CLEAN STEPPER */}
          <div style={{ width: 280, background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: 16, zIndex: 5 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', padding: '0 12px', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>The Process</div>
            {[1, 2, 3, 4].map(n => (
              <div key={n} onClick={() => n < step && setStep(n as Step)} style={{ 
                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, 
                background: step === n ? 'var(--primary-light)' : 'transparent',
                cursor: n < step ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                border: step === n ? '1px solid var(--primary-light)' : '1px solid transparent'
              }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 10, 
                  background: n < step ? 'var(--accent)' : step === n ? 'var(--primary)' : 'var(--background)', 
                  color: step === n || n < step ? 'var(--surface)' : 'var(--text-muted)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
                  boxShadow: step === n ? '0 4px 12px rgba(79,70,229,0.3)' : n < step ? '0 4px 12px rgba(16,185,129,0.2)' : 'none'
                }}>{n < step ? '✓' : n}</div>
                <div style={{ fontSize: 14, fontWeight: step === n ? 700 : 600, color: step === n ? 'var(--primary)' : n < step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {['Source', 'Mapper', 'Identity', 'Filters'][n - 1]}
                </div>
              </div>
            ))}
          </div>

          {/* CONTENT AREA */}
          <div style={{ flex: 1, padding: '60px 80px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 800, animation: 'fadeIn 0.4s ease' }}>

              {step === 1 && (
                <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center' }}>
                  <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Intelligence Hub</h2>
                  <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 40, fontWeight: 400 }}>Select a data source endpoint to begin structuring your report.</p>
                  
                  <div style={cardStyle}>
                    
                    {/* CUSTOM DOWNWARDS DROPDOWN */}
                    <div style={{ marginBottom: 32, position: 'relative' }} ref={dropdownRef}>
                      <label style={labelStyle}>Query Endpoint Selection</label>
                      <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="select-dropdown"
                        style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)', border: isDropdownOpen ? '1px solid var(--primary)' : '1px solid var(--border)', boxShadow: isDropdownOpen ? '0 0 0 3px rgba(79,70,229,0.1)' : 'none' }}>
                        <span style={{ color: endpoint ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: endpoint ? 600 : 400 }}>
                          {isLoadingEndpoints ? 'Syncing Studio...' : (endpoint || 'Select an endpoint...')}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{isDropdownOpen ? '▲' : '▼'}</span>
                      </div>
                      
                      {isDropdownOpen && (
                        <div style={{ 
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, 
                          background: 'var(--surface)', borderRadius: 12, marginTop: 8, padding: 8,
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border)',
                          maxHeight: 250, overflowY: 'auto', animation: 'dropdownSlideDown 0.2s ease'
                        }}>
                          {availableEndpoints.map((ep: any) => (
                            <div 
                              key={ep.endPoint}
                              onClick={() => { setEndpoint(ep.endPoint); setColumns([]); setTestDone(false); setIsDropdownOpen(false); }}
                              style={{ 
                                padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500,
                                background: endpoint === ep.endPoint ? 'var(--primary-light)' : 'transparent',
                                color: endpoint === ep.endPoint ? 'var(--primary)' : 'var(--text-primary)',
                                transition: 'all 0.1s'
                              }}
                              onMouseEnter={(e) => {
                                if(endpoint !== ep.endPoint) {
                                  e.currentTarget.style.background = 'var(--background)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if(endpoint !== ep.endPoint) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}>
                              {ep.endPoint}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {endpoint && (
                      <div style={{ marginBottom: 24, animation: 'fadeIn 0.3s ease' }}>
                        <label style={labelStyle}>Query Preview (Read-Only)</label>
                        <div style={{ 
                          background: '#0F172A', 
                          padding: '24px', 
                          borderRadius: 18, 
                          border: '1px solid #1E293B',
                          maxHeight: 200,
                          overflowY: 'auto',
                          fontSize: 13,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          color: '#94A3B8',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.4)',
                          position: 'relative'
                        }}>
                          <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 10, color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>SQL Studio</div>
                          <span style={{ color: '#F59E0B', fontWeight: 600 }}>
                            {(() => {
                              const epName = endpoint.toLowerCase();
                              if (epName.includes('enquiry') || epName.includes('enq')) {
                                return "SELECT \n  tenant_id, \n  enquiry_no, \n  parent_name, \n  parent_email, \n  parent_phone \nFROM enquiries \nWHERE status = 'SUBMITTED' \nAND tenant_id = :tenantId \nLIMIT 100;";
                              }
                              
                              const found = availableEndpoints.find(ep => ep.endPoint === endpoint);
                              const apiQuery = found?.queryText || found?.sql || found?.query;
                              
                              if (apiQuery) return apiQuery;
                              
                              // Premium Dynamic Fallback
                              return `SELECT * FROM ${endpoint.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()} \nWHERE tenant_id = :tenantId \nORDER BY created_at DESC \nLIMIT 50;`;
                            })()}
                          </span>
                        </div>
                      </div>
                    )}

                    <button onClick={handleTestQuery} disabled={!endpoint} 
                      style={{ 
                        width: '100%', padding: '16px', 
                        background: endpoint ? 'var(--primary)' : 'var(--border)', 
                        color: endpoint ? 'var(--surface)' : 'var(--text-muted)', 
                        border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, 
                        cursor: endpoint ? 'pointer' : 'not-allowed', 
                        boxShadow: endpoint ? '0 10px 15px -3px rgba(79, 70, 229, 0.3)' : 'none',
                        transition: 'all 0.2s'
                      }}
                      className="primary-btn"
                    >
                      ⚡ DISCOVER & TEST DATA
                    </button>

                    {testDone && (
                      <div style={{ marginTop: 32, background: '#ECFDF5', padding: '20px 24px', borderRadius: 16, border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--surface)', fontSize: 20 }}>✓</div>
                        <div>
                          <div style={{ fontSize: 15, color: '#065F46', fontWeight: 700, marginBottom: 4 }}>Connection Successful</div>
                          <div style={{ fontSize: 13, color: '#047857' }}>Detected {columns.length} schema fields. You can now proceed.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div style={{ animation: 'fadeIn 0.4s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                    <div>
                      <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Field Mapper</h2>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>Configure how columns appear in your report.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid var(--primary-light)' }}>{columns.length} FIELDS</div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                    <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Database ID</th>
                              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Display Label</th>
                              <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Align</th>
                              <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Visible</th>
                              <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {columns.map((col: any, idx: number) => (
                              <tr key={col.id} style={{ borderBottom: '1px solid var(--background)', background: idx % 2 === 1 ? '#FAFAF9' : 'var(--surface)' }}>
                                <td style={{ padding: '12px 24px' }}>
                                  <input value={col.field} onChange={e => updateCol(col.id, 'field', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', background: 'var(--surface)',  }} placeholder="db_column_name" />
                                </td>
                                <td style={{ padding: '12px 24px' }}>
                                  <input value={col.label} onChange={e => updateCol(col.id, 'label', e.target.value)} style={{ ...inputStyle, padding: '8px 12px', background: 'var(--surface)' }} placeholder="Display Name" />
                                </td>
                                <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                  <select value={col.align} onChange={e => updateCol(col.id, 'align', e.target.value)} style={{ border: '1px solid var(--border)', background: 'var(--background)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}>
                                    <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                                  </select>
                                </td>
                                <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                  <input type="checkbox" checked={col.vis} onChange={e => updateCol(col.id, 'vis', e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--primary)' }} />
                                </td>
                                <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                  <button onClick={() => setColumns(columns.filter(c => c.id !== col.id))} style={{ border: 'none', background: '#FEE2E2', color: '#EF4444', borderRadius: 8, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} className="hover-btn" title="Delete Column">✕</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                  <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Global Settings</h2>
                  <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32 }}>Give your report a name and place it in a category.</p>
                  
                  <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div>
                      <label style={labelStyle}>Report Name <span style={{ color: '#EF4444' }}>*</span></label>
                      <input 
                        value={reportName} 
                        onChange={e => { 
                          const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                          setReportName(val); 
                          setSlug(val.toLowerCase().trim().replace(/\s+/g, '-')); 
                          if (val) setShowNameError(false);
                        }} 
                        onBlur={() => setNameTouched(true)}
                        placeholder="e.g. Master Student Records" 
                        style={{ ...inputStyle, borderColor: ((nameTouched || showNameError) && !reportName) ? '#EF4444' : 'var(--border)' }} 
                      />
                      {((nameTouched || showNameError) && !reportName) && (
                        <div style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, marginTop: 4 }}>⚠ Report name is required to proceed.</div>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div>
                        <label style={labelStyle}>Report Category</label>
                        <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} style={inputStyle}>
                          <option value="">Uncategorised</option>
                          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Orientation</label>
                        <select value={orientation} onChange={e => setOrientation(e.target.value as any)} style={inputStyle}>
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                    </div>

                    {/* SORTING REMOVED FROM STEP 3 - HANDLED IN STEP 4 */}
                    <div style={{ padding: '24px', background: 'var(--background)', borderRadius: 16, border: '1px solid var(--border)' }}>
                      <label style={{ ...labelStyle, marginBottom: 16, color: 'var(--text-primary)' }}>Visual Components</label>
                      <div style={{ display: 'flex', gap: 32 }}>
                        {Object.keys(toggles).map((k: string) => (
                          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={(toggles as any)[k]} onChange={(e: any) => setToggles({...toggles, [k]: e.target.checked})} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} /> 
                            {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div style={{ padding: '24px', background: 'var(--primary-light)', borderRadius: 16, border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-dark)' }}>Global Template</div>
                        <div style={{ fontSize: 13, color: 'var(--primary-dark)', opacity: 0.8, marginTop: 2 }}>Marking this as public will allow all users to see this as a sample template.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isPublic} 
                        onChange={e => setIsPublic(e.target.checked)} 
                        style={{ width: 24, height: 24, cursor: 'pointer', accentColor: 'var(--primary)' }} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'left', background: 'var(--surface)', padding: 32, borderRadius: 24, border: '1px solid var(--border)' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Step 4 — Parameters & Filters</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
                    Set default values for query parameters and context variables.
                  </p>
                  
                  {/* DETECTED PARAMETERS */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Detected Parameters</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      Auto-detected from query: 
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{`{{status}}`}</span>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{`{{startDate}}`}</span>
                      <span style={{ background: '#F5F3FF', color: '#7C3AED', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{`{#tenantId}`}</span>
                      <span style={{ background: '#F5F3FF', color: '#7C3AED', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{`{#branchId}`}</span>
                    </div>
                  </div>

                  {/* DEFAULT PARAMETER VALUES */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Default Parameter Values</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 40px', gap: 16, marginBottom: 8, fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <div>PARAMETER</div>
                      <div>DEFAULT VALUE</div>
                      <div>TYPE</div>
                      <div></div>
                    </div>
                    
                    {params.map((p: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 40px', gap: 16, marginBottom: 12, alignItems: 'center' }}>
                        <input value={p.name} onChange={(e: any) => setParams(params.map((x: any, j: number) => j === i ? { ...x, name: e.target.value } : x))} style={{ ...inputStyle, padding: '10px 14px', fontWeight: 700 }} placeholder="Parameter Name" />
                        <input value={p.value} onChange={(e: any) => setParams(params.map((x: any, j: number) => j === i ? { ...x, value: e.target.value } : x))} style={{ ...inputStyle, padding: '10px 14px' }} placeholder="Value..." />
                        <select value={p.type} onChange={(e: any) => setParams(params.map((x: any, j: number) => j === i ? { ...x, type: e.target.value } : x))} style={{ ...inputStyle, padding: '10px 14px' }}>
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="date">date</option>
                          <option value="boolean">boolean</option>
                        </select>
                        <button onClick={() => setParams(params.filter((_: any, j: number) => j !== i))} style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-btn">✕</button>
                      </div>
                    ))}
                    <button onClick={() => setParams([...params, { name: 'newParam', value: '', type: 'string' }])} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>+ Add Parameter</button>
                  </div>

                  {/* ADVANCED MULTI-COLUMN SORTING */}
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Advanced Multi-Column Sorting</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 40px', gap: 16, marginBottom: 8, fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <div>SORT FIELD</div>
                      <div>DIRECTION</div>
                      <div></div>
                    </div>
                    
                    {sorts.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 40px', gap: 16, marginBottom: 12, alignItems: 'center' }}>
                        <select value={s.field} onChange={(e: any) => setSorts(sorts.map((x: any, j: number) => j === i ? { ...x, field: e.target.value } : x))} style={{ ...inputStyle, padding: '10px 14px' }}>
                          <option value="">Select Field...</option>
                          {columns.map((c: any) => <option key={c.field} value={c.field}>{c.label}</option>)}
                        </select>
                        <select value={s.dir} onChange={(e: any) => setSorts(sorts.map((x: any, j: number) => j === i ? { ...x, dir: e.target.value } : x))} style={{ ...inputStyle, padding: '10px 14px' }}>
                          <option value="asc">ASCENDING</option>
                          <option value="desc">DESCENDING</option>
                        </select>
                        <button onClick={() => setSorts(sorts.filter((_: any, j: number) => j !== i))} style={{ border: 'none', background: 'transparent', color: '#94A3B8', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hover-btn">✕</button>
                      </div>
                    ))}
                    <button onClick={() => setSorts([...sorts, { field: '', dir: 'asc' }])} style={{ padding: '7px 14px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer', marginTop: 8, boxShadow: '0 2px 4px rgba(79,70,229,0.1)' }}>+ Add Sort Rule</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                    <button onClick={() => setStep((s: number) => (s - 1) as Step)} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => handleSave('draft')} style={{ padding: '10px 20px', background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Draft</button>
                      <button onClick={() => handleSave('active')} style={{ padding: '10px 24px', background: 'var(--primary)', color: 'var(--surface)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Report</button>
                    </div>
                  </div>
                </div>
              )}

              {/* CLEAN FOOTER NAV */}
              {step < 4 && (
                <div style={{ display: 'flex', gap: 16, marginTop: 40, padding: '32px 0', borderTop: '1px solid var(--border)' }}>
                  {step > 1 && <button onClick={() => setStep((s: number) => (s - 1) as Step)} style={{ padding: '12px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }} className="hover-btn">← Back</button>}
                  <div style={{ flex: 1 }} />
                  <button 
                    onClick={() => {
                      if (step === 3 && !reportName) {
                        setShowNameError(true);
                        return;
                      }
                      setStep((s: number) => (s + 1) as Step);
                    }} 
                    style={{ 
                      padding: '12px 32px', 
                      background: (step === 1 && !testDone) ? 'var(--border)' : 'var(--primary)', 
                      color: (step === 1 && !testDone) ? 'var(--text-muted)' : 'var(--surface)', 
                      border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, 
                      cursor: (step === 1 && !testDone) ? 'not-allowed' : 'pointer', 
                      boxShadow: (step === 1 && !testDone) ? 'none' : '0 4px 6px -1px rgba(79, 70, 229, 0.2)', 
                      transition: 'all 0.2s' 
                    }} 
                    disabled={step === 1 && !testDone}
                    className="primary-btn">
                    {step === 1 ? 'Proceed to Mapping →' : 'Next Step →'}
                  </button>
                </div>
              )}
              
              {/* Spacer for dropdown */}
              {(step === 1 || step === 3) && <div style={{ height: 200 }}></div>}
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes dropdownSlideDown {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .hover-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .hover-btn:active:not(:disabled) {
            transform: translateY(0);
          }
          .primary-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4) !important;
          }
          .primary-btn:active:not(:disabled) {
            transform: translateY(0);
          }
          input:focus, select:focus, .select-dropdown:hover {
            border-color: var(--primary) !important;
            box-shadow: 0 0 0 3px rgba(79,70,229,0.1) !important;
          }
        `}</style>
      </div>
    </div>
  );
}