import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store'

export default function CallbackPage() {
  const navigate = useNavigate() /* to navigate from pages */
  const location = useLocation() /* reads the current URL to grab the ?token= and ?refresh= from it */
  const setTokens = useStore((s) => s.setTokens)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const refresh = params.get('refresh')

    if (token) {
      setTokens(token, refresh || '')
      navigate('/playlists')
    } else {
      navigate('/')
    }
  }, [location])

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'sans-serif' }}>
      <p>Logging you in...</p>
    </div>
  )
}
