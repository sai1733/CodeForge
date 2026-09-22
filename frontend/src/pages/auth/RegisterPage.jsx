import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { registerUser, isAuthenticated, user, error, clearError, loading } = useAuth();

  const navigate = useNavigate();

  // Clear errors when mounting
  useEffect(() => {
    clearError();
    setLocalError('');
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'intern') {
        navigate('/intern/dashboard');
      } else if (user.role === 'manager') {
        navigate('/manager/dashboard');
      } else if (user.role === 'superadmin') {
        navigate('/admin/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!name || !email || !password) {
      setLocalError('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    const result = await registerUser({ name, email, password, role: 'intern' });
    if (!result.success) {
      setLocalError(result.error);
    }
  };

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
          Create Account
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.95rem' }}>
          Get started with CodeForge platform
        </p>

        {localError && (
          <div style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--color-danger)', 
            color: 'var(--color-danger)',
            padding: '0.75rem',
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className="form-input" 
              type="text" 
              placeholder="John Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              className="form-input" 
              type="email" 
              placeholder="john@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className="form-input" 
              type="password" 
              placeholder="Min. 6 characters" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>



          <button 
            className="btn btn-primary" 
            type="submit" 
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '500', color: 'var(--color-primary)' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
