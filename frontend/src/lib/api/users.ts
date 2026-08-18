import { http } from '../http'
import type { User } from '../../types'

export const usersApi = {
  list: () => http.get<{ data: User[] }>('/users').then((r) => r.data),
}
