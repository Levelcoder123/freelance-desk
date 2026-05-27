import React, { useState } from 'react'
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects'
import Modal       from '../components/ui/Modal'
import ProjectForm from '../components/forms/ProjectForm'
import Button      from '../components/ui/Button'
import { formatCurrency } from '../utils/currency'
import { Project } from '../types'

export default function Projects() {
  const { data: projectsRes, isLoading } = useProjects({})
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const projects = projectsRes?.data ?? []

  if (isLoading) return <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>

  return (
    <div className="page-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Projects</h2>
        <Button variant="primary" onClick={() => { setEditing(null); setOpen(true) }}>
          New Project
        </Button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Client</th>
              <th>Progress</th>
              <th>Budget</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.priority} priority
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{p.clientName || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--bg-subtle)', overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: '100%', width: `${p.progress}%`, background: 'var(--accent)', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>
                    {p.budget ? formatCurrency(p.budget) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${
                      p.status === 'active'    ? 'badge-success' :
                      p.status === 'completed' ? 'badge-primary' :
                      p.status === 'on_hold'   ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <Button size="sm" onClick={() => { setEditing(p); setOpen(true) }}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => {
                        if (confirm('Delete this project?')) deleteProject.mutate(p.id)
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
        <Modal.Header>{editing ? 'Edit Project' : 'New Project'}</Modal.Header>
        <Modal.Body>
          <ProjectForm
            initial={editing}
            loading={createProject.isPending || updateProject.isPending}
            onSubmit={async (data) => {
              if (editing) {
                await updateProject.mutateAsync({ id: editing.id, data: data })
              } else {
                await createProject.mutateAsync(data)
              }
              setOpen(false)
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  )
}
