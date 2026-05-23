import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as projectsApi from '../api/projects'
import { Project } from '../types'

export function useProjects(params?: any) {
    return useQuery<{ data: Project[]; meta: any }>({
        queryKey: ['projects', params],
        queryFn: () => projectsApi.getProjects(params),
    })
}

export function useProject(id: string) {
    return useQuery<Project>({
        queryKey: ['projects', id],
        queryFn: () => projectsApi.getProject(id),
        enabled: !!id,
    })
}

export function useCreateProject() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: projectsApi.createProject,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    })
}

export function useUpdateProject() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => projectsApi.updateProject(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    })
}

export function useDeleteProject() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: projectsApi.deleteProject,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    })
}
