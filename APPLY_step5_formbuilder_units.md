# Step 5 – FormBuilder Unit Options Fix (Incremental)

Bu paket, **ölçü (measure)** alanlarındaki *unit* seçeneklerini artık **FormBuilder şemasından** alacak şekilde düzeltir.

- Admin’de (Form Builder) ölçü alanının `unit_group`’u tanımlıysa, backend şema çıktısında `unit_options` otomatik oluşur.
- `choices` artık **unit_group** olan alanlarda boş döner (unit seçenekleri `choices` içine karışmasın diye).
- Frontend ölçü alanı unit dropdown’ı **önce `unitOptions`** (API’dan) kullanır; yoksa eski `UNITS[...]` fallback’ine düşer.

## 1) Uygulama
Repo kök dizininde (docker-compose.yml’nin olduğu klasör):

```powershell
# Windows PowerShell
Expand-Archive -Force .\incremental-update-step5-formbuilder-units.zip .
```

veya

```bash
# Linux/macOS
unzip -o incremental-update-step5-formbuilder-units.zip -d .
```

## 2) Docker rebuild

```bash
docker compose build backend frontend

docker compose up -d
```

## 3) Kontrol
1. Admin (Django Admin) > Form Builder > ilgili ölçü alanı:
   - `unit_group` = `length` / `weight` vb.
   - (Opsiyonel) `choices` alanına JSON olarak unit kısıtlaması girebilirsiniz:
     - Örnek: `["mm","cm","m"]`
2. UI > Buluntu Oluştur > Ölçüler:
   - Unit dropdown’ının artık **FormBuilder’dan** gelmesi gerekir.

## Not
Bu paket migration içermez.
