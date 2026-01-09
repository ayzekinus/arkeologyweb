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

## API
- `/api/main-codes/` (GET/POST)
- `/api/artifacts/` (GET/POST)


- `/api/artifacts/check-unique/?main_code=<id>&artifact_no=<no>` (GET)


## Troubleshooting
### 404 (check-unique) veya güncellemeler görünmüyor
Docker eski imajı çalıştırıyor olabilir. Temiz rebuild:
```bash
docker compose down
docker compose up --build --no-cache
```
Gerekirse DB volume da sıfırla:
```bash
docker compose down -v
docker compose up --build --no-cache
```


## Debug
- `/api/routes/` : Artifact viewset extra action'larını gösterir. `check-unique` burada görünmelidir.

## Güncelleme sonrası 404 görürseniz
Eski Docker imajı çalışıyor olabilir. Tam temizlik:
```bash
docker compose down -v --rmi all --remove-orphans
docker compose up -d --build --no-cache --force-recreate
```

## UI Şema (Schema)
- `frontend/src/schemas/artifactSchemas.js` Buluntu Detay Modal'ında form alanlarını okunur şekilde render etmek için kullanılır.


## Dinamik Buluntu Formu
- Buluntu oluştur ekranındaki form detayları ve ölçü alanları şema (schema) üzerinden render edilir.
- Şemalar: `frontend/src/schemas/artifactSchemas.js`
- Renderer bileşeni: `frontend/src/components/SchemaFields.jsx`
Bu sayede yeni alan eklemek için çoğu durumda sadece schema dosyasını güncellemek yeterlidir.


## Buluntu Düzenle (Edit)
- Buluntu listesinde "Düzenle" ile kayıt form'a taşınır ve PATCH ile güncellenir.
- Unique kontrolünde `exclude_id` kullanılır.

## Anakod Detayda Bağlı Buluntular
- Anakod listesinde "Görüntüle" ile Anakod detay modal açılır.
- Modal içinde ilgili anakoda bağlı buluntular listelenir (`/api/artifacts/?main_code=<id>`).
- Buluntu satırında "Görüntüle" ile Buluntu detay modal açılır.


## React -> Tailwind dönüşümü (adım adım)
Bu sürümde Tailwind altyapısı kuruldu ve ortak bileşenler Tailwind'e taşındı:
- Modal / Row / SchemaFields / Detay Modalları / Layout
Sonraki adımda sayfa bileşenleri (Anakod, Buluntu, Dashboard) adım adım Tailwind sınıflarına geçirilecektir.

### Frontend bağımlılıkları
`frontend/package.json` içine Tailwind devDependencies eklendi. Docker build sırasında otomatik kurulur.


### Tailwind dönüşümü — v11
- Dashboard ve Anakod sayfaları Tailwind'e geçirildi.
- Buluntu sayfası bir sonraki adımda dönüştürülecektir.


### Tailwind dönüşümü — v12
- Buluntu sayfası Tailwind'e geçirildi (create/edit + liste + detay modal).
