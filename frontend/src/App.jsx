import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { TaskProvider } from './context/TaskContext';
import { ProjectProvider } from './context/ProjectContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import useAuth from './hooks/useAuth';
import './styles/globals.css';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const publicPaths = ['/', '/login', '/forgot-password'];
  const isPublicPath = publicPaths.includes(location.pathname) || 
                       location.pathname.startsWith('/accept-invite/') || 
                       location.pathname.startsWith('/reset-password/');

  return (
    <div className="app-container">
      {!isPublicPath && <Navbar />}
      {!isPublicPath && <Sidebar />}
      
      {/* If authenticated and not on a public page, apply margin spacing offset for sidebar & header */}
      <main className={(isAuthenticated && !isPublicPath) ? "main-content animate-fade" : ""} style={{ width: '100%' }}>
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <TaskProvider>
          <ProjectProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ProjectProvider>
        </TaskProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
