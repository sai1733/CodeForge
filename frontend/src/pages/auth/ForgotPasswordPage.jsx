import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react';
import authApi from '../../api/authApi';
import logo from '../../assets/logo.png';

// Custom Techy SVG Logo matching the landing page
const LogoIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 17L2 12L7 7" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 19L17 12L12 5" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 21L13 3" stroke="#3b82f6" strokeWidth="2.0" strokeLinecap="round" />
  </svg>
);

// High-fidelity background wireframe globe
const BackgroundGlobe = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const radius = 100;
    const networkNodes = [];
    const numNodes = 55;

    for (let i = 0; i < numNodes; i++) {
      const offset = 2 / numNodes;
      const increment = Math.PI * (3 - Math.sqrt(5));
      const y = ((i * offset) - 1) + (offset / 2);
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      
      networkNodes.push({
        x: x * radius,
        y: y * radius,
        z: z * radius
      });
    }

    let angleX = 0.2;
    let angleY = 0;

    const render = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      angleY += 0.0015;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Core ambient glow
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.7);
      coreGrad.addColorStop(0, 'rgba(0, 240, 255, 0.06)');
      coreGrad.addColorStop(0.5, 'rgba(217, 70, 239, 0.03)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      const projectedNodes = networkNodes.map(pt => {
        let x1 = pt.x * cosY - pt.z * sinY;
        let z1 = pt.x * sinY + pt.z * cosY;
        let y2 = pt.y * cosX - z1 * sinX;
        let z2 = pt.y * sinX + z1 * cosX;

        const distance = 400;
        const scale = distance / (distance + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { px, py, z: z2, scale, original: pt };
      });

      // Draw mesh connection lines
      ctx.lineWidth = 0.6;
      const maxConnectDistance = 55;
      
      for (let i = 0; i < projectedNodes.length; i++) {
        const n1 = projectedNodes[i];
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n2 = projectedNodes[j];
          const dx = n1.original.x - n2.original.x;
          const dy = n1.original.y - n2.original.y;
          const dz = n1.original.z - n2.original.z;
          const distSq = dx*dx + dy*dy + dz*dz;
          
          if (distSq < maxConnectDistance * maxConnectDistance) {
            const avgZ = (n1.z + n2.z) / 2;
            const alpha = Math.max(0.04, 1 - (avgZ + radius) / (2 * radius)) * 0.25;

            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.stroke();
          }
        }
      }

      // Draw regular nodes
      projectedNodes.forEach(node => {
        const alpha = Math.max(0.06, 1 - (node.z + radius) / (2 * radius)) * 0.5;
        ctx.fillStyle = `rgba(217, 70, 239, ${alpha})`;
        ctx.beginPath();
        ctx.arc(node.px, node.py, 1.5 * node.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '320px',
        height: '320px',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    />
  );
};

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      setMessage(response.message || 'Reset instructions logged.');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please check the email entered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#07090e',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Decorative top-center background glow */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.05) 0%, transparent 70%)',
        top: '10%',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Embedded High-tech background globe */}
      <BackgroundGlobe />

      {/* Main Glassmorphic AUTH Panel */}
      <div className="card fade-in" style={{
        zIndex: 10,
        position: 'relative',
        width: '420px',
        padding: '3.5rem 2.25rem 3rem 2.25rem',
        background: 'rgba(12, 17, 28, 0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 240, 255, 0.16)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 240, 255, 0.05)'
      }}>


        {/* Central Logo Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
            <img src={logo} alt="CodeForge Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              CodeForge
            </span>
          </div>
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            margin: '0.5rem 0 0 0',
            background: 'linear-gradient(135deg, #d946ef 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center'
          }}>
            RESET PASSWORD
          </h2>
        </div>

        {/* Alert Error Box */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.07)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.05)'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Alert Success Box */}
        {message && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.07)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.05)'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Email input field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af' }}>Email Address</label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(10, 14, 23, 0.6)',
              border: isEmailFocused ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              transition: 'all 0.2s ease-in-out',
              boxShadow: isEmailFocused ? '0 0 10px rgba(0, 240, 255, 0.15)' : 'none'
            }}>
              <Mail size={16} color={isEmailFocused ? '#00f0ff' : '#6b7280'} style={{ transition: 'color 0.2s' }} />
              <input
                type="email"
                placeholder="name@company.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                disabled={loading}
                required
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '0.925rem'
                }}
              />
            </div>
          </div>

          {/* Premium Gradient Recover Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.85rem 1.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #d946ef 0%, #3b82f6 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 15px rgba(217, 70, 239, 0.25)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-1.5px)';
                e.target.style.boxShadow = '0 0 20px rgba(217, 70, 239, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 0 15px rgba(217, 70, 239, 0.25)';
            }}
          >
            {loading ? 'INITIALIZING...' : 'INITIALIZE RECOVERY'}
          </button>
        </form>

        {/* Back to Sign In Action Footer */}
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}>
          Remember your password?{' '}
          <Link to="/login" style={{
            fontWeight: '600',
            color: '#00f0ff',
            textDecoration: 'none',
            transition: 'color 0.2s'
          }} onMouseOver={(e) => e.target.style.color = '#22d3ee'} onMouseOut={(e) => e.target.style.color = '#00f0ff'}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
