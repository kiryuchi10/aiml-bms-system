/**
 * Balancing status: active cell ids, max allowed, detail from API.
 */

import type { BalancingStatus as BalancingStatusType } from '../../services/apiV1'
import styles from './BalancingStatus.module.css'

type Props = {
  status: BalancingStatusType | null
}

export function BalancingStatus({ status }: Props) {
  if (!status) return <div className={styles.wrap}>—</div>
  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Balancing</div>
      <div className={styles.detail}>{status.detail}</div>
      <div className={styles.ids}>
        {status.active_cell_ids.length > 0
          ? `Cells: ${status.active_cell_ids.join(', ')}`
          : 'No cells active'}
      </div>
      <div className={styles.limit}>Max active: {status.max_active}</div>
    </div>
  )
}
