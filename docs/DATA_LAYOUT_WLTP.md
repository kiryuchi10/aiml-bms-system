# WLTP 데이터 레이아웃 및 사용처

WLTP_Driving_cycle_reference.zip 압축 해제 후, 아래 파일들을 **backend/data/** 에 두어야 합니다.  
(백엔드 `DATA_DIR` 기본값: `./data` → 실행 시 `backend/data` 기준)

## 필수 파일 목록

| 파일 | 용도 | 로딩/사용처 |
|------|------|-------------|
| **B0005.mat** | NASA PCoE 배터리 B0005 원시 데이터 | `nasa_mat_loader`, WS/대시보드 리플레이 |
| **B0006.mat** | NASA PCoE 배터리 B0006 | 동일 |
| **B0007.mat** | NASA PCoE 배터리 B0007 | 동일 |
| **B0018.mat** | NASA PCoE 배터리 B0018 | 동일 |
| **pack_timeseries.parquet** | 팩 레벨 시계열 (V, I, T, SoC 등) | `parquet_bms_loader`, 대시보드/WS |
| **cell_timeseries.parquet** | 셀 레벨 시계열 | 셀 그리드/열맵, EDA |
| **soh_features.parquet** | SoH 관련 피처 (cycle, soh_actual, soh_pred 등) | SoH 트렌드/ML, Battery Doctor 차트 |
| **soc_features.parquet** | SoC 관련 피처 | SoC 트렌드, 연료게이지 |
| **thermal_features.parquet** | 열 관련 피처 | Thermal 맵, 알람/리스크 |
| **eis_features.parquet** | EIS(임피던스) 피처 | EIS 클러스터, AI Insights |

## 디렉터리 구조 (권장)

```
backend/
  data/                    # DATA_DIR (환경변수로 변경 가능)
    B0005.mat
    B0006.mat
    B0007.mat
    B0018.mat
    pack_timeseries.parquet
    cell_timeseries.parquet
    soh_features.parquet
    soc_features.parquet
    thermal_features.parquet
    eis_features.parquet
```

- **.mat**: WebSocket `/ws/bms?dataset=B0005` 및 대시보드 overview/cell-grid 소스 (mat 우선, 없으면 parquet).
- **pack_timeseries.parquet**: `get_first_available_dataset_key()` 등으로 기본 parquet 키로 사용 가능. 컬럼 매핑은 `parquet_bms_loader.COL_*` 참고.
- **soh_features.parquet**: SoH 트렌드 API(`/api/v1/analytics/soh?days=`) 및 Anomaly 스코어 확장 시 사용.
- **thermal_features / eis_features**: Thermal 맵, EIS 클러스터 등 고급 대시보드/ML에서 사용 (필요 시 API 확장).

## 데이터 로딩 순서 (백엔드)

1. **대시보드/WS**: `dashboard_service.get_current_snapshot(key, row_index)` → mat 있으면 `nasa_mat_loader`, 없으면 `parquet_bms_loader` (pack_timeseries 등).
2. **Analytics SoH/Anomaly**: `analytics_service` → parquet 또는 soh_features.parquet에서 cycle/soh/anomaly_score 읽기.
3. **DB 적재(선택)**: `scripts/ingest_nasa_mat_to_mysql.py`로 .mat → MySQL `telemetry_cell`; ingest API로 parquet → feature/cycle 테이블.

## 프론트엔드

- **No mock**: 모든 차트/그리드는 REST(`/api/v1/dashboard/*`, `/api/v1/analytics/*`) 또는 WebSocket `/ws/bms` 데이터만 사용.
- 데이터 없을 때: "No data. Place WLTP files in backend/data." 등 안내 표시.
