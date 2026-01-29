"""
Load all data from backend/data into the aimlbms database.

Run from backend/:  python -m app.db.seed_data

Requires: DATABASE_URL in .env, tables created (python -m app.db.create_tables
          or database/schema.sql run against Postgres).
"""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal, engine
from app.models import Dataset, MLModel, TrainingResult, TrainingRun, WLTPReference

# Reuse parsing from reference_results_loader
from app.services.reference_results_loader import load_reference_results

DATA_DIR = Path(settings.data_dir).resolve()
REFERENCE_CSV = DATA_DIR / "reference_results.csv"
WLTP_CSV = DATA_DIR / "WLTP_Driving_cycle_reference.csv"


def slugify(s: str, max_len: int = 64) -> str:
    """Lowercase, replace non-alnum with underscore, truncate."""
    s = re.sub(r"[^a-zA-Z0-9]+", "_", (s or "").strip().lower()).strip("_")
    return s[:max_len] if s else "unknown"


def seed_reference_results(db: Session) -> None:
    if not REFERENCE_CSV.exists():
        print(f"  Skip (not found): {REFERENCE_CSV}")
        return
    data = load_reference_results(REFERENCE_CSV, run_id=0)
    # Upsert datasets (from column headers except "model")
    for key in data.datasets:
        key_32 = key[:32] if len(key) > 32 else key
        if db.execute(select(Dataset).where(Dataset.key == key_32)).scalar_one_or_none() is None:
            db.add(Dataset(key=key_32, name=key_32))
    # Upsert ml_models (from model names)
    for name in data.models:
        key = slugify(name, 64)
        if db.execute(select(MLModel).where(MLModel.key == key)).scalar_one_or_none() is None:
            db.add(MLModel(key=key, name=name, seed_sensitive=False))
    db.commit()

    # One training run for this reference data
    run = TrainingRun(status="completed")
    db.add(run)
    db.commit()
    db.refresh(run)
    run_id = run.id

    # Insert training_results (re-parse to get numeric fields)
    with REFERENCE_CSV.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        datasets = [c for c in (reader.fieldnames or []) if c != "model"]
        for row in reader:
            model_name = (row.get("model") or "").strip()
            if not model_name:
                continue
            model_key = slugify(model_name, 64)
            for ds in datasets:
                cell_str = (row.get(ds) or "").strip()
                err_val, err_mean, err_std = None, None, None
                is_over, thr = False, None
                m = re.match(r"^\s*>\s*(\d+(?:\.\d+)?)\s*$", cell_str)
                if m:
                    is_over, thr = True, float(m.group(1))
                else:
                    m = re.match(r"^\s*(\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)\s*$", cell_str)
                    if m:
                        err_mean, err_std = float(m.group(1)), float(m.group(2))
                    else:
                        m = re.match(r"^\s*(\d+(?:\.\d+)?)\s*$", cell_str)
                        if m:
                            err_val = float(m.group(1))
                ds_key = ds[:32] if len(ds) > 32 else ds
                db.add(
                    TrainingResult(
                        run_id=run_id,
                        dataset_key=ds_key,
                        model_key=model_key,
                        error_value=err_val,
                        error_mean=err_mean,
                        error_std=err_std,
                        is_overflow=is_over,
                        overflow_threshold=thr,
                    )
                )
    db.commit()
    print(f"  Loaded reference_results.csv -> datasets, ml_models, training_runs, training_results (run_id={run_id})")


def seed_wltp_reference(db: Session) -> None:
    if not WLTP_CSV.exists():
        print(f"  Skip (not found): {WLTP_CSV}")
        return
    try:
        import pandas as pd
    except ImportError:
        print("  Skip WLTP (pandas required: pip install pandas)")
        return
    df = pd.read_csv(WLTP_CSV)
    cols = [c.strip() for c in df.columns]
    # Expected: Elapsed time [s], WLTP [km/h], WLTP Current [A], Current Adapted [A]
    if len(cols) < 4:
        print("  Skip WLTP (need 4 columns)")
        return
    # Clear existing so we don't duplicate on re-run
    db.execute(delete(WLTPReference))
    for _, row in df.iterrows():
        db.add(
            WLTPReference(
                elapsed_s=float(row[cols[0]]),
                wltp_kmh=float(row[cols[1]]),
                wltp_current_a=float(row[cols[2]]),
                current_adapted_a=float(row[cols[3]]),
            )
        )
    db.commit()
    print(f"  Loaded WLTP_Driving_cycle_reference.csv -> wltp_reference ({len(df)} rows)")


def main() -> None:
    print(f"Data dir: {DATA_DIR}")
    if not DATA_DIR.is_dir():
        print("Data directory not found. Set DATA_DIR or run from backend/ with data/ present.")
        sys.exit(1)
    db = SessionLocal()
    try:
        print("Seeding reference_results...")
        seed_reference_results(db)
        print("Seeding WLTP reference...")
        seed_wltp_reference(db)
        print("Done.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
