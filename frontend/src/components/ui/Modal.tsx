/**
 * Modal — overlay + title + body + optional footer (BMS control confirmation UX).
 */
import type { ReactNode } from 'react'

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        style={{
          width: 520,
          maxWidth: '92vw',
          background: 'white',
          borderRadius: 8,
          border: '1px solid #ccc',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '10px 14px',
            background: 'linear-gradient(180deg, #0066cc 0%, #0052a3 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div id="modal-title">{title}</div>
          <button type="button" className="btn" style={{ padding: '4px 10px' }} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ padding: 14, fontSize: 12, color: '#333', lineHeight: 1.5 }}>{children}</div>

        {footer != null && (
          <div
            style={{
              padding: 12,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              borderTop: '1px solid #eee',
              background: '#fafafa',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
