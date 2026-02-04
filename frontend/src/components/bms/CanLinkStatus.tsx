/**
 * CanLinkStatus: CAN Link indicator (left area of NXP-style UI).
 */
export function CanLinkStatus({ connected }: { connected: boolean }) {
  return (
    <div className={`can-link-status ${connected ? 'connected' : 'disconnected'}`}>
      <span className="can-link-dot" />
      <span>{connected ? 'CAN Link' : 'Disconnected'}</span>
    </div>
  )
}
