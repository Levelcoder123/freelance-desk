import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import AppShell  from './components/layout/AppShell'
import React, { useState, Suspense, lazy } from 'react'

// Eagerly loaded (fastest possible First Contentful Paint for auth flows)
import Login          from './pages/Login'
import Register       from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'

// Lazy loaded (split into separate chunks, downloaded only when user accesses the route)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clients   = lazy(() => import('./pages/Clients'))
const Invoices  = lazy(() => import('./pages/Invoices'))
const Profile   = lazy(() => import('./pages/Profile'))
const Projects  = lazy(() => import('./pages/Projects'))
const Expenses  = lazy(() => import('./pages/Expenses'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// A subtle loading state while downloading the chunk
function PageFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  )
}

export default function App() {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { 
        // Increased from 5s to 30s. Reduces unnecessary background network requests.
        staleTime: 30_000, 
        retry: 1 
      },
    },
  }))

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
            <Route path="dashboard" element={<Suspense fallback={<PageFallback />}><Dashboard /></Suspense>} />
            <Route path="clients"   element={<Suspense fallback={<PageFallback />}><Clients /></Suspense>} />
            <Route path="invoices"  element={<Suspense fallback={<PageFallback />}><Invoices /></Suspense>} />
            <Route path="profile"   element={<Suspense fallback={<PageFallback />}><Profile /></Suspense>} />
            <Route path="projects"  element={<Suspense fallback={<PageFallback />}><Projects /></Suspense>} />
            <Route path="expenses"  element={<Suspense fallback={<PageFallback />}><Expenses /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
