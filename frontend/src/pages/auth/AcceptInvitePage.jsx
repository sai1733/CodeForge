import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import inviteApi from '../../api/inviteApi';

const AcceptInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await inviteApi.verifyInvite(token);
        setInviteData(response.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Invalid or expired invitation link.');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await inviteApi.completeInvite(token, name, password);
      setSuccess('Account set up successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registration complete. Please sign in.' } });
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh' }}>
        <div className="card text-center" style={{ width: '450px', padding: '2rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Verifying invitation token...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh' }}>
      <div className="card fade-in" style={{ width: '450px', padding: '2.5rem 2rem' }}>
        <h2 style={{ 
          marginBottom: '0.5rem', 
          background: 'var(--gradient-brand)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          fontSize: '2rem',
          textAlign: 'center'
        }}>
          Accept Invitation
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.95rem' }}>
          Complete your profile to join CodeForge
        </p>

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

        {success && (
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid var(--color-success)', 
            color: 'var(--color-success)',
            padding: '0.75rem',
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}

        {!inviteData ? (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to="/login" className="btn btn-secondary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input 
                className="form-input" 
                type="email" 
                value={inviteData.email}
                disabled
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <input 
                className="form-input" 
                type="text" 
                value={inviteData.role.toUpperCase()}
                disabled
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                className="form-input" 
                type="text" 
                placeholder="e.g. John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitLoading}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="form-input" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Min. 6 characters" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitLoading}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="form-input" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitLoading}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              type="submit" 
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
              disabled={submitLoading}
            >
              {submitLoading ? 'Setting up account...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitePage;
