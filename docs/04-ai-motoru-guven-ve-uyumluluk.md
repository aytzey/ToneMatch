# AI Motoru, Güven ve Uyumluluk

## 1. AI Tasarım İlkesi

ToneMatch'te AI, kullanıcıyı etkilemek için değil güvenilir karar desteği vermek için kullanılmalıdır. Bu yüzden ilk nesil mimaride "tam kara kutu moda modeli" yerine açıklanabilir, ölçülebilir ve hata durumunda kontrollü davranan bir hibrit sistem önerilir.

Temel yaklaşım:

- Fotoğraf kalitesi kontrolü
- Yüz ve cilt bölgelerinin ayrıştırılması
- Işık ve renk normalizasyonu
- Undertone ve yardımcı renk boyutlarının çıkarılması
- Stil ve katalog eşleştirme
- Geri bildirimle iyileşen ranking sistemi

## 2. Analiz Pipeline'ı

### Aşama 1: Giriş Kalite Kontrolü

Sistem şu kontrolleri yapar:

- Tek yüz var mı
- Yüz yeterince büyük mü
- Bulanıklık var mı
- Aşırı pozlama veya düşük ışık var mı
- Sert gölge yüzün kritik bölgelerini kapatıyor mu
- Ağır filtre veya beautification izi var mı

Bu aşama kritik çünkü yanlış girişten çıkan "kendinden emin yanlış sonuç", kötü kullanıcı deneyiminin ana kaynağıdır.

### Aşama 2: Landmark ve Cilt Bölgesi Çıkarma

Yüz landmark sistemi ile şu bölgeler izole edilir:

- Alın
- Sağ ve sol yanak
- Çene çizgisi
- Boyun referansı

Saç, dudak, göz, kaş ve kıyafet pikselleri mümkün olduğunca maske dışına alınır. Amaç, makyaj veya arka plan rengi yerine cilt sinyalini ölçmektir.

### Aşama 3: Işık Düzeltme ve Renk Sabitleme

Undertone tespiti için en tehlikeli alan, yanlış white balance ve sahne ışığıdır. Bu yüzden analiz öncesi:

- White balance düzeltmesi
- Gamma ve exposure normalizasyonu
- Gölge baskılama kontrolü
- Çok sıcak veya çok soğuk ışık anomali tespiti

uygulanmalıdır.

Amaç, kusursuz "gerçek renk" üretmek değil; sınıflandırma için daha kararlı bir renk uzayı üretmektir.

### Aşama 4: Renk Özellikleri

Her ROI için şu özellikler çıkarılır:

- Ortalama ve medyan LAB değerleri
- Hue dağılımı
- Saturation / chroma
- Kırmızı-yeşil ve sarı-mavi eğilimleri
- Bölgesel varyans
- Işık gövdesi ile ton ilişkisi

Bu özelliklerden undertone ve yan boyutlar türetilir:

- Warm / Cool / Neutral / Olive
- Light / Medium / Deep
- Soft / Clear
- Low / Medium / High contrast

### Aşama 5: Ensemble Sınıflandırma

İlk sürümde önerilen model yaklaşımı:

- Kurallı renk bilimi katmanı
- Kalibre edilmiş gradient boosting veya hafif tabular model
- Confidence calibration

Bu yaklaşım, uçtan uca büyük bir vision modeline göre daha kolay denetlenir. İlerleyen aşamada geniş etiketli veri biriktiğinde fine-tuned vision head eklenebilir.

### Aşama 6: Palette ve Stil Haritalama

Undertone tek başına yeterli değildir. Kullanıcının renk profili şu mantıkla şemaya bağlanmalıdır:

- Çekirdek nötrler
- Accent renkler
- Yüz çevresi güvenli tonlar
- Riskli tonlar
- Kategori bazlı öneriler

Örnek:

- Aynı warm profilde iki kullanıcıdan biri düşük kontrastlı olduğu için muted tonlar önerilebilir.
- Diğerinde net kontrast varsa daha doygun ama sıcak tonlar daha iyi çalışabilir.

### Aşama 7: Katalog Eşleştirme

Ürünler sadece kategoriye göre değil şu vektörlerle skorlanmalıdır:

- Renk uyumu
- Kontrast uyumu
- Cinsiyet veya unisex kullanım bağlamı
- Occasion uygunluğu
- Fiyat ve marka filtresi
- Kullanıcının geçmiş davranışı

### Aşama 8: Açıklama Üretimi

Sonuçların güven vermesi için recommendation satırı başına kısa neden gösterilmelidir.

Örnek şablonlar:

- "Yüz çevresinde daha temiz kontrast verdiği için"
- "Sıcak alt tonunu griye düşürmeden dengede tuttuğu için"
- "Ofis kullanımında sert görünmeden düzenli his verdiği için"

Bu açıklama katmanı template tabanlı başlamalı, sonra kontrollü üretim katmanı eklenmelidir.

## 3. Güven Skoru ve Fallback Tasarımı

Her analiz için tek skor değil çok bileşenli güven yapısı önerilir:

- Görüntü kalitesi skoru
- Işık güven skoru
- Sınıflandırma güven skoru
- Öneri güven skoru

Davranış kuralları:

- Yüksek güven: Tam sonuç ve commerce akışı
- Orta güven: Sonuç + "alternatif ışıkta tekrar doğrula" önerisi
- Düşük güven: Sonucu kilitlemeden yeniden çekim öner

Bu ürün için en doğru strateji, her zaman sonuç vermek değil, gerektiğinde kontrollü çekilmektir.

## 4. Veri Seti Stratejisi

Model kalitesi için veri seti planı net olmalıdır.

### Kaynaklar

- Dahili izinli kullanıcı görselleri
- Açık lisanslı yüz veri setleri
- Uzman etiketli referans örnekler
- Renk draping ile doğrulanmış küçük ama yüksek kaliteli çekirdek veri

### Veri anotasyonları

- Undertone etiketi
- Kontrast etiketi
- Işık kalitesi etiketi
- Makyaj yoğunluğu etiketi
- Fotoğraf güven seviyesi

### Denge ilkeleri

- Farklı cilt derinlikleri
- Farklı coğrafi ve etnik dağılımlar
- Erkek ve kadın verisinde denge
- Farklı kamera kaliteleri

## 5. Model Kalite Metrikleri

Takip edilmesi gereken temel metrikler:

- Top-1 undertone accuracy
- Confidence calibration error
- Düşük kaliteli girişte false certainty oranı
- Recommendation acceptance rate
- Yeniden tarama sonrası karar değişim oranı
- Kullanıcı geri bildirimi ile model sonucu uyumu

Sadece undertone accuracy yeterli değildir. Ticari başarı için asıl metrik, önerinin kullanıcı tarafından faydalı bulunmasıdır.

## 6. Bias ve Adalet Planı

Bu ürün görünüş verisi ile çalıştığı için fairness planı ilk günden dokümante edilmelidir.

Kontrol alanları:

- Açık ve koyu cilt tonlarında hata dağılımı
- Erkek ve kadın kullanıcılar arasında öneri kalitesi farkı
- Farklı ışık koşullarında tutarlılık
- Olive ve neutral sınır vakalarda aşırı hata

Yönetim ilkeleri:

- Segment bazlı benchmark raporu
- Belirsiz vakalarda daha nazik sonuç sunumu
- Kritik model güncellemelerinde regression suite
- İnsan kalite kontrol örneklemesi

## 7. Mahremiyet Tasarımı

Bu ürünün başarı şansı, kullanıcı güvenini kaybetmeden büyümesine bağlıdır.

Önerilen veri politikası:

- Raw selfie varsayılan olarak kısa süreli tutulmalı
- Kullanıcı açıkça istemedikçe galerileştirme yapılmamalı
- Türev özellikler, mümkünse ham görüntüden ayrı saklanmalı
- Hesap silmede analiz verisi ve varlıklar tam temizlenmeli
- Paylaşım kartı ayrı onayla oluşturulmalı

### Varsayılan yaşam döngüsü

- Fotoğraf upload
- Analiz tamamlanınca geçici bucket'ta tutulma
- En geç 24 saat içinde otomatik silme
- Gerekli türev metriklerin profilde saklanması

Bu yaklaşım, depolama maliyetini de azaltır.

## 8. Açık Rıza ve Politika Metni

Kullanıcıdan analiz öncesi açık şekilde şu izin alınmalıdır:

- Fotoğrafının stil analizi amacıyla işlenmesi
- Gerekirse kısa süre saklanması
- Abonelik ve hesap yönetimi verisinin tutulması

Rıza metni asla karanlık pattern olmamalıdır. "Güzelleştirme", "sağlık", "kimlik doğrulama" veya "yüz tanıma" çağrışımı yaratmamak önemlidir.

## 9. Uygulama Mağazası ve Düzenleyici Dikkat Alanları

Bu ürün için kritik uyumluluk başlıkları:

- Apple App Store gizlilik beyanları
- Google Play Data Safety formu
- In-app purchase ve subscription uyumluluğu
- Biyometrik veri sayılabilecek yüz ilişkili veriler için bölgesel hukuki değerlendirme

Buradaki pratik ilke:

- Kimlik tespiti yapmıyoruz
- Yüzü kişiyi tanımak için kullanmıyoruz
- Yüz verisini sadece renk/stil analizi için işliyoruz
- Kullanıcının verisini silme, indirme ve kontrol haklarını açık sunuyoruz

## 10. Güven İnşası İçin Ürün Kararları

Kullanıcı güveni için şu unsurlar doğrudan ekrana taşınmalıdır:

- Neden bu sonucu verdiğimizi anlatan kısa not
- Işık kalitesi uyarısı
- Tekrar çekim önerisi
- Veri silme butonu
- Fotoğraf saklama tercihi
- "Bu sonucu beğenmedim" mekanizması

## 11. Yol Haritasında AI Evrimi

### Faz 1

- Undertone + contrast + palette motoru
- Template tabanlı explanation
- Kural tabanlı commerce ranking

### Faz 2

- Gardırop öğesi sınıflandırma
- Quick Check
- Kullanıcı davranışına göre ranking kişiselleştirmesi

### Faz 3

- Look generation
- Occasion planner
- Bölgesel katalog ve sezon etkisi

### Faz 4

- Stilist destekli hibrit premium katman
- Marka partnerleri için white-label insight

## 12. Kritik Başarı Cümlesi

ToneMatch'in AI başarısı şu cümleyle ölçülmelidir:

"Kullanıcı, sistemin onu yanlış yönlendirmediğini ve tavsiyenin gerçek hayatta işe yaradığını hissetmeli."
