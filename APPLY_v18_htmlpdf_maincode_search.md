# Incremental Update v18: HTML->PDF Export + ReportLab PDF iyileştirme + Anakod Detay'da arama

Bu zip yalnızca değişen dosyaları içerir.

## 1) Dosyaları kopyalayın
Zip içindeki dosyaları repo köküne aynı path ile kopyalayın:

- backend/Dockerfile
- backend/requirements.txt
- backend/arkeoloji/settings.py
- backend/api/viewsets.py
- frontend/src/components/MainCodeDetailModal.jsx

## 2) Docker rebuild (zorunlu)
HTML->PDF için `weasyprint` ve sistem kütüphaneleri eklendiği için backend image rebuild edilmelidir:

```powershell
docker compose down
docker compose build --no-cache backend frontend
docker compose up -d --force-recreate
```

## 3) Test

### Export
Aşağıdaki ikisi de çalışır:

- `http://localhost:8080/api/artifacts/<ID>/export/?export=pdf`
- `http://localhost:8080/api/artifacts/<ID>/export/?format=pdf`

Notlar:
- `export=pdf` -> HTML->PDF (WeasyPrint) ile “UI benzeri” PDF üretir.
- WeasyPrint yüklenemezse otomatik olarak ReportLab fallback devreye girer.
- `export=pdf_reportlab` veya `export=pdf_simple` ile direkt ReportLab alabilirsiniz.
- `export=html` ile “yazdırılabilir HTML” preview döner.

### Anakod Detay Modal - Bağlı Buluntular
- Anakod detay modalında “Buluntu ara” alanından arama yapın.
- Arama server-side çalışır (`q` parametresi) ve pagination ile birlikte ilerler.
