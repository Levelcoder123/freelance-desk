import api from './client'
import { DashboardData } from '../types'

export const getStats = (): Promise<DashboardData> => api.get('/dashboard').then(r => r.data)
