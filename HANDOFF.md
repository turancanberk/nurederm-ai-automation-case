# HANDOFF

## Brief'in kritik gereksinimleri

### Bölüm A (zorunlu)
- Her mesaja **tek** konu: `urun-sorusu` · `fiyat` · `siparis-durumu` · `iade-sikayet` · `istenmeyen-etki` · `diger`.
- `iade-sikayet` / `istenmeyen-etki` → `devret: true`; **ürün önerisi veya teşhis içeren cevap yok**, yalnızca temsilciye yönlendirme.
- `siparis-durumu` → sipariş no'yu `GET https://dummyjson.com/carts/{id}` ile çek.
  - `userId != musteri_id` → **hiçbir sipariş bilgisi verme** (ürün, tutar, varlık detayı yok), `devret: true`.
  - Eşleşiyorsa → ürün adları + toplam tutar içeren cevap taslağı.
  - Not found → düzgün hata/uyarı mesajı.
- Çıktılar: `talepler.json` (her mesaj için `{ id, konu, devret, cevap_taslagi, not }`) + konu bazında sayılar ve devir sayısını gösteren tek sayfalık özet (HTML veya terminal).
- Bonus (zorunlu değil): `/products/search?q=...` — uygulandı.

### Bölüm B (zorunlu, `workflow.json` içinde görünür olmalı)
1. Günde 1 kez çalışan Schedule/Cron tetikleyici.
2. `?page=N` ile **tüm sayfaları** gezen adım; ad, fiyat (**sayı**, `$` temizlenmiş), yorum sayısı, ürün linki.
3. **Tarih damgalı** tabloya yazma (Google Sheets / n8n Data Table / CSV — seçim belirtilecek).
4. Önceki çalışmayla karşılaştırma: fiyatı değişen + yeni ürün → **bildirim** (e-posta / Telegram / Slack).
5. Hata dalı: site açılmazsa **veya** 0 ürün gelirse bildirim; akış sessizce "başarılı" bitmez.
- `akis-aciklama.md`: adım adım açıklama · **başlangıç n8n şablonunun ADI + LİNKİ (zorunlu)** · neyin değiştirildiği.
- Canlı çalıştırma / credential gerekmez; ekran görüntüsü bonus.

### Teslim
- Public GitHub repo linki, e-postayı aldıktan sonraki 3 saat içinde `erdincayaritu@gmail.com`'a.
- README: başlama–bitiş saati · nasıl çalıştırılır · ne yapıldı · nerede takılındı · ne bitirilemedi.
- Promptlar silinmeden, sırasıyla, olduğu gibi (başarısızlar dahil).
- `.env` / anahtar / gereksiz dosya commit edilmez; küçük ve sık commitler.

## Mevcut aşama

- Brief analizi ve girdi doğrulaması tamamlandı (`mesajlar.json`: 15 mesaj, tüm alanlar mevcut).
- Proje iskeleti oluşturuldu, Git repo başlatıldı, ilk commit atıldı.
- API ön kontrolü (yalnızca okuma): cart 12 → userId 12 (mesaj 1'de musteri_id 7 → **uyuşmuyor**), cart 5/3/4 → eşleşiyor, cart 9999 → HTTP 404 "not found".
- Not: Python `urllib` varsayılan User-Agent ile DummyJSON JSON olmayan hata döndürdü; açık `User-Agent` başlığı gerekli.

- Bölüm A teknoloji kararı: Node.js 18+, harici npm bağımlılığı yok, yerleşik `fetch`, testler `node:test` + `node:assert`, runtime LLM/AI API yok; konu ataması, güvenlik ve sahiplik doğrulaması deterministik.
- `case-brief.md` teslim artefaktı değil: Git takibinden ve geçmişinden çıkarıldı, `.git/info/exclude` ile yerelde hariç tutuluyor (dosya yerelde duruyor).
- **Bölüm A zorunlu kısmı tamamlandı:** `kurallar.js`, `isle.js`, `test.js`, `dogrula.js`, `talepler.json`, `ozet.html`.
  - `test.js`: 59/59 geçti. `dogrula.js`: tüm kontroller geçti (özet HTML kontrolleri dahil).
  - `/products/search` bonusu: yalnız belirli ürün terimi olan fiyat/ürün mesajlarında; ilgililik (başlık kelimeleri + kozmetik kategori) doğrulanmadan sonuç kullanılmaz. Canlıda 9, 10, 11, 13 için arandı, 0 sonuç → fallback.
  - Sahiplik eşleşmeyen siparişte `not` nötr (başka müşteriye ait olduğu ifşa edilmiyor).
  - `ozet.html` operasyon özeti: KPI kartları, konu/kanal dağılımı, devir nedenleri, temsilci kuyruğu (WhatsApp 8 · Instagram 7; sahiplik doğrulanamadı 1 · bulunamayan 1 · spam 1).
  - Canlı sonuç: devredilen 3 (id 1, 4, 5); dağılım urun-sorusu 4 · fiyat 2 · siparis-durumu 5 · iade-sikayet 1 · istenmeyen-etki 1 · diger 2.
  - Mesaj 1 (cart 12, sahibi başka müşteri) → sipariş verisi sızmadı, devredildi.

- **Bölüm B teknik doğrulama ve template import aşaması tamamlandı:**
  - Template #4640 resmi API'den doğrulandı ve local n8n 2.35.7'ye import edildi (workflow id `QAneGL7LmmVuAy1G`; template'ten gelen `video/production/final` etiketleri final aşamada temizlenecek).
  - Site: 20 sayfa / 117 ürün; ad `a.title[title]`, fiyat `span[itemprop=price]`, yorum `span[itemprop=reviewCount]`, link `a.title[href]`; `product_key` = mutlak link (adlar benzersiz değil).
  - HTTP Request pagination (`page={{ $pageCount + 1 }}`, bitiş: `rel="next"` yok) geçici test workflow'unda 20 sayfa / 117 kart döndürdü; test workflow'u arşivlendi.
  - Taslak: `B-n8n/akis-aciklama.md`.

## Henüz yapılmayanlar

- Bölüm B final `workflow.json` (onay bekleniyor), `akis-aciklama.md`'nin final hali.
- `laptop_price_snapshots` Data Table'ının oluşturulması.
- README Bölüm B + bitiş saati.
- GitHub remote + push (kullanıcı onayı bekleniyor).

## Git durumu

- Branch: `main`, remote yok, push yapılmadı.
- Commitler: `chore: proje iskeletini ve teslim yapısını hazırla` (case-brief.md çıkarılarak amend edildi), `feat: müşteri mesajı otomasyonunu tamamla`, `fix: sipariş sahipliği notunu güvenli hale getir`, `feat: talep özetini operasyon metrikleriyle geliştir`, `feat: ürün arama bonusunu güvenli şekilde ekle`. Bölüm A kapandı; sıradaki: Bölüm B.

## Zorunlular bittikten sonra değerlendirilecek

- ~~A özetinde kanal dağılımı, devir nedenleri, başarısız müşteri doğrulama sayısı, bulunamayan sipariş sayısı, spam sayısı.~~ (yapıldı)
- ~~`/products/search` bonusu.~~ (yapıldı)
- n8n first-run/baseline notification suppression.
- REMOVED ürün tespiti.
- Normal başarılı run ve PRICE_CHANGED run ekran görüntüleri.
- Türkçe n8n açıklama Sticky Note'u.
- README design decisions / production notes.
