import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import CallbackPage from './pages/CallbackPage'
import PlaylistSelectionPage from './pages/PlaylistSelectionPage'
import OptionsPage from './pages/OptionsPage'
import GeneratingPage from './pages/GeneratingPage'
import ReviewPage from './pages/ReviewPage'
import { useStore } from './store'
// This is basically what main uses to bootstrap. defines all routes and which page is protected. 
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // If the user hasn't logged in yet (no token), send them back to login
  const accessToken = useStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/" replace />
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<AuthPage />} />
      <Route path="/callback" element={<CallbackPage />} />

      {/* Protected, only accessible after login */}
      <Route path="/playlists" element={<ProtectedRoute><PlaylistSelectionPage /></ProtectedRoute>} />
      <Route path="/options"   element={<ProtectedRoute><OptionsPage /></ProtectedRoute>} />
      <Route path="/generating" element={<ProtectedRoute><GeneratingPage /></ProtectedRoute>} />
      <Route path="/review"   element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />

      {/* Catch-all, any unknown URL goes to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
