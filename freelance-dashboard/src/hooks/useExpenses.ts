import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as expensesApi from '../api/expenses'
import { Expense } from '../types'

export function useExpenses(params?: any) {
    return useQuery<{ data: Expense[]; meta: any; summary: any; total: number }>({
        queryKey: ['expenses', params],
        queryFn: () => expensesApi.getExpenses(params),
    })
}

export function useExpense(id: string) {
    return useQuery<Expense>({
        queryKey: ['expenses', id],
        queryFn: () => expensesApi.getExpense(id),
        enabled: !!id,
    })
}

export function useCategorySummary() {
    return useQuery({
        queryKey: ['expenses', 'summary'],
        queryFn: expensesApi.getCategorySummary,
    })
}

export function useCreateExpense() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: expensesApi.createExpense,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['expenses'] })
            qc.invalidateQueries({ queryKey: ['stats'] })
        },
    })
}

export function useUpdateExpense() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) => expensesApi.updateExpense(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
    })
}

export function useDeleteExpense() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: expensesApi.deleteExpense,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['expenses'] })
            qc.invalidateQueries({ queryKey: ['stats'] })
        },
    })
}
