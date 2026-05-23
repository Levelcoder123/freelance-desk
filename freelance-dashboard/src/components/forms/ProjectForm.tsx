import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../../api/clients'
import Button from '../ui/Button'
import { Project, Client } from '../../types'

interface ProjectFormProps {
  initial?: Partial<Project> | null;
  onSubmit: (form: any) => Promise<void>;
  loading?: boolean;
}

const empty = {
  name:        '',
  clientId:    '',
  description: '',
  status:      'active',
  budget:      '',
  dueDate:     '',
}

export default function ProjectForm({ initial = null, onSubmit, loading }: ProjectFormProps) {
  const [form, setForm] = useState(initial ? {
    name:        initial.name        ?? '',
    clientId:    initial.client_id   ?? '',
    description: initial.description ?? '',
    status:      initial.status      ?? 'active',
    budget:      String(initial.budget ?? ''),
    dueDate:     initial.deadline    ? initial.deadline.slice(0, 10) : '',
  } : empty)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: clientsData } = useQuery<{ data: Client[] }>({
    queryKey: ['clients'],
    queryFn: () => getClients({}),
  })
  const clients = clientsData?.data ?? []

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name     = 'Project name is required'
    if (!form.clientId)     e.clientId = 'Please select a client'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      client_id:   form.clientId   || undefined,
      name:        form.name,
      description: form.description || undefined,
      status:      form.status,
      budget:      form.budget ? parseFloat(form.budget) : undefined,
      deadline:    form.dueDate    || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 14 }}>
        <label>Project name</label>
        <input value={form.name} onChange={set('name')} placeholder="Website redesign" />
        {errors.name && <span style={{ fontSize: 12, color: 'var(--red)', display: 'block', marginTop: 4 }}>{errors.name}</span>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label>Client</label>
        <select value={form.clientId} onChange={set('clientId')}>
          <option value="">Select a client…</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.clientId && <span style={{ fontSize: 12, color: 'var(--red)', display: 'block', marginTop: 4 }}>{errors.clientId}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label>Status</label>
          <select value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label>Budget ($)</label>
          <input type="number" min="0" step="0.01" value={form.budget} onChange={set('budget')} placeholder="0.00" />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label>Due date</label>
        <input type="date" value={form.dueDate} onChange={set('dueDate')} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Description</label>
        <textarea
          value={form.description}
          onChange={set('description')}
          placeholder="Project details…"
          rows={3}
          style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="primary" loading={loading}>
          {initial ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  )
}
