const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export interface PingResponse {
  status: string
  message: string
  time: string
}

export async function fetchPing(): Promise<PingResponse> {
  const response = await fetch(`${API_BASE_URL}/ping`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Backend responded with ${response.status}`)
  }

  return response.json()
}
