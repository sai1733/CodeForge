import React from 'react';

const FileTabs = ({ openFiles, activeFileId, onTabSelect, onTabClose }) => {
  if (!openFiles || openFiles.length === 0) {
    return (
      <div style={{
        height: '42px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        fontStyle: 'italic'
      }}>
        No files open. Select a file from the explorer to begin.
      </div>
    );
  }

  return (
    <div style={{
      height: '42px',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'flex-end',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      padding: '0 0.5rem',
      gap: '2px'
    }}>
      {openFiles.map((file) => {
        const isActive = file._id === activeFileId;
        return (
          <div
            key={file._id}
            style={{
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0 0.8rem',
              fontSize: '0.85rem',
              fontWeight: isActive ? 600 : 400,
              backgroundColor: isActive ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              border: '1px solid var(--border-light)',
              borderBottom: isActive ? '1px solid var(--bg-primary)' : '1px solid var(--border-light)',
              cursor: 'pointer',
              position: 'relative',
              zIndex: isActive ? 2 : 1,
              transition: 'all var(--transition-fast)'
            }}
            onClick={() => onTabSelect(file._id)}
          >
            {/* File Icon based on extension */}
            <span style={{ fontSize: '0.9rem' }}>
              {file.fileName.endsWith('.js') || file.fileName.endsWith('.jsx') ? '🟨' : file.fileName.endsWith('.html') ? '🟧' : file.fileName.endsWith('.css') ? '🟦' : '📄'}
            </span>
            
            <span>{file.fileName}</span>
            
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(file._id);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
                borderRadius: '50%',
                marginLeft: '0.25rem'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-danger)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              title="Close Tab"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FileTabs;
