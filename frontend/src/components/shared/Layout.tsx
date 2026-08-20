import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '@/components/ui/button'

const ROLE_LABELS: Record<string, string> = {
  engineer: 'Engineer',
  quality_manager: 'Quality Manager',
  admin: 'Admin',
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="flex items-center justify-between border-b bg-background px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-semibold text-foreground">
          ForgeForce QC
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.name} &middot; {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <Button type="button" variant="outline" onClick={handleLogout} className="h-11">
              Log out
            </Button>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
