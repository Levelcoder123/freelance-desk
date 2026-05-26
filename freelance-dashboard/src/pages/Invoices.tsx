import React, { useState } from 'react'
import {
  useInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useSendInvoice,
} from '../hooks/useInvoices'
import Modal       from '../components/ui/Modal'
import Table       from '../components/ui/Table'
import Badge       from '../components/ui/Badge'
import Button      from '../components/ui/Button'
import EmptyState  from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import InvoiceForm from '../components/forms/InvoiceForm'
import { formatCurrency } from '../utils/currency'
import { formatDate }     from '../utils/dates'
import { Invoice } from '../types'

const STATUS_FILTERS = ['all', 'draft', 'pending', 'paid', 'overdue']

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)

  // Reset to page 1 whenever filters change
  function handleSearch(val: string)  { setSearch(val);       setPage(1) }
  function handleStatus(val: string)  { setStatusFilter(val); setPage(1) }

  const params = {
    page,
    limit: 20,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
  }

  const { data, isLoading } = useInvoices(params)

  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const deleteInvoice = useDeleteInvoice()
  const sendInvoice   = useSendInvoice()

  const invoices = data?.data ?? []
  const meta     = data?.meta

  function openCreate() { setEditing(null); setOpen(true) }
  function openEdit(inv: Invoice) { setEditing(inv); setOpen(true) }

  async function handleSubmit(formData: any) {
    if (editing) {
      await updateInvoice.mutateAsync({ id: editing.id, data: formData })
    } else {
      await createInvoice.mutateAsync(formData)
    }
    setOpen(false)
  }

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (val: string | null) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{val ?? '—'}</span>
      ),
    },
    {
      key: 'clientName',
      label: 'Client',
      render: (val: string | null) => val ?? '—',
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'dueDate',
      label: 'Due',
      muted: true,
      render: (val: string | null) => val ? formatDate(val) : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => <Badge variant={val} />,
    },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (_: any, row: Invoice) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {row.status === 'draft' && (
            <Button
              size="sm"
              variant="primary"
              loading={sendInvoice.isPending && sendInvoice.variables === row.id}
              onClick={e => { e.stopPropagation(); sendInvoice.mutate(row.id) }}
            >
              Send
            </Button>
          )}
          <Button size="sm" onClick={e => { e.stopPropagation(); openEdit(row) }}>Edit</Button>
          <Button
            size="sm"
            variant="danger"
            loading={deleteInvoice.isPending && deleteInvoice.variables === row.id}
            onClick={e => { e.stopPropagation(); deleteInvoice.mutate(row.id) }}
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
        <h2 style={{ margin: 0 }}>Invoices</h2>
        <Button variant="primary" onClick={openCreate}>+ New invoice</Button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Search invoices…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: 220 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 500,
                border: '1px solid var(--border)',
                borderRadius: 99,
                background: statusFilter === s ? 'var(--text-primary)' : 'var(--bg-surface)',
                color:      statusFilter === s ? '#fff'               : 'var(--text-secondary)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description="Create your first invoice to bill a client."
          action="+ New invoice"
          onAction={openCreate}
        />
      ) : (
        <>
          <Table columns={columns} rows={invoices} onRowClick={openEdit} />
          <Pagination meta={meta} page={page} onPage={setPage} />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit invoice' : 'New invoice'}
        wide
      >
        <InvoiceForm
          initial={editing}
          loading={createInvoice.isPending || updateInvoice.isPending}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  )
}
