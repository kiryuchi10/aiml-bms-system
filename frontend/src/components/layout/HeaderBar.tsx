/**
 * HeaderBar — same class names as static HTML (.header, .header-title).
 */
export function HeaderBar({ title, timestamp }: { title: string; timestamp: string }) {
  return (
    <div className="header">
      <div className="header-title">{title}</div>
      <div>{timestamp}</div>
    </div>
  )
}
