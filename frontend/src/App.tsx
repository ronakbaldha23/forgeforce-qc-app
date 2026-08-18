import { useEffect, useState } from 'react'
import { fetchPing, type PingResponse } from './lib/api'

type ConnectionState =
  | { status: 'loading' }
  | { status: 'connected'; data: PingResponse }
  | { status: 'error'; message: string }

function App() {
  const [connection, setConnection] = useState<ConnectionState>({ status: 'loading' })

  useEffect(() => {
    fetchPing()
      .then((data) => setConnection({ status: 'connected', data }))
      .catch((error: unknown) =>
        setConnection({
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      )
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="text-xl font-semibold text-slate-900">ForgeForce QC</h1>
        <p className="mt-1 text-sm text-slate-500">Frontend &rarr; backend connectivity check</p>

        <div className="mt-6 rounded-md border p-4 text-sm">
          {connection.status === 'loading' && (
            <span className="text-slate-500">Contacting backend&hellip;</span>
          )}
          {connection.status === 'connected' && (
            <div className="text-emerald-700">
              <p className="font-medium">✓ Connected</p>
              <p className="mt-1 text-slate-600">{connection.data.message}</p>
              <p className="mt-1 text-xs text-slate-400">{connection.data.time}</p>
            </div>
          )}
          {connection.status === 'error' && (
            <div className="text-red-700">
              <p className="font-medium">✗ Could not reach backend</p>
              <p className="mt-1 text-slate-600">{connection.message}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
