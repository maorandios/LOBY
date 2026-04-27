import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { BuildingRequiredLayout } from '@/components/auth/building-required-layout'
import { ProtectedLayout } from '@/components/auth/protected-layout'
import { RequireGuest } from '@/components/auth/require-guest'
import { AuthCallbackPage } from '@/pages/auth-callback-page'
import { FeedPage } from '@/pages/feed-page'
import { HomePage } from '@/pages/home-page'
import { JoinBuildingPage } from '@/pages/join-building-page'
import { LoginPage } from '@/pages/login-page'
import { OnboardingAdminPage } from '@/pages/onboarding-admin-page'
import { PlaceholderPage } from '@/pages/placeholder-page'
import { PostDetailPage } from '@/pages/post-detail-page'
import { PostLoginRedirectPage } from '@/pages/post-login-redirect-page'

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
          <Route index element={<PostLoginRedirectPage />} />
          <Route path="join/:inviteCode" element={<JoinBuildingPage />} />
          <Route path="onboarding/admin" element={<OnboardingAdminPage />} />
          <Route element={<BuildingRequiredLayout />}>
            <Route path="home" element={<HomePage />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="post/:postId" element={<PostDetailPage />} />
            <Route path="votes" element={<PlaceholderPage title="סקרים" />} />
            <Route path="reports" element={<PlaceholderPage title="דיווחים" />} />
            <Route path="profile" element={<PlaceholderPage title="פרופיל" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
