/**
 * Alarm panel: list active alarms from API/WS (backend-derived).
 */

import type { AlarmItem } from '../../services/apiV1'
import styles from './AlarmPanel.module.css'

type Props = {
  alarms: AlarmItem[]
  /** When streaming, alarms can be string[] from WS */
  alarmMessages?: string[]
}

export function AlarmPanel({ alarms, alarmMessages }: Props) {
  const list = alarms.length
    ? alarms
    : (alarmMessages || []).map((msg, i) => ({ id: `ws-${i}`, severity: 'warning', message: msg }))

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>Alarms</span>
        <span className={styles.count}>{list.length}</span>
      </div>
      <ul className={styles.list}>
        {list.length === 0 ? (
          <li className={styles.none}>None</li>
        ) : (
          list.map((a) => (
            <li
              key={a.id}
              className={a.severity === 'critical' ? styles.critical : styles.warning}
            >
              {a.message}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
