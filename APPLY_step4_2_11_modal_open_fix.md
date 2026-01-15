# Step 4_2_11 – Buluntu Listele > "Görüntüle" modal açmıyor

Bu incremental paket, yalnızca `ArtifactDetailModal` bileşenini günceller.

## Sorunun nedeni
Liste ekranındaki buton state'i değiştiriyor; ancak modal bileşeni farklı sürümlerde farklı prop isimleriyle çağrıldığı için (ör. `open` veya `isOpen`) modal görünmüyordu.

## Değişen dosya
- `frontend/src/components/ArtifactDetailModal.jsx`

## Uygulama adımları
1) Bu zip'i repo kök dizininde açın (klasör yapısı korunmalı).
2) Frontend image'ını yeniden build edin:

   docker compose build frontend

3) Container'ları recreate edin:

   docker compose up -d --force-recreate

## Beklenen sonuç
Buluntu Listele ekranında "Görüntüle" tıklanınca detay modal açılmalıdır.
