import React, { useState } from 'react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients'
import Modal      from '../components/ui/Modal'
import ClientForm from '../components/forms/ClientForm'
import Button     from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { Client } from '../types'

export default function Clients() {
  const { data: clientsRes, isLoading } = useClients({})
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  const clients = clientsRes?.data ?? []

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Clients</h2>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true) }}>
          New Client
        </Button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Client / Company</th>
              <th>Contact</th>
              <th>Rate</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No clients found. Create your first one!
                </td>
              </tr>
            ) : (
              clients.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.company || '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>{c.email || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.phone || ''}</div>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>
                    {c.hourlyRate ? `${formatCurrency(c.hourlyRate)}/hr` : '—'}
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Button size="sm" onClick={() => { setEditing(c); setOpen(true) }}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => {
                        if (confirm(`Delete ${c.name}? This will also delete their projects and invoices.`)) {
                          deleteClient.mutate(c.id)
                        }
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
        <Modal.Header>{editing ? 'Edit Client' : 'New Client'}</Modal.Header>
        <Modal.Body>
          <ClientForm
            initial={editing}
            loading={createClient.isPending || updateClient.isPending}
            onSubmit={async (data) => {
              try {
                if (editing) {
                  await updateClient.mutateAsync({ id: editing.id, data: data })
                } else {
                  await createClient.mutateAsync(data)
                }
                setOpen(false)
              } catch (err) {
                console.error('Failed to save client:', err)
              }
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  )
}
