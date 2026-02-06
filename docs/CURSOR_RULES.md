# Cursor Rules — AI/ML BMS (All Projects)

Paste into Cursor rules or use as reference. Minimal version for `.cursorrules` is in project root.

---

## Implementation order

- Always implement: **schema → service → router**.
- Keep time-series tables **append-only**; enforce unique keys for **idempotency**.
- Split data layers: **Raw / Feature / Metric** (never mix).

## API & data

- For any endpoint: include **pagination** or **downsample** parameters when returning time-series.
- Put **business logic in services/**; routers must be **thin**.
- Never hardcode secrets; use **.env** and **.env.example**.

## Code style

- Add **TODO blocks** at top of new files: purpose, inputs/outputs, next steps.
- Add **minimal tests**: ingest idempotency + API smoke for each new feature.
- Prefer **docker-compose** for local parity; CI must run **lint + tests + build**.

## Backend

- FastAPI, WebSocket, SQLAlchemy, Alembic, Pydantic.
- JWT Auth, RBAC (admin/operator/engineer/ml).
- Optional: Celery/Redis for async tasks; rate limiting; observability (logging, health).

## Frontend

- React, Vite, TypeScript, React Router.
- State: Zustand or Context; reusable components; dashboard UI patterns; streaming charts.
- Shell: TopBar (48–56px), SideNav (88–120px), Main (12-col grid); status colors (normal/warn/fault) unified.

## AI/ML

- Feature engineering: window/stride; Raw → feature_cell → metric_aging.
- Training pipeline; run tracking (MLflow-lite); evaluation (RMSE/MAE/R²); threshold/decision logic.
- For seed-sensitive models: report **error mean ± std** (e.g. 10 seeds).

## Infra

- Docker, Docker Compose, GitHub Actions (CI/CD), .env strategy, monorepo structure.
