import React, { createContext, useContext } from 'react'

const CardContext = createContext<{ padding?: boolean }>({ padding: true })

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <CardContext.Provider value={{ padding }}>
      <div className={`card ${padding ? 'card-pad' : ''} ${className}`}>
        {children}
      </div>
    </CardContext.Provider>
  )
}

function Header({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-header ${className}`} style={{ marginBottom: '1rem' }}>
      {children}
    </div>
  )
}

function Title({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`chart-label ${className}`} style={{ margin: 0 }}>
      {children}
    </h3>
  )
}

function Content({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-content ${className}`}>
      {children}
    </div>
  )
}

Card.Header = Header
Card.Title  = Title
Card.Content = Content

export default Card
