# Backend: FastAPI + MySQL
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY app ./app

# Tables: run once after first start: docker compose exec backend python -m app.db.create_tables
# Or apply db/DB_SCHEMA_MYSQL.sql to the MySQL container.
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
