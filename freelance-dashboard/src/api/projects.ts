import api from './client'
import { Project } from '../types'

export const getProjects   = (params: any)   => api.get('/projects', { params }).then(r => r.data)
export const getProject    = (id: string): Promise<Project> => api.get(`/projects/${id}`).then(r => r.data)
export const createProject = (data: Partial<Project>) => api.post('/projects', data).then(r => r.data)
export const updateProject = (id: string, data: Partial<Project>) => api.patch(`/projects/${id}`, data).then(r => r.data)
export const deleteProject = (id: string) => api.delete(`/projects/${id}`)
