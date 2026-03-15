import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { KnowledgeLayout } from '@/components/knowledge/KnowledgeLayout'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'knowledge',
        element: (
          <ProtectedRoute>
            <KnowledgeLayout />
          </ProtectedRoute>
        ),
      },
      {
        path: 'knowledge/:noteId',
        element: (
          <ProtectedRoute>
            <KnowledgeLayout />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
