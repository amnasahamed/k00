import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Layout from './components/Layout';

// Lazy Loaded Components for better performance
const Dashboard = React.lazy(() => import('./components/dashboard'));
const StudentsView = React.lazy(() => import('./components/students'));
const AssignmentsView = React.lazy(() => import('./components/assignments'));
const PaymentsView = React.lazy(() => import('./components/payments'));
const WritersView = React.lazy(() => import('./components/writers'));
const SettingsView = React.lazy(() => import('./components/SettingsView'));
const AuditLogView = React.lazy(() => import('./components/AuditLogView'));
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const WriterLogin = React.lazy(() => import('./components/WriterLogin'));
const WriterDashboard = React.lazy(() => import('./components/WriterDashboard'));

// Protected Route Component wrapping the logic
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-secondary-50">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <Routes>
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/writer-login" element={<WriterLogin />} />

        {/* Admin Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentsView />} />
          <Route path="assignments" element={<AssignmentsView />} />
          <Route path="payments" element={<PaymentsView />} />
          <Route path="writers" element={<WritersView />} />
          <Route path="audit-log" element={<AuditLogView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>

        {/* Writer Routes - separated for clarity, can also separate layout if needed */}
        <Route path="/writer-dashboard" element={<WriterDashboard />} />
      </Routes>
    </React.Suspense>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;