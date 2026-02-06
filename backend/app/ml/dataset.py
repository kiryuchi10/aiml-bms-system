"""PyTorch Dataset wrapping pipeline arrays for BMS regression."""

from __future__ import annotations

from typing import Optional

import numpy as np

try:
    import torch
    from torch.utils.data import Dataset
except ImportError:
    Dataset = None  # type: ignore
    torch = None  # type: ignore


class BatteryDataset(Dataset):
    """Dataset of (X, y) for battery regression; X shape (seq_len, n_features), y scalar."""

    def __init__(
        self,
        X: np.ndarray,
        y: np.ndarray,
        device: Optional[str] = None,
    ) -> None:
        if torch is None:
            raise RuntimeError("PyTorch is required; install with: pip install torch")
        self.X = torch.from_numpy(X).float()
        self.y = torch.from_numpy(y).float().unsqueeze(1)  # (n, 1)
        self._device = device

    def __len__(self) -> int:
        return len(self.X)

    def __getitem__(self, idx: int):
        x, y = self.X[idx], self.y[idx]
        if self._device:
            x = x.to(self._device)
            y = y.to(self._device)
        return x, y
