import { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useProfile'
import Button from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
]

function Section({ title, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      marginBottom: '1.25rem',
    }}>
      <h3 style={{ margin: '0 0 1.25rem', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{hint}</p>}
    </div>
  )
}

function StatRow({ label, value, muted }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: muted ? 'var(--text-muted)' : 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

export default function Profile() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile  = useUpdateProfile()
  const changePassword = useChangePassword()

  const [info,  setInfo]  = useState({ full_name: '', email: '', timezone: 'UTC' })
  const [rates, setRates] = useState({ monthly_goal: '', tax_rate: '', se_tax_rate: '' })
  const [pw,    setPw]    = useState({ current_password: '', new_password: '', confirm: '' })

  const [infoMsg,  setInfoMsg]  = useState(null)
  const [ratesMsg, setRatesMsg] = useState(null)
  const [pwMsg,    setPwMsg]    = useState(null)

  useEffect(() => {
    if (!profile) return
    setInfo({
      full_name: profile.full_name ?? '',
      email:     profile.email     ?? '',
      timezone:  profile.timezone  ?? 'UTC',
    })
    setRates({
      monthly_goal: profile.monthly_goal ?? '',
      tax_rate:     profile.tax_rate     ?? '',
      se_tax_rate:  profile.se_tax_rate  ?? '',
    })
  }, [profile])

  async function handleInfoSave(e) {
    e.preventDefault(); setInfoMsg(null)
    try {
      await updateProfile.mutateAsync(info)
      setInfoMsg({ ok: true, text: 'Saved successfully' })
    } catch (err) {
      setInfoMsg({ ok: false, text: err.response?.data?.error ?? 'Failed to save' })
    }
  }

  async function handleRatesSave(e) {
    e.preventDefault(); setRatesMsg(null)
    try {
      await updateProfile.mutateAsync({
        monthly_goal: parseFloat(rates.monthly_goal),
        tax_rate:     parseFloat(rates.tax_rate),
        se_tax_rate:  parseFloat(rates.se_tax_rate),
      })
      setRatesMsg({ ok: true, text: 'Saved successfully' })
    } catch (err) {
      setRatesMsg({ ok: false, text: err.response?.data?.error ?? 'Failed to save' })
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault(); setPwMsg(null)
    if (pw.new_password !== pw.confirm) {
      setPwMsg({ ok: false, text: 'New passwords do not match' }); return
    }
    try {
      await changePassword.mutateAsync({
        current_password: pw.current_password,
        new_password:     pw.new_password,
      })
      setPwMsg({ ok: true, text: 'Password updated' })
      setPw({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwMsg({ ok: false, text: err.response?.data?.error ?? 'Failed to update password' })
    }
  }

  // Live estimates based on current rates input
  const goal    = parseFloat(rates.monthly_goal) || 0
  const taxRate = parseFloat(rates.tax_rate)     || 0
  const seRate  = parseFloat(rates.se_tax_rate)  || 0
  const incomeTax = goal * (taxRate / 100)
  const seTax     = goal * (seRate  / 100)
  const totalTax  = incomeTax + seTax
  const takeHome  = goal - totalTax

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Profile</h2>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
          textTransform: 'uppercase', padding: '3px 10px',
          borderRadius: 99, background: 'var(--accent-subtle)', color: 'var(--accent)',
        }}>
          {profile?.plan ?? 'free'} plan
        </span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Left column: forms ── */}
        <div>
          {/* Personal info */}
          <Section title="Personal information">
            <form onSubmit={handleInfoSave}>
              <Field label="Full name">
                <input
                  value={info.full_name}
                  onChange={e => setInfo(p => ({ ...p, full_name: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={info.email}
                  onChange={e => setInfo(p => ({ ...p, email: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </Field>
              <Field label="Timezone">
                <select
                  value={info.timezone}
                  onChange={e => setInfo(p => ({ ...p, timezone: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </Field>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.25rem' }}>
                <Button type="submit" variant="primary" loading={updateProfile.isPending}>
                  Save changes
                </Button>
                {infoMsg && (
                  <span style={{ fontSize: 12, color: infoMsg.ok ? 'var(--success)' : 'var(--danger)' }}>
                    {infoMsg.text}
                  </span>
                )}
              </div>
            </form>
          </Section>

          {/* Financial settings */}
          <Section title="Financial settings">
            <form onSubmit={handleRatesSave}>
              <Field label="Monthly revenue goal ($)" hint="Used for the dashboard progress indicator">
                <input
                  type="number" min="0"
                  value={rates.monthly_goal}
                  onChange={e => setRates(p => ({ ...p, monthly_goal: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Income tax rate (%)" hint="Applied to earnings">
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={rates.tax_rate}
                    onChange={e => setRates(p => ({ ...p, tax_rate: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </Field>
                <Field label="Self-employment tax (%)" hint="Typically 15.3% in the US">
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={rates.se_tax_rate}
                    onChange={e => setRates(p => ({ ...p, se_tax_rate: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.25rem' }}>
                <Button type="submit" variant="primary" loading={updateProfile.isPending}>
                  Save changes
                </Button>
                {ratesMsg && (
                  <span style={{ fontSize: 12, color: ratesMsg.ok ? 'var(--success)' : 'var(--danger)' }}>
                    {ratesMsg.text}
                  </span>
                )}
              </div>
            </form>
          </Section>

          {/* Change password */}
          <Section title="Change password">
            <form onSubmit={handlePasswordSave}>
              <Field label="Current password">
                <input
                  type="password"
                  value={pw.current_password}
                  onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))}
                  style={{ width: '100%' }}
                  autoComplete="current-password"
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="New password" hint="Minimum 8 characters">
                  <input
                    type="password"
                    value={pw.new_password}
                    onChange={e => setPw(p => ({ ...p, new_password: e.target.value }))}
                    style={{ width: '100%' }}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    type="password"
                    value={pw.confirm}
                    onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                    style={{ width: '100%' }}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '1.25rem' }}>
                <Button type="submit" variant="primary" loading={changePassword.isPending}>
                  Update password
                </Button>
                {pwMsg && (
                  <span style={{ fontSize: 12, color: pwMsg.ok ? 'var(--success)' : 'var(--danger)' }}>
                    {pwMsg.text}
                  </span>
                )}
              </div>
            </form>
          </Section>
        </div>

        {/* ── Right column: summary ── */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>

          {/* Account card */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1.25rem',
          }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {info.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{info.full_name || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{info.email}</div>
              </div>
            </div>

            <StatRow label="Plan"     value={profile?.plan ?? 'free'} />
            <StatRow label="Timezone" value={info.timezone} />
            <StatRow
              label="Member since"
              value={profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : '—'}
            />
          </div>

          {/* Tax estimate card */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>
              Monthly estimate
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: 11, color: 'var(--text-muted)' }}>
              Based on your current goal and tax rates
            </p>

            <StatRow label="Revenue goal"    value={formatCurrency(goal)} />
            <StatRow label="Income tax"      value={`− ${formatCurrency(incomeTax)}`} muted />
            <StatRow label="SE tax"          value={`− ${formatCurrency(seTax)}`}     muted />

            {/* Take-home highlight */}
            <div style={{
              marginTop: '1rem',
              padding: '12px 14px',
              background: 'var(--accent-subtle)',
              borderRadius: 'var(--radius)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                Est. take-home
              </span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                {formatCurrency(takeHome)}
              </span>
            </div>

            <p style={{ margin: '10px 0 0', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              This is an estimate only. Consult a tax professional for accurate figures.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}