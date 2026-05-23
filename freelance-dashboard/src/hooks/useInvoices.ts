import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as invoicesApi from '../api/invoices'
import { Invoice } from '../types'

export function useInvoices(params?: any) {
    return useQuery<{ data: Invoice[]; meta: any }>({
        queryKey: ['invoices', params],
        queryFn: () => invoicesApi.getInvoices(params),
    })
}

export function useInvoice(id: string) {
    return useQuery<Invoice>({
        queryKey: ['invoices', id],
        queryFn: () => invoicesApi.getInvoice(id),
        enabled: !!id,
    })
}

export function useCreateInvoice() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: invoicesApi.createInvoice,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
    })
}

export function useUpdateInvoice() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) => invoicesApi.updateInvoice(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
    })
}

export function useDeleteInvoice() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: invoicesApi.deleteInvoice,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
    })
}

export function useSendInvoice() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: invoicesApi.sendInvoice,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
    })
}
