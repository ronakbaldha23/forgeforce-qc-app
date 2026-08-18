import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          ForgeForce QC
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user.name} &middot; {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 active:bg-slate-100"
            >
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
