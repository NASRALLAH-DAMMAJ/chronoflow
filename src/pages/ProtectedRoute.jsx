import { Navigate } from 'react-router-dom'
import { useSupabase } from '../lib/SupabaseContext'
import { useSessionMonitor } from '../hooks/useSessionMonitor'
import { ROUTES } from '../store/constants'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useSupabase()
  useSessionMonitor()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--clr-bg)',
        color: 'var(--clr-text-secondary)',
        fontSize: 14,
      }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return children
}
