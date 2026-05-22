import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getClients } from '../../api/clients'
import Button from '../ui/Button'
import { InvoiceLineItems } from './InvoiceLineItems'

const emptyItem = () => ({ description: '', quantity: 1, rate: '', amount: 0 })

const emptyForm = () => ({
  clientId:  '',
  dueDate:   '',
  notes:     '',
  status:    'draft',
  items:     [emptyItem()],
})

export default function InvoiceForm({ initial = null, onSubmit, loading }) {
  const [form, setForm] = useState(() => {
    if (!initial) return emptyForm()
    return {
      clientId: initial.client_id ?? '',
      dueDate:  initial.due_date  ? initial.due_date.slice(0, 10) : '',
      notes:    initial.notes    ?? '',
      status:   initial.status    ?? 'draft',
      items:    initial.line_items?.length ? initial.line_items.map(i => ({
        description: i.description ?? '',
        quantity:    i.quantity    ?? 1,
        rate:        i.rate        ?? '',
        amount:      (i.quantity ?? 1) * (i.rate ?? 0),
      })) : [emptyItem()],
    }
  })

  const [errors, setErrors] = useState({})

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients({}),
  })
  const clients = clientsData?.data ?? []

  function setField(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function setItem(index, field, value) {
    setForm(f => {
      const items = f.items.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        updated.amount = parseFloat(updated.quantity || 0) * parseFloat(updated.rate || 0)
        return updated
      })
      return { ...f, items }
    })
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, emptyItem()] }))
  }

  function removeItem(index) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }))
  }

  const subtotal = form.items.reduce((sum, it) => sum + (it.amount || 0), 0)

  function validate() {
    const e = {}
    if (!form.clientId)   e.clientId = 'Please select a client'
    if (!form.dueDate)    e.dueDate  = 'Due date is required'
    if (form.items.every(it => !it.description.trim())) e.items = 'Add at least one line item'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    const lineItems = form.items
      .filter(it => it.description.trim())
      .map(it => ({
        description: it.description,
        quantity:    parseFloat(it.quantity) || 1,
        rate:        parseFloat(it.rate)     || 0,
        amount:      (parseFloat(it.quantity) || 1) * (parseFloat(it.rate) || 0),
      }))

    const amount = lineItems.reduce((sum, it) => sum + it.amount, 0)

     onSubmit({
      client_id:      form.clientId  || undefined,
      issue_date:     new Date().toISOString().slice(0, 10),
      due_date:       form.dueDate   || undefined,
      notes:          form.notes     || undefined,
      line_items:     lineItems,
      amount,
      invoice_number: `INV-${Date.now()}`,
      status:         form.status,
      currency:       'USD',
      tax_rate:       0,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <label>Client</label>
          <select value={form.clientId} onChange={setField('clientId')}>
            <option value="">Select a client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.clientId && <span style={{ fontSize: 12, color: 'var(--red)', display: 'block', marginTop: 4 }}>{errors.clientId}</span>}
        </div>
        <div>
          <label>Due date</label>
          <input type="date" value={form.dueDate} onChange={setField('dueDate')} />
          {errors.dueDate && <span style={{ fontSize: 12, color: 'var(--red)', display: 'block', marginTop: 4 }}>{errors.dueDate}</span>}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label>Line items</label>
        <InvoiceLineItems
          items={form.items}
          onSetItem={setItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          subtotal={subtotal}
        />
        {errors.items && <span style={{ fontSize: 12, color: 'var(--red)', display: 'block', marginTop: 4 }}>{errors.items}</span>}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label>Status</label>
        <select value={form.status} onChange={setField('status')}>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Notes</label>
        <textarea
          value={form.notes}
          onChange={setField('notes')}
          placeholder="Payment terms, bank details…"
          rows={2}
          style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="primary" loading={loading}>
          {initial ? 'Save changes' : 'Create invoice'}
        </Button>
      </div>
    </form>
  )
}
