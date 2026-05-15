import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as projectsApi from '../api/projects'

export function useProjects(params) {
    return useQuery({
        queryKey: ['projects', params],
        queryFn: () => projectsApi.getProjects(params),
    })
}

export function useProject(id) {
    return useQuery({
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
        mutationFn: ({ id, data }) => projectsApi.updateProject(id, data),
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
