FROM python:3.12-slim
WORKDIR /app

# Requirements first (layer cache)
COPY web/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Backend code
COPY web/backend/ .

# database module from app/ — after backend copy so it won't be overwritten
COPY app/database/db.py ./database/db.py
RUN python -c "open('database/__init__.py','w').close()"

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
