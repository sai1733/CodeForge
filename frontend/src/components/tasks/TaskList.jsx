import React from 'react';
import { CheckSquare } from 'lucide-react';
import TaskCard from './TaskCard';

const TaskList = ({ tasks, loading }) => {
  if (loading) {
    return (
      <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h3>Loading tasks list...</h3>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(59, 130, 246, 0.08)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
          <CheckSquare size={36} />
        </div>
        <h3 style={{ color: 'var(--text-primary)' }}>No Tasks Found</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          There are no tasks assigned or specifications loaded.
        </p>
      </div>
    );
  }

  // Group tasks by status (assigned, in-progress, in-review, completed)
  const assignedTasks = tasks.filter((t) => t.status === 'assigned');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const inReviewTasks = tasks.filter((t) => t.status === 'in-review');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  // Column Scroll Container Style Helper
  const columnScrollStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxHeight: '530px',
    overflowY: 'auto',
    paddingRight: '6px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(0,0,0,0.15) transparent'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Columnized Board Layout (4 Columns) */}
      <div className="grid grid-cols-4" style={{ gap: '1.25rem', alignItems: 'flex-start' }}>
        
        {/* Assigned Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--color-warning)',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Assigned</h3>
            <span style={{
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--color-warning)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {assignedTasks.length}
            </span>
          </div>
          <div style={columnScrollStyle}>
            {assignedTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
            {assignedTasks.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
                No assigned tasks
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--color-accent)',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>In Progress</h3>
            <span style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--color-accent)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {inProgressTasks.length}
            </span>
          </div>
          <div style={columnScrollStyle}>
            {inProgressTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
            {inProgressTasks.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
                No active tasks
              </div>
            )}
          </div>
        </div>

        {/* In Review Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--color-secondary)',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>In Review</h3>
            <span style={{
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: 'var(--color-secondary)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {inReviewTasks.length}
            </span>
          </div>
          <div style={columnScrollStyle}>
            {inReviewTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
            {inReviewTasks.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
                No tasks in review
              </div>
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--color-success)',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Completed</h3>
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--color-success)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {completedTasks.length}
            </span>
          </div>
          <div style={columnScrollStyle}>
            {completedTasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
            {completedTasks.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
                No completed tasks
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskList;
