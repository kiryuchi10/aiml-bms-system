"""Pack summary API: SOC/SOH/SOP, V/I/T, alarm (BMU Status Strip)."""

from fastapi import APIRouter, Query

from app.core.config import settings
from app.services.feature_store import FeatureStore

router = APIRouter()
fs = FeatureStore(settings.feature_dir, settings.timeseries_dir)


@router.get("/pack/summary")
def pack_summary(pack_id: str = Query("B0005", description="Pack ID (e.g. B0005)")):
    """
    Pack 요약: SOC, SOH, SOP, Vpack, Ipack, Tmax, alarm_level.
    data/processed/features, time_series parquet 기반.
    """
    soh_df = fs.soh_features(pack_id, max_rows=1)
    soh = float(soh_df["soh_est"].iloc[0]) if len(soh_df) and "soh_est" in soh_df.columns else 0.0

    ts_df = fs.pack_timeseries(pack_id)
    if not ts_df.empty:
        last = ts_df.iloc[-1]
        v_pack = float(last.get("v_pack", 0.0))
        i_pack = float(last.get("i_pack", 0.0))
        t_max = float(last.get("t_max", 0.0))
        soc = float(last.get("soc", 0.0))
        ts = str(last.get("ts", ""))
    else:
        v_pack = i_pack = t_max = soc = 0.0
        ts = ""

    alarm = "NORMAL"
    if t_max > 55 or v_pack > 60:
        alarm = "DANGER"
    elif t_max > 45:
        alarm = "WARN"

    return {
        "pack_id": pack_id,
        "ts": ts,
        "soc": soc,
        "soh": soh,
        "sop_kw": 0.0,
        "v_pack": v_pack,
        "i_pack": i_pack,
        "t_max": t_max,
        "alarm_level": alarm,
    }
