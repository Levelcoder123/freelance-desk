import React, { useState } from 'react'
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice, useSendInvoice } from '../hooks/useInvoices'
import Modal       from '../components/ui/Modal'
import InvoiceForm from '../components/forms/InvoiceForm'
import Button      from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { Invoice } from '../types'

export default function Invoices() {
  const { data: invoicesRes, isLoading } = useInvoices({})
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const deleteInvoice = useDeleteInvoice()
  const sendInvoice   = useSendInvoice()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)

  const invoices = invoicesRes?.data ?? []

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Invoices</h2>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true) }}>
          New Invoice
        </Button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {inv.invoiceNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{inv.clientName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.projectName || '—'}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td>
                    <span className={`badge ${
                      inv.status === 'paid'    ? 'badge-success' :
                      inv.status === 'pending' ? 'badge-warning' :
                      inv.status === 'overdue' ? 'badge-danger'  : 'badge-neutral'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {inv.status === 'draft' && (
                        <Button size="sm" onClick={() => sendInvoice.mutate(inv.id)}>Send</Button>
                      )}
                      <Button size="sm" onClick={() => { setEditing(inv); setOpen(true) }}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => {
                        if (confirm('Delete this invoice?')) deleteInvoice.mutate(inv.id)
                      }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} wide>
        <Modal.Header>{editing ? 'Edit Invoice' : 'New Invoice'}</Modal.Header>
        <Modal.Body>
          <InvoiceForm
            initial={editing}
            loading={createInvoice.isPending || updateInvoice.isPending}
            onSubmit={async (data) => {
              if (editing) {
                await updateInvoice.mutateAsync({ id: editing.id, data: data })
              } else {
                await createInvoice.mutateAsync(data)
              }
              setOpen(false)
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  )
}
