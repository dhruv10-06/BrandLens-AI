import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';

// Pages
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { GuidelinesPage } from './pages/GuidelinesPage.tsx';
import { NewSubmissionPage } from './pages/NewSubmissionPage.tsx';
import { SubmissionsListPage } from './pages/SubmissionsListPage.tsx';
import { AnalysisResultsPage } from './pages/AnalysisResultsPage.tsx';
import { ReviewQueuePage } from './pages/ReviewQueuePage.tsx';
import { ReviewDetailsPage } from './pages/ReviewDetailsPage.tsx';
import { ReviewHistoryPage } from './pages/ReviewHistoryPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Authenticating BrandLens Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated Workspace Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route path="/submissions/new" element={<NewSubmissionPage />} />
            <Route path="/submissions" element={<SubmissionsListPage />} />
            <Route path="/submissions/:id/analysis" element={<AnalysisResultsPage />} />
            <Route path="/review-queue" element={<ReviewQueuePage />} />
            <Route path="/review/:id" element={<ReviewDetailsPage />} />
            <Route path="/review-history" element={<ReviewHistoryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

