import React, { useState } from 'react'
import Button from '../ui/Button'
import { Client } from '../../types'

interface ClientFormProps {
  initial?: Partial<Client> | null;
  onSubmit: (form: any) => Promise<void>;
  loading?: boolean;
}

const empty = { name: '', email: '', phone: '', company: '', address: '', hourlyRate: '' }

export default function ClientForm({ initial = null, onSubmit, loading }: ClientFormProps) {
  const [form, setForm] = useState(initial ? {
    name:       initial.name       ?? '',
    email:      initial.email      ?? '',
    phone:      initial.phone      ?? '',
    company:    initial.company    ?? '',
    address:    initial.address    ?? '',
    hourlyRate: String(initial.hourlyRate ?? ''),
  } : empty)

  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())                   e.name  = 'Name is required'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    
    const payload = {
        ...form,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null
    }
    await onSubmit(payload)
  }

  const field = (label: string, key: keyof typeof empty, opts: any = {}) => (
    <div style={{ marginBottom: 14 }}>
      <label>{label}</label>
      <input
        type={opts.type ?? 'text'}
        value={(form as any)[key]}
        onChange={set(key)}
        placeholder={opts.placeholder ?? ''}
        required={opts.required}
      />
      {errors[key] && (
        <span style={{ fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }}>
          {errors[key]}
        </span>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      {field('Name', 'name', { required: true, placeholder: 'Jane Smith' })}
      {field('Email', 'email', { type: 'email', placeholder: 'jane@example.com' })}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {field('Phone', 'phone', { type: 'tel', placeholder: '+1 555 000 0000' })}
        {field('Hourly rate ($)', 'hourlyRate', { type: 'number', placeholder: '0.00' })}
      </div>

      {field('Company', 'company', { placeholder: 'Acme Inc.' })}
      
      <div style={{ marginBottom: 20 }}>
        <label>Address</label>
        <textarea
          value={form.address}
          onChange={set('address')}
          placeholder="123 Main St, City, Country"
          rows={3}
          style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
        />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button type="submit" variant="primary" loading={loading}>
          {initial ? 'Save changes' : 'Add client'}
        </Button>
      </div>
    </form>
  )
}
