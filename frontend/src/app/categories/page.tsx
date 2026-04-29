/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  textColor: string;
}

interface Report {
  id: string;
  name: string;
  slug: string;
  endpoint: string;
  db: string;
  format: 'xlsx' | 'csv' | 'pdf';
  status: 'active' | 'inactive';
  scheduled: boolean;
  categoryId: string;
}

const icons = ['📁', '📊', '📈', '📋', '🗂', '📌', '💼', '🎓', '👥', '🏦', '🏥', '🎯', '⚙️', '🔧', '📝', '🔍', '💡', '🚀', '🌐', '📦'];
const colors = ['var(--primary)', 'var(--accent)', '#DC2626', '#7C3AED', '#F59E0B', '#0D9488', '#DB2777', '#EA580C', 'var(--text-muted)', '#0F2744'];

const fmtColor: Record<string, { bg: string; color: string }> = {
  xlsx: { bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
  csv: { bg: '#FEF3C7', color: '#92400E' },
  pdf: { bg: '#EDE9FE', color: '#4C1D95' },
};

const getFmtStyle = (format: string) => {
  const f = (format || 'xlsx').toLowerCase();
  return fmtColor[f] || fmtColor.xlsx;
};

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [reportFilter, setReportFilter] = useState(searchParams.get('search') || '');
  const [reportFilterStatus, setReportFilterStatus] = useState('');
  const [reportFilterFormat, setReportFilterFormat] = useState('');
  const [reportFilterScheduled, setReportFilterScheduled] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '📁', color: '#3B82F6', textColor: '#FFFFFF' });
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, repRes] = await Promise.all([
        api.get('/v1/reports/categories'),
        api.get('/v1/reports'),
      ]);
      
      // Deduplicate categories by name
      const uniqueCats: Category[] = [];
      const seenNames = new Set<string>();
      catRes.data.forEach((cat: Category) => {
        if (!seenNames.has(cat.name)) {
          uniqueCats.push(cat);
          seenNames.add(cat.name);
        }
      });

      setCategories(uniqueCats);
      setReports(repRes.data);
      if (uniqueCats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(uniqueCats[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories data:', error);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync with global search from Topbar
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== reportFilter) {
      setReportFilter(s);
    }
  }, [searchParams, reportFilter]);

  const selectedCategory = categories.find(category => category.id === selectedCategoryId) || categories[0] || null;
  const visibleCategories = categories.filter(category => category.name.toLowerCase().includes(categorySearch.toLowerCase()));
  const categoryReports = selectedCategory ? reports.filter(report => report.categoryId === selectedCategory.id) : [];

  const visibleReports = categoryReports.filter(report => {
    const query = reportFilter.trim().toLowerCase();
    if (query && !`${report.name} ${report.slug} ${report.endpoint}`.toLowerCase().includes(query)) return false;
    if (reportFilterStatus && report.status !== reportFilterStatus) return false;
    if (reportFilterFormat && report.format !== reportFilterFormat) return false;
    if (reportFilterScheduled === 'scheduled' && !report.scheduled) return false;
    if (reportFilterScheduled === 'ondemand' && report.scheduled) return false;
    return true;
  });

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditCategoryId(category.id);
      setCategoryForm({ name: category.name, description: category.description, icon: category.icon, color: category.color, textColor: category.textColor });
    } else {
      setEditCategoryId(null);
      setCategoryForm({ name: '', description: '', icon: '📁', color: '#3B82F6', textColor: '#FFFFFF' });
    }
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('Category name is required');
      return;
    }
    try {
      if (editCategoryId) {
        await api.put(`/v1/reports/categories/${editCategoryId}`, categoryForm);
      } else {
        const res = await api.post('/v1/reports/categories', categoryForm);
        setSelectedCategoryId(res.data.id);
      }
      fetchData();
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this folder? Reports inside will be moved to "Uncategorized".')) return;
    try {
      await api.delete(`/v1/reports/categories/${id}`);
      if (selectedCategoryId === id) {
        setSelectedCategoryId('');
      }
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleRun = () => {
    router.push('/tester');
  };

  const handleEditReport = () => {
    router.push('/builder');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontSize: 13, color: 'var(--text-primary)', background: 'var(--background)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: 300, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--surface)', padding: 20 }}>
            <div style={{ marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Folders</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{categories.length} folders</div>
              </div>
              <button onClick={() => openCategoryModal()}
                style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                + New
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)}
                placeholder="Search folders..."
                style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12,  outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {visibleCategories.map(category => {
                const count = reports.filter(report => report.categoryId === category.id).length;
                const isSelected = category.id === selectedCategory?.id;
                return (
                  <button key={category.id} onClick={() => setSelectedCategoryId(category.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: 14, borderRadius: 14,
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--surface)', textAlign: 'left', cursor: 'pointer'
                    }}>
                    <span style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: category.color, color: category.textColor, fontSize: 18 }}>{category.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{category.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count} report{count === 1 ? '' : 's'}</div>
                    </div>
                  </button>
                );
              })}
              {visibleCategories.length === 0 && (
                <div style={{ padding: 16, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-muted)', fontSize: 12 }}>No folders match your search.</div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>Report Categories</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Organise reports into folders for easy navigation</div>
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={() => openCategoryModal()}
                style={{ padding: '6px 14px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                + New Category
              </button>
              <button onClick={() => router.push('/builder')}
                style={{ padding: '6px 14px', border: 'none', background: 'var(--primary)', borderRadius: 8, color: 'var(--surface)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                + New Report
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, marginBottom: 20 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ width: 60, height: 60, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: selectedCategory?.color || 'var(--primary)', color: selectedCategory?.textColor || 'var(--surface)', fontSize: 28 }}>{selectedCategory?.icon || '??'}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{selectedCategory?.name || 'No folder selected'}</div>
                    {selectedCategory && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openCategoryModal(selectedCategory)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.7 }}>✏️</button>
                        <button onClick={() => deleteCategory(selectedCategory.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.7 }}>🗑️</button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{selectedCategory?.description || 'Select a folder to view reports'}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{categoryReports.length} Reports</span>
                    <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{categoryReports.filter(report => report.scheduled).length} Scheduled</span>
                  </div>
                </div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selected Folder</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedCategory?.name || 'None'}</div>
                  </div>
                  <button onClick={() => router.push('/builder')}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    + Add Reports
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Folder color</div>
                  <div style={{ width: 16, height: 16, borderRadius: 6, background: selectedCategory?.color || 'var(--primary)' }} />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
                <input value={reportFilter} onChange={e => setReportFilter(e.target.value)}
                  placeholder="Search reports..."
                  style={{ flex: '1 1 320px', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12, outline: 'none',  }} />
                <select value={reportFilterStatus} onChange={e => setReportFilterStatus(e.target.value)}
                  style={{ width: 140, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12,  outline: 'none' }}>
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select value={reportFilterFormat} onChange={e => setReportFilterFormat(e.target.value)}
                  style={{ width: 120, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12,  outline: 'none' }}>
                  <option value="">All formats</option>
                  <option value="xlsx">xlsx</option>
                  <option value="csv">csv</option>
                  <option value="pdf">pdf</option>
                </select>
                <select value={reportFilterScheduled} onChange={e => setReportFilterScheduled(e.target.value)}
                  style={{ width: 140, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12,  outline: 'none' }}>
                  <option value="">All schedules</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="ondemand">On-demand</option>
                </select>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {visibleReports.map(report => (
                  <div key={report.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--background)' }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{selectedCategory?.icon || '??'}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{report.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>{report.slug} � {report.endpoint}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: getFmtStyle(report.format).bg, color: getFmtStyle(report.format).color, padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{report.format}</span>
                      <span style={{ background: report.status === 'active' ? '#DCFCE7' : 'var(--background)', color: report.status === 'active' ? '#166534' : 'var(--text-muted)', padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{report.status}</span>
                      <button onClick={handleRun}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        ? Run
                      </button>
                      <button onClick={handleEditReport}
                        style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        ?? Edit
                      </button>
                    </div>
                  </div>
                ))}
                {visibleReports.length === 0 && (
                  <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', borderRadius: 14, border: '1px dashed var(--border)', background: 'var(--background)' }}>
                    No reports match your filters. Try changing the search or status.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 480, background: 'var(--surface)', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', background: 'linear-gradient(135deg, var(--primary-light), var(--surface))', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary-dark)' }}>{editCategoryId ? 'Edit Category' : 'Create New Category'}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{editCategoryId ? 'Update your folder settings below' : 'Organize your reports into a colorful new folder'}</div>
              </div>
              <button onClick={() => setShowCategoryModal(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '70vh', overflowY: 'auto' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Folder Name</label>
                <input value={categoryForm.name} onChange={e => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Financial Reports"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }} 
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--background)'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</label>
                <textarea value={categoryForm.description} onChange={e => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What kind of reports live here?"
                  style={{ width: '100%', minHeight: 80, padding: '12px 16px', borderRadius: 12, border: '2px solid var(--background)', background: 'var(--background)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s' }} 
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--background)'}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Choose an Icon</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                  {icons.map(icon => (
                    <button key={icon} type="button" onClick={() => setCategoryForm(prev => ({ ...prev, icon }))}
                      style={{ 
                        aspectRatio: '1', borderRadius: 12, fontSize: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        background: categoryForm.icon === icon ? 'var(--primary-light)' : 'var(--background)',
                        border: categoryForm.icon === icon ? '2px solid var(--primary)' : '2px solid transparent',
                        boxShadow: categoryForm.icon === icon ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
                      }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Theme Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {colors.map(color => (
                    <button key={color} type="button" onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                      style={{ 
                        width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s',
                        background: color,
                        border: '3px solid var(--surface)',
                        boxShadow: categoryForm.color === color ? `0 0 0 2px ${color}, 0 4px 10px rgba(0,0,0,0.2)` : '0 2px 5px rgba(0,0,0,0.1)',
                        transform: categoryForm.color === color ? 'scale(1.1)' : 'scale(1)'
                      }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '20px 32px', background: 'var(--background)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowCategoryModal(false)}
                style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                CANCEL
              </button>
              <button onClick={saveCategory}
                style={{ padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                {editCategoryId ? 'UPDATE FOLDER' : 'CREATE FOLDER'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
