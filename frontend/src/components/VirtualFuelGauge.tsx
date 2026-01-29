import { useState } from 'react'
import '../styles/VirtualFuelGauge.css'

interface VirtualFuelGaugeProps {
  onClose: () => void
}

export function VirtualFuelGauge({ onClose }: VirtualFuelGaugeProps) {
  const [filePath, setFilePath] = useState('C:\\Users\\user\\Desktop\\GUI_exports\\Exports\\MPF42791 test\\Short+Long pulse')
  const [validFile, setValidFile] = useState(true)
  const [iterations, setIterations] = useState(4)
  const [executionPeriod, setExecutionPeriod] = useState('16s')
  const [displayRealtime, setDisplayRealtime] = useState(false)
  const [exitWhenDone, setExitWhenDone] = useState(true)
  const [running, setRunning] = useState(false)
  const [currentIteration, setCurrentIteration] = useState(2)
  const [totalIterations] = useState(4)
  const [currentRow, setCurrentRow] = useState(660)
  const [totalRows] = useState(3842)
  const [estimatedTime, setEstimatedTime] = useState('43m 10s')

  const handleExplore = () => {
    setValidFile(true)
  }

  const handleStop = () => {
    setRunning(false)
    onClose()
  }

  const progressPct = totalRows ? (currentRow / totalRows) * 100 : 0
  const iterationPct = totalIterations ? (currentIteration / totalIterations) * 100 : 0

  return (
    <div className="vfg-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="vfg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vfg-title">Virtual Fuel Gauge</div>

        <div className="vfg-row">
          <label className="vfg-label">Select the file:</label>
          <div className="vfg-input-row">
            <input
              type="text"
              className="vfg-input"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
            <button type="button" className="vfg-btn secondary" onClick={handleExplore}>
              Explore
            </button>
          </div>
          {validFile && <div className="vfg-valid">Valid .csv file selected</div>}
        </div>

        <div className="vfg-row">
          <span className="vfg-label">Detected period from file:</span>
          <span className="vfg-input" style={{ display: 'inline-block', width: 'auto' }}>4s</span>
        </div>

        <div className="vfg-row">
          <label className="vfg-label">Num. Of Iterations to do:</label>
          <input
            type="number"
            className="vfg-input"
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            min={1}
          />
        </div>

        <div className="vfg-row">
          <label className="vfg-label">Select Execution Period for VFG:</label>
          <select
            className="vfg-input"
            value={executionPeriod}
            onChange={(e) => setExecutionPeriod(e.target.value)}
          >
            <option value="4s">4s</option>
            <option value="8s">8s</option>
            <option value="16s">16s</option>
            <option value="32s">32s</option>
          </select>
        </div>

        <div className="vfg-checkbox-row">
          <input
            type="checkbox"
            id="vfg-realtime"
            checked={displayRealtime}
            onChange={(e) => setDisplayRealtime(e.target.checked)}
          />
          <label htmlFor="vfg-realtime">Display FG values in Real Time:</label>
        </div>

        <div className="vfg-row">
          <button type="button" className="vfg-select-btn">First iteration Resets:</button>
          <button type="button" className="vfg-select-btn" style={{ marginLeft: 8 }}>Resets between iterations:</button>
        </div>

        <div className="vfg-checkbox-row">
          <input
            type="checkbox"
            id="vfg-exit"
            checked={exitWhenDone}
            onChange={(e) => setExitWhenDone(e.target.checked)}
          />
          <label htmlFor="vfg-exit">Exit Virtual FG Mode when done:</label>
        </div>

        {running && (
          <div className="vfg-progress-section">
            <div className="vfg-progress-label">Running Virtual FG...</div>
            <div className="vfg-progress-text">Iteration {currentIteration} of {totalIterations}</div>
            <div className="vfg-progress-bar-wrap">
              <div className="vfg-progress-bar" style={{ width: `${iterationPct}%` }} />
            </div>
            <div className="vfg-progress-text">Row {currentRow} of {totalRows}</div>
            <div className="vfg-progress-bar-wrap">
              <div className="vfg-progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="vfg-progress-text">Estimated Remaining time: {estimatedTime}</div>
          </div>
        )}

        <div className="vfg-actions">
          <button type="button" className="vfg-btn secondary" onClick={onClose}>
            Cancel
          </button>
          {running ? (
            <button type="button" className="vfg-btn" onClick={handleStop}>
              Stop Virtual Fuel Gauge
            </button>
          ) : (
            <button
              type="button"
              className="vfg-btn"
              onClick={() => setRunning(true)}
            >
              Run Virtual Fuel Gauge
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
