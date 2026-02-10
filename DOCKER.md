# Running Backend + Frontend with Docker

## Quick start

From the project root (`aiml-bms-system`):

```powershell
docker compose up -d
```

Then:

- **Frontend:** http://localhost:5173  
- **Backend API:** http://localhost:8000  
- **API docs:** http://localhost:8000/docs  

## First-time: create DB tables

After the first `docker compose up`, create the MySQL schema:

**Option A — SQL file (recommended):**

```powershell
Get-Content db\DB_SCHEMA_MYSQL.sql | docker compose exec -T db mysql -uroot -p12345 aimlbms
```

**Option B — SQLAlchemy (if all models are in `create_tables`):**

```powershell
docker compose exec backend python -m app.db.create_tables
```

## Useful commands

| Command | Description |
|--------|-------------|
| `docker compose up -d` | Start all services in background |
| `docker compose up` | Start and show logs (Ctrl+C to stop) |
| `docker compose down` | Stop and remove containers |
| `docker compose ps` | List running services |
| `docker compose logs -f backend` | Follow backend logs |

## Note

- You **run** Docker with `docker compose up`, not by “running” the `docker-compose.yml` file.
- `.\docker-compose.yml` only opens the file; it does not start the stack.
