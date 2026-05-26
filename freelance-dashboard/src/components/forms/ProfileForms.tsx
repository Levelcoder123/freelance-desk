import React from 'react'
import Button from '../ui/Button'

interface Message {
  text: string;
  ok: boolean;
}

interface PersonalInfoFormProps {
  info: any;
  setInfo: React.Dispatch<React.SetStateAction<any>>;
  onSave: (e: React.FormEvent) => void;
  loading: boolean;
  message: Message | null;
}

export function PersonalInfoForm({ info, setInfo, onSave, loading, message }: PersonalInfoFormProps) {
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
          value={info.fullName ?? ''}
          onChange={e => setInfo((p: any) => ({ ...p, fullName: e.target.value }))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Email
        </label>
        <input
          type="email"
          value={info.email ?? ''}
          onChange={e => setInfo((p: any) => ({ ...p, email: e.target.value }))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Timezone
        </label>
        <select
          value={info.timezone ?? 'UTC'}
          onChange={e => setInfo((p: any) => ({ ...p, timezone: e.target.value }))}
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

interface FinancialSettingsFormProps {
  rates: any;
  setRates: React.Dispatch<React.SetStateAction<any>>;
  onSave: (e: React.FormEvent) => void;
  loading: boolean;
  message: Message | null;
}

export function FinancialSettingsForm({ rates, setRates, onSave, loading, message }: FinancialSettingsFormProps) {
  return (
    <form onSubmit={onSave}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Monthly revenue goal ($)
        </label>
        <input
          type="number" min="0"
          value={rates.monthlyGoal ?? ''}
          onChange={e => setRates((p: any) => ({ ...p, monthlyGoal: e.target.value }))}
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
            value={rates.taxRate ?? ''}
            onChange={e => setRates((p: any) => ({ ...p, taxRate: e.target.value }))}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Self-employment tax (%)
          </label>
          <input
            type="number" min="0" max="100" step="0.1"
            value={rates.seTaxRate ?? ''}
            onChange={e => setRates((p: any) => ({ ...p, seTaxRate: e.target.value }))}
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

interface ChangePasswordFormProps {
  pw: any;
  setPw: React.Dispatch<React.SetStateAction<any>>;
  onSave: (e: React.FormEvent) => void;
  loading: boolean;
  message: Message | null;
}

export function ChangePasswordForm({ pw, setPw, onSave, loading, message }: ChangePasswordFormProps) {
  return (
    <form onSubmit={onSave}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Current password
        </label>
        <input
          type="password"
          value={pw.current_password}
          onChange={e => setPw((p: any) => ({ ...p, current_password: e.target.value }))}
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
            onChange={e => setPw((p: any) => ({ ...p, new_password: e.target.value }))}
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
            onChange={e => setPw((p: any) => ({ ...p, confirm: e.target.value }))}
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
