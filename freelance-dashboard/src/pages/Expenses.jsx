import { useState } from 'react'
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useCategorySummary,
} from '../hooks/useExpenses'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Modal       from '../components/ui/Modal'
import Table       from '../components/ui/Table'
import Badge       from '../components/ui/Badge'
import Button      from '../components/ui/Button'
import EmptyState  from '../components/ui/EmptyState'
import Pagination  from '../components/ui/Pagination'
import ExpenseForm from '../components/forms/ExpenseForm'
import { formatCurrency } from '../utils/currency'
import { formatDate }     from '../utils/dates'

const CATEGORIES = ['all', 'Software', 'Hardware', 'Travel', 'Marketing', 'Office', 'Utilities', 'Contractors', 'Other']

export default function Expenses() {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(null)

  function handleSearch(val)   { setSearch(val);          setPage(1) }
  function handleCategory(val) { setCategoryFilter(val);  setPage(1) }

  const params = {
    page,
    limit: 50,
    ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
    ...(search ? { search } : {}),
  }

  const { data, isLoading } = useExpenses(params)
  const { data: summary }   = useCategorySummary()

  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const deleteExpense = useDeleteExpense()

  const expenses  = data?.data     ?? []
  const meta      = data?.meta
  const chartData = summary?.summary ?? []
  const totalShown = data?.total ?? 0

  function openCreate() { setEditing(null); setOpen(true) }
  function openEdit(exp) { setEditing(exp); setOpen(true) }

  async function handleSubmit(formData) {
    if (editing) {
      await updateExpense.mutateAsync({ id: editing.id, data: formData })
    } else {
      await createExpense.mutateAsync(formData)
    }
    setOpen(false)
  }

  const columns = [
    {
      key: 'description',
      label: 'Description',
      render: (val) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => <Badge variant="default" label={val} />,
    },
    {
      key: 'project_name',
      label: 'Project',
      muted: true,
      render: (val) => val ?? '—',
    },
    {
      key: 'expense_date',
      label: 'Date',
      muted: true,
      render: (val) => val ? formatDate(val) : '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 600 }}>{formatCurrency(val)}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" onClick={e => { e.stopPropagation(); openEdit(row) }}>Edit</Button>
          <Button
            size="sm"
            variant="danger"
            loading={deleteExpense.isPending && deleteExpense.variables === row.id}
            onClick={e => { e.stopPropagation(); deleteExpense.mutate(row.id) }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>Expenses</h2>
        <Button variant="primary" onClick={openCreate}>+ Add expense</Button>
      </div>

      {chartData.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
              Spending by category
            </p>
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {formatCurrency(totalShown)} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="total" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Search expenses…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => handleCategory(c)}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 500,
                border: '1px solid var(--border)',
                borderRadius: 99,
                background: categoryFilter === c ? 'var(--text-primary)' : 'var(--bg-surface)',
                color:      categoryFilter === c ? '#fff'               : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Track your business expenses to stay on top of your finances."
          action="+ Add expense"
          onAction={openCreate}
        />
      ) : (
        <>
          <Table columns={columns} rows={expenses} onRowClick={openEdit} />
          <Pagination meta={meta} page={page} onPage={setPage} />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit expense' : 'New expense'}
      >
        <ExpenseForm
          initial={editing}
          loading={createExpense.isPending || updateExpense.isPending}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  )
}