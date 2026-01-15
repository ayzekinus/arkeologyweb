# Step4_2_12 - Buluntu Detay Modal (kart/section tasarimi, FormBuilder schema ile)

## 1) Dosyalari kopyalayin
Bu zip'i repo kokune (docker-compose.yml olan klasor) acin. Mevcut dosyanin ustune yazilacak dosya:

- `frontend/src/components/ArtifactDetailModal.jsx`

## 2) Build/Run
PowerShell:

```powershell
docker compose build frontend
docker compose up -d --force-recreate
```

## 3) Kontrol
- Buluntu Listele > Goruntule: Modal acilmali.
- Modal icinde "Genel Bilgiler" ve secilen forma ait alanlar, FormBuilder schema'ya gore bolumler halinde kart olarak gorunmeli.
- Bos olan alanlar modalda gosterilmez (form cok kalabalik olmamasi icin).

## Not
Eger FormBuilder schema bulunamazsa (admin'de form yoksa), modal yine acilir ve yalnizca o anki kaydin temel bilgilerini gosterir.
