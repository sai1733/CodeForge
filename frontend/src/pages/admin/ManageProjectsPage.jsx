import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import userApi from '../../api/userApi';
import projectApi from '../../api/projectApi';
import axiosClient from '../../api/axiosClient';
import Loader from '../../components/common/Loader';
import ConfirmModal from '../../components/common/ConfirmModal';

const ManageProjectsPage = () => {
  // Lists & pagination state
  const [projectsList, setProjectsList] = useState([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [interns, setInterns] = useState([]);
  
  // Search & Pagination controls
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    totalProjects: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 5
  });

  // Form fields
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedInterns, setSelectedInterns] = useState([]);
  const [githubRepoName, setGithubRepoName] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  
  // Edit mode state
  const [editingProjectId, setEditingProjectId] = useState(null);

  // Confirmation Modal States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: () => {}
  });

  const triggerConfirm = (title, message, confirmText, type, action) => {
    setConfirmConfig({
      title,
      message,
      confirmText,
      cancelText: 'Cancel',
      type,
      onConfirm: () => {
        action();
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  const triggerAlert = (title, message) => {
    setConfirmConfig({
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      type: 'warning',
      onConfirm: () => setConfirmOpen(false)
    });
    setConfirmOpen(true);
  };

  // Status states
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // UI/UX improvements states
  const [managerSearch, setManagerSearch] = useState('');
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [internSearch, setInternSearch] = useState('');
  const [expandedCohortProjectIds, setExpandedCohortProjectIds] = useState({});
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
  const [activeCount, setActiveCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);

  const filteredManagers = managers.filter(m =>
    m.name.toLowerCase().includes(managerSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(managerSearch.toLowerCase())
  );

  const filteredInterns = interns.filter(i =>
    i.name.toLowerCase().includes(internSearch.toLowerCase()) ||
    i.email.toLowerCase().includes(internSearch.toLowerCase())
  );

  // Local fetch paginated projects function
  const fetchLocalProjects = async (currentTab = activeTab, currentPage = page, currentSearch = search) => {
    setProjectLoading(true);
    try {
      const res = await axiosClient.get('/api/projects', {
        params: {
          status: currentTab,
          page: currentPage,
          limit: 5,
          search: currentSearch
        }
      });
      // The API returns { projects, pagination } under data
      if (res.data.data && res.data.data.projects) {
        setProjectsList(res.data.data.projects);
        setPagination(res.data.data.pagination);
      } else {
        // Fallback for array response
        setProjectsList(res.data.data || []);
        setPagination({
          totalProjects: res.data.data?.length || 0,
          totalPages: 1,
          currentPage: 1,
          limit: 5
        });
      }

      // Parallelly fetch counts for active and archived to display on the tab buttons
      const [activeRes, archivedRes] = await Promise.all([
        axiosClient.get('/api/projects', { params: { status: 'active', limit: 1, search: currentSearch } }),
        axiosClient.get('/api/projects', { params: { status: 'archived', limit: 1, search: currentSearch } })
      ]);
      
      const aCount = activeRes.data.data?.pagination?.totalProjects ?? (Array.isArray(activeRes.data.data) ? activeRes.data.data.length : 0);
      const arcCount = archivedRes.data.data?.pagination?.totalProjects ?? (Array.isArray(archivedRes.data.data) ? archivedRes.data.data.length : 0);
      
      setActiveCount(aCount);
      setArchivedCount(arcCount);
    } catch (err) {
      console.error(err);
      setFormError('Failed to fetch workspaces from server.');
    } finally {
      setProjectLoading(false);
    }
  };

  // Debounced projects query effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLocalProjects(activeTab, page, search);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, page, search]);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setFetchingUsers(true);
      try {
        const managersRes = await userApi.getUsers({ role: 'manager' });
        const internsRes = await userApi.getUsers({ role: 'intern' });
        
        setManagers(managersRes.data);
        setInterns(internsRes.data);
        
        setSelectedManager('');
        setManagerSearch('');
      } catch (err) {
        console.error(err);
        setFormError('Failed to fetch manager/intern list for workspace allocation.');
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleCheckboxChange = (internId) => {
    setSelectedInterns((prev) =>
      prev.includes(internId) ? prev.filter((id) => id !== internId) : [...prev, internId]
    );
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setProjectName('');
    setDescription('');
    setSelectedInterns([]);
    setSelectedManager('');
    setManagerSearch('');
    setGithubRepoName('');
    setGithubRepoUrl('');
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!projectName.trim()) {
      const err = 'Project Name is compulsory.';
      setFormError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!description.trim()) {
      const err = 'Project Description is compulsory.';
      setFormError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!githubRepoName.trim()) {
      const err = 'GitHub Repository Name is compulsory.';
      setFormError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!githubRepoUrl.trim()) {
      const err = 'GitHub Repository URL is compulsory.';
      setFormError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!selectedManager) {
      const err = 'A Lead Manager must be assigned.';
      setFormError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (selectedInterns.length === 0) {
      const err = 'At least one Intern collaborator must be assigned.';
      setFormError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (editingProjectId) {
      // Edit mode: Call dedicated PATCH /api/projects/:id/assign endpoint
      try {
        await axiosClient.patch(`/api/projects/${editingProjectId}/assign`, {
          managerId: selectedManager,
          internIds: selectedInterns,
          githubRepoName,
          githubRepoUrl,
        });
        
        setFormSuccess('Project workspace allocations updated successfully!');
        handleCancelEdit();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchLocalProjects(activeTab, page, search); // Refresh current list page
      } catch (err) {
        console.error(err);
        setFormError(err.response?.data?.message || 'Failed to update project allocations.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Create mode

      const projectData = {
        name: projectName,
        description,
        managerId: selectedManager,
        internIds: selectedInterns,
        githubRepoName,
        githubRepoUrl,
      };

      try {
        await projectApi.createProject(projectData);
        setFormSuccess('Project workspace initialized and allocated successfully!');
        setProjectName('');
        setDescription('');
        setSelectedInterns([]);
        setSelectedManager('');
        setManagerSearch('');
        setGithubRepoName('');
        setGithubRepoUrl('');
        setPage(1); // Go back to first page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchLocalProjects(activeTab, 1, search);
      } catch (err) {
        console.error(err);
        setFormError(err.response?.data?.message || 'Failed to create project workspace.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleArchiveProject = (projectId) => {
    triggerConfirm(
      'Confirm Archival',
      'Are you sure you want to archive this project workspace? Once archived, the directory specifications and allocations will be locked.',
      'Archive Workspace',
      'danger',
      async () => {
        setFormError('');
        setFormSuccess('');
        try {
          await axiosClient.delete(`/api/projects/${projectId}`);
          setFormSuccess('Project workspace archived successfully.');
          fetchLocalProjects(activeTab, 1, search); // Refresh to page 1
        } catch (err) {
          console.error(err);
          setFormError(err.response?.data?.message || 'Failed to archive project workspace.');
        }
      }
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Workspace Management
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Initialize directories and link interns and supervisors.
        </p>
      </div>

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

      <div className="grid grid-cols-3" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Form: Create/Edit Project */}
        <div style={{ gridColumn: 'span 1' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              {editingProjectId ? 'Modify Allocations' : 'Initialize Workspace'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Project Name</label>
                  <span style={{ fontSize: '0.72rem', color: projectName.length > 40 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
                    {projectName.length} / 50
                  </span>
                </div>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. ChatApp Frontend"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={projectLoading || fetchingUsers || !!editingProjectId}
                  maxLength={50}
                  style={editingProjectId ? { cursor: 'not-allowed', opacity: 0.65 } : {}}
                  title={editingProjectId ? "Project Name cannot be changed after initialization" : ""}
                />
                {editingProjectId && (
                  <span style={{ fontSize: '0.78rem', color: '#ffb703', marginTop: '0.35rem', display: 'block', fontWeight: 500 }}>
                    ⚠️ Project Name cannot be changed after initialization.
                  </span>
                )}
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Project Description</label>
                  <span style={{ fontSize: '0.72rem', color: description.length > 450 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
                    {description.length} / 500
                  </span>
                </div>
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Describe project spec focus..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={projectLoading || fetchingUsers || !!editingProjectId}
                  style={{ resize: editingProjectId ? 'none' : 'vertical', cursor: editingProjectId ? 'not-allowed' : 'default', opacity: editingProjectId ? 0.65 : 1 }}
                  maxLength={500}
                  title={editingProjectId ? "Project Description cannot be changed after initialization" : ""}
                />
                {editingProjectId && (
                  <span style={{ fontSize: '0.78rem', color: '#ffb703', marginTop: '0.35rem', display: 'block', fontWeight: 500 }}>
                    ⚠️ Project Description cannot be changed after initialization.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">GitHub Repository Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. realcodeforge-netizen/Project1"
                  value={githubRepoName}
                  onChange={(e) => setGithubRepoName(e.target.value)}
                  disabled={projectLoading || fetchingUsers}
                />
              </div>

              <div className="form-group">
                <label className="form-label">GitHub Repository URL</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. https://github.com/realcodeforge-netizen/Project1"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  disabled={projectLoading || fetchingUsers}
                />
              </div>

              <div className="form-group" style={{ position: 'relative', zIndex: showManagerDropdown ? 100 : 1 }}>
                <label className="form-label" style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Lead Manager</label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  backgroundColor: 'rgba(10, 14, 23, 0.4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  width: '100%'
                }}>
                  <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Search manager..."
                    value={managerSearch}
                    onChange={(e) => {
                      setManagerSearch(e.target.value);
                      setShowManagerDropdown(true);
                    }}
                    onFocus={() => setShowManagerDropdown(true)}
                    disabled={projectLoading || fetchingUsers}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      width: '100%',
                      padding: 0
                    }}
                  />
                </div>
                {showManagerDropdown && (
                  <>
                    {/* Backdrop to close dropdown on click outside */}
                    <div 
                      onClick={() => {
                        const selected = managers.find(m => m._id === selectedManager);
                        setManagerSearch(selected ? selected.name : '');
                        setShowManagerDropdown(false);
                      }}
                      style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 90 }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--border-radius-sm)',
                      boxShadow: 'var(--shadow-md)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 100,
                      marginTop: '0.25rem'
                    }}>
                      {fetchingUsers ? (
                        <p style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Loading managers...</p>
                      ) : filteredManagers.length === 0 ? (
                        <p style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No matching managers</p>
                      ) : (
                        filteredManagers.map((m) => (
                          <div
                            key={m._id}
                            onClick={() => {
                              setSelectedManager(m._id);
                              setManagerSearch(m.name);
                              setShowManagerDropdown(false);
                            }}
                            style={{
                              padding: '0.6rem 0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-light)',
                              fontSize: '0.875rem',
                              backgroundColor: selectedManager === m._id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                              color: selectedManager === m._id ? 'var(--color-primary)' : 'var(--text-primary)',
                              transition: 'background-color 0.15s ease',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = 'var(--bg-secondary)'; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = selectedManager === m._id ? 'rgba(59, 130, 246, 0.08)' : 'transparent'; }}
                          >
                            <strong>{m.name}</strong> ({m.email})
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                   <label className="form-label" style={{ margin: 0 }}>Intern Collaborators</label>
                  <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.7rem' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedInterns(prev => Array.from(new Set([...prev, ...filteredInterns.map(i => i._id)])))}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontWeight: 500, fontSize: '0.7rem' }}
                    >
                      Select All
                    </button>
                    <span style={{ color: 'var(--text-muted)' }}>|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedInterns([])}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, fontWeight: 500, fontSize: '0.7rem' }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.6rem',
                  backgroundColor: 'rgba(10, 14, 23, 0.4)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  marginBottom: '0.5rem'
                }}>
                  <Search size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Filter interns by name or email..."
                    value={internSearch}
                    onChange={(e) => setInternSearch(e.target.value)}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      width: '100%',
                      padding: 0
                    }}
                  />
                </div>

                <div style={{
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '0.5rem',
                  backgroundColor: 'var(--bg-secondary)'
                }}>
                  {fetchingUsers ? (
                     <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Loading interns...</p>
                  ) : filteredInterns.length === 0 ? (
                     <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No matching interns</p>
                  ) : (
                    filteredInterns.map((i) => (
                      <div key={i._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.35rem 0' }}>
                        <input
                          type="checkbox"
                          id={i._id}
                          checked={selectedInterns.includes(i._id)}
                          onChange={() => handleCheckboxChange(i._id)}
                          disabled={projectLoading}
                          style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor={i._id} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 500 }}>{i.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{i.email}</span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {editingProjectId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.75rem' }}
                    disabled={projectLoading}
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  type="submit"
                  style={{ flex: 2, padding: '0.75rem' }}
                  disabled={projectLoading || managers.length === 0}
                >
                  {projectLoading ? 'Saving...' : editingProjectId ? 'Save Updates' : 'Launch Project'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right List: Active/Archived Projects */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border-light)',
              paddingBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                  {activeTab === 'active' ? 'Active Workspaces' : 'Archived Workspaces'}
                </h2>
              </div>
              
              {/* Search Bar Input */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: 'rgba(10, 14, 23, 0.4)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '380px'
              }}>
                <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search workspaces by name or specifications..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    width: '100%',
                    padding: 0
                  }}
                />
              </div>

              {/* Premium Tabs Switching buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('active');
                    setPage(1);
                  }}
                  className="btn"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: activeTab === 'active' ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                    color: activeTab === 'active' ? 'var(--color-primary)' : 'var(--text-muted)',
                    border: '1px solid ' + (activeTab === 'active' ? 'rgba(79, 70, 229, 0.2)' : 'transparent'),
                    fontWeight: 600
                  }}
                >
                  Active ({activeCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('archived');
                    setPage(1);
                  }}
                  className="btn"
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: activeTab === 'archived' ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                    color: activeTab === 'archived' ? 'var(--color-primary)' : 'var(--text-muted)',
                    border: '1px solid ' + (activeTab === 'archived' ? 'rgba(79, 70, 229, 0.2)' : 'transparent'),
                    fontWeight: 600
                  }}
                >
                  Archived ({archivedCount})
                </button>
              </div>
            </div>

            {(() => {
              const displayedProjects = projectsList;

              if (projectLoading && projectsList.length === 0) {
                return <p style={{ color: 'var(--text-secondary)' }}>Loading workspaces...</p>;
              }

              if (displayedProjects.length === 0) {
                return (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                    {activeTab === 'active'
                      ? 'No active project workspaces initialized yet.'
                      : 'No archived project workspaces found.'}
                  </p>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {displayedProjects.map((p) => {
                    const isArchived = p.status === 'archived';

                    return (
                      <div key={p._id} className="card" style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        opacity: isArchived ? 0.6 : 1,
                        transition: 'opacity 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                            {p.name}
                            {isArchived && (
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                marginLeft: '0.5rem',
                                padding: '0.05rem 0.25rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: 'var(--color-danger)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                textTransform: 'uppercase'
                              }}>
                                Archived
                              </span>
                            )}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Initialized: {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                            {!isArchived && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingProjectId(p._id);
                                    setProjectName(p.name);
                                    setDescription(p.description);
                                    setSelectedManager(p.managerId?._id || '');
                                    setManagerSearch(p.managerId?.name || '');
                                    setSelectedInterns(p.internIds?.map((i) => i._id) || []);
                                    setGithubRepoName(p.githubRepoName || '');
                                    setGithubRepoUrl(p.githubRepoUrl || '');
                                    setFormError('');
                                    setFormSuccess('');
                                  }}
                                  className="btn"
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--color-primary)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)'
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleArchiveProject(p._id)}
                                  className="btn"
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--color-danger)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                  }}
                                >
                                  Archive
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          {p.description}
                        </p>

                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1.5rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          borderTop: '1px solid var(--border-light)',
                          paddingTop: '0.75rem',
                          marginTop: '0.25rem'
                        }}>
                          <div>
                            Manager: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{p.managerId?.name || 'Unassigned'}</span>
                          </div>
                          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>
                              Intern Cohort ({p.internIds?.length || 0}):
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {!p.internIds || p.internIds.length === 0 ? (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>None assigned</span>
                              ) : (
                                (() => {
                                  const isExpanded = !!expandedCohortProjectIds[p._id];
                                  const displayedInterns = isExpanded ? p.internIds : p.internIds.slice(0, 5);
                                  const hasMore = p.internIds.length > 5;

                                  return (
                                    <>
                                      {displayedInterns.map((intern) => (
                                        <span
                                          key={intern._id}
                                          style={{
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '12px',
                                            fontSize: '0.725rem',
                                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                                            color: 'var(--color-primary)',
                                            border: '1px solid rgba(59, 130, 246, 0.15)',
                                            display: 'inline-flex',
                                            alignItems: 'center'
                                          }}
                                        >
                                          👤 {intern.name}
                                        </span>
                                      ))}
                                      {hasMore && (
                                        <button
                                          type="button"
                                          onClick={() => setExpandedCohortProjectIds(prev => ({ ...prev, [p._id]: !prev[p._id] }))}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-primary)',
                                            cursor: 'pointer',
                                            fontSize: '0.725rem',
                                            fontWeight: 600,
                                            padding: '0.15rem 0.25rem',
                                            marginLeft: '0.25rem'
                                          }}
                                        >
                                          {isExpanded ? 'Show Less' : `+ ${p.internIds.length - 5} more`}
                                        </button>
                                      )}
                                    </>
                                  );
                                })()
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Controls */}
                  {pagination.totalPages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '1rem',
                      marginTop: '0.5rem',
                      fontSize: '0.85rem'
                    }}>
                      <button
                        type="button"
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="btn"
                        style={{
                          padding: '0.35rem 0.8rem',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: page === 1 ? 'not-allowed' : 'pointer'
                        }}
                      >
                        ← Previous
                      </button>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                        disabled={page === pagination.totalPages}
                        className="btn"
                        style={{
                          padding: '0.35rem 0.8rem',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: page === pagination.totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

      </div>
      {confirmOpen && (
        <ConfirmModal
          isOpen={confirmOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          type={confirmConfig.type}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

export default ManageProjectsPage;
