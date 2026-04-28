import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { BuildingRequiredLayout } from '@/components/auth/building-required-layout'
import { ProtectedLayout } from '@/components/auth/protected-layout'
import { RequireGuest } from '@/components/auth/require-guest'
import { DebugOverlay } from '@/components/debug/debug-overlay'
import { AuthCallbackPage } from '@/pages/auth-callback-page'
import { FeedPage } from '@/pages/feed-page'
import { JoinBuildingPage } from '@/pages/join-building-page'
import { LoginPage } from '@/pages/login-page'
import { OnboardingAdminPage } from '@/pages/onboarding-admin-page'
import { PostDetailPage } from '@/pages/post-detail-page'
import { BuildingManagementPage } from '@/pages/building-management-page'
import { ProfilePage } from '@/pages/profile-page'
import { PostLoginRedirectPage } from '@/pages/post-login-redirect-page'

export default function App() {
  return (
    <BrowserRouter>
      <DebugOverlay />
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
            <Route path="home" element={<Navigate to="/feed" replace />} />
            <Route path="feed" element={<FeedPage mode="all" />} />
            <Route path="reports" element={<FeedPage mode="reports" />} />
            <Route path="requests" element={<FeedPage mode="requests" />} />
            <Route path="votes" element={<FeedPage mode="polls" />} />
            <Route path="post/:postId" element={<PostDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="building" element={<BuildingManagementPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
