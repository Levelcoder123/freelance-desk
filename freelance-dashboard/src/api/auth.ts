import api from './client'
import { AuthResponse, NormalizedAuth, User } from '../types'

const normalizeAuth = (data: AuthResponse): NormalizedAuth => ({
    user: data.user,
    accessToken: (data.accessToken || data.access_token) as string,
    refreshToken: (data.refreshToken || data.refresh_token) as string,
})

export const login = (creds: any) => api.post('/auth/login', creds).then(r => normalizeAuth(r.data))
export const register = (data: any) => api.post('/auth/register', data).then(r => normalizeAuth(r.data))
export const forgotPassword = (email: string) => api.post('/auth/forgot-password', { email }).then(r => r.data)
export const resetPassword = (token: string, password: string) => api.post('/auth/reset-password', { token, password }).then(r => r.data)
export const me = (): Promise<User> => api.get('/profile').then(r => r.data)
export const logout = () => api.post('/auth/logout')
