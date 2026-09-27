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
    return { durum: 'siparis-no-yok', devret: false, cevap_taslagi: t.noYok + ek,
      not: `Mesajda sipariş numarası yok; sipariş API'si sorgulanmadı.${notEk}` };
  }
  if (nolar.length > 1) {
    return { durum: 'coklu-siparis-no', devret: true, cevap_taslagi: t.cokluNo,
      not: `Mesajda birden fazla sipariş numarası var (${nolar.join(', ')}); güvenlik için API sorgulanmadı, temsilci kontrol etmeli.${notEk}` };
  }

  const no = nolar[0];
  const musteriId = kimlikParse(mesaj.musteri_id);
  if (musteriId === null) {
    return { durum: 'gecersiz-musteri', devret: true, cevap_taslagi: t.hata,
      not: `Geçersiz müşteri kimliği; sahiplik doğrulanamadığı için sipariş sorgulanmadı.${notEk}` };
  }

  const sonuc = await siparisGetir(no, secenekler);

  if (sonuc.durum === 'bulunamadi') {
    return { durum: 'siparis-bulunamadi', devret: false, cevap_taslagi: t.bulunamadi(no) + ek,
      not: `${no} numaralı sipariş sistemde bulunamadı.${notEk}` };
  }
  if (sonuc.durum === 'hata') {
    return { durum: 'api-hatasi', devret: true, cevap_taslagi: t.hata,
      not: `Sipariş sistemi yanıtı alınamadı veya doğrulanamadı; temsilci manuel kontrol etmeli.${notEk}` };
  }

  // Sahiplik kontrolü: eşleşmezse sipariş verisinin hiçbir parçası çıktıya girmez.
  if (kimlikParse(sonuc.cart.userId) !== musteriId) {
    return { durum: 'sahiplik-dogrulanamadi', devret: true, cevap_taslagi: t.eslesmedi,
      not: `Sipariş sahipliği doğrulanamadı; sipariş detayı paylaşılmadı, temsilci kimlik doğrulaması yapmalı.${notEk}` };
  }

  const urunler = sonuc.cart.products
    .map((p) => (p.quantity !== undefined ? `${p.title} (x${p.quantity})` : p.title))
    .join(', ');
  return { durum: 'siparis-dogrulandi', devret: false, cevap_taslagi: t.eslesti(no, urunler, tutarFormatla(sonuc.cart.total)) + ek,
    not: `Sahiplik doğrulandı. Kargo/teslimat bilgisi API'de yok; cevapta uydurulmadı.${notEk}` };
}

function digerKonuCevabi(analiz) {
  const notEk = ikincilNot(analiz.ikincil);
  switch (analiz.konu) {
    case 'fiyat':
      return { durum: 'fiyat', devret: false,
        cevap_taslagi: 'Merhaba, güncel fiyat ve kampanya bilgilerini ekibimiz teyit ederek size en kısa sürede iletecektir.',
        not: `Fiyat sorusu; doğrulanmış fiyat kaynağı entegre değil, fiyat uydurulmadı — temsilci teyit etmeli.${notEk}` };
    case 'urun-sorusu':
      return { durum: 'urun-sorusu', devret: false,
        cevap_taslagi: 'Merhaba, sorunuz için teşekkürler. Ürünle ilgili bilgiyi doğrulanmış kaynaktan teyit ederek ekibimiz size en kısa sürede dönüş yapacaktır.',
        not: `Ürün sorusu; doğrulanmış ürün bilgisi kaynağı entegre değil, içerik/uygunluk bilgisi uydurulmadı — temsilci teyit etmeli.${notEk}` };
    default:
      if (analiz.spam) {
        return { durum: 'spam', devret: false, cevap_taslagi: '',
          not: 'Spam / istenmeyen tanıtım mesajı; cevap üretilmedi, mesajdaki bağlantı açılmamalı.' };
      }
      return { durum: 'genel', devret: false,
        cevap_taslagi: 'Merhaba, sorunuz için teşekkürler. Ekibimiz size en kısa sürede bilgi verecektir.',
        not: 'Genel soru; belirli bir sipariş numarası yok, sipariş API\'si sorgulanmadı. Bilgi veri kaynağında yok, temsilci yanıtlamalı.' };
  }
}

// Çıktı kaydı her zaman yalnızca bu 5 alanı içerir.
function kayit(id, konu, { devret, cevap_taslagi, not }) {
  return { id, konu, devret: devret === true, cevap_taslagi, not };
}

// Dönüş: { talep, durum }. `talep` yalnızca 5 çıktı alanını içerir; `durum` işleme sırasında
// bilinen dahili sonuç kodudur (özet metrikleri için) ve talepler.json'a yazılmaz.
async function mesajiIsleDetayli(mesaj, secenekler = {}) {
  const analiz = konuBelirle(mesaj.mesaj);
  let sonuc;

  if (HASSAS_KONULAR.has(analiz.konu)) {
    const siparisNotu = analiz.siparisNolari.length ? ' Mesajda sipariş numarası var; sipariş API\'si sorgulanmadı.' : '';
    sonuc = {
      durum: analiz.konu,
      devret: true,
      cevap_taslagi: HASSAS_CEVAP[analiz.konu],
      // İkincil niyet bilerek yazılmaz: hassas mesajın tamamı temsilciye gider.
      not: `Hassas konu (${analiz.konu}); otomatik cevapta teşhis, tedavi veya ürün önerisi verilmedi, temsilci ilgilenmeli.${siparisNotu}`,
    };
  } else if (analiz.konu === 'siparis-durumu') {
    sonuc = await siparisMesajiIsle(mesaj, analiz, secenekler);
  } else {
    sonuc = digerKonuCevabi(analiz);
  }
  return { talep: kayit(mesaj.id, analiz.konu, sonuc), durum: sonuc.durum };
}

async function mesajiIsle(mesaj, secenekler = {}) {
  return (await mesajiIsleDetayli(mesaj, secenekler)).talep;
}

// Tek bir mesajdaki beklenmeyen hata tüm işlemeyi durdurmaz; o mesaj güvenli biçimde devredilir.
async function tumunuIsleDetayli(mesajlar, secenekler = {}) {
  const sonuclar = [];
  for (const mesaj of mesajlar) {
    try {
      sonuclar.push(await mesajiIsleDetayli(mesaj, secenekler));
    } catch {
      sonuclar.push({
        talep: kayit(mesaj && mesaj.id, 'diger', {
          devret: true, cevap_taslagi: '',
          not: 'Mesaj otomatik işlenemedi; temsilci manuel incelemeli.',
        }),
        durum: 'islenemedi',
      });
    }
  }
  return sonuclar;
}

async function tumunuIsle(mesajlar, secenekler = {}) {
  return (await tumunuIsleDetayli(mesajlar, secenekler)).map((s) => s.talep);
}

// ---------------------------------------------------------------------------
// Özet
// ---------------------------------------------------------------------------

const KONU_ETIKETLERI = {
  'urun-sorusu': 'Ürün sorusu', fiyat: 'Fiyat', 'siparis-durumu': 'Sipariş durumu',
  'iade-sikayet': 'İade / şikâyet', 'istenmeyen-etki': 'İstenmeyen etki', diger: 'Diğer',
};
const KANAL_ETIKETLERI = { whatsapp: 'WhatsApp', instagram: 'Instagram' };
// Devredilen kayıtlar için dahili durum -> kısa devir nedeni.
const DEVIR_NEDENLERI = {
  'sahiplik-dogrulanamadi': 'Sipariş sahipliği doğrulanamadı',
  'istenmeyen-etki': 'İstenmeyen etki bildirimi',
  'iade-sikayet': 'İade / şikâyet',
  'api-hatasi': 'Sipariş sistemi yanıtı alınamadı',
  'coklu-siparis-no': 'Birden fazla sipariş numarası',
  'gecersiz-musteri': 'Müşteri kimliği geçersiz',
  islenemedi: 'Mesaj otomatik işlenemedi',
};

// ek.mesajlar: kanal bilgisi için mesajlar.json (id ile eşleştirilir).
// ek.durumlar: Map(id -> dahili durum), tumunuIsleDetayli çıktısından.
function ozetHesapla(talepler, { mesajlar = [], durumlar = new Map() } = {}) {
  const kanalById = new Map(mesajlar.map((m) => [m.id, m.kanal]));
  const durumSay = (d) => talepler.filter((t) => durumlar.get(t.id) === d).length;

  const konuSayilari = Object.fromEntries(KONULAR.map((k) => [k, 0]));
  for (const t of talepler) konuSayilari[t.konu] = (konuSayilari[t.konu] || 0) + 1;

  const kanalSayilari = { whatsapp: 0, instagram: 0 };
  for (const t of talepler) {
    const kanal = kanalById.get(t.id) || 'bilinmiyor';
    kanalSayilari[kanal] = (kanalSayilari[kanal] || 0) + 1;
  }

  const kuyruk = talepler.filter((t) => t.devret).map((t) => ({
    id: t.id,
    kanal: kanalById.get(t.id) || 'bilinmiyor',
    konu: t.konu,
    neden: DEVIR_NEDENLERI[durumlar.get(t.id)] || 'Diğer güvenli devir',
  }));
  const devirNedenleri = {};
  for (const k of kuyruk) devirNedenleri[k.neden] = (devirNedenleri[k.neden] || 0) + 1;

  return {
    toplam: talepler.length,
    konuSayilari,
    devredilenSayisi: kuyruk.length,
    devredilenler: kuyruk.map((k) => k.id),
    kanalSayilari,
    devirNedenleri,
    sahiplikBasarisiz: durumSay('sahiplik-dogrulanamadi'),
    bulunamayanSiparis: durumSay('siparis-bulunamadi'),
    spam: durumSay('spam'),
    kuyruk,
  };
}

function escapeHtml(deger) {
  return String(deger)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function yuzde(sayi, toplam) {
  return toplam ? Math.round((sayi * 100) / toplam) : 0;
}

// Dağılım tablosu satırları: etiket, sayı, pay (%) ve sade CSS çubuğu.
function dagilimSatirlari(sayilar, toplam, etiket) {
  return Object.entries(sayilar)
    .map(([anahtar, sayi]) => {
      const pay = yuzde(sayi, toplam);
      return `          <tr><td>${escapeHtml(etiket(anahtar))}</td><td class="sayi">${escapeHtml(sayi)}</td>` +
        `<td class="pay"><span class="cubuk"><span style="width:${pay}%"></span></span>${pay}%</td></tr>`;
    })
    .join('\n');
}

function ozetHtml(ozet) {
  const kanalEtiketi = (k) => KANAL_ETIKETLERI[k] || k;
  const konuEtiketi = (k) => KONU_ETIKETLERI[k] || k;
  const kpi = (ad, deger, aciklama, sinif = '') =>
    `    <div class="kpi ${sinif}"><div class="kpi-ad">${escapeHtml(ad)}</div>` +
    `<div class="kpi-deger" data-metrik="${escapeHtml(ad)}">${escapeHtml(deger)}</div>` +
    `<div class="kpi-not">${escapeHtml(aciklama)}</div></div>`;

  const devirSatirlari = Object.entries(ozet.devirNedenleri)
    .sort((a, b) => b[1] - a[1])
    .map(([neden, sayi]) => `            <tr><td>${escapeHtml(neden)}</td><td class="sayi">${escapeHtml(sayi)}</td></tr>`)
    .join('\n') || '            <tr><td colspan="2" class="bos">Devredilen mesaj yok</td></tr>';

  const kuyrukSatirlari = ozet.kuyruk
    .map((k) => `        <tr><td class="sayi">#${escapeHtml(k.id)}</td><td>${escapeHtml(kanalEtiketi(k.kanal))}</td>` +
      `<td>${escapeHtml(konuEtiketi(k.konu))}</td><td>${escapeHtml(k.neden)}</td></tr>`)
    .join('\n') || '        <tr><td colspan="4" class="bos">Kuyruk boş</td></tr>';

  const kpiler = [
    kpi('Toplam mesaj', ozet.toplam, 'İşlenen mesaj'),
    kpi('Temsilciye devredilen', ozet.devredilenSayisi, 'devret = true', 'uyari'),
    kpi('Sahiplik doğrulanamadı', ozet.sahiplikBasarisiz, 'Sipariş detayı paylaşılmadı', 'risk'),
    kpi('Bulunamayan sipariş', ozet.bulunamayanSiparis, 'Müşteriden no kontrolü istendi'),
    kpi('Spam / alakasız', ozet.spam, 'Cevap üretilmedi'),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Talep Özeti</title>
  <style>
    :root { --zemin: #f5f6f8; --kart: #fff; --metin: #1d2330; --soluk: #5d6675; --cizgi: #e2e5ea;
            --vurgu: #2f5bd3; --uyari: #b45309; --uyari-zemin: #fff7ed; --risk: #b42318; }
    @media (prefers-color-scheme: dark) {
      :root { --zemin: #14171d; --kart: #1c2029; --metin: #e6e8ec; --soluk: #9aa3b2; --cizgi: #2c313c;
              --vurgu: #7c9cf0; --uyari: #f5a524; --uyari-zemin: #2a2213; --risk: #f97066; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--zemin); color: var(--metin);
           font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    main { max-width: 1040px; margin: 0 auto; padding: 32px 16px 48px; }
    header h1 { margin: 0 0 4px; font-size: 1.6rem; }
    header p { margin: 0 0 4px; color: var(--soluk); }
    header .ozet { color: var(--metin); }
    .kpiler { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin: 24px 0; }
    .kpi { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 10px; padding: 14px 16px; }
    .kpi-ad { color: var(--soluk); font-size: .85rem; }
    .kpi-deger { font-size: 2rem; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.2; }
    .kpi-not { color: var(--soluk); font-size: .8rem; }
    .kpi.uyari { background: var(--uyari-zemin); border-color: var(--uyari); }
    .kpi.uyari .kpi-deger { color: var(--uyari); }
    .kpi.risk .kpi-deger { color: var(--risk); }
    .izgara { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; align-items: start; }
    section { background: var(--kart); border: 1px solid var(--cizgi); border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    section h2 { margin: 0 0 10px; font-size: 1.05rem; }
    section.kuyruk { border-color: var(--uyari); }
    .tablo { overflow-x: auto; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 8px 10px; border-bottom: 1px solid var(--cizgi); text-align: left; vertical-align: middle; }
    th { color: var(--soluk); font-weight: 600; font-size: .8rem; text-transform: uppercase; letter-spacing: .03em; }
    tr:last-child td { border-bottom: 0; }
    .sayi { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .pay { white-space: nowrap; color: var(--soluk); font-variant-numeric: tabular-nums; width: 1%; }
    .cubuk { display: inline-block; width: 80px; height: 6px; margin-right: 8px; vertical-align: middle;
             background: var(--cizgi); border-radius: 3px; overflow: hidden; }
    .cubuk span { display: block; height: 100%; background: var(--vurgu); }
    .bos { color: var(--soluk); text-align: center; }
    footer { color: var(--soluk); font-size: .8rem; }
  </style>
</head>
<body>
<main>
  <header>
    <h1>Müşteri Mesajları — Talep Özeti</h1>
    <p>WhatsApp ve Instagram mesajlarının otomatik ön işleme sonucu. Hassas konular ve doğrulanamayan siparişler temsilci kuyruğundadır.</p>
    <p class="ozet">Toplam mesaj: <strong>${escapeHtml(ozet.toplam)}</strong> · Temsilciye devredilen: <strong>${escapeHtml(ozet.devredilenSayisi)}</strong></p>
  </header>

  <div class="kpiler">
${kpiler}
  </div>

  <section class="kuyruk">
    <h2>Temsilci kuyruğu (${escapeHtml(ozet.devredilenSayisi)})</h2>
    <div class="tablo"><table>
      <thead><tr><th class="sayi">Mesaj</th><th>Kanal</th><th>Konu</th><th>Devir nedeni</th></tr></thead>
      <tbody>
${kuyrukSatirlari}
      </tbody>
    </table></div>
  </section>

  <div class="izgara">
    <section>
      <h2>Konu bazında</h2>
      <div class="tablo"><table>
        <thead><tr><th>Konu</th><th class="sayi">Mesaj sayısı</th><th>Pay</th></tr></thead>
        <tbody>
${dagilimSatirlari(ozet.konuSayilari, ozet.toplam, konuEtiketi)}
        </tbody>
      </table></div>
    </section>

    <div>
      <section>
        <h2>Kanal dağılımı</h2>
        <div class="tablo"><table>
          <thead><tr><th>Kanal</th><th class="sayi">Mesaj</th><th>Pay</th></tr></thead>
          <tbody>
${dagilimSatirlari(ozet.kanalSayilari, ozet.toplam, kanalEtiketi)}
          </tbody>
        </table></div>
      </section>

      <section>
        <h2>Devir nedenleri</h2>
        <div class="tablo"><table>
          <thead><tr><th>Neden</th><th class="sayi">Mesaj</th></tr></thead>
          <tbody>
${devirSatirlari}
          </tbody>
        </table></div>
      </section>
    </div>
  </div>

  <footer>Müşteri mesaj metinleri ve sipariş/API detayları bu sayfada gösterilmez; ayrıntılar talepler.json içindedir.</footer>
</main>
</body>
</html>
`;
}

module.exports = {
  KONULAR, HASSAS_KONULAR, ONCELIK,
  normalize, siparisNumaralariCikar, konuBelirle, kimlikParse,
  siparisGetir, mesajiIsle, mesajiIsleDetayli, tumunuIsle, tumunuIsleDetayli,
  ozetHesapla, ozetHtml, escapeHtml,
};
