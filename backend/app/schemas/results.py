from pydantic import BaseModel, ConfigDict


class ResultCell(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    dataset_key: str
    model_key: str
    display: str
    error_value: float | None = None
    error_mean: float | None = None
    error_std: float | None = None
    is_overflow: bool = False
    overflow_threshold: float | None = 1000.0


class ComparisonTableResponse(BaseModel):
    run_id: int
    datasets: list[str]
    models: list[str]
    cells: list[ResultCell]

