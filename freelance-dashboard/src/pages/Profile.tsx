import React, { useState, useEffect } from 'react'
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useProfile'
import { formatCurrency } from '../utils/currency'
import { PersonalInfoForm, FinancialSettingsForm, ChangePasswordForm } from '../components/forms/ProfileForms'
import { User } from '../types'

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
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

interface StatRowProps {
  label: string;
  value: string | number;
  muted?: boolean;
}

function StatRow({ label, value, muted }: StatRowProps) {
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

  // ── Form States ──────────────────────────────────────────────────
  
  const [info,  setInfo]  = useState({ fullName: '', email: '', timezone: 'UTC' })
  const [rates, setRates] = useState({ monthlyGoal: '', taxRate: '', seTaxRate: '' })
  const [pw,    setPw]    = useState({ current_password: '', new_password: '', confirm: '' })

  const [infoMsg,  setInfoMsg]  = useState<{ ok: boolean; text: string } | null>(null)
  const [ratesMsg, setRatesMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pwMsg,    setPwMsg]    = useState<{ ok: boolean; text: string } | null>(null)

  // Sync server data to local form state once loaded
  useEffect(() => {
    if (!profile) return
    setInfo({
      fullName: profile.fullName ?? '',
      email:     profile.email    ?? '',
      timezone:  profile.timezone ?? 'UTC',
    })
    setRates({
      monthlyGoal: String(profile.monthlyGoal ?? ''),
      taxRate:     String(profile.taxRate     ?? ''),
      seTaxRate:  String(profile.seTaxRate  ?? ''),
    })
  }, [profile])

  async function handleInfoSave(e: React.FormEvent) {
    e.preventDefault(); setInfoMsg(null)
    try {
      await updateProfile.mutateAsync({
          fullName: info.fullName,
          email:     info.email,
          timezone:  info.timezone
      })
      setInfoMsg({ ok: true, text: 'Saved successfully' })
    } catch (err: any) {
      setInfoMsg({ ok: false, text: err.response?.data?.error ?? 'Failed to save' })
    }
  }

  async function handleRatesSave(e: React.FormEvent) {
    e.preventDefault(); setRatesMsg(null)
    try {
      await updateProfile.mutateAsync({
        monthlyGoal: parseFloat(rates.monthlyGoal) || 0,
        taxRate:     parseFloat(rates.taxRate) || 0,
        seTaxRate:  parseFloat(rates.seTaxRate) || 0,
      })
      setRatesMsg({ ok: true, text: 'Saved successfully' })
    } catch (err: any) {
      setRatesMsg({ ok: false, text: err.response?.data?.error ?? 'Failed to save' })
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
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
    } catch (err: any) {
      setPwMsg({ ok: false, text: err.response?.data?.error ?? 'Failed to update password' })
    }
  }

  // ── Derived State (Computed during render) ──────────────────────

  const goal    = parseFloat(rates.monthlyGoal) || 0
  const taxRateVal = parseFloat(rates.taxRate)     || 0
  const seRate  = parseFloat(rates.seTaxRate)  || 0
  const incomeTax = goal * (taxRateVal / 100)
  const seTax     = goal * (seRate  / 100)
  const totalTax  = incomeTax + seTax
  const takeHome  = goal - totalTax

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>

  return (
    <div key={profile?.id}> {/* Key used to reset whole page state if profile ID changes */}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <Section title="Personal information">
            <PersonalInfoForm
              info={info}
              setInfo={setInfo}
              onSave={handleInfoSave}
              loading={updateProfile.isPending}
              message={infoMsg}
            />
          </Section>

          <Section title="Financial settings">
            <FinancialSettingsForm
              rates={rates}
              setRates={setRates}
              onSave={handleRatesSave}
              loading={updateProfile.isPending}
              message={ratesMsg}
            />
          </Section>

          <Section title="Change password">
            <ChangePasswordForm
              pw={pw}
              setPw={setPw}
              onSave={handlePasswordSave}
              loading={changePassword.isPending}
              message={pwMsg}
            />
          </Section>
        </div>

        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1.25rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {info.fullName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{info.fullName || '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{info.email}</div>
              </div>
            </div>

            <StatRow label="Plan"     value={profile?.plan ?? 'free'} />
            <StatRow label="Timezone" value={info.timezone} />
            <StatRow
              label="Member since"
              value={profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : '—'}
            />
          </div>

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
