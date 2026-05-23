import React from 'react'

interface PaginationMeta {
  total: number;
  limit: number;
  page: number;
}

interface PaginationProps {
  meta: PaginationMeta | null | undefined;
  page: number;
  onPage: (page: number) => void;
}

export default function Pagination({ meta, page, onPage }: PaginationProps) {
  if (!meta || meta.total <= meta.limit) return null

  const totalPages = Math.ceil(meta.total / meta.limit)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '1rem',
      fontSize: 13,
      color: 'var(--text-secondary)',
    }}>
      <span>
        {(page - 1) * meta.limit + 1}–{Math.min(page * meta.limit, meta.total)} of {meta.total}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          style={{
            padding: '5px 12px',
            fontSize: 12,
            border: '1px solid var(--border)',
            borderRadius: 6,
            background: 'var(--bg-surface)',
            color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: page <= 1 ? 'default' : 'pointer',
          }}
        >
          ← Prev
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          style={{
            padding: '5px 12px',
            fontSize: 12,
            border: '1px solid var(--border)',
            borderRadius: 6,
            background: 'var(--bg-surface)',
            color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: page >= totalPages ? 'default' : 'pointer',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
