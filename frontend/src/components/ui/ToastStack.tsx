/**
 * ToastStack — fixed bottom-right stack of toasts (success/error/info).
 */
import type { ToastItem } from '../../hooks/useToast'

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div
      style={{
        position: 'fixed',
        right: 14,
        bottom: 14,
        zIndex: 99999,
        display: 'grid',
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            minWidth: 260,
            maxWidth: 380,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #ccc',
            background: 'white',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            fontSize: 12,
            color: '#222',
          }}
        >
          <b style={{ marginRight: 8 }}>
            {t.kind === 'success' ? '✅' : t.kind === 'error' ? '❌' : 'ℹ️'}
          </b>
          {t.message}
        </div>
      ))}
    </div>
  )
}
