import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Save, GitCommit, RefreshCw, GitPullRequest, FolderGit2 } from 'lucide-react';
import sdk from '@stackblitz/sdk';
import projectApi from '../../api/projectApi';
import fileApi from '../../api/fileApi';
import githubApi from '../../api/githubApi';
import Loader from '../../components/common/Loader';

const CloudIDEPage = () => {
  // Projects state
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [fetchingProjects, setFetchingProjects] = useState(false);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [ideLoading, setIdeLoading] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [pushing, setPushing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showPrModal, setShowPrModal] = useState(false);
  const [prTitle, setPrTitle] = useState('');
  const [submittingPr, setSubmittingPr] = useState(false);
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);

  const vmRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Fetch intern's assigned workspaces
  useEffect(() => {
    const fetchProjects = async () => {
      setFetchingProjects(true);
      setError('');
      try {
        const response = await projectApi.getProjects();
        const data = response.data || [];
        setProjects(data);
        
        const searchParams = new URLSearchParams(window.location.search);
        const urlProjectId = searchParams.get('projectId');
        const savedProjectId = localStorage.getItem('codeforge_selected_project_id');
        
        if (urlProjectId && data.some(p => p._id === urlProjectId)) {
          setSelectedProjectId(urlProjectId);
        } else if (savedProjectId && data.some(p => p._id === savedProjectId)) {
          setSelectedProjectId(savedProjectId);
        } else if (data.length > 0) {
          setSelectedProjectId(data[0]._id);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch assigned project workspaces.');
      } finally {
        setFetchingProjects(false);
      }
    };

    fetchProjects();

    // Check for sync success across page reload
    const isSyncSuccess = sessionStorage.getItem('codeforge_sync_success');
    if (isSyncSuccess) {
      setSuccessMessage('Workspace synced with main branch successfully!');
      sessionStorage.removeItem('codeforge_sync_success');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, []);

  // 2. Initialize StackBlitz Project when project workspace changes
  useEffect(() => {
    if (!selectedProjectId) return;

    const loadStackBlitzWorkspace = async () => {
      setIdeLoading(true);
      setError('');
      vmRef.current = null;

      try {
        // Fetch files from MongoDB (include content to initialize StackBlitz)
        const response = await fileApi.getFiles(selectedProjectId, true);
        const dbFiles = response.data;

        // Build file tree for StackBlitz project
        const filesObj = {};
        if (dbFiles && dbFiles.length > 0) {
          dbFiles.forEach((file) => {
            // StackBlitz paths must not have leading slashes
            let cleanPath = file.path;
            if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
            
            // Skip placeholders in StackBlitz editor view
            if (file.fileName === '.keep') return;

            filesObj[cleanPath] = file.content || '';
          });
        }



        const project = {
          title: 'CodeForge Workspace',
          description: 'Intern Evaluation Sandbox',
          template: 'node', // Boots WebContainer node backend shell
          files: filesObj
        };

        // Clear previous container contents to allow fresh boot
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Select which file to open automatically on boot
        const fileKeys = Object.keys(filesObj);
        let openFileName = undefined;
        if (fileKeys.length > 0) {
          openFileName = fileKeys.includes('index.js') ? 'index.js' : fileKeys.includes('index.html') ? 'index.html' : fileKeys[0];
        }

        // Embed StackBlitz project in iframe
        const vm = await sdk.embedProject(containerRef.current, project, {
          height: '100%',
          width: '100%',
          theme: 'dark',
          openFile: openFileName,
          view: 'editor', // Hides the preview window!
          hideDevTools: false,
          terminalHeight: 40,
          crossOriginIsolated: true // Signals cross-origin isolation
        });

        vmRef.current = vm;
      } catch (err) {
        console.error('Failed to embed StackBlitz editor:', err);
        setError(`Failed to boot StackBlitz workspace: ${err.response?.data?.message || err.message || 'Unknown error'}`);
      } finally {
        setIdeLoading(false);
      }
    };

    loadStackBlitzWorkspace();
  }, [selectedProjectId]);

  // 3. Save workspace files back to MongoDB Atlas
  const handleSaveWorkspace = async () => {
    if (!vmRef.current) {
      setError('StackBlitz editor is not fully loaded yet. Please wait until it boots.');
      return;
    }
    if (!selectedProjectId) return;
    setSaving(true);
    setError('');
    try {
      // Retrieve the entire file tree snapshot from StackBlitz virtual disk
      const filesSnapshot = await vmRef.current.getFsSnapshot();
      const safeSnapshot = filesSnapshot || {};
      
      // Convert mapping to backend files array [{ path, content }]
      const filesArray = Object.keys(safeSnapshot).map((path) => ({
        path,
        content: safeSnapshot[path]
      }));

      await fileApi.syncFiles(selectedProjectId, filesArray);
    } catch (err) {
      console.error('Sync failed:', err);
      setError(`Failed to save project: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePushToGitHub = async () => {
    if (!vmRef.current) {
      setError('StackBlitz editor is not fully loaded yet. Please wait until it boots.');
      return;
    }
    if (!commitMessage) {
      setError('Please enter a commit message.');
      return;
    }
    if (!selectedProjectId) return;
    setPushing(true);
    setError('');
    try {
      const filesSnapshot = await vmRef.current.getFsSnapshot();
      const safeSnapshot = filesSnapshot || {};
      
      const filesArray = Object.keys(safeSnapshot).map((path) => ({
        path,
        content: safeSnapshot[path]
      }));

      await githubApi.pushToGitHub(selectedProjectId, commitMessage, filesArray);
      setShowCommitModal(false);
      setCommitMessage('');
      setSuccessMessage('Code committed and pushed to GitHub successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Push failed:', err);
      setError(`Push failed: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setPushing(false);
    }
  };

  const handleSyncFromMain = () => {
    if (!selectedProjectId) return;
    setShowSyncConfirmModal(true);
  };

  const executeSyncFromMain = async () => {
    if (!selectedProjectId) return;
    setShowSyncConfirmModal(false);
    setSyncing(true);
    setError('');
    setSuccessMessage('');
    try {
      await githubApi.syncFromMain(selectedProjectId);
      sessionStorage.setItem('codeforge_sync_success', 'true');
      window.location.reload();
    } catch (err) {
      console.error('Sync failed:', err);
      setError(`Sync failed: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmitPR = async () => {
    if (!prTitle.trim() || !selectedProjectId) return;
    setSubmittingPr(true);
    setError('');
    setSuccessMessage('');
    try {
      await githubApi.createPullRequest(selectedProjectId, prTitle.trim());
      setShowPrModal(false);
      setPrTitle('');
      setSuccessMessage('Pull Request created successfully on GitHub!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setShowPrModal(false);
      setPrTitle('');
      setError(err.response?.data?.message || 'Failed to submit Pull Request.');
    } finally {
      setSubmittingPr(false);
    }
  };

  return (
    <div className="fade-in" style={{
      height: 'calc(100vh - var(--navbar-height) - 4rem)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* IDE Top Control Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        backgroundColor: 'var(--bg-secondary)',
        padding: '0.6rem 1.25rem',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Workspace:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              localStorage.setItem('codeforge_selected_project_id', e.target.value);
              window.location.href = `/intern/ide?projectId=${e.target.value}`;
            }}
            disabled={fetchingProjects || ideLoading}
            className="form-input"
            style={{
              width: 'auto',
              minWidth: '220px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.825rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {fetchingProjects ? (
              <option>Loading workspaces...</option>
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

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {selectedProjectId && !ideLoading && (
            <>
              <button
                onClick={handleSaveWorkspace}
                disabled={saving || pushing}
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.825rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={() => setShowCommitModal(true)}
                disabled={saving || pushing}
                className="btn btn-primary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.825rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  background: 'var(--gradient-brand)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}
              >
                <GitCommit size={14} /> {pushing ? 'Pushing...' : 'Commit & Push'}
              </button>
              <button
                onClick={handleSyncFromMain}
                disabled={saving || pushing || syncing}
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.825rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <RefreshCw size={14} /> {syncing ? 'Syncing...' : 'Sync from Main'}
              </button>
              <button
                onClick={() => setShowPrModal(true)}
                disabled={saving || pushing || syncing || submittingPr}
                className="btn btn-primary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.825rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}
              >
                <GitPullRequest size={14} /> {submittingPr ? 'Submitting...' : 'Submit PR'}
              </button>
            </>
          )}
          {saving && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Saving draft...
            </span>
          )}
          {pushing && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Pushing tree to GitHub...
            </span>
          )}
          {syncing && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Syncing from main branch...
            </span>
          )}
          {submittingPr && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Submitting Pull Request...
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--color-danger)',
          color: 'var(--color-danger)',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.8rem'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid #10b981',
          color: '#10b981',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.8rem',
          fontWeight: 500
        }}>
          ✅ {successMessage}
        </div>
      )}

      {/* Main Sandbox Frame Viewport */}
      <div style={{
        flexGrow: 1,
        position: 'relative',
        borderRadius: 'var(--border-radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-md)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {ideLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            zIndex: 10
          }}>
            <Loader />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Booting StackBlitz VS Code editor container...
            </p>
          </div>
        )}
        
        {/* StackBlitz mount container */}
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%', 
            height: '100%',
            flexGrow: 1
          }} 
        />
      </div>

      {/* Commit message modal overlay */}
      {showCommitModal && (
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
          zIndex: 1000
        }}>
          <div className="card" style={{
            width: '450px',
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
              <span>🐙</span> Commit & Push to GitHub
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Specify a message describing the work done in this commit. This will push directly to your branch.
            </p>
            <div className="form-group" style={{ margin: 0 }}>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. feat: set up server routes"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                maxLength={100}
                required
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCommitModal(false);
                  setCommitMessage('');
                }}
                className="btn btn-secondary"
                disabled={pushing}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePushToGitHub}
                className="btn btn-primary"
                disabled={pushing || !commitMessage.trim()}
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#24292e',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {pushing ? 'Pushing...' : 'Push to Branch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit PR Modal */}
      {showPrModal && createPortal(
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
            width: '450px',
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
              <span>🚀</span> Submit Pull Request
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Enter a title for the pull request to merge your branch changes into the main project repository.
            </p>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Intern 1: Completed task setup"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowPrModal(false);
                  setPrTitle('');
                }}
                className="btn btn-secondary"
                disabled={submittingPr}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitPR}
                className="btn btn-primary"
                disabled={submittingPr || !prTitle.trim()}
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {submittingPr ? 'Submitting...' : 'Submit PR'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Sync Confirmation Modal */}
      {showSyncConfirmModal && createPortal(
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
            width: '420px',
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
              <span>🔄</span> Sync Workspace from Main
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              This will merge the latest <strong>main</strong> branch code into your workspace. Any unsaved drafts will be overwritten. Do you want to proceed?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowSyncConfirmModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSyncFromMain}
                className="btn btn-primary"
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Confirm Sync
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CloudIDEPage;
