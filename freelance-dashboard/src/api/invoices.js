import api from './client'

export const getInvoices = params => api.get('/invoices', { params }).then(r => r.data)
export const getInvoice = id => api.get(`/invoices/${id}`).then(r => r.data)
export const createInvoice = data => api.post('/invoices', data).then(r => r.data)
export const updateInvoice = (id, data) => api.patch(`/invoices/${id}`, data).then(r => r.data)
export const deleteInvoice = id => api.delete(`/invoices/${id}`)
export const sendInvoice = id => api.post(`/invoices/${id}/send`).then(r => r.data)
