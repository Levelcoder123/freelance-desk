import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProjects } from '../../api/projects'
import Button from '../ui/Button'

const CATEGORIES = [
  'Software', 'Hardware', 'Travel', 'Marketing',
  'Office', 'Education', 'Other',
]

const empty = {
  description: '',
  amount:      '',
  category:    'Other',
  date:        new Date().toISOString().slice(0, 10),
  projectId:   '',
  notes:       '',
}

export default function ExpenseForm({ initial = null, onSubmit, loading }) {
  const [form, setForm] = useState(initial ? {
    description: initial.description  ?? '',
    amount:      initial.amount       ?? '',
    category:    initial.category     ?? 'Other',
    date:        initial.expense_date ? initial.expense_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    projectId:   initial.project_id   ?? '',
    notes:       initial.notes        ?? '',
  } : empty)

  const [errors, setErrors] = useState({})

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects({}),
  })
  const projects = projectsData?.data ?? []

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function validate() {
    const e = {}
    if (!form.description.trim())  e.description = 'Description is required'
    if (!form.amount || isNaN(parseFloat(form.amount))) e.amount = 'Valid amount required'
    if (!form.date)                e.date = 'Date is required'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      description:  form.description,
      amount:       parseFloat(form.amount),
      category:     form.category,
      expense_date: form.date || undefined,
      notes:        form.notes || undefined,
      currency:     'USD',
    })
  }

  const err = (key) => errors[key] && (
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
          <input type="date" value={form.date} onChange={set('date')} />
          {err('date')}
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