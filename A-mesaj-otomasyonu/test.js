'use strict';

// Kullanım: node A-mesaj-otomasyonu/test.js
// Gerçek API'ye gidilmez; tüm sipariş senaryoları sahte fetch ile test edilir.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const K = require('./kurallar');

const MESAJLAR = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'mesajlar.json'), 'utf8'));
const mesaj = (id) => MESAJLAR.find((m) => m.id === id);

// --- Sahte fetch yardımcıları ------------------------------------------------

function jsonFetch(govde, status = 200) {
  const cagrilar = [];
  const fn = async (url) => {
    cagrilar.push(url);
    return new Response(typeof govde === 'string' ? govde : JSON.stringify(govde), { status });
  };
  fn.cagrilar = cagrilar;
  return fn;
}

function cagrilmamaliFetch() {
  return async () => { throw new Error('Bu senaryoda API çağrılmamalıydı'); };
}

const sayac = () => {
  const fn = async () => { fn.sayi++; throw new Error('çağrılmamalı'); };
  fn.sayi = 0;
  return fn;
};

// Başka müşteriye ait, ayırt edilebilir içerikli sepet.
const YABANCI_CART = {
  id: 12, userId: 12, total: 37767.32, discountedTotal: 1, totalQuantity: 9,
  products: [
    { id: 1, title: 'GizliUrunAlfa', quantity: 3, price: 10 },
    { id: 2, title: 'GizliUrunBeta', quantity: 6, price: 20 },
  ],
};

function sizintiYok(talep) {
  const json = JSON.stringify(talep);
  for (const parca of ['GizliUrunAlfa', 'GizliUrunBeta', '37767', 'userId', 'quantity', 'discountedTotal', 'x3', 'x6']) {
    assert.ok(!json.includes(parca), `sızıntı: "${parca}" çıktıda bulundu`);
  }
}

// Eşleşmeyen siparişte not, siparişin başka bir müşteriye ait olduğunu ifşa etmemeli.
const SAHIPLIK_IFSASI = /(ait değil|başka(sına| bir)? müşteri|farklı (bir )?müşteri|başkasına ait|another customer|belongs to|not yours)/i;

const TEKNIK_IZLER = /(fetch failed|not found|ECONN|timeout|TypeError|SyntaxError|JSON|HTTP|500|stack|Cart with id)/i;

// --- 1. Sınıflandırma ---------------------------------------------------------

test('15 gerçek mesaj beklenen konuya atanır', () => {
  const beklenen = {
    1: 'siparis-durumu', 2: 'siparis-durumu', 3: 'siparis-durumu', 4: 'istenmeyen-etki',
    5: 'iade-sikayet', 6: 'siparis-durumu', 7: 'diger', 8: 'siparis-durumu', 9: 'urun-sorusu',
    10: 'fiyat', 11: 'urun-sorusu', 12: 'diger', 13: 'urun-sorusu', 14: 'fiyat', 15: 'urun-sorusu',
  };
  assert.equal(MESAJLAR.length, 15);
  for (const m of MESAJLAR) {
    assert.equal(K.konuBelirle(m.mesaj).konu, beklenen[m.id], `mesaj ${m.id}`);
  }
});

test('mesaj 8: siparis-durumu birincil, fiyat ikincil niyet', () => {
  const a = K.konuBelirle(mesaj(8).mesaj);
  assert.equal(a.konu, 'siparis-durumu');
  assert.deepEqual(a.ikincil, ['fiyat']);
});

test('çoklu niyet önceliği: istenmeyen-etki > iade-sikayet > siparis-durumu > fiyat > urun-sorusu', () => {
  assert.equal(K.konuBelirle('Kremi kullandım yüzüm kızardı, iade etmek istiyorum').konu, 'istenmeyen-etki');
  assert.equal(K.konuBelirle('5 numaralı siparişim ezik geldi, iade istiyorum').konu, 'iade-sikayet');
  assert.equal(K.konuBelirle('Serumun fiyatı ne kadar?').konu, 'fiyat');
});

test('mesaj 12: genel "siparişler" sorusu siparis-durumu sayılmaz', () => {
  const a = K.konuBelirle(mesaj(12).mesaj);
  assert.equal(a.konu, 'diger');
  assert.deepEqual(a.siparisNolari, []);
});

test('spam (mesaj 7) diger olur ve cevap üretilmez', async () => {
  const a = K.konuBelirle(mesaj(7).mesaj);
  assert.equal(a.konu, 'diger');
  assert.equal(a.spam, true);
  const t = await K.mesajiIsle(mesaj(7), { fetchImpl: cagrilmamaliFetch() });
  assert.equal(t.cevap_taslagi, '');
  assert.ok(!t.not.includes('bit.ly'));
});

// --- 2. Sipariş numarası çıkarma --------------------------------------------

test('mesaj 13: "200 ml" sipariş numarası sayılmaz', () => {
  assert.deepEqual(K.siparisNumaralariCikar(mesaj(13).mesaj), []);
});

test('mesaj 7: "%100" ve URL sipariş numarası sayılmaz', () => {
  assert.deepEqual(K.siparisNumaralariCikar(mesaj(7).mesaj), []);
});

test('bağlamlı sipariş numarası kalıpları', () => {
  assert.deepEqual(K.siparisNumaralariCikar(mesaj(1).mesaj), [12]);
  assert.deepEqual(K.siparisNumaralariCikar(mesaj(3).mesaj), [9999]);
  assert.deepEqual(K.siparisNumaralariCikar(mesaj(6).mesaj), [3]);
  assert.deepEqual(K.siparisNumaralariCikar(mesaj(8).mesaj), [4]);
  assert.deepEqual(K.siparisNumaralariCikar('Sipariş no 12 ne durumda?'), [12]);
  assert.deepEqual(K.siparisNumaralariCikar('Siparişimin numarası: 45'), [45]);
  assert.deepEqual(K.siparisNumaralariCikar('order number 7 please'), [7]);
  assert.deepEqual(K.siparisNumaralariCikar('Order #3.'), [3]);
  assert.deepEqual(K.siparisNumaralariCikar('5 numaralı ve 12 numaralı siparişlerim'), [5, 12]);
  assert.deepEqual(K.siparisNumaralariCikar('5, 7 ve 9 nolu siparişler'), [5, 7, 9]);
});

test('bağlamsız sayılar sipariş numarası sayılmaz', () => {
  assert.deepEqual(K.siparisNumaralariCikar('Siparişim 2 gündür gelmedi'), []);
  assert.deepEqual(K.siparisNumaralariCikar('50 ml kremi 3 gün önce aldım'), []);
  assert.deepEqual(K.siparisNumaralariCikar('%20 indirim, 1.5 kat, 12,5 TL'), []);
});

test('numarasız kişisel sipariş sorusu: API çağrılmaz, numara istenir', async () => {
  const f = sayac();
  const t = await K.mesajiIsle({ id: 90, kanal: 'whatsapp', musteri_id: 1, mesaj: 'Siparişim nerede?' }, { fetchImpl: f });
  assert.equal(t.konu, 'siparis-durumu');
  assert.equal(f.sayi, 0);
  assert.equal(t.devret, false);
  assert.match(t.cevap_taslagi, /sipariş numaranızı/);
});

test('birden fazla sipariş numarası: API çağrılmaz, devredilir', async () => {
  const f = sayac();
  const t = await K.mesajiIsle(
    { id: 91, kanal: 'whatsapp', musteri_id: 5, mesaj: '5 numaralı ve 12 numaralı siparişlerim nerede?' },
    { fetchImpl: f },
  );
  assert.equal(f.sayi, 0);
  assert.equal(t.konu, 'siparis-durumu');
  assert.equal(t.devret, true);
});

// --- 3. Hassas konular -------------------------------------------------------

const YASAKLI_TAVSIYE = /(kullan|sür(ün|meyi)|bırak|ilaç|krem|serum|öner|tavsiye|teşhis|tedavi|alerji|doktor|hekim|eczane|yıka|kompres|antihistamin|kortizon)/i;

for (const id of [4, 5]) {
  test(`mesaj ${id}: hassas konu devredilir, API çağrılmaz, tavsiye/teşhis yok`, async () => {
    const t = await K.mesajiIsle(mesaj(id), { fetchImpl: cagrilmamaliFetch() });
    assert.ok(K.HASSAS_KONULAR.has(t.konu));
    assert.equal(t.devret, true);
    assert.ok(t.cevap_taslagi.length > 0);
    assert.doesNotMatch(t.cevap_taslagi, YASAKLI_TAVSIYE);
    assert.match(t.cevap_taslagi, /temsilci/);
  });
}

test('sipariş numarası içeren istenmeyen-etki mesajında da API çağrılmaz', async () => {
  const f = sayac();
  const t = await K.mesajiIsle(
    { id: 92, kanal: 'instagram', musteri_id: 12, mesaj: '12 numaralı siparişteki krem yüzümü yaktı' },
    { fetchImpl: f },
  );
  assert.equal(t.konu, 'istenmeyen-etki');
  assert.equal(t.devret, true);
  assert.equal(f.sayi, 0);
  assert.doesNotMatch(t.cevap_taslagi, YASAKLI_TAVSIYE);
});

// --- 4. Sipariş güvenliği ----------------------------------------------------

test('sahiplik eşleşir: ürün adları + miktar + toplam yazılır, devret=false', async () => {
  const f = jsonFetch({ id: 5, userId: 5, total: 1467.88, products: [{ title: 'Ürün A', quantity: 2 }, { title: 'Ürün B', quantity: 1 }] });
  const t = await K.mesajiIsle(mesaj(2), { fetchImpl: f });
  assert.equal(f.cagrilar[0], 'https://dummyjson.com/carts/5');
  assert.equal(t.konu, 'siparis-durumu');
  assert.equal(t.devret, false);
  assert.match(t.cevap_taslagi, /Ürün A \(x2\)/);
  assert.match(t.cevap_taslagi, /Ürün B \(x1\)/);
  assert.match(t.cevap_taslagi, /1467\.88/);
  assert.doesNotMatch(t.cevap_taslagi, /(kargoya verildi|teslim edildi|Yurtiçi|Aras|MNG|PTT)/i);
});

test('mesaj 1 / sahiplik eşleşmez: devret=true, hiçbir sipariş verisi sızmaz', async () => {
  const t = await K.mesajiIsle(mesaj(1), { fetchImpl: jsonFetch(YABANCI_CART) });
  assert.equal(t.devret, true);
  assert.match(t.cevap_taslagi, /doğrulanamadı/);
  sizintiYok(t);
  assert.doesNotMatch(t.not, SAHIPLIK_IFSASI);
  assert.doesNotMatch(t.cevap_taslagi, SAHIPLIK_IFSASI);
});

test('string userId tip edge-case: "5" ile musteri_id 5 eşleşir', async () => {
  const t = await K.mesajiIsle(mesaj(2), { fetchImpl: jsonFetch({ id: 5, userId: '5', total: 10, products: [{ title: 'X', quantity: 1 }] }) });
  assert.equal(t.devret, false);
  assert.match(t.cevap_taslagi, /X \(x1\)/);
});

test('string musteri_id "7" ile userId 12 eşleşmez', async () => {
  const t = await K.mesajiIsle({ ...mesaj(1), musteri_id: '7' }, { fetchImpl: jsonFetch(YABANCI_CART) });
  assert.equal(t.devret, true);
  sizintiYok(t);
  assert.doesNotMatch(t.not, SAHIPLIK_IFSASI);
});

test('geçersiz userId (null / "abc") veriyi göstermeden devredilir', async () => {
  for (const userId of [null, 'abc', true, 0]) {
    const t = await K.mesajiIsle(mesaj(2), { fetchImpl: jsonFetch({ ...YABANCI_CART, id: 5, userId }) });
    assert.equal(t.devret, true, `userId=${userId}`);
    sizintiYok(t);
  }
});

test('geçersiz musteri_id: API çağrılmadan devredilir', async () => {
  const f = sayac();
  const t = await K.mesajiIsle({ ...mesaj(2), musteri_id: null }, { fetchImpl: f });
  assert.equal(f.sayi, 0);
  assert.equal(t.devret, true);
});

test('mesaj 6: İngilizce eşleşen sipariş İngilizce şablonla cevaplanır', async () => {
  const t = await K.mesajiIsle(mesaj(6), { fetchImpl: jsonFetch({ id: 3, userId: 3, total: 99.5, products: [{ title: 'Lipstick', quantity: 1 }] }) });
  assert.equal(t.devret, false);
  assert.match(t.cevap_taslagi, /^Hello, your order #3 contains: Lipstick \(x1\)\. Order total: 99\.50\./);
});

test('mesaj 8: eşleşen sipariş + ikincil fiyat notu', async () => {
  const t = await K.mesajiIsle(mesaj(8), { fetchImpl: jsonFetch({ id: 4, userId: 4, total: 689.93, products: [{ title: 'Y', quantity: 1 }] }) });
  assert.equal(t.devret, false);
  assert.match(t.cevap_taslagi, /689\.93/);
  assert.match(t.cevap_taslagi, /Fiyat sorunuzla/);
  assert.match(t.not, /İkincil niyet: fiyat/);
});

// --- 5. API hata davranışı ---------------------------------------------------

test('404 not found: anlaşılır mesaj, teknik metin yok, devret=false', async () => {
  const t = await K.mesajiIsle(mesaj(3), { fetchImpl: jsonFetch({ message: "Cart with id '9999' not found" }, 404) });
  assert.equal(t.devret, false);
  assert.match(t.cevap_taslagi, /9999 numaralı bir siparişi sistemimizde bulamadık/);
  assert.doesNotMatch(t.cevap_taslagi, TEKNIK_IZLER);
});

test('200 + "not found" mesaj gövdesi de bulunamadı sayılır', async () => {
  const t = await K.mesajiIsle(mesaj(3), { fetchImpl: jsonFetch({ message: "Cart with id '9999' not found" }, 200) });
  assert.equal(t.devret, false);
  assert.match(t.cevap_taslagi, /bulamadık/);
});

const HATA_SENARYOLARI = {
  'ağ hatası': async () => { throw new TypeError('fetch failed: ECONNRESET'); },
  'HTTP 500': jsonFetch({ message: 'Internal Server Error' }, 500),
  'HTTP 503 (HTML gövde)': jsonFetch('<html>Service Unavailable</html>', 503),
  'bozuk JSON': jsonFetch('{"id": 5, "userId": 5, bozuk', 200),
  'yanlış cart id (5 istendi, 6 döndü)': jsonFetch({ id: 6, userId: 5, total: 1, products: [{ title: 'Z', quantity: 1 }] }),
  'beklenmeyen yapı (products yok)': jsonFetch({ id: 5, userId: 5, total: 1 }),
  'beklenmeyen yapı (dizi)': jsonFetch([1, 2, 3]),
  'beklenmeyen yapı (total string)': jsonFetch({ id: 5, userId: 5, total: 'çok', products: [] }),
};

for (const [ad, fetchImpl] of Object.entries(HATA_SENARYOLARI)) {
  test(`${ad}: devret=true, teknik detay sızmaz, sipariş verisi yok`, async () => {
    const t = await K.mesajiIsle(mesaj(2), { fetchImpl });
    assert.equal(t.devret, true);
    assert.doesNotMatch(t.cevap_taslagi, TEKNIK_IZLER);
    assert.doesNotMatch(t.not, /(fetch failed|ECONN|TypeError|SyntaxError|Internal Server Error|<html>|bozuk)/);
    assert.doesNotMatch(t.cevap_taslagi, /(Z \(x1\)|toplam tutarı)/);
  });
}

test('timeout: yanıt gelmezse istek kesilir ve devredilir', async () => {
  const asili = (url, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason));
  });
  const baslangic = Date.now();
  const t = await K.mesajiIsle(mesaj(2), { fetchImpl: asili, timeoutMs: 50 });
  assert.ok(Date.now() - baslangic < 2000);
  assert.equal(t.devret, true);
});

// --- 6. Çıktı şekli ve dayanıklılık -----------------------------------------

test('her kayıt yalnızca 5 alan içerir; tek mesaj hatası işlemeyi durdurmaz', async () => {
  const girdiler = [
    mesaj(2),
    { id: 99, kanal: 'whatsapp', musteri_id: 1, mesaj: null }, // bozuk kayıt
    mesaj(10),
  ];
  const talepler = await K.tumunuIsle(girdiler, { fetchImpl: jsonFetch({ id: 5, userId: 5, total: 1, products: [{ title: 'A', quantity: 1 }] }) });
  assert.equal(talepler.length, 3);
  for (const t of talepler) {
    assert.deepEqual(Object.keys(t), ['id', 'konu', 'devret', 'cevap_taslagi', 'not']);
    assert.ok(K.KONULAR.includes(t.konu));
    assert.equal(typeof t.devret, 'boolean');
  }
  assert.equal(talepler[1].id, 99);
  assert.equal(talepler[1].devret, true);
  assert.equal(talepler[2].konu, 'fiyat');
});

test('fiyat / ürün cevapları bilgi uydurmaz', async () => {
  for (const id of [9, 10, 11, 13, 14, 15]) {
    const t = await K.mesajiIsle(mesaj(id), { fetchImpl: cagrilmamaliFetch() });
    assert.equal(t.devret, false);
    assert.doesNotMatch(t.cevap_taslagi, /(\d+([.,]\d+)?\s*(tl|₺|\$)|uygundur|içermez|test edilmez|vardır|mevcuttur)/i, `mesaj ${id}`);
  }
});

// --- 7. Özet -----------------------------------------------------------------

test('özet: toplam, konu sayıları ve devredilen sayısı', () => {
  const ozet = K.ozetHesapla([
    { id: 1, konu: 'fiyat', devret: false }, { id: 2, konu: 'iade-sikayet', devret: true },
    { id: 3, konu: 'fiyat', devret: false },
  ]);
  assert.equal(ozet.toplam, 3);
  assert.equal(ozet.konuSayilari.fiyat, 2);
  assert.equal(ozet.konuSayilari['istenmeyen-etki'], 0);
  assert.equal(ozet.devredilenSayisi, 1);
  const html = K.ozetHtml(ozet);
  assert.match(html, /Toplam mesaj: <strong>3<\/strong>/);
  assert.match(html, /Temsilciye devredilen: <strong>1<\/strong>/);
});

test('HTML escape', () => {
  assert.equal(K.escapeHtml('<script>"x"&\'y\'</script>'), '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;');
});

// --- 8. Operasyon özeti ------------------------------------------------------

// Gerçek 15 mesajı, canlı API'yi taklit eden sahte fetch ile uçtan uca işler.
function sahteDummyJson() {
  const cartlar = {
    12: YABANCI_CART, // mesaj 1: musteri_id 7, sahibi başka
    5: { id: 5, userId: 5, total: 1467.88, products: [{ title: 'GizliUrunGama', quantity: 4 }] },
    3: { id: 3, userId: 3, total: 1794.85, products: [{ title: 'GizliUrunDelta', quantity: 1 }] },
    4: { id: 4, userId: 4, total: 689.93, products: [{ title: 'GizliUrunEpsilon', quantity: 3 }] },
  };
  return async (url) => {
    const id = Number(url.split('/').pop());
    return cartlar[id]
      ? new Response(JSON.stringify(cartlar[id]), { status: 200 })
      : new Response(JSON.stringify({ message: `Cart with id '${id}' not found` }), { status: 404 });
  };
}

async function gercekOzet() {
  const sonuclar = await K.tumunuIsleDetayli(MESAJLAR, { fetchImpl: sahteDummyJson() });
  const talepler = sonuclar.map((s) => s.talep);
  const durumlar = new Map(sonuclar.map((s) => [s.talep.id, s.durum]));
  return { talepler, ozet: K.ozetHesapla(talepler, { mesajlar: MESAJLAR, durumlar }) };
}

test('özet metrikleri: toplam 15, kanal toplamı 15, devredilen 3', async () => {
  const { talepler, ozet } = await gercekOzet();
  assert.equal(ozet.toplam, 15);
  assert.deepEqual(ozet.kanalSayilari, { whatsapp: 8, instagram: 7 });
  assert.equal(Object.values(ozet.kanalSayilari).reduce((a, b) => a + b, 0), 15);
  assert.equal(ozet.devredilenSayisi, 3);
  assert.equal(Object.values(ozet.konuSayilari).reduce((a, b) => a + b, 0), 15);
  assert.equal(ozet.sahiplikBasarisiz, 1);
  assert.equal(ozet.bulunamayanSiparis, 1);
  assert.equal(ozet.spam, 1);
  assert.deepEqual(ozet.devirNedenleri, {
    'Sipariş sahipliği doğrulanamadı': 1, 'İstenmeyen etki bildirimi': 1, 'İade / şikâyet': 1,
  });
  // Dahili durum bilgisi çıktı kayıtlarına sızmaz.
  for (const t of talepler) assert.deepEqual(Object.keys(t), ['id', 'konu', 'devret', 'cevap_taslagi', 'not']);
});

test('temsilci kuyruğu yalnızca devret=true kayıtlarını ve güvenli alanları içerir', async () => {
  const { talepler, ozet } = await gercekOzet();
  const devredilenIdler = talepler.filter((t) => t.devret).map((t) => t.id);
  assert.deepEqual(ozet.kuyruk.map((k) => k.id), devredilenIdler);
  assert.deepEqual(devredilenIdler, [1, 4, 5]);
  for (const k of ozet.kuyruk) {
    assert.deepEqual(Object.keys(k), ['id', 'kanal', 'konu', 'neden']);
    assert.equal(talepler.find((t) => t.id === k.id).devret, true);
  }
  assert.deepEqual(ozet.kuyruk[0], { id: 1, kanal: 'whatsapp', konu: 'siparis-durumu', neden: 'Sipariş sahipliği doğrulanamadı' });
});

test('kuyrukta ve HTML\'de sipariş/API detayı veya mesaj metni yok', async () => {
  const { ozet } = await gercekOzet();
  const html = K.ozetHtml(ozet);
  for (const metin of [JSON.stringify(ozet.kuyruk), html]) {
    for (const parca of ['GizliUrun', '37767', '1467.88', '1794.85', '689.93', 'userId', 'products', 'quantity']) {
      assert.ok(!metin.includes(parca), `sızıntı: "${parca}"`);
    }
    for (const m of MESAJLAR) assert.ok(!metin.includes(m.mesaj), `mesaj ${m.id} metni özette`);
    assert.doesNotMatch(metin, SAHIPLIK_IFSASI);
  }
});

test('HTML temel bölümleri ve sayıları içerir; JS / harici kaynak yok', async () => {
  const { ozet } = await gercekOzet();
  const html = K.ozetHtml(ozet);
  for (const bolum of ['Müşteri Mesajları — Talep Özeti', 'Temsilci kuyruğu (3)', 'Konu bazında', 'Kanal dağılımı', 'Devir nedenleri']) {
    assert.ok(html.includes(bolum), `bölüm eksik: ${bolum}`);
  }
  assert.match(html, /Toplam mesaj: <strong>15<\/strong>/);
  assert.match(html, /Temsilciye devredilen: <strong>3<\/strong>/);
  assert.match(html, /data-metrik="Sahiplik doğrulanamadı">1</);
  assert.match(html, /data-metrik="Bulunamayan sipariş">1</);
  assert.match(html, /data-metrik="Spam \/ alakasız">1</);
  assert.match(html, /<td>WhatsApp<\/td><td class="sayi">8<\/td>/);
  assert.match(html, /<td>Instagram<\/td><td class="sayi">7<\/td>/);
  assert.match(html, /<td>Sipariş durumu<\/td><td class="sayi">5<\/td>/);
  assert.match(html, /<td class="sayi">#1<\/td><td>WhatsApp<\/td><td>Sipariş durumu<\/td><td>Sipariş sahipliği doğrulanamadı<\/td>/);
  assert.doesNotMatch(html, /<script|<link|@import|https?:\/\//i);
});

test('özet HTML\'i girdi kaynaklı değerleri escape eder', () => {
  const kotu = '<img src=x onerror=alert(1)>';
  const talepler = [{ id: 1, konu: 'diger', devret: true, cevap_taslagi: '', not: '' }];
  const ozet = K.ozetHesapla(talepler, { mesajlar: [{ id: 1, kanal: kotu }], durumlar: new Map([[1, 'islenemedi']]) });
  const html = K.ozetHtml(ozet);
  assert.ok(!html.includes(kotu));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('ek bilgi verilmeden de özet çalışır (geriye uyumluluk)', () => {
  const ozet = K.ozetHesapla([{ id: 1, konu: 'fiyat', devret: true }]);
  assert.equal(ozet.toplam, 1);
  assert.equal(ozet.kuyruk[0].neden, 'Diğer güvenli devir');
  assert.match(K.ozetHtml(ozet), /Temsilciye devredilen: <strong>1<\/strong>/);
});

// --- 9. Ürün arama bonusu (/products/search) ---------------------------------

const FIYAT_FALLBACK = 'Merhaba, güncel fiyat ve kampanya bilgilerini ekibimiz teyit ederek size en kısa sürede iletecektir.';
const URUN_FALLBACK = 'Merhaba, sorunuz için teşekkürler. Ürünle ilgili bilgiyi doğrulanmış kaynaktan teyit ederek ekibimiz size en kısa sürede dönüş yapacaktır.';
const ARAMA = 'https://dummyjson.com/products/search?q=';

// Arama isteklerine `aramaYaniti` döner, cart isteklerine sahteDummyJson gibi davranır; tüm URL'leri kaydeder.
function aramaFetch(aramaYaniti, status = 200) {
  const carts = sahteDummyJson();
  const fn = async (url, init) => {
    fn.cagrilar.push(url);
    if (!url.startsWith(ARAMA)) return carts(url, init);
    if (aramaYaniti instanceof Error) throw aramaYaniti;
    return new Response(typeof aramaYaniti === 'string' ? aramaYaniti : JSON.stringify(aramaYaniti), { status });
  };
  fn.cagrilar = [];
  fn.aramalar = () => fn.cagrilar.filter((u) => u.startsWith(ARAMA));
  return fn;
}
const urunlerYaniti = (...products) => ({ products, total: products.length, skip: 0, limit: products.length });

const UYDURMA_BILGI = /(uygun|kuru cilt|cilt tip|içer|alkol|hayvan|test edil|vegan|paraben|kullanın|sürün|tavsiye|öneri|200 ml)/i;

test('ürün sorgusu yalnızca belirli ürün terimlerinden çıkarılır', () => {
  assert.equal(K.urunSorgusuCikar(mesaj(9).mesaj), 'retinol');
  assert.equal(K.urunSorgusuCikar(mesaj(10).mesaj), 'moisturizer');
  assert.equal(K.urunSorgusuCikar(mesaj(11).mesaj), 'vitamin c');
  assert.equal(K.urunSorgusuCikar(mesaj(13).mesaj), 'toner');
  assert.equal(K.urunSorgusuCikar(mesaj(14).mesaj), null);
  assert.equal(K.urunSorgusuCikar(mesaj(15).mesaj), null);
  assert.equal(K.urunSorgusuCikar('Güneş kreminin fiyatı?'), 'sunscreen');
});

test('ilgililik: başlıkta tüm sorgu kelimeleri + kozmetik kategori gerekir', () => {
  assert.equal(K.urunIlgiliMi({ title: 'Vitamin C Serum', category: 'skin-care' }, 'vitamin c'), true);
  assert.equal(K.urunIlgiliMi({ title: 'Daily Moisturizers', category: 'beauty' }, 'moisturizer'), true);
  assert.equal(K.urunIlgiliMi({ title: 'Vitamin Water', category: 'skin-care' }, 'vitamin c'), false);
  assert.equal(K.urunIlgiliMi({ title: 'Ice Cream', category: 'groceries' }, 'cream'), false);
  assert.equal(K.urunIlgiliMi({ title: 'Toner Cartridge', category: 'office' }, 'toner'), false);
  assert.equal(K.urunIlgiliMi({ title: 'Retinol Serum' }, 'retinol'), false); // kategori yoksa kabul edilmez
});

test('sorgu URL\'si encode edilir', async () => {
  const f = aramaFetch(urunlerYaniti());
  await K.urunAra('vitamin c', { fetchImpl: f });
  await K.urunAra('a&b=c#?', { fetchImpl: f });
  assert.deepEqual(f.aramalar(), [`${ARAMA}vitamin%20c`, `${ARAMA}a%26b%3Dc%23%3F`]);
});

test('fiyat + ilgili ürün: ürün adı ve API fiyatı kullanılır', async () => {
  const f = aramaFetch(urunlerYaniti({ id: 1, title: 'Hydra Moisturizer', category: 'skin-care', price: 19.5 }));
  const t = await K.mesajiIsle(mesaj(10), { fetchImpl: f });
  assert.deepEqual(f.aramalar(), [`${ARAMA}moisturizer`]);
  assert.equal(t.konu, 'fiyat');
  assert.equal(t.devret, false);
  assert.match(t.cevap_taslagi, /Hydra Moisturizer: 19\.50/);
  assert.match(t.not, /sorgu: "moisturizer"/);
  assert.deepEqual(Object.keys(t), ['id', 'konu', 'devret', 'cevap_taslagi', 'not']);
});

test('ilgisiz search sonuçları kullanılmaz, fallback cevap aynen döner', async () => {
  const f = aramaFetch(urunlerYaniti(
    { title: 'Ice Cream', category: 'groceries', price: 5.49 },
    { title: 'Red Lipstick', category: 'beauty', price: 12.99 },
    { title: 'Moisturizer Pump Bottle', category: 'home-decoration', price: 3 },
  ));
  const t = await K.mesajiIsle(mesaj(10), { fetchImpl: f });
  assert.equal(f.aramalar().length, 1);
  assert.equal(t.cevap_taslagi, FIYAT_FALLBACK);
  assert.equal(t.devret, false);
  assert.doesNotMatch(JSON.stringify(t), /Ice Cream|Lipstick|Pump Bottle|5\.49|12\.99/);
});

test('0 sonuç -> fallback', async () => {
  const t = await K.mesajiIsle(mesaj(9), { fetchImpl: aramaFetch(urunlerYaniti()) });
  assert.equal(t.konu, 'urun-sorusu');
  assert.equal(t.cevap_taslagi, URUN_FALLBACK);
  assert.equal(t.devret, false);
  assert.match(t.not, /ilgili sonuç döndürmedi/);
});

const ARAMA_HATALARI = {
  'HTTP 500': () => aramaFetch({ message: 'Internal Server Error' }, 500),
  'bozuk JSON': () => aramaFetch('{"products": [ bozuk'),
  'ağ hatası': () => aramaFetch(new TypeError('fetch failed: ECONNRESET')),
  'beklenmeyen yapı': () => aramaFetch({ items: 'yok' }),
  'products dizi değil': () => aramaFetch({ products: 'x' }),
};
for (const [ad, uret] of Object.entries(ARAMA_HATALARI)) {
  test(`search ${ad} -> fallback, devret=false, teknik detay yok`, async () => {
    for (const [id, beklenen] of [[10, FIYAT_FALLBACK], [13, URUN_FALLBACK]]) {
      const f = uret();
      const t = await K.mesajiIsle(mesaj(id), { fetchImpl: f });
      assert.equal(f.aramalar().length, 1);
      assert.equal(t.cevap_taslagi, beklenen);
      assert.equal(t.devret, false);
      assert.doesNotMatch(t.not, /(fetch failed|ECONN|TypeError|SyntaxError|Internal Server Error|500|bozuk|JSON)/);
    }
  });
}

test('search timeout -> fallback', async () => {
  const asili = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)));
  const t = await K.mesajiIsle(mesaj(10), { fetchImpl: asili, timeoutMs: 50 });
  assert.equal(t.cevap_taslagi, FIYAT_FALLBACK);
  assert.equal(t.devret, false);
});

test('belirli ürün olmayan fiyat (14) ve hayvan testi (15) mesajlarında search çağrılmaz', async () => {
  for (const id of [14, 15]) {
    const f = aramaFetch(urunlerYaniti({ title: 'Retinol Serum', category: 'skin-care', price: 1 }));
    const t = await K.mesajiIsle(mesaj(id), { fetchImpl: f });
    assert.equal(f.cagrilar.length, 0, `mesaj ${id}`);
    assert.equal(t.cevap_taslagi, id === 14 ? FIYAT_FALLBACK : URUN_FALLBACK);
  }
});

test('sipariş mesajı 8 için search çağrılmaz (yalnız cart isteği)', async () => {
  const f = aramaFetch(urunlerYaniti({ title: 'Sunscreen SPF 50', category: 'skin-care', price: 1 }));
  const t = await K.mesajiIsle(mesaj(8), { fetchImpl: f });
  assert.equal(t.konu, 'siparis-durumu');
  assert.deepEqual(f.cagrilar, ['https://dummyjson.com/carts/4']);
  assert.doesNotMatch(t.cevap_taslagi, /Sunscreen/);
});

test('ilgili ürün bulunsa da cilt uygunluğu / içerik / hayvan testi bilgisi uydurulmaz', async () => {
  const durumlar = [
    [9, 'Retinol Night Serum'],
    [11, 'Vitamin C Brightening Serum'],
    [13, 'Rose Water Toner'],
  ];
  for (const [id, baslik] of durumlar) {
    const sorgu = K.urunSorgusuCikar(mesaj(id).mesaj);
    const f = aramaFetch(urunlerYaniti({ title: baslik, category: 'skin-care', price: 9.99, description: 'Suitable for dry skin, alcohol free, cruelty free' }));
    const t = await K.mesajiIsle(mesaj(id), { fetchImpl: f });
    assert.deepEqual(f.aramalar(), [ARAMA + encodeURIComponent(sorgu)]);
    assert.equal(t.konu, 'urun-sorusu');
    assert.equal(t.devret, false);
    assert.ok(t.cevap_taslagi.includes(baslik), `mesaj ${id}: ürün adı cevapta yok`);
    assert.doesNotMatch(t.cevap_taslagi.replace(baslik, ''), UYDURMA_BILGI, `mesaj ${id}`);
    assert.doesNotMatch(t.cevap_taslagi, /dry skin|alcohol|cruelty|9\.99/i, `mesaj ${id}: API açıklaması/fiyat ürün sorusuna taşındı`);
  }
});

test('en fazla 3 ilgili ürün kullanılır; ilgisizler arada elenir', async () => {
  const f = aramaFetch(urunlerYaniti(
    { title: 'Toner A', category: 'skin-care', price: 1 },
    { title: 'Ice Toner Pop', category: 'groceries', price: 2 },
    { title: 'Toner B', category: 'beauty', price: 3 },
    { title: 'Toner C', category: 'skin-care', price: 4 },
    { title: 'Toner D', category: 'skin-care', price: 5 },
  ));
  const t = await K.mesajiIsle(mesaj(13), { fetchImpl: f });
  assert.match(t.cevap_taslagi, /Toner A, Toner B, Toner C\./);
  assert.doesNotMatch(t.cevap_taslagi, /Toner D|Ice Toner/);
});
