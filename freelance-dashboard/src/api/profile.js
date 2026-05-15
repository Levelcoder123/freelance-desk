import api from './client'

export const getProfile = () => api.get('/profile').then(r => r.data)
export const updateProfile = (data) => api.patch('/profile', data).then(r => r.data)
export const changePassword = (data) => api.post('/profile/change-password', data).then(r => r.data)
