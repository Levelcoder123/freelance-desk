import React, { useState } from 'react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients'
import Modal      from '../components/ui/Modal'
import ClientForm from '../components/forms/ClientForm'
import Table      from '../components/ui/Table'
import Button     from '../components/ui/Button'
import { Client } from '../types'

export default function Clients() {
  const [search, setSearch]     = useState('')
  const [open, setOpen]         = useState(false)
  const [editing, setEditing]   = useState<Client | null>(null)

  const { data, isLoading }  = useClients({ search })
  const createClient         = useCreateClient()
  const updateClient         = useUpdateClient()
  const deleteClient         = useDeleteClient()

  const clients = data?.data ?? []

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val: string) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      muted: true,
    },
    {
      key: 'company',
      label: 'Company',
      muted: true,
      render: (val: string | null) => val ?? '—',
    },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (_: any, row: Client) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" onClick={e => { e.stopPropagation(); setEditing(row); setOpen(true) }}>Edit</Button>
          <Button
            size="sm"
            variant="danger"
            loading={deleteClient.isPending && deleteClient.variables === row.id}
            onClick={e => { e.stopPropagation(); deleteClient.mutate(row.id) }}
          >Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 500, margin: 0 }}>Clients</h2>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true) }}>
          + Add client
        </Button>
      </div>

      <input
        placeholder="Search clients…" value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '1rem', width: 280 }}
      />

      {isLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading…</p>
      ) : clients.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>No clients yet.</p>
      ) : (
        <Table columns={columns} rows={clients} onRowClick={(c) => { setEditing(c); setOpen(true) }} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit client' : 'New client'}>
        <ClientForm
            initial={editing}
            loading={editing ? updateClient.isPending : createClient.isPending}
            onSubmit={async data => {
              try {
                if (editing) {
                  await updateClient.mutateAsync({ id: editing.id, data })
                } else {
                  await createClient.mutateAsync(data)
                }
                setOpen(false)
              } catch (err) {
                console.error('Failed to save client:', err)
              }
            }}
            />
      </Modal>
    </div>
  )
}
