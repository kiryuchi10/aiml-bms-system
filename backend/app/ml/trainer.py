"""
Run PyTorch training on pipeline data, compute metrics, optionally persist to DB.
"""

from __future__ import annotations

from typing import Any, Optional

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
except ImportError:
    torch = None
    nn = None
    DataLoader = None

from app.pipelines.data_pipeline import PipelineResult, get_ml_ready
from app.ml.dataset import BatteryDataset
from app.ml.models import build_model


def _check_torch() -> None:
    if torch is None:
        raise RuntimeError("PyTorch is required; install with: pip install torch")


def run_training(
    dataset_key: str,
    model_key: str = "mlp",
    sequence_length: int = 1,
    val_ratio: float = 0.2,
    epochs: int = 5,
    batch_size: int = 32,
    lr: float = 1e-3,
    seed: int = 42,
    device: Optional[str] = None,
) -> dict[str, Any]:
    """
    Load dataset via pipeline, train model, return metrics (train/val MAE, MSE).
    Does not touch DB; caller can create TrainingRun and TrainingResult from result.
    """
    _check_torch()
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    data = get_ml_ready(
        dataset_key,
        sequence_length=sequence_length,
        val_ratio=val_ratio,
        seed=seed,
    )
    if data is None:
        return {
            "ok": False,
            "error": "dataset_not_found_or_too_small",
            "dataset_key": dataset_key,
        }

    train_ds = BatteryDataset(data.X_train, data.y_train)
    val_ds = BatteryDataset(data.X_val, data.y_val)
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size)

    model = build_model(
        model_key,
        n_features=data.n_features,
        sequence_length=data.sequence_length,
    ).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    train_losses: list[float] = []
    val_losses: list[float] = []
    model.train()
    for _ in range(epochs):
        epoch_loss = 0.0
        n = 0
        for xb, yb in train_loader:
            xb, yb = xb.to(device), yb.to(device)
            opt.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            opt.step()
            epoch_loss += loss.item()
            n += 1
        train_losses.append(epoch_loss / max(n, 1))

    model.eval()
    val_loss = 0.0
    n_val = 0
    mae_sum = 0.0
    with torch.no_grad():
        for xb, yb in val_loader:
            xb, yb = xb.to(device), yb.to(device)
            pred = model(xb)
            val_loss += nn.functional.mse_loss(pred, yb).item()
            mae_sum += (pred - yb).abs().sum().item()
            n_val += xb.size(0)
    val_mse = val_loss / max(len(val_loader), 1)
    val_mae = mae_sum / max(n_val, 1)

    return {
        "ok": True,
        "dataset_key": dataset_key,
        "model_key": model_key,
        "train_mse_last": train_losses[-1] if train_losses else None,
        "val_mse": val_mse,
        "val_mae": val_mae,
        "epochs": epochs,
        "n_train": len(data.X_train),
        "n_val": len(data.X_val),
        "error_value": val_mae,  # for DB: store MAE as primary error
    }


def run_training_and_persist(
    dataset_key: str,
    model_key: str = "mlp",
    db_session: Any = None,
    **kwargs: Any,
) -> tuple[int | None, dict[str, Any]]:
    """
    Run training and, if db_session is provided, create TrainingRun + TrainingResult.
    Returns (run_id, result_dict). run_id is None if DB not used.
    """
    result = run_training(dataset_key=dataset_key, model_key=model_key, **kwargs)
    if not result.get("ok") or db_session is None:
        return (None, result)

    from app.models.training_run import TrainingRun, TrainingResult

    run = TrainingRun(status="completed")
    db_session.add(run)
    db_session.flush()

    tr = TrainingResult(
        run_id=run.id,
        dataset_key=dataset_key,
        model_key=model_key,
        error_value=result.get("error_value"),
        error_mean=None,
        error_std=None,
        is_overflow=False,
    )
    db_session.add(tr)
    db_session.commit()
    return (run.id, result)
