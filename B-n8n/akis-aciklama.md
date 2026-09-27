# Bölüm B — Laptop Fiyat Takibi (n8n) — Akış Açıklaması

Dosyalar: [`workflow.json`](workflow.json) (n8n'e import edilebilir) · bu açıklama.
Akış local n8n **2.35.7** üzerinde kuruldu ve gerçek siteye karşı çalıştırıldı (aşağıda sonuçlar).

## 1. Başlangıç şablonu (zorunlu bilgi)

- **Şablon adı:** Competitor price monitoring with web scraping,Google Sheets & Telegram
- **Şablon no:** #4640
- **Link:** https://n8n.io/workflows/4640-competitor-price-monitoring-with-web-scrapinggoogle-sheets-and-telegram/
- Şablon resmi template API'sinden çekildi, local n8n'e `n8n import:workflow` ile **gerçekten import edildi** ve aynı workflow
  (id `QAneGL7LmmVuAy1G`) üzerinde node'lar yeniden adlandırılıp yeniden yapılandırılarak senaryoya uyarlandı — sıfırdan yeni workflow kurulmadı.
- Şablonun orijinal akışı: Google Sheets'teki ürün URL listesini tek tek gezip (her ürün ayrı istek, aralarda Wait)
  fiyatı Sheet'teki son fiyatla karşılaştırıyor, değişince ürün başına Telegram mesajı atıyor. **Şablonda hata dalı yok.**

### Şablondan korunan / değiştirilen / kaldırılanlar

| Şablon node'u | Karar | Final node | Ne yapıldı |
|---|---|---|---|
| Daily 8 AM Trigger | Korundu | **Daily Schedule (08:00)** | Günde 1 kez 08:00; workflow timezone'u `Europe/Istanbul` |
| Load Product Page HTML | Değiştirildi | **Fetch All Laptop Pages** | Tek kategori URL'si + yerleşik pagination; tarayıcı `User-Agent` başlığı fikri korundu; hata çıkışı + retry |
| Extract Current Price from HTML | Değiştirildi | **Extract Products** | Aynı HTML node / CSS selector yaklaşımı; laptop kartlarından 4 alan dizi olarak |
| Normalize Price Values | Değiştirildi | **Normalize & Validate** | `$` temizleyip sayıya çevirme korundu; eşleştirme, doğrulama, mutlak link, tekilleştirme eklendi |
| Compute Price Change | Değiştirildi | **Compare Previous vs Current** | Önceki/güncel fiyat + % fark mantığı korundu; önceki değer Data Table geçmişinden |
| Is Price Changed? | Değiştirildi | **Has New or Price Changed?** | `status` = NEW veya PRICE_CHANGED |
| Build Telegram Alert Message | Değiştirildi | **Build Change Notification** | Ürün başına mesaj yerine tek kısa özet |
| Send Price Alert via Telegram | Korundu | **Send Price Alert via Telegram** | Credential yok → disabled |
| Log Price History to Sheet | Değiştirildi (tip) | **Insert Snapshot** | Google Sheets yerine n8n Data Table insert |
| Fetch Product List from Sheet | Kaldırıldı | — | Ürün listesi yok; kategori sayfaları taranıyor |
| Process Each Product in Batches of 1, Pause Between Requests | Kaldırıldı | — | Pagination tek node'da; bekleme `requestInterval` ile |
| Clean Up Parsed Fields | Kaldırıldı | — | Normalize adımında karşılanıyor |
| Pause Before Updating Sheet, Update Last Price in Master Sheet | Kaldırıldı | — | "Son fiyat" ayrıca tutulmuyor; append-only geçmişten türetiliyor |
| 8 sticky note | Değiştirildi | **Akış Özeti (Sticky Note)** | Tek Türkçe özet notu |
| — | **Eklendi** | Has Valid Products?, Get Previous Snapshot, Build Error Alert, Send Error Alert via Telegram, Stop and Error | Doğrulama, geçmiş okuma ve hata dalı |

## 2. Akış adım adım

```
Daily Schedule (08:00)
→ Fetch All Laptop Pages ──(hata çıkışı)──────────────────────────┐
→ Extract Products                                                │
→ Normalize & Validate                                            │
→ Has Valid Products? ──(false: 0 ürün / doğrulama hatası)────────┤
→ Get Previous Snapshot                                           │
→ Compare Previous vs Current                                     │
   ├→ Insert Snapshot                                             │
   └→ Has New or Price Changed? ─(true)→ Build Change Notification │
                                   → Send Price Alert via Telegram│
                                                                  ▼
                         Build Error Alert → Send Error Alert via Telegram → Stop and Error
```

1. **Daily Schedule (08:00)** — Schedule Trigger, `days` aralığı 1, saat 08:00. Instance'ta `GENERIC_TIMEZONE` tanımlı
   olmadığı için (n8n varsayılanı America/New_York) workflow ayarında `timezone: Europe/Istanbul` açıkça verildi;
   trigger çıktısında `Europe/Istanbul (UTC+03:00)` görüldü.
2. **Fetch All Laptop Pages** — HTTP Request, yerleşik pagination:
   - Query `page = {{ $pageCount + 1 }}`, bitiş: `{{ !String($response.body).includes('rel="next"') }}`
   - En fazla 30 istek, istekler arası 400 ms, timeout 15 sn, yanıt text; her sayfa ayrı item.
   - `onError: continueErrorOutput` (hata çıkışı hata dalına bağlı), `retryOnFail` 2 deneme / 1 sn.
3. **Extract Products** — HTML node, her sayfa için dizi olarak:
   - `product_name`: `div.card.thumbnail a.title` → **`title` attribute** (görünen metin 117 üründen 98'inde `...` ile kısaltılmış)
   - `price_raw`: `span[itemprop="price"]` (ör. `$416.99`)
   - `review_raw`: `span[itemprop="reviewCount"]`
   - `product_href`: `a.title` → `href` (göreli)
   - `item_count_text`: `p.item-count` (sitenin kendi toplamı, "117 items") — çapraz kontrol için
4. **Normalize & Validate** — Code node, 20 sayfayı tek bir current-run yapısında birleştirir:
   - Sayfa bazında dört dizinin uzunluğu eşit değilse hata kaydı (sessizce kabul edilmez).
   - `price`: `$`, virgül ve boşluk temizlenip gerçek **number** (ör. `416.99`, `1149`); geçersizse kayıt reddedilir.
   - `review_count`: **number**; `product_link`: **mutlak URL** (`https://webscraper.io/...`), sorgu/fragment/son `/` temizlenir.
   - `product_key` = normalize edilmiş mutlak ürün linki (ad benzersiz değil: 117 üründe 52 farklı ad; link 117/117 benzersiz).
   - `product_key` ile tekilleştirme; benzersiz ürün sayısı sitedeki "117 items" ile uyuşmazsa hata.
   - Her durumda **tek bir özet item** döner: `run_ts`, `page_count`, `product_count`, `expected_count`, `valid`, `errors`, `products[]`.
5. **Has Valid Products?** — `valid === true` ve `product_count > 0` → normal akış; değilse hata dalı.
6. **Get Previous Snapshot** — Data Table `get` (tüm satırlar). **Always Output Data** açık: tablo boşken de 1 boş item
   döner, böylece ilk çalıştırmada akış durmaz (gerçek execution ile doğrulandı).
7. **Compare Previous vs Current** — Karşılaştırma snapshot yazılmadan **önce** yapılır. Append-only tabloda her
   `product_key` için **en güncel** önceki kayıt (`run_ts`, eşitlikte satır `id`) bulunur:
   - `NEW`: geçmişte kayıt yok (`previous_price: null`)
   - `PRICE_CHANGED`: önceki fiyat ≠ güncel fiyat (kuruş hassasiyetinde karşılaştırma)
   - `NO_CHANGE`: aynı
   - Her ürün çıktısı: `status, product_key, product_name, price, previous_price, price_diff_pct, review_count, product_link, run_ts, previous_run_ts`
8. **Insert Snapshot** — Data Table `insert`, append-only (update/overwrite yok). Bir çalıştırmanın tüm satırları aynı `run_ts`'i paylaşır.
9. **Has New or Price Changed?** → **Build Change Notification** → **Send Price Alert via Telegram** —
   Yalnız NEW/PRICE_CHANGED ürünler true çıkışına gider. Tek özet mesaj: NEW ve PRICE_CHANGED sayıları, her gruptan ilk
   5 ürün, gerisi "… ve N ürün daha" (ilk çalıştırmada 117 satırlık dev mesaj yerine ~12 satır). Ürün adları HTML-escape edilir
   (Telegram varsayılan parse modu HTML). NO_CHANGE-only çalıştırmada bu dala hiç item gitmez.
10. **Hata dalı** — **Build Error Alert** iki kaynağı ayırt eder:
    - Fetch hata çıkışı → `SITE_UNREACHABLE` (DNS/ağ hatasında hata mesajı, HTTP hatasında `HTTP <kod>`; HTML gövde mesaja eklenmez)
    - Has Valid Products? = false → `ZERO_PRODUCTS` ("0 ürün çıkarıldı") veya `VALIDATION_FAILED`
    Mesajda neden, detay, kaynak site, zaman ve execution id bulunur → **Send Error Alert via Telegram** → **Stop and Error**:
    execution **başarısız** olarak biter, akış sessizce "başarılı" bitmez.

## 3. Storage — n8n Data Table

- Tercih: **n8n Data Table** — n8n'e yerleşik, harici hesap/credential gerektirmez, execution'lar arasında kalıcıdır.
- Tablo: `laptop_price_snapshots` (local id `qhlRYllQeTscy8zz`), append-only; her çalıştırmada her ürün için bir satır.

| Kolon | Tip |
|---|---|
| `run_ts` | date |
| `product_key` | string |
| `product_name` | string |
| `price` | number |
| `review_count` | number |
| `product_link` | string |

- **Başka bir n8n instance'ına import ederken:** Data Table workflow ile birlikte taşınmaz. Aynı ad (`laptop_price_snapshots`)
  ve yukarıdaki kolonlarla tablo önceden oluşturulmalıdır. Node'lar tabloyu ID ile değil **adıyla** (`mode: name`) seçer;
  ad farklıysa Get Previous Snapshot ve Insert Snapshot node'larında tablo yeniden seçilmelidir.

## 4. Bildirim

- Kanal: Telegram (şablonun bildirim fikri korundu). Node'lar workflow'da görünür ve bağlıdır; ancak **credential
  kurulmadığı için ikisi de disabled** ve `chatId` yer tutucu (`TELEGRAM_CHAT_ID_BURAYA`). Bu yüzden testlerde
  **Telegram'a canlı mesaj gönderilmedi**; gönderilecek mesaj metinleri execution çıktısında doğrulandı.
- Etkinleştirmek için: Telegram credential'ı seç, `chatId`'yi gir, iki node'u enable et. Disabled node veriyi aynen geçirdiği
  için hata dalında Stop and Error yine çalışır.

## 5. Gerçek çalıştırma sonuçları (local n8n 2.35.7)

| Çalıştırma | Execution | Sonuç | Sayfa / ürün | NEW / PRICE_CHANGED / NO_CHANGE | Tabloya eklenen |
|---|---|---|---|---|---|
| Run 1 (tablo boş) | 35 | success | 20 / 117 | **117 / 0 / 0** | 117 (1 `run_ts`) |
| Run 2 (hemen tekrar) | 36 | success | 20 / 117 | **0 / 0 / 117** | 117 (toplam 234, 2 `run_ts`) |

- Run 1: Get Previous Snapshot boş tabloda 1 boş item üretti, akış devam etti; bildirim metni 117 NEW için kısaltılmış özet olarak üretildi.
- Run 2: "Has New or Price Changed?" true çıkışına **0 item** gitti; Build Change Notification / Send Price Alert çalışmadı.
- Tablodaki `price` ve `review_count` değerleri sayısal (SQLite `real`) olarak saklanıyor.

### Hata dalı testleri (final workflow'a dokunmadan, geçici kopyalarla; kopyalar sonra arşivlendi)

| Test | Yöntem | Execution | Yol | Sonuç |
|---|---|---|---|---|
| A — site açılamıyor (ağ/DNS) | URL host'u `webscraper.invalid` | 41 | Fetch hata çıkışı → Build Error Alert → Send Error Alert → Stop and Error | **error**, `SITE_UNREACHABLE` (ENOTFOUND) |
| A2 — HTTP hata kodu | Gerçek 404 dönen URL | 42 | aynı | **error**, `SITE_UNREACHABLE: HTTP 404` |
| B — 0 ürün | Ürün seçicileri eşleşmeyen class'a çevrildi | 43 | Has Valid Products? false → Build Error Alert → … → Stop and Error | **error**, `ZERO_PRODUCTS` |

Hiçbir hata testinde tabloya satır eklenmedi (234 satır korundu).

### Kontrollü PRICE_CHANGED testi (execution 45)

> **Bu gerçek bir site fiyat değişikliği değildi; kontrollü bir testti.** Sitedeki fiyatlar değiştirilmedi.

- Yalnızca **bir ürünün, workflow'un "önceki" olarak seçeceği en güncel snapshot satırı** geçici olarak değiştirildi:
  - Ürün: **ProBook** — `product_key` `https://webscraper.io/test-sites/e-commerce/static/product/34`
  - Değiştirilen satır: id 121 (Run 2, `run_ts` 2026-09-27 11:10:25.763 UTC) — gerçek fiyat **739.99** → test fiyatı **689.99**
  - Aynı ürünün daha eski satırı (id 4, Run 1, 739.99) bilerek değiştirilmedi.
  - Değişiklik SQLite'a doğrudan değil, n8n'in kendi Data Table **update** node'u ile geçici bir workflow üzerinden yapıldı;
    filtre `id = 121` **ve** `product_key` **ve** `price = 739.99` (yalnız beklenen satır, beklenen durumdaysa güncellenir).
- Final workflow gerçek URL ile çalıştırıldı (execution 45, **success**): 20 sayfa, 117 ürün →
  **0 NEW / 1 PRICE_CHANGED / 116 NO_CHANGE**.
  - Compare çıktısı: `status: PRICE_CHANGED`, `product_name: ProBook`, `previous_price: 689.99`, `price: 739.99`,
    `price_diff_pct: 7.25`, `previous_run_ts: 2026-09-27T11:10:25.763Z`.
  - Eski satır (id 4) hâlâ 739.99 iken 689.99'un seçilmesi, "en güncel önceki kayıt" mantığının doğru çalıştığını da gösterir.
  - "Has New or Price Changed?" true çıkışında yalnız 1 item (ProBook), false çıkışında 116 item.
  - Build Change Notification: "Yeni ürün: 0 · Fiyatı değişen: 1 — • ProBook: $689.99 → $739.99 (+7.25%)". Telegram disabled; mesaj gönderilmedi.
- Test sonrası: elle değiştirilen **id 121 satırı orijinal gerçek fiyatına (739.99) geri getirildi** (aynı yöntemle).
  Workflow'un bu execution sırasında eklediği **gerçek current snapshot** (117 satır, ProBook için id 238 = 739.99)
  **geçmişte bırakıldı** — silinmedi. Sonuç (test anında): tablo 351 satır (3 çalıştırma × 117); hiçbir ürünün farklı fiyatlı satırı ve 689.99 değerli satır kalmadı.
- Test için kullanılan geçici workflow arşivlendi; final workflow bu testte değiştirilmedi (repo'daki `workflow.json` ile birebir aynı).

### Ekran görüntüleri (bonus)

Görüntüler n8n arayüzünden kullanıcı tarafından manuel alındı (n8n oturumu gerektirdiği için; kimlik bilgisi yapay zekâ aracına girilmedi).
İkisi de final workflow'a aittir; credential, token veya başka gizli bilgi içermediği kontrol edildi.

| Dosya | Execution | Ne gösteriyor |
|---|---|---|
| [`screenshots/workflow-success.png`](screenshots/workflow-success.png) | 50 (editörden manuel, success) | Final workflow canvas'ı ve normal başarılı akış: 20 sayfa → 117 ürün → Get Previous Snapshot (702 önceki satır) → Compare → Insert Snapshot (117). "Has New or Price Changed?" false kolunda 117 item, true kolu boş → bildirim dalı çalışmıyor. Çıktı panelinde `status: NO_CHANGE`, `price` = `previous_price`. |
| [`screenshots/price-changed-test.png`](screenshots/price-changed-test.png) | 45 (kontrollü PRICE_CHANGED testi) | Execution listesi + canvas: "Has New or Price Changed?" true kolunda 1 item, Build Change Notification çalışmış. Panelde ProBook için `status: PRICE_CHANGED`, `price: 739.99`, `previous_price: 689.99`, `price_diff_pct: 7.25` ve bildirim mesajı (`new_count: 0`, `price_changed_count: 1`). |

Not: Kullanıcı bu görüntüler için editörden 4 ek çalıştırma yaptı (execution 47–50); hepsi başarılı ve 117 NO_CHANGE.
Bu nedenle tablo şu an 819 satır (7 çalıştırma × 117); hiçbir üründe farklı fiyatlı satır yok. Listede görünen 11:03 UTC
(14:03 yerel) tarihli 53 ms'lik hata, uyarlama öncesi orijinal template'in (Google Sheets credential'ı olmadan) çalıştırılmasıdır.

## 6. Karşılaşılan gerçek sorunlar

1. **Code node sandbox'ında `URL` yok:** İlk Run 1 denemesinde (execution 33) 117 ürünün tamamı geçersiz sayıldı.
   Geçici bir probe workflow ile `ReferenceError: URL is not defined` doğrulandı (`try/catch` hatayı yutup linki `null` yapıyordu).
   Doğrulama katmanı sayesinde yanlış veri yazılmadı, akış hata dalına gitti. Link normalizasyonu string işlemleriyle yeniden yazıldı.
2. **Site "soft-404" döndürüyor:** `…/static/computers/laptops-yok-404` gibi bilinmeyen alt yollar HTTP **200** + ürünsüz sayfa
   döndürüyor; bu yüzden ilk HTTP hata testi hata çıkışına değil 0 ürün kontrolüne düştü (yine başarısız bitti). Gerçek 404 dönen
   bir URL ile tekrar test edildi. Sonuç: yanlış bir kategori URL'si HTTP hatası değil `ZERO_PRODUCTS` olarak raporlanır.
3. **HTTP hata item'ında `message` yok:** 404'te hata item'ı `error.statusCode` + HTML gövde içeriyor; ilk sürümde detay
   "bilinmeyen hata" yazıyordu. Build Error Alert `HTTP <kod>` yazacak şekilde düzeltildi (HTML gövde mesaja eklenmez).
4. **Timezone:** Instance'ta `GENERIC_TIMEZONE` yok; 08:00'in İstanbul saati olması için workflow ayarına `Europe/Istanbul` verildi.
5. DNS hatasında n8n, Stop and Error'ın execution seviyesindeki hata metnini kendi genel mesajıyla ("The connection cannot be
   established…") gösteriyor; ayrıntılı neden Build Error Alert mesajında korunuyor.

## 7. Kapsam dışı (henüz yapılmadı)

- İlk çalıştırmada bildirimi bastırma (baseline): ilk çalıştırmada 117 NEW bildirimi beklenen davranış.
- Kaybolan ürün (REMOVED) tespiti.
- Data Table büyüdükçe tüm satırları okumak yerine yalnız son `run_ts`'i okumak (üretim notu).
