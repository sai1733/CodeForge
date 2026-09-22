import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { TaskContext } from '../../context/TaskContext';
import useAuth from '../../hooks/useAuth';

const TaskCard = ({ task }) => {
  const { updateTaskStatus, loading } = useContext(TaskContext);
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Custom interactive workflow states
  const [submitDetails, setSubmitDetails] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [cardError, setCardError] = useState('');

  const isIntern = user?.role === 'intern';
  const isManager = user?.role === 'manager' || user?.role === 'superadmin';
  const isOverdue = task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Status pill style helper
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return {
          backgroundColor: 'rgba(22, 163, 74, 0.12)',
          color: 'var(--color-success)',
          border: '1px solid rgba(22, 163, 74, 0.25)',
        };
      case 'in-review':
        return {
          backgroundColor: 'rgba(168, 85, 247, 0.12)',
          color: 'var(--color-secondary)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
        };
      case 'in-progress':
        return {
          backgroundColor: 'rgba(2, 132, 199, 0.12)',
          color: 'var(--color-accent)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
        };
      case 'assigned':
      default:
        return {
          backgroundColor: 'rgba(234, 88, 12, 0.12)',
          color: 'var(--color-warning)',
          border: '1px solid rgba(234, 88, 12, 0.25)',
        };
    }
  };

  // Intern Actions
  const handleStartWork = async () => {
    setCardError('');
    const res = await updateTaskStatus(task._id, 'in-progress');
    if (!res.success) {
      setCardError(res.error);
    }
  };

  const handleSubmitForReview = async () => {
    setCardError('');
    if (!submitDetails.trim()) {
      setCardError('Please provide implementation details before requesting review.');
      return;
    }
    const res = await updateTaskStatus(task._id, {
      status: 'in-review',
      submissionDetails: submitDetails
    });
    if (res.success) {
      setIsModalOpen(false); // Close details popup on success
      setSubmitDetails('');
    } else {
      setCardError(res.error);
    }
  };

  // Manager Actions
  const handleApproveComplete = async () => {
    setCardError('');
    const res = await updateTaskStatus(task._id, { status: 'completed' });
    if (res.success) {
      setIsModalOpen(false);
    } else {
      setCardError(res.error);
    }
  };

  const handleRequestChanges = async () => {
    setCardError('');
    if (!feedbackText.trim()) {
      setCardError('Please provide revision feedback explaining why changes are requested.');
      return;
    }
    const res = await updateTaskStatus(task._id, {
      status: 'in-progress',
      feedback: feedbackText
    });
    if (res.success) {
      setIsModalOpen(false);
      setFeedbackText('');
    } else {
      setCardError(res.error);
    }
  };



  return (
    <>
      {/* Compact Interactive Task Card */}
      <div 
        className="card card-hover" 
        onClick={() => {
          setCardError('');
          setIsModalOpen(true);
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          position: 'relative',
          height: '150px',
          padding: '1.25rem',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Title & Status badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
          <h3 
            title={task.title}
            style={{ 
              fontSize: '1.05rem', 
              fontWeight: 600, 
              color: 'var(--text-primary)', 
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
              overflowWrap: 'break-word',
              wordBreak: 'break-word'
            }}
          >
            {task.title}
          </h3>
          <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              ...getStatusStyle(task.status)
            }}>
              {task.status}
            </span>
            {isOverdue && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                Overdue
              </span>
            )}
          </div>
        </div>

        {/* Project Badge */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span 
            title={task.projectId?.name || 'General'}
            style={{
              fontSize: '0.7rem',
              fontWeight: 500,
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              display: 'inline-block',
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              verticalAlign: 'middle'
            }}
          >
            📁 {task.projectId?.name || 'General'}
          </span>
        </div>

        {/* Card Footer Details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            📅 {formatDate(task.dueDate)}
          </span>
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--color-primary)',
            fontWeight: 600,
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: '0.15rem'
          }}>
            View Details →
          </span>
        </div>
      </div>

      {/* Glassmorphic Details Modal Overlay (Portaled to document.body) */}
      {isModalOpen && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999, // Render on top of sidebar and navbar
            padding: '2rem'
          }} 
          onClick={() => setIsModalOpen(false)}
        >
          {/* Modal Container */}
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh', // Limit maximum height to viewport space
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden', // Let body container handle internal scrolling
              animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed) */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              gap: '1.5rem',
              padding: '1.5rem 2rem 1.25rem 2rem',
              borderBottom: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  color: 'var(--color-primary)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  marginBottom: '0.5rem',
                  display: 'inline-block'
                }}>
                  📁 {task.projectId?.name || 'General'}
                </span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                  {task.title}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  ...getStatusStyle(task.status)
                }}>
                  {task.status}
                </span>
                {isOverdue && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.25)'
                  }}>
                    Overdue
                  </span>
                )}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '1.75rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                    padding: '0.2rem',
                    transition: 'color 0.15s ease'
                  }}
                  onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
                  onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable container) */}
            <div style={{
              padding: '1.5rem 2rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              flexGrow: 1
            }}>
              {/* Error Alert inside Modal */}
              {cardError && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  lineHeight: 1.4
                }}>
                  ⚠️ {cardError}
                </div>
              )}

              {/* Revision Feedback Banner */}
              {task.feedback && task.status === 'in-progress' && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderLeft: '4px solid var(--color-danger)',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: '0.25rem' }}>
                    🛑 REVISION REQUESTED BY MANAGER:
                  </strong>
                  <span style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                    {task.feedback}
                  </span>
                </div>
              )}

              {/* Description Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📝 Specification Details
                </h4>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}>
                  {task.description || 'No description provided for this spec.'}
                </div>
              </div>

              {/* Submission details display (for in-review or completed) */}
              {(task.status === 'in-review' || task.status === 'completed') && task.submissionDetails && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🚀 Intern Submission Details:
                  </h4>
                  <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '1rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.925rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word'
                  }}>
                    {task.submissionDetails}
                  </div>
                </div>
              )}

              {/* Meta details grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase' }}>ASSIGNED BY</span>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{task.assignedBy?.name || 'Unknown Manager'}</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{task.assignedBy?.email || ''}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase' }}>ASSIGNED TO</span>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{task.assignedTo?.name || 'Unknown Intern'}</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{task.assignedTo?.email || ''}</span>
                </div>
                
                <div style={{ 
                  gridColumn: 'span 2', 
                  borderTop: '1px solid var(--border-light)', 
                  paddingTop: '1rem', 
                  marginTop: '0.25rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <div>
                    <span style={{ color: isOverdue ? '#ef4444' : 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      DUE DATE {isOverdue && '(OVERDUE)'}
                    </span>
                    <strong style={{ color: isOverdue ? '#ef4444' : 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                      📅 {formatDate(task.dueDate)}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>CREATED ON</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate(task.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer (Fixed, Actions Panel) */}
            <div style={{
              borderTop: '1px solid var(--border-light)',
              padding: '1.25rem 2rem',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* 1. Intern Interface workflow actions */}
              {isIntern && (() => {
                if (task.status === 'assigned') {
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Ready to start working on this specification?
                      </span>
                      <button
                        onClick={handleStartWork}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 1.25rem', fontSize: '0.875rem', borderRadius: '6px' }}
                      >
                        {loading ? 'Processing...' : '▶ Start Work'}
                      </button>
                    </div>
                  );
                }

                if (task.status === 'in-progress') {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Request Manager Evaluation <span style={{ color: 'var(--color-danger)' }}>*</span>:
                        </span>
                        <span style={{ fontSize: '0.72rem', color: submitDetails.length > 900 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
                          {submitDetails.length} / 1000
                        </span>
                      </div>
                      <textarea
                        className="form-input"
                        rows="3"
                        placeholder="Detail your implementation, deliverables completed, or testing details..."
                        value={submitDetails}
                        onChange={(e) => setSubmitDetails(e.target.value)}
                        disabled={loading}
                        maxLength={1000}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleSubmitForReview}
                          disabled={loading || !submitDetails.trim()}
                          className="btn btn-primary"
                          style={{
                            padding: '0.5rem 1.25rem',
                            fontSize: '0.875rem',
                            borderRadius: '6px',
                            opacity: !submitDetails.trim() ? 0.5 : 1,
                            cursor: !submitDetails.trim() ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {loading ? 'Submitting...' : '🚀 Submit for Review'}
                        </button>
                      </div>
                    </div>
                  );
                }

                if (task.status === 'in-review') {
                  return (
                    <div style={{ textAlign: 'center', padding: '0.25rem 0', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>
                      🕒 Submitted! Awaiting manager review and approval.
                    </div>
                  );
                }

                if (task.status === 'completed') {
                  return (
                    <div style={{ textAlign: 'center', padding: '0.25rem 0', color: 'var(--color-success)', fontSize: '0.88rem', fontWeight: 600 }}>
                      ✓ Task approved & marked completed. Excellent job!
                    </div>
                  );
                }
              })()}

              {/* 2. Manager Interface workflow actions */}
              {isManager && (() => {
                if (task.status === 'in-review') {
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Manager Action & Feedback notes <span style={{ color: 'var(--color-danger)' }}>*</span> (Required if requesting changes):
                        </span>
                        <span style={{ fontSize: '0.72rem', color: feedbackText.length > 900 ? 'var(--color-warning)' : 'var(--text-muted)', fontWeight: 500 }}>
                          {feedbackText.length} / 1000
                        </span>
                      </div>
                      <textarea
                        className="form-input"
                        rows="3"
                        placeholder="e.g. Please verify migrations run successfully, or request specific refinements..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        disabled={loading}
                        maxLength={1000}
                        style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleRequestChanges}
                          disabled={loading || !feedbackText.trim()}
                          className="btn btn-secondary"
                          style={{
                            padding: '0.5rem 1.25rem',
                            fontSize: '0.875rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--color-danger)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            opacity: !feedbackText.trim() ? 0.5 : 1,
                            cursor: !feedbackText.trim() ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {loading ? 'Processing...' : '🛑 Request Changes'}
                        </button>
                        <button
                          onClick={handleApproveComplete}
                          disabled={loading}
                          className="btn btn-primary"
                          style={{
                            padding: '0.5rem 1.5rem',
                            fontSize: '0.875rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(22, 163, 74, 0.9)',
                            color: '#fff',
                            border: '1px solid rgba(22, 163, 74, 1)'
                          }}
                        >
                          {loading ? 'Approving...' : '✓ Approve & Complete'}
                        </button>
                      </div>
                    </div>
                  );
                }

                if (task.status === 'completed') {
                  return (
                    <div style={{ textAlign: 'center', padding: '0.25rem 0', color: 'var(--color-success)', fontSize: '0.88rem', fontWeight: 600 }}>
                      ✓ This task is completed.
                    </div>
                  );
                }

                // If task is still assigned or in-progress
                if (task.status === 'assigned') {
                  return (
                    <div style={{ textAlign: 'center', padding: '0.25rem 0', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>
                      ⏳ This task is assigned to intern.
                    </div>
                  );
                }
                return (
                  <div style={{ textAlign: 'center', padding: '0.25rem 0', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 500 }}>
                    ⏳ Intern is currently working on this task.
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TaskCard;
