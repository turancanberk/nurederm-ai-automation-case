'use strict';

// Kullanım: node A-mesaj-otomasyonu/isle.js
// Girdi : <repo>/mesajlar.json (değiştirilmez)
// Çıktı : A-mesaj-otomasyonu/talepler.json, A-mesaj-otomasyonu/ozet.html + terminal özeti

const fs = require('node:fs');
const path = require('node:path');
const { tumunuIsleDetayli, ozetHesapla, ozetHtml } = require('./kurallar');

const GIRDI = path.join(__dirname, '..', 'mesajlar.json');
const TALEPLER = path.join(__dirname, 'talepler.json');
const OZET = path.join(__dirname, 'ozet.html');

function mesajlariOku() {
  const veri = JSON.parse(fs.readFileSync(GIRDI, 'utf8'));
  if (!Array.isArray(veri)) throw new Error('mesajlar.json bir dizi olmalı');
  return veri;
}

async function main() {
  const mesajlar = mesajlariOku();
  const sonuclar = await tumunuIsleDetayli(mesajlar);
  const talepler = sonuclar.map((s) => s.talep);
  // Dahili durumlar yalnızca özet metrikleri içindir; talepler.json'a yazılmaz.
  const durumlar = new Map(sonuclar.map((s) => [s.talep.id, s.durum]));
  const ozet = ozetHesapla(talepler, { mesajlar, durumlar });

  fs.writeFileSync(TALEPLER, JSON.stringify(talepler, null, 2) + '\n');
  fs.writeFileSync(OZET, ozetHtml(ozet));

  console.log('id  konu              devret');
  for (const t of talepler) {
    console.log(`${String(t.id).padEnd(3)} ${t.konu.padEnd(17)} ${t.devret}`);
  }
  console.log('\nÖzet');
  console.log(`  Toplam mesaj          : ${ozet.toplam}`);
  for (const [konu, sayi] of Object.entries(ozet.konuSayilari)) {
    console.log(`  ${konu.padEnd(22)}: ${sayi}`);
  }
  console.log(`  Temsilciye devredilen : ${ozet.devredilenSayisi} (id: ${ozet.devredilenler.join(', ')})`);
  console.log(`  Kanal                 : ${Object.entries(ozet.kanalSayilari).map(([k, n]) => `${k} ${n}`).join(', ')}`);
  console.log(`  Sahiplik doğrulanamadı: ${ozet.sahiplikBasarisiz}`);
  console.log(`  Bulunamayan sipariş   : ${ozet.bulunamayanSiparis}`);
  console.log(`  Spam / alakasız       : ${ozet.spam}`);
  console.log('  Devir nedenleri       :');
  for (const k of ozet.kuyruk) console.log(`    #${k.id} ${k.kanal} ${k.konu} — ${k.neden}`);
  console.log(`\nYazıldı: ${path.relative(process.cwd(), TALEPLER)}, ${path.relative(process.cwd(), OZET)}`);
}

main().catch((hata) => {
  console.error('İşleme başarısız:', hata.message);
  process.exitCode = 1;
});
