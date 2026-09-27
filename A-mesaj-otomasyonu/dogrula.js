'use strict';

// Kullanım: node A-mesaj-otomasyonu/dogrula.js   (isle.js'ten sonra)
// talepler.json çıktısını bağımsız olarak doğrular. Sızıntı kontrolü için sahipliği
// eşleşmeyen siparişleri canlı API'den yeniden çeker ve içeriklerinin çıktıda
// geçmediğini kontrol eder. Ham API verisi ekrana yazılmaz.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { KONULAR, HASSAS_KONULAR, siparisNumaralariCikar, siparisGetir, kimlikParse } = require('./kurallar');

// Teslim edilen mesajlar.json'un SHA-256 değeri (girdi değişmemeli).
const MESAJLAR_SHA256 = 'e431d6ea36046f284ffa1dfc44904398423d30faf6a90553684a534b738c553a';
const ALANLAR = ['id', 'konu', 'devret', 'cevap_taslagi', 'not'];

const mesajlarYolu = path.join(__dirname, '..', 'mesajlar.json');
const mesajlarHam = fs.readFileSync(mesajlarYolu);
const mesajlar = JSON.parse(mesajlarHam);
const talepler = JSON.parse(fs.readFileSync(path.join(__dirname, 'talepler.json'), 'utf8'));

const hatalar = [];
const kontrol = (kosul, aciklama) => {
  console.log(`${kosul ? 'OK  ' : 'HATA'} ${aciklama}`);
  if (!kosul) hatalar.push(aciklama);
};

async function main() {
  kontrol(crypto.createHash('sha256').update(mesajlarHam).digest('hex') === MESAJLAR_SHA256, 'mesajlar.json değişmemiş (SHA-256)');
  kontrol(talepler.length === 15 && talepler.length === mesajlar.length, `15 kayıt var (${talepler.length})`);
  kontrol(
    mesajlar.every((m) => talepler.filter((t) => t.id === m.id).length === 1),
    'her mesaj id için tam bir kayıt var',
  );
  kontrol(talepler.every((t) => JSON.stringify(Object.keys(t)) === JSON.stringify(ALANLAR)), 'her kayıtta yalnızca 5 alan var');
  kontrol(talepler.every((t) => KONULAR.includes(t.konu)), 'konu enum dışında değer yok');
  kontrol(talepler.every((t) => typeof t.devret === 'boolean'), 'devret boolean');
  kontrol(talepler.every((t) => typeof t.cevap_taslagi === 'string' && typeof t.not === 'string'), 'cevap_taslagi / not string');
  kontrol(talepler.filter((t) => HASSAS_KONULAR.has(t.konu)).every((t) => t.devret === true), 'hassas konular devredilmiş');
  kontrol(!talepler.some((t) => /userId|"products"|discountedTotal/.test(JSON.stringify(t))), 'iç API alanları çıktıda yok');

  // Canlı sızıntı kontrolü: sahipliği eşleşmeyen her sipariş için içerik çıktıda geçmemeli.
  // Özet HTML'i için ise hiçbir siparişin (eşleşen dahil) içeriği geçmemeli.
  let eslesmeyen = 0;
  let bulunamayan = 0;
  const apiParcalari = [];
  for (const t of talepler.filter((x) => x.konu === 'siparis-durumu')) {
    const m = mesajlar.find((x) => x.id === t.id);
    const nolar = siparisNumaralariCikar(m.mesaj);
    if (nolar.length !== 1) continue;
    const sonuc = await siparisGetir(nolar[0]);
    if (sonuc.durum === 'bulunamadi') bulunamayan++;
    if (sonuc.durum !== 'ok') continue;
    apiParcalari.push(...sonuc.cart.products.map((p) => p.title), sonuc.cart.total.toFixed(2), String(sonuc.cart.total));
    if (kimlikParse(sonuc.cart.userId) === kimlikParse(m.musteri_id)) continue;
    eslesmeyen++;
    const json = JSON.stringify(t);
    const sizanlar = [
      ...sonuc.cart.products.map((p) => p.title),
      sonuc.cart.total.toFixed(2),
      String(sonuc.cart.total),
    ].filter((parca) => json.includes(parca));
    kontrol(t.devret === true, `mesaj ${t.id}: sahipliği eşleşmeyen sipariş devredilmiş`);
    kontrol(sizanlar.length === 0, `mesaj ${t.id}: başka müşterinin sipariş içeriği sızmamış (${sizanlar.length} eşleşme)`);
    kontrol(
      !/(ait değil|başka(sına| bir)? müşteri|farklı (bir )?müşteri|başkasına ait|another customer|belongs to|not yours)/i.test(t.not + ' ' + t.cevap_taslagi),
      `mesaj ${t.id}: not / cevap sahiplik sonucunu ifşa etmiyor (nötr)`,
    );
  }
  console.log(`Bilgi: canlı API'de sahipliği eşleşmeyen sipariş sayısı: ${eslesmeyen}`);

  // ozet.html: sayılar talepler.json + mesajlar.json'dan bağımsız hesapla tutmalı, hassas veri içermemeli.
  const html = fs.readFileSync(path.join(__dirname, 'ozet.html'), 'utf8');
  const devredilen = talepler.filter((t) => t.devret).length;
  const kanal = (k) => mesajlar.filter((m) => m.kanal === k).length;
  kontrol(html.includes(`Toplam mesaj: <strong>${talepler.length}</strong>`), `ozet.html: toplam mesaj ${talepler.length}`);
  kontrol(html.includes(`Temsilciye devredilen: <strong>${devredilen}</strong>`), `ozet.html: devredilen ${devredilen}`);
  kontrol(
    KONULAR.every((k) => html.includes(`<td class="sayi">${talepler.filter((t) => t.konu === k).length}</td>`)) &&
      (html.match(/<td class="pay">/g) || []).length === KONULAR.length + 2,
    'ozet.html: konu ve kanal satırları mevcut',
  );
  kontrol(
    html.includes(`<td>WhatsApp</td><td class="sayi">${kanal('whatsapp')}</td>`) &&
      html.includes(`<td>Instagram</td><td class="sayi">${kanal('instagram')}</td>`),
    `ozet.html: kanal dağılımı (WhatsApp ${kanal('whatsapp')}, Instagram ${kanal('instagram')})`,
  );
  kontrol(html.includes(`data-metrik="Sahiplik doğrulanamadı">${eslesmeyen}<`), `ozet.html: sahiplik doğrulanamadı ${eslesmeyen}`);
  kontrol(html.includes(`data-metrik="Bulunamayan sipariş">${bulunamayan}<`), `ozet.html: bulunamayan sipariş ${bulunamayan}`);
  kontrol((html.match(/<td class="sayi">#\d+<\/td>/g) || []).length === devredilen, `ozet.html: kuyrukta ${devredilen} kayıt`);
  const htmlSizanlar = apiParcalari.filter((p) => html.includes(p));
  kontrol(htmlSizanlar.length === 0, `ozet.html: canlı API sipariş içeriği yok (${apiParcalari.length} parça tarandı)`);
  kontrol(!mesajlar.some((m) => html.includes(m.mesaj)), 'ozet.html: müşteri mesaj metni yok');
  kontrol(!/userId|products|quantity|<script|https?:\/\//i.test(html), 'ozet.html: API alan adı / script / harici kaynak yok');

  console.log(hatalar.length ? `\n${hatalar.length} kontrol BAŞARISIZ` : '\nTüm kontroller geçti');
  process.exitCode = hatalar.length ? 1 : 0;
}

main();
