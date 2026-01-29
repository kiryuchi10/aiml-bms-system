from __future__ import annotations

import csv
import re
from pathlib import Path

from app.schemas.results import ComparisonTableResponse, ResultCell


_OVER_RE = re.compile(r"^\s*>\s*(\d+(?:\.\d+)?)\s*$")
_PM_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)\s*$")
_NUM_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*$")


def _parse_cell(value: str) -> tuple[str, float | None, float | None, float | None, bool, float | None]:
    v = (value or "").strip()
    if not v:
        return "", None, None, None, False, None

    m = _OVER_RE.match(v)
    if m:
        thr = float(m.group(1))
        return f">{int(thr) if thr.is_integer() else thr}", None, None, None, True, thr

    m = _PM_RE.match(v)
    if m:
        mean = float(m.group(1))
        std = float(m.group(2))
        display = f"{int(mean) if mean.is_integer() else mean}±{int(std) if std.is_integer() else std}"
        return display, None, mean, std, False, None

    m = _NUM_RE.match(v)
    if m:
        num = float(m.group(1))
        display = f"{int(num) if num.is_integer() else num}"
        return display, num, None, None, False, None

    # Fallback: keep raw
    return v, None, None, None, False, None


def load_reference_results(csv_path: Path, run_id: int = 0) -> ComparisonTableResponse:
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        datasets = [c for c in (reader.fieldnames or []) if c != "model"]
        models: list[str] = []
        cells: list[ResultCell] = []

        for row in reader:
            model_name = (row.get("model") or "").strip()
            if not model_name:
                continue
            models.append(model_name)
            for ds in datasets:
                display, val, mean, std, is_over, thr = _parse_cell(row.get(ds, ""))
                cells.append(
                    ResultCell(
                        dataset_key=ds,
                        model_key=model_name,
                        display=display,
                        error_value=val,
                        error_mean=mean,
                        error_std=std,
                        is_overflow=is_over,
                        overflow_threshold=thr,
                    )
                )

    return ComparisonTableResponse(run_id=run_id, datasets=datasets, models=models, cells=cells)

