# Ürün Deneyimi ve Özellikler

## 1. Ürün Akışı Özeti

ToneMatch'in temel kullanıcı akışı şudur:

1. Kullanıcı uygulamayı açar.
2. Kısa onboarding ile değer önerisini görür.
3. Kamera veya galeriden selfie verir.
4. Sistem kalite kontrolü yapar.
5. Undertone ve renk profili sonucu çıkar.
6. Kullanıcı sonuç ekranında kendi paletini, uygun tonları ve kaçınılacak tonları görür.
7. Aynı anda shoppable öneriler ve kombin akışı açılır.
8. Kullanıcı favoriler, kaydetme, wardroba ekleme veya premium yükseltme aksiyonu alır.

## 2. Bilgi Mimarisi

Ana navigasyon önerisi:

- `Home`
- `Discover`
- `Scan`
- `Wardrobe`
- `Profile`

### Home

- Günün önerisi
- Son analiz özeti
- Yeniden tarama CTA
- Yaklaşan durumlara göre öneriler

### Discover

- Renk uyumlu ürün akışı
- Occasion bazlı look'lar
- Renk filtresi
- Marka, bütçe, kategori filtreleri

### Scan

- Kamera açılışı
- Çekim rehberi
- Analiz durumu
- Tekrar çekim yönetimi

### Wardrobe

- Kullanıcının eklediği parçalar
- Renk uyumu uyarıları
- Kombin eşleştirmeleri

### Profile

- Stil profili
- Paletler
- Abonelik
- Gizlilik ve veri yönetimi

## 3. Onboarding Tasarımı

Onboarding dört ekranı geçmemelidir:

1. Değer: "En iyi renklerini bul"
2. Sonuç: "Gerçek kıyafet önerileri al"
3. Güven: "Fotoğrafların gizli tutulur ve kontrol sende"
4. Giriş: Apple, Google, e-posta veya misafir başlangıç

Misafir başlangıç kritik olabilir; çünkü ilk değeri üyelikten önce göstermek dönüşümü artırabilir. Ancak sonuç kaydetme, tekrar erişim ve premium için hesap açma tetiklenmelidir.

## 4. Capture Deneyimi

Fotoğraf kalitesi ürün doğruluğunun temeli olduğu için capture deneyimi ürünün çekirdeğidir.

### Giriş yönergeleri

- Yüz net görünsün
- Ağır filtre ve makyaj olmasın
- Gözlük çıkarılsın
- Doğal ışık tercih edilsin
- Çok sıcak veya çok soğuk sahne ışığı varsa uyarı verilsin

### Canlı kalite kontrolü

- Yüz kadraj dışında ise uyar
- Işık aşırı sertse uyar
- Görüntü bulanıksa uyar
- Birden fazla yüz varsa engelle
- Yüzde ağır gölge varsa alternatif çekim iste

### Sonuç davranışı

- Kalite yeterliyse direkt analiz
- Sınırdaysa "analiz ederiz ama doğruluk düşebilir" seçeneği
- Kötüyse yeniden çekim mecburi

## 5. Sonuç Ekranı

Sonuç ekranı sadece bilgi değil, dönüşüm ekranı olmalıdır.

İçerik blokları:

- Ana sonuç: Warm / Cool / Neutral / Olive ekseni
- Yardımcı profil: light-deep, soft-bright, low-high contrast
- Güven skoru
- Sana çok iyi giden renkler
- Dikkat edilmesi gereken renkler
- Yüz çevresinde tercih etmen gereken tonlar
- Erkek veya kadın için en faydalı ilk kategori önerileri
- "Şimdi alışverişe başla" CTA

### Açıklama örneği

"Sıcak alt ton ve orta kontrast profiline sahipsin. Bu nedenle kirli bej, sıcak lacivert, petrol, ekru ve zeytin tonları yüz çevrende daha dengeli çalışır."

## 6. Premium Mantığı

Premium paywall ilk sonuçtan önce konmamalıdır. En doğru model:

- Kullanıcı temel analiz sonucunu görür
- Daha derin rapor, sınırsız tarama ve günlük öneriler premium olur

### Free plan

- 1 başlangıç analizi
- Temel palet
- Sınırlı ürün önerisi
- Sınırlı save/favorite

### Premium

- Sınırsız analiz
- Gelişmiş renk raporu
- Occasion bazlı look'lar
- Günlük outfit akışı
- Gelişmiş gardırop eşleştirme
- Yeni gelen ürünlerde kişisel uyarılar
- "Bu bana uyar mı?" hızlı skor aracı

## 7. Ana Özellikler

### 7.1 Undertone Scan

MVP'nin çekirdeği. Bulut analizi ile undertone ve renk profili üretir.

### 7.2 Personal Palette

Kullanıcının çekirdek renk kartı. Şunları içermelidir:

- Core colors
- Neutrals
- Accent colors
- Avoid list
- Occasion color notes

### 7.3 Shop by Tone

Ürün akışını paletteen türetir. Kategori örnekleri:

- Tops
- Outerwear
- Dresses
- Shirts
- Trousers
- Suits
- Accessories

### 7.4 Occasion Looks

Senaryo bazlı akış:

- Office
- Date
- Wedding guest
- Smart casual
- Holiday
- Content day

### 7.5 Wardrobe Match

Kullanıcı kendi kıyafet fotoğrafını ekler. Sistem:

- Renk etiketler
- Uygunluk skoru verir
- Kombin eşleştirir
- Eksik tamamlayıcı parça önerir

### 7.6 Quick Check

Mağazada ürün fotoğrafı çekilip hızlı yanıt alınır:

- "İyi uyum"
- "Sınırda"
- "Yüz çevresi için zayıf, alt parça için daha uygun"

Bu özellik premium retention için önemlidir.

## 8. Geri Bildirim Sistemi

AI ürünlerinde kullanıcı geri bildirimi olmadan kalite sürdürülemez. Her öneri setinde şu mikromekanik olmalıdır:

- "Bu bana uygun"
- "Renk iyi, model kötü"
- "Çok sıcak"
- "Çok soluk"
- "Bunu sevmedim"

Bu sinyaller recommendation katmanını ve açıklama dilini zamanla iyileştirir.

## 9. Bildirim Stratejisi

Bildirimler spam değil, karar anı destekleyicisi olmalıdır.

Örnekler:

- "Profiline çok uyan yeni 12 üst giyim ürünü geldi"
- "Bu hafta iş stili için 3 yeni kombin hazır"
- "Favorilerindeki tonlarda indirim var"
- "Akşam etkinliği için hızlı look önerileri hazır"

Frekans:

- İlk hafta davranışa göre uyarlamalı
- Varsayılan düşük sıklık
- Kullanıcı kategori bazlı kapatabilmeli

## 10. UX İlkeleri

### İlk ilke: Sonuçlar öğretici olmalı

Kullanıcı zamanla kendi başına daha iyi karar vermeyi öğrenmelidir.

### İkinci ilke: Kullanıcı utandırılmamalı

"Bu sana gitmez" yerine daha iyi alternatif gösterilmelidir.

### Üçüncü ilke: Moda değil karar ürünü

İçerik estetik olabilir, ama ana amaç karar kalitesidir.

## 11. Tasarım Dili

Önerilen arayüz karakteri:

- Parlak beyaz yerine sıcak açık nötr arka plan
- Kömür, kum, yumuşak metalik ve kontrollü renk vurguları
- Editoryal fotoğraf düzeni
- Sert değil, keskin tipografik hiyerarşi

Önerilen his:

"Dermatolojik soğuklukla lüks moda arasındaki denge"

## 12. Erişilebilirlik

Renk odaklı ürün olduğu için erişilebilirlik daha da önemlidir:

- Renk bilgisi sadece renkle verilmemeli, etiketle desteklenmeli
- Sonuçlar metinle açıklanmalı
- Font kontrastı yüksek tutulmalı
- Erkek ve kadın akışları kalıp olarak değil örnek olarak sunulmalı

## 13. MVP Kapsamı

İlk satışa çıkacak sürüm için olmazsa olmazlar:

- Hesap sistemi
- Undertone analizi
- Sonuç ekranı
- Sınırlı ürün önerisi
- Favori kaydetme
- Premium paywall
- Temel bildirim altyapısı
- Gizlilik ve veri silme akışı

## 14. V2 Sonrası Özellikler

- Gardırop yükleme
- Quick Check kamera akışı
- Stilist destekli premium rapor
- Sosyal paylaşım kartları
- Arkadaş karşılaştırması yerine hediye analizi
- Web companion deneyimi
