import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import userApi from '../../api/userApi';
import axiosClient from '../../api/axiosClient';
import useAuth from '../../hooks/useAuth';
import inviteApi from '../../api/inviteApi';
import ConfirmModal from '../../components/common/ConfirmModal';

const ManageUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Create User form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('intern');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Include inactive filter toggle state (always true to show all accounts)
  const [includeInactive, setIncludeInactive] = useState(true);

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
      type,
      onConfirm: () => {
        action();
        setConfirmOpen(false);
      }
    });
    setConfirmOpen(true);
  };

  // Pagination and Search states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    totalUsers: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteProject, setInviteProject] = useState('');
  const [inviteRole, setInviteRole] = useState('intern');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteSuccess('');
    setInviteError('');
    try {
      await inviteApi.createInvite(inviteEmail, inviteProject || null, inviteRole);
      setInviteSuccess('Invitation link sent successfully!');
      setInviteEmail('');
      setInviteProject('');
      setInviteRole('intern');
    } catch (err) {
      console.error(err);
      setInviteError(err.response?.data?.message || 'Failed to send invitation.');
    } finally {
      setInviteLoading(false);
    }
  };

  const fetchUsersAndProjects = async (showInactive = includeInactive, currentPage = page, currentSearch = search) => {
    setLoading(true);
    setError('');
    try {
      const usersRes = await userApi.getUsers({ 
        includeInactive: showInactive ? 'true' : 'false',
        page: currentPage,
        limit,
        search: currentSearch
      });
      // The API returns { users, pagination } under data
      setUsers(usersRes.data.users || []);
      setPagination(usersRes.data.pagination || {
        totalUsers: 0,
        totalPages: 1,
        currentPage: 1,
        limit: 10
      });

      const projectsRes = await axiosClient.get('/api/projects');
      setProjects(projectsRes.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user list or active workspaces from server.');
    } finally {
      setLoading(false);
    }
  };

  // Single debounced effect for page, search, and includeInactive
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsersAndProjects(includeInactive, page, search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, search, includeInactive]);

  const handleToggleInactive = (e) => {
    const checked = e.target.checked;
    setIncludeInactive(checked);
    fetchUsersAndProjects(checked);
  };

  const triggerFormError = (msg) => {
    setError(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      triggerFormError('Full Name is required.');
      return;
    }
    if (!email.trim()) {
      triggerFormError('Email Address is required.');
      return;
    }
    if (!password) {
      triggerFormError('Temp Password is required.');
      return;
    }
    if (password.length < 6) {
      triggerFormError('Password must be at least 6 characters.');
      return;
    }
    if (!role) {
      triggerFormError('Assign Role is required.');
      return;
    }

    const roleDisplayName = role === 'superadmin' ? 'Admin' : role.charAt(0).toUpperCase() + role.slice(1);

    triggerConfirm(
      'Confirm Provisioning',
      `Are you sure you want to provision a new ${roleDisplayName} account for ${name} (${email})?`,
      'Provision User',
      'info',
      async () => {
        setActionLoading(true);
        try {
          const response = await axiosClient.post('/api/users', { name, email, password, role });
          setSuccessMsg(response.data.message || 'User account provisioned successfully!');
          setName('');
          setEmail('');
          setPassword('');
          setRole('intern');
          setPage(1);
          fetchUsersAndProjects(includeInactive, 1, search); // Refresh list on page 1
        } catch (err) {
          console.error(err);
          triggerFormError(err.response?.data?.message || 'Failed to create user account.');
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const handleDeactivateUser = (userId) => {
    triggerConfirm(
      'Confirm Deactivation',
      'Are you sure you want to deactivate this user account? Deactivated users will no longer be able to log in to the portal.',
      'Deactivate User',
      'danger',
      async () => {
        setError('');
        setSuccessMsg('');
        try {
          await axiosClient.delete(`/api/users/${userId}`);
          setSuccessMsg('User account deactivated successfully.');
          fetchUsersAndProjects(includeInactive, page, search); // Refresh list
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Failed to deactivate user account.');
        }
      }
    );
  };

  const handleReactivateUser = (userId) => {
    triggerConfirm(
      'Confirm Reactivation',
      'Are you sure you want to reactivate this user account? Reactivated users will be able to log in again.',
      'Reactivate User',
      'info',
      async () => {
        setError('');
        setSuccessMsg('');
        try {
          await axiosClient.patch(`/api/users/${userId}/reactivate`);
          setSuccessMsg('User account reactivated successfully.');
          fetchUsersAndProjects(includeInactive, page, search); // Refresh list
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Failed to reactivate user account.');
        }
      }
    );
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            User Provisioning Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Create, view, and offboard developer or manager accounts.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowInviteModal(true)}
          style={{ padding: '0.75rem 1.25rem' }}
        >
          📧 Invite Intern
        </button>
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

      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid var(--color-success)',
          color: 'var(--color-success)',
          padding: '0.75rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-3" style={{ gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Form: Create User (Compact to fit above-fold) */}
        <div style={{ gridColumn: 'span 1' }}>
          <div className="card" style={{ padding: '1.5rem 1.25rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.15rem' }}>
              Add New Account
            </h2>

            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Full Name</label>
                <input
                  className="form-input"
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }}
                  type="text"
                  placeholder="e.g. Alice Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={actionLoading}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Email Address</label>
                <input
                  className="form-input"
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }}
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={actionLoading}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label className="form-label" style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Temp Password</label>
                <input
                  className="form-input"
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }}
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={actionLoading}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.3rem', fontSize: '0.85rem' }}>Assign Role</label>
                <select
                  className="form-input"
                  style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem', backgroundColor: 'rgba(10, 14, 23, 0.6)' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={actionLoading}
                  required
                >
                  <option value="intern">Intern</option>
                  <option value="manager">Manager</option>
                  <option value="superadmin">Admin</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                style={{ width: '100%', padding: '0.65rem' }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Creating User...' : 'Provision User'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Table: List Users */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card" style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                System Registered Accounts
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: 'rgba(10, 14, 23, 0.4)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                width: '260px'
              }}>
                <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search name or email..."
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
            </div>

            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading account roster...</p>
            ) : users.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No registered users found.</p>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.925rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Name</th>
                      <th style={{ padding: '0.75rem' }}>Email</th>
                      <th style={{ padding: '0.75rem' }}>Role</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isAssigned = u.role !== 'intern' || projects.some((p) => 
                        p.internIds && p.internIds.some((intern) => intern._id === u._id)
                      );
                      const isDeactivated = u.isActive === false;

                      return (
                        <tr key={u._id} style={{ 
                          borderBottom: '1px solid var(--border-light)',
                          opacity: isDeactivated ? 0.5 : 1,
                          transition: 'opacity 0.2s ease'
                        }}>
                          <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                            {u.name}
                            {isDeactivated && (
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                marginLeft: '0.4rem',
                                padding: '0.05rem 0.25rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: 'var(--color-danger)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                textTransform: 'uppercase'
                              }}>
                                Inactive
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                          <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                              backgroundColor: u.role === 'superadmin' ? 'rgba(239, 68, 68, 0.15)' : u.role === 'manager' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                              color: u.role === 'superadmin' ? 'var(--color-danger)' : u.role === 'manager' ? 'var(--color-secondary)' : 'var(--color-accent)',
                              border: u.role === 'superadmin' ? '1px solid rgba(239, 68, 68, 0.3)' : u.role === 'manager' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                            }}>
                              {u.role === 'superadmin' ? 'admin' : u.role}
                            </span>
                            {u.role === 'intern' && !isAssigned && !isDeactivated && (
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                color: 'var(--color-danger)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                textTransform: 'uppercase'
                              }}>
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {u._id === currentUser?.id ? (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Active Self</span>
                            ) : isDeactivated ? (
                              <button
                                onClick={() => handleReactivateUser(u._id)}
                                className="btn"
                                style={{
                                  padding: '0.35rem 0.7rem',
                                  fontSize: '0.8rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  color: 'var(--color-success)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeactivateUser(u._id)}
                                className="btn"
                                style={{
                                  padding: '0.35rem 0.7rem',
                                  fontSize: '0.8rem',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  color: 'var(--color-danger)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                              >
                                Deactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '1.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-light)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Showing page <strong>{pagination.currentPage}</strong> of <strong>{pagination.totalPages || 1}</strong> (<strong>{pagination.totalUsers}</strong> accounts)
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      disabled={page <= 1}
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    >
                      ◀ Previous
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {showInviteModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div className="card fade-in" style={{ width: '450px', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => { setShowInviteModal(false); setInviteSuccess(''); setInviteError(''); }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              📧 Invite New User
            </h2>

            {inviteSuccess && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--color-success)',
                color: 'var(--color-success)',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem'
              }}>
                {inviteSuccess}
              </div>
            )}

            {inviteError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem'
              }}>
                {inviteError}
              </div>
            )}

            <form onSubmit={handleSendInvite}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="intern@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={inviteLoading}
                />
              </div>



              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  disabled={inviteLoading}
                  required
                >
                  <option value="intern">Intern</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
                disabled={inviteLoading}
              >
                {inviteLoading ? 'Sending invite...' : 'Send Invitation Link'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
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

export default ManageUsersPage;
