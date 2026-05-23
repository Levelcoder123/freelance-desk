import api from './client'
import { User } from '../types'

export const getProfile = (): Promise<User> => api.get('/profile').then(r => r.data)
export const updateProfile = (data: Partial<User>) => api.patch('/profile', data).then(r => r.data)
export const changePassword = (data: any) => api.post('/profile/change-password', data).then(r => r.data)
