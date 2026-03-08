# ToneMatch Tasarım Paketi

Bu klasör, kullanıcının fotoğrafından cilt alt tonu tespiti yapıp kadın ve erkek kullanıcılar için kıyafet önerileri üreten, bulut tabanlı ve Expo ile çapraz platform geliştirilecek mobil uygulama için hazırlanmış ürün ve teknik tasarım paketini içerir.

Bu repo artık yalnızca doküman değil; ilk implementasyon iskeletini de içerir:

- `apps/mobile`: Expo Router tabanlı cross-platform mobil uygulama
- `supabase`: Migration ve Edge Function katmanı
- `services/ai-worker`: Cloud Run hedefli FastAPI worker

## İçerik

- `docs/01-vizyon-ve-strateji.md`: Ürün tezi, değer önerisi, konumlandırma ve başarı tanımı
- `docs/02-pazar-kullanicilar-ve-konumlandirma.md`: Pazar gözlemleri, rakipler, persona ve JTBD
- `docs/03-urun-deneyimi-ve-ozellikler.md`: UX akışları, bilgi mimarisi ve özellik kırılımı
- `docs/04-ai-motoru-guven-ve-uyumluluk.md`: AI pipeline, kalite, güven, gizlilik ve uyumluluk
- `docs/05-teknik-mimari-ve-operasyon.md`: Backend, veri modeli, API, devops ve operasyon
- `docs/06-ticari-model-kpi-ve-yol-haritasi.md`: Monetizasyon, KPI, GTM, ekip ve yol haritası
- `docs/07-kaynaklar.md`: Araştırmada kullanılan güncel kaynaklar
- `docs/08-marka-ve-gorsel-sistem.md`: Marka tonu, görsel yön, UI sistemi ve ekran estetiği
- `artifacts/tone-match-master-plan.xlsx`: Yönetim, ürün ve teknik ekiplerin birlikte kullanabileceği çalışma kitabı

## Implementasyon Durumu

İlk uygulama iskeletinde şu alanlar hazır:

- Expo uygulama kabuğu, tema ve sekmeli bilgi mimarisi
- Welcome, Auth, Home, Discover, Scan, Wardrobe ve Profile ekranları
- React Query, Zustand ve Supabase client temeli
- Session aware auth provider ve preview mode
- Supabase SQL şeması ve temel RLS politikaları
- Signed upload için `create-upload` function
- Analiz job yaratımı için `finalize-analysis` function
- Hesap/veri silme için `privacy-delete-account` function
- Cloud Run için FastAPI worker ve görüntüden heuristik renk sinyali çıkaran ilk analiz pipeline'ı
- Kamera / galeri seçimi, signed upload, analysis polling ve query invalidation zinciri
- Worker yoksa Supabase function fallback ile mock sonucu tamamlayan analiz akışı
- Analiz tamamlandığında açılan özel result ekranı
- Wardrobe upload ve wardrobe item listeleme akışı
- Seeded merchant catalog, SQL ranking function ve discover feed
- Premium gating, paywall ekranı ve preview plan switching
- Discover kartlarında feedback gönderimi ve merchant handoff
- Merchant handoff icin click event tracking, open outcome reporting ve exportable commerce log
- Profile içinde subscription state ve genişletilmiş account data export özeti
- Quick Check ekranı, function ve worker endpoint'i
- RevenueCat webhook ile subscription state persist etme altyapısı
- RevenueCat SDK configure, paywall, restore purchases ve customer center wiring
- Merchant catalog ingest function, sync run kayitlari ve local import CLI

Henüz tam uygulanmamış alanlar:

- RevenueCat dashboard product/offering kurulumu ve store-side QA
- Gercek partner feed connector'lari ve affiliate network mapping
- Merchant redirect / affiliate network callback entegrasyonlari
- Gerçek ML / vision model entegrasyonu
- Push notification ve device token akışı
- Wardrobe scoring için gerçek vision pipeline
- Yuz landmark / ROI tabanli daha guclu undertone modeli

## Çalıştırma

1. Bağımlılıkları kur:

   `npm install`

2. Mobil uygulamayı başlat:

   `npm run dev:mobile`

   veya kök dizinden:

   `./start_expo.sh`

   Bu komut varsayilan olarak Expo Go modunda acilir ve terminale QR basar.

   Development build kullanmak istersen:

   `./start_expo.sh native`

   Browser test gerekiyorsa:

   `./start_expo.sh web`

3. Mobil typecheck:

   `npm run typecheck:mobile`

4. Mobil lint:

   `npm run lint:mobile`

5. AI worker local geliştirme:

   `cd services/ai-worker && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt`

   `npm run dev:worker`

   veya kök dizinden tam local backend:

   `./start_backend.sh`

   Bu script local Supabase stack'i ve AI worker'i birlikte ayağa kaldırır. `supabase/functions/.env` dosyasini otomatik yazar.

6. Gerekirse Supabase'i elle resetle:

   `npx supabase@2.77.0 db reset`

7. Calisan servisleri durdur:

   `./stop_expo.sh`

   `./stop_backend.sh`

8. Preview mode:

   `.env` tanımlı değilse ya da sadece UI akışını hızlı görmek istiyorsanız onboarding sonrası `Open preview mode` kullanın.

9. Premium preview:

   Preview mode icinde `/paywall` ekranından `Free`, `Plus` ve `Pro` planlari arasinda gecis yaparak discover gating davranisini test edebilirsiniz.

10. RevenueCat development build:

   Gercek satin alma testi icin Expo Go yetmez. `cd apps/mobile && eas build --profile development --platform ios` veya `cd apps/mobile && eas build --profile development --platform android` kullanin. Bu repo icinde billing Expo Go uyumlulugu icin simdilik kapatilmis durumda.

11. Catalog ingest:

   Local ornek feed ile import denemek icin `SUPABASE_URL` ve `CATALOG_INGEST_SECRET` tanimlayip `npm run ingest:catalog` komutunu calistirin.

   Farkli bir feed icin `node scripts/ingest_catalog_feed.js --file path/to/feed.json --feed merchant-name --deactivate-missing true` kullanabilirsiniz.

12. Dev single-user mode:

   `.env` icindeki `EXPO_PUBLIC_DEV_SINGLE_USER_MODE=true` oldugunda auth ekranı atlanir ve uygulama sabit test kullanicisi ile calisir. Bu modda edge function cagrilari local Supabase ile uyumlu ozel header stratejisi kullanir.

## Ortam Değişkenleri

Kök dizindeki `.env.example` dosyasını doldurun:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_WEB_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_OFFERING_ID`
- `EXPO_PUBLIC_REVENUECAT_PLUS_ENTITLEMENT_ID`
- `EXPO_PUBLIC_REVENUECAT_PRO_ENTITLEMENT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CATALOG_INGEST_SECRET`
- `AI_WORKER_URL`
- `AI_WORKER_SHARED_SECRET`

## Kullanım Notu

Bu ortamda `spreadsheets` skill'inin beklediği `@oai/artifact-tool` paketi bulunmadığı için Excel çalışma kitabı yerel Node tabanlı üretim ile hazırlanmıştır. İçeriğin kaynağı yine bu klasördeki dokümanlardır ve workbook tekrarlanabilir şekilde `npm run build:workbook` komutuyla yeniden üretilebilir.
