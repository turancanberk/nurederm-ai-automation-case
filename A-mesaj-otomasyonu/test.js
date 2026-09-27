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
