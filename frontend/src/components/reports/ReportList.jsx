import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useAuth from '../../hooks/useAuth';
import reportApi from '../../api/reportApi';

const ReportList = ({ reports, loading, onReportReviewed, onEditReport }) => {
  const { user } = useAuth();
  const [reviewLoading, setReviewLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, reviewed
  const [selectedReport, setSelectedReport] = useState(null);

  // New review control states
  const [feedback, setFeedback] = useState('');
  const [hoursApproved, setHoursApproved] = useState(true);
  const [approvedHoursValue, setApprovedHoursValue] = useState('');
  const [activeReportId, setActiveReportId] = useState(null);
  const [validationError, setValidationError] = useState('');

  const isManager = user?.role === 'manager' || user?.role === 'superadmin';
  const modalBodyRef = React.useRef(null);

  if (selectedReport && selectedReport._id !== activeReportId) {
    setActiveReportId(selectedReport._id);
    setFeedback(selectedReport.feedback || '');
    setHoursApproved(selectedReport.hoursApproved !== false);
    setApprovedHoursValue(selectedReport.approvedHours?.toString() || selectedReport.hoursWorked?.toString() || '');
    setValidationError('');
  }

  // Clear validation errors when inputs change
  useEffect(() => {
    setValidationError('');
  }, [feedback, hoursApproved]);

  const triggerValidationError = (msg) => {
    setValidationError(msg);
    setTimeout(() => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTo({
          top: modalBodyRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 60);
  };

  const handleReview = async (reportId, statusType = 'approved') => {
    setValidationError('');
    if (statusType === 'needs_revision' && !feedback.trim()) {
      triggerValidationError('Please provide revision notes explaining what needs to be changed.');
      return;
    }

    if (statusType === 'approved' && !hoursApproved) {
      triggerValidationError('You must approve the logged hours to mark this report as approved/reviewed.');
      return;
    }

    setReviewLoading(true);
    try {
      const reviewPayload = {
        status: statusType,
        feedback: feedback.trim(),
        hoursApproved: statusType === 'approved' ? hoursApproved : false,
        approvedHours: statusType === 'approved' ? selectedReport.hoursWorked : 0,
      };

      await reportApi.reviewReport(reportId, reviewPayload);
      if (onReportReviewed) {
        onReportReviewed();
      }
      setSelectedReport(null); // Close modal on success
      setActiveReportId(null);
    } catch (err) {
      console.error(err);
      triggerValidationError(err.response?.data?.message || 'Failed to review report');
    } finally {
      setReviewLoading(false);
    }
  };

  // Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'approved':
      case 'reviewed':
        return {
          backgroundColor: 'rgba(22, 163, 74, 0.12)',
          color: 'var(--color-success)',
          border: '1px solid rgba(22, 163, 74, 0.25)',
        };
      case 'needs_revision':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          color: 'var(--color-danger)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
        };
      case 'pending':
      default:
        return {
          backgroundColor: 'rgba(234, 88, 12, 0.12)',
          color: 'var(--color-warning)',
          border: '1px solid rgba(234, 88, 12, 0.25)',
        };
    }
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    if (filter === 'pending') return report.status === 'pending';
    if (filter === 'needs_revision') return report.status === 'needs_revision';
    if (filter === 'reviewed') return report.status === 'reviewed' || report.status === 'approved';
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
        <h3>Loading reports list...</h3>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        borderBottom: '1px solid var(--border-light)',
        paddingBottom: '0.75rem'
      }}>
        {['all', 'pending', 'needs_revision', 'reviewed'].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className="btn"
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.85rem',
              borderRadius: '6px',
              textTransform: 'capitalize',
              backgroundColor: filter === item ? 'var(--bg-accent)' : 'transparent',
              color: filter === item ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: filter === item ? '1px solid var(--border-medium)' : '1px solid transparent',
            }}
          >
            {item.replace('_', ' ')} ({reports.filter((r) => 
              item === 'all' || 
              (item === 'reviewed' ? (r.status === 'reviewed' || r.status === 'approved') : r.status === item)
            ).length})
          </button>
        ))}
      </div>

      {/* Reports Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredReports.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No daily reports match this filter.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            /* Compact Interactive Report Card */
            <div 
              key={report._id} 
              className="card card-hover" 
              onClick={() => setSelectedReport(report)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {/* Header: User Info, Project Name & Hours/Status */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', margin: 0 }}>
                    {report.user?.name || 'Unknown Intern'}
                    <span 
                      title={report.projectId?.name || 'General'}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        color: 'var(--color-primary)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        display: 'inline-block',
                        maxWidth: '220px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        verticalAlign: 'middle'
                      }}
                    >
                      📁 {report.projectId?.name || 'General'}
                    </span>
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                    Submitted on: {formatDate(report.createdAt)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-light)',
                    whiteSpace: 'nowrap'
                  }}>
                    ⏱️ {report.hoursWorked} hrs
                  </span>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    ...getStatusStyles(report.status)
                  }}>
                    {report.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Card Footer actions hint */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                borderTop: '1px solid var(--border-light)', 
                paddingTop: '0.6rem', 
                marginTop: '0.25rem' 
              }}>
                <span style={{
                  fontSize: '0.72rem',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  opacity: 0.9
                }}>
                  View Specs & Details →
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Glassmorphic Report Details Modal Overlay (Portaled to document.body) */}
      {selectedReport && createPortal(
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
            zIndex: 99999, // Cover sidebar and navbar
            padding: '2rem'
          }} 
          onClick={() => setSelectedReport(null)}
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
              overflow: 'hidden', // Let body container scroll
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
                  📁 {selectedReport.projectId?.name || 'General'}
                </span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                  Daily Spec Report: {selectedReport.user?.name || 'Intern'}
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
                  ...getStatusStyles(selectedReport.status)
                }}>
                  {selectedReport.status?.replace('_', ' ')}
                </span>
                <button 
                  onClick={() => setSelectedReport(null)}
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
            <div 
              ref={modalBodyRef}
              style={{
                padding: '1.5rem 2rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                flexGrow: 1
              }}>
              
              {/* Work Accomplished */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🎯 Work Accomplished:
                </h4>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}>
                  {selectedReport.workDone}
                </div>
              </div>

              {/* Hurdles Encountered */}
              {selectedReport.challenges && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-warning)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ⚠️ Hurdles Encountered:
                  </h4>
                  <div style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    padding: '1rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.95rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word'
                  }}>
                    {selectedReport.challenges}
                  </div>
                </div>
              )}

              {/* Plan for Tomorrow */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📅 Plan for Tomorrow:
                </h4>
                <div style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}>
                  {selectedReport.tomorrowPlan}
                </div>
              </div>

              {/* Summary Stats Card */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.25rem',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem', textTransform: 'uppercase' }}>INTERN DETAILS</span>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedReport.user?.name || 'Unknown Intern'}</strong>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedReport.user?.email || ''}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem', textTransform: 'uppercase' }}>HOURS INVESTED</span>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>⏱️ {selectedReport.hoursWorked} Hours</strong>
                </div>
                
                <div style={{ 
                  gridColumn: 'span 2', 
                  borderTop: '1px solid var(--border-light)', 
                  paddingTop: '0.75rem', 
                  marginTop: '0.25rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>SUBMISSION DATE</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate(selectedReport.createdAt)}</span>
                  </div>
                  {(selectedReport.status === 'reviewed' || selectedReport.status === 'approved') && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>REVIEWED DATE</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate(selectedReport.reviewedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedReport.feedback && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    💬 Manager Feedback:
                  </h4>
                  <div style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.04)',
                    padding: '0.9rem 1.15rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    fontSize: '0.92rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                    fontStyle: 'italic'
                  }}>
                    "{selectedReport.feedback}"
                  </div>
                </div>
              )}

              {isManager && selectedReport.status === 'pending' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: '1px solid var(--border-light)',
                  paddingTop: '1.25rem',
                  marginTop: '0.5rem'
                }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Evaluation Controls
                  </h4>
                  
                  {/* Feedback Textarea */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Leave Feedback / Revision Notes <span style={{ color: 'var(--color-danger)' }}>* (Mandatory for requesting revision)</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Write comments, advice, or revision instructions..."
                      style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', resize: 'vertical' }}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>

                  {/* Hours Validation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        id="hoursApprovedCheck"
                        checked={hoursApproved}
                        onChange={(e) => setHoursApproved(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="hoursApprovedCheck" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        Approve hours logged (⏱️ {selectedReport.hoursWorked} Hours) <span style={{ color: 'var(--color-danger)' }}>* (Compulsory for approval)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {validationError && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid var(--color-danger)',
                  color: 'var(--color-danger)',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.75rem'
                }}>
                  <span>⚠️</span>
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed, Review Actions / Status Details) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-light)',
              padding: '1.25rem 2rem',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.9rem'
            }}>
              {selectedReport.status === 'reviewed' || selectedReport.status === 'approved' ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Approved by <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedReport.reviewedBy?.name || 'Manager'}</span>
                  {selectedReport.hoursApproved && (
                    <span style={{ color: 'var(--color-success)', fontWeight: 600, marginLeft: '0.5rem' }}>
                      (⏱️ {selectedReport.approvedHours || selectedReport.hoursWorked} Hours Confirmed)
                    </span>
                  )}
                </div>
              ) : isManager ? (
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleReview(selectedReport._id, 'needs_revision')}
                    disabled={reviewLoading}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      borderColor: 'var(--color-warning)',
                      color: 'var(--color-warning)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    {reviewLoading ? 'Processing...' : '⚠️ Request Revision'}
                  </button>
                  <button
                    onClick={() => handleReview(selectedReport._id, 'approved')}
                    disabled={reviewLoading}
                    className="btn btn-primary"
                    style={{
                      padding: '0.45rem 1.25rem',
                      fontSize: '0.85rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--color-success)',
                      borderColor: 'var(--color-success)'
                    }}
                  >
                    {reviewLoading ? 'Processing...' : '✓ Approve & Complete'}
                  </button>
                </div>
              ) : selectedReport.status === 'needs_revision' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>⚠️ Revision Requested</span>
                  {onEditReport && (
                    <button
                      onClick={() => {
                        onEditReport(selectedReport);
                        setSelectedReport(null);
                      }}
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 1.25rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-primary)'
                      }}
                    >
                      ✏️ Edit & Re-submit Report
                    </button>
                  )}
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Awaiting review from manager.</span>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ReportList;
