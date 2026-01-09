# Incremental Update: Export endpoint fix + PDF layout

Bu paket yalnızca değişen dosyaları içerir.

## 1) Dosyaları kopyalayın
Zip içindeki dosyaları repo köküne aynı path ile kopyalayın:

- backend/api/viewsets.py
- frontend/src/pages/BuluntuList.jsx

## 2) Container rebuild
Backend tarafında PDF/Excel export için reportlab/openpyxl zaten requirements'ta olmalı; yine de güvenli olması için rebuild önerilir:

```powershell
docker compose down
docker compose build --no-cache backend frontend
docker compose up -d --force-recreate
```

## 3) Test
Tarayıcıdan:

- `http://localhost:8080/api/artifacts/<ID>/export/?format=pdf`
- `http://localhost:8080/api/artifacts/<ID>/export/?format=xlsx`
- `http://localhost:8080/api/artifacts/<ID>/export/?format=csv`

Not: `<ID>` değeri `artifact_no` değil, API’nin döndürdüğü `id` alanıdır.
