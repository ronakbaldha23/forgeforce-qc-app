import type { ApiError } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export class HttpError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(status: number, body: ApiError) {
    super(body.message ?? `Request failed with status ${status}`)
    this.status = status
    this.errors = body.errors
  }
}

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

interface RequestOptions {
  method?: string
  body?: unknown
  isFormData?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  let body: BodyInit | undefined
  if (options.body instanceof FormData) {
    body = options.body
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json().catch(() => ({ message: response.statusText }))

  if (!response.ok) {
    throw new HttpError(response.status, data)
  }

  return data as T
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
}
