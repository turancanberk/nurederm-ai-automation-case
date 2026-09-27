# Bölüm B — Laptop Fiyat Takibi (n8n) — Akış Açıklaması

> **Durum:** Taslak — teknik doğrulama ve template import aşaması. Final `workflow.json` henüz üretilmedi.
> Bu dosyada yalnızca doğrulanmış bilgiler yer alır; final akış tamamlanınca adım adım açıklama eklenecek.

## Başlangıç şablonu (zorunlu bilgi)

- **Şablon adı:** Competitor price monitoring with web scraping,Google Sheets & Telegram
- **Şablon no:** #4640
- **Link:** https://n8n.io/workflows/4640-competitor-price-monitoring-with-web-scrapinggoogle-sheets-and-telegram/
- **Doğrulama:** Resmi template API'sinden (`api.n8n.io/api/templates/workflows/4640`, HTTP 200) çekildi; canonical sayfa HTTP 200.
- **Import:** Şablon JSON'u local n8n (2.35.7) instance'ına `n8n import:workflow` ile gerçekten import edildi ve
  "Nurederm B — Laptop Fiyat Takibi (başlangıç: template #4640)" adıyla başlangıç noktası olarak kullanılıyor.

### Şablonun orijinal yapısı (24 node = 16 işlevsel + 8 sticky note)

Daily 8 AM Trigger → Fetch Product List from Sheet → Process Each Product in Batches of 1 → Pause Between Requests →
Load Product Page HTML → Extract Current Price from HTML → Normalize Price Values → Compute Price Change →
Clean Up Parsed Fields → Is Price Changed? → (Build Telegram Alert Message → Send Price Alert via Telegram) +
(Log Price History to Sheet → Pause Before Updating Sheet → Update Last Price in Master Sheet)

Şablon, Google Sheets'teki ürün URL listesini tek tek gezip (her ürün sayfası ayrı istek) fiyatı Sheet'teki son fiyatla
karşılaştırıyor ve fiyat değişince Telegram'a bildirim atıyor. **Şablonda hata dalı yok.**

### Şablondan alınan fikir / node'lar ve planlanan değişiklikler

| Şablon node'u | Karar | Bizim akıştaki karşılığı |
|---|---|---|
| Daily 8 AM Trigger | **Korunuyor** | Günlük Schedule tetikleyici (08:00) |
| Load Product Page HTML | **Değişiyor** | Tek kategori URL'si + HTTP Request **pagination** (`?page=N`), text yanıt, tarayıcı `User-Agent` başlığı fikri korunuyor, hata çıkışı ekleniyor |
| Extract Current Price from HTML | **Değişiyor** | HTML node (CSS selector yaklaşımı korunuyor): laptop kartlarından ad, fiyat, yorum sayısı, link |
| Normalize Price Values | **Değişiyor** | `$` temizleyip sayıya çevirme mantığı korunuyor; alanları eşleştirme, doğrulama, `product_key` ve tekilleştirme ekleniyor |
| Compute Price Change | **Değişiyor** | Önceki/şimdiki fiyat ve % fark mantığı korunuyor; karşılaştırma Data Table'daki önceki snapshot ile `product_key` üzerinden, durumlar NEW / PRICE_CHANGED / NO_CHANGE |
| Is Price Changed? | **Değişiyor** | "NEW veya PRICE_CHANGED var mı?" kontrolü |
| Build Telegram Alert Message | **Değişiyor** | Ürün başına mesaj yerine tek özet bildirim mesajı |
| Send Price Alert via Telegram | **Korunuyor** | Bildirim kanalı Telegram (credential/chat id yer tutucu) |
| Fetch Product List from Sheet | **Kaldırılıyor** | Ürün listesi yok; kategori sayfaları taranıyor |
| Process Each Product in Batches of 1 | **Kaldırılıyor** | Pagination tek node'da tüm sayfaları çekiyor |
| Pause Between Requests | **Kaldırılıyor** | Yerine pagination `requestInterval` (istekler arası bekleme) |
| Clean Up Parsed Fields | **Kaldırılıyor** | Normalizasyon adımında karşılanıyor |
| Log Price History to Sheet | **Değişiyor** | Google Sheets yerine n8n Data Table'a tarih damgalı snapshot insert |
| Pause Before Updating Sheet, Update Last Price in Master Sheet | **Kaldırılıyor** | "Son fiyat" ayrı tabloda tutulmuyor; snapshot geçmişinden türetiliyor |
| 8 sticky note | **Değişiyor** | Senaryoya uygun açıklama notlarıyla değiştirilecek |
| — (şablonda yok) | **Ekleniyor** | Hata dalı: site açılamazsa / 0 ürün → hata bildirimi + **Stop and Error** |

## Kaynak site (canlı doğrulandı)

- URL: https://webscraper.io/test-sites/e-commerce/static/computers/laptops — `?page=N` ile sayfalı.
- **20 sayfa, 117 ürün** (1–19. sayfalar 6'şar, 20. sayfa 3 ürün). Sayfada ayrıca `<p class="item-count">117 items</p>` var.
- Son sayfa sinyali: 1–19. sayfalarda `<a class="page-link next" ... rel="next">` var; 20. sayfada "Next" öğesi
  `page-item disabled` ve `rel="next"` yok. 21. sayfa **HTTP 200 + 0 ürün** döndürüyor (404 değil).
- Ürün kartı: `div.card.thumbnail`
  - Ad: `a.title` elemanının **`title` attribute'u** — görünen metin 117 üründen 98'inde `...` ile kısaltılmış.
  - Fiyat: `span[itemprop="price"]` → `$416.99` biçimi; ondalık basamak değişken (`$1149`, `$372.7`), binlik ayırıcı yok.
  - Yorum sayısı: `span[itemprop="reviewCount"]`.
  - Link: `a.title` `href` → göreli (`/test-sites/e-commerce/static/product/31`); mutlak URL'ye çevrilecek.
- Ad benzersiz değil (117 üründe 52 farklı ad); **link benzersiz (117/117)** → `product_key` = normalize edilmiş mutlak ürün linki.

## Planlanan pagination (local n8n 2.35.7'de test edildi)

HTTP Request node'unun yerleşik pagination'ı:
- Mod: *Update a Parameter in Each Request* → query `page = {{ $pageCount + 1 }}`
- Bitiş: *Other* → `{{ !String($response.body).includes('rel="next"') }}` (son sayfada durur, fazladan istek atmaz)
- Güvenlik: *Limit Pages Fetched* (maksimum istek sınırı), istekler arası bekleme (`requestInterval`), timeout
- Yanıt formatı: text

Geçici test workflow'u ile tek execution'da **20 item (sayfa başına 1), toplam 117 ürün kartı** alındı ve 20. sayfada
durduğu doğrulandı. Test workflow'u sonrasında arşivlendi.

## Storage tercihi: n8n Data Table

- Neden: n8n'e yerleşik, harici hesap/credential gerektirmez, execution'lar arasında kalıcıdır, node'dan
  `get` (filtre/sıralama/tümü) ve `insert` yapılabilir; bu case'in "önceki çalışmayla karşılaştır" ihtiyacına yeterli.
- Tablo: `laptop_price_snapshots` (final aşamada oluşturulacak). Her çalıştırmada her ürün için bir satır:

| Kolon | Tip | Açıklama |
|---|---|---|
| `run_ts` | date | Çalıştırmanın zaman damgası (tüm satırlarda aynı) |
| `product_key` | string | Normalize edilmiş mutlak ürün linki |
| `product_name` | string | Tam ürün adı (`title` attribute) |
| `price` | number | `$` temizlenmiş sayısal fiyat |
| `review_count` | number | Yorum sayısı |
| `product_link` | string | Mutlak ürün linki |

- Taşınabilirlik notu: Başka bir n8n instance'ına import edildiğinde aynı ad ve kolonlarla tablo oluşturulmalı;
  node'larda tablo gerekirse yeniden seçilmelidir (Data Table ID instance'a özeldir).

## Değişiklik tespiti (plan)

- Her mevcut ürün, `product_key` üzerinden **en son önceki snapshot** ile karşılaştırılır:
  - `NEW`: önceki çalıştırmada ürün yok
  - `PRICE_CHANGED`: önceki fiyat ≠ güncel fiyat
  - `NO_CHANGE`: aynı
- İlk çalıştırmada önceki snapshot olmadığı için tüm ürünlerin `NEW` sayılması beklenen davranıştır
  (ilk çalıştırmada bildirimi bastırma daha sonra ek özellik olarak değerlendirilecek).
- REMOVED (kaybolan ürün) tespiti bu aşamada kapsam dışı.

## Hata yönetimi (plan)

İki ayrı hata senaryosu, ortak bir hata bildirim dalına bağlanır:
- **A) Site açılamıyor:** HTTP Request node'unun hata çıkışı (ağ hatası / HTTP hata kodu / timeout).
- **B) 0 ürün:** İstek başarılı olsa bile normalize edilen ürün sayısı 0 ise.

Her iki durumda: hata bildirim mesajı hazırlanır → bildirim node'u → **Stop and Error** ile execution **başarısız**
olarak biter; akış sessizce "başarılı" bitmez. Credential kurulumu zorunlu olmadığından bildirim node'ları yer tutucu
credential ile tasarlanacak.
