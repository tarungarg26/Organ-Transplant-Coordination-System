import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Donors from "./pages/Donors";
import Recipients from "./pages/Recipients";
import Matches from "./pages/Matches";
import Transports from "./pages/Transports";
import Documents from "./pages/Documents";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import "./styles.css";

import { ToastProvider } from "./components/Toast";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/donors" element={<ProtectedRoute roles={["HOSPITAL", "ADMIN", "COORDINATOR"]}><Donors /></ProtectedRoute>} />
                <Route path="/recipients" element={<ProtectedRoute roles={["HOSPITAL", "ADMIN", "COORDINATOR"]}><Recipients /></ProtectedRoute>} />
                <Route path="/matches" element={<ProtectedRoute roles={["COORDINATOR", "OPO", "ADMIN"]}><Matches /></ProtectedRoute>} />
                <Route path="/transports" element={<ProtectedRoute roles={["TRANSPORT", "COORDINATOR", "ADMIN"]}><Transports /></ProtectedRoute>} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/analytics" element={<ProtectedRoute roles={["COORDINATOR", "OPO", "AUDITOR", "ADMIN"]}><Analytics /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute roles={["COORDINATOR", "OPO", "AUDITOR", "ADMIN"]}><Reports /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute roles={["ADMIN"]}><Users /></ProtectedRoute>} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
