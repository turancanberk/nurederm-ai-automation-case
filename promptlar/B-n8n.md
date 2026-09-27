# Bölüm B — n8n Promptları

Bu dosya, Bölüm B çalışması boyunca yapay zekâ aracına (Claude Code) yazılan promptları **silmeden, sırasıyla ve olduğu gibi** içerir (başarısız denemeler dahil).

---

## 01

````text
Bölüm A tamamlandı. Şimdi Bölüm B'ye geçiyoruz.

Bu promptu promptlar/B-n8n.md dosyasına 01 numarayla ve HİÇ DEĞİŞTİRMEDEN kaydet.

Bu aşamada amacımız:
1. brief'teki Bölüm B gereksinimlerini tekrar doğrulamak,
2. resmi n8n template'ini gerçekten başlangıç noktası olarak import etmek,
3. local n8n ortamımızdaki teknik imkanları doğrulamak,
4. actual laptop sitesi için nihai node mimarisini çıkarmak.

Henüz final workflow.json üretme.
Henüz büyük çaplı node değişikliklerine başlama.
Önce teknik doğrulama ve template başlangıcı.

## 1. Brief'i tekrar kontrol et

case-brief.md içindeki yalnızca Bölüm B kısmını tekrar oku.

Şunların workflow.json içinde görünmesi gerektiğini doğrula:

- günde 1 çalışan Schedule/Cron
- tüm ?page=N sayfalarının gezilmesi
- ürün adı
- numeric price ($ kaldırılmış sayı)
- review count
- product link
- timestamp ile storage
- önceki çalışma ile karşılaştırma
- NEW ürün tespiti
- PRICE_CHANGED ürün tespiti
- NEW veya PRICE_CHANGED için notification
- site açılamazsa hata dalı
- 0 ürün çıkarsa hata dalı
- hata durumunun sessiz başarılı bitmemesi

Teslim:
- B-n8n/workflow.json
- B-n8n/akis-aciklama.md
- varsa screenshots

akis-aciklama.md içinde kullanılan başlangıç template'inin adı + linki ve neyi değiştirdiğimiz zorunlu.

## 2. Başlangıç template'i

Resmi n8n workflow template kütüphanesinden şu template'i kullan:

Competitor price monitoring with web scraping,Google Sheets & Telegram
#4640

Canonical link:
https://n8n.io/workflows/4640-competitor-price-monitoring-with-web-scrapinggoogle-sheets-and-telegram/

Template'in güncel resmi n8n kaynağında mevcut olduğunu mümkünse kendin de doğrula.

ÖNEMLİ:
Template'i sadece isim olarak referans verme.

Local n8n instance'ımıza gerçekten import et ve bizim workflow'umuzun başlangıç noktası olarak kullan.

Import sonrası:
- workflow adını uygun şekilde değiştir
- henüz gereksiz node'ları silmeye başlamadan önce template'in node yapısını incele
- hangi node'ları koruyacağımızı
- hangilerini değiştireceğimizi
- hangilerini kaldıracağımızı
raporla.

Template'in orijinal mantığından yararlandığımız parçaları akis-aciklama.md için not et.

## 3. Actual kaynak site

Kaynak:

https://webscraper.io/test-sites/e-commerce/static/computers/laptops

Pagination:
?page=N

Bu actual siteyi incele ve şu bilgileri doğrula:

- kaç sayfa var
- toplam yaklaşık kaç ürün var
- son sayfanın nasıl anlaşılabileceği
- ürün kartının HTML yapısı
- product name selector / çıkarma yöntemi
- price
- review count
- product link
- next-page sinyali

Site test amaçlı statik sitedir.

Henüz scraper kodunu final hale getirme; önce gerçek HTML yapısını doğrula.

## 4. Pagination teknik doğrulaması

Local n8n sürümünü öğren.

HTTP Request node'unun kendi pagination özelliği ile:

?page=1
?page=2
...

şeklinde ilerleyip tüm sayfaları tek execution içinde çekip çekemediğimizi doğrula.

Mümkünse node schema / local n8n bilgisine bak.

Şunları kontrol et:

- page değerini $pageCount ile artırabiliyor muyuz
- HTML/text response alabiliyor muyuz
- her sayfa ayrı item olarak geliyor mu
- son sayfayı response içeriğinden tespit edip pagination'ı durdurabiliyor muyuz
- güvenlik için maksimum sayfa limiti verebiliyor muyuz
- request arası kısa delay verebiliyor muyuz

Practice case'ten varsayım kopyalama.
Actual laptop sayfasını ve local n8n sürümünü tekrar doğrula.

Mümkün ve hızlıysa küçük geçici bir teknik test workflow'u ile pagination sonucunu çalıştır.
Ancak final workflow'u henüz oluşturma.

## 5. Storage kararı

Bu case için mümkünse:

n8n Data Table

kullanmak istiyorum.

Neden uygun olduğunu kısa belirt.

Önerilen snapshot alanları:

- run_ts
- product_key
- product_name
- price
- review_count
- product_link

product_key olarak mümkünse normalize edilmiş product_link kullan.

Başka bir n8n instance'ına import edildiğinde Data Table mapping gerekebileceğini production/documentation notu olarak düşün.

## 6. Değişiklik mantığı

Nihai tasarımda durumlar:

NEW
PRICE_CHANGED
NO_CHANGE

olacak.

Her current ürün için en son previous snapshot ile product_key üzerinden karşılaştırma yapılacak.

NEW:
önceki run'da ürün yok.

PRICE_CHANGED:
önceki fiyat ile current fiyat farklı.

NO_CHANGE:
aynı.

Henüz REMOVED detection ekleme.
Önce zorunlu akış.

İlk run'da previous snapshot olmadığı için ürünlerin NEW sayılmasının doğal olduğunu belirt.

Baseline notification suppression daha sonra ekstra olarak değerlendirilecek.

## 7. Error branch

Nihai workflow'da iki zorunlu failure senaryosu ayrı düşün:

A)
site HTTP/network olarak açılamıyor

B)
istek başarılı olsa bile normalize edilen ürün sayısı = 0

Her ikisinde:
- error notification hazırlanmalı
- workflow sessiz başarılı bitmemeli

Credential kurmak zorunda değiliz.
Notification node credential olmadan / disabled biçimde tasarlanabilir ama workflow mantığında görünür olmalı.

## 8. Nihai mimari önerisi

Tek tek node isimleriyle kısa bir mimari çıkar.

Örneğin kabaca:

Daily Schedule
→ Fetch All Laptop Pages
→ Extract Products
→ Normalize & Deduplicate
→ Has Products?
→ Get Previous Snapshot
→ Compare Previous vs Current
→ ...
→ Insert Snapshot
→ Has New or Price Changed?
→ Build Notification
→ Notification

ve error branch.

Ama bu sadece örnek.
Actual template ve local node imkanlarına göre en uygun nihai yapıyı öner.

## 9. Bu aşamada dosya/commit

B-n8n/akis-aciklama.md dosyasını şimdiden oluşturabilirsin ama yalnız doğrulanmış bilgilerle başlangıç taslağı olsun.

Şunları mutlaka yaz:

- template adı
- canonical link
- template'ten hangi fikir/node'ların alındığı
- actual kaynak site
- storage tercihi
- planlanan pagination
- planlanan error handling

Henüz workflow.json final export yapma.

README/HANDOFF'a:
"Bölüm B teknik doğrulama ve template import aşaması"
şeklinde kısa güncelleme yap.

Bu aşama gerçekten anlamlı bir checkpoint oluşturuyorsa küçük commit at.

Commit mesajı:

chore: n8n template ve teknik tasarımı doğrula

Her commit öncesi:
- git status
- diff
- secret/credential kontrolü

yap.

Remote ekleme.
Push yapma.

## Sonunda dur ve bana raporla

1. local n8n sürümü
2. template'in gerçekten import edilip edilmediği
3. template'te kaç node olduğu ve ana node'ları
4. actual laptop sitesindeki sayfa sayısı
5. actual toplam ürün sayısı
6. pagination'ın nasıl biteceği
7. local HTTP Request pagination desteği
8. seçilen Data Table yapısı
9. önerilen final node mimarisi
10. gördüğün teknik riskler
11. commit varsa hash'i
12. git status

Final workflow'u henüz oluşturma.
Benden onay bekle.
````
