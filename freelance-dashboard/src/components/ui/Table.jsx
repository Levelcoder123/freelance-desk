export default function Table({ columns, rows, onRowClick }) {
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
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
