# ToneMatch | Urun Detay Raporu (V1) — 2026-03-09

**© ToneMatch**&emsp;Sayfa 1

---

# ToneMatch

**Selfie'den kisisel renk analizi ve stil danismanligi — Urun Detay Raporu**

Bu dokuman; ToneMatch mobil uygulamasinin kapsamini, sayfa bazli fonksiyonlarini, kullanici akislarini, PRD (urun gereksinimleri) ve TDD (teknik tasarim) detaylarini tek yerde toplar. Hedef: gelistirici/ajans ekibinin kodlamaya baslayabilmesi icin net ve test edilebilir bir kapsam sunmak.

| | |
|---|---|
| **Surum** | V1 (MVP) |
| **Tarih** | 09.03.2026 |
| **Platform** | iOS & Android (Expo / React Native) |
| **Durum** | Implementasyon iskeleti hazir; store yayini oncesi |

---

**© ToneMatch**&emsp;Sayfa 2

## 1. Urun Ozeti

ToneMatch, kullanicinin selfie fotografindan cilt alt tonunu (undertone) ve renk uyum profilini tespit edip kiyafet renk onerileri, kombin fikirleri, alisveris onerileri ve gardrop kararlari sunan bulut tabanli mobil stil asistanidir.

Uygulama uc ana deger akisina sahiptir:

1. **Selfie Analizi**: Kullanicinin yuzunden CIELAB tabanli renk bilimi ile undertone, kontrast ve mevsimsel palet tespiti.
2. **Alisveris Yonlendirmesi**: Analiz sonucuna bagli, renk uyumu puanlanmis urun onerileri ve merchant handoff.
3. **Gardrop Yonetimi**: Kullanicinin kendi kiyafet fotograflarini yukleyip paletine uyumunu olcmesi, kombin olusturmasi.

**Ana deger onerisi:** *"Hangi renkler sana yakisir?" sorusunu 60 saniyenin altinda yanitla, ardindan bu yanitl gercek alisveris ve kombin kararlarina donustur.*

---

**© ToneMatch**&emsp;Sayfa 3

## 2. Marka Kimligi ve Tasarim Ilkeleri

Bu bolum; ToneMatch'in gorsel dili, tipografi, renk sistemi ve ekran estetigini ozetler.

**Marka kisiiligi:** Bilimsel ama soguk degil, editoryal ama snob degil, premium ama korkutucu degil, pratik ama jenerik degil.

**Uc kelime:** Net (Clear), Rafine (Refined), Guven veren (Trust-inspiring).

**Ton:** Destekleyici, kisa, egitici. Orn: *"Bu ton yuzunuzde daha temiz bir kontrast olusturuyor."*

**Nasil konusmaz:**
- Asiri moda jargonu ile
- Utandirici karsilastirmalarla
- Sert ve kesin yargilarla
- "AI" sozcugunu vurgulayan teknoloji jargonu ile

### 2.1 Renk Paleti (Token'lar)

| Token | Amac | Hex / Deger |
|---|---|---|
| `canvas` | Sayfa/ekran arka plani | `#F8F7F6` |
| `surface` | Kart arka planlari | `#FFFFFF` |
| `ink` | En koyu metin / koyu kart arka plani | `#191410` |
| `charcoal` | Ana govde metni | `#191410` |
| `muted` | Ikincil/ipucu metin | `#8D7258` |
| `primary` | Marka bakir/turuncu (ana CTA) | `#B87332` |
| `primarySoft` | Pill arka planlari | `rgba(184,115,50,0.10)` |
| `primaryMuted` | Ince tint | `rgba(184,115,50,0.05)` |
| `clay` | Notr sicak | `#D7C7B5` |
| `accentSoft` | Yumusak sicak vurgu | `#EAD9CA` |
| `border` | Varsayilan kenarlk | `rgba(184,115,50,0.10)` |
| `green` | Basari / pozitif | `#2D6A4F` |
| `red` | Hata / tehlike | `#9D0208` |
| `amber` | Uyari | `#B08968` |
| `swatch1` | Deep brown (palet on izleme) | Koyu kahve |
| `swatch2` | Copper (palet on izleme) | Bakir |
| `swatch3` | Olive (palet on izleme) | Zeytin yesili |
| `swatch4` | Sand (palet on izleme) | Kum rengi |

### 2.2 Tipografi

**Font ailesi:** Manrope (tum agirliklar: 400, 500, 600, 700, 800)

| Token | Boyut | Agirlik | Kullanim |
|---|---|---|---|
| `hero` | 28/34 | 700 Bold | Ana basliklar, letterSpacing -0.5 |
| `h2` | 22/28 | 700 Bold | Bolum basliklari |
| `h3` | 17/22 | 700 Bold | Kart basliklari |
| `body` | 15/22 | 400 Regular | Normal metin |
| `label` | 14/18 | 600 SemiBold | Buton etiketleri |
| `caption` | 12/16 | 500 Medium | Meta metin, alan etiketleri |
| `overline` | 10/14 | 800 ExtraBold | BUYUK HARF etiketler, letterSpacing 2 |
| `sectionHeader` | 13/16 | 700 Bold | BUYUK HARF bolum etiketleri, letterSpacing 1.2 |

### 2.3 Spacing ve Radius

| Token | Deger |
|---|---|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 16 |
| `lg` | 24 |
| `xl` | 32 |
| `xxl` | 48 |

| Radius Token | Deger |
|---|---|
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `full` | 9999 |

### 2.4 Ikonografi ve Gorsel Motifler

- **Ikon seti:** MaterialIcons (React Native)
- **Bakir / toprak tonlu gorsel dil** tutarli sekilde korunmalidir
- **Editoryal fotograf yaklaimi:** Dogal isik, gercek cilt dokusu, asiri rontus yok
- **Kacinilacaklar:** Mor-beyaz tipik AI estetigi, asiri karanlik luks tema, pembe agirlikli kozmetik uygulama hissi

---

**© ToneMatch**&emsp;Sayfa 4

## 3. Hedef Kullanici ve Senaryolar

### 3.1 Persona'lar

| Segment | Yas | Ihtiyac | Odeme Motivasyonu |
|---|---|---|---|
| **A: Stilini optimize etmek isteyen kadin** | 22-38 | Renklerini netlestirmek, yanlis urun satin alimini azaltmak | Daha hizli ve guvenli alisveris |
| **B: Pratik stil yardimi arayan erkek** | 24-42 | Hangi renk tisort/gomlek/ceket yakisir; hizli rehberlik | Zaman tasarrufu, sosyal gorunum kaygisinl azaltma |
| **C: Etkinlik odakli kullanici** | Degisken | Dugun, mezuniyet, is gorusmesi icin "bu etkinlik icin hangi tonlar?" | Tek seferlik yuksek fayda |

### 3.2 Temel Senaryolar

1. **Selfie ile renk analizi**: Ilk wow aninda 60 saniyenin altinda sonuc
2. **Palet bazli alisveris**: Sonuctan alisverise gecis
3. **Quick Check**: Magazadaki bir kiyafetin fotografini cekip "Bu bana yakisir mi?" sorusunu sormak
4. **Gardrop yonetimi**: Kendi kiyafetlerini yukleyip uyum puani gormek
5. **Ozel gun kombin onerileri**: Ofis, randevu, dugun, hafta sonu icin palet bazli look'lar
6. **Hediye rehberi**: Mevsimsel renk tonuna gore hediye secimi
7. **Sosyal paylasim**: Analiz sonucunu gorsel kart olarak paylasma
8. **Demo limit ile premium'a gecis**: Ucretsiz deger gosterip premium'a yonlendirme

### 3.3 JTBD (Jobs to Be Done)

| Is | Mevcut Surtunme | ToneMatch Cevabi |
|---|---|---|
| Hangi renkler bana yakisir ogrenmek | Celiskili internet bilgisi | Fotograf bazli analiz + aciklamali kisisel sonuc |
| Online alisveriste hata yapmamak | Urun teoride iyi, ciltte kotu gorunebilir | Renk uyumu puanlanmis urun onerileri |
| Ozel gune hizli karar vermek | Kombin ve renk secimi zaman alir | Durum bazli look onerileri |
| Daha iyi giyinmek ama moda dili uzak | Icerik karisik ve kadin odakli olabiliyor | Basit, gorev odakli rehberlik |
| Garprobu verimli kullanmak | Uyumlu parcalari eslestirmek zor | Renk katmanli oneri ve mevcut parcalarla eslestirme |

---

**© ToneMatch**&emsp;Sayfa 5

## 4. Bilgi Mimarisi ve Navigasyon

Uygulama 5 ana sekmeden olusur. Her sekme kendi ic stack navigasyonuna sahiptir.

### 4.1 Bottom Tab Bar

| Tab | Baslik | Ikon | Amac |
|---|---|---|---|
| `home` | Home | `home` | Gunluk oneri, son analiz ozeti, hizli aksiyonlar |
| `wardrobe` | Wardrobe | `checkroom` | Kullanicinin kendi kiyafetleri, renk uyumu, kombin |
| `discover` | Explore | `explore` | Renk uyumlu urun feed'i, ozel gun look'lari |
| `scan` | Scan | `photo-camera` | Kamera / galeri ile selfie cekim |
| `profile` | Profile | `person` | Stil profili, abonelik, gizlilik, veri yonetimi |

**Tab bar stili:** Aktif renk `palette.primary` (bakir), inaktif `palette.muted`, font `Manrope_700Bold` 10px uppercase, arka plan `palette.canvas`, yukseklik 64px.

### 4.2 Stack Navigasyon Haritasi

```
/index (yonlendirici)
  |-- /welcome              (ilk acilis onboarding)
  |-- /auth                 (giris / kayit)
  +-- /(tabs)/home          (ana uygulama)
       |-- /(tabs)/wardrobe
       |-- /(tabs)/discover
       |-- /(tabs)/scan  --> /scan-review --> /analysis-loading --> /analysis/[sessionId]
       +-- /(tabs)/profile --> /paywall

  Diger ekranlar (programatik push ile erisim):
  |-- /quick-check           (Home'dan "Quick Check" butonu)
  |-- /occasion-guide        (Ozel gun rehberi)
  |-- /gift-guide            (Hediye rehberi)
  |-- /share-results         (Paylasim karti)
  +-- /share-comparison      (Once/sonra karsilastirma) --> /paywall
```

---

**© ToneMatch**&emsp;Sayfa 6

## 5. Genel Fonksiyonlar (App-wide)

### 5.1 Selfie Analiz Pipeline'i
- Kamera veya galeriden fotograf secimi
- Kalite kontrol (dogal isik, filtre yok, yuz net)
- Signed upload ile guvenli yukle
- AI Worker uzerinde CIELAB tabanli undertone/kontrast analizi
- LLM destekli detayli yorum: OpenRouter uzerinden `google/gemini-3-flash-preview` (selfie ve cilt alt tonu)
- Kiyafet fotografi gorsel analizi: OpenRouter uzerinden `google/gemini-3.1-flash-lite-preview` (Wardrobe Match / Quick Check)
- Sonuc ekraninda palet, aciklama ve alisveris CTA'si

### 5.2 Fallback Katmanlari
Her veri cekme fonksiyonu 3 katmanli oncelik izler:
1. **Gercek Supabase backend** (yapilandirilmis ve erisilebilirse)
2. **Gemini dogrudan API** (yapilandirilmissa)
3. **Mock/preview data** (her durumda calisan son kalkan)

### 5.3 Abonelik ve Premium
- **Free:** 1 temel analiz, sinirli sonuc ekrani, sinirli urun onerileri
- **Plus ($9.99/ay):** Sinirsiz analiz, gelismis renk raporu, ozel gun look'lari, gunluk oneri akisi
- **Pro ($19.99/ay):** Gardrop eslestirme, Quick Check, kisisel stilist AI chat, trend raporlari
- Odeme: RevenueCat SDK ile App Store / Google Play entegrasyonu
- Preview mode: Backend olmadan tum UI akisini test edebilme

### 5.4 Geri Bildirim Sistemi
- Her oneri setinde mikro mekanikler: "Fits me" / "Too cool"
- Sinyal `feedback_events` tablosuna kaydedilir
- Zaman icinde oneri katmanini ve aciklama dilini iyilestirir

### 5.5 Merchant Handoff & Affiliate
- Urun tiklamalarinda UTM parametreleri ve `tm_click_id` ile izlenebilir link olusturma
- Click event tracking: `pending` → `opened` / `blocked` / `failed` state machine
- Commerce log export edilebilir (analitik ve affiliate raporlama icin)

### 5.6 Gizlilik ve Veri Yonetimi
- Selfie varsayilan olarak 24 saat icerisinde otomatik silinir
- Kullanici self-servis: veriyi indir, son analizi sil, hesabi tamamen sil
- Acik rizaya dayali isleme; dark pattern yok
- GDPR uyumlu `export-account-data` ve `privacy-delete-account` endpoint'leri

---

**© ToneMatch**&emsp;Sayfa 7

## 6. Sayfa Bazli Detaylar

### 6.1 Welcome (Onboarding)

- **Amac:** Ilk kez acilista deger onerisi ve guven mesaji.
- **Bilesenler:** `Screen` (scrollable), `LinearGradient` hero alani, 2x `GlassCard` (acik/koyu), 2x `PrimaryButton` ("Hesabinla devam et" + "Deneme modu"), direkt tarama linki.
- **Aksiyonlar:**
  - "Hesabinla devam et" → `completeOnboarding()` → `/auth`
  - "Deneme modu" → `enablePreviewMode()` → `/(tabs)/home`
  - "Hemen kesfetmeye basla" linki → `/(tabs)/scan`
- **Kurallar:** `hasCompletedOnboarding` true ise bu ekran gosterilmez. `devSingleUserMode` aktifse otomatik atlanir.

### 6.2 Auth (Giris / Kayit)

- **Amac:** Email/sifre ile giris veya kayit; deneme moduna gecis.
- **Bilesenler:** `Screen`, `GlassCard` (backend durumu), form karti, `TextField` (email + sifre), `PrimaryButton` (mod degistir / gonder / preview).
- **Aksiyonlar:**
  - Giris / Kayit toggle (sign-in ↔ sign-up)
  - Basarili giris → `/(tabs)/home`
  - Kayit + email dogrulama gerekli → Alert
  - "Deneme modunda gez" → `enablePreviewMode()` → `/(tabs)/home`
- **Edge:** Backend yapilandirilmamissa submit disabled; durum karti bunu bildirir. `devSingleUserMode`'da otomatik giris spinner'i gosterilir.

### 6.3 Home (Ana Dashboard)

- **Amac:** Kisisellestiirilmis karsilama, son analiz ozeti, hizli aksiyonlar ve ozel gun kartlari.
- **Bilesenler:**
  - Hero kart: `LinearGradient` overlay + `Image`, kisisellesmis selamlama ("Morning, Alex. Ready for your palette?"), mevsim notu
  - Son analiz karti: Palet adi, guven yuzdesi (orn. "98% Match"), 4 swatch + "+12" tasma pill'i, analiz thumbnail'i
  - 3 hizli aksiyon kutucugu: **New Scan** (dolgulu, `/(tabs)/scan`'a gider), **Quick Check** (`/quick-check`'e gider), **Trends** (henuz baglanmadi)
  - Ozel gun karuseli: Yatay scroll, 3 kart (Office, Date Night, Weekend), 160px genislik
- **Veri kaynaklari:** `useAuth()` (kullanici adi), `useStyleProfile()` (analiz verisi; yoksa hardcoded default'lar)
- **Premium gating:** Yok (tum kullanicilar gorebilir)

### 6.4 Scan (Kamera Ekrani)

- **Amac:** Yuz cekim deneyiminin merkezi.
- **Bilesenler:**
  - Kamera on izleme alani (gri placeholder)
  - Oval yuz rehberi: Kesikli cizgi oval (220x290) ve 4 kosede bracket isaretleri
  - Animasyonlu cekim butonu: `Animated.View` ile nefes alan dis halka (1→1.2, 1200ms dongu)
  - `BlurView` header bari, talimat karti ve 3 yan buton
  - Galeri butonu (`pickFromLibrary`), cekim butonu (`captureWithCamera`), flip butonu (henuz calismyor)
  - 3 sag yan buton: parlaklik, filtre, yuz modu (hepsi mock)
  - Alt talimat: "NATURAL LIGHT IS BEST · REMOVE GLASSES AND FILTERS"
- **Aksiyonlar:**
  - Cekim / galeri → `useScanFlow` hook'u tetikler → `/scan-review`'e yonlendirir
  - Kapat → `router.back()`
- **Haptic:** Basarili fotograf seciminde `Haptics.selectionAsync()`
- **Izinler:** Kamera veya galeri izni reddedilirse Turkce Alert mesaji

### 6.5 Scan Review (Fotograf On Izleme)

- **Amac:** Cekilmis/secilmis fotografin kalite gostergeleri ile on izlemesi.
- **Bilesenler:**
  - Selfie on izleme (3:4 oran, `previewUri` veya fallback gorsel)
  - Kalite durumu badge'i: yesil onay, "High Quality", "Good to go" pill'i
  - 3 kalite kontrol maddesi: dogal aydinlatma, ozellikler gorunur, filtre yok
  - `PrimaryButton`: "Analyze Now" (birincil) ve "Retake Photo" (ikincil)
- **Aksiyonlar:**
  - "Analyze Now" → `startAnalysis()` → `/analysis-loading`
  - "Retake Photo" → `router.back()`
- **Edge:** `previewUri` yoksa statik fallback gorsel gosterilir

### 6.6 Analysis Loading (Analiz Yukleniyor)

- **Amac:** AI renk analizi sirasinda gosterilen ilerleme ekrani.
- **Bilesenler:**
  - Bulanik portre on izleme (`previewUri` veya fallback) + `LinearGradient` sicak tint overlay
  - 4 adimli ilerleme izleyici: "Analyzing skin undertones" → "Evaluating facial contrast" → "Matching seasonal palette colors" → "Curating personalized recommendations"
  - `Animated.View` ile nefes alan opaklk animasyonu (devam eden adim iconu, 1→0.4, 800ms)
  - Progress bar (yukleme: %15, analiz: %65, hazir: %100)
  - Alt not: "We're processing your image locally to ensure your privacy."
- **Aksiyonlar:**
  - `status === "ready"` && `sessionId` → 600ms sonra `/analysis/[sessionId]`'a otomatik yonlendirme
  - Hata durumunda: hata mesaji + "Go Back" butonu
- **State:** `useAppStore(s => s.scanState)` — `status`, `previewUri`, `sessionId`, `message`

### 6.7 Analysis Results (Analiz Sonuclari)

- **Amac:** Tam renk analiz sonucunun gosterimi — uygulamanin vitrini.
- **Route:** `/analysis/[sessionId]` (dinamik segment)
- **Bilesenler:**
  - Dairesel avatar + bakir halka + match skor badge'i ("98% MATCH")
  - `YOUR SIGNATURE PALETTE` overline + "Autumn Warm / Deep Contrast" basligi
  - **"Why This Works For You"** `GlassCard` teori karti: aciklama metni + "DIVE INTO THE THEORY →" linki
  - **"Best on you"**: 3 adet 96x96px renk swatch karti (orn. Rust, Deep Olive, Forest Green)
  - **"Use with care"**: 2 adet 72x72px kucuk swatch (orn. Cool Blue, Lavender)
  - `PrimaryButton`: "SHOP YOUR TONES" → `/(tabs)/discover`
  - `PrimaryButton` (ikincil): "SAVE PALETTE" (henuz mock)
  - Paylas butonu (henuz mock)
- **Renk swatch sistemi:** 15 adlandirilmis renk → hex esleme (rust, deep olive, forest green, cool blue, lavender, burgundy, terracotta, mustard, teal, plum, charcoal, cream, gold, coral, sage)
- **Veri kaynaklari:** `useStyleProfile()` — gercek backend varsa veritabanindan, Gemini varsa local store'dan, yoksa mock
- **3 UI durumu:** Yukleniyor | Hata | Veri yok | Veri mevcut (tam sonuc)

### 6.8 Discover (Kesfet)

- **Amac:** Kisisellestiirilmis alisveris feed'i — kure onerileri, ozel gunler ve trend urunler.
- **Bilesenler:**
  - Arama cubugu (`TextInput`: "Search products or tones")
  - Filtre chip'leri: "Your Tones" (aktif varsayilan), "Category", "Budget"
  - **Today For You** hero kart: "The Copper Hour" + palet bazli editoryal aciklama
  - **Occasions**: Yatay `FlatList` — The Office, Date Night, Weekend (stil sayisi alt basligi ile)
  - **Trending Picks**: 2 urun karti — fiyat ve palet esleme badge'i
  - Favori butonu (kalp ikonu, henuz mock)
- **Aksiyonlar:** Arama, filtre chip degisimi (yerel state); diger tum tiklamalar mock
- **Veri kaynaklari:** Statik placeholder verisi; gercek akista `useCatalogFeed()` → `match_catalog_items` RPC

### 6.9 Wardrobe (Gardrop)

- **Amac:** Kullanicinin paletine gore analiz edilmis kiyafetlerini gosterme.
- **Bilesenler:**
  - Palet basligi: "Deep Autumn" + 4 swatch + aciklama
  - `PrimaryButton`: "Add Item" (bakir dolgulu), "Build Outfit" (koyu dolgulu)
  - Tab filtre satiri: Top Picks, Recently Added, Outerwear, Knitwear
  - 2 sutunlu masonry grid: her kartta gorsel + FIT badge overlay + baslik + tag pill'leri + alinti
  - Borderline esleme ogesi (74% FIT): tam genislik + `lightbulb-outline` stil ipucu kutusu
- **Veri kaynaklari:** Statik `WARDROBE_ITEMS` dizisi (5 oge); gercek akista `useWardrobeItems()`
- **Ornek ogeler:**

| Oge | Uyum% | Notlar |
|---|---|---|
| Terracotta Overcoat | 98% | Earth Tone, Wool |
| Hunter Silk Blouse | 92% | Deep Green, Silk |
| Ribbed Charcoal Knit | 74% | Borderline Match + Stil Ipucu |
| Raw Indigo Denim | 88% | Blue-Black |
| Ochre Linen Shirt | 96% | Golden |

### 6.10 Quick Check (Hizli Kontrol)

- **Amac:** Magazadaki bir urunu fotograflayip paletine uyumunu aninda sorgulamak.
- **Bilesenler:**
  - Baslangic durumu: kamera ikonu + baslik + aciklama + "Upload Image" butonu
  - Yukleme durumu: spinner + "Analyzing your image..." metni
  - Sonuc durumu (3 bolum):
    1. **Analysis Result karti**: esleme durumu (yesil/amber nokta), aciklama, gorunen renk pill'leri
    2. **Suggested Usage**: 3 ikon kutucugu (BEST NEAR FACE, GREAT AS LAYER, BOTTOM PIECES)
    3. **Details karti**: neden metni + renk ailesi pill, puan %, guven % pill'leri
  - "Check Another Item" → sonucu sifirlar
  - "Save to Wardrobe" → Alert (mock)
- **Veri kaynaklari:**
  - `expo-image-picker` ile medya kutuphanesinden gorsel secimi
  - Backend: `create-upload` → upload → `quick-check` edge function → AI Worker
  - Gemini fallback: `analyzeClothing()` kullanici profili ile
- **Sonuc modeli (`QuickCheckView`):** `label`, `score`, `confidence`, `bestUse`, `reason`, `colorFamily`, `clothingCheck` (verdict/explanation/visible_colors/suggestion)

### 6.11 Paywall (Premium Uyelik)

- **Amac:** Abonelik paketlerini net sunmak ve upsell.
- **Bilesenler:**
  - Hero gorsel: `LinearGradient` overlay, "Elevate Your Visual Identity" basligi
  - 4 ozellik satiri: Unlimited Color Checks, Advanced Contrast Analysis, Personal Stylist AI Chat, Exclusive Trend Reports
  - Plan secici (3 secenek):

| Plan | Fiyat | Not |
|---|---|---|
| Free | $0 | Temel ozellikler |
| ToneMatch Plus | $9.99/ay | Yillik faturalandirma, "MOST POPULAR" badge |
| Pro | $19.99/ay | Moda profesyonelleri icin |

  - CTA: "Start 7-Day Free Trial"
  - Kucuk yazi: "After the trial, ToneMatch Plus is $119.99/year. Cancel anytime."
  - Alt linkler: Restore Purchase | Terms of Service | Privacy (hepsi mock)
- **Giris noktalari:** Profile "Manage Plan" butonu, Share Comparison "Unlock Your Full Palette" CTA'si

### 6.12 Profile (Profil)

- **Amac:** Kullanim, abonelik yonetimi ve gizlilik kontrolleri.
- **Bilesenler:**
  - Avatar + isim ("Alex Rivers") + "Deep Autumn Enthusiast" badge + uyelik tarihi
  - **ToneMatch Plus promo karti**: "Your personal color consultant is active." + "Manage Plan" → `/paywall`
  - **Account Experience bolumu**: Notifications, Language (English US), Support Center satırlari
  - **Data & Privacy bolumu**:
    - "Export My Color Data" → `exportAccountData()` cagirir → Alert
    - "Delete Account" → yikici Alert onay → `deleteAccountData()` → `signOut()`
  - Gizlilik karti: "Biyometrik veri sifrelenir ve asla satilmaz" bilgilendirmesi
- **Veri kaynaklari:** `useAuth()` (kullanici), `exportAccountData()`, `deleteAccountData()`

### 6.13 Occasion Guide (Ozel Gun Rehberi)

- **Amac:** 3 ozel gun icin kuratoryel kombin icerik ekrani.
- **Bilesenler:**
  - "ToneMatch Editorial" basligi + "SEASON: DEEP AUTUMN" overline
  - Her ozel gun icin: hero look gorseli (4:5) + `LinearGradient` + "Shop Look" CTA + yatay urun scroll (160px kartlar) + "Why it works" alinti kutusu
- **Ozel gunler:**
  1. **Office Power** — Forest Green Blazer ($295), Charcoal Trousers ($180), Mahogany Pumps ($210)
  2. **Golden Hour Date** — Silk Slip Dress ($240), Gold Accessories ($125), Terracotta Heels ($160)
  3. **Weekend Ease** — Mustard Knit ($110), Warm Denim ($145), Tobacco Boots ($225)

### 6.14 Gift Guide (Hediye Rehberi)

- **Amac:** Mevsimsel renk tonuna gore kuratoryel hediye alisveris rehberi.
- **Bilesenler:**
  - Full-bleed hero gorsel (320px min-yukseklik) + gradient: "The Art of Giving"
  - Ton chip secici (yatay scroll): Deep Autumn, Cool Winter, Warm Spring, Light Summer
  - 2 hediye karti: gorsel + "Recommended for X" badge + baslik + fiyat + kalp butonu + "Why it works" alinti
- **Ornek urunler:** The Silk & Gold Set ($245), The Cashmere & Silver Set ($380)
- **Not:** Ton chip secimi henuz kartlari filtrelemiyor

### 6.15 Share Results (Paylasim Karti)

- **Amac:** Kullanicinin palet sonucunu ekran goruntusu veya sosyal medyada paylasmak icin gorsel kart.
- **Bilesenler:**
  - TONEMATCH logo bari + paylas/kapat butonlari
  - Tam genislik portre (4:5 oran) + match skor badge'i ("98%")
  - Mevsim basligi: "Deep Autumn" + "SIGNATURE PALETTE" / "SEASONAL ESSENCE" overline
  - 5 bindirmeli swatch dairesi + "Rich & Earthy" etiketi
  - 3 ozellik pill'i: Warm Undertone, High Contrast, Rich Saturation
  - Ortalanmis italik alinti kutusu
  - Footer: QR kodu placeholder + "tonematch.app" URL

### 6.16 Share Comparison (Once/Sonra Karsilastirma)

- **Amac:** "Yanlis" serin renkler ile "dogru" sicak Deep Autumn tonlari arasinda gorsel karsilastirma. Premium upsell CTA'si icerir.
- **Bilesenler:**
  - Match skor pill'i + "Your Seasonal Essence: Rich & Radiant" basligi
  - **Onceki kart** (4:3): serin mavi portre + "MUTED & COOL (WRONG)" badge + italik aciklama
  - Dekoratif ayirici (auto-awesome ikonu)
  - **Sonraki kart**: 2px bakir border glow + sicak portre + "DEEP & WARM (RIGHT)" badge
  - Analiz gridi: Undertone "Golden-Copper", Contrast "High/Rich"
  - CTA: "Unlock Your Full Palette" → `/paywall`

---

**© ToneMatch**&emsp;Sayfa 8

## 7. Kullanici Akislari (User Flows)

### Flow A — Selfie Analizi

```
Welcome → Auth → Home → Scan (kamera/galeri) → Scan Review (kalite kontrol)
→ Analysis Loading (4 adim progress) → Analysis Results (palet + swatch'lar)
→ "Shop Your Tones" → Discover feed
```

**Detay:**
1. `useScanFlow.selectImage()`: Kamera veya galeri izni iste → gorsel sec → `pendingAsset` kaydet → `/scan-review`
2. `useScanFlow.startAnalysis()`: Signed upload → backend/Gemini analiz → poll (2.2sn aralik, 45sn timeout) → sonuc ekrani
3. Basarili analiz: query invalidation (`style-experience`, `analysis-history`)

### Flow B — Quick Check

```
Home → Quick Check → "Upload Image" → Galeri sec → Analiz bekleme
→ Sonuc karti (verdict + puan + oneri) → "Save to Wardrobe" veya "Check Another"
```

### Flow C — Demo → Premium

```
Welcome → "Deneme modu" → Home (mock veri ile) → Discover / Quick Check
→ Premium ozelliklere erismek istediginde → Paywall → Plan sec → "Start Trial"
```

**Alternatif giris noktalari:**
- Profile → "Manage Plan" → Paywall
- Share Comparison → "Unlock Your Full Palette" → Paywall

### Flow D — Gardrop Yonetimi

```
Home → Wardrobe sekmesi → "Add Item" → (upload akisi, finalize-wardrobe-item)
→ Kiyafet karti (FIT % + tag'ler) → "Build Outfit"
```

### Flow E — Paylasim

```
Analysis Results → Share Results (gorsel kart) → Ekran goruntusu / sosyal paylasim
veya
Analysis Results → Share Comparison (once/sonra) → Premium upsell
```

### Flow F — Geri Bildirim

```
Discover feed'de urun karti → FeedbackStrip ("Fits me" / "Too cool")
→ feedback_events tablosuna kayit → "Saved" durumu
```

### Flow G — Hesap Silme

```
Profile → "Delete Account" → Yikici Alert onay
→ deleteAccountData() (foto silme + DB wipe + auth silme) → signOut()
```

---

**© ToneMatch**&emsp;Sayfa 9

## 8. Minimum Veri Modeli

### 8.1 Veritabani Semalari

| Tablo | Alanlar (ozet) | Not |
|---|---|---|
| `users` | id (PK, auth.users FK), display_name, locale, style_goal, gender_presentation, created_at, updated_at | Kayit tetikleyicisi ile otomatik olusturulur |
| `photo_assets` | id, user_id (FK), bucket, storage_path (UNIQUE), kind (selfie/wardrobe), content_type, file_name, uploaded_at, retention_delete_after (24s), status, created_at | RLS: kullanici kendi varliklarini yonetir |
| `analysis_sessions` | id, user_id (FK), photo_asset_id (FK), status (enum), worker_job_id, quality_score, light_score, confidence_score, error_code, error_message, created_at, updated_at | 6 durumlu state machine |
| `style_profiles` | id, user_id (UNIQUE FK), undertone_label, undertone_confidence, contrast_label, contrast_confidence, palette_json, avoid_colors_json, fit_explanation, source_analysis_session_id, created_at, updated_at | Kullanici basina tek profil |
| `recommendation_sets` | id, user_id (FK), analysis_session_id (FK), context, created_at | Oneri grubu |
| `recommendation_items` | id, recommendation_set_id (FK), title, category, reason, score, price_label, merchant_url, metadata, created_at | Tek oneri ogesi |
| `subscription_states` | id, user_id (UNIQUE FK), plan (free/plus/pro), provider, provider_customer_id, period_ends_at, created_at, updated_at | Kayit tetikleyicisi ile otomatik olusturulur |
| `feedback_events` | id, user_id (FK), recommendation_item_id (FK), analysis_session_id (FK), catalog_item_id (FK), signal, details (jsonb), created_at | Kullanici geri bildirim sinyalleri |
| `wardrobe_items` | id, user_id (FK), photo_asset_id (FK), name, note, color_tags[], fit_score, usage_contexts[], created_at, updated_at | Gardrop kiyafetleri |
| `quick_check_results` | id, user_id (FK), photo_asset_id (FK), label, score, confidence, best_use, reason, color_family, metadata (jsonb), created_at | Hizli kontrol sonuclari |
| `catalog_items` | id, slug (UNIQUE), title, category, description, price_label, merchant_url, image_url, tone_labels[], contrast_labels[], color_family_tags[], occasion_tags[], gender_targets[], is_premium, active, external_id, merchant_name, source_feed, source_hash, currency_code, price_amount, inventory_status, metadata, last_seen_at, last_synced_at, created_at, updated_at | Merchant urun katalogu |
| `commerce_click_events` | id (click_id), user_id (FK), catalog_item_id (FK), source_context, merchant_name, source_feed, product_title, target_url, resolved_url, click_state (pending/opened/blocked/failed), clicked_at, last_attempted_at, failure_reason, details (jsonb), created_at, updated_at | Ticaret tiklama izleme |
| `revenuecat_events` | id, user_id (FK), provider_customer_id, event_type, product_id, entitlement_ids[], raw_payload (jsonb), created_at | RevenueCat webhook olaylari |
| `catalog_sync_runs` | id, source_feed, mode, status, received_count, upserted_count, deactivated_count, request_meta, error_message, started_at, completed_at, created_at, updated_at | Katalog sync kayitlari |

### 8.2 Enum'lar

| Enum | Degerler |
|---|---|
| `analysis_status` | `pending_upload`, `queued`, `processing`, `completed`, `failed`, `deleted` |
| `asset_kind` | `selfie`, `wardrobe` |
| `subscription_plan` | `free`, `plus`, `pro` |

### 8.3 Frontend Tip Modelleri

| Model | Temel Alanlar |
|---|---|
| `StyleExperience` | undertone, contrast, confidence, plan, summary, focusItems[], palette (core[]/avoid[]), recommendations[] |
| `RecommendationCard` | id, title, category, reason, score, price, merchantUrl, merchantName, isPremium, colorFamily |
| `QuickCheckView` | id, label, score, confidence, bestUse, reason, colorFamily, clothingCheck |
| `WardrobeItemView` | id, name, note, tags[], fitScore |
| `SubscriptionStateView` | plan, provider, periodEndsAt |
| `AnalysisSessionView` | id, status, confidenceScore, createdAt |
| `ClothingCheck` | visible_colors[], verdict, explanation, suggestion |
| `ExportPayload` | styleProfile, sessions[], wardrobe[], feedback[], commerceClicks[], subscriptionState, revenuecatEvents[] |

---

**© ToneMatch**&emsp;Sayfa 10

## 9. PRD — Urun Gereksinimleri (V1)

### EPIC A — Onboarding ve Auth

**US-A1: Ilk acilis onboarding deneyimi**
- Welcome ekrani gosterilir (`hasCompletedOnboarding === false`)
- Deger onerisi, guven mesaji ve CTA'lar sunulur
- "Deneme modu" ile hesap olusturmadan ilk degere ulasilir
- Onboarding tamamlaninca tekrar gosterilmez

**US-A2: Hesap olusturma ve giris**
- Email/sifre ile giris ve kayit
- Sign-in ↔ sign-up mod degistirme
- Backend yapilandirilmamissa submit disabled + bilgi karti
- Preview mode gecisi (auth bypass)
- Dev single-user mode otomatik giris

**Kabul kriterleri:**
- [ ] Onboarding sadece ilk acilista gosterilir
- [ ] Preview mode ile tum UI akisi gezlebilir
- [ ] Backend yokken uygun geri bildirim verilir
- [ ] Basarili giris Home'a yonlendirir

---

### EPIC B — Selfie Analiz Pipeline'i

**US-B1: Fotograf cekim ve secim**
- Kamera (on kamera, duzenlenebilir, 0.9 kalite) veya galeri
- Izin yonetimi (reddedilirse Turkce uyari)
- Oval yuz rehberi ve kalite ipuclari
- Haptic geri bildirim

**US-B2: Fotograf on izleme ve kalite kontrolu**
- Selfie 3:4 oranda gosterilir
- 3 kalite kontrol maddesi (isik, ozellikler, filtre)
- "High Quality / Good to go" durumu
- Analiz baslat veya yeniden cek

**US-B3: Analiz sureci ve ilerleme**
- 4 adimli ilerleme izleyici + yuzde gosterge
- Animasyonlu durum ikonu (nefes alan opaklk)
- Bulanik portre arka plan
- Otomatik yonlendirme sonuc hazir oldugunda (600ms gecikme)
- Hata durumunda hata mesaji + geri don

**US-B4: Analiz sonuc ekrani**
- Match yuzde skoru (orn. 98%)
- Undertone + kontrast etiketi
- "Why This Works For You" aciklama karti
- "Best on you" swatch'lari (3 adet, 96x96)
- "Use with care" swatch'lari (2 adet, 72x72)
- "Shop Your Tones" CTA → Discover
- "Save Palette" (ikincil)

**Kabul kriterleri:**
- [ ] Kamera ve galeri izinleri dogru yonetilir
- [ ] Signed upload basarili (veya Gemini fallback calisir)
- [ ] Progress bar dogru yuzdelerle ilerler
- [ ] Sonuc ekraninda palet ve swatch'lar dogru gosterilir
- [ ] 3 katmanli fallback (backend → Gemini → mock) calissir

---

### EPIC C — Discover ve Alisveris

**US-C1: Kesfet feed'i**
- Arama cubugu (yerel filtreleme)
- Filtre chip'leri (Your Tones, Category, Budget)
- Hero kart (palet bazli editoryal)
- Ozel gun karuseli (3 oge)
- Trending urun kartlari (fiyat + palet badge)

**US-C2: Merchant handoff**
- Urun tiklandiginda `prepare-merchant-click` ile izlenebilir URL olusturma
- UTM parametreleri: `utm_source=tonematch`, `utm_medium=mobile_app`
- Click state izleme: pending → opened / blocked / failed
- `report-merchant-click` ile sonuc bildirimi

**US-C3: Oneri geri bildirimi**
- "Fits me" / "Too cool" FeedbackStrip
- Secim `feedback_events`'e kaydedilir
- "Saved" durumu gosterilir

**Kabul kriterleri:**
- [ ] Feed yuklendiginde urunler gosterilir (veya mock)
- [ ] Filtre chip'leri aktif chip durumunu degistirir
- [ ] Merchant link UTM parametreleri icerir
- [ ] Geri bildirim kaydedilir ve UI guncellenir

---

### EPIC D — Quick Check

**US-D1: Urun fotograf yukleme ve analiz**
- Medya kutuphanesinden gorsel secimi
- Izin yonetimi (reddedilirse Alert)
- Backend: signed upload + quick-check edge function
- Gemini fallback: `analyzeClothing()` kullanici profili ile

**US-D2: Quick Check sonuc gosterimi**
- Esleme durumu (yesil/amber nokta)
- Aciklama metni ve gorunen renk pill'leri
- Onerilen kullanim alanlari (3 ikon kutucugu)
- Detay karti: neden + renk ailesi + puan + guven
- "Check Another Item" ile sifirlama
- "Save to Wardrobe" (mock)

**Kabul kriterleri:**
- [ ] Gorsel secimi ve yukleme calisir
- [ ] Sonuc dogru gosterilir (verdict, puan, renk)
- [ ] Fallback katmanlari calisir
- [ ] Sifirlama baslangic durumuna doner

---

### EPIC E — Gardrop

**US-E1: Gardrop goruntuleme**
- Palet basligi ve swatch'lar
- Tab filtreleri (Top Picks, Recently Added, Outerwear, Knitwear)
- 2 sutunlu masonry grid
- FIT % badge overlay
- Tag pill'leri ve alinti/stil ipucu

**US-E2: Kiyafet ekleme**
- "Add Item" → fotograf yukle → `finalize-wardrobe-item` edge function
- Otomatik renk etiketleme ve uyum puanlama
- Yeni oge gardrop listesine eklenir

**Kabul kriterleri:**
- [ ] Gardrop ogeleri dogru gosterilir
- [ ] FIT yuzdesi ve tag'ler gorunur
- [ ] Borderline esleme icin stil ipucu kutusu gosterilir
- [ ] Kiyafet ekleme akisi calisir (veya mock)

---

### EPIC F — Premium ve Abonelik

**US-F1: Paywall ekrani**
- 3 plan net gosterilir (Free, Plus, Pro)
- 4 premium ozellik satiri
- "Most Popular" badge (Plus)
- "Start 7-Day Free Trial" CTA
- Plan secimi vurgulama (2px border)

**US-F2: Abonelik durumu yonetimi**
- RevenueCat webhook ile plan durumu guncelleme
- Backend + RevenueCat durumlarinin birlestiirilmesi (`mergeSubscriptionState`)
- Profil ekraninda plan gosterimi
- Preview mode'da plan simule edilebilir

**Kabul kriterleri:**
- [ ] Planlar dogru fiyatlarla gosterilir
- [ ] Secili plan vurgulanir
- [ ] RevenueCat webhook plan durumunu gunceller
- [ ] Preview mode'da plan degisimi calisir

---

### EPIC G — Profil ve Gizlilik

**US-G1: Profil goruntuleme**
- Avatar, isim, palet badge, uyelik tarihi
- ToneMatch Plus promo karti
- Bildirim, dil, destek satırlari

**US-G2: Veri export**
- "Export My Color Data" → `export-account-data` edge function
- GDPR uyumlu: stil profili, oturumlar, gardrop, geri bildirimler, ticaret tiklmalari, abonelik, RevenueCat olaylari

**US-G3: Hesap silme**
- Yikici Alert onay (iki secenekli)
- Fotograflari Storage'dan sil (bucket bazli)
- Tum DB kayitlarini `delete_user_data()` ile sil (bagimlilk sirasina gore)
- Auth kaydini sil
- `signOut()` ile oturumu sonlandir

**Kabul kriterleri:**
- [ ] Export tam veri paketini dondurur
- [ ] Hesap silme tum verileri temizler
- [ ] Silme sirasinda fotograflar Storage'dan kaldirilir
- [ ] Auth kaydi silinir

---

### EPIC H — Icerik ve Editoryal Ekranlar

**US-H1: Ozel gun rehberi**
- 3 ozel gun (Ofis, Randevu, Hafta Sonu)
- Hero look gorseli + "Shop Look" CTA
- Yatay urun scroll'u
- "Why it works" alinti kutusu

**US-H2: Hediye rehberi**
- Mevsimsel ton chip secici (4 secenek)
- Hediye kartlari + "Recommended for X" badge
- Fiyat ve "Why it works" aciklamasi

**US-H3: Paylasim kartlari**
- Share Results: gorsel palet karti (5 swatch + ozellik pill'leri + QR)
- Share Comparison: once/sonra karsilastirma + premium upsell

**Kabul kriterleri:**
- [ ] Editoryal ekranlar dogru gorsel hiyerarsi ile renderlanir
- [ ] Paylasim kartlari ekran goruntusu icin optimize edilmis
- [ ] Karsilastirma ekranindan paywall'a gecis calisir

---

**© ToneMatch**&emsp;Sayfa 11

## 10. TDD — Teknik Tasarim (V1)

### 10.1 Onerilen Stack

| Katman | Teknoloji |
|---|---|
| Mobil uygulama | React Native (Expo) + TypeScript |
| Navigasyon | Expo Router (file-based routing) + Stack + Bottom Tabs |
| State yonetimi | Zustand (in-memory) + AsyncStorage (persistent) + TanStack React Query (server state) |
| Auth | Supabase Auth (email/password) |
| Veritabani | Supabase PostgreSQL + Row Level Security |
| Depolama | Supabase Storage (signed upload) |
| AI isleme | Python FastAPI Cloud Run worker + CIELAB pipeline |
| LLM | OpenRouter uzerinde `google/gemini-3-flash-preview` (selfie / cilt alt tonu) + `google/gemini-3.1-flash-lite-preview` (kiyafet fotografi analizi) + dogrudan Gemini API (client fallback) |
| Odeme | RevenueCat SDK + App Store / Google Play |
| Analitik | PostHog (planlanmis) |
| Crash/performans | Sentry (planlanmis) |
| Gorsel secim | expo-image-picker, expo-camera |
| Guvenli depolama | expo-secure-store (native), localStorage (web) |
| Font | @expo-google-fonts/manrope |

### 10.2 Proje Yapisi

```
ToneMatch/
├── apps/
│   └── mobile/
│       ├── app/                          # Expo Router sayfalari
│       │   ├── (tabs)/                   # Bottom tab ekranlari
│       │   │   ├── _layout.tsx           # Tab bar yapilandirmasi
│       │   │   ├── home.tsx              # Ana dashboard
│       │   │   ├── discover.tsx          # Kesfet feed'i
│       │   │   ├── scan.tsx              # Kamera ekrani
│       │   │   ├── wardrobe.tsx          # Gardrop
│       │   │   └── profile.tsx           # Profil
│       │   ├── analysis/
│       │   │   └── [sessionId].tsx       # Analiz sonuclari (dinamik)
│       │   ├── _layout.tsx               # Kok layout (font + provider)
│       │   ├── index.tsx                 # Giris yonlendirici
│       │   ├── welcome.tsx               # Onboarding
│       │   ├── auth.tsx                  # Giris/kayit
│       │   ├── scan-review.tsx           # Fotograf on izleme
│       │   ├── analysis-loading.tsx      # Analiz ilerleme
│       │   ├── quick-check.tsx           # Hizli kontrol
│       │   ├── paywall.tsx               # Premium uyelik
│       │   ├── occasion-guide.tsx        # Ozel gun rehberi
│       │   ├── gift-guide.tsx            # Hediye rehberi
│       │   ├── share-results.tsx         # Paylasim karti
│       │   └── share-comparison.tsx      # Once/sonra karsilastirma
│       └── src/
│           ├── components/               # Paylasilan UI bilesenleri
│           │   ├── screen.tsx            # Temel sayfa wrapper'i
│           │   ├── glass-card.tsx        # Stilize kart (light/dark/accent)
│           │   ├── primary-button.tsx    # CTA buton (primary/secondary/ghost)
│           │   ├── pill.tsx              # Etiket badge
│           │   ├── text-field.tsx        # Etiketli text input
│           │   ├── empty-state.tsx       # Bos durum placeholder'i
│           │   └── feedback-strip.tsx    # Geri bildirim widget'i
│           ├── features/                 # Domain bazli hook'lar
│           │   ├── auth/use-auth.ts
│           │   ├── billing/use-revenuecat.ts
│           │   ├── billing/use-subscription-state.ts
│           │   ├── catalog/use-catalog-feed.ts
│           │   ├── scan/use-scan-flow.ts
│           │   ├── style/use-style-experience.ts
│           │   ├── style/use-style-profile.ts
│           │   ├── style/use-analysis-history.ts
│           │   ├── style/mock-data.ts
│           │   └── wardrobe/use-wardrobe-items.ts
│           ├── lib/                      # Altyapi kutuphaneleri
│           │   ├── env.ts                # Ortam degiskenleri
│           │   ├── supabase.ts           # Supabase client
│           │   ├── query-client.ts       # TanStack Query client
│           │   ├── gemini.ts             # Gemini API entegrasyonu
│           │   ├── revenuecat.ts         # Abonelik birlestime
│           │   └── tonematch-api.ts      # Merkezi API katmani (3 katmanli fallback)
│           ├── providers/                # React context provider'lar
│           │   ├── app-providers.tsx      # Kok provider agaci
│           │   ├── auth-provider.tsx      # Auth state yonetimi
│           │   └── revenuecat-provider.tsx # Billing provider (stub)
│           ├── store/                    # Zustand store'lar
│           │   ├── app-store.ts          # Genel uygulama state
│           │   └── profile-store.ts      # Kalici profil cache
│           ├── theme/                    # Tasarim token'lari
│           │   ├── palette.ts
│           │   ├── spacing.ts
│           │   └── type.ts
│           └── types/
│               └── tonematch.ts          # Merkezi tip tanimlari
├── supabase/
│   ├── config.toml                       # Local Supabase yapilandirmasi
│   ├── migrations/                       # SQL migration dosyalari (7 adet)
│   └── functions/                        # Edge Function'lar
│       ├── _shared/                      # Paylasilan yardimcilar
│       │   ├── auth.ts                   # resolveRequestUser
│       │   ├── cors.ts                   # CORS header'lari
│       │   └── mock-analysis.ts          # Fallback mock analiz
│       ├── create-upload/
│       ├── finalize-analysis/
│       ├── finalize-wardrobe-item/
│       ├── quick-check/
│       ├── export-account-data/
│       ├── privacy-delete-account/
│       ├── prepare-merchant-click/
│       ├── report-merchant-click/
│       ├── revenuecat-webhook/
│       └── ingest-catalog-feed/
├── services/
│   └── ai-worker/                        # Python FastAPI worker
│       └── app/
│           ├── main.py                   # FastAPI ana modul
│           ├── pipeline.py               # CIELAB analiz pipeline
│           ├── llm_service.py            # OpenRouter LLM entegrasyonu
│           ├── schemas.py                # Pydantic semaları
│           └── settings.py               # Yapilandirma
├── data/
│   └── sample-catalog-feed.json          # Demo merchant feed'i
├── scripts/
│   ├── ingest_catalog_feed.js            # Katalog import CLI
│   ├── build_workbook.js                 # Excel calisma kitabi uretici
│   └── generate-images.py               # AI gorsel uretici
└── docs/                                 # 8 dokumantasyon dosyasi
```

### 10.3 State Yonetimi

| Katman | Arac | Amac |
|---|---|---|
| Sunucu state | TanStack React Query | Tum async veri (stil profili, gardrop, katalog, abonelik) |
| Global istemci state | Zustand (`app-store`) | Tarama pipeline durumu, preview mode flag'leri, onboarding flag |
| Kalici yerel state | AsyncStorage + modul cache (`profile-store`) | Gemini analiz sonucu oturumlar arasi |
| Auth state | React Context (`auth-provider`) | Session, user, auth metodlari |
| Billing state | React Context (`revenuecat-provider`) | Abonelik bilgisi, paywall aksiyonlari |

**Query key konvansiyonu:** `[ozellik-adi, userId ?? "preview", isPreviewMode, ...ekstraBagimliliklar]`

### 10.4 AI Analiz Pipeline'i (CIELAB)

**8 Asamali Pipeline:**

1. **Girdi Kalite Kontrol**: Tek yuz, yeterli boyut, bulanklik, asiri pozlama, sert golge, filtre tespiti
2. **Landmark ve Cilt Bolgesi Cikarma**: Yuz landmark sistemi ile alnin, yanak, cene, boyun bolgeleri izole edilir
3. **Isik Duzeltme ve Renk Stabilizasyon**: Beyaz denge, gamma, pozlama normalizasyonu
4. **Renk Ozellik Cikarma (CIELAB)**:
   - Median L*, a*, b* degerleri
   - Ton acisi `h* = atan2(b*, a*)`
   - Chroma `C* = sqrt(a*² + b*²)`
   - ITA acisi (Chardon 1991)
   - `b*/a*` orani
   - Sicak yanilgi, zeytin yanilgi, parlaklik, doygunluk (legacy RGB)
5. **Ensemble Siniflandirma**:
   - Olive: `chroma < 20 VE ab_ratio > 1.3 VE a* < 15 VE h* > 48°`
   - Warm Neutral: `h* > 57°`
   - Cool Bright: `h* < 48°`
   - Notr bolge (48°-57°): `ab_ratio > 1.15` → Warm, aksi halde Cool
   - Kontrast: L* std < 0.11 → Low, 0.11-0.19 → Medium, >= 0.19 → High
6. **Palet ve Stil Esleme**: 9 profil (3 undertone x 3 kontrast), her biri core/neutrals/accent paletleri, avoid listesi, aciklama ve 3 urun onerisi icerir
7. **Katalog Esleme**: Undertone uyumu (+0.40), kontrast uyumu (+0.22), baglam esleme (+0.12), cinsiyet (+0.06), palet metin esleme (+0.14), stok durumu (+0.04), kacinilacak renk (-0.18) — toplam [0.05, 0.98] arasinda kesilir
8. **Aciklama Uretimi**: LLM tabanli detayli analiz (Turkce, 15 yil deneyimli renk analisti persona'si); selfie / cilt alt tonu icin `google/gemini-3-flash-preview`, kiyafet fotografi gorsel analizi icin `google/gemini-3.1-flash-lite-preview`

**Guven Puanlama:**
- Undertone guveni: ton acisi sinir mesafesine gore (0.55-0.96)
- Kontrast guveni: L* std esik mesafesine gore (0.58-0.94)
- Genel guven: `0.20 * kalite + 0.20 * isik + 0.30 * cilt_piksel_kapsami + 0.30 * chroma_kapsami` (0.42-0.95)

### 10.5 API Sozlesmesi

| Metod | Endpoint | Aciklama |
|---|---|---|
| POST | `/functions/v1/create-upload` | Signed upload URL olusturma |
| POST | `/functions/v1/finalize-analysis` | Analiz job'i baslatma (worker dispatch veya mock fallback) |
| POST | `/functions/v1/finalize-wardrobe-item` | Gardrop ogesi olusturma |
| POST | `/functions/v1/quick-check` | Hizli kiyafet kontrol |
| GET | `/functions/v1/export-account-data` | GDPR veri export |
| POST | `/functions/v1/privacy-delete-account` | Hesap ve veri silme |
| POST | `/functions/v1/prepare-merchant-click` | Izlenebilir merchant link olusturma |
| POST | `/functions/v1/report-merchant-click` | Click durumu bildirimi |
| POST | `/functions/v1/revenuecat-webhook` | RevenueCat abonelik olaylari |
| POST | `/functions/v1/ingest-catalog-feed` | Merchant katalog import |
| POST | `/jobs/analyze` (AI Worker) | Selfie analiz job'i |
| POST | `/jobs/quick-check` (AI Worker) | Kiyafet kontrol job'i |
| GET | `/healthz` (AI Worker) | Saglik kontrolu |
| RPC | `match_catalog_items(target_user_id, desired_context, feed_limit)` | Puanlanmis katalog esleme |
| RPC | `delete_user_data(target_user_id)` | Kademeli veri silme |

### 10.6 Ortam Degiskenleri

| Degisken | Kullanan | Amac |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Mobil | Supabase baglanti URL'i |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobil | Supabase anonim anahtar |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Mobil | Gemini dogrudan API (fallback) |
| `EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY` | Mobil | RevenueCat iOS |
| `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` | Mobil | RevenueCat Android |
| `EXPO_PUBLIC_DEV_SINGLE_USER_MODE` | Mobil | Gelistirici tek-kullanici modu |
| `SUPABASE_URL` | Edge Functions, Worker | Supabase sunucu URL'i |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions, Worker | Admin islemleri |
| `AI_WORKER_URL` | Edge Functions | Worker base URL |
| `AI_WORKER_SHARED_SECRET` | Edge Functions, Worker | Karsilikli auth |
| `REVENUECAT_WEBHOOK_SECRET` | Edge Functions | Webhook dogrulama |
| `CATALOG_INGEST_SECRET` | Edge Functions | Katalog import auth |
| `OPENROUTER_API_KEY` | AI Worker | LLM cikarim |
| `LLM_MODEL` | AI Worker | Model tanimlayici |

### 10.7 State Diyagramlari (Mermaid)

**Analiz Pipeline State Machine:**
```
stateDiagram-v2
    [*] --> idle
    idle --> selecting : pickFromLibrary() / captureWithCamera()
    selecting --> reviewing : imageSelected (pendingAsset kaydet)
    selecting --> idle : cancelled
    reviewing --> uploading : startAnalysis()
    uploading --> analyzing : uploadComplete
    uploading --> error : uploadFailed
    analyzing --> ready : sessionCompleted
    analyzing --> error : sessionFailed / timeout(45s)
    ready --> [*] : navigateToResults
    error --> idle : goBack
```

**Analiz Session Status:**
```
stateDiagram-v2
    [*] --> pending_upload
    pending_upload --> queued : finalize-analysis
    queued --> processing : worker picks up
    processing --> completed : analysis success
    processing --> failed : analysis error
    completed --> deleted : privacy-delete
    failed --> deleted : privacy-delete
```

**Premium/Abonelik:**
```
stateDiagram-v2
    [*] --> Free
    Free --> Plus : purchaseSuccess (RevenueCat webhook)
    Free --> Pro : purchaseSuccess
    Plus --> Pro : upgrade
    Plus --> Free : EXPIRATION / REFUND / REVOKE
    Pro --> Plus : downgrade
    Pro --> Free : EXPIRATION / REFUND / REVOKE
```

**Merchant Click:**
```
stateDiagram-v2
    [*] --> pending : prepare-merchant-click
    pending --> opened : report (user tapped)
    pending --> blocked : report (link blocked)
    pending --> failed : report (open failed)
```

### 10.8 Performans Hedefleri (V1)

| Metrik | Hedef |
|---|---|
| Yuklemeden sonuca | p50 < 12 sn, p95 < 30 sn |
| Home feed acilisi | p50 < 1.5 sn |
| Crash-free oturum | > %99 |
| Analiz polling araliigi | 2.2 sn |
| Analiz timeout | 45 sn |

### 10.9 Guvenlik

- **Uygulama katmani:** Session token'lari `SecureStore`'da (native), `localStorage`'da (web)
- **API katmani:** Tum kullanici verisine RLS uygulanir; service role key'ler sadece sunucu tarafinda
- **Depolama:** Kisa omurlu signed upload URL'leri; selfie'ler 24 saat saklama politikasi
- **Worker katmani:** Cloud Run ozel giris veya kimlik dogrulamali cagrilar; job ID (ham veri degil) task payload'inda
- **Edge Functions:** `verify_jwt = false` ayarli; kendi auth dogurlamalarini `resolveRequestUser` ile yapar
- **Webhook guvenlik:** `REVENUECAT_WEBHOOK_SECRET` ve `CATALOG_INGEST_SECRET` ile bearer token dogrulama

---

**© ToneMatch**&emsp;Sayfa 12

## Ek A — Implementasyon Durumu

### Tamamlanmis Alanlar
- Expo uygulama kabugu, tema ve sekmeli bilgi mimarisi
- Welcome, Auth, Home, Discover, Scan, Wardrobe, Profile, Quick Check ekranlari
- Scan Review, Analysis Loading, Analysis Results akisi
- Occasion Guide, Gift Guide, Share Results, Share Comparison editoryal ekranlari
- Paywall ekrani (3 plan secici)
- React Query, Zustand ve Supabase client temeli
- Session-aware auth provider ve preview mode
- Supabase SQL semasi ve temel RLS politikalari (7 migration)
- Signed upload icin `create-upload` function
- Analiz job yaratimi icin `finalize-analysis` function (worker dispatch + mock fallback)
- Gardrop ogesi olusturma icin `finalize-wardrobe-item` function
- Quick check icin `quick-check` function (worker dispatch + fallback)
- Hesap/veri silme icin `privacy-delete-account` function
- Veri export icin `export-account-data` function
- Merchant handoff icin `prepare-merchant-click` ve `report-merchant-click` function'lari
- RevenueCat webhook handler
- Katalog ingest function ve sync run kayitlari
- Cloud Run icin FastAPI worker ve CIELAB analiz pipeline
- LLM destekli detayli yorum (OpenRouter uzerinde `google/gemini-3-flash-preview`)
- Kiyafet fotografi gorsel analizi (OpenRouter uzerinde `google/gemini-3.1-flash-lite-preview`)
- Kamera/galeri secimi, signed upload, analysis polling ve query invalidation zinciri
- Worker yoksa Supabase function fallback ile mock sonucu tamamlayan analiz akisi
- Gemini dogrudan API fallback (client-side)
- Seeded merchant catalog, SQL ranking function ve discover feed
- Premium gating, paywall ekrani ve preview plan switching
- Merchant handoff icin click event tracking ve commerce log
- Profile icinde subscription state ve genisletilmis account data export
- RevenueCat SDK configure, paywall, restore purchases ve customer center wiring (stub)
- Merchant catalog ingest function ve local import CLI

### Henuz Tamamlanmamis Alanlar
- RevenueCat dashboard product/offering kurulumu ve store-side QA
- Gercek partner feed connector'lari ve affiliate network mapping
- Merchant redirect / affiliate network callback entegrasyonlari
- Gercek ML / vision model entegrasyonu (su anki CIELAB pipeline heuristik)
- Push notification ve device token akisi
- Wardrobe scoring icin gercek vision pipeline
- Yuz landmark / ROI tabanli daha guclu undertone modeli
- Gercek odeme isleme (V1'de mock)
- App Store / Google Play yayin oncesi QA

---

**© ToneMatch**&emsp;Sayfa 13

## Ek B — Referans Gorseller

Bu ek bolum; kodlama ekibinin tasarim referanslarini hizli gormesi icin mevcut ekran goruntulerine yonlendirir.

| Ekran | Dosya |
|---|---|
| Home Dashboard | `design_files/home-final.png` |
| Scan Kamera | `design_files/screen-check-scan.png` |
| Scan Review | `design_files/screen-check-scan-review.png` |
| Analysis Loading | `design_files/screen-check-analysis-loading.png` |
| Analysis Results | `design_files/screen-check-analysis-final.png` |
| Discover | `design_files/screen-check-discover.png` |
| Wardrobe | `design_files/screen-check-wardrobe.png` |
| Quick Check | `design_files/screen-check-quick-check.png` |
| Paywall | `design_files/screen-check-paywall.png` |
| Profile | `design_files/screen-check-profile.png` |
| Welcome | `design_files/screen-check-welcome.png` |
| Gift Guide | `design_files/screen-check-gift-guide.png` |
| Occasion Guide | `design_files/screen-check-occasion-guide.png` |
| Share Results | `design_files/share-results.png` |
| Share Comparison | `design_files/share-comparison.png` |

---

**© ToneMatch**&emsp;Sayfa 14

## Ek C — Notlar

- Bu dokuman V1 (MVP) kapsamini tanimlar.
- Gercek odeme entegrasyonu (RevenueCat store-side QA) V1.1 kapsamina alinmistir.
- Gercek ML/vision model entegrasyonu (yuz landmark + ROI tabanli) V2 kapsamindadir.
- Affiliate network callback entegrasyonlari V1.1/V2 kapsamina alinmistir.
- Push notification altyapisi V1.1 kapsamindadir.
- "Build Outfit" fonksiyonu V2 kapsamindadir.
- Stylist destekli premium rapor V2+ kapsamindadir.
- Web companion deneyimi V2+ kapsamindadir.
