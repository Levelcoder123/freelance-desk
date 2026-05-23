import React from 'react'
import Button from './Button'

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, action, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state animate-in">
      <div className="empty-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 9h6M9 12h6M9 15h4"/>
        </svg>
      </div>
      <p className="empty-title">{title}</p>
      {description && <p className="empty-desc">{description}</p>}
      {action && onAction && (
        <Button variant="primary" onClick={onAction}>{action}</Button>
      )}
    </div>
  )
}
