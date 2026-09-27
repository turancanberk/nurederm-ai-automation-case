'use strict';

// Bölüm A — deterministik kurallar.
// Runtime'da LLM / AI API kullanılmaz; konu ataması, sipariş no çıkarma ve
// sahiplik doğrulaması tamamen bu dosyadaki kurallarla yapılır.

const KONULAR = ['urun-sorusu', 'fiyat', 'siparis-durumu', 'iade-sikayet', 'istenmeyen-etki', 'diger'];
const HASSAS_KONULAR = new Set(['iade-sikayet', 'istenmeyen-etki']);
// Çoklu niyette öncelik (soldan sağa azalan).
const ONCELIK = ['istenmeyen-etki', 'iade-sikayet', 'siparis-durumu', 'fiyat', 'urun-sorusu'];

const CART_URL = 'https://dummyjson.com/carts/';
const VARSAYILAN_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Metin normalizasyonu
// ---------------------------------------------------------------------------

// Türkçe küçük harfe çevirir ve aksanları kaldırır: "Siparişim" -> "siparisim".
function normalize(metin) {
  if (typeof metin !== 'string') throw new TypeError('mesaj metni string olmalı');
  return metin
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

// ---------------------------------------------------------------------------
// Niyet kalıpları (normalize edilmiş metin üzerinde çalışır)
// ---------------------------------------------------------------------------

const KALIPLAR = {
  'istenmeyen-etki': [
    /\byan(di|ma|mas|iyor|ik|mis|ar)/, /\byak(ti|iyor|mis)/, /yan etki/, /kizar/, /kasin/, /alerj/, /dokuntu/,
    /\bsis(ti|lik|kinlik|mis)/, /tahris/, /reaksiyon/, /irritasyon/, /sivilce (yapti|cikardi|cikti)/,
    /\b(rash|allergic|allergy|itching|itchy|swelling|swollen|irritation|burned|burning|burnt|reaction)\b/,
  ],
  'iade-sikayet': [
    /\biade/, /sikayet/, /\bezik/, /\bkirik/, /hasarl/, /bozuk (geldi|cikti)/, /yanlis urun/,
    /eksik (geldi|urun)/, /geri (gonder|ver|al)/, /memnun (degil|kalmadim)/, /\bdegisim/,
    /\b(refund|return|damaged|broken|complaint|complain)\b/,
  ],
  // Kişisel sipariş referansı (numarasız olabilir). Genel "siparişler ..." soruları eşleşmez.
  'siparis-durumu': [
    /\bsiparis(im|imi|imin|imiz|imizi|imizin|ime)\b/, /\bkargom\b/, /\bpaketim\b/,
    /\bmy order\b/, /\border status\b/,
  ],
  fiyat: [
    /fiyat/, /\bne kadar\b(?!\s*sur)/, /\bkac (tl|lira|para)\b/, /\bucret/, /indirim/, /kampanya/,
    /kupon/, /\b(price|cost|discount)\b/,
  ],
  'urun-sorusu': [
    /\burun/, /serum/, /krem/, /tonik/, /nemlendirici/, /\bmaske/, /sampuan/, /\bruj\b/, /fondoten/,
    /\bspf\b/, /retinol/, /vitamin/, /\bcilt/, /icerig/, /\balkol/, /paraben/, /\bvegan\b/, /hayvan/,
    /\btest edil/, /\bkullanil/, /\buygun/, /\b\d+\s*ml\b/, /\b(product|ingredient|skin)\b/,
  ],
};

const SPAM_KALIPLARI = [
  /takipci/, /\bfollowers?\b/, /bit\.ly|tinyurl|goo\.gl|\bt\.co\//, /\bkasmak\b/,
  /(kazandiniz|hediye kazan|tikla kazan)/,
];

// ---------------------------------------------------------------------------
// Sipariş numarası çıkarma — yalnızca bağlamlı kalıplar
// ---------------------------------------------------------------------------

const NO_EKI = "(?:numarali|nolu|no'lu|no\\.lu|sayili)";
const SIPARIS_NO_KALIPLARI = [
  // "12 numaralı sipariş", "12 nolu siparişim", "12 no'lu order";
  // liste hâli de: "5 numaralı ve 12 numaralı siparişlerim", "5, 7 ve 9 nolu siparişler"
  new RegExp(
    `(?<![\\w%.,\\/#])((?:\\d{1,9}\\s*${NO_EKI}?\\s*(?:,|\\bve\\b|\\bile\\b|\\bveya\\b)\\s*)*\\d{1,9})\\s*${NO_EKI}\\s+(?:siparis|order)`,
    'g',
  ),
  // "sipariş no 12", "siparişimin numarası: 12", "order #3", "order number 3"
  /\b(?:siparis|order)\w*\s*(?:(?:no|numarasi|numaram|numarami|number|nr|id)\b\.?\s*[:#]?\s*|#\s*)(\d{1,9})(?!\d)(?![.,]\d)/g,
];

function siparisNumaralariCikar(metin) {
  const n = normalize(metin);
  const bulunan = new Set();
  for (const kalip of SIPARIS_NO_KALIPLARI) {
    for (const eslesme of n.matchAll(kalip)) {
      for (const parca of eslesme[1].match(/\d{1,9}/g)) {
        const no = Number(parca);
        if (Number.isSafeInteger(no) && no > 0) bulunan.add(no);
      }
    }
  }
  return [...bulunan];
}

// ---------------------------------------------------------------------------
// Konu belirleme
// ---------------------------------------------------------------------------

function dilBelirle(metin) {
  if (/[çğıöşüÇĞİÖŞÜâîû]/.test(metin)) return 'tr';
  const ingilizce = metin.toLowerCase().match(/\b(hi|hello|where|is|my|order|it|has|been|when|please|the|you)\b/g);
  return ingilizce && ingilizce.length >= 2 ? 'en' : 'tr';
}

function konuBelirle(metin) {
  const n = normalize(metin);
  const siparisNolari = siparisNumaralariCikar(metin);
  const eslesen = new Set();
  for (const konu of ONCELIK) {
    if (KALIPLAR[konu].some((k) => k.test(n))) eslesen.add(konu);
  }
  if (siparisNolari.length > 0) eslesen.add('siparis-durumu');
  const spam = SPAM_KALIPLARI.some((k) => k.test(n));

  let konu = 'diger';
  if (eslesen.has('istenmeyen-etki')) konu = 'istenmeyen-etki';
  else if (eslesen.has('iade-sikayet')) konu = 'iade-sikayet';
  else if (!spam) konu = ONCELIK.find((k) => eslesen.has(k)) || 'diger';

  // Fiyat sorusu zaten bir ürüne dairdir; ürün adı geçmesi ayrı bir ikincil niyet sayılmaz.
  const ikincil = ONCELIK.filter((k) => k !== konu && eslesen.has(k))
    .filter((k) => !(k === 'urun-sorusu' && eslesen.has('fiyat')));
  return { konu, ikincil, spam, siparisNolari, dil: dilBelirle(metin) };
}

// ---------------------------------------------------------------------------
// Sipariş API'si — güvenli çağrı
// ---------------------------------------------------------------------------

// Pozitif tam sayı kimlik; sayı veya yalnız rakamlardan oluşan string kabul edilir.
// null / boolean / '' / 'abc' / 1.5 -> null (Number(null) === 0 tuzağına düşmemek için).
function kimlikParse(deger) {
  if (typeof deger === 'number') return Number.isSafeInteger(deger) && deger > 0 ? deger : null;
  if (typeof deger === 'string' && /^\s*\d{1,15}\s*$/.test(deger)) {
    const no = Number(deger);
    return no > 0 ? no : null;
  }
  return null;
}

function cartYapisiGecerliMi(cart, istenenId) {
  if (!cart || typeof cart !== 'object' || Array.isArray(cart)) return false;
  if (kimlikParse(cart.id) !== istenenId) return false;
  if (kimlikParse(cart.userId) === null) return false;
  if (typeof cart.total !== 'number' || !Number.isFinite(cart.total)) return false;
  if (!Array.isArray(cart.products)) return false;
  return cart.products.every(
    (p) => p && typeof p.title === 'string' && p.title.trim() !== '' &&
      (p.quantity === undefined || (Number.isFinite(p.quantity) && p.quantity >= 0)),
  );
}

// Dönüş: { durum: 'ok', cart } | { durum: 'bulunamadi' } | { durum: 'hata', neden }
// `neden` yalnızca kategori içerir (ag / timeout / http / json / yapi); ham gövde asla dönmez.
async function siparisGetir(id, { fetchImpl = globalThis.fetch, timeoutMs = VARSAYILAN_TIMEOUT_MS } = {}) {
  // AbortSignal.timeout() zamanlayıcısı unref'tir; açık bir setTimeout ile timeout her koşulda tetiklenir.
  const kontrol = new AbortController();
  const zamanlayici = setTimeout(() => kontrol.abort(), timeoutMs);
  let yanit;
  let govde;
  try {
    try {
      yanit = await fetchImpl(CART_URL + encodeURIComponent(id), {
        headers: { Accept: 'application/json', 'User-Agent': 'nurederm-case-mesaj-otomasyonu/1.0' },
        signal: kontrol.signal,
      });
    } catch {
      return { durum: 'hata', neden: kontrol.signal.aborted ? 'timeout' : 'ag' };
    }

    if (yanit.status === 404) return { durum: 'bulunamadi' };
    if (!yanit.ok) return { durum: 'hata', neden: 'http' };

    try {
      govde = JSON.parse(await yanit.text());
    } catch {
      return { durum: 'hata', neden: kontrol.signal.aborted ? 'timeout' : 'json' };
    }
  } finally {
    clearTimeout(zamanlayici);
  }

  if (govde && typeof govde.message === 'string' && /not found/i.test(govde.message) && govde.products === undefined) {
    return { durum: 'bulunamadi' };
  }
  if (!cartYapisiGecerliMi(govde, id)) return { durum: 'hata', neden: 'yapi' };
  return { durum: 'ok', cart: govde };
}

// ---------------------------------------------------------------------------
// Cevap şablonları
// ---------------------------------------------------------------------------

const METIN = {
  tr: {
    eslesti: (no, urunler, toplam) =>
      `Merhaba, ${no} numaralı siparişinizde şu ürünler yer alıyor: ${urunler}. Sipariş toplam tutarı: ${toplam}. ` +
      'Kargo ve teslimat durumuyla ilgili ekibimiz size ayrıca bilgi verecektir.',
    eslesmedi:
      'Merhaba, paylaştığınız sipariş numarası hesabınızla doğrulanamadı. Güvenliğiniz için sipariş bilgilerini ' +
      'bu kanaldan paylaşamıyoruz; talebiniz müşteri temsilcimize aktarıldı.',
    bulunamadi: (no) =>
      `Merhaba, ${no} numaralı bir siparişi sistemimizde bulamadık. Sipariş numaranızı kontrol edip tekrar paylaşabilir misiniz?`,
    hata:
      'Merhaba, sipariş bilginizi şu anda kontrol edemiyoruz. Talebiniz müşteri temsilcimize aktarıldı; en kısa sürede dönüş yapılacaktır.',
    cokluNo:
      'Merhaba, mesajınızda birden fazla sipariş numarası yer aldığı için talebiniz müşteri temsilcimize aktarıldı.',
    noYok: 'Merhaba, siparişinizi kontrol edebilmemiz için sipariş numaranızı paylaşabilir misiniz?',
    ikincil: {
      fiyat: ' Fiyat sorunuzla ilgili ekibimiz ayrıca bilgi verecektir.',
      'urun-sorusu': ' Ürün sorunuzla ilgili ekibimiz ayrıca bilgi verecektir.',
    },
  },
  en: {
    eslesti: (no, urunler, toplam) =>
      `Hello, your order #${no} contains: ${urunler}. Order total: ${toplam}. ` +
      'Our team will get back to you separately about shipping and delivery status.',
    eslesmedi:
      'Hello, we could not verify the order number you shared against your account. For your security we cannot share ' +
      'order details on this channel; your request has been forwarded to a customer representative.',
    bulunamadi: (no) =>
      `Hello, we could not find an order #${no} in our system. Could you please double-check your order number?`,
    hata:
      'Hello, we cannot check your order right now. Your request has been forwarded to a customer representative who will get back to you shortly.',
    cokluNo:
      'Hello, your message contains more than one order number, so your request has been forwarded to a customer representative.',
    noYok: 'Hello, could you please share your order number so we can check it for you?',
    ikincil: {
      fiyat: ' Our team will also get back to you about your price question.',
      'urun-sorusu': ' Our team will also get back to you about your product question.',
    },
  },
};

const HASSAS_CEVAP = {
  'istenmeyen-etki':
    'Merhaba, yaşadığınız durum için çok üzgünüz. Talebiniz yetkili müşteri temsilcimize öncelikli olarak aktarıldı; ' +
    'en kısa sürede sizinle iletişime geçilecektir.',
  'iade-sikayet':
    'Merhaba, yaşadığınız sorun için üzgünüz. Talebiniz müşteri temsilcimize aktarıldı; ' +
    'süreçle ilgili en kısa sürede size dönüş yapılacaktır.',
};

function tutarFormatla(total) {
  return total.toFixed(2);
}

function ikincilNot(ikincil) {
  return ikincil.length ? ` İkincil niyet: ${ikincil.join(', ')}.` : '';
}

// ---------------------------------------------------------------------------
// Tek mesaj işleme
// ---------------------------------------------------------------------------

async function siparisMesajiIsle(mesaj, analiz, secenekler) {
  const t = METIN[analiz.dil];
  const ek = analiz.ikincil.map((k) => t.ikincil[k] || '').join('');
  const notEk = ikincilNot(analiz.ikincil);
  const nolar = analiz.siparisNolari;

  if (nolar.length === 0) {
    return { devret: false, cevap_taslagi: t.noYok + ek,
      not: `Mesajda sipariş numarası yok; sipariş API'si sorgulanmadı.${notEk}` };
  }
  if (nolar.length > 1) {
    return { devret: true, cevap_taslagi: t.cokluNo,
      not: `Mesajda birden fazla sipariş numarası var (${nolar.join(', ')}); güvenlik için API sorgulanmadı, temsilci kontrol etmeli.${notEk}` };
  }

  const no = nolar[0];
  const musteriId = kimlikParse(mesaj.musteri_id);
  if (musteriId === null) {
    return { devret: true, cevap_taslagi: t.hata,
      not: `Geçersiz müşteri kimliği; sahiplik doğrulanamadığı için sipariş sorgulanmadı.${notEk}` };
  }

  const sonuc = await siparisGetir(no, secenekler);

  if (sonuc.durum === 'bulunamadi') {
    return { devret: false, cevap_taslagi: t.bulunamadi(no) + ek,
      not: `${no} numaralı sipariş sistemde bulunamadı.${notEk}` };
  }
  if (sonuc.durum === 'hata') {
    return { devret: true, cevap_taslagi: t.hata,
      not: `Sipariş sistemi yanıtı alınamadı veya doğrulanamadı; temsilci manuel kontrol etmeli.${notEk}` };
  }

  // Sahiplik kontrolü: eşleşmezse sipariş verisinin hiçbir parçası çıktıya girmez.
  if (kimlikParse(sonuc.cart.userId) !== musteriId) {
    return { devret: true, cevap_taslagi: t.eslesmedi,
      not: `Sipariş sahipliği doğrulanamadı; sipariş detayı paylaşılmadı, temsilci kimlik doğrulaması yapmalı.${notEk}` };
  }

  const urunler = sonuc.cart.products
    .map((p) => (p.quantity !== undefined ? `${p.title} (x${p.quantity})` : p.title))
    .join(', ');
  return { devret: false, cevap_taslagi: t.eslesti(no, urunler, tutarFormatla(sonuc.cart.total)) + ek,
    not: `Sahiplik doğrulandı. Kargo/teslimat bilgisi API'de yok; cevapta uydurulmadı.${notEk}` };
}

function digerKonuCevabi(analiz) {
  const notEk = ikincilNot(analiz.ikincil);
  switch (analiz.konu) {
    case 'fiyat':
      return { devret: false,
        cevap_taslagi: 'Merhaba, güncel fiyat ve kampanya bilgilerini ekibimiz teyit ederek size en kısa sürede iletecektir.',
        not: `Fiyat sorusu; doğrulanmış fiyat kaynağı entegre değil, fiyat uydurulmadı — temsilci teyit etmeli.${notEk}` };
    case 'urun-sorusu':
      return { devret: false,
        cevap_taslagi: 'Merhaba, sorunuz için teşekkürler. Ürünle ilgili bilgiyi doğrulanmış kaynaktan teyit ederek ekibimiz size en kısa sürede dönüş yapacaktır.',
        not: `Ürün sorusu; doğrulanmış ürün bilgisi kaynağı entegre değil, içerik/uygunluk bilgisi uydurulmadı — temsilci teyit etmeli.${notEk}` };
    default:
      if (analiz.spam) {
        return { devret: false, cevap_taslagi: '',
          not: 'Spam / istenmeyen tanıtım mesajı; cevap üretilmedi, mesajdaki bağlantı açılmamalı.' };
      }
      return { devret: false,
        cevap_taslagi: 'Merhaba, sorunuz için teşekkürler. Ekibimiz size en kısa sürede bilgi verecektir.',
        not: 'Genel soru; belirli bir sipariş numarası yok, sipariş API\'si sorgulanmadı. Bilgi veri kaynağında yok, temsilci yanıtlamalı.' };
  }
}

// Çıktı kaydı her zaman yalnızca bu 5 alanı içerir.
function kayit(id, konu, { devret, cevap_taslagi, not }) {
  return { id, konu, devret: devret === true, cevap_taslagi, not };
}

async function mesajiIsle(mesaj, secenekler = {}) {
  const analiz = konuBelirle(mesaj.mesaj);

  if (HASSAS_KONULAR.has(analiz.konu)) {
    const siparisNotu = analiz.siparisNolari.length ? ' Mesajda sipariş numarası var; sipariş API\'si sorgulanmadı.' : '';
    return kayit(mesaj.id, analiz.konu, {
      devret: true,
      cevap_taslagi: HASSAS_CEVAP[analiz.konu],
      // İkincil niyet bilerek yazılmaz: hassas mesajın tamamı temsilciye gider.
      not: `Hassas konu (${analiz.konu}); otomatik cevapta teşhis, tedavi veya ürün önerisi verilmedi, temsilci ilgilenmeli.${siparisNotu}`,
    });
  }
  if (analiz.konu === 'siparis-durumu') {
    return kayit(mesaj.id, analiz.konu, await siparisMesajiIsle(mesaj, analiz, secenekler));
  }
  return kayit(mesaj.id, analiz.konu, digerKonuCevabi(analiz));
}

// Tek bir mesajdaki beklenmeyen hata tüm işlemeyi durdurmaz; o mesaj güvenli biçimde devredilir.
async function tumunuIsle(mesajlar, secenekler = {}) {
  const talepler = [];
  for (const mesaj of mesajlar) {
    try {
      talepler.push(await mesajiIsle(mesaj, secenekler));
    } catch {
      talepler.push(kayit(mesaj && mesaj.id, 'diger', {
        devret: true, cevap_taslagi: '',
        not: 'Mesaj otomatik işlenemedi; temsilci manuel incelemeli.',
      }));
    }
  }
  return talepler;
}

// ---------------------------------------------------------------------------
// Özet
// ---------------------------------------------------------------------------

function ozetHesapla(talepler) {
  const konuSayilari = Object.fromEntries(KONULAR.map((k) => [k, 0]));
  for (const t of talepler) konuSayilari[t.konu] = (konuSayilari[t.konu] || 0) + 1;
  const devredilenler = talepler.filter((t) => t.devret).map((t) => t.id);
  return { toplam: talepler.length, konuSayilari, devredilenSayisi: devredilenler.length, devredilenler };
}

function escapeHtml(deger) {
  return String(deger)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function ozetHtml(ozet) {
  const satirlar = Object.entries(ozet.konuSayilari)
    .map(([konu, sayi]) => `      <tr><td>${escapeHtml(konu)}</td><td>${escapeHtml(sayi)}</td></tr>`)
    .join('\n');
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Talep Özeti</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; color: #222; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: .4rem .6rem; text-align: left; }
    td:last-child { text-align: right; }
    .kutu { display: inline-block; margin: 0 1rem 1rem 0; padding: .6rem 1rem; border: 1px solid #ccc; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Müşteri Mesajları — Talep Özeti</h1>
  <div class="kutu">Toplam mesaj: <strong>${escapeHtml(ozet.toplam)}</strong></div>
  <div class="kutu">Temsilciye devredilen: <strong>${escapeHtml(ozet.devredilenSayisi)}</strong></div>
  <h2>Konu bazında</h2>
  <table>
    <thead><tr><th>Konu</th><th>Mesaj sayısı</th></tr></thead>
    <tbody>
${satirlar}
    </tbody>
  </table>
  <p>Devredilen mesaj id'leri: ${escapeHtml(ozet.devredilenler.join(', ') || '—')}</p>
</body>
</html>
`;
}

module.exports = {
  KONULAR, HASSAS_KONULAR, ONCELIK,
  normalize, siparisNumaralariCikar, konuBelirle, kimlikParse,
  siparisGetir, mesajiIsle, tumunuIsle,
  ozetHesapla, ozetHtml, escapeHtml,
};
