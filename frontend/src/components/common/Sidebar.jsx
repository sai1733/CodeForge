import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FolderGit2, CheckSquare, FileText, Terminal, Code2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const getNavLinks = (role) => {
    switch (role) {
      case 'superadmin':
        return [
          { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/admin/users', label: 'Manage Users', icon: Users },
          { path: '/admin/projects', label: 'Manage Projects', icon: FolderGit2 },
        ];
      case 'manager':
        return [
          { path: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/manager/assign-task', label: 'Assign Task', icon: CheckSquare },
          { path: '/manager/review-reports', label: 'Review Reports', icon: FileText },
        ];
      case 'intern':
      default:
        return [
          { path: '/intern/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/intern/tasks', label: 'My Tasks', icon: CheckSquare },
          { path: '/intern/reports', label: 'My Reports', icon: FileText },
          { path: '/intern/ide', label: 'Cloud IDE', icon: Terminal },
        ];
    }
  };

  const navLinks = getNavLinks(user.role);

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 'var(--navbar-height)',
      bottom: 0,
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-light)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      zIndex: 999,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        fontFamily: 'monospace',
        paddingLeft: '0.75rem',
        marginBottom: '1.25rem'
      }}>
        NAVIGATION
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                color: isActive ? '#00f0ff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                border: isActive ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: isActive ? '0 0 10px rgba(0, 240, 255, 0.05)' : 'none',
                transition: 'all 0.2s ease'
              })}
              end={link.path.endsWith('/dashboard')}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
 
      <div style={{
        marginTop: 'auto',
        padding: '1.25rem 0.5rem 0 0.5rem',
        borderTop: '1px solid var(--border-light)',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
        color: 'var(--text-muted)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.35rem'
      }}>
        &lt;/&gt; CodeForge
      </div>
    </aside>
  );
};

export default Sidebar;
