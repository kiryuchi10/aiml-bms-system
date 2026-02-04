/**
 * AlarmsPanel — alarms-section, alarms-grid; Active/Latched from alarms; ALL_ALARMS list.
 */
import type { AlarmState } from '../../types/bms'

const ALL_ALARMS = [
  'Cell OV',
  'AFE OT',
  'Cell UV',
  'Cell OT',
  'Cell UT',
  'Pack OV',
  'Pack UV',
  'PCB OT',
  'Open Wire',
  'Charge OC',
  'Discharge OC',
  'Charge SC',
  'Discharge SC',
  'FET Driver Error',
  'System Error',
  'Cell Mismatch',
]

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function AlarmsPanel({ alarms }: { alarms: AlarmState }) {
  const activeSet = new Set((alarms.active ?? []).map(norm))
  const latchedSet = new Set((alarms.latched ?? []).map(norm))

  return (
    <div className="alarms-section">
      <div className="alarm-header">
        <div className="panel-header" style={{ fontSize: 12, margin: 0 }}>
          Alarms
        </div>
        <div className="alarm-indicators">
          <span>
            <span className="alarm-dot active" />Active
          </span>
          <span>
            <span className="alarm-dot latched" />Latched
          </span>
        </div>
      </div>

      <div className="alarms-grid">
        {ALL_ALARMS.map((name) => {
          const isActive = activeSet.has(norm(name))
          const cls = `alarm-item ${isActive ? 'active-alarm' : ''}`
          return (
            <div className={cls} key={name}>
              {isActive ? '⚠ ' : ''}
              {name}
              {latchedSet.has(norm(name)) ? ' (L)' : ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}
