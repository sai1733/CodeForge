import React, { useState, useEffect } from 'react';
import githubApi from '../../api/githubApi';

const GitHubLinkForm = ({ projectId, project }) => {
  const [linkedRepo, setLinkedRepo] = useState(null);
  const [hasOauth, setHasOauth] = useState(false);
  
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch linked repo on mount or when projectId changes
  const fetchRepo = async () => {
    if (!projectId) return;
    setFetching(true);
    setError('');
    try {
      const response = await githubApi.getRepo(null, projectId);
      if (response.data) {
        setHasOauth(response.data.hasOauth);
        if (response.data.repoName && response.data.repoName !== 'unknown') {
          setLinkedRepo(response.data);
        } else {
          setLinkedRepo(null);
        }
      } else {
        setLinkedRepo(null);
        setHasOauth(false);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch linked repository information.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchRepo();
  }, [projectId]);

  useEffect(() => {
    const handleOAuthMessage = (event) => {
      if (event.data && event.data.type === 'GITHUB_OAUTH_SUCCESS') {
        window.location.reload();
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => {
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, [projectId]);

  const handleConnectOAuth = () => {
    const token = localStorage.getItem('codeforge_token');
    if (!token) {
      setError('Authentication token not found. Please log in again.');
      return;
    }
    // Open in a new tab
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const url = `${apiBase}/api/github/oauth/init?token=${token}${projectId ? `&projectId=${projectId}` : ''}`;
    window.open(url, '_blank');
  };

  const handleLinkProjectRepo = async () => {
    if (!project || !project.githubRepoName || !project.githubRepoUrl) {
      setError('No repository configured for this project.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await githubApi.selectRepo(project.githubRepoName, project.githubRepoUrl, projectId);
      setLinkedRepo(response.data);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save repository configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading GitHub repository config...</p>
      </div>
    );
  }

  // Case 1: No project selected or project has no repo defined by Admin
  if (!project || !project.githubRepoName || !project.githubRepoUrl) {
    return (
      <div className="card" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🐙</span> GitHub Repository
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          No GitHub repository has been configured for this project by the Admin yet.
        </p>
      </div>
    );
  }

  return (
    <div className="card fade-in" style={{
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-light)'
    }}>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🐙</span> GitHub Repository
      </h3>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger)',
          color: 'var(--color-danger)',
          padding: '0.6rem 0.8rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1rem',
          fontSize: '0.8rem'
        }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--color-success)',
          color: 'var(--color-success)',
          padding: '0.6rem 0.8rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1rem',
          fontSize: '0.8rem'
        }}>
          {message}
        </div>
      )}

      {linkedRepo ? (
        // Case 2: Repository is fully linked and configured
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Your workspace is linked to:
          </p>
          <a
            href={linkedRepo.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--color-primary)',
              wordBreak: 'break-all',
              backgroundColor: 'var(--bg-tertiary)',
              padding: '0.6rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}
          >
            <span>🔗</span> {linkedRepo.repoUrl.replace(/https?:\/\/(www\.)?github\.com\//, '')}
          </a>
          
          {linkedRepo.githubUsername && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Connected via OAuth as <strong>{linkedRepo.githubUsername}</strong>
            </div>
          )}


        </div>
      ) : hasOauth ? (
        // Case 3: Connected via OAuth but this specific project repository needs to be linked
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Your account is connected to GitHub. Click below to link this project to the official repository:
          </p>
          <div style={{
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
            wordBreak: 'break-all'
          }}>
            📦 {project.githubRepoName}
          </div>
          <button
            onClick={handleLinkProjectRepo}
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Linking Workspace...' : 'Link Workspace to Repository'}
          </button>
        </div>
      ) : (
        // Case 4: No active OAuth connection
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Connect your GitHub account to link this workspace and sync commit history, branch allocations, and PRs.
          </p>
          <div style={{
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-tertiary)',
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            border: '1px dashed var(--border-medium)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>🔒</span> Target Repo: <strong>{project.githubRepoName}</strong>
          </div>
          <button
            onClick={handleConnectOAuth}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: '#24292e',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1b1f23'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#24292e'}
          >
            <span style={{ fontSize: '1.2rem' }}>🐙</span> Connect via GitHub OAuth
          </button>
        </div>
      )}
    </div>
  );
};

export default GitHubLinkForm;
