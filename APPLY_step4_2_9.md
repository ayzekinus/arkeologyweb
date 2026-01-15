# Step 4_2_9 – FormBuilder Unit Options + Buluntu Detay Modal Fix

Bu zip **sadece değişen dosyaları** içerir.

## Uygulama
1) Zip’i proje kök dizinine açın (docker-compose.yml ile aynı dizin).
2) Cache yüzünden eski build kalmasın diye:
   - `docker compose down`
   - `docker compose build --no-cache frontend backend`
   - `docker compose up -d`

## Kontrol
- Buluntu Oluştur > Ölçüler: birim dropdown’ları `mm/cm/m` gibi birimleri göstermeli.
- Admin’de Form Builder’da bir form alanı tanımı yoksa, frontend artık “fallback” ile alanları göstermemeli; uyarı göstermeli.
- Buluntu Detay Modal: Anakod “-” yerine anakod kodunu göstermeli ve detay alanlar (serializer’daki alanlar) gelmeli.
