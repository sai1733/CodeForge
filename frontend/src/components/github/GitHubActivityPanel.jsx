import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GitCommit, GitBranch, GitPullRequest, GitMerge, CheckCircle2, AlertCircle } from 'lucide-react';
import githubApi from '../../api/githubApi';

const GitHubActivityPanel = ({ userId = null, projectId = null }) => {
  const [activeTab, setActiveTab] = useState('commits');
  const [githubUsername, setGithubUsername] = useState('');
  const [commits, setCommits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // PR Merging states (Manager only)
  const [mergingPrNumber, setMergingPrNumber] = useState(null);
  const [showMergeConfirmModal, setShowMergeConfirmModal] = useState(false);
  const [prNumberToMerge, setPrNumberToMerge] = useState(null);

  // Get user role from local storage context
  const user = JSON.parse(localStorage.getItem('codeforge_user') || '{}');
  const userRole = user.role || 'intern';

  const fetchGithubData = async () => {
    if (userId === null && !projectId) return;
    setLoading(true);
    setError('');
    try {
      const repoRes = await githubApi.getRepo(userId, projectId);
      if (repoRes.data && repoRes.data.githubUsername && repoRes.data.repoName && repoRes.data.repoName !== 'unknown') {
        setGithubUsername(repoRes.data.githubUsername);
        
        const [commitsRes, branchesRes, pullsRes] = await Promise.all([
          githubApi.getCommits(userId, projectId),
          githubApi.getBranches(userId, projectId),
          githubApi.getPullRequests(userId, projectId),
        ]);

        setCommits(commitsRes.data || []);
        setBranches(branchesRes.data || []);
        setPulls(pullsRes.data || []);
      } else {
        setGithubUsername('');
        setCommits([]);
        setBranches([]);
        setPulls([]);
      }
    } catch (err) {
      console.error('Error loading GitHub repo activities:', err);
      setGithubUsername('');
      setCommits([]);
      setBranches([]);
      setPulls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGithubData();
  }, [userId, projectId]);

  const handleMergePR = async () => {
    if (!prNumberToMerge || !projectId) return;
    setMergingPrNumber(prNumberToMerge);
    setShowMergeConfirmModal(false);
    setError('');
    setSuccessMessage('');
    try {
      await githubApi.mergePullRequest(projectId, prNumberToMerge);
      setSuccessMessage(`Pull Request #${prNumberToMerge} merged successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchGithubData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to merge Pull Request.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setMergingPrNumber(null);
      setPrNumberToMerge(null);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1.5rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Syncing recent GitHub activity...</p>
      </div>
    );
  }

  if (!githubUsername) {
    return null;
  }

  const getPrStateStyle = (state) => {
    switch (state) {
      case 'open':
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'closed':
      default:
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.3)' };
    }
  };

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitBranch size={20} color="var(--color-primary)" /> GitHub Activity
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('commits')}
            className={`btn ${activeTab === 'commits' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <GitCommit size={14} /> Commits ({commits.length})
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`btn ${activeTab === 'branches' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <GitBranch size={14} /> Branches ({branches.length})
          </button>
          <button
            onClick={() => setActiveTab('pulls')}
            className={`btn ${activeTab === 'pulls' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <GitPullRequest size={14} /> PRs ({pulls.length})
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger)',
          color: 'var(--color-danger)',
          padding: '0.6rem 0.85rem',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.825rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid #10b981',
          color: '#10b981',
          padding: '0.6rem 0.85rem',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.825rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <CheckCircle2 size={16} /> {successMessage}
        </div>
      )}

      <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {activeTab === 'commits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {commits.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No recent commits found.</p>
            ) : (
              commits.map((c) => (
                <div key={c.sha} style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <GitCommit size={15} color="var(--color-primary)" /> {c.message}
                    </span>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}
                    >
                      {c.sha.slice(0, 7)}
                    </a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Author: {c.author}</span>
                    <span>{new Date(c.date).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'branches' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {branches.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', gridColumn: 'span 2' }}>No branches found.</p>
            ) : (
              branches.map((b) => (
                <div key={b} style={{
                  padding: '0.6rem 0.8rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  fontFamily: 'monospace'
                }}>
                  <GitBranch size={16} color="var(--color-primary)" /> {b}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pulls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pulls.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>No recent pull requests found.</p>
            ) : (
              pulls.map((p) => (
                <div key={p.id} style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                      <GitPullRequest size={16} color="var(--color-primary)" /> #{p.number} {p.title}
                    </a>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Opened by {p.user} on {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      ...getPrStateStyle(p.state)
                    }}>
                      {p.state}
                    </span>
                    {p.state === 'open' && (userRole === 'manager' || userRole === 'superadmin') && (
                      <button
                        onClick={() => {
                          setPrNumberToMerge(p.number);
                          setShowMergeConfirmModal(true);
                        }}
                        disabled={mergingPrNumber === p.number}
                        className="btn btn-primary"
                        style={{
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <GitMerge size={14} />
                        {mergingPrNumber === p.number ? 'Merging...' : 'Approve & Merge'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Merge Confirmation Modal */}
      {showMergeConfirmModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div className="card" style={{
            width: '400px',
            padding: '2rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitMerge size={20} color="#10b981" /> Confirm PR Merge
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to approve and merge Pull Request <strong>#{prNumberToMerge}</strong>? This will integrate the intern's branch changes into the default branch.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowMergeConfirmModal(false);
                  setPrNumberToMerge(null);
                }}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMergePR}
                className="btn btn-primary"
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <GitMerge size={14} /> Confirm Merge
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GitHubActivityPanel;
