import React, { useEffect, useContext, useState } from 'react';
import { TaskContext } from '../../context/TaskContext';
import TaskList from '../../components/tasks/TaskList';
import axiosClient from '../../api/axiosClient';

const MyTasksPage = () => {
  const { tasks, fetchTasks, loading, error } = useContext(TaskContext);
  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [projects, setProjects] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  // Fetch intern's projects on mount for filtering
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosClient.get('/api/projects');
        setProjects(res.data.data || []);
      } catch (err) {
        console.error('Failed to load projects in MyTasksPage', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch tasks when mounting or filter changes
  useEffect(() => {
    fetchTasks({ 
      projectId: projectIdFilter || undefined,
      projectStatus: showArchived ? 'archived' : 'active'
    });
  }, [projectIdFilter, showArchived]);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            My Task Spec Board
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Track specs assigned to you, mark progress, and complete spec requirements.
          </p>
        </div>

        {/* Project Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Filter Project Workspace</label>
            <select
              className="form-input"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', width: '200px', minHeight: 'auto' }}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', userSelect: 'none' }}>
              <input
                type="checkbox"
                id="showArchivedTasks"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="showArchivedTasks" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer' }}>
                Show Archived
              </label>
            </div>
          )}
        </div>
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

      {/* Render columns of tasks */}
      <TaskList tasks={tasks} loading={loading} />
    </div>
  );
};

export default MyTasksPage;
