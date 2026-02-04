"""
Load parquet-derived BMS data into PostgreSQL (schema_bms tables).
Env: DATABASE_URL, PACK_PARQUET, CELL_PARQUET, SOC_FEATURES, SOH_FEATURES, THERMAL_FEATURES, EIS_FEATURES, VEHICLE_ID, DISPLAY_NAME.
Paths default to backend/data/processed/... when run from backend/.
"""
import os
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text

# Default: run from backend/
BACKEND = Path(__file__).resolve().parent.parent
DATA = BACKEND / "data" / "processed"
TIME_SERIES = DATA / "time_series"
FEATURES = DATA / "features"

DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://aimlbms:aimlbms@localhost:5432/aimlbms")
PACK_PATH = os.getenv("PACK_PARQUET", str(TIME_SERIES / "pack_timeseries.parquet"))
CELL_PATH = os.getenv("CELL_PARQUET", str(TIME_SERIES / "cell_timeseries.parquet"))
SOC_F = os.getenv("SOC_FEATURES", str(FEATURES / "soc_features.parquet"))
SOH_F = os.getenv("SOH_FEATURES", str(FEATURES / "soh_features.parquet"))
THERM_F = os.getenv("THERMAL_FEATURES", str(FEATURES / "thermal_features.parquet"))
EIS_F = os.getenv("EIS_FEATURES", str(FEATURES / "eis_features.parquet"))
VEHICLE_ID = os.getenv("VEHICLE_ID", "MBM165-P50-B")
DISPLAY_NAME = os.getenv("DISPLAY_NAME", "MBM165-P50-B")


def normalize_ts(df: pd.DataFrame) -> pd.DataFrame:
    for c in ["ts", "timestamp", "time", "datetime"]:
        if c in df.columns:
            df = df.rename(columns={c: "ts"})
            break
    if "ts" not in df.columns:
        raise ValueError("No timestamp column in parquet. Expect ts/timestamp/time/datetime.")
    df["ts"] = pd.to_datetime(df["ts"], utc=True, errors="coerce")
    return df


def ensure_vehicle(engine) -> None:
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO bms_vehicles (vehicle_id, display_name)
                VALUES (:vid, :name)
                ON CONFLICT (vehicle_id) DO UPDATE SET display_name = EXCLUDED.display_name
            """),
            {"vid": VEHICLE_ID, "name": DISPLAY_NAME},
        )


def main() -> None:
    engine = create_engine(DB_URL)

    ensure_vehicle(engine)

    # Pack
    if not os.path.exists(PACK_PATH):
        print(f"Skip pack: {PACK_PATH} not found")
    else:
        pack = pd.read_parquet(PACK_PATH)
        pack = normalize_ts(pack)
        if "vehicle_id" not in pack.columns:
            pack["vehicle_id"] = VEHICLE_ID
        rename = {"voltage": "pack_voltage", "current": "pack_current", "temperature": "pack_temp", "ambient_air_temp": "ambient_temp"}
        for k, v in rename.items():
            if k in pack.columns and v not in pack.columns:
                pack = pack.rename(columns={k: v})
        keep = ["vehicle_id", "ts", "pack_voltage", "pack_current", "pack_temp", "ambient_temp", "soc", "soh", "mode"]
        for c in keep:
            if c not in pack.columns:
                pack[c] = None
        pack = pack[[c for c in keep if c in pack.columns]]
        pack.to_sql("pack_timeseries", engine, if_exists="append", index=False, chunksize=50_000, method="multi")
        print(f"Loaded pack_timeseries: {len(pack)} rows")

    # Cell
    if not os.path.exists(CELL_PATH):
        print(f"Skip cell: {CELL_PATH} not found")
    else:
        cell = pd.read_parquet(CELL_PATH)
        cell = normalize_ts(cell)
        if "vehicle_id" not in cell.columns:
            cell["vehicle_id"] = VEHICLE_ID
        if "cell" in cell.columns and "cell_id" not in cell.columns:
            cell = cell.rename(columns={"cell": "cell_id"})
        rename2 = {"v": "voltage", "t": "temperature", "i": "current"}
        for k, v in rename2.items():
            if k in cell.columns and v not in cell.columns:
                cell = cell.rename(columns={k: v})
        need = ["vehicle_id", "ts", "cell_id", "voltage", "temperature", "current", "abs_soc", "soh", "balancing", "alarm"]
        for c in need:
            if c not in cell.columns:
                cell[c] = None
        if cell["balancing"].isna().all():
            cell["balancing"] = False
        if cell["alarm"].isna().all():
            cell["alarm"] = False
        cell = cell[[c for c in need if c in cell.columns]]
        cell.to_sql("cell_timeseries", engine, if_exists="append", index=False, chunksize=50_000, method="multi")
        print(f"Loaded cell_timeseries: {len(cell)} rows")

    # Features (JSONB)
    def load_feat(path: str, table: str) -> None:
        if not os.path.exists(path):
            return
        df = pd.read_parquet(path)
        if "vehicle_id" not in df.columns:
            df["vehicle_id"] = VEHICLE_ID
        df = normalize_ts(df)
        ignore = {"vehicle_id", "ts"}
        feat_cols = [c for c in df.columns if c not in ignore]
        df["feature"] = df[feat_cols].to_dict(orient="records")
        out = df[["vehicle_id", "ts", "feature"]].copy()
        out.to_sql(table, engine, if_exists="append", index=False, chunksize=5000, method="multi")
        print(f"Loaded {table}: {len(out)} rows")

    load_feat(SOC_F, "soc_features")
    load_feat(SOH_F, "soh_features")
    load_feat(THERM_F, "thermal_features")
    load_feat(EIS_F, "eis_features")

    print("Done.")


if __name__ == "__main__":
    main()
    sys.exit(0)
