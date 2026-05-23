import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import AppShell  from './components/layout/AppShell'
import Login     from './pages/Login'
import Register  from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Clients   from './pages/Clients'
import Invoices  from './pages/Invoices'
import Profile from './pages/Profile'
import Projects  from './pages/Projects'
import Expenses  from './pages/Expenses'
import React, { useRef } from 'react'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const qc = useRef(new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5_000, retry: 1 },
    },
  })).current

  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clients"   element={<Clients />} />
            <Route path="invoices"  element={<Invoices />} />
            <Route path="profile"   element={<Profile />} />
            <Route path="projects"  element={<Projects />} />
            <Route path="expenses"  element={<Expenses />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
