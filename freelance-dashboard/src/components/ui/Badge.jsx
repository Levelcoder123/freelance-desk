const CLASS_MAP = {
  draft:     'badge-draft',
  sent:      'badge-sent',
  paid:      'badge-paid',
  overdue:   'badge-overdue',
  active:    'badge-active',
  completed: 'badge-completed',
  paused:    'badge-paused',
  cancelled: 'badge-cancelled',
}

export default function Badge({ label, variant }) {
  const key = variant?.toLowerCase() ?? 'default'
  const cls = CLASS_MAP[key] ?? 'badge-default'
  return (
    <span className={`badge ${cls}`}>
      {label ?? variant}
    </span>
  )
}
