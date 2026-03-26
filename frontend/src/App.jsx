import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SendMoney from "./pages/SendMoney";
import ReceiveMoney from "./pages/ReceiveMoney";
import TransactionHistory from "./pages/TransactionHistory";
import Profile from "./pages/Profile";
import KYCVerification from "./pages/KYCVerification";
import Webhooks from "./pages/Webhooks";
import NotificationHistory from "./pages/NotificationHistory";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from "./components/notifications/Toast";
import { InstallPrompt } from "./components/mobile/InstallPrompt";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <ToastContainer />
            <InstallPrompt />
            <Routes>
              <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="send" element={<SendMoney />} />
                <Route path="receive" element={<ReceiveMoney />} />
                <Route path="history" element={<TransactionHistory />} />
                <Route path="profile" element={<Profile />} />
                <Route path="kyc" element={<KYCVerification />} />
                <Route path="webhooks" element={<Webhooks />} />
                <Route path="notifications" element={<NotificationHistory />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
