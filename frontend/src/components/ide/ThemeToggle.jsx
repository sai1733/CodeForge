import React from 'react';

const ThemeToggle = ({ theme, onThemeChange }) => {
  const toggleTheme = () => {
    onThemeChange(theme === 'vs-dark' ? 'light' : 'vs-dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-secondary"
      style={{
        padding: '0.4rem 0.8rem',
        fontSize: '0.825rem',
        borderRadius: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        border: '1px solid var(--border-medium)',
        backgroundColor: 'var(--bg-accent)',
        color: 'var(--text-primary)'
      }}
      title="Toggle Monaco Theme"
    >
      <span>{theme === 'vs-dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
    </button>
  );
};

export default ThemeToggle;
