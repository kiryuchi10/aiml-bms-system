# Database setup (PostgreSQL)

## 1. Create database and user

From a shell (with PostgreSQL installed):

```bash
# Create user and database (Windows: use psql or pgAdmin)
psql -U postgres -c "CREATE USER aimlbms WITH PASSWORD 'aimlbms';"
psql -U postgres -c "CREATE DATABASE aimlbms OWNER aimlbms;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE aimlbms TO aimlbms;"
```

Or in `psql`:

```sql
CREATE USER aimlbms WITH PASSWORD 'aimlbms';
CREATE DATABASE aimlbms OWNER aimlbms;
\c aimlbms
GRANT ALL ON SCHEMA public TO aimlbms;
```

## 2. Create tables

**Option A – Run SQL file**

```bash
psql -U aimlbms -d aimlbms -f database/schema.sql
```

**Option B – Python (SQLAlchemy)**

From `backend/`:

```bash
python -m app.db.create_tables
```

## 3. Load data from `backend/data`

From `backend/`:

```bash
python -m app.db.seed_data
```

This loads:

- **reference_results.csv** → `datasets`, `ml_models`, one `training_run`, and `training_results`
- **WLTP_Driving_cycle_reference.csv** → `wltp_reference`

## 4. Verify

```bash
psql -U aimlbms -d aimlbms -c "\dt"
```

You should see: `datasets`, `ml_models`, `training_runs`, `training_results`, `wltp_reference`.

## ERD

See [docs/ERD.md](../../docs/ERD.md) (project root) for the Entity Relationship Diagram.
