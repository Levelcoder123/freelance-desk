import React, { useState } from 'react'
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../hooks/useProjects'
import Modal       from '../components/ui/Modal'
import Table       from '../components/ui/Table'
import Badge       from '../components/ui/Badge'
import Button      from '../components/ui/Button'
import EmptyState  from '../components/ui/EmptyState'
import Pagination  from '../components/ui/Pagination'
import ProjectForm from '../components/forms/ProjectForm'
import { formatCurrency } from '../utils/currency'
import { formatDate }     from '../utils/dates'
import { Project } from '../types'

const STATUS_FILTERS = ['all', 'active', 'paused', 'completed', 'cancelled']

export default function Projects() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  function handleSearch(val: string)  { setSearch(val);       setPage(1) }
  function handleStatus(val: string)  { setStatusFilter(val); setPage(1) }

  const params = {
    page,
    limit: 20,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
  }

  const { data, isLoading } = useProjects(params)
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const projects = data?.data ?? []
  const meta     = data?.meta

  function openCreate() { setEditing(null); setOpen(true) }
  function openEdit(proj: Project) { setEditing(proj); setOpen(true) }

  async function handleSubmit(formData: any) {
    if (editing) {
      await updateProject.mutateAsync({ id: editing.id, data: formData })
    } else {
      await createProject.mutateAsync(formData)
    }
    setOpen(false)
  }

  const columns = [
    {
      key: 'name',
      label: 'Project',
      render: (val: string) => <span style={{ fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'client',
      label: 'Client',
      muted: true,
      render: (_: any, row: Project) => row.client_name ?? '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val: string) => <Badge variant={val} />,
    },
    {
      key: 'budget',
      label: 'Budget',
      align: 'right' as const,
      muted: true,
      render: (val: number | null) => val ? formatCurrency(val) : '—',
    },
    {
      key: 'deadline',
      label: 'Due',
      muted: true,
      render: (val: string | null) => val ? formatDate(val) : '—',
    },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (_: any, row: Project) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <Button size="sm" onClick={e => { e.stopPropagation(); openEdit(row) }}>Edit</Button>
          <Button
            size="sm"
            variant="danger"
            loading={deleteProject.isPending && deleteProject.variables === row.id}
            onClick={e => { e.stopPropagation(); deleteProject.mutate(row.id) }}
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
        <h2 style={{ margin: 0 }}>Projects</h2>
        <Button variant="primary" onClick={openCreate}>+ New project</Button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Search projects…"
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
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Start by creating your first project and linking it to a client."
          action="+ New project"
          onAction={openCreate}
        />
      ) : (
        <>
          <Table columns={columns} rows={projects} onRowClick={openEdit} />
          <Pagination meta={meta} page={page} onPage={setPage} />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit project' : 'New project'}
      >
        <ProjectForm
          initial={editing}
          loading={createProject.isPending || updateProject.isPending}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  )
}
