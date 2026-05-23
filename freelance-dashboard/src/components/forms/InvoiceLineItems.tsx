import React from 'react'
import { formatCurrency } from '../../utils/currency'
import { InvoiceLineItem } from '../../types'

interface InvoiceLineItemsProps {
  items: InvoiceLineItem[];
  onSetItem: (index: number, field: keyof InvoiceLineItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  subtotal: number;
}

export function InvoiceLineItems({ items, onSetItem, onAddItem, onRemoveItem, subtotal }: InvoiceLineItemsProps) {
  const colStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '6px 8px'
  }
  const inputStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    padding: '6px 8px',
    borderRadius: 0,
    fontSize: 13,
    width: '100%'
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: 'var(--bg-subtle)' }}>
          <tr>
            <th style={{ ...colStyle, width: '45%', textAlign: 'left' }}>Description</th>
            <th style={{ ...colStyle, width: '15%', textAlign: 'right' }}>Qty</th>
            <th style={{ ...colStyle, width: '20%', textAlign: 'right' }}>Rate ($)</th>
            <th style={{ ...colStyle, width: '15%', textAlign: 'right' }}>Amount</th>
            <th style={{ ...colStyle, width: '5%' }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              <td>
                <input
                  value={item.description}
                  onChange={e => onSetItem(i, 'description', e.target.value)}
                  placeholder="Design work"
                  style={inputStyle}
                />
              </td>
              <td>
                <input
                  type="number" min="0.01" step="0.01"
                  value={item.quantity}
                  onChange={e => onSetItem(i, 'quantity', parseFloat(e.target.value))}
                  style={{ ...inputStyle, textAlign: 'right' }}
                />
              </td>
              <td>
                <input
                  type="number" min="0" step="0.01"
                  value={item.rate}
                  onChange={e => onSetItem(i, 'rate', parseFloat(e.target.value))}
                  placeholder="0.00"
                  style={{ ...inputStyle, textAlign: 'right' }}
                />
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)' }}>
                {formatCurrency(item.amount)}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(i)}
                    style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: 0 }}
                  >×</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onAddItem}
          style={{ border: 'none', background: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 500 }}
        >
          + Add line
        </button>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Total: {formatCurrency(subtotal)}
        </span>
      </div>
    </div>
  )
}
