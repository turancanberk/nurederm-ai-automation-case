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
- Bonus (zorunlu değil): `/products/search?q=...`.

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

## Henüz yapılmayanlar

- Bölüm A kodu, `talepler.json`, özet sayfası, testler.
- Bölüm B `workflow.json`, `akis-aciklama.md`, şablon seçimi.
- README'nin doldurulması, bitiş saati.
- GitHub remote + push (kullanıcı onayı bekleniyor).

## Git durumu

- Branch: `main`, remote yok, push yapılmadı.
- Commit: `chore: proje iskeletini ve teslim yapısını hazırla`.

## Zorunlular bittikten sonra değerlendirilecek

- A özetinde kanal dağılımı, devir nedenleri, başarısız müşteri doğrulama sayısı, bulunamayan sipariş sayısı, spam sayısı.
- `/products/search` bonusu.
- n8n first-run/baseline notification suppression.
- REMOVED ürün tespiti.
- Normal başarılı run ve PRICE_CHANGED run ekran görüntüleri.
- Türkçe n8n açıklama Sticky Note'u.
- README design decisions / production notes.
