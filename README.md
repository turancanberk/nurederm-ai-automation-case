# Nurederm Case — AI Otomasyon / Entegrasyon

## Projenin amacı

İki bölümlü uygulama görevi:

- **Bölüm A:** WhatsApp / Instagram müşteri mesajlarını (`mesajlar.json`) konulara ayıran, hassas konuları insana devreden, sipariş durumunu DummyJSON `/carts/{id}` üzerinden sahiplik kontrolüyle sorgulayan ve temsilciye iş listesi (`talepler.json`) + tek sayfalık özet üreten küçük bir araç.
- **Bölüm B:** `webscraper.io` test sitesindeki laptopların fiyatlarını günlük takip eden bir n8n workflow tasarımı (`workflow.json` + `akis-aciklama.md`).

Girdi dosyası `mesajlar.json` değiştirilmeden kullanılır.

## Başlangıç zamanı

- **Başlangıç:** 2026-09-27 13:00 (+03) — resmi case başlangıcı.
- **Bitiş:** _(final aşamasında gerçek bitiş saatiyle doldurulacak)_

## Bölüm A

Node.js (harici npm paketi yok, runtime'da LLM/AI API yok). Tüm kararlar deterministik kurallarla verilir.

| Dosya | Görev |
|---|---|
| `A-mesaj-otomasyonu/kurallar.js` | Sınıflandırma, sipariş no çıkarma, güvenli API çağrısı, cevap şablonları, özet/HTML |
| `A-mesaj-otomasyonu/isle.js` | `mesajlar.json` → `talepler.json` + `ozet.html` + terminal özeti |
| `A-mesaj-otomasyonu/test.js` | `node:test` birim testleri (sahte fetch; gerçek API'ye gitmez) |
| `A-mesaj-otomasyonu/dogrula.js` | Üretilen `talepler.json` için bağımsız çıktı doğrulaması (canlı sızıntı kontrolü dahil) |
| `A-mesaj-otomasyonu/talepler.json` | Çıktı: her mesaj için `{ id, konu, devret, cevap_taslagi, not }` |
| `A-mesaj-otomasyonu/ozet.html` | Çıktı: tek sayfalık operasyon özeti (aşağıya bakın) |

**Kurallar**
- **Konu önceliği (çoklu niyet):** `istenmeyen-etki` > `iade-sikayet` > `siparis-durumu` > `fiyat` > `urun-sorusu` > `diger`. İkincil niyet `not` alanına yazılır. Spam mesajlar (ör. takipçi/kısaltılmış link) `diger` olur ve cevap üretilmez.
- **Sipariş no:** Yalnızca bağlamlı kalıplar (`12 numaralı sipariş`, `sipariş no 12`, `order #3`, liste hâli). `200 ml`, `%100`, URL gibi sayılar sipariş no sayılmaz. Birden fazla farklı no → API çağrılmaz, devredilir. No yoksa API çağrılmaz, müşteriden no istenir.
- **Hassas konular** (`iade-sikayet`, `istenmeyen-etki`): `devret: true`, sabit ve güvenli cevap; teşhis, tedavi, ürün önerisi yok. Mesajda sipariş no olsa bile API çağrılmaz.
- **Sipariş güvenliği:** `userId` ve `musteri_id` pozitif tam sayıya çevrilip karşılaştırılır (`"5"` = `5`; `null`/`"abc"`/`0` geçersiz). Eşleşmezse sipariş verisinin hiçbir parçası çıktıya girmez, `devret: true`. Eşleşirse ürün adları, miktarlar ve toplam yazılır; kargo/teslim bilgisi API'de olmadığı için uydurulmaz.
- **API hataları:** 404 / "not found" → anlaşılır müşteri mesajı, `devret: false`. Ağ hatası, timeout (8 sn), 5xx, bozuk JSON, beklenmeyen yapı veya yanlış cart id → `devret: true`, teknik detay çıktıya yazılmaz. Tek mesajdaki beklenmeyen hata diğer mesajların işlenmesini durdurmaz.
- **Fiyat / ürün soruları:** Fiyat, içerik, cilt uygunluğu vb. bilgi uydurulmaz; temsilci teyidine yönlendirilir.
- **Bonus — `/products/search` (uygulandı):** Yalnızca `fiyat` / `urun-sorusu` mesajlarında ve mesajda belirli bir ürün terimi varsa çağrılır. Mesajın tamamı gönderilmez; küçük bir eşlemeyle kısa sorgu üretilir (nemlendirici→moisturizer, tonik→toner, güneş kremi→sunscreen, c vitamini→vitamin c, retinol→retinol) ve URL-encode edilir. Sonuçlar ancak başlık sorgunun tüm kelimelerini içeriyor **ve** kategori kozmetikse (beauty / skin-care / fragrances) kullanılır (en fazla 3). Fiyat mesajında ürün adı + API fiyatı yazılır; ürün sorusunda yalnızca ürün adı — içerik, cilt uygunluğu, kullanım, hayvan testi bilgisi yazılmaz. Sonuç yok / ilgisiz / arama hatası (ağ, timeout, 5xx, bozuk JSON, beklenmeyen yapı) → mevcut fallback cevabı aynen kullanılır, `devret` değişmez, teknik detay yazılmaz.
  - Canlı sonuç: mesaj 9 (`retinol`), 10 (`moisturizer`), 11 (`vitamin c`), 13 (`toner`) için arama yapıldı; DummyJSON dördünde de **0 sonuç** döndü → fallback. Mesaj 14 (belirli ürün yok), 15 (hayvan testi, belirli ürün yok) ve 8 (birincil konu sipariş) için arama yapılmadı. Ön kontrolde `cream` sorgusunun "Ice Cream [groceries]" ve "Red Lipstick" döndürdüğü görüldü; ilgililik filtresi bu tür sonuçları eler.
- İngilizce mesajlarda sipariş cevabı İngilizce şablonla yazılır.

**Özet sayfası (`ozet.html`)** — JS/harici bağımlılık olmayan, responsive tek HTML:
- **Brief zorunluları:** toplam mesaj, konu bazında sayılar (pay %), temsilciye devredilen sayısı.
- **Kanal dağılımı:** WhatsApp / Instagram.
- **Devir nedenleri:** sahiplik doğrulanamadı, istenmeyen etki, iade/şikâyet (ve varsa API hatası, çoklu sipariş no vb.).
- **Güvenlik / operasyon metrikleri:** sahiplik doğrulaması başarısız sipariş, bulunamayan sipariş, spam/alakasız mesaj.
- **Temsilci kuyruğu:** yalnızca `devret: true` kayıtları — mesaj id, kanal, konu, kısa devir nedeni. Mesaj metni ve sipariş/API detayı gösterilmez.
- Metrikler, `not` metninden tahmin edilmez; işleme sırasında bilinen dahili durum kodlarından (`tumunuIsleDetayli`) hesaplanır. Bu kodlar `talepler.json`'a yazılmaz (çıktı yine 5 alan). Kanal bilgisi `mesajlar.json`'dan id ile eşleştirilir. Tüm dinamik değerler HTML escape edilir.

## Bölüm B

**Aşama: Bölüm B teknik doğrulama ve template import aşaması** (final `workflow.json` henüz üretilmedi).

- Başlangıç şablonu: [Competitor price monitoring with web scraping,Google Sheets & Telegram (#4640)](https://n8n.io/workflows/4640-competitor-price-monitoring-with-web-scrapinggoogle-sheets-and-telegram/) — local n8n 2.35.7'ye import edildi.
- Kaynak site canlı doğrulandı: 20 sayfa, 117 laptop; HTTP Request pagination ile tüm sayfaların tek execution'da çekildiği geçici bir test workflow'u ile doğrulandı.
- Storage: n8n Data Table (`laptop_price_snapshots`). Ayrıntılar: [B-n8n/akis-aciklama.md](B-n8n/akis-aciklama.md).

## Nasıl çalıştırılır

Gereksinim: Node.js 18+ (geliştirme ve test v22.22.3 ile yapıldı). `npm install` gerekmez.

```bash
node A-mesaj-otomasyonu/test.js
```

```bash
node A-mesaj-otomasyonu/isle.js
```

```bash
node A-mesaj-otomasyonu/dogrula.js
```

`isle.js` ve `dogrula.js` canlı DummyJSON API'sine istek atar (internet gerekir).

## Test sonuçları

- `test.js`: **59 test, 59 geçti, 0 başarısız.** 15 mesajın beklenen konusu; `200 ml` / `%100` / URL'nin sipariş no sayılmaması; hassas konuların devri ve tavsiye/teşhis içermemesi; sahiplik eşleşmesi/eşleşmemesi ve sızıntı yokluğu; string/geçersiz `userId`; 404, ağ hatası, HTTP 500/503, bozuk JSON, yanlış cart id, beklenmeyen yapı, timeout; 5 alanlı çıktı şeması; HTML escape; özet metrikleri (toplam 15, kanal toplamı 15, devredilen 3, kuyrukta yalnızca devredilenler, kuyruk/HTML'de API detayı ve mesaj metni yok, HTML bölümleri, girdi kaynaklı değerlerin escape edilmesi); ürün arama bonusu (sorgu çıkarma, URL encode, ilgili/ilgisiz/0 sonuç, 500 / bozuk JSON / ağ hatası / beklenmeyen yapı / timeout fallback, 14-15-8 numaralı mesajlarda arama yapılmaması, ürün bulunsa da bilgi uydurulmaması, en fazla 3 ürün).
- `isle.js` canlı çalıştırma (15 mesaj):

| id | konu | devret | sonuç |
|---|---|---|---|
| 1 | siparis-durumu | true | cart 12 başka müşteriye ait → bilgi verilmedi |
| 2 | siparis-durumu | false | cart 5 eşleşti → ürünler + toplam 1467.88 |
| 3 | siparis-durumu | false | 9999 bulunamadı → müşteriden no kontrolü istendi |
| 4 | istenmeyen-etki | true | tıbbi öneri yok, temsilciye |
| 5 | iade-sikayet | true | temsilciye |
| 6 | siparis-durumu | false | cart 3 eşleşti → İngilizce cevap, toplam 1794.85 |
| 7 | diger | false | spam, cevap üretilmedi |
| 8 | siparis-durumu | false | cart 4 eşleşti → toplam 689.93; ikincil niyet: fiyat |
| 9, 11, 13, 15 | urun-sorusu | false | bilgi uydurulmadı, temsilci teyidi |
| 10, 14 | fiyat | false | fiyat uydurulmadı, temsilci teyidi |
| 12 | diger | false | genel kargo sorusu, API çağrılmadı |

  Dağılım: urun-sorusu 4 · fiyat 2 · siparis-durumu 5 · iade-sikayet 1 · istenmeyen-etki 1 · diger 2 — **devredilen 3** (id 1, 4, 5).
  Kanal: WhatsApp 8 · Instagram 7. Sahiplik doğrulanamadı 1 · bulunamayan sipariş 1 · spam 1.
- `dogrula.js`: tüm kontroller geçti (15 kayıt, 5 alan, enum, boolean, hassas devir, iç API alanı yok, mesaj 1'de canlı sızıntı yok ve not nötr, `mesajlar.json` SHA-256 aynı; `ozet.html` sayıları bağımsız hesapla tutuyor, canlı API'den gelen ürün adı/toplamlar ve mesaj metinleri HTML'de yok).

## Bilinen eksikler / takıldığım noktalar

- Sınıflandırma anahtar kelime kurallarına dayanır; verilen 15 mesaj ve testlerdeki varyasyonlar için doğrulandı, ancak farklı yazımlar/argo için kapsam sınırlıdır.
- DummyJSON genel bir test mağazası; verilen kozmetik terimleri için canlıda sonuç dönmediğinden ürün arama bonusu gerçek veride fallback'te kalıyor (ilgili sonuç kullanımı sahte fetch testleriyle doğrulandı). Türkçe→İngilizce terim eşlemesi bilerek küçük tutuldu.
- Node 18 üzerinde ayrıca çalıştırılmadı; yalnızca Node 18'de bulunan yerleşik API'ler kullanıldı (test v22.22.3 ile yapıldı).

## AI kullanımı

- Araç: Claude Code.
- Tüm promptlar sırasıyla ve olduğu gibi `promptlar/` altında tutulur:
  - [promptlar/A-claude-code.md](promptlar/A-claude-code.md)
  - [promptlar/B-n8n.md](promptlar/B-n8n.md)
- Testlerin yakaladığı ve kodda düzeltilen hatalar (beklentiler teste uydurulmadı):
  1. `"5 numaralı ve 12 numaralı siparişlerim"` / `"5, 7 ve 9 nolu"` liste hâlinde yalnızca son no çıkarılıyordu → "birden fazla no → devret" kuralı atlanabiliyordu. Liste kalıbı eklendi.
  2. `"yüzümü yaktı"` istenmeyen-etki olarak algılanmıyordu (yalnızca "yandı" vardı) → kalıp eklendi.
  3. Timeout testi iptal oluyordu: `AbortSignal.timeout()` zamanlayıcısı Node'da `unref` olduğundan event loop timeout'u beklemiyordu → `AbortController` + `setTimeout`/`clearTimeout` ile değiştirildi.
- Ön kontrolde görüldü: DummyJSON, Python `urllib`'in varsayılan User-Agent'ıyla JSON olmayan hata döndürdü; Node istemcisi açık `User-Agent` başlığı gönderiyor.
