const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const theme = {
  ink: "FF2B2520",
  muted: "FF6B6259",
  sand: "FFF4EFE8",
  clay: "FFD7C7B5",
  accent: "FF9E6D45",
  accentSoft: "FFF0E1D4",
  green: "FF3F6D57",
  red: "FF8C3B33",
  blue: "FF3B5A73",
  white: "FFFFFFFF",
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function setBaseColumns(ws) {
  ws.columns = [
    { width: 18 },
    { width: 22 },
    { width: 22 },
    { width: 24 },
    { width: 24 },
    { width: 26 },
    { width: 26 },
  ];
  ws.views = [{ state: "frozen", ySplit: 3 }];
}

function styleCell(cell, opts = {}) {
  if (opts.fill) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: opts.fill },
    };
  }
  if (opts.font) {
    cell.font = opts.font;
  }
  if (opts.alignment) {
    cell.alignment = opts.alignment;
  }
  if (opts.border) {
    cell.border = opts.border;
  }
}

function applyBorder(row, from = 1, to = row.cellCount) {
  for (let i = from; i <= to; i += 1) {
    row.getCell(i).border = {
      top: { style: "thin", color: { argb: theme.clay } },
      left: { style: "thin", color: { argb: theme.clay } },
      bottom: { style: "thin", color: { argb: theme.clay } },
      right: { style: "thin", color: { argb: theme.clay } },
    };
  }
}

function makeSheet(workbook, name, subtitle) {
  const ws = workbook.addWorksheet(name);
  setBaseColumns(ws);
  ws.mergeCells("A1:G1");
  ws.mergeCells("A2:G2");
  ws.getCell("A1").value = name;
  ws.getCell("A2").value = subtitle;
  styleCell(ws.getCell("A1"), {
    fill: theme.ink,
    font: { name: "Aptos Display", size: 18, bold: true, color: { argb: theme.white } },
    alignment: { vertical: "middle", horizontal: "left" },
  });
  styleCell(ws.getCell("A2"), {
    fill: theme.sand,
    font: { name: "Aptos", size: 11, color: { argb: theme.muted }, italic: true },
    alignment: { vertical: "middle", horizontal: "left" },
  });
  ws.getRow(1).height = 26;
  ws.getRow(2).height = 22;
  return { ws, row: 4 };
}

function addSection(ctx, title) {
  ctx.ws.mergeCells(`A${ctx.row}:G${ctx.row}`);
  const cell = ctx.ws.getCell(`A${ctx.row}`);
  cell.value = title;
  styleCell(cell, {
    fill: theme.accentSoft,
    font: { name: "Aptos", size: 12, bold: true, color: { argb: theme.ink } },
    alignment: { vertical: "middle", horizontal: "left" },
  });
  ctx.ws.getRow(ctx.row).height = 20;
  ctx.row += 1;
}

function addBulletRows(ctx, items) {
  items.forEach((item) => {
    const row = ctx.ws.getRow(ctx.row);
    row.getCell(1).value = "•";
    row.getCell(2).value = item;
    row.getCell(2).alignment = { wrapText: true, vertical: "top" };
    row.getCell(1).font = { bold: true, color: { argb: theme.accent } };
    row.height = 32;
    applyBorder(row, 1, 7);
    ctx.ws.mergeCells(`B${ctx.row}:G${ctx.row}`);
    ctx.row += 1;
  });
  ctx.row += 1;
}

function addKeyValueTable(ctx, headers, rows, widths = []) {
  const headerRow = ctx.ws.getRow(ctx.row);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    styleCell(cell, {
      fill: theme.accent,
      font: { bold: true, color: { argb: theme.white } },
      alignment: { wrapText: true, vertical: "middle" },
    });
  });
  headerRow.height = 22;
  applyBorder(headerRow, 1, headers.length);
  if (widths.length) {
    widths.forEach((width, index) => {
      ctx.ws.getColumn(index + 1).width = width;
    });
  }
  ctx.row += 1;

  rows.forEach((values, rowIndex) => {
    const row = ctx.ws.getRow(ctx.row);
    values.forEach((value, index) => {
      row.getCell(index + 1).value = value;
      row.getCell(index + 1).alignment = { wrapText: true, vertical: "top" };
      if (rowIndex % 2 === 0) {
        row.getCell(index + 1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: theme.sand },
        };
      }
    });
    row.height = 38;
    applyBorder(row, 1, values.length);
    ctx.row += 1;
  });
  ctx.row += 1;
}

function addFormulaTable(ctx, headers, rows) {
  const headerRow = ctx.ws.getRow(ctx.row);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    styleCell(cell, {
      fill: theme.blue,
      font: { bold: true, color: { argb: theme.white } },
      alignment: { wrapText: true, vertical: "middle" },
    });
  });
  applyBorder(headerRow, 1, headers.length);
  headerRow.height = 22;
  ctx.row += 1;

  rows.forEach((rowData) => {
    const row = ctx.ws.getRow(ctx.row);
    rowData.forEach((value, index) => {
      row.getCell(index + 1).value = value;
      row.getCell(index + 1).alignment = { wrapText: true, vertical: "top" };
    });
    row.height = 30;
    applyBorder(row, 1, rowData.length);
    ctx.row += 1;
  });
  ctx.row += 1;
}

function addSourceRows(ctx, rows) {
  addKeyValueTable(ctx, ["Kategori", "Kaynak", "URL", "Neden Önemli"], rows.map((source) => {
    return [
      source.category,
      source.name,
      { text: source.url, hyperlink: source.url },
      source.note,
    ];
  }), [18, 24, 42, 44]);

  for (let rowIndex = 5; rowIndex <= ctx.ws.lastRow.number; rowIndex += 1) {
    const cell = ctx.ws.getCell(`C${rowIndex}`);
    if (cell.value && typeof cell.value === "object" && cell.value.hyperlink) {
      cell.font = { color: { argb: "FF0563C1" }, underline: true };
    }
  }
}

async function buildWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Codex";
  workbook.company = "OpenAI";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = "ToneMatch product and technical design";
  workbook.title = "ToneMatch Master Plan";

  const overview = makeSheet(
    workbook,
    "Overview",
    "ToneMatch icin vizyon, deger onerisi ve yonetsel ozet"
  );
  addSection(overview, "Urun Tezi");
  addBulletRows(overview, [
    "Selfie ile undertone ve renk profili cikarip bunu gercek kiyafet kararina baglayan kisisel stil asistani.",
    "Temel wow ani: 60 saniyeden kisa surede kisinin en iyi renklerini ve uyumlu urunleri gormesi.",
    "Pozisyonlama: guzellik filtresi degil; bilimsel ama ulasilabilir stil karar motoru.",
  ]);
  addSection(overview, "North Star ve Basari");
  addKeyValueTable(overview, ["Baslik", "Tanim", "Not"], [
    [
      "North Star",
      "Analizden sonraki 7 gun icinde en az 1 anlamli stil aksiyonu alan kullanici orani",
      "Gercek davranis degisikligini olcer",
    ],
    [
      "90 gun hedefi",
      "Ilk oturum analiz tamamlama, yardimli sonuca guven ve ilk premium donusum",
      "Aktivasyon + guven birlikte izlenmeli",
    ],
    [
      "12 ay hedefi",
      "Renk analizi ile outfit onerisini tek catisi altinda birlestiren net kategori lideri",
      "Kadin ve erkek deneyimi esit kalitede",
    ],
  ], [20, 48, 28]);
  addSection(overview, "Stratejik Ilkeler");
  addBulletRows(overview, [
    "Aciklanabilirlik: her onerinin kisa bir nedeni gorunur.",
    "Dusuk surtunme: ilk deger icin uzun profil formu yok.",
    "Mahremiyet: raw selfie kisa sure tutulur, silme kullanicinin kontrolundedir.",
    "Ticari dogruluk: affiliate baskisi stil dogrulugunu override etmez.",
  ]);

  const market = makeSheet(
    workbook,
    "Market",
    "Rakipler, pazardaki bosluklar ve konumlandirma icin karar tabani"
  );
  addSection(market, "Rakip Haritasi");
  addKeyValueTable(market, ["Rakip", "Guclu Yan", "Bosluk", "ToneMatch Cikarsimi"], [
    [
      "Style DNA",
      "Selfie + wardrobe + commerce kombinasyonu",
      "Deger anlatimi yogun ve erkek tarafi halen firsatli",
      "Gelistirilmis ama daha sade onboarding ile vur",
    ],
    [
      "Colorwise / My Best Colors",
      "Renk analizi derinligi ve ogreticilik",
      "Commerce ve karar aksiyonu daha zayif",
      "Palette sonucunu satin alma akimina bagla",
    ],
    [
      "Insan stilist",
      "Guven ve premium algi",
      "Yavas ve pahali",
      "Dijital cekirdege ileride premium insan dokunusu eklenebilir",
    ],
  ], [20, 28, 28, 28]);
  addSection(market, "Pazardaki Acik Alanlar");
  addBulletRows(market, [
    "Erkek kullanici icin ayni kalitede deneyim.",
    "Iyi isikta guclu, kotu isikta kontrollu fallback veren guvenli analiz.",
    "Yerel veya bolgesel katalogla gercek satin alma aksiyonu.",
    "Sonucu sadece etiket degil, aciklama ve guven skoru ile sunma.",
  ]);

  const personas = makeSheet(
    workbook,
    "Personas",
    "Hedef segmentler, JTBD ve satin alma motivasyonlari"
  );
  addSection(personas, "Persona Ozeti");
  addKeyValueTable(personas, ["Persona", "Profil", "Temel Ihtiyac", "Odeme Nedenleri"], [
    [
      "Stilini optimize eden kadin",
      "22-38 yas, online alisverise alisik, moda ilgisi orta-yuksek",
      "Kendi renklerini ve guvenli alisveris kararlarini netlestirmek",
      "Daha hizli ve daha guvenli alisveris",
    ],
    [
      "Pratik stil yardimi isteyen erkek",
      "24-42 yas, stil kararinda ozguveni sinirli",
      "Az dusunerek dogru renk ve kombin secmek",
      "Zaman kazanci ve daha iyi gorunmek",
    ],
    [
      "Etkinlik odakli kullanici",
      "Karar aninda gelir; dugun, gorusme, tatil gibi senaryolar",
      "Duruma ozel hizli renk ve look onerisi",
      "Tek seferlik yuksek fayda",
    ],
  ], [22, 24, 30, 28]);
  addSection(personas, "JTBD");
  addKeyValueTable(personas, ["Is", "Friksiyon", "Cevap"], [
    [
      "Bana hangi renk yakisiyor",
      "Cok fazla celiskili bilgi var",
      "Foto tabanli undertone ve palet",
    ],
    [
      "Online alisveriste hata yapmamak",
      "Begendigim urun tende kotu durabiliyor",
      "Renk uyum skorlu urun onerileri",
    ],
    [
      "Ozel gun icin hizli karar",
      "Kombin kurmak ve renk secmek zaman aliyor",
      "Occasion bazli hazir look akisi",
    ],
  ], [24, 30, 32]);

  const product = makeSheet(
    workbook,
    "Product",
    "Kullanim akisi, MVP kapsami ve deneyim tasarimi"
  );
  addSection(product, "Ana Kullanim Dongusu");
  addBulletRows(product, [
    "Onboarding -> selfie upload -> kalite kontrol -> analiz -> sonuc -> shoppable feed.",
    "Temel sonuc paywall oncesi gosterilir; derin rapor ve surekli deger premium olur.",
    "Home, Discover, Scan, Wardrobe ve Profile olmak uzere 5 tabli bilgi mimarisi.",
  ]);
  addSection(product, "MVP ve Sonraki Faz");
  addKeyValueTable(product, ["Ozellik", "MVP", "Faz 2+"], [
    ["Undertone analizi", "Evet", "Model tuning ve ek boyutlar"],
    ["Shoppable urun feed", "Evet", "Occasion ve affiliate optimizasyonu"],
    ["Favoriler", "Evet", "Wardrobe graph"],
    ["Wardrobe", "Hayir", "Evet"],
    ["Quick Check", "Hayir", "Evet"],
    ["Stilist destekli premium", "Hayir", "Faz 4"],
  ], [24, 16, 24]);
  addSection(product, "Sonuc Ekrani Bilesenleri");
  addBulletRows(product, [
    "Warm / Cool / Neutral / Olive ana etiketi + guven skoru.",
    "Core colors, neutrals, accent colors ve avoid list.",
    "Kategori bazli ilk urun onerileri ve neden kartlari.",
    "Tekrar tarama, geri bildirim ve premium derin rapor CTA'si.",
  ]);

  const brand = makeSheet(
    workbook,
    "Brand UX",
    "Marka tonu, gorsel sistem ve App Store donusum yonu"
  );
  addSection(brand, "Marka Hissi");
  addBulletRows(brand, [
    "Premium ama erisilebilir, rafine ama yargilayici olmayan bir dil.",
    "Klinik guzellik uygulamasi degil; editorial moda ile guvenilir utility urunu arasinda denge.",
    "Kadin ve erkek deneyimi ayni ciddiyetle tasarlanmis olmali.",
  ]);
  addSection(brand, "Token Onerisi");
  addKeyValueTable(brand, ["Token", "Deger", "Rol"], [
    ["canvas", "#F5EFE8", "Ana arka plan"],
    ["surface", "#FFF9F4", "Kart ve paneller"],
    ["ink", "#2B2520", "Baslik ve ana metin"],
    ["accent", "#9E6D45", "Vurgu, CTA, chip"],
    ["muted", "#6B6259", "Ikinci metin"],
  ], [18, 16, 24]);
  addSection(brand, "Store ve Sonuc Ekrani");
  addBulletRows(brand, [
    "Store gorselleri: selfie sonucu, palette, shoppable urunler ve privacy vaadi sirasiyla ilerlemeli.",
    "Sonuc ekrani urunun vitrini; palette kartlari, neden aciklamasi ve ilk urun onerisi ayni ekranda gorunmeli.",
    "Paywall karanlik duvar gibi degil, sonucun premium derinligi gibi hissettirmeli.",
  ]);

  const ai = makeSheet(
    workbook,
    "AI Engine",
    "Analiz pipeline'i, olcumleme ve guven mekaniklari"
  );
  addSection(ai, "Pipeline");
  addKeyValueTable(ai, ["Adim", "Ne Yapar", "Basarisizlikta Davranis"], [
    ["Kalite kontrol", "Blur, isik, coklu yuz, filtre izi kontrolu", "Yeniden cekim ister"],
    ["Landmark ve ROI", "Alin, yanak, cene ve boyun referansi cikarma", "Yuksek belirsizlikte sonucu dusurur"],
    ["Renk normalizasyonu", "White balance ve exposure dengeleme", "Gecersiz sahnede guveni azaltir"],
    ["Siniflandirma", "Undertone + contrast + palette", "Alternatif sonuc yerine dusuk guven sunar"],
    ["Recommendation", "Katalog skorlama ve aciklama uretimi", "Daha temkinli feed gosterir"],
  ], [18, 28, 28]);
  addSection(ai, "Olcumleme");
  addKeyValueTable(ai, ["Metrik", "Amac", "Not"], [
    ["Top-1 undertone accuracy", "Analiz kalitesi", "Tek basina yeterli degil"],
    ["Calibration error", "Guven skorunun gercege yakinligi", "Ozellikle sinir vakalarda kritik"],
    ["Recommendation acceptance", "Ticari ve deneyimsel uygunluk", "Asil faydayi olcer"],
    ["Retake rate", "Giris kalitesi ve guven", "Yuksekse capture akisi zayif olabilir"],
  ], [24, 28, 24]);
  addSection(ai, "Guven Mekanikleri");
  addBulletRows(ai, [
    "Raw selfie varsayilan olarak 24 saatten fazla tutulmaz.",
    "Dusuk guvenli sonuc, kesin sonuc gibi sunulmaz.",
    "Kullanici uygulama icinden analiz, varlik ve hesap silme aksiyonlarini gorebilir.",
    "Model regression suiti cilt derinligi ve cinsiyet segmentlerine gore raporlanir.",
  ]);

  const architecture = makeSheet(
    workbook,
    "Architecture",
    "Bulut servis dagilimi ve teknik kararlar"
  );
  addSection(architecture, "Servis Dagilimi");
  addKeyValueTable(architecture, ["Katman", "Teknoloji", "Neden"], [
    ["Mobil", "Expo + React Native + TypeScript", "Tek codebase ve hizli release operasyonu"],
    ["Auth + DB + Storage", "Supabase", "RLS, Realtime ve private upload kolayligi"],
    ["AI Worker", "Python FastAPI on Cloud Run", "CPU yogun isler ve yonetilen olcekleme"],
    ["Queue", "Cloud Tasks", "Retry ve backoff disiplini"],
    ["Subscriptions", "RevenueCat", "Store farklarini normalize eder"],
    ["Analytics", "PostHog + Sentry", "Urun ve teknik gorunurluk"],
  ], [20, 24, 28]);
  addSection(architecture, "Kritik Sistem Notlari");
  addBulletRows(architecture, [
    "Signed upload URL kisa omurlu olmali; worker'a ham URL degil job id gecmeli.",
    "Tumuyle private storage kurgusu ve server-side service role erisimi kullanilmali.",
    "Realtime sadece sonuc durumu icin; agir feedler standart API ile cekilmeli.",
    "Model surumleme ve event sozlugu erken donemde standartlastirilmali.",
  ]);

  const stack = makeSheet(
    workbook,
    "Stack Matrix",
    "Alternatif teknoloji kombinasyonlari icin agirlikli karar matrisi"
  );
  addSection(stack, "Agirlikli Karsilastirma");
  const stackStart = stack.row;
  addFormulaTable(stack, ["Kriter", "Agirlik", "Expo+Supabase+Run", "Expo+Firebase+Functions", "Expo+AWS Amplify+Lambda"], [
    ["Gelistirme hizi", 25, 9, 8, 5],
    ["Ekibin tasiyabilecegi sadelik", 20, 9, 7, 4],
    ["AI worker entegrasyonu", 20, 9, 7, 8],
    ["Veri modeli esnekligi", 15, 9, 6, 7],
    ["Gizlilik ve erisim kontrolu", 10, 8, 7, 8],
    ["Toplam maliyet ve operasyon", 10, 8, 8, 5],
  ]);
  const totalRow = stack.ws.getRow(stack.row);
  totalRow.getCell(1).value = "Toplam Skor";
  totalRow.getCell(2).value = "";
  totalRow.getCell(3).value = { formula: `SUMPRODUCT(B${stackStart + 1}:B${stackStart + 6},C${stackStart + 1}:C${stackStart + 6})/100` };
  totalRow.getCell(4).value = { formula: `SUMPRODUCT(B${stackStart + 1}:B${stackStart + 6},D${stackStart + 1}:D${stackStart + 6})/100` };
  totalRow.getCell(5).value = { formula: `SUMPRODUCT(B${stackStart + 1}:B${stackStart + 6},E${stackStart + 1}:E${stackStart + 6})/100` };
  styleCell(totalRow.getCell(1), { fill: theme.green, font: { bold: true, color: { argb: theme.white } } });
  for (let c = 2; c <= 5; c += 1) {
    styleCell(totalRow.getCell(c), { fill: theme.accentSoft, font: { bold: true } });
    totalRow.getCell(c).numFmt = "0.00";
  }
  applyBorder(totalRow, 1, 5);
  totalRow.height = 22;
  stack.row += 2;
  addSection(stack, "Karar");
  addBulletRows(stack, [
    "Expo + Supabase + Cloud Run kombinasyonu teslim hizi, veri modeli esnekligi ve AI entegrasyonunda en dengeli secenektir.",
    "Firebase hizli olabilir ancak Postgres tabanli recommendation ve RLS esnekligi daha sinirlidir.",
    "Salt AWS ilk surum icin fazla agir ve ekip uzerindeki operasyon yukunu gereksiz artirir.",
  ]);

  const business = makeSheet(
    workbook,
    "Business",
    "Monetizasyon, KPI ve GTM karar ozetleri"
  );
  addSection(business, "Gelir Yapisi");
  addKeyValueTable(business, ["Gelir Kanali", "Rol", "Not"], [
    ["Subscription", "Birincil", "Ilk ana gelir moturu"],
    ["Affiliate", "Ikincil", "Katalog derinligi oturunca hizlanir"],
    ["Tek seferlik rapor", "Destekleyici", "Etkinlik odakli kullanicida faydali"],
    ["Marka ortakliklari", "Gec faz", "Olcege gelince dusunulmeli"],
  ], [22, 18, 34]);
  addSection(business, "Fiyat Hipotezi");
  addKeyValueTable(business, ["Plan", "Band", "Amac"], [
    ["Aylik", "7.99 - 12.99 USD", "Dusuk pismanklikla ilk odeme"],
    ["Yillik", "39.99 - 69.99 USD", "Retention guclu kullaniciyi kilitlemek"],
    ["Premium rapor", "9.99 - 19.99 USD", "Occasion / hediye senaryolari"],
  ], [18, 22, 30]);
  addSection(business, "KPI");
  addKeyValueTable(business, ["Katman", "Metrik", "Neden"], [
    ["Acquisition", "Store CVR, CAC", "Hook ve mesajlasma sagligi"],
    ["Activation", "Scan complete, first result time", "Ilk wow ani"],
    ["Trust", "Helpfulness score, retake rate", "Sonuc inandiriciligi"],
    ["Monetization", "Trial start, paywall CVR", "Gelir cekirdegi"],
    ["Commerce", "Product CTR, affiliate conversion", "Shoppable akisin isi"],
  ], [18, 24, 28]);

  const roadmap = makeSheet(
    workbook,
    "Roadmap",
    "12 aylik teslim ve ekip zamani"
  );
  addSection(roadmap, "Fazlar");
  addKeyValueTable(roadmap, ["Faz", "Sure", "Hedef", "Cikis"], [
    ["Faz 0", "4-6 hafta", "Kullanici gorusmeleri ve prototip", "Positioning + veri plani"],
    ["Faz 1", "8-12 hafta", "MVP uygulama ve ilk model", "Store-ready beta"],
    ["Faz 2", "8 hafta", "Occasion, feedback, feed genisleme", "Retention iyilesmesi"],
    ["Faz 3", "8-10 hafta", "Wardrobe ve Quick Check", "Gunluk kullanim araci"],
    ["Faz 4", "10-12 hafta", "Bolgesel genisleme ve premium katman", "Olcek ve ortaklik"],
  ], [14, 14, 28, 24]);
  addSection(roadmap, "Ilk Ekip");
  addBulletRows(roadmap, [
    "1 mobil lead, 1 full-stack/platform engineer, 1 ML engineer, 1 product designer.",
    "Founder veya PM urun hizalama ve GTM tarafini tasimali.",
    "Part-time growth/content kapasitesi acquisition kreatiflerini uretmeli.",
  ]);

  const backlog = makeSheet(
    workbook,
    "Backlog",
    "Onceliklendirilmis is listesi ve formullu skor"
  );
  addSection(backlog, "Onceliklendirme Matrisi");
  const backlogStart = backlog.row;
  addFormulaTable(backlog, ["Is", "Impact", "Confidence", "Effort", "Priority Score", "Not"], [
    ["Undertone scan MVP", 10, 9, 4, { formula: `B${backlogStart + 1}*C${backlogStart + 1}/D${backlogStart + 1}` }, "Cekirdek deger"],
    ["Result hero redesign", 8, 8, 3, { formula: `B${backlogStart + 2}*C${backlogStart + 2}/D${backlogStart + 2}` }, "Activation icin kritik"],
    ["Occasion looks", 7, 7, 5, { formula: `B${backlogStart + 3}*C${backlogStart + 3}/D${backlogStart + 3}` }, "Retention / monetization"],
    ["Wardrobe upload", 8, 6, 8, { formula: `B${backlogStart + 4}*C${backlogStart + 4}/D${backlogStart + 4}` }, "Daha agir ama guclu moat"],
    ["Quick Check", 9, 6, 7, { formula: `B${backlogStart + 5}*C${backlogStart + 5}/D${backlogStart + 5}` }, "Gunluk tekrar acma nedeni"],
    ["Stylist premium report", 6, 5, 6, { formula: `B${backlogStart + 6}*C${backlogStart + 6}/D${backlogStart + 6}` }, "Sonraki ticari katman"],
  ]);
  for (let rowNo = backlogStart + 1; rowNo <= backlogStart + 6; rowNo += 1) {
    backlog.ws.getCell(`E${rowNo}`).numFmt = "0.00";
  }
  addSection(backlog, "Yorum");
  addBulletRows(backlog, [
    "Skorlar, MVP'de once undertone cekirdegi ve sonuc deneyiminin cilalanmasi gerektigini gosterir.",
    "Wardrobe ve Quick Check yuksek potansiyel tasir fakat ikinci dalgada daha mantiklidir.",
  ]);

  const risks = makeSheet(
    workbook,
    "Risks",
    "Urun, teknik ve ticari risk kaydi"
  );
  addSection(risks, "Risk Register");
  addKeyValueTable(risks, ["Risk", "Etki", "Sinyal", "Onlem"], [
    ["Kotü isikta analiz hatasi", "Guven kaybi", "Yuksek retake ve dusuk helpfulness", "Kalite kontrol + fallback"],
    ["Erkek segmenti zayif kalir", "TAM kuculur", "Erkek onboarding drop ve dusuk CTR", "Ayrik kreatif ve feed dilinin test edilmesi"],
    ["Affiliate urun kalitesi duser", "Marka asinir", "Yuksek bounce ve dusuk save", "Kurasyon ve skor tavani"],
    ["Veri gizliligi endisesi", "Store review ve churn", "Yuksek delete-account, destek sorulari", "Kisa retention ve self-serve privacy center"],
    ["Stack karmasikligi artar", "Teslim hizinin dusmesi", "Bug cycle uzar", "Moduler servis sorumluluklari ve kucuk teknik yigin"],
  ], [26, 20, 24, 26]);

  const sources = makeSheet(
    workbook,
    "Sources",
    "Kararlarin dayandigi guncel dis kaynaklar"
  );
  addSourceRows(sources, [
    {
      category: "Mobile",
      name: "Expo Router",
      url: "https://docs.expo.dev/router/introduction/",
      note: "Dosya tabanli navigasyon ve Expo merkezli uygulama yapisi icin referans.",
    },
    {
      category: "Mobile",
      name: "Expo Camera",
      url: "https://docs.expo.dev/versions/latest/sdk/camera/",
      note: "Capture deneyimi ve izin akisinin teknik zemini.",
    },
    {
      category: "Mobile",
      name: "Expo ImagePicker",
      url: "https://docs.expo.dev/versions/latest/sdk/imagepicker/",
      note: "Galeriden selfie secimi ve medya izinleri.",
    },
    {
      category: "Backend",
      name: "Supabase with Expo",
      url: "https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native",
      note: "Auth ve veri katmaninin Expo ile uyumu.",
    },
    {
      category: "Backend",
      name: "Supabase RLS",
      url: "https://supabase.com/docs/guides/database/postgres/row-level-security",
      note: "Kullanici verisinde cekirdek guvenlik modeli.",
    },
    {
      category: "Backend",
      name: "Supabase Signed Uploads",
      url: "https://supabase.com/docs/guides/storage/uploads/s3-uploads/signed-uploads",
      note: "Private selfie upload akisi icin temel mekanizma.",
    },
    {
      category: "AI",
      name: "Cloud Run",
      url: "https://cloud.google.com/run/docs/overview/what-is-cloud-run",
      note: "AI worker'i yonetilen container olarak calistirmak icin.",
    },
    {
      category: "AI",
      name: "MediaPipe Face Landmarker",
      url: "https://developers.google.com/mediapipe/solutions/vision/face_landmarker",
      note: "Yuz ROI cikarmanin teknik zemini.",
    },
    {
      category: "Commerce",
      name: "RevenueCat React Native",
      url: "https://www.revenuecat.com/docs/getting-started/installation/reactnative",
      note: "Cross-platform subscription operasyonu.",
    },
    {
      category: "Competition",
      name: "Style DNA",
      url: "https://style-dna.com/",
      note: "Kategori hareketini wardrobe + commerce yonune gosteren rakip.",
    },
    {
      category: "Competition",
      name: "Colorwise",
      url: "https://colorwise.me/self-guided-color-analysis",
      note: "Self-service renk analizi talebinin gostergesi.",
    },
    {
      category: "Policy",
      name: "Apple App Privacy",
      url: "https://developer.apple.com/app-store/app-privacy-details/",
      note: "Veri aciklamalari ve store oncesi uyumluluk gereksinimi.",
    },
    {
      category: "Policy",
      name: "Google Play Data Safety",
      url: "https://support.google.com/googleplay/android-developer/answer/10787469",
      note: "Android veri guvenligi beyaninin temeli.",
    },
    {
      category: "Policy",
      name: "ICO Biometric Data",
      url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-information-biometric-data/what-is-biometric-data-and-how-special-category-data-relates-to-biometric-data/",
      note: "Yuz verisi isleyen urunlerde veri siniflandirmasi icin risk referansi.",
    },
  ]);

  workbook.eachSheet((ws) => {
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        if (!cell.font) {
          cell.font = { name: "Aptos", size: 10, color: { argb: theme.ink } };
        }
        if (!cell.alignment) {
          cell.alignment = { vertical: "top", horizontal: "left" };
        }
      });
    });
  });

  const outDir = path.join(__dirname, "..", "artifacts");
  ensureDir(outDir);
  const outPath = path.join(outDir, "tone-match-master-plan.xlsx");
  await workbook.xlsx.writeFile(outPath);
  console.log(`Workbook written to ${outPath}`);
}

buildWorkbook().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
