import React, { useState } from 'react'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCategorySummary,
} from '../hooks/useExpenses'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Modal       from '../components/ui/Modal'
import ExpenseForm from '../components/forms/ExpenseForm'
import Button      from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { Expense } from '../types'

export default function Expenses() {
  const { data: expensesRes, isLoading } = useExpenses({})
  const { data: summary } = useCategorySummary()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const expenses = expensesRes?.data ?? []

  const handleSubmit = async (data: any) => {
    try {
      if (editing) {
        await updateExpense.mutateAsync({ id: editing.id, data: data })
      } else {
        await createExpense.mutateAsync(data)
      }
      setOpen(false)
    } catch (err) {
      console.error('Failed to save expense:', err)
    }
  }

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Expenses</h2>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true) }}>
          New Expense
        </Button>
      </div>

      {/* Chart Section */}
      {summary && summary.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: 14, fontWeight: 600 }}>Spending by category</h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary}>
                <XAxis dataKey="category" hide />
                <YAxis hide />
                <Tooltip 
                  formatter={(val: number) => formatCurrency(val)}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-lg)' }}
                />
                <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Description / Project</th>
              <th>Category</th>
              <th>Date</th>
              <th>Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No expenses recorded.
                </td>
              </tr>
            ) : (
              expenses.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.projectName || 'General'}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                      {e.category}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {new Date(e.expenseDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>
                    − {formatCurrency(e.amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Button size="sm" onClick={() => { setEditing(e); setOpen(true) }}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => {
                        if (confirm('Delete this expense?')) deleteExpense.mutate(e.id)
                      }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Modal.Header>{editing ? 'Edit Expense' : 'New Expense'}</Modal.Header>
        <Modal.Body>
          <ExpenseForm
            initial={editing}
            loading={createExpense.isPending || updateExpense.isPending}
            onSubmit={handleSubmit}
          />
        </Modal.Body>
      </Modal>
    </div>
  )
}
