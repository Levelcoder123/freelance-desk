import api from './client'
import { Client } from '../types'

export const getClients = (params: any) => api.get('/clients', { params }).then(r => r.data)
export const getClient = (id: string): Promise<Client> => api.get(`/clients/${id}`).then(r => r.data)
export const createClient = (data: Partial<Client>) => api.post('/clients', data).then(r => r.data)
export const updateClient = (id: string, data: Partial<Client>) => api.patch(`/clients/${id}`, data).then(r => r.data)
export const deleteClient = (id: string) => api.delete(`/clients/${id}`)
