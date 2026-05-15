import api from './client'

export const getExpenses = (params) => api.get('/expenses', { params }).then(r => r.data)
export const getExpense = (id) => api.get(`/expenses/${id}`).then(r => r.data)
export const createExpense = (data) => api.post('/expenses', data).then(r => r.data)
export const updateExpense = (id, data) => api.patch(`/expenses/${id}`, data).then(r => r.data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)
export const getCategorySummary = () => api.get('/expenses/summary').then(r => r.data)
