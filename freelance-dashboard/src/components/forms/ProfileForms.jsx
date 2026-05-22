import Button from '../ui/Button'

export function PersonalInfoForm({ info, setInfo, onSave, loading, message }) {
  const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
    'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
  ]

  return (
    <form onSubmit={onSave}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Full name
        </label>
        <input
          value={info.full_name}
          onChange={e => setInfo(p => ({ ...p, full_name: e.target.value }))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Email
        </label>
        <input
          type="email"
          value={info.email}
          onChange={e => setInfo(p => ({ ...p, email: e.target.value }))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Timezone
        </label>
        <select
          value={info.timezone}
          onChange={e => setInfo(p => ({ ...p, timezone: e.target.value }))}
          style={{ width: '100%' }}
        >
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.25rem' }}>
        <Button type="submit" variant="primary" loading={loading}>
          Save changes
        </Button>
        {message && (
          <span style={{ fontSize: 12, color: message.ok ? 'var(--success)' : 'var(--danger)' }}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}

export function FinancialSettingsForm({ rates, setRates, onSave, loading, message }) {
  return (
    <form onSubmit={onSave}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Monthly revenue goal ($)
        </label>
        <input
          type="number" min="0"
          value={rates.monthly_goal}
          onChange={e => setRates(p => ({ ...p, monthly_goal: e.target.value }))}
          style={{ width: '100%' }}
        />
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
          Used for the dashboard progress indicator
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Income tax rate (%)
          </label>
          <input
            type="number" min="0" max="100" step="0.1"
            value={rates.tax_rate}
            onChange={e => setRates(p => ({ ...p, tax_rate: e.target.value }))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Self-employment tax (%)
          </label>
          <input
            type="number" min="0" max="100" step="0.1"
            value={rates.se_tax_rate}
            onChange={e => setRates(p => ({ ...p, se_tax_rate: e.target.value }))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.25rem' }}>
        <Button type="submit" variant="primary" loading={loading}>
          Save changes
        </Button>
        {message && (
          <span style={{ fontSize: 12, color: message.ok ? 'var(--success)' : 'var(--danger)' }}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}

export function ChangePasswordForm({ pw, setPw, onSave, loading, message }) {
  return (
    <form onSubmit={onSave}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Current password
        </label>
        <input
          type="password"
          value={pw.current_password}
          onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))}
          style={{ width: '100%' }}
          autoComplete="current-password"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            New password
          </label>
          <input
            type="password"
            value={pw.new_password}
            onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))}
            style={{ width: '100%' }}
            autoComplete="new-password"
          />
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Minimum 8 characters
          </p>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Confirm new password
          </label>
          <input
            type="password"
            value={pw.confirm}
            onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
            style={{ width: '100%' }}
            autoComplete="new-password"
          />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.25rem' }}>
        <Button type="submit" variant="primary" loading={loading}>
          Update password
        </Button>
        {message && (
          <span style={{ fontSize: 12, color: message.ok ? 'var(--success)' : 'var(--danger)' }}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}
