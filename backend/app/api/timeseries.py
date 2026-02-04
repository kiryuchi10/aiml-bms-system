"""Timeseries API: 차트용 다운샘플 (voltage, current, temperature, soc)."""

from fastapi import APIRouter, Query

import pandas as pd

from app.core.config import settings
from app.services.feature_store import FeatureStore

router = APIRouter()
fs = FeatureStore(settings.feature_dir, settings.timeseries_dir)


def downsample(df: pd.DataFrame, points: int) -> pd.DataFrame:
    if len(df) <= points:
        return df
    step = max(1, len(df) // points)
    return df.iloc[::step].copy()


@router.get("/timeseries")
def get_timeseries(
    pack_id: str = Query("B0005"),
    metric: str = Query("voltage", description="voltage | current | temperature | soc"),
    points: int = Query(300, ge=10, le=2000),
):
    """Pack 시계열 다운샘플. pack_timeseries.parquet: ts, v_pack, i_pack, t_max, soc."""
    df = fs.pack_timeseries(pack_id)
    if df.empty:
        return {"pack_id": pack_id, "metric": metric, "rows": []}

    if metric == "voltage":
        col = "v_pack" if "v_pack" in df.columns else "voltage"
        out = df[["ts", col]].rename(columns={col: "value"})
    elif metric == "current":
        col = "i_pack" if "i_pack" in df.columns else "current"
        out = df[["ts", col]].rename(columns={col: "value"})
    elif metric == "temperature":
        col = "t_max" if "t_max" in df.columns else "temperature"
        out = df[["ts", col]].rename(columns={col: "value"})
    elif metric == "soc":
        col = "soc" if "soc" in df.columns else "v_pack"
        out = df[["ts", col]].rename(columns={col: "value"})
    else:
        col = "v_pack" if "v_pack" in df.columns else df.columns[1]
        out = df[["ts", col]].rename(columns={col: "value"})

    out = downsample(out, points)
    return {"pack_id": pack_id, "metric": metric, "rows": out.to_dict(orient="records")}
