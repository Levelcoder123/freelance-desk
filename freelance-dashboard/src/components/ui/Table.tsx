import React from 'react'

interface Column<T> {
  key: string;
  label: string;
  width?: string | number;
  align?: 'left' | 'right';
  muted?: boolean;
  mono?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
}

export default function Table<T extends { id?: string | number }>({ columns, rows, onRowClick }: TableProps<T>) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={col.align === 'right' ? 'right' : ''} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} onClick={() => onRowClick?.(row)}>
              {columns.map(col => (
                <td
                  key={col.key}
                  className={[
                    col.muted  ? 'muted' : '',
                    col.align === 'right' ? 'right' : '',
                    col.mono   ? 'mono'  : '',
                  ].filter(Boolean).join(' ')}
                >
                  {col.render ? col.render((row as any)[col.key], row) : ((row as any)[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
