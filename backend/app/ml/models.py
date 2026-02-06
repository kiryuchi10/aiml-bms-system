"""Simple PyTorch models for BMS regression (SOC/capacity proxy, cycle-life, etc.)."""

from __future__ import annotations

from typing import Any

try:
    import torch
    import torch.nn as nn
except ImportError:
    torch = None  # type: ignore
    nn = None  # type: ignore


def _check_torch() -> None:
    if torch is None or nn is None:
        raise RuntimeError("PyTorch is required; install with: pip install torch")


if torch is not None and nn is not None:

    class MLPRegressor(nn.Module):
        """MLP for regression: flatten input (seq_len, n_features) -> hidden -> 1."""

        def __init__(
            self,
            n_features: int,
            sequence_length: int = 1,
            hidden: list[int] | None = None,
            dropout: float = 0.0,
        ) -> None:
            super().__init__()
            hidden = hidden or [64, 32]
            inp = n_features * sequence_length
            layers: list[nn.Module] = []
            for h in hidden:
                layers.append(nn.Linear(inp, h))
                layers.append(nn.ReLU())
                layers.append(nn.Dropout(dropout))
                inp = h
            layers.append(nn.Linear(inp, 1))
            self.net = nn.Sequential(*layers)

        def forward(self, x: Any) -> Any:
            x = x.flatten(1)
            return self.net(x)

    class Conv1DRegressor(nn.Module):
        """1D CNN + FC for sequence regression."""

        def __init__(
            self,
            n_features: int,
            sequence_length: int = 1,
            channels: list[int] | None = None,
            kernel_size: int = 3,
        ) -> None:
            super().__init__()
            channels = channels or [16, 32]
            layers: list[nn.Module] = []
            in_c = n_features
            for c in channels:
                layers.append(nn.Conv1d(in_c, c, kernel_size, padding=kernel_size // 2))
                layers.append(nn.ReLU())
                in_c = c
            self.conv = nn.Sequential(*layers)
            self.fc_in = channels[-1] * sequence_length
            self.fc = nn.Linear(self.fc_in, 1)

        def forward(self, x: Any) -> Any:
            x = x.transpose(1, 2)
            x = self.conv(x)
            x = x.flatten(1)
            return self.fc(x)

else:
    MLPRegressor = None  # type: ignore
    Conv1DRegressor = None  # type: ignore


def build_model(
    model_key: str,
    n_features: int,
    sequence_length: int = 1,
    **kwargs: Any,
) -> Any:
    """Build model by key. Keys: mlp, conv1d."""
    _check_torch()
    key = (model_key or "mlp").lower()
    if key == "mlp":
        return MLPRegressor(n_features, sequence_length, **kwargs)
    if key == "conv1d":
        return Conv1DRegressor(n_features, sequence_length, **kwargs)
    return MLPRegressor(n_features, sequence_length, **kwargs)
