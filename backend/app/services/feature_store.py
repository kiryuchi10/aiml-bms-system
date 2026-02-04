"""
Feature Store: parquet 기반 feature/time_series 로딩·캐싱.
API가 data/processed/features/*.parquet, time_series/*.parquet 읽어서 JSON 제공.
"""

from __future__ import annotations

import os

import pandas as pd

from app.core.config import settings


class FeatureStore:
    """
    parquet 기반 feature 테이블을 로딩/캐싱하고,
    API 요청에 맞게 필요한 컬럼/행만 잘라 반환한다.
    """

    def __init__(
        self,
        feature_dir: str | None = None,
        timeseries_dir: str | None = None,
    ):
        self.feature_dir = feature_dir or str(settings.feature_dir)
        self.timeseries_dir = timeseries_dir or str(settings.timeseries_dir)

    def _pq(self, *parts: str) -> pd.DataFrame:
        path = os.path.join(*parts)
        if not os.path.exists(path):
            return pd.DataFrame()
        return pd.read_parquet(path)

    # ---------- FEATURES ----------
    def soc_features(self, pack_id: str, cycle_id: int, max_rows: int = 2000) -> pd.DataFrame:
        df = self._pq(self.feature_dir, "soc_features.parquet")
        if df.empty:
            return df
        sub = df[(df["pack_id"] == pack_id) & (df["cycle_id"] == cycle_id)]
        cols = [c for c in sub.columns if c not in ("raw_blob",)]
        return sub[cols].head(max_rows)

    def soh_features(self, pack_id: str, max_rows: int = 200) -> pd.DataFrame:
        df = self._pq(self.feature_dir, "soh_features.parquet")
        if df.empty:
            return df
        sub = df[df["pack_id"] == pack_id]
        if "cycle_id" in sub.columns:
            sub = sub.sort_values("cycle_id")
        return sub.tail(max_rows)

    def eis_features(self, pack_id: str, cycle_id: int, max_rows: int = 5000) -> pd.DataFrame:
        df = self._pq(self.feature_dir, "eis_features.parquet")
        if df.empty:
            return df
        sub = df[(df["pack_id"] == pack_id) & (df["cycle_id"] == cycle_id)]
        return sub.head(max_rows)

    def thermal_features(self, pack_id: str, max_rows: int = 2000) -> pd.DataFrame:
        df = self._pq(self.feature_dir, "thermal_features.parquet")
        if df.empty:
            return df
        sub = df[df["pack_id"] == pack_id].tail(max_rows)
        return sub

    # ---------- TIMESERIES ----------
    def pack_timeseries(self, pack_id: str) -> pd.DataFrame:
        df = self._pq(self.timeseries_dir, "pack_timeseries.parquet")
        if df.empty:
            return df
        sub = df[df["pack_id"] == pack_id]
        if "ts" in sub.columns:
            return sub.sort_values("ts")
        return sub

    def cell_timeseries(self, pack_id: str) -> pd.DataFrame:
        df = self._pq(self.timeseries_dir, "cell_timeseries.parquet")
        if df.empty:
            return df
        sub = df[df["pack_id"] == pack_id]
        if "ts" in sub.columns:
            cols = ["ts", "cell_id"] if "cell_id" in sub.columns else ["ts"]
            return sub.sort_values(cols)
        return sub
