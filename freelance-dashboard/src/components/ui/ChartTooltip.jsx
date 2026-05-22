import { formatCurrency } from '../../utils/currency'

export function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12,
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
        {currency ? formatCurrency(payload[0].value) : payload[0].value}
      </p>
    </div>
  )
}
