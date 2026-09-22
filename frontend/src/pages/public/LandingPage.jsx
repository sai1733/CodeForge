import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Terminal, GitBranch, GitMerge, Code2, ArrowRight, Users, Settings2, ChevronDown, Activity, Globe, Cpu } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import logo from '../../assets/logo.png';

// Custom Techy SVG Logo matching the user's image theme
const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 17L2 12L7 7" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 19L17 12L12 5" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 21L13 3" stroke="#3b82f6" strokeWidth="2.0" strokeLinecap="round" />
  </svg>
);

// High-fidelity Holographic Network Globe Component with Floating Stars
const CanvasGlobe = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, isHovering: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Handle high DPI displays
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Globe structural parameters
    const radius = 135; // Increased globe size
    const networkNodes = [];
    const numNodes = 85; // Increased node density
    const stars = [];

    // Generate background stars
    for (let i = 0; i < 35; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.3 + 0.6,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleVal: Math.random() * Math.PI
      });
    }

    // Generate random nodes distributed evenly on a sphere using Fibonacci lattice
    for (let i = 0; i < numNodes; i++) {
      const offset = 2 / numNodes;
      const increment = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle
      const y = ((i * offset) - 1) + (offset / 2);
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      
      networkNodes.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        baseSize: Math.random() * 1.6 + 1.2,
        isHighlight: i % 8 === 0, // Mark some as active pulsing nodes
        pulseOffset: Math.random() * Math.PI
      });
    }

    // Add satellites / floating network nodes orbiting in space
    const satellites = [];
    const numSatellites = 14;
    for (let i = 0; i < numSatellites; i++) {
      const lat = (Math.random() - 0.5) * Math.PI * 0.7; // Avoid poles slightly
      const lon = Math.random() * 2 * Math.PI;
      const r = radius + 25 + Math.random() * 20; // Orbit distance
      satellites.push({
        lat,
        lon,
        r,
        speed: (Math.random() * 0.008 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.2 + 1.5,
        color: i % 2 === 0 ? '#00f0ff' : '#d946ef'
      });
    }

    let angleX = 0.25; // Tilt
    let angleY = 0;
    let targetSpeedY = 0.0018;
    let currentSpeedY = 0.0018;
    let pulseTime = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      mouseRef.current = { x, y, isHovering: true };
    };

    const handleMouseLeave = () => {
      mouseRef.current.isHovering = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);
      pulseTime += 0.03;

      // Render background twinkling stars
      stars.forEach(star => {
        star.twinkleVal += star.twinkleSpeed;
        const brightness = Math.sin(star.twinkleVal) * 0.45 + 0.55;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Mouse interactive tilt and velocity calculations
      const mouse = mouseRef.current;
      if (mouse.isHovering) {
        targetSpeedY = 0.009 * (mouse.x / (width / 2));
        angleX += (mouse.y / (height / 2) * 0.4 - angleX) * 0.05;
      } else {
        targetSpeedY = 0.0018;
        angleX += (0.25 - angleX) * 0.05; // Return to standard tilt
      }
      currentSpeedY += (targetSpeedY - currentSpeedY) * 0.05;
      angleY += currentSpeedY;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // 1. Draw glowing inner energy core
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.7);
      coreGrad.addColorStop(0, 'rgba(0, 240, 255, 0.18)');
      coreGrad.addColorStop(0.35, 'rgba(217, 70, 239, 0.08)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw atmospheric halo
      const haloGrad = ctx.createRadialGradient(cx, cy, radius - 4, cx, cy, radius + 22);
      haloGrad.addColorStop(0, 'rgba(6, 182, 212, 0.32)');
      haloGrad.addColorStop(0.5, 'rgba(217, 70, 239, 0.12)');
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.strokeStyle = haloGrad;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Project 3D nodes onto 2D Canvas space
      const projectedNodes = networkNodes.map(pt => {
        // Y-rotation
        let x1 = pt.x * cosY - pt.z * sinY;
        let z1 = pt.x * sinY + pt.z * cosY;

        // X-rotation
        let y2 = pt.y * cosX - z1 * sinX;
        let z2 = pt.y * sinX + z1 * cosX;

        // Perspective scaling
        const distance = 400;
        const scale = distance / (distance + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { px, py, z: z2, scale, original: pt };
      });

      // 4. Draw Network Connections (Geodesic / Neural mesh lines)
      ctx.lineWidth = 0.75;
      const maxConnectDistance = 64;
      
      for (let i = 0; i < projectedNodes.length; i++) {
        const n1 = projectedNodes[i];
        
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n2 = projectedNodes[j];
          
          // Calculate 3D Euclidean distance between coordinates
          const dx = n1.original.x - n2.original.x;
          const dy = n1.original.y - n2.original.y;
          const dz = n1.original.z - n2.original.z;
          const distSq = dx*dx + dy*dy + dz*dz;
          
          if (distSq < maxConnectDistance * maxConnectDistance) {
            const dist = Math.sqrt(distSq);
            const avgZ = (n1.z + n2.z) / 2;
            const depthAlpha = Math.max(0.08, 1 - (avgZ + radius) / (2 * radius));
            const proximityAlpha = 1 - (dist / maxConnectDistance);
            const alpha = depthAlpha * proximityAlpha * 0.45;

            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            
            // Neon cyan-magenta gradient line
            const lineGrad = ctx.createLinearGradient(n1.px, n1.py, n2.px, n2.py);
            lineGrad.addColorStop(0, `rgba(0, 240, 255, ${alpha})`);
            lineGrad.addColorStop(1, `rgba(217, 70, 239, ${alpha})`);
            
            ctx.strokeStyle = lineGrad;
            ctx.stroke();
          }
        }
      }

      // 5. Draw the physical Nodes
      projectedNodes.forEach(node => {
        const depthAlpha = Math.max(0.1, 1 - (node.z + radius) / (2 * radius));
        
        if (node.original.isHighlight) {
          const pulse = Math.sin(pulseTime + node.original.pulseOffset) * 2.2 + 3.5;
          const alpha = depthAlpha * 0.95;

          // Glowing pulse ring
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.45})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(node.px, node.py, pulse * node.scale, 0, Math.PI * 2);
          ctx.stroke();

          // Node center point
          ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(node.px, node.py, 2.5 * node.scale, 0, Math.PI * 2);
          ctx.fill();

          // Mini neon flare
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8 * node.scale;
          ctx.beginPath();
          ctx.arc(node.px, node.py, 1.2 * node.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        } else {
          // Regular node
          const alpha = depthAlpha * 0.7;
          ctx.fillStyle = node.z > 0 ? `rgba(217, 70, 239, ${alpha * 0.6})` : `rgba(217, 70, 239, ${alpha})`;
          ctx.beginPath();
          ctx.arc(node.px, node.py, node.original.baseSize * node.scale, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 6. Draw orbiting Satellites (glowing floating modules)
      satellites.forEach(sat => {
        sat.lon = (sat.lon + sat.speed) % (Math.PI * 2);

        // Calculate orbit 3D coordinates
        const sx = sat.r * Math.cos(sat.lat) * Math.cos(sat.lon);
        const sy = sat.r * Math.sin(sat.lat);
        const sz = sat.r * Math.cos(sat.lat) * Math.sin(sat.lon);

        let x1 = sx * cosY - sz * sinY;
        let z1 = sx * sinY + sz * cosY;
        let y2 = sy * cosX - z1 * sinX;
        let z2 = sy * sinX + z1 * cosX;

        const distance = 400;
        const scale = distance / (distance + z2);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        const alpha = z2 > 0 ? 0.15 : 0.9;
        ctx.fillStyle = sat.color;
        
        ctx.beginPath();
        ctx.arc(px, py, sat.size * scale, 0, Math.PI * 2);
        ctx.fill();

        if (z2 <= 0) {
          ctx.shadowColor = sat.color;
          ctx.shadowBlur = 10 * scale;
          ctx.beginPath();
          ctx.arc(px, py, (sat.size - 0.5) * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset

          // Connect satellite back to closest sphere node (gives technical beam look)
          let closestNode = null;
          let minDist = 999999;
          
          projectedNodes.forEach(n => {
            if (n.z <= 0) {
              const dx = px - n.px;
              const dy = py - n.py;
              const d = dx*dx + dy*dy;
              if (d < minDist) {
                minDist = d;
                closestNode = n;
              }
            }
          });

          if (closestNode && minDist < 90 * 90) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.16})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(closestNode.px, closestNode.py);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div style={{
      width: '100%',
      maxWidth: '520px', // Larger container
      height: '520px',
      position: 'relative',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background neon ambient gradients */}
      <div style={{
        position: 'absolute',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 240, 255, 0.12) 0%, transparent 70%)',
        filter: 'blur(35px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(217, 70, 239, 0.08) 0%, transparent 70%)',
        filter: 'blur(25px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 1,
          cursor: 'grab'
        }}
      />
    </div>
  );
};

const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeStep, setActiveStep] = useState(null);

  // Watch screen resizing
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isDesktop = windowWidth > 980;
  const isTablet = windowWidth > 640 && windowWidth <= 980;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#07090e',
      color: '#f3f4f6',
      fontFamily: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Decorative top grid background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '750px',
        backgroundImage: 'radial-gradient(ellipse at 50% -80px, rgba(0, 240, 255, 0.16) 0%, rgba(217, 70, 239, 0.04) 50%, rgba(0,0,0,0) 80%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Floating Header */}
      <header style={{
        position: 'sticky',
        top: '1.25rem',
        zIndex: 100,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.5rem',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 2rem',
          borderRadius: '16px',
          backgroundColor: 'rgba(10, 14, 23, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 240, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img src={logo} alt="CodeForge Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
            <span style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ffffff 60%, #9ca3af 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              CodeForge
            </span>
          </div>

          {/* Navigation Links */}
          {windowWidth > 640 && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
              <a href="#features" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Features</a>
              <a href="#workflow" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>Workflow</a>
              <a href="#faq" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ffffff'} onMouseOut={(e) => e.target.style.color = '#9ca3af'}>FAQ</a>
            </nav>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/login" style={{
              padding: '0.55rem 1.35rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(217, 70, 239, 0.2) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.1)',
              transition: 'all 0.2s ease-in-out'
            }} onMouseOver={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              e.target.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.25)';
            }} onMouseOut={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.15)';
              e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.1)';
            }}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Cockpit Hero Section (Focused only on Pitch and Designing Globe) */}
      <main style={{ flex: 1, zIndex: 10 }}>
        <section style={{
          minHeight: 'calc(100vh - 120px)',
          display: 'flex',
          alignItems: 'center',
          padding: isDesktop ? '2.5rem 2.5rem 1rem 2.5rem' : '2rem 1.5rem',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1.15fr 1fr' : '1fr',
            gap: isDesktop ? '3rem' : '3.5rem',
            alignItems: 'center',
            width: '100%'
          }}>
            {/* Column 1: Core Pitch */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: !isDesktop ? 'center' : 'flex-start',
              textAlign: !isDesktop ? 'center' : 'left'
            }}>
              {/* Premium Pill Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.45rem 1rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                color: '#22d3ee',
                fontSize: '0.85rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.06)'
              }}>
                <Terminal size={14} /> Universal Developer Environment
              </div>

              <h1 style={{
                fontSize: isDesktop ? '2.85rem' : '2.3rem',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                margin: '0 0 1rem 0',
                color: '#ffffff'
              }}>
                Accelerate Intern Talent. <br />
                <span style={{ color: '#00f0ff' }}>Seamlessly.</span> <br />
                Welcome to <span style={{
                  background: 'linear-gradient(135deg, #00f0ff 0%, #d946ef 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>CodeForge</span>.
              </h1>

              <p style={{
                fontSize: '1rem',
                color: '#9ca3af',
                lineHeight: 1.55,
                marginBottom: '1.75rem',
                maxWidth: '560px'
              }}>
                Unlock instant onboarding and professional-grade workflows with a zero-setup browser Cloud IDE, automated Git synchronization, and native manager review. Build, review, and evaluate, all in one cohesive, modern platform.
              </p>

              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                justifyContent: !isDesktop ? 'center' : 'flex-start',
                marginBottom: '2rem'
              }}>
                <Link to="/login" style={{
                  padding: '0.8rem 2rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00f0ff 0%, #d946ef 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }} onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.5)';
                }} onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.35)';
                }}>
                  Enter Console
                </Link>
                <a href="#features" style={{
                  padding: '0.8rem 2rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  transition: 'background-color 0.2s, color 0.2s, border-color 0.2s'
                }} onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.color = '#ffffff';
                }} onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.color = '#e5e7eb';
                }}>
                  Platform Overview
                </a>
              </div>

              {/* Trust badges footer link grid */}
              <div style={{
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                justifyContent: !isDesktop ? 'center' : 'flex-start',
                opacity: 0.65
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00f0ff' }}></span>
                  Zero Server Fees
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d946ef' }}></span>
                  GitHub Sync Pipeline
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                  StackBlitz Integrated
                </div>
              </div>
            </div>

            {/* Column 2: Designing Holographic Globe (Takes Right Side) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CanvasGlobe />
            </div>
          </div>
        </section>

        {/* Section: Collaboration Cards (Spacious viewport block) */}
        <section id="features" style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8rem 2.5rem 6rem 2.5rem',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          borderTop: '1px solid rgba(255, 255, 255, 0.03)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'white', letterSpacing: '-0.02em' }}>
              Engineered for Limitless Collaboration
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.5 }}>
              Everything needed to orchestrate developers, track milestones, and compile workspaces without setup hurdles.
            </p>
          </div>

          {/* Three Column Glassmorphic Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth > 880 ? 'repeat(3, 1fr)' : '1fr',
            gap: '2.5rem'
          }}>
            {/* Card 1: Cyan Glow */}
            <div style={{
              padding: '3rem 2.25rem',
              backgroundColor: 'rgba(15, 20, 32, 0.45)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(6, 182, 212, 0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(6, 182, 212, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(6, 182, 212, 0.05)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00f0ff',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.15)'
              }}>
                <Terminal size={24} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'white' }}>Dev Environments</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
                Node.js Runtimes. StackBlitz WebContainers. Spin up responsive development environments instantly in the client browser.
              </p>
            </div>

            {/* Card 2: Pink/Magenta Glow */}
            <div style={{
              padding: '3rem 2.25rem',
              backgroundColor: 'rgba(15, 20, 32, 0.45)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(217, 70, 239, 0.2)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(217, 70, 239, 0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'rgba(217, 70, 239, 0.5)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(217, 70, 239, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(217, 70, 239, 0.2)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(217, 70, 239, 0.05)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(217, 70, 239, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d946ef',
                boxShadow: '0 0 12px rgba(217, 70, 239, 0.15)'
              }}>
                <GitBranch size={24} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'white' }}>Automated Workflows</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
                Git Branching. PR Submissions. Draft-to-DB Sync. Native Git code management pipelines keeping developer flow frictionless.
              </p>
            </div>

            {/* Card 3: Green Glow */}
            <div style={{
              padding: '3rem 2.25rem',
              backgroundColor: 'rgba(15, 20, 32, 0.45)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(16, 185, 129, 0.05)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(16, 185, 129, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(16, 185, 129, 0.05)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)'
              }}>
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'white' }}>Cohort Management</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
                1-Click Pull Request Merging. Commit logs auditing. Progress evaluation dashboards for cohort managers.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Horizontal Seamless CodeForge Flow */}
        <section id="workflow" style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8rem 2rem',
          backgroundColor: '#05070a',
          borderTop: '1px solid rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
          position: 'relative'
        }}>
          <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'white', letterSpacing: '-0.02em' }}>
                The Seamless CodeForge Flow
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.55 }}>
                From codebase initialization to repository deployment—fully automated in a horizontal pipeline.
              </p>
            </div>

            {/* Horizontal Timeline Pipeline */}
            <div style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: windowWidth > 880 ? 'repeat(3, 1fr)' : '1fr',
              gap: windowWidth > 880 ? '2.5rem' : '4rem',
              alignItems: 'start'
            }}>
              {/* Glowing Pipeline Connector Line Running Behind Nodes (Desktop only) */}
              {windowWidth > 880 && (
                <div style={{
                  position: 'absolute',
                  left: '12%',
                  right: '12%',
                  top: '32px', // Centered behind the 64px circles
                  height: '3px',
                  background: 'linear-gradient(90deg, #00f0ff 0%, #d946ef 50%, #10b981 100%)',
                  opacity: 0.3,
                  zIndex: 0
                }} />
              )}

              {/* Step 1 */}
              <div 
                onMouseEnter={() => setActiveStep(1)}
                onMouseLeave={() => setActiveStep(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: activeStep === 1 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(6, 182, 212, 0.1)',
                  border: '2px solid #00f0ff',
                  color: '#00f0ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  boxShadow: activeStep === 1 ? '0 0 30px rgba(0, 240, 255, 0.6)' : '0 0 20px rgba(6, 182, 212, 0.25)',
                  marginBottom: '1.5rem',
                  transform: activeStep === 1 ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <Settings2 size={24} />
                </div>
                <div style={{
                  backgroundColor: 'rgba(15, 20, 32, 0.45)',
                  padding: '2rem 1.5rem',
                  borderRadius: '16px',
                  border: activeStep === 1 ? '1px solid #00f0ff' : '1px solid rgba(0, 240, 255, 0.3)',
                  minHeight: '170px',
                  width: '100%',
                  transform: activeStep === 1 ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: activeStep === 1 
                    ? '0 15px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(0, 240, 255, 0.25)' 
                    : '0 5px 15px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00f0ff', textTransform: 'uppercase', tracking: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Step 01</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.75rem 0' }}>
                    Initialize Project
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.925rem', lineHeight: 1.55, margin: 0 }}>
                    Configure the GitHub integration repository, invite interns, and establish collaborative sandboxed workspaces.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div 
                onMouseEnter={() => setActiveStep(2)}
                onMouseLeave={() => setActiveStep(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: activeStep === 2 ? 'rgba(217, 70, 239, 0.2)' : 'rgba(217, 70, 239, 0.1)',
                  border: '2px solid #d946ef',
                  color: '#d946ef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  boxShadow: activeStep === 2 ? '0 0 30px rgba(217, 70, 239, 0.6)' : '0 0 20px rgba(217, 70, 239, 0.25)',
                  marginBottom: '1.5rem',
                  transform: activeStep === 2 ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <Code2 size={24} />
                </div>
                <div style={{
                  backgroundColor: 'rgba(15, 20, 32, 0.45)',
                  padding: '2rem 1.5rem',
                  borderRadius: '16px',
                  border: activeStep === 2 ? '1px solid #d946ef' : '1px solid rgba(217, 70, 239, 0.3)',
                  minHeight: '170px',
                  width: '100%',
                  transform: activeStep === 2 ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: activeStep === 2 
                    ? '0 15px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(217, 70, 239, 0.25)' 
                    : '0 5px 15px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d946ef', textTransform: 'uppercase', tracking: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Step 02</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.75rem 0' }}>
                    Author & Sync
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.925rem', lineHeight: 1.55, margin: 0 }}>
                    Interns build code instantly inside the Cloud IDE browser. Local draft changes save to database memory, pushing to branch channels when ready.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div 
                onMouseEnter={() => setActiveStep(3)}
                onMouseLeave={() => setActiveStep(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: activeStep === 3 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  border: '2px solid #10b981',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  boxShadow: activeStep === 3 ? '0 0 30px rgba(16, 185, 129, 0.6)' : '0 0 20px rgba(16, 185, 129, 0.25)',
                  marginBottom: '1.5rem',
                  transform: activeStep === 3 ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <GitMerge size={24} />
                </div>
                <div style={{
                  backgroundColor: 'rgba(15, 20, 32, 0.45)',
                  padding: '2rem 1.5rem',
                  borderRadius: '16px',
                  border: activeStep === 3 ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.3)',
                  minHeight: '170px',
                  width: '100%',
                  transform: activeStep === 3 ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: activeStep === 3 
                    ? '0 15px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(16, 185, 129, 0.25)' 
                    : '0 5px 15px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', tracking: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Step 03</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.75rem 0' }}>
                    Review & Ship
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.925rem', lineHeight: 1.55, margin: 0 }}>
                    Managers review logs, check branches, and trigger 1-click Pull Request merging to integrate code directly to the repository main branch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Accordion FAQs (Spacious, fills viewport block) */}
        <section id="faq" style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8rem 1.5rem',
          maxWidth: '850px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'white', letterSpacing: '-0.025em' }}>
              Clear Answers for Curious Minds
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '1.08rem', lineHeight: 1.5 }}>
              Everything you need to know about the CodeForge platform logic.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              {
                q: "Does this platform require paid hosting servers?",
                a: "No! CodeForge runs 100% in the client browser. StackBlitz WebContainers execute Node.js runtimes client-side in the local environment, keeping your deployment infrastructure cost at exactly $0."
              },
              {
                q: "How are merge conflicts resolved?",
                a: "If Git detects conflicts during merging, the manager is alerted directly. They can instruct the intern to sync their workspace using the IDE panel, resolve conflicting lines locally, and push the revisions."
              },
              {
                q: "Do interns require an external GitHub account?",
                a: "Yes, interns authorize through GitHub OAuth authentication. CodeForge automatically handles spawning and tracking separate workspace branches under the supervisor's repository configuration."
              },
              {
                q: "How secure is the workspace draft backup system?",
                a: "All uncommitted IDE modifications are stored securely inside our centralized MongoDB database drafts. This allows developers to change workspaces, switch computers, or refresh browsers safely without losing a single keystroke."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 20, 32, 0.4)',
                  border: openFaq === idx ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease'
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '1.5rem 1.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    color={openFaq === idx ? '#00f0ff' : '#9ca3af'}
                    style={{
                      transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0
                    }}
                  />
                </button>
                <div style={{
                  maxHeight: openFaq === idx ? '200px' : '0px',
                  opacity: openFaq === idx ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{
                    padding: '0 1.75rem 1.75rem 1.75rem',
                    color: '#9ca3af',
                    fontSize: '0.96rem',
                    lineHeight: 1.62
                  }}>
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '3.5rem 2rem',
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        backgroundColor: '#040609',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: '#6b7280',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} CodeForge. Your Automated Dev Ecosystem. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


