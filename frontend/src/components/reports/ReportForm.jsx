import React, { useState, useEffect } from 'react';
import reportApi from '../../api/reportApi';
import axiosClient from '../../api/axiosClient';
import Loader from '../common/Loader';

const ReportForm = ({ onReportSubmitted, editReport, onCancelEdit }) => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [fetchingProjects, setFetchingProjects] = useState(false);

  const [workDone, setWorkDone] = useState('');
  const [hoursWorked, setHoursWorked] = useState(1); // Default value is 1
  const [challenges, setChallenges] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    if (editReport) {
      setProjectId(editReport.projectId?._id || editReport.projectId || '');
      setWorkDone(editReport.workDone || '');
      setHoursWorked(editReport.hoursWorked || 1);
      setChallenges(editReport.challenges || '');
      setTomorrowPlan(editReport.tomorrowPlan || '');
      setFormError('');
      setFormSuccess('');
    }
  }, [editReport]);

  useEffect(() => {
    if (formSuccess) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formSuccess]);

  useEffect(() => {
    const fetchProjects = async () => {
      setFetchingProjects(true);
      try {
        const response = await axiosClient.get('/api/projects');
        // projects data is returned under response.data.data
        const fetchedProjects = response.data.data || [];
        setProjects(fetchedProjects);
        if (fetchedProjects.length > 0) {
          setProjectId(fetchedProjects[0]._id);
        }
      } catch (err) {
        console.error('Failed to load intern projects', err);
      } finally {
        setFetchingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const triggerError = (msg) => {
    setFormError(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (projects.length === 0) {
      triggerError('You are not assigned to any active project workspaces. You cannot submit daily reports.');
      return;
    }

    if (!projectId) {
      triggerError('Please select a project workspace.');
      return;
    }

    if (!workDone || !hoursWorked || !tomorrowPlan) {
      triggerError('Please fill in all required fields (Work Done, Hours Worked, and Tomorrow\'s Plan).');
      return;
    }

    if (hoursWorked < 1 || hoursWorked > 24) {
      triggerError('Hours worked must be between 1 and 24 hours.');
      return;
    }

    setLoading(true);
    try {
      await reportApi.submitReport({
        reportId: editReport ? editReport._id : undefined,
        projectId,
        workDone,
        hoursWorked,
        challenges,
        tomorrowPlan,
      });

      setFormSuccess(editReport ? 'Daily report updated and re-submitted successfully!' : 'Daily report submitted successfully!');
      setWorkDone('');
      setHoursWorked(1);
      setChallenges('');
      setTomorrowPlan('');
      if (projects.length > 0) {
        setProjectId(projects[0]._id);
      }
      
      if (onCancelEdit) {
        onCancelEdit();
      }
      
      if (onReportSubmitted) {
        onReportSubmitted();
      }
    } catch (err) {
      console.error(err);
      triggerError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card fade-in">
      <h2 style={{ marginBottom: '1.5rem', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {editReport ? 'Edit Daily Report' : 'Submit Daily Report'}
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
            onChange={(e) => setProjectId(e.target.value)}
            disabled={loading || fetchingProjects}
            required
          >
            {fetchingProjects ? (
              <option>Loading your projects...</option>
            ) : projects.length === 0 ? (
              <option value="">No projects assigned</option>
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
            <label className="form-label" style={{ margin: 0 }}>Work Accomplished Today *</label>
            <span style={{ fontSize: '0.72rem', color: workDone.length > 900 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
              {workDone.length} / 1000
            </span>
          </div>
          <textarea
            className="form-input"
            rows="4"
            placeholder="Describe what features you implemented or tests you completed..."
            value={workDone}
            onChange={(e) => setWorkDone(e.target.value)}
            disabled={loading}
            style={{ resize: 'vertical' }}
            maxLength={1000}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Hours Invested *</label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="24"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(parseInt(e.target.value) || 0)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Challenges / Impediments (Optional)</label>
            <span style={{ fontSize: '0.72rem', color: challenges.length > 900 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
              {challenges.length} / 1000
            </span>
          </div>
          <textarea
            className="form-input"
            rows="3"
            placeholder="e.g. Blocked by API bugs, DB connectivity errors..."
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            disabled={loading}
            style={{ resize: 'vertical' }}
            maxLength={1000}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Plan for Tomorrow *</label>
            <span style={{ fontSize: '0.72rem', color: tomorrowPlan.length > 900 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
              {tomorrowPlan.length} / 1000
            </span>
          </div>
          <textarea
            className="form-input"
            rows="3"
            placeholder="What tasks do you plan to tackle next?"
            value={tomorrowPlan}
            onChange={(e) => setTomorrowPlan(e.target.value)}
            disabled={loading}
            style={{ resize: 'vertical' }}
            maxLength={1000}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {editReport && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onCancelEdit}
              style={{ width: '40%', padding: '0.75rem' }}
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: editReport ? '60%' : '100%', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? <Loader size="sm" /> : editReport ? 'Update Report' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
