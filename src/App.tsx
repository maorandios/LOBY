import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedLayout } from '@/components/auth/protected-layout'
import { RequireGuest } from '@/components/auth/require-guest'
import { AuthCallbackPage } from '@/pages/auth-callback-page'
import { FeedPage } from '@/pages/feed-page'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { PlaceholderPage } from '@/pages/placeholder-page'
import { PostDetailPage } from '@/pages/post-detail-page'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="post/:postId" element={<PostDetailPage />} />
          <Route path="votes" element={<PlaceholderPage title="סקרים" />} />
          <Route path="reports" element={<PlaceholderPage title="דיווחים" />} />
          <Route path="profile" element={<PlaceholderPage title="פרופיל" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
