import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore.js';

// Error, Suspense, and Toast utilities
import ErrorBoundary from './components/ErrorBoundary.jsx';
import SuspenseBoundary from './components/SuspenseBoundary.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';

// Layout shell
import Layout from './components/Layout.jsx';
import Loader from './components/Loader.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import LessonPage from './pages/LessonPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LevelsPage from './pages/LevelsPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';

// Gamification & Spaced Repetition Pages
import GamificationPage from './pages/GamificationPage.jsx';
import SpinWheelPage from './pages/SpinWheelPage.jsx';
import AvatarPage from './pages/AvatarPage.jsx';
import VocabularyPage from './pages/VocabularyPage.jsx';
import FlashcardsPage from './pages/FlashcardsPage.jsx';
import FriendsPage from './pages/FriendsPage.jsx';
import ClubsPage from './pages/ClubsPage.jsx';
import StreakSharePage from './pages/StreakSharePage.jsx';
import ProfileCardPage from './pages/ProfileCardPage.jsx';

// Admin Page Separations
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminLanguagesPage from './pages/admin/AdminLanguagesPage.jsx';
import AdminUnitsPage from './pages/admin/AdminUnitsPage.jsx';
import AdminChaptersPage from './pages/admin/AdminChaptersPage.jsx';
import AdminLessonsPage from './pages/admin/AdminLessonsPage.jsx';
import AdminExercisesPage from './pages/admin/AdminExercisesPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminGamificationPage from './pages/admin/AdminGamificationPage.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents aggressive background re-fetches in dev
      retry: 1,
      staleTime: 5 * 60 * 1000,    // Cache results for 5 minutes
      gcTime: 10 * 60 * 1000       // Keep cache in memory for 10 minutes
    }
  }
});

// Guard Route for authenticated sessions
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader message="Checking authentication..." />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Guard Route for Admin sessions
function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader message="Verifying admin credentials..." />
      </div>
    );
  }

  const isAdmin = isAuthenticated && user && user.role === 'admin';
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

// Public Route (redirects to dashboard if logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader message="Redirecting..." />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function NavigationWrapper() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader message="Initializing Varnam tracks..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<PublicRoute><Layout><LandingPage /></Layout></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Layout><LoginPage /></Layout></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Layout><SignupPage /></Layout></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><Layout><ForgotPasswordPage /></Layout></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><Layout><ResetPasswordPage /></Layout></PublicRoute>} />

      {/* Protected Learner Pages */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/levels" element={<ProtectedRoute><Layout><LevelsPage /></Layout></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Layout><LeaderboardPage /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
      <Route path="/about" element={<ProtectedRoute><Layout><AboutPage /></Layout></ProtectedRoute>} />

      {/* Gamification & Spaced Repetition Routes */}
      <Route path="/gamification" element={<ProtectedRoute><Layout><GamificationPage /></Layout></ProtectedRoute>} />
      <Route path="/spin" element={<ProtectedRoute><Layout><SpinWheelPage /></Layout></ProtectedRoute>} />
      <Route path="/avatar" element={<ProtectedRoute><Layout><AvatarPage /></Layout></ProtectedRoute>} />
      <Route path="/vocabulary" element={<ProtectedRoute><Layout><VocabularyPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards" element={<ProtectedRoute><Layout><FlashcardsPage /></Layout></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Layout><FriendsPage /></Layout></ProtectedRoute>} />
      <Route path="/clubs" element={<ProtectedRoute><Layout><ClubsPage /></Layout></ProtectedRoute>} />
      <Route path="/streak-share" element={<ProtectedRoute><Layout><StreakSharePage /></Layout></ProtectedRoute>} />
      <Route path="/profile-card" element={<ProtectedRoute><Layout><ProfileCardPage /></Layout></ProtectedRoute>} />

      {/* Fullscreen Lesson Page (No Sidebar Layout) */}
      <Route path="/lessons/:id" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />

      {/* Administrative Panel Pages */}
      <Route path="/admin" element={<AdminRoute><Layout><AdminDashboardPage /></Layout></AdminRoute>} />
      <Route path="/admin/languages" element={<AdminRoute><Layout><AdminLanguagesPage /></Layout></AdminRoute>} />
      <Route path="/admin/units" element={<AdminRoute><Layout><AdminUnitsPage /></Layout></AdminRoute>} />
      <Route path="/admin/chapters" element={<AdminRoute><Layout><AdminChaptersPage /></Layout></AdminRoute>} />
      <Route path="/admin/lessons" element={<AdminRoute><Layout><AdminLessonsPage /></Layout></AdminRoute>} />
      <Route path="/admin/exercises" element={<AdminRoute><Layout><AdminExercisesPage /></Layout></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><Layout><AdminUsersPage /></Layout></AdminRoute>} />
      <Route path="/admin/gamification" element={<AdminRoute><Layout><AdminGamificationPage /></Layout></AdminRoute>} />

      {/* Fallback Catch-All to Not Found Page */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<SuspenseBoundary />}>
            <NavigationWrapper />
          </Suspense>
          <ToastContainer />
          <ConfirmModal />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
