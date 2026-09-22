import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, FileText, GitCommit, PieChart, Activity, Target, PenTool, Terminal, FolderGit2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import GitHubLinkForm from '../../components/github/GitHubLinkForm';
import GitHubActivityPanel from '../../components/github/GitHubActivityPanel';
import { TaskContext } from '../../context/TaskContext';
import reportApi from '../../api/reportApi';
import analyticsApi from '../../api/analyticsApi';
import projectApi from '../../api/projectApi';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const InternDashboard = () => {
  const { user } = useAuth();
  const { tasks, fetchTasks } = useContext(TaskContext);
  
  // Project list states
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  // Stats states
  const [reportCount, setReportCount] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // 1. Fetch assigned projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectApi.getProjects();
        const data = response.data || [];
        setProjects(data);
        if (data.length > 0) {
          const savedProjectId = localStorage.getItem('codeforge_selected_project_id');
          const exists = data.some(p => p._id === savedProjectId);
          const defaultProjId = exists ? savedProjectId : data[0]._id;
          
          setSelectedProjectId(defaultProjId);
          setSelectedProject(data.find(p => p._id === defaultProjId));
        }
      } catch (err) {
        console.error('Failed to load projects on dashboard', err);
      }
    };
    fetchProjects();
  }, []);

  // 2. Fetch context-specific stats whenever selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoadingStats(true);

    const fetchDashboardStats = async () => {
      try {
        // Fetch tasks for the current project
        fetchTasks({ projectId: selectedProjectId });

        // Fetch reports count for the current project
        const reportsRes = await reportApi.getReports({ projectId: selectedProjectId });
        setReportCount(reportsRes.data.length);

        // Fetch analytics for the current project
        const analyticsRes = await analyticsApi.getInternAnalytics(null, selectedProjectId);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [selectedProjectId]);

  const handleProjectChange = (e) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    localStorage.setItem('codeforge_selected_project_id', projId);
    const proj = projects.find(p => p._id === projId);
    setSelectedProject(proj);
  };

  const activeTasksCount = tasks.filter((t) => t.status !== 'completed').length;

  const taskChartData = {
    labels: ['Completed', 'Pending'],
    datasets: [
      {
        data: [
          analytics?.taskCompletion?.completed || 0,
          (analytics?.taskCompletion?.total || 0) - (analytics?.taskCompletion?.completed || 0)
        ],
        backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.3)'],
        borderColor: ['var(--color-success)', 'rgba(239, 68, 68, 0.5)'],
        borderWidth: 1,
      },
    ],
  };

  const commitDates = analytics?.github?.commitHistory?.map((h) => h.date) || [];
  const commitCounts = analytics?.github?.commitHistory?.map((h) => h.count) || [];

  const commitsChartData = {
    labels: commitDates.length > 0 ? commitDates : ['No Commit History'],
    datasets: [
      {
        label: 'Commits',
        data: commitCounts.length > 0 ? commitCounts : [0],
        fill: true,
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        borderColor: '#00f0ff',
        borderWidth: 2.5,
        pointBackgroundColor: '#00f0ff',
        pointBorderColor: '#07090e',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#00f0ff',
        pointHoverBorderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="fade-in">
      {/* Greeting Header & Project Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FolderGit2 size={36} color="var(--color-primary)" />
            Welcome back, {user?.name}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            Here is an overview of your internship tasks and reports.
          </p>
        </div>

        {/* Project Selector dropdown */}
        {projects.length > 0 && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', minWidth: '240px' }}>
            <FolderGit2 size={18} color="var(--color-primary)" />
            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Workspace</span>
              <select
                value={selectedProjectId}
                onChange={handleProjectChange}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none',
                  width: '100%',
                  padding: '2px 0 0 0'
                }}
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(59, 130, 246, 0.08)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <FolderGit2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>No projects assigned</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You are not currently assigned to any active project workspace.</p>
        </div>
      ) : (
        <>
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
            <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Task Progress</span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <CheckSquare size={16} />
                </div>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: '700' }}>
                {analytics?.taskCompletion?.completed || 0} / {analytics?.taskCompletion?.total || 0}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Completed tasks</span>
            </div>

            <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Contributed</span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-secondary)'
                }}>
                  <FileText size={16} />
                </div>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: '700' }}>
                {analytics?.reportStats?.totalHours || 0} hrs
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Across {analytics?.reportStats?.totalReports || 0} reports</span>
            </div>

            <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GitHub Commits</span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-success)'
                }}>
                  <GitCommit size={16} />
                </div>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: '700' }}>
                {analytics?.github?.commitHistory?.reduce((acc, h) => acc + h.count, 0) || 0}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Connected commits</span>
            </div>
          </div>

          {/* Analytics Charts Grid */}
          {analytics && (
            <div className="grid grid-cols-2" style={{ marginBottom: '2.5rem', gap: '2rem' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, alignSelf: 'flex-start', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieChart size={18} color="var(--color-primary)" /> Task Rate
                </h3>
                <div style={{ width: '180px', height: '180px', position: 'relative' }}>
                  <Doughnut 
                    data={taskChartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } }
                    }} 
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{analytics.taskCompletion.rate}%</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Done</span>
                  </div>
                </div>
              </div>
              <div className="card" style={{ height: '320px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Activity size={20} color="var(--color-primary)" /> GitHub Commit Timeline
                </h3>
                <div style={{ height: '200px' }}>
                  {analytics.github.connected && commitDates.length > 0 ? (
                    <Line 
                      data={commitsChartData} 
                      options={{ 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            labels: {
                              color: 'var(--text-secondary, #9ca3af)',
                              font: {
                                family: '"Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                size: 12,
                                weight: 500
                              }
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#ffffff',
                            bodyColor: '#e2e8f0',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            padding: 10,
                            titleFont: {
                              family: '"Outfit", sans-serif',
                              size: 12,
                              weight: 600
                            },
                            bodyFont: {
                              family: '"Outfit", sans-serif',
                              size: 12
                            }
                          }
                        },
                        scales: {
                          x: {
                            grid: {
                              color: 'rgba(255, 255, 255, 0.05)',
                              drawBorder: false
                            },
                            ticks: {
                              color: 'var(--text-muted, #9ca3af)',
                              font: {
                                family: '"Outfit", sans-serif',
                                size: 10
                              }
                            }
                          },
                          y: { 
                            beginAtZero: true, 
                            ticks: { 
                              precision: 0,
                              color: 'var(--text-muted, #9ca3af)',
                              font: {
                                family: '"Outfit", sans-serif',
                                size: 10
                              }
                            },
                            grid: {
                              color: 'rgba(255, 255, 255, 0.05)',
                              drawBorder: false
                            }
                          }
                        }
                      }} 
                    />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                      No OAuth commit history found.<br />Connect your GitHub account to sync data.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main split grid */}
          <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>
            
            {/* Left Column: Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Quick Actions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Link to="/intern/tasks" className="card card-hover" style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)'
                  }}>
                    <Target size={24} color="var(--color-primary)" />
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>View Tasks</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Complete assigned coding tasks</p>
                    </div>
                  </Link>

                  <Link to="/intern/reports" className="card card-hover" style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)'
                  }}>
                    <PenTool size={24} color="var(--color-secondary)" />
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Write Report</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Submit daily work progress</p>
                    </div>
                  </Link>

                  <Link to={`/intern/ide?projectId=${selectedProjectId}`} className="card card-hover" style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)'
                  }}>
                    <Terminal size={24} color="#10b981" />
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Launch IDE</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Open Monaco browser editor</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* GitHub configuration block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Repository Info</h2>
              <GitHubLinkForm projectId={selectedProjectId} project={selectedProject} />
              <GitHubActivityPanel projectId={selectedProjectId} />
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default InternDashboard;
