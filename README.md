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
| `A-mesaj-otomasyonu/ozet.html` | Çıktı: toplam, konu bazında sayılar, devredilen sayısı |

**Kurallar**
- **Konu önceliği (çoklu niyet):** `istenmeyen-etki` > `iade-sikayet` > `siparis-durumu` > `fiyat` > `urun-sorusu` > `diger`. İkincil niyet `not` alanına yazılır. Spam mesajlar (ör. takipçi/kısaltılmış link) `diger` olur ve cevap üretilmez.
- **Sipariş no:** Yalnızca bağlamlı kalıplar (`12 numaralı sipariş`, `sipariş no 12`, `order #3`, liste hâli). `200 ml`, `%100`, URL gibi sayılar sipariş no sayılmaz. Birden fazla farklı no → API çağrılmaz, devredilir. No yoksa API çağrılmaz, müşteriden no istenir.
- **Hassas konular** (`iade-sikayet`, `istenmeyen-etki`): `devret: true`, sabit ve güvenli cevap; teşhis, tedavi, ürün önerisi yok. Mesajda sipariş no olsa bile API çağrılmaz.
- **Sipariş güvenliği:** `userId` ve `musteri_id` pozitif tam sayıya çevrilip karşılaştırılır (`"5"` = `5`; `null`/`"abc"`/`0` geçersiz). Eşleşmezse sipariş verisinin hiçbir parçası çıktıya girmez, `devret: true`. Eşleşirse ürün adları, miktarlar ve toplam yazılır; kargo/teslim bilgisi API'de olmadığı için uydurulmaz.
- **API hataları:** 404 / "not found" → anlaşılır müşteri mesajı, `devret: false`. Ağ hatası, timeout (8 sn), 5xx, bozuk JSON, beklenmeyen yapı veya yanlış cart id → `devret: true`, teknik detay çıktıya yazılmaz. Tek mesajdaki beklenmeyen hata diğer mesajların işlenmesini durdurmaz.
- **Fiyat / ürün soruları:** Veri kaynağı olmadığı için fiyat, içerik, cilt uygunluğu vb. bilgi uydurulmaz; temsilci teyidine yönlendirilir. (`/products/search` bonusu henüz eklenmedi.)
- İngilizce mesajlarda sipariş cevabı İngilizce şablonla yazılır.

## Bölüm B

_(Henüz başlanmadı.)_

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

- `test.js`: **37 test, 37 geçti, 0 başarısız.** 15 mesajın beklenen konusu; `200 ml` / `%100` / URL'nin sipariş no sayılmaması; hassas konuların devri ve tavsiye/teşhis içermemesi; sahiplik eşleşmesi/eşleşmemesi ve sızıntı yokluğu; string/geçersiz `userId`; 404, ağ hatası, HTTP 500/503, bozuk JSON, yanlış cart id, beklenmeyen yapı, timeout; 5 alanlı çıktı şeması; HTML escape.
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
- `dogrula.js`: tüm kontroller geçti (15 kayıt, 5 alan, enum, boolean, hassas devir, iç API alanı yok, mesaj 1'de canlı sızıntı yok, `mesajlar.json` SHA-256 aynı).

## Bilinen eksikler / takıldığım noktalar

- Sınıflandırma anahtar kelime kurallarına dayanır; verilen 15 mesaj ve testlerdeki varyasyonlar için doğrulandı, ancak farklı yazımlar/argo için kapsam sınırlıdır.
- Fiyat / ürün soruları için gerçek ürün verisi kullanılmıyor (`/products/search` bonusu henüz yapılmadı).
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
