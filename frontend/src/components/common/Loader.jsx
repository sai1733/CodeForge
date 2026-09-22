import React from 'react';

const Loader = ({ fullPage = false, size = 'md' }) => {
  const spinnerClass = size === 'sm' ? 'spinner spinner-sm' : 'spinner';

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        gap: '1rem'
      }}>
        <div className={spinnerClass}></div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
          Synchronizing Workspace...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className={spinnerClass}></div>
    </div>
  );
};

export default Loader;
