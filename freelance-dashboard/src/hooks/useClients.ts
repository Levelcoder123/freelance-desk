import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as clientsApi from '../api/clients'
import { Client } from '../types'

export const useClients = (params?: any) =>
    useQuery<{ data: Client[]; meta: any }>({
        queryKey: ['clients', params],
        queryFn: () => clientsApi.getClients(params),
    })

export const useCreateClient = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: clientsApi.createClient,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    })
}

export const useUpdateClient = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) => clientsApi.updateClient(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    })
}

export const useDeleteClient = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: clientsApi.deleteClient,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    })
}
