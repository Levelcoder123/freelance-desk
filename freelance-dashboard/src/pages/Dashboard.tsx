import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStats } from '../api/dashboard'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from 'recharts'
import StatCard from '../components/ui/StatCard'
import { formatCurrency } from '../utils/currency'
import { useTheme } from '../hooks/useTheme'
import { IconRevenue, IconOutstanding, IconClients, IconInvoices } from '../components/ui/Icons'
import { ChartTooltip } from '../components/ui/ChartTooltip'
import { DashboardData } from '../types'

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({ queryKey: ['stats'], queryFn: getStats })
  const { isDark } = useTheme()

  const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const tickColor  = isDark ? '#5c5a56' : '#a09e97'
  const areaColor  = '#d4a843'
  const barColor   = isDark ? '#3a9e68' : '#2e7d52'

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card" style={{ height: 90, background: 'var(--bg-subtle)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: '100%' }}>
      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard
          label="Total revenue"
          value={formatCurrency(data?.summary?.totalEarned ?? 0)}
          changeDir="up"
          icon={<IconRevenue />}
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(data?.summary?.totalOutstanding ?? 0)}
          changeDir="down"
          icon={<IconOutstanding />}
        />
        <StatCard
          label="Active clients"
          value={data?.summary?.activeClients ?? 0}
          icon={<IconClients />}
        />
        <StatCard
          label="Open invoices"
          value={data?.summary?.openInvoices ?? 0}
          icon={<IconInvoices />}
        />
      </div>

      {/* Charts */}
      <div className="chart-grid" style={{ flex: 1, marginBottom: 0 }}>
        <div className="card card-pad">
          <p className="chart-label">Revenue over time</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.monthlyRevenue ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={areaColor} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={areaColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}/>
              <Tooltip
                content={<ChartTooltip currency />}
                cursor={{ fill: 'transparent' }}
              />
              <Area type="monotone" dataKey="revenue" stroke={areaColor} strokeWidth={2} fill="url(#areaGrad)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-pad">
          <p className="chart-label">Expenses by category</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.summary?.expensesByCategory ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} style={{ background: 'transparent' }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}/>
              <Tooltip
                content={<ChartTooltip currency />}
                cursor={{ fill: 'transparent' }}
              />
              <Bar dataKey="total" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={40}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom grid — deadlines + recent invoices */}
      <div className="chart-grid" style={{ flex: 1 }}>

        {/* Upcoming deadlines */}
        <div className="card card-pad">
          <p className="chart-label">Upcoming deadlines</p>
          {(data?.deadlines ?? []).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>No deadlines in the next 14 days.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {(data?.deadlines ?? []).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{p.clientName}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ width: 80, height: 4, borderRadius: 99, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.progress}%`, background: 'var(--accent)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(p.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent invoices */}
        <div className="card card-pad">
          <p className="chart-label">Recent invoices</p>
          {(data?.recentInvoices ?? []).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>No invoices yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {(data?.recentInvoices ?? []).map(inv => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{inv.clientName}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>{inv.invoiceNumber}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(inv.amount)}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99,
                      background: inv.status === 'paid'    ? 'var(--green-subtle)'  :
                                  inv.status === 'overdue' ? 'var(--red-subtle)'    :
                                  inv.status === 'pending' ? 'var(--amber-subtle)'  : 'var(--bg-subtle)',
                      color:      inv.status === 'paid'    ? 'var(--green-text)'    :
                                  inv.status === 'overdue' ? 'var(--red-text)'      :
                                  inv.status === 'pending' ? 'var(--amber-text)'    : 'var(--text-muted)',
                    }}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
