import api from './client'

export const getStats = () => api.get('/dashboard').then(r => r.data)
