import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProjects } from '../../api/projects'
import Button from '../ui/Button'
import { Expense, Project } from '../../types'

const CATEGORIES = [
  'Software', 'Hardware', 'Travel', 'Marketing',
  'Office', 'Education', 'Other',
] as const;

interface ExpenseFormProps {
  initial?: Partial<Expense> | null;
  onSubmit: (form: any) => Promise<void>;
  loading?: boolean;
}

const empty = {
  description: '',
  amount:      '',
  category:    'Other',
  expenseDate: new Date().toISOString().slice(0, 10),
  projectId:   '',
  notes:       '',
}

export default function ExpenseForm({ initial = null, onSubmit, loading }: ExpenseFormProps) {
  const [form, setForm] = useState(initial ? {
    description: initial.description  ?? '',
    amount:      String(initial.amount ?? ''),
    category:    initial.category     ?? 'Other',
    expenseDate: initial.expenseDate  ? initial.expenseDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    projectId:   initial.projectId    ?? '',
    notes:       initial.notes        ?? '',
  } : empty)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: projectsData } = useQuery<{ data: Project[] }>({
    queryKey: ['projects'],
    queryFn: () => getProjects({}),
  })
  const projects = projectsData?.data ?? []

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.description.trim())  e.description = 'Description is required'
    if (!form.amount || isNaN(parseFloat(form.amount))) e.amount = 'Valid amount required'
    if (!form.expenseDate)         e.expenseDate = 'Date is required'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      description: form.description,
      amount:      parseFloat(form.amount),
      category:    form.category,
      expenseDate: form.expenseDate,
      projectId:   form.projectId || null,
      notes:       form.notes     || null,
      currency:    'USD',
    })
  }

  const err = (key: string) => errors[key] && (
    <span style={{ fontSize: 12, color: 'var(--red)', display: 'block', marginTop: 4 }}>{errors[key]}</span>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 14 }}>
        <label>Description</label>
        <input value={form.description} onChange={set('description')} placeholder="Adobe CC subscription" />
        {err('description')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label>Amount ($)</label>
          <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} placeholder="0.00" />
          {err('amount')}
        </div>
        <div>
          <label>Date</label>
          <input type="date" value={form.expenseDate} onChange={set('expenseDate')} />
          {err('expenseDate')}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label>Category</label>
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Project (optional)</label>
          <select value={form.projectId} onChange={set('projectId')}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          placeholder="Optional notes…"
          rows={2}
          style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="primary" loading={loading}>
          {initial ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  )
}
