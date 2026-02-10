# DB Schemas & NASA .mat 파이프라인

## 스키마 개요

| 파일 | 용도 |
|------|------|
| **DB_SCHEMA_MYSQL.sql** | BMS 대시보드/ML용 메인 스키마 (FIXED). vehicle → telemetry_pack / telemetry_cell / feature_cell / alarm_event / ml_run 등 |
| **DB_SCHEMA_MYSQL_NASA_RAW.sql** | NASA 배터리 실험 raw 계층: cells → cycles → samples (.mat 적재용) |
| **DB_SCHEMA_POSTGRES.sql** | PostgreSQL용 동일 구조 |

## 적용 순서

### MySQL (aimlbms — BMS 앱용)

```bash
mysql -u root -p -e "CREATE DATABASE aimlbms CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
mysql -u root -p aimlbms < db/DB_SCHEMA_MYSQL.sql
```

### NASA Raw 전용 DB (선택)

```bash
mysql -u root -p -e "CREATE DATABASE bms_nasa CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
mysql -u root -p bms_nasa < db/DB_SCHEMA_MYSQL_NASA_RAW.sql
```

## FIXED 스키마 요약 (DB_SCHEMA_MYSQL.sql)

- **ENGINE=InnoDB**, **DEFAULT CHARSET=utf8mb4**
- FK 삭제 정책: `ON DELETE CASCADE` / `ON UPDATE CASCADE` (ml_run.vehicle_id 만 `SET NULL`)
- **UNIQUE** 로 중복 적재 방지: `(vehicle_id, ts)`, `(vehicle_id, module_id, cell_id, ts)` 등
- **TINYINT(1)** 로 balancing / onoff 명시
- 인덱스: `(vehicle_id, ts)`, `(vehicle_id, module_id, cell_id, ts)` 등 조회 패턴에 맞춤

## NASA .mat → MySQL 적재

### 1) BMS 테이블(vehicle/telemetry_cell)에 넣기 — 대시보드 연동

기존 파이프라인 사용 (동일 DB aimlbms):

```bash
cd backend
python -m app.pipelines.nasa.parse_mat --mat data/B0005.mat --vehicle-id 1 --batch 5000
```

→ `vehicle_id=1`, `telemetry_cell` 에 적재되며 대시보드에서 바로 사용 가능.

### 2) Raw 계층(cells/cycles/samples)에 넣기 — 실험/분석용

1. NASA Raw 스키마 생성 (위 `bms_nasa` 또는 별도 DB).
2. 의존성: `pip install scipy pandas mysql-connector-python tqdm`
3. 환경변수 예시 (또는 스크립트 내 `_db_config()` 수정):

   ```bash
   export MYSQL_HOST=localhost
   export MYSQL_USER=root
   export MYSQL_PASSWORD=YOUR_PASSWORD
   export MYSQL_DATABASE=bms_nasa
   ```

4. 실행:

   ```bash
   cd backend
   python scripts/ingest_nasa_mat_to_mysql.py
   # 또는
   python scripts/ingest_nasa_mat_to_mysql.py --mat data/B0005.mat data/B0006.mat --chunk 5000
   ```

`.mat` 구조가 다르면 `scripts/ingest_nasa_mat_to_mysql.py` 의 `parse_nasa_mat()` 만 실제 키/필드에 맞게 수정하면 됨. 구조 확인:

```python
from scipy.io import loadmat
mat = loadmat("data/B0005.mat", squeeze_me=True, struct_as_record=False)
print(mat.keys())
# 루트 객체가 있으면
root = mat["B0005"]  # 또는 실제 키명
print(dir(root))
```

## 아키텍처 (참고)

- **raw_*** : 원본 로그 그대로 (가공 최소) → cells/cycles/samples 또는 telemetry_*
- **clean_*** : 이상치/결측 처리 후 (선택)
- **features_*** : rolling/fft/health feature → feature_cell
- **pred_*** : SoC/SoH/RUL 결과 → ml_run/ml_metric

처음에는 **raw만** 제대로 넣어도 대시보드는 동작합니다.

## ERD 보기

`db/ERD_VIEW.md` 참고 (CLI / Workbench / Mermaid).
