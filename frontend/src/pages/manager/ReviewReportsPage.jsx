import React, { useState, useEffect } from 'react';
import ReportList from '../../components/reports/ReportList';
import reportApi from '../../api/reportApi';
import axiosClient from '../../api/axiosClient';

const ReviewReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Filter states
  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projects, setProjects] = useState([]);
  const [interns, setInterns] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // Fetch projects and extract unique interns on mount
  useEffect(() => {
    const fetchProjectsAndInterns = async () => {
      try {
        const res = await axiosClient.get('/api/projects');
        const fetchedProjects = res.data.data || [];
        setProjects(fetchedProjects);

        // Gather unique interns from these projects
        const uniqueInternsMap = {};
        fetchedProjects.forEach((proj) => {
          (proj.internIds || []).forEach((intern) => {
            uniqueInternsMap[intern._id] = intern;
          });
        });
        setInterns(Object.values(uniqueInternsMap));
      } catch (err) {
        console.error('Failed to load filter directories', err);
      }
    };
    fetchProjectsAndInterns();
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
        limit: 10,
        projectId: projectIdFilter || undefined,
        userId: userIdFilter || undefined,
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
      setError('Failed to fetch daily reports for review.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, projectIdFilter, userIdFilter, startDate, endDate, showArchived]);

  const handleClearFilters = () => {
    setProjectIdFilter('');
    setUserIdFilter('');
    setStartDate('');
    setEndDate('');
    setShowArchived(false);
    setPage(1);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Evaluate Daily Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Review work logs submitted by interns, verify hours, and mark reports as reviewed.
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

      <div className="card">
        {/* Header and filters */}
        <div style={{
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            Submissions Queue
          </h2>

          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            fontSize: '0.825rem'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Filter Project</label>
              <select
                className="form-input"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '150px', minHeight: 'auto' }}
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
              <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Filter Intern</label>
              <select
                className="form-input"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '150px', minHeight: 'auto' }}
                value={userIdFilter}
                onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Interns</option>
                {interns.map(i => (
                  <option key={i._id} value={i._id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>From Date</label>
              <input
                type="date"
                className="form-input"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '130px', minHeight: 'auto' }}
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
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '130px', minHeight: 'auto' }}
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
                   id="showArchivedReviewReports"
                   checked={showArchived}
                   onChange={(e) => { setShowArchived(e.target.checked); setPage(1); }}
                   style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                 />
                 <label htmlFor="showArchivedReviewReports" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                   Show Archived
                 </label>
               </div>
             )}

             {(projectIdFilter || userIdFilter || startDate || endDate || showArchived) && (
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

        <ReportList reports={reports} loading={loading} onReportReviewed={fetchReports} />

        {/* Pagination controls */}
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
  );
};

export default ReviewReportsPage;
