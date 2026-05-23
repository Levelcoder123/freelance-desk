export const formatCurrency = (amount: number | null, currency: string = 'USD'): string =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount ?? 0)
