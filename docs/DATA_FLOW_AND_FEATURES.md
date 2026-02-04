# BMS 데이터 흐름 & features/*.parquet

## 0) features/*.parquet은 어디서 나오나?

- **저장 위치**: `backend/data/processed/features/`  
  - `soc_features.parquet`, `soh_features.parquet`, `eis_features.parquet`, `thermal_features.parquet`
- **생성 주체**: ML 파이프라인 **Feature Builder**  
  - `ml/pipelines/build_features.py` 또는 `backend/scripts/seed_processed_data.py`
- **생성 단계**: Raw → 정규화/리샘플/세그먼트 → 파생치 계산 → parquet 저장  
- **프론트**: parquet 직접 읽지 않음. 백엔드 API가 JSON으로 제공.

## 1) 전체 데이터 플로우

```
Raw (MAT/CSV/parquet) → Cleaning/Resample → Segment(cycle) → Feature 연산 → features.parquet
                                                                      ↓
Backend Feature Store (feature_store.py) ← data/processed/features/*.parquet
                                                                      ↓
API: /api/pack/summary, /api/cells/grid, /api/timeseries, /api/features/*
                                                                      ↓
Frontend: usePackSummary, useCellGrid, useTimeSeries → DashboardPage
```

## 2) 디렉토리 구조 (데이터)

```
backend/data/
├── raw/                    # NASA B0005~18, WLTP CSV/parquet
├── interim/                # (선택) cycles_parsed, signals_resampled
└── processed/
    ├── features/           # soc, soh, eis, thermal_features.parquet
    └── time_series/        # pack_timeseries.parquet, cell_timeseries.parquet
```

## 3) API ↔ 프론트

| API | 용도 | 훅 / 페이지 |
|-----|------|-------------|
| GET /api/pack/summary | Status Strip (SOC/SOH/SOP/V/I/T/alarm) | usePackSummary, StatusStrip |
| GET /api/cells/grid | Cell Grid (E1~E18, voltage/temp/resistance) | useCellGrid, CellGrid |
| GET /api/timeseries | 차트 다운샘플 | useTimeSeries, Charts |
| GET /api/features/soc, soh, eis, thermal | 피처 요약 (차트/분석) | (추가 시 featureApi) |

## 4) 시드 데이터 생성 (API 테스트용)

```bash
cd aiml-bms-system/backend
python scripts/seed_processed_data.py
```

이후 FastAPI 실행 시 `/api/pack/summary?pack_id=B0005` 등이 동작.

## 5) features 데이터 정의

- **features** = 처리 후 **연산된 값**(파생치/요약치/피팅값)을 출력해 저장한 테이블.
- soc_features: coulomb, dV/dt, OCV residual 등  
- soh_features: capacity_ah, R0, soh_est 등  
- eis_features: Rct, Rs, Warburg, Z@1Hz 등  
- thermal_features: Tmax, dT/dt, hotspot_index 등  
