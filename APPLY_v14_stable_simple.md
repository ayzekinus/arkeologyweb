# v14 Stable Patch (Simple)

Bu patch, `frontend/Dockerfile` dosyasını günceller ve Docker build sırasında `vite: not found` hatasını çözer.

## Uygulama (PowerShell)
Repo kök dizininde:

```powershell
git apply .\DIFF_v14_stable_simple.patch
```

Eğer patch 'does not apply' derse:
- `incremental-update-v14-stable.zip` içindeki `frontend/Dockerfile` dosyasını repodaki aynı konuma manuel kopyalayın.

## Sonra rebuild
```powershell
docker compose down
docker compose build --no-cache frontend
docker compose up -d --force-recreate
```
