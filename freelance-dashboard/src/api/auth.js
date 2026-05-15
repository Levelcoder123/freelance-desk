import api from './client'

const normalizeAuth = data => ({
    ...data,
    accessToken: data.accessToken || data.access_token,
    refreshToken: data.refreshToken || data.refresh_token,
})

export const login = creds => api.post('/auth/login', creds).then(r => normalizeAuth(r.data))
export const register = data => api.post('/auth/register', data).then(r => normalizeAuth(r.data))
export const forgotPassword = email => api.post('/auth/forgot-password', { email }).then(r => r.data)
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password }).then(r => r.data)
export const me = () => api.get('/auth/me').then(r => r.data)
export const logout = () => api.post('/auth/logout')
