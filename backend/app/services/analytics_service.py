"""
Analytics service: SOC/SOH proxy, thermal, risk from real parquet snapshot.
No mock; uses dashboard_service and parquet loader.
"""

from __future__ import annotations

from typing import Optional

from app.services.dashboard_service import get_current_snapshot
from app.schemas.v1_analytics import AnalyticsSoc, AnalyticsSoh, AnalyticsThermal, AnalyticsRisk
from app.services.dashboard_service import _cells_from_snapshot
from app.services.nasa_mat_loader import get_first_available_mat_key, get_mat_row_count, has_mat_data
from app.services.parquet_bms_loader import get_first_available_dataset_key, load_parquet_frame

# Thresholds for thermal/risk (align with dashboard_service)
TEMP_OT = 55.0
TEMP_UT = -10.0
TEMP_WARN_HIGH = 45.0
TEMP_WARN_LOW = 0.0


def get_analytics_soc(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[AnalyticsSoc]:
    """SOC proxy from current snapshot (.mat fallback, then parquet)."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    snapshot = get_current_snapshot(key, row_index)
    if not snapshot:
        return None
    soc_raw = snapshot.pack_soc or 0.0
    soc = soc_raw / 100.0 if soc_raw > 1 else soc_raw
    ts = snapshot.timestamp if isinstance(snapshot.timestamp, str) else (getattr(snapshot.timestamp, "isoformat", lambda: "")() or "")
    return AnalyticsSoc(
        soc=max(0, min(1, soc)),
        soc_percent=round(soc * 100, 2),
        source="parquet",
        timestamp=ts,
    )


def get_analytics_soh(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[AnalyticsSoh]:
    """SOH proxy from current snapshot (.mat fallback, then parquet)."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    snapshot = get_current_snapshot(key, row_index)
    if not snapshot:
        return None
    soh_raw = snapshot.pack_soh or 100.0
    soh = soh_raw / 100.0 if soh_raw > 1 else soh_raw
    ts = snapshot.timestamp if isinstance(snapshot.timestamp, str) else (getattr(snapshot.timestamp, "isoformat", lambda: "")() or "")
    return AnalyticsSoh(
        soh=max(0, min(1, soh)),
        soh_percent=round(soh * 100, 2),
        source="parquet",
        timestamp=ts,
    )


def get_analytics_thermal(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[AnalyticsThermal]:
    """Thermal summary from pack and cells (.mat fallback, then parquet)."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    snapshot = get_current_snapshot(key, row_index)
    if not snapshot:
        return None
    cells = _cells_from_snapshot(snapshot, key)
    pack_t = snapshot.pack_temperature or 0.0
    temps = [c.t for c in cells]
    t_min = min(temps) if temps else pack_t
    t_max = max(temps) if temps else pack_t
    status = "normal"
    if pack_t >= TEMP_OT or t_max >= TEMP_OT:
        status = "critical"
    elif pack_t <= TEMP_UT or t_min <= TEMP_UT:
        status = "critical"
    elif pack_t >= TEMP_WARN_HIGH or pack_t <= TEMP_WARN_LOW:
        status = "warning"
    ts = snapshot.timestamp if isinstance(snapshot.timestamp, str) else (getattr(snapshot.timestamp, "isoformat", lambda: "")() or "")
    return AnalyticsThermal(
        pack_temp=round(pack_t, 2),
        min_cell_temp=round(t_min, 2),
        max_cell_temp=round(t_max, 2),
        status=status,
        timestamp=ts,
    )


def get_analytics_risk(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[AnalyticsRisk]:
    """Simple risk score: 0=ok, 1=high; factors list contributing issues (.mat fallback)."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    snapshot = get_current_snapshot(key, row_index)
    if not snapshot:
        return None
    cells = _cells_from_snapshot(snapshot, key)
    factors: list[str] = []
    score = 0.0
    v = snapshot.pack_voltage or 0
    t = snapshot.pack_temperature or 0
    if v >= 4.25 * 16:  # rough pack OV
        factors.append("pack_ov")
        score = max(score, 0.9)
    if v <= 2.5 * 16:
        factors.append("pack_uv")
        score = max(score, 0.9)
    if t >= TEMP_OT:
        factors.append("over_temp")
        score = max(score, 0.9)
    if t <= TEMP_UT:
        factors.append("under_temp")
        score = max(score, 0.7)
    for c in cells:
        if c.status != "normal":
            factors.append(f"cell_{c.id}_{c.status}")
            score = max(score, 0.6)
    if not factors:
        factors.append("none")
    ts = snapshot.timestamp if isinstance(snapshot.timestamp, str) else (getattr(snapshot.timestamp, "isoformat", lambda: "")() or "")
    return AnalyticsRisk(score=round(score, 2), factors=factors, timestamp=ts)


def _total_rows(key: str) -> int:
    if has_mat_data(key):
        return get_mat_row_count(key)
    frame = load_parquet_frame(key)
    return len(frame[0]) if frame and len(frame[0]) else 0


def get_analytics_soc_trend(
    dataset_key: Optional[str] = None,
    hours: int = 24,
) -> Optional[dict]:
    """SOC time-series for last N hours (sampled from rows). Returns { points: [{timestamp, soc_percent}] }."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    total = _total_rows(key)
    if total == 0:
        return None
    # Sample: up to 200 points over "hours" (demo: use row indices)
    step = max(1, total // min(200, total))
    points: list[dict] = []
    for row_index in range(0, total, step):
        snap = get_current_snapshot(key, row_index)
        if not snap:
            continue
        soc_raw = snap.pack_soc or 0.0
        soc_pct = soc_raw * 100.0 if soc_raw <= 1 else soc_raw
        ts = snap.timestamp if isinstance(snap.timestamp, str) else f"row_{row_index}"
        points.append({"timestamp": ts, "soc_percent": round(soc_pct, 2)})
    return {"points": points, "hours": hours}


def get_analytics_soh_trend(
    dataset_key: Optional[str] = None,
    days: int = 30,
) -> Optional[dict]:
    """SOH time-series for last N days (demo proxy). Returns { points: [{day, soh_percent}] }."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    snap = get_current_snapshot(key, 0)
    if not snap:
        return None
    soh_raw = snap.pack_soh or 100.0
    soh_pct = soh_raw / 100.0 if soh_raw > 1 else soh_raw
    soh_pct = round(soh_pct * 100, 2)
    points = [{"day": d, "soh_percent": soh_pct} for d in range(days)]
    return {"points": points, "days": days}


def get_analytics_thermal_map(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[dict]:
    """Thermal snapshot for heatmap: grid of cell temps. Returns { rows, cols, values, status }."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    snap = get_current_snapshot(key, row_index)
    if not snap:
        return None
    cells = _cells_from_snapshot(snap, key)
    # 1-row grid for simplicity; status normal/warning/fault per cell
    values = [round(c.t, 1) for c in cells]
    statuses = [c.status for c in cells]
    return {
        "rows": 1,
        "cols": len(values),
        "values": values,
        "status": statuses,
        "pack_temp": round(snap.pack_temperature or 0, 1),
    }


def get_analytics_aging_map(
    dataset_key: Optional[str] = None,
    row_index: int = 0,
) -> Optional[dict]:
    """Aging index proxy for heatmap (demo: derived from voltage spread)."""
    key = dataset_key or get_first_available_mat_key() or get_first_available_dataset_key()
    if not key:
        return None
    snap = get_current_snapshot(key, row_index)
    if not snap:
        return None
    cells = _cells_from_snapshot(snap, key)
    vs = [c.v for c in cells]
    v_mean = sum(vs) / len(vs) if vs else 0
    # Aging proxy: deviation from mean (0=good, higher=degraded)
    values = [round(abs(c.v - v_mean) * 100, 2) for c in cells]
    statuses = ["normal" if x < 5 else "warning" if x < 15 else "fault" for x in values]
    return {"rows": 1, "cols": len(values), "values": values, "status": statuses}


def get_analytics_anomaly_timeline(
    dataset_key: Optional[str] = None,
    limit: int = 500,
) -> dict:
    """
    Anomaly score timeline for Battery Doctor / ML. No mock.
    Reads from soh_features.parquet if present (columns cycle, anomaly_score or score);
    otherwise returns empty points.
    Returns: { points: [{ cycle, score }], days: N }
    """
    import pandas as pd
    from app.core.config import settings
    path = settings.data_path / "soh_features.parquet"
    if not path.is_file():
        return {"points": [], "days": 0}
    try:
        df = pd.read_parquet(path)
    except Exception:
        return {"points": [], "days": 0}
    cycle_col = None
    score_col = None
    for c in ["cycle", "Cycle", "cycle_index"]:
        if c in df.columns:
            cycle_col = c
            break
    for c in ["anomaly_score", "score", "anomaly"]:
        if c in df.columns:
            score_col = c
            break
    if cycle_col is None or score_col is None:
        return {"points": [], "days": int(len(df)) if len(df) else 0}
    df = df.head(limit)
    points = [
        {"cycle": int(row.get(cycle_col, i)), "score": float(row.get(score_col, 0.0))}
        for i, row in df.iterrows()
    ]
    return {"points": points, "days": len(points)}
