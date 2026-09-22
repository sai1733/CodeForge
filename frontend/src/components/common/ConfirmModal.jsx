import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirmation Required',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger', 'info', 'warning'
}) => {
  if (!isOpen) return null;

  const getThemeColors = () => {
    switch (type) {
      case 'info':
        return {
          icon: <HelpCircle size={22} color="#00f0ff" />,
          border: '1px solid rgba(0, 240, 255, 0.25)',
          glow: '0 0 15px rgba(0, 240, 255, 0.1)',
          btnBg: 'linear-gradient(135deg, #3b82f6 0%, #00f0ff 100%)',
          btnShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={22} color="#f59e0b" />,
          border: '1px solid rgba(245, 158, 11, 0.25)',
          glow: '0 0 15px rgba(245, 158, 11, 0.1)',
          btnBg: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
          btnShadow: '0 0 10px rgba(245, 158, 11, 0.2)'
        };
      case 'danger':
      default:
        return {
          icon: <AlertTriangle size={22} color="#ef4444" />,
          border: '1px solid rgba(239, 68, 68, 0.25)',
          glow: '0 0 15px rgba(239, 68, 68, 0.1)',
          btnBg: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          btnShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
        };
    }
  };

  const theme = getThemeColors();

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      animation: 'fadeIn 0.2s ease forwards'
    }}>
      <div 
        className="card"
        style={{
          width: '90%',
          maxWidth: '420px',
          padding: '1.75rem',
          backgroundColor: 'rgba(12, 17, 28, 0.95)',
          border: theme.border,
          boxShadow: `0 15px 40px rgba(0, 0, 0, 0.6), ${theme.glow}`,
          borderRadius: '12px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          animation: 'zoomIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={16} />
        </button>

        {/* Header Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
          {theme.icon}
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            {title}
          </h3>
        </div>

        {/* Message */}
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.925rem',
          lineHeight: 1.55,
          margin: 0
        }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          marginTop: '0.5rem'
        }}>
          {cancelText && onCancel && (
            <button
              onClick={onCancel}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                fontWeight: 500
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            >
              {cancelText}
            </button>
          )}
          
          <button
            onClick={onConfirm}
            className="btn"
            style={{
              padding: '0.5rem 1.2rem',
              fontSize: '0.875rem',
              borderRadius: '6px',
              background: theme.btnBg,
              border: 'none',
              color: '#ffffff',
              fontWeight: 600,
              boxShadow: theme.btnShadow,
              transition: 'transform 0.15s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
