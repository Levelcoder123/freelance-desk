import React, { useEffect, createContext, useContext } from 'react'

const ModalContext = createContext<{ onClose: () => void }>({ onClose: () => {} })

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

function Modal({ open, onClose, children, wide = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    
    document.body.style.overflow = 'hidden'
    
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <ModalContext.Provider value={{ onClose }}>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{ overscrollBehavior: 'contain' }}
      >
        <div
          className={`modal-box ${wide ? 'wide' : 'narrow'}`}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  )
}

function Header({ children }: { children: React.ReactNode }) {
  const { onClose } = useContext(ModalContext)
  return (
    <div className="modal-header">
      <h3 className="modal-title">{children}</h3>
      <button 
        className="modal-close" 
        onClick={onClose} 
        aria-label="Close modal"
      >
        ×
      </button>
    </div>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <div className="modal-body" style={{ padding: '0 1.5rem 1.5rem' }}>
      {children}
    </div>
  )
}

function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="modal-footer" style={{ 
      padding: '1rem 1.5rem', 
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.75rem'
    }}>
      {children}
    </div>
  )
}

Modal.Header = Header
Modal.Body   = Body
Modal.Footer = Footer

export default Modal
