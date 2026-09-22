import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import axiosClient from '../../api/axiosClient';
import taskApi from '../../api/taskApi';
import reportApi from '../../api/reportApi';
import analyticsApi from '../../api/analyticsApi';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Activity, ChevronDown, ChevronUp, FolderGit2, Users, CheckSquare, FileText, X, Clock, PlusCircle, BarChart3 } from 'lucide-react';
import GitHubActivityPanel from '../../components/github/GitHubActivityPanel';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [myInterns, setMyInterns] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [internsCount, setInternsCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [cohortAnalytics, setCohortAnalytics] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [activeInternId, setActiveInternId] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const fetchMetrics = async () => {
    try {
      // Query assigned interns list specifically for this manager
      const internsRes = await axiosClient.get('/api/projects/my-interns');
      setMyInterns(internsRes.data.data);
      setInternsCount(internsRes.data.data.length);

      const tasksRes = await taskApi.getTasks();
      setTasksCount(tasksRes.data.length);

      const reportsRes = await reportApi.getReports();
      setPendingReportsCount(reportsRes.data.filter((r) => r.status === 'pending').length);

      // Fetch manager's projects
      const projectsRes = await axiosClient.get('/api/projects');
      const loadedProjects = projectsRes.data.data || [];
      setMyProjects(loadedProjects);

      // Fetch cohort analytics
      const cohortRes = await analyticsApi.getManagerCohortAnalytics();
      setCohortAnalytics(cohortRes.data);
    } catch (err) {
      console.error('Failed to load manager metrics', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);



  const cohortChartData = {
    labels: cohortAnalytics?.internStats?.map((i) => i.name) || [],
    datasets: [
      {
        label: 'Completed Tasks',
        data: cohortAnalytics?.internStats?.map((i) => i.completedTasks) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'var(--color-success)',
        borderWidth: 1,
      },
      {
        label: 'Total Tasks Assigned',
        data: cohortAnalytics?.internStats?.map((i) => i.totalTasks) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'var(--color-primary)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="fade-in">
      {/* Greeting Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FolderGit2 size={36} color="var(--color-primary)" />
          Manager Control Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Welcome back, {user?.name}. Monitor team productivity and coding evaluations.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Interns</span>
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
              <Users size={16} />
            </div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: '700' }}>{internsCount}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Under your supervision</span>
        </div>

        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cohort Tasks</span>
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
              <CheckSquare size={16} />
            </div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: '700' }}>
            {cohortAnalytics?.cohortTaskCompletion?.completed || 0} / {cohortAnalytics?.cohortTaskCompletion?.total || 0}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Overall Completion Rate: {cohortAnalytics?.cohortTaskCompletion?.rate || 0}%</span>
        </div>

        <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cohort Contribution</span>
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
              <Clock size={16} />
            </div>
          </div>
          <span style={{ fontSize: '2rem', fontWeight: '700' }}>{cohortAnalytics?.cohortReportStats?.totalHours || 0} hrs</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contributed across cohort</span>
        </div>
      </div>

      {/* Cohort Analytics Chart */}
      {cohortAnalytics && cohortAnalytics.internStats.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="card" style={{ height: '340px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart3 size={20} color="var(--color-primary)" /> Intern Task Breakdown
            </h3>
            <div style={{ height: '240px' }}>
              <Bar 
                data={cohortChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Action shortcuts */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.25rem' }}>Management Shortcuts</h2>
      <div className="grid grid-cols-2" style={{ marginBottom: '2.5rem' }}>
        <Link to="/manager/assign-task" className="card card-hover" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            flexShrink: 0
          }}>
            <PlusCircle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Assign New Task</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Publish coding specifications and assign to interns</p>
          </div>
        </Link>

        <Link to="/manager/review-reports" className="card card-hover" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-success)',
            flexShrink: 0
          }}>
            <FileText size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Review Daily Reports</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Verify work summaries and approve challenges</p>
          </div>
        </Link>
      </div>

      {/* Supervised Intern Cohort grouped by projects */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.25rem' }}>Supervised Intern Cohort</h2>
      {myProjects.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            No active project workspaces found. Initialize a project first or contact your admin.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
          {myProjects.map((project) => {
            const isExpanded = !!expandedProjects[project._id];
            const internCount = project.internIds?.length || 0;

            return (
              <div key={project._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Accordion Header */}
                <div 
                  onClick={() => setExpandedProjects(prev => ({ ...prev, [project._id]: !prev[project._id] }))}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid var(--border-light)' : 'none',
                    transition: 'background-color 0.2s ease',
                  }}
                  className="accordion-header"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      flexShrink: 0
                    }}>
                      <FolderGit2 size={16} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                        {project.name}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                        {project.description.length > 80 ? `${project.description.slice(0, 80)}...` : project.description}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 600, 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '12px', 
                      backgroundColor: internCount > 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.08)',
                      color: internCount > 0 ? 'var(--color-primary)' : 'var(--color-danger)'
                    }}>
                      {internCount} {internCount === 1 ? 'Intern' : 'Interns'}
                    </span>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-muted)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s ease',
                      display: 'inline-block'
                    }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem' }}>
                    {internCount === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, textAlign: 'center', padding: '1rem 0' }}>
                        No interns currently assigned to this project workspace.
                      </p>
                    ) : (
                      <>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.925rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                              <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                              <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {project.internIds.map((intern) => (
                              <tr key={intern._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{intern.name}</td>
                                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{intern.email}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                  <button
                                    onClick={() => {
                                      if (activeInternId === intern._id && activeProjectId === project._id) {
                                        setActiveInternId(null);
                                        setActiveProjectId(null);
                                      } else {
                                        setActiveInternId(intern._id);
                                        setActiveProjectId(project._id);
                                      }
                                    }}
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '0.35rem 0.75rem',
                                      fontSize: '0.75rem',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem'
                                    }}
                                  >
                                    {activeInternId === intern._id && activeProjectId === project._id ? (
                                      <><X size={13} /> Close Activity</>
                                    ) : (
                                      <><Activity size={13} /> View Git Activity</>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {activeProjectId === project._id && activeInternId && (
                          <div style={{ marginTop: '2rem', borderTop: '1px dashed var(--border-medium)', paddingTop: '1.5rem' }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Activity size={18} color="var(--color-primary)" /> GitHub Workspace Inspection: <span style={{ color: 'var(--color-primary)' }}>{project.internIds.find(i => i._id === activeInternId)?.name}</span>
                            </h4>
                            <GitHubActivityPanel userId={activeInternId} projectId={project._id} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default ManagerDashboard;
