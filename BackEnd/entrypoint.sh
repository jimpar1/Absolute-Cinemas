#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
until python -c "
import os, psycopg2
psycopg2.connect(
    dbname=os.environ.get('DB_NAME', 'cinema_db'),
    user=os.environ.get('DB_USER', 'cinema_user'),
    password=os.environ.get('DB_PASSWORD', 'cinema_pass'),
    host=os.environ.get('DB_HOST', 'db'),
    port=os.environ.get('DB_PORT', '5432'),
)
" 2>/dev/null; do
    echo "  PostgreSQL not ready — retrying in 2s..."
    sleep 2
done
echo "PostgreSQL is ready."

python manage.py migrate --no-input
python manage.py collectstatic --no-input

# Seed accounts on first boot (idempotent)
python manage.py bootstrap_accounts

exec gunicorn cinema_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120
