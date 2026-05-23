import api from './client'
import { Invoice } from '../types'

export const getInvoices = (params: any) => api.get('/invoices', { params }).then(r => r.data)
export const getInvoice = (id: string): Promise<Invoice> => api.get(`/invoices/${id}`).then(r => r.data)
export const createInvoice = (data: Partial<Invoice>) => api.post('/invoices', data).then(r => r.data)
export const updateInvoice = (id: string, data: Partial<Invoice>) => api.patch(`/invoices/${id}`, data).then(r => r.data)
export const deleteInvoice = (id: string) => api.delete(`/invoices/${id}`)
export const sendInvoice = (id: string) => api.post(`/invoices/${id}/send`).then(r => r.data)
