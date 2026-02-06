# DB schemas

- **DB_SCHEMA_POSTGRES.sql** — PostgreSQL (Raw / Feature / Metric separation; append-only time-series).
- **DB_SCHEMA_MYSQL.sql** — MySQL 8 equivalent.

Apply with:

- Postgres: `psql -U user -d aimlbms -f db/DB_SCHEMA_POSTGRES.sql`
- MySQL: `mysql -u user -p aimlbms < db/DB_SCHEMA_MYSQL.sql`

Also see `backend/database/` for schema copies used by the app.
