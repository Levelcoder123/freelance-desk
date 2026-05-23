import api from './client'
import { Expense } from '../types'

export const getExpenses = (params: any) => api.get('/expenses', { params }).then(r => r.data)
export const getExpense = (id: string): Promise<Expense> => api.get(`/expenses/${id}`).then(r => r.data)
export const createExpense = (data: Partial<Expense>) => api.post('/expenses', data).then(r => r.data)
export const updateExpense = (id: string, data: Partial<Expense>) => api.patch(`/expenses/${id}`, data).then(r => r.data)
export const deleteExpense = (id: string) => api.delete(`/expenses/${id}`)
export const getCategorySummary = () => api.get('/expenses/summary').then(r => r.data)
