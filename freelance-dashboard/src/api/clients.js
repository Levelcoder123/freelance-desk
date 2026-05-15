import api from './client'

export const getClients = params => api.get('/clients', { params }).then(r => r.data)
export const getClient = id => api.get(`/clients/${id}`).then(r => r.data)
export const createClient = data => api.post('/clients', data).then(r => r.data)
export const updateClient = (id, data) => api.patch(`/clients/${id}`, data).then(r => r.data)
export const deleteClient = id => api.delete(`/clients/${id}`)
