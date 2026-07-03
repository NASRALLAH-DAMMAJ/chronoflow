import { useSupabase } from '../lib/SupabaseContext'
import { Card, Button } from '../design-system/components'

export default function LoginPage() {
  const { supabase } = useSupabase()

  function handleGoogleLogin() {
    supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: 'var(--clr-bg)',
    }}>
      <Card padding="var(--sp-6)" style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 'var(--fs-headline)',
          fontWeight: 700,
          color: 'var(--clr-text)',
          marginBottom: 8,
        }}>
          ChronoFlow
        </h1>
        <p style={{
          fontSize: 14,
          color: 'var(--clr-text-secondary)',
          marginBottom: 24,
          lineHeight: 1.6,
        }}>
          See where your time actually goes.
        </p>
        <Button variant="primary" onClick={handleGoogleLogin} style={{ width: '100%' }}>
          Sign in with Google
        </Button>
      </Card>
    </div>
  )
}
