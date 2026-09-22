import React, { useEffect, useContext, useState } from 'react';
import TaskForm from '../../components/tasks/TaskForm';
import TaskCard from '../../components/tasks/TaskCard';
import { TaskContext } from '../../context/TaskContext';
import axiosClient from '../../api/axiosClient';

const AssignTaskPage = () => {
  const { tasks, fetchTasks, loading } = useContext(TaskContext);
  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  
  // Status tab and pagination states
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const tasksPerPage = 6;

  // Fetch manager's supervised projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosClient.get('/api/projects');
        setProjects(res.data.data || []);
      } catch (err) {
        console.error('Failed to load projects in AssignTaskPage', err);
      }
    };
    fetchProjects();
  }, []);

  // Refetch tasks when project filter changes, and reset page index
  useEffect(() => {
    fetchTasks({ 
      projectId: projectIdFilter || undefined,
      projectStatus: showArchived ? 'archived' : 'active'
    });
    setPage(1);
  }, [projectIdFilter, showArchived]);

  // Reset page index on status tab toggle
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  // Local filtering & pagination logic
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage) || 1;
  const startIndex = (page - 1) * tasksPerPage;
  const displayedTasks = filteredTasks.slice(startIndex, startIndex + tasksPerPage);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Assign Specifications
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Create and assign developer tasks to interns.
        </p>
      </div>

      <div className="grid grid-cols-3" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Form: Takes 1/3 of the layout */}
        <div style={{ gridColumn: 'span 1' }}>
          <TaskForm onTaskCreated={() => {
            fetchTasks({ 
              projectId: projectIdFilter || undefined,
              projectStatus: showArchived ? 'archived' : 'active'
            });
            setPage(1);
          }} />
        </div>

        {/* Right List: Takes 2/3 of the layout */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            
            {/* Header with Project Filter */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.75rem',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Your Published Assignments
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Filter Project:</span>
                  <select
                    className="form-input"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', width: '160px', minHeight: 'auto', margin: 0 }}
                    value={projectIdFilter}
                    onChange={(e) => { setProjectIdFilter(e.target.value); if (e.target.value) setShowArchived(false); }}
                  >
                    <option value="">All Projects</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {!projectIdFilter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      id="showArchivedAssignTasks"
                      checked={showArchived}
                      onChange={(e) => setShowArchived(e.target.checked)}
                      style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                    <label htmlFor="showArchivedAssignTasks" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                      Show Archived
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Status Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.4rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.5rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              {[
                { id: 'all', label: 'All', count: tasks.length },
                { id: 'assigned', label: 'Assigned', count: tasks.filter(t => t.status === 'assigned').length },
                { id: 'in-progress', label: 'In Progress', count: tasks.filter(t => t.status === 'in-progress').length },
                { id: 'in-review', label: 'In Review', count: tasks.filter(t => t.status === 'in-review').length },
                { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length }
              ].map(tab => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleStatusFilterChange(tab.id)}
                    style={{
                      background: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      padding: '0.05rem 0.35rem',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {loading && tasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading assignments...</p>
            ) : filteredTasks.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0' }}>
                No assignments found matching the active status filter.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                  {displayedTasks.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1.75rem',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '1.25rem'
                  }}>
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.825rem',
                        borderRadius: '6px',
                        opacity: page === 1 ? 0.5 : 1,
                        cursor: page === 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ← Previous
                    </button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.825rem',
                        borderRadius: '6px',
                        opacity: page === totalPages ? 0.5 : 1,
                        cursor: page === totalPages ? 'not-allowed' : 'pointer'
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssignTaskPage;
