import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { FeedPage } from '@/pages/feed-page'
import { PlaceholderPage } from '@/pages/placeholder-page'
import { PostDetailPage } from '@/pages/post-detail-page'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/votes" element={<PlaceholderPage title="הצבעות" />} />
        <Route path="/reports" element={<PlaceholderPage title="דיווחים" />} />
        <Route path="/profile" element={<PlaceholderPage title="פרופיל" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
