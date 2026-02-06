/**
 * PackOverviewTiles — Pack Voltage, Current, SOC, Pack Temp, Ambient, ΔV/worst (optional).
 * Each tile: value + unit + optional sparkline + status color (normal/warning/fault).
 */
type Pack = {
  voltage?: number | null
  current?: number | null
  soc?: number | null
  temp?: number | null
  status?: string | null
  min_cell_v?: number | null
  max_cell_v?: number | null
}

export default function PackOverviewTiles({ pack }: { pack?: Pack | null }) {
  const socPct = pack?.soc != null ? (pack.soc <= 1 ? pack.soc * 100 : pack.soc) : null
  const imbalance =
    pack?.min_cell_v != null && pack?.max_cell_v != null
      ? (pack.max_cell_v - pack.min_cell_v) * 1000
      : null

  const tiles = [
    { label: 'Pack Voltage (V)', value: pack?.voltage != null ? `${pack.voltage.toFixed(2)}` : '—', unit: 'V' },
    { label: 'Pack Current (A)', value: pack?.current != null ? `${pack.current.toFixed(2)}` : '—', unit: 'A' },
    { label: 'SOC (%)', value: socPct != null ? `${socPct.toFixed(1)}` : '—', unit: '%' },
    { label: 'Pack Temp (°C)', value: pack?.temp != null ? `${pack.temp.toFixed(1)}` : '—', unit: '°C' },
    { label: 'Ambient (°C)', value: pack?.temp != null ? `${pack.temp.toFixed(1)}` : '—', unit: '°C' },
    { label: 'ΔV / Worst', value: imbalance != null ? `${imbalance.toFixed(0)} mV` : '—', unit: '' },
  ]

  return (
    <section className="pack-overview-tiles row-full">
      <div className="tiles-row">
        {tiles.map((t) => (
          <div key={t.label} className="tile">
            <span className="tile-label">{t.label}</span>
            <span className="tile-value">
              {t.value}
              {t.unit && t.value !== '—' && ` ${t.unit}`}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
