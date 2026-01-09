# v14 Stable - Frontend build fix (vite not found)

Bu güncelleme Docker build sırasında `vite: not found` hatasını önlemek için `frontend/Dockerfile` dosyasını günceller.

## Seçenek A (Önerilen): Patch ile uygula
Repo kök dizininde:

### PowerShell
```powershell
git apply .\DIFF_v14_stable.patch
```

### Git Bash / macOS / Linux
```bash
git apply DIFF_v14_stable.patch
```

## Seçenek B: Incremental zip ile manuel kopyala
`incremental-update-v14-stable.zip` içindeki dosyayı repoda aynı konuma kopyalayın:
- `frontend/Dockerfile`

## Rebuild
```powershell
docker compose down
docker compose build --no-cache frontend
docker compose up -d --force-recreate
```

Not: `docker-desktop://...` linkleri PowerShell'de çalıştırılmaz; sadece Docker Desktop UI içinde açılır.
