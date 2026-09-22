import React, { useState, useEffect, useContext } from 'react';
import { TaskContext } from '../../context/TaskContext';
import axiosClient from '../../api/axiosClient';
import Loader from '../common/Loader';

const TaskForm = ({ onTaskCreated }) => {
  const { createTask, loading } = useContext(TaskContext);
  
  // Project states
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [fetchingProjects, setFetchingProjects] = useState(false);

  const [interns, setInterns] = useState([]);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Status states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (formSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formSuccess]);

  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Fetch projects on mount and load first project's interns
  useEffect(() => {
    const fetchProjects = async () => {
      setFetchingProjects(true);
      try {
        const result = await axiosClient.get('/api/projects');
        const fetchedProjects = result.data.data || [];
        setProjects(fetchedProjects);
        if (fetchedProjects.length > 0) {
          const firstProj = fetchedProjects[0];
          setSelectedProject(firstProj);
          setProjectId(firstProj._id);
          const projectInterns = firstProj.internIds || [];
          setInterns(projectInterns);
          if (projectInterns.length > 0) {
            setAssignedTo(projectInterns[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load projects list', err);
        setFormError('Failed to load active projects. Please ensure workspaces are created.');
      } finally {
        setFetchingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectChange = (projId) => {
    setProjectId(projId);
    const proj = projects.find(p => p._id === projId);
    setSelectedProject(proj);
    const projectInterns = proj?.internIds || [];
    setInterns(projectInterns);
    if (projectInterns.length > 0) {
      setAssignedTo(projectInterns[0]._id);
    } else {
      setAssignedTo('');
    }
  };

  const triggerError = (msg) => {
    setFormError(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (projects.length === 0) {
      triggerError('You do not lead any active projects. You cannot assign tasks.');
      return;
    }

    if (!projectId) {
      triggerError('Please select a project workspace.');
      return;
    }

    if (!title || !description || !assignedTo || !dueDate) {
      triggerError('Please fill out all fields.');
      return;
    }

    if (dueDate < getTomorrowDateString()) {
      triggerError('Due date must be at least tomorrow.');
      return;
    }

    const taskData = {
      title,
      description,
      assignedTo,
      dueDate,
      projectId,
    };

    const result = await createTask(taskData);
    if (result.success) {
      setFormSuccess('Specification assigned successfully!');
      setTitle('');
      setDescription('');
      
      const currentProj = projects.find(p => p._id === projectId);
      const projectInterns = currentProj?.internIds || [];
      if (projectInterns.length > 0) {
        setAssignedTo(projectInterns[0]._id);
      } else {
        setAssignedTo('');
      }

      setDueDate('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    } else {
      triggerError(result.error);
    }
  };

  return (
    <div className="card fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Assign Specification Task
      </h2>

      {formError && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger)',
          color: 'var(--color-danger)',
          padding: '0.75rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {formError}
        </div>
      )}

      {formSuccess && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--color-success)',
          color: 'var(--color-success)',
          padding: '0.75rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {formSuccess}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Select Project Workspace *</label>
          <select
            className="form-input"
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            disabled={loading || fetchingProjects}
            required
          >
            {fetchingProjects ? (
              <option>Loading projects...</option>
            ) : projects.length === 0 ? (
              <option value="">No active projects supervised</option>
            ) : (
              projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Task Title</label>
            <span style={{ fontSize: '0.72rem', color: title.length > 70 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
              {title.length} / 80
            </span>
          </div>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Implement User Schema"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            maxLength={80}
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Task Specifications / Details</label>
            <span style={{ fontSize: '0.72rem', color: description.length > 1400 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
              {description.length} / 1500
            </span>
          </div>
          <textarea
            className="form-input"
            rows="6"
            placeholder="Write specification specifications, criteria, and requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            style={{ resize: 'vertical', minHeight: '120px' }}
            maxLength={1500}
            required
          />
        </div>

        <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Assign To Intern</label>
            <select
              className="form-input"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={loading || fetchingProjects}
              required
            >
              {fetchingProjects ? (
                <option>Loading interns...</option>
              ) : interns.length === 0 ? (
                <option value="">No interns assigned to project</option>
              ) : (
                interns.map((intern) => (
                  <option key={intern._id} value={intern._id}>
                    {intern.name} ({intern.email})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Due Date</label>
            <input
              className="form-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={getTomorrowDateString()}
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
              disabled={loading}
              required
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          type="submit"
          style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          disabled={loading || interns.length === 0}
        >
          {loading ? <Loader size="sm" /> : 'Assign Specification'}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
