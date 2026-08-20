import { http } from '../http'
import type { User } from '../../types'

export interface LoginResponse {
  user: User
  token: string
}

export const authApi = {
  login: (email: string, password: string) => http.post<LoginResponse>('/login', { email, password }),
  logout: () => http.post<void>('/logout'),
  me: () => http.get<{ data: User }>('/me').then((r) => r.data),
}
