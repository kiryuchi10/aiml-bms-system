/**
 * TempSensorRow: 모듈 온도 센서 칩 행.
 */
export default function TempSensorRow({ temps = [] }) {
  if (!temps.length) {
    return <div className="temp-row muted">No sensor data</div>;
  }
  return (
    <div className="temp-row">
      {temps.map((t, idx) => (
        <div key={idx} className="temp-chip">
          {Number(t).toFixed(1)} °C
        </div>
      ))}
    </div>
  );
}
