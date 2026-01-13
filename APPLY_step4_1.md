Step 4.1 – Buluntu Genel Bilgiler alanlarını listeye göre düzenleme

1) ZIP içindeki dosyaları proje kök dizinine kopyalayın (backend/ ve frontend/ klasörleri korunmalı).
2) Migration çalıştırın:
   docker compose exec backend python manage.py migrate
3) Frontend'i yeniden build edin:
   docker compose build --no-cache frontend
   docker compose up -d --force-recreate

Not:
- Buluntu Oluştur ekranı artık sadece "oluşturma" odaklıdır (liste sayfası BuluntuList'te kalır).
- Anakod seçildiğinde Buluntu Yeri / PlanKare / Tabaka / Seviye / Mezar No alanları sadece görüntülenir (değiştirilemez).
- Yeni eklenen alanlar: Form/Obje, Üretim Yeri, B. Yeri Diğer.
