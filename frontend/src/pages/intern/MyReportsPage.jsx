import React, { useState, useEffect } from 'react';
import ReportForm from '../../components/reports/ReportForm';
import ReportList from '../../components/reports/ReportList';
import reportApi from '../../api/reportApi';
import axiosClient from '../../api/axiosClient';

const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editReport, setEditReport] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Filter states
  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projects, setProjects] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // Fetch projects on mount for the dropdown filter
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosClient.get('/api/projects');
        setProjects(res.data.data || []);
      } catch (err) {
        console.error('Failed to load projects in MyReportsPage', err);
      }
    };
    fetchProjects();
  }, []);

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchReports = async () => {
    const todayStr = getTodayDateString();

    if (startDate && startDate > todayStr) {
      setError('"From Date" cannot be in the future.');
      return;
    }
    if (endDate && endDate > todayStr) {
      setError('"To Date" cannot be in the future.');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError('"From Date" cannot be after "To Date".');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 5,
        projectId: projectIdFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        projectStatus: showArchived ? 'archived' : 'active',
      };
      const response = await reportApi.getReports(params);
      setReports(response.data.reports || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalReports(response.data.pagination?.totalReports || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load daily reports history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, projectIdFilter, startDate, endDate, showArchived]);

  const handleClearFilters = () => {
    setProjectIdFilter('');
    setStartDate('');
    setEndDate('');
    setShowArchived(false);
    setPage(1);
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Daily Progress Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Log your accomplishments, hours worked, and plans for the next day.
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger)',
          color: 'var(--color-danger)',
          padding: '0.75rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-3" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Column: Form */}
        <div style={{ gridColumn: 'span 1' }}>
          <ReportForm 
            onReportSubmitted={() => { setPage(1); fetchReports(); }} 
            editReport={editReport}
            onCancelEdit={() => setEditReport(null)}
          />
        </div>

        {/* Right Column: History */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            
            {/* Title & Filter Header */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              marginBottom: '1.5rem', 
              borderBottom: '1px solid var(--border-light)', 
              paddingBottom: '1rem' 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                Submission History
              </h2>

              {/* Filters Panel */}
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Filter Project</label>
                  <select
                    className="form-input"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '160px', minHeight: 'auto' }}
                    value={projectIdFilter}
                    onChange={(e) => { setProjectIdFilter(e.target.value); if (e.target.value) setShowArchived(false); setPage(1); }}
                  >
                    <option value="">All Projects</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>From Date</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '135px', minHeight: 'auto' }}
                    value={startDate}
                    max={endDate || getTodayDateString()}
                    onClick={(e) => {
                      try {
                        e.target.showPicker();
                      } catch (err) {
                        console.warn('showPicker not supported', err);
                      }
                    }}
                    onFocus={(e) => {
                      try {
                        e.target.showPicker();
                      } catch (err) {
                        console.warn('showPicker not supported', err);
                      }
                    }}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>To Date</label>
                  <input
                    type="date"
                    className="form-input"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '135px', minHeight: 'auto' }}
                    value={endDate}
                    min={startDate || undefined}
                    max={getTodayDateString()}
                    onClick={(e) => {
                      try {
                        e.target.showPicker();
                      } catch (err) {
                        console.warn('showPicker not supported', err);
                      }
                    }}
                    onFocus={(e) => {
                      try {
                        e.target.showPicker();
                      } catch (err) {
                        console.warn('showPicker not supported', err);
                      }
                    }}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  />
                </div>

                {!projectIdFilter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', height: '34px', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      id="showArchivedReports"
                      checked={showArchived}
                      onChange={(e) => { setShowArchived(e.target.checked); setPage(1); }}
                      style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                    <label htmlFor="showArchivedReports" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                      Show Archived
                    </label>
                  </div>
                )}

                {(projectIdFilter || startDate || endDate || showArchived) && (
                  <button
                    onClick={handleClearFilters}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', borderRadius: '6px' }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <ReportList 
              reports={reports} 
              loading={loading} 
              onReportReviewed={fetchReports} 
              onEditReport={(report) => {
                setEditReport(report);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '1.25rem'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalReports} logs)
                </span>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="btn"
                    style={{
                      padding: '0.4rem 1rem',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'transparent',
                      opacity: page === 1 ? 0.5 : 1
                    }}
                  >
                    ◄ Previous
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="btn"
                    style={{
                      padding: '0.4rem 1rem',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      backgroundColor: 'transparent',
                      opacity: page === totalPages ? 0.5 : 1
                    }}
                  >
                    Next ►
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default MyReportsPage;
