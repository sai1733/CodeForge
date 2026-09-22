import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import fileApi from '../../api/fileApi';

const MonacoEditor = ({ file, theme, onFileSaved }) => {
  const [editorContent, setEditorContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, typing, saving, error
  const saveTimeoutRef = useRef(null);
  const fileIdRef = useRef(null);

  // Sync content when file selection changes
  useEffect(() => {
    if (file) {
      // Clear any pending auto-saves for the previous file
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      setEditorContent(file.content || '');
      setSaveStatus('saved');
      fileIdRef.current = file._id;
    }
  }, [file]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const getLanguage = (fileName) => {
    if (!fileName) return 'plaintext';
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  const handleEditorChange = (value) => {
    setEditorContent(value || '');
    setSaveStatus('typing');

    // Debounced Auto-Save to MongoDB Atlas (1.5 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const activeFileId = fileIdRef.current;
      if (!activeFileId) return;

      setSaveStatus('saving');
      try {
        await fileApi.updateFile(activeFileId, value || '');
        setSaveStatus('saved');
        if (onFileSaved) {
          onFileSaved(activeFileId, value || '');
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
        setSaveStatus('error');
      }
    }, 1500);
  };

  if (!file) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-muted)',
        gap: '0.75rem'
      }}>
        <span style={{ fontSize: '3rem' }}>💻</span>
        <h3>No File Selected</h3>
        <p style={{ fontSize: '0.9rem' }}>Open a file from the explorer sidebar to begin coding.</p>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* Editor Status Bar */}
      <div style={{
        height: '32px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          Language: <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{getLanguage(file.fileName).toUpperCase()}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {saveStatus === 'saved' && (
            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              ● Saved to MongoDB
            </span>
          )}
          {saveStatus === 'typing' && (
            <span style={{ color: 'var(--color-warning)' }}>
              ✍️ Unsaved Changes
            </span>
          )}
          {saveStatus === 'saving' && (
            <span style={{ color: 'var(--color-accent)', animation: 'pulse 1s infinite' }}>
              ⚡ Saving to database...
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: 'var(--color-danger)' }}>
              ⚠️ Save Failed!
            </span>
          )}
        </div>
      </div>

      {/* Embedded Monaco Editor Container */}
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <Editor
          height="100%"
          language={getLanguage(file.fileName)}
          theme={theme}
          value={editorContent}
          onChange={handleEditorChange}
          options={{
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
            minimap: { enabled: true },
            automaticLayout: true,
            padding: { top: 12 },
            lineHeight: 20,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on'
          }}
          loading={
            <div style={{
              position: 'absolute',
              top: 0, right: 0, bottom: 0, left: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)'
            }}>
              Loading Monaco Editor compiler...
            </div>
          }
        />
      </div>
    </div>
  );
};

export default MonacoEditor;
