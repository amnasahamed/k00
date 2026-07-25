import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ToastProvider } from './providers/ToastProvider';
import { QueryProvider } from './providers/QueryProvider';
import Layout from './components/Layout';

const lazyRetry = (componentImport: () => Promise<any>) => {
  return React.lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.localStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.localStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        window.localStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      throw error;
    }
  });
};

const Dashboard = lazyRetry(() => import('./components/dashboard'));
const StudentsView = lazyRetry(() => import('./components/students'));
const AssignmentsView = lazyRetry(() => import('./components/assignments'));
const PaymentsView = lazyRetry(() => import('./components/payments'));
const WritersView = lazyRetry(() => import('./components/writers'));
const SettingsView = lazyRetry(() => import('./components/SettingsView'));
const AuditLogView = lazyRetry(() => import('./components/AuditLogView'));
const AlertsView = lazyRetry(() => import('./components/AlertsView'));
const ActionsView = lazyRetry(() => import('./components/ActionsView'));
const AdminLogin = lazyRetry(() => import('./components/AdminLogin'));
const WriterLogin = lazyRetry(() => import('./components/WriterLogin'));
const WriterDashboard = lazyRetry(() => import('./components/WriterDashboard'));

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};

const WriterProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isWriter, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>;
  }

  if (!isWriter) {
    return <Navigate to="/writer-login" replace />;
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

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={
          <AdminProtectedRoute>
            <Layout />
          </AdminProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentsView />} />
          <Route path="assignments" element={<AssignmentsView />} />
          <Route path="payments" element={<PaymentsView />} />
          <Route path="writers" element={<WritersView />} />
          <Route path="alerts" element={<AlertsView />} />
          <Route path="actions" element={<ActionsView />} />
          <Route path="audit-log" element={<AuditLogView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>

        <Route path="/writer-dashboard" element={
          <WriterProtectedRoute>
            <WriterDashboard />
          </WriterProtectedRoute>
        } />
      </Routes>
    </React.Suspense>
  );
};

const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
};

export default App;
