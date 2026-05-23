export const formatDate = (date: string | Date): string =>
    new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date))
