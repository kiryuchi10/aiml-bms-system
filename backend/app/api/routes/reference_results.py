from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.schemas.results import ComparisonTableResponse
from app.services.reference_results_loader import load_reference_results

router = APIRouter()


@router.get("/reference", response_model=ComparisonTableResponse)
def get_reference_comparison_table() -> ComparisonTableResponse:
    csv_path = Path(settings.data_path) / "reference_results.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"Missing reference file: {csv_path}")
    return load_reference_results(csv_path=csv_path, run_id=0)

