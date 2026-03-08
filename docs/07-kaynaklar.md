# Araştırma Kaynakları

Bu dosya, tasarım paketini oluştururken başvurulan güncel kaynakların kısa bir özetini içerir. Çıkarımlar doğrudan kopya değil, kaynakların ürün stratejisine dönüştürülmüş yorumlarıdır.

## 1. Frontend ve Mobil Altyapı

| Kaynak | URL | Tasarım Kararı |
| --- | --- | --- |
| Expo Router | https://docs.expo.dev/router/introduction/ | Dosya tabanlı navigasyon ile hızlı çapraz platform bilgi mimarisi kurulabilir |
| Expo Camera | https://docs.expo.dev/versions/latest/sdk/camera/ | Kamera capture deneyimi ve izin akışı için Expo yeterli |
| Expo ImagePicker | https://docs.expo.dev/versions/latest/sdk/imagepicker/ | Galeriden selfie seçimi için native picker akışı uygun |
| Expo Notifications | https://docs.expo.dev/versions/latest/sdk/notifications/ | Yeniden etkileşim ve ürün alarmları için mobil bildirim altyapısı hazır |
| Expo SecureStore | https://docs.expo.dev/versions/latest/sdk/securestore/ | Token saklama ve hassas yerel veri için güvenli yol |
| EAS Update | https://docs.expo.dev/eas-update/getting-started/ | OTA güncelleme ile istemci iyileştirmeleri hızla dağıtılabilir |
| Expo App Integrity | https://docs.expo.dev/versions/latest/sdk/app-integrity/ | Abuse ve backend kaynak koruması için ileri faz aracı |

## 2. Backend, Veri ve AI Operasyonu

| Kaynak | URL | Tasarım Kararı |
| --- | --- | --- |
| Supabase with Expo | https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native | Expo ile auth ve veri akışı hızlı kurulabilir |
| Supabase RLS | https://supabase.com/docs/guides/database/postgres/row-level-security | Kullanıcı verisi izolasyonu için RLS çekirdek güvenlik katmanı olmalı |
| Supabase Signed Uploads | https://supabase.com/docs/guides/storage/uploads/s3-uploads/signed-uploads | Selfie yüklemelerini private ve kısa ömürlü URL ile yönetmek doğru |
| Supabase Functions | https://supabase.com/docs/guides/functions | BFF ve webhook katmanı için yönetilebilir fonksiyon yüzeyi sağlar |
| Supabase pgvector | https://supabase.com/docs/guides/database/extensions/pgvector | Katalog benzerliği ve öneri sinyali için vektör uzayı mümkün |
| Cloud Run | https://cloud.google.com/run/docs/overview/what-is-cloud-run | CPU yoğun AI işlerini server yönetmeden ölçeklemek için uygun |
| Google Cloud Vision Face Detection | https://cloud.google.com/vision/docs/detecting-faces | Yüz ve yüz özellikleri algısı için yönetilen servis seçeneği |
| MediaPipe Face Landmarker | https://developers.google.com/mediapipe/solutions/vision/face_landmarker | Landmark tabanlı cilt ROI çıkarımı için temel yapı taşı |

## 3. Subscription ve Commerce

| Kaynak | URL | Tasarım Kararı |
| --- | --- | --- |
| RevenueCat React Native | https://www.revenuecat.com/docs/getting-started/installation/reactnative | Cross-platform subscription operasyonu için standart çözüm |
| Apple In-App Purchase | https://developer.apple.com/in-app-purchase/ | iOS abonelik akışları native mağaza kurallarına uygun ilerlemeli |
| Google Play Billing | https://developer.android.com/google/play/billing | Android monetization akışı Play Billing ile uyumlu kurulmalı |
| Awin Publisher Network | https://www.awin.com/us/publishers/why-use-awin | Affiliate genişlemesi için potansiyel commerce ağı |

## 4. Rakip ve Kategori İncelemesi

| Kaynak | URL | Çıkarım |
| --- | --- | --- |
| Style DNA | https://style-dna.com/ | Kategori sadece renk değil, commerce ve wardrobe yönüne kaymış durumda |
| Style DNA App Store | https://apps.apple.com/us/app/style-dna-your-ai-personal-stylist/id1470328818 | Abonelik ve özellik paketleme konusunda referans alınabilir |
| Colorwise Self-Guided Analysis | https://colorwise.me/self-guided-color-analysis | Renk analizi için kullanıcı talebi ve self-service model geçerli |
| My Best Colors App | https://mybestcolors.com/products/my-best-colors-app | Palette derinliği ve tek seferlik satış modeli için referans |

## 5. Gizlilik ve Uyumluluk

| Kaynak | URL | Tasarım Kararı |
| --- | --- | --- |
| Apple App Privacy Details | https://developer.apple.com/app-store/app-privacy-details/ | Veri toplama ve kullanım beyanı mağaza öncesi net hazırlanmalı |
| Google Play Data Safety | https://support.google.com/googleplay/android-developer/answer/10787469 | Veri güvenliği formu ve kullanıcıya şeffaf açıklama zorunlu |
| FTC Consumer Privacy | https://www.ftc.gov/business-guidance/privacy-security/consumer-privacy | Tüketici verisinde şeffaflık ve adil kullanım beklentisi yüksek |
| ICO Biometric Data | https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-information-biometric-data/what-is-biometric-data-and-how-special-category-data-relates-to-biometric-data/ | Yüz verisi işleyen ürünlerde dikkatli veri sınıflandırması gerekir |
| Illinois BIPA | https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004&ChapterID=57 | Biyometrik veriye yaklaşımda açık rıza ve veri yaşam döngüsü kritik |

## 6. Genel Sonuç

Araştırma şunu gösteriyor:

- Teknik olarak Expo + Supabase + managed AI worker kombinasyonu uygulanabilir.
- Pazar tarafında renk analizi tek başına yeterli değil; gerçek karar desteği ve commerce köprüsü gerekiyor.
- En büyük ürün riski model hatası değil, açıklanamayan ve güven vermeyen model hatasıdır.
- En büyük ticari fırsat, palette ürününü günlük stil karar aracına dönüştürmektir.
