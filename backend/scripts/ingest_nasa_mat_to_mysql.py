#!/usr/bin/env python3
"""
NASA .mat → MySQL 적재 (cells / cycles / samples 스키마).
B0005, B0006, B0007, B0018 등 NASA PCoE Battery Dataset용.

사용 전:
  1. db/DB_SCHEMA_MYSQL_NASA_RAW.sql 로 cells/cycles/samples 테이블 생성
  2. pip install scipy pandas mysql-connector-python tqdm
  3. 환경변수 또는 아래 DB dict 설정

실행:
  python scripts/ingest_nasa_mat_to_mysql.py
  python scripts/ingest_nasa_mat_to_mysql.py --mat data/B0005.mat
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# backend 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
from tqdm import tqdm

try:
    from scipy.io import loadmat
except ImportError:
    loadmat = None

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    import mysql.connector
except ImportError:
    mysql = None


# DB 설정: .env의 DATABASE_URL 또는 아래 dict 사용
def _db_config() -> dict:
    url = os.environ.get("DATABASE_URL", "")
    if url.startswith("mysql"):
        # mysql+pymysql://user:pass@host:3306/db → mysql.connector 형식
        parts = url.replace("mysql+pymysql://", "").replace("mysql://", "").split("@")
        if len(parts) == 2:
            user_pass, host_db = parts[0], parts[1]
            user, password = user_pass.split(":", 1) if ":" in user_pass else (user_pass, "")
            host_port, database = host_db.split("/", 1) if "/" in host_db else (host_db, "aimlbms")
            host, port = host_port.split(":") if ":" in host_port else (host_port, "3306")
            return {
                "host": host,
                "user": user,
                "password": password,
                "database": database,
                "port": int(port),
            }
    return {
        "host": os.environ.get("MYSQL_HOST", "localhost"),
        "user": os.environ.get("MYSQL_USER", "root"),
        "password": os.environ.get("MYSQL_PASSWORD", "12345"),
        "database": os.environ.get("MYSQL_DATABASE", "bms_nasa"),
        "port": int(os.environ.get("MYSQL_PORT", "3306")),
    }


def get_conn():
    if mysql is None:
        raise RuntimeError("mysql-connector-python required: pip install mysql-connector-python")
    return mysql.connector.connect(**_db_config())


def upsert_cell(cur, cell_code: str) -> int:
    cur.execute(
        "INSERT INTO cells(cell_code) VALUES(%s) "
        "ON DUPLICATE KEY UPDATE cell_code=VALUES(cell_code)",
        (cell_code,),
    )
    cur.execute("SELECT id FROM cells WHERE cell_code=%s", (cell_code,))
    return cur.fetchone()[0]


def upsert_cycle(cur, cell_id: int, cycle_index: int, step_type: str, amb_temp=None) -> int:
    cur.execute(
        "INSERT INTO cycles(cell_id, cycle_index, step_type, ambient_temp_c) "
        "VALUES(%s,%s,%s,%s) "
        "ON DUPLICATE KEY UPDATE ambient_temp_c=VALUES(ambient_temp_c)",
        (cell_id, cycle_index, step_type, amb_temp),
    )
    cur.execute(
        "SELECT id FROM cycles WHERE cell_id=%s AND cycle_index=%s AND step_type=%s",
        (cell_id, cycle_index, step_type),
    )
    return cur.fetchone()[0]


def insert_samples(cur, rows: list):
    cur.executemany(
        "INSERT INTO samples(cycle_id, t_s, v, i, temp_c, cap_ah, r_ohm) "
        "VALUES(%s,%s,%s,%s,%s,%s,%s)",
        rows,
    )


def _safe_float(arr, idx: int, default: float = 0.0) -> float:
    if arr is None:
        return default
    try:
        if hasattr(arr, "flatten"):
            flat = np.asarray(arr).flatten()
            if idx < len(flat):
                return float(flat[idx])
        elif isinstance(arr, (list, tuple)) and idx < len(arr):
            return float(arr[idx])
    except (TypeError, ValueError, IndexError):
        pass
    return default


def parse_nasa_mat(mat_path: Path):
    """
    NASA PCoE .mat 파싱: cycle 배열 → (cell_code, cycles_list).
    cycle[i].type, cycle[i].data (Time, Voltage_measured, Current_measured, Temperature_measured, Capacity).
    """
    if loadmat is None:
        raise RuntimeError("scipy required: pip install scipy")
    mat = loadmat(str(mat_path), squeeze_me=True, struct_as_record=False)
    cell_code = mat_path.stem  # B0005

    # 루트에 'cycle' 키 또는 최상위 키 아래 cycle
    cycles_arr = mat.get("cycle")
    if cycles_arr is None:
        for key in mat:
            if key.startswith("__"):
                continue
            val = mat[key]
            if hasattr(val, "cycle"):
                cycles_arr = getattr(val, "cycle", None)
                break
    if cycles_arr is None:
        raise KeyError(f"No 'cycle' in .mat keys: {list(mat.keys())}")

    if not hasattr(cycles_arr, "__len__"):
        cycles_arr = [cycles_arr]

    parsed = []
    for k, cy in enumerate(cycles_arr, start=1):
        step_type = "discharge"
        if hasattr(cy, "type"):
            t = str(cy.type).lower()
            if "charge" in t:
                step_type = "charge"
            elif "impedance" in t:
                step_type = "impedance"
        amb_temp = None
        if hasattr(cy, "ambient_temperature"):
            try:
                amb_temp = float(cy.ambient_temperature)
            except (TypeError, ValueError):
                pass

        if not hasattr(cy, "data") or cy.data is None:
            continue
        data = cy.data
        n = 0
        for name in ("Time", "Voltage_measured", "Voltage_measured"):
            if hasattr(data, name):
                arr = getattr(data, name)
                if arr is not None and hasattr(arr, "__len__"):
                    n = len(np.asarray(arr).flatten())
                    break
        if n == 0:
            continue

        time_arr = getattr(data, "Time", None)
        if time_arr is not None:
            time_arr = np.asarray(time_arr).flatten()
        v_arr = getattr(data, "Voltage_measured", None)
        if v_arr is not None:
            v_arr = np.asarray(v_arr).flatten()
        i_arr = getattr(data, "Current_measured", None)
        if i_arr is not None:
            i_arr = np.asarray(i_arr).flatten()
        t_arr = getattr(data, "Temperature_measured", None)
        if t_arr is not None:
            t_arr = np.asarray(t_arr).flatten()
        cap_arr = getattr(data, "Capacity", None)
        if cap_arr is not None:
            cap_arr = np.asarray(cap_arr).flatten()

        rows = []
        for i in range(n):
            t_s = _safe_float(time_arr, i, 0.0)
            v = _safe_float(v_arr, i)
            i_val = _safe_float(i_arr, i)
            temp_c = _safe_float(t_arr, i)
            cap_ah = _safe_float(cap_arr, i) if cap_arr is not None else None
            if cap_ah == 0.0:
                cap_ah = None
            rows.append((t_s, v, i_val, temp_c, cap_ah))

        parsed.append((k, step_type, amb_temp, rows))

    return cell_code, parsed


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Ingest NASA .mat into cells/cycles/samples")
    parser.add_argument("--mat", type=str, nargs="*", help=".mat paths (default: data/*.mat)")
    parser.add_argument("--chunk", type=int, default=5000, help="Batch size for samples insert")
    args = parser.parse_args()

    backend_root = Path(__file__).resolve().parent.parent
    data_dir = backend_root / "data"
    if args.mat:
        mat_paths = [Path(p) for p in args.mat]
    else:
        mat_paths = list(data_dir.glob("*.mat"))
    if not mat_paths:
        print("No .mat files found. Use --mat path/to/B0005.mat or put files in backend/data/")
        return 1

    conn = get_conn()
    conn.autocommit = False
    cur = conn.cursor()

    try:
        for mat_path in mat_paths:
            if not mat_path.is_file():
                print("Skip (not file):", mat_path)
                continue
            cell_code, cycles = parse_nasa_mat(mat_path)
            cell_id = upsert_cell(cur, cell_code)
            conn.commit()

            for cycle_index, step_type, amb_temp, rows in tqdm(cycles, desc=cell_code):
                cycle_id = upsert_cycle(cur, cell_id, cycle_index, step_type, amb_temp)
                sample_rows = [(cycle_id, r[0], r[1], r[2], r[3], r[4], None) for r in rows]
                chunk = args.chunk
                for s in range(0, len(sample_rows), chunk):
                    insert_samples(cur, sample_rows[s : s + chunk])
                conn.commit()
        print("Done.")
    except Exception as e:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
