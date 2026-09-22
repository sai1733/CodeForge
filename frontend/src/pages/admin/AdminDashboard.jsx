import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FolderGit2, CheckSquare, ShieldCheck, BarChart3 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import userApi from '../../api/userApi';
import projectApi from '../../api/projectApi';
import analyticsApi from '../../api/analyticsApi';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [usersCount, setUsersCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [systemAnalytics, setSystemAnalytics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const usersRes = await userApi.getUsers();
        setUsersCount(usersRes.data.length);

        const projectsRes = await projectApi.getProjects();
        setProjectsCount(projectsRes.data.length);

        const analyticsRes = await analyticsApi.getSystemAnalytics();
        setSystemAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load administrator metrics', err);
      }
    };
    fetchMetrics();
  }, []);

  const userChartData = {
    labels: ['Managers', 'Interns', 'Admins'],
    datasets: [
      {
        label: 'Users Count',
        data: [
          systemAnalytics?.users?.managers || 0,
          systemAnalytics?.users?.interns || 0,
          systemAnalytics?.users?.superadmins || 0,
        ],
        backgroundColor: [
          'rgba(0, 240, 255, 0.4)',  // Neon Cyan
          'rgba(217, 70, 239, 0.4)',  // Neon Magenta
          'rgba(16, 185, 129, 0.4)',  // Neon Emerald
        ],
        borderColor: [
          '#00f0ff',
          '#d946ef',
          '#10b981',
        ],
        borderWidth: 1.5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(12, 17, 28, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: 'rgba(0, 240, 255, 0.15)',
        borderWidth: 1,
        titleFont: { family: 'Outfit', size: 13 },
        bodyFont: { family: 'Outfit', size: 12 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 12 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#9ca3af', precision: 0, font: { family: 'Outfit', size: 12 } }
      }
    }
  };

  return (
    <div className="fade-in">
      {/* Greeting Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          color: '#ffffff',
          letterSpacing: '-0.02em'
        }}>
          <ShieldCheck size={28} color="#d946ef" style={{ filter: 'drop-shadow(0 0 6px rgba(217, 70, 239, 0.3))' }} />
          Platform Administrator Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem' }}>
          Welcome back, {user?.name || 'Super Admin'}. Oversee global users, projects, and platform nodes.
        </p>
      </div>

      {/* Admin stats grid with glowing colored outlines */}
      <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        
        {/* Total Users: Blue/Cyan Glow */}
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          backgroundColor: 'rgba(12, 17, 28, 0.65)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 12px rgba(0, 240, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(0, 240, 255, 0.85)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Users
            </span>
            <Users size={18} color="#00f0ff" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
            {systemAnalytics?.users?.total || usersCount}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {systemAnalytics?.users?.active || 1} active accounts
          </span>
        </div>

        {/* Total Projects: Green Glow */}
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          backgroundColor: 'rgba(12, 17, 28, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 12px rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(16, 185, 129, 0.85)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Projects
            </span>
            <FolderGit2 size={18} color="#10b981" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
            {systemAnalytics?.projects?.total || projectsCount}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {systemAnalytics?.projects?.active || 0} active workspaces
          </span>
        </div>

        {/* Global Tasks: Pink/Purple Glow */}
        <div className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          backgroundColor: 'rgba(12, 17, 28, 0.65)',
          border: '1px solid rgba(217, 70, 239, 0.25)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 12px rgba(217, 70, 239, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(217, 70, 239, 0.85)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Global Tasks
            </span>
            <CheckSquare size={18} color="#d946ef" />
          </div>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
            {systemAnalytics?.tasks?.completed || 0} / {systemAnalytics?.tasks?.total || 0}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Overall task completion rate: {systemAnalytics?.tasks?.rate || 0}%
          </span>
        </div>
      </div>

      {/* Breakdown panel rendering the original bar chart properly styled for dark mode */}
      <div className="card" style={{
        marginBottom: '2.5rem',
        backgroundColor: 'rgba(12, 17, 28, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        padding: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: 750,
          marginBottom: '1.5rem',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem'
        }}>
          <BarChart3 size={18} color="#00f0ff" />
          Platform User Role Breakdown
        </h3>

        <div style={{ height: '260px', position: 'relative' }}>
          {systemAnalytics ? (
            <Bar 
              key={JSON.stringify(userChartData.datasets[0].data)} 
              data={userChartData} 
              options={chartOptions} 
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <span className="spinner spinner-sm" style={{ borderTopColor: '#00f0ff' }}></span>
              <span style={{ fontSize: '0.85rem' }}>Loading chart data...</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Actions Title */}
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 700,
        marginBottom: '1.25rem',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem'
      }}>
        Administrative Tools
      </h2>

      {/* Actions quick access cards */}
      <div className="grid grid-cols-2">
        
        {/* Manage Users */}
        <Link to="/admin/users" className="card card-hover" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          backgroundColor: 'rgba(12, 17, 28, 0.65)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          padding: '1.5rem 1.75rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00f0ff',
            flexShrink: 0
          }}>
            <Users size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.15rem' }}>
              Manage Users
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Provision accounts and assign manager/intern permissions
            </p>
          </div>
        </Link>

        {/* Manage Projects */}
        <Link to="/admin/projects" className="card card-hover" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          backgroundColor: 'rgba(12, 17, 28, 0.65)',
          border: '1px solid rgba(0, 240, 255, 0.15)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          padding: '1.5rem 1.75rem'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(217, 70, 239, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d946ef',
            flexShrink: 0
          }}>
            <FolderGit2 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.15rem' }}>
              Manage Projects
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Initialize workspace directories and link collaborators
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
