import React from 'react'

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeDir?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, change, changeDir = 'neutral', icon }: StatCardProps) {
  return (
    <div className="stat-card animate-in">
      <div className="stat-card-top">
        <div className="stat-label">{label}</div>
        {icon && <div className="stat-icon">{icon}</div>}
      </div>
      <div className="stat-value">{value}</div>
      {change && (
        <div className={`stat-change ${changeDir}`}>
          {changeDir === 'up'   && '↑ '}
          {changeDir === 'down' && '↓ '}
          {change}
        </div>
      )}
    </div>
  )
}
