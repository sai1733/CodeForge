import React, { useContext, useState, useEffect, useRef } from 'react';
import { Bell, LogOut, Code2, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { NotificationContext } from '../../context/NotificationContext';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const { user, logoutUser, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearNotification } = useContext(NotificationContext);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };

    if (showNotifDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifDropdown]);

  if (!isAuthenticated || !user) return null;

  const getRoleStyle = (role) => {
    switch (role) {
      case 'superadmin':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--color-danger)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        };
      case 'manager':
        return {
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          color: 'var(--color-secondary)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        };
      case 'intern':
      default:
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          color: 'var(--color-accent)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        };
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'superadmin') return 'Admin';
    if (role === 'manager') return 'Manager';
    return 'Intern';
  };

  const getInitials = (name) => {
    if (!name) return 'CF';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--navbar-height)',
      backgroundColor: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-blur)',
      borderBottom: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 1000,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src={logo} alt="CodeForge Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
        <span style={{
          fontWeight: 700,
          fontSize: '1.25rem',
          letterSpacing: '-0.03em',
          background: 'linear-gradient(to right, #ffffff, #9ca3af)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          CodeForge
        </span>
      </div>

      {/* User Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
        
        {/* Notification Bell */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            style={{
              background: 'none',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: 'var(--color-danger)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                padding: '0.1rem 0.3rem',
                borderRadius: '10px',
                lineHeight: 1
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {showNotifDropdown && (
            <div style={{
              position: 'absolute',
              top: '2.75rem',
              right: 0,
              width: '320px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '350px',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 500,
                      textDecoration: 'underline'
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: n.read ? 400 : 600, color: 'var(--text-primary)' }}>
                          {n.message}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button 
                        onClick={() => clearNotification(n.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#ffffff'
          }}>
            {getInitials(user.name)}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
              {user.name}
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              marginTop: '0.15rem',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(217, 70, 239, 0.15)',
              color: '#d946ef',
              border: '1px solid rgba(217, 70, 239, 0.3)'
            }}>
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={logoutUser}
          className="btn"
          style={{
            padding: '0.45rem 1rem',
            fontSize: '0.85rem',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #d946ef 0%, #3b82f6 100%)',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 0 10px rgba(217, 70, 239, 0.25)',
            transition: 'transform 0.15s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
