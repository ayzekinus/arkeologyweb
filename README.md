# Arkeoloji Monorepo (Django + React) — Docker ile

Bu repo, arkeolojik kazı için geliştireceğimiz sistemin **Docker üzerinde ayağa kalkabilen** temel iskeletidir.

## Servisler
- **PostgreSQL** (`db`)
- **Redis** (`redis`) — ileride Celery/queue için
- **Django + DRF** (`backend`) — `http://backend:8000`
- **React (Vite build) + Nginx** (`frontend`) — dışarıya **:8080** ile açılır
  - `GET /api/*` isteklerini backend'e proxy eder

## Hızlı Başlangıç

1) Ortam değişkenlerini oluşturun:
```bash
cp .env.example .env
```

2) Ayağa kaldırın:
```bash
docker compose up --build
```

3) Tarayıcı:
- Frontend: `http://localhost:8080`
- API health: `http://localhost:8080/api/health/`

## İlk Migrasyon / Superuser
Ayrı terminal:
```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

Admin:
- `http://localhost:8080/admin/`

## Notlar
- Bu iskelet **prod'a uygun** şekilde (gunicorn + nginx) kurgulandı.
- İleride: Celery worker + beat, S3/MinIO medya, gelişmiş arama ve dinamik form şeması eklenecek.
