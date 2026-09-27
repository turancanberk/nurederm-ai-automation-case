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

---

## 02

````text
B-01 teknik doğrulaması onaylandı.

Şimdi Bölüm B'nin ZORUNLU final workflow'unu gerçek local n8n instance'ında oluştur ve çalıştır.

Bu promptu promptlar/B-n8n.md dosyasına 02 numarayla ve HİÇ DEĞİŞTİRMEDEN ekle.

Henüz:
- baseline notification suppression
- REMOVED ürün tespiti
- kontrollü PRICE_CHANGED screenshot testi

ekleme.

Önce brief'in zorunlu workflow'unu eksiksiz ve çalışır hale getir.

Başlangıç noktası olarak gerçekten import ettiğimiz workflow:

Nurederm B — Laptop Fiyat Takibi (başlangıç: template #4640)
id: QAneGL7LmmVuAy1G

üzerinden ilerle.

Sıfırdan tamamen yeni bir workflow oluşturmak yerine bu import edilmiş template'i senaryomuza adapte et.

## 1. Data Table oluştur

Local n8n'de yeni bir Data Table oluştur:

laptop_price_snapshots

Kolonlar:

- run_ts
- product_key
- product_name
- price
- review_count
- product_link

Tipleri uygun seç:
- run_ts: tarih/datetime destekleniyorsa datetime/date
- price: number
- review_count: number
- diğerleri string

Practice'ten kalan tablet_price_snapshots tablosuna dokunma.

Workflow'daki Data Table node'larını bu yeni tabloya bağla.

Başka instance'a import edildiğinde tablo mapping gerekebileceğini dokümantasyonda açıkça belirteceğiz.

## 2. Final zorunlu akışı oluştur

Node isimlerini okunabilir tut.

Tercihen şu sorumluluklar ayrı node'larda görünsün:

Daily Schedule
→ Fetch All Laptop Pages
→ Extract Products
→ Normalize & Validate
→ Has Products?
→ Get Previous Snapshot
→ Compare Previous vs Current

Compare sonrası iki sorumluluk oluşabilir:

A)
Current snapshot'ı hazırla
→ Insert Snapshot

B)
NEW / PRICE_CHANGED durumlarını kontrol et
→ Build Change Notification
→ Send Price Alert

Error branch:

Fetch All Laptop Pages error output
VE
Has Products? false

→ Build Error Alert
→ Send Error Alert
→ Stop and Error

Node isimleri birebir bunlar olmak zorunda değil ancak workflow'u açan biri mantığı tek bakışta anlamalı.

## 3. Daily Schedule

Schedule node:
- günde 1 kez
- 08:00

çalışsın.

Timezone davranışını local n8n ayarına göre kontrol et.
Workflow JSON'da günlük schedule açıkça görünmeli.

## 4. Fetch All Laptop Pages

Kaynak:

https://webscraper.io/test-sites/e-commerce/static/computers/laptops

Pagination:

?page={{ $pageCount + 1 }}

Actual doğruladığımız davranışı kullan:

- 1–19 sayfalarda rel="next"
- 20. sayfada rel="next" yok
- toplam 20 sayfa
- toplam 117 ürün

HTTP Request:
- response text/html olarak alınmalı
- her sayfa ayrı item üretmeli
- rel="next" olmayınca durmalı
- maksimum sayfa sınırı koy: örneğin 30
- request interval kullan: yaklaşık 300–500 ms
- makul timeout
- gerekiyorsa retry 1–2 kez

EN KRİTİK:
Site/network hatasında workflow normal success yoluna devam etmemeli.

HTTP Request node'un error output / onError davranışını gerçek local n8n sürümüne uygun biçimde ayarla.

Site açılamazsa:
→ Build Error Alert
→ Send Error Alert
→ Stop and Error

dalına gitmeli.

## 5. Extract Products

Template'teki HTML extraction yaklaşımından yararlan.

Her sayfadan:

- product_name:
  tam adı kullan; ekranda kısaltılan visible text yerine mümkünse a.title içindeki title attribute

- price:
  ham değer ör. "$416.99"

- review_count:
  sayısal değere dönüşebilecek review alanı

- product_link:
  a.title href

çıkar.

Bir sayfada listelerin uzunlukları uyuşmuyorsa bunu sessizce kabul etme.

Normalize adımında validation error üret veya 0 ürün/error branch davranışına yönlendir.

## 6. Normalize & Validate

Bu node tüm 20 sayfadan gelen extraction sonuçlarını tek bir current-run veri yapısında birleştirsin.

Her ürün:

{
  product_key,
  product_name,
  price,
  review_count,
  product_link
}

şeklinde normalize edilsin.

Kurallar:

- product_link mutlak URL olsun
- product_key = normalize edilmiş mutlak product_link
- price gerçek NUMBER olsun
- "$" ve diğer format karakterleri kaldırılmış olsun
- review_count NUMBER olsun
- geçersiz price / link / name varsa sessizce yanlış kayıt üretme
- product_key ile duplicate ürünleri tekilleştir

Actual normal run için beklenen:
117 unique product.

Node'un çıktısında current ürünlerin tümünü daha sonraki Compare node'un kullanabileceği şekilde koru.

0 ürün durumunda workflow'un tamamen kaybolmaması için bu node en az bir kontrol/summary item üretecek biçimde tasarlanabilir.

## 7. Has Products?

Ürün sayısı > 0 ise normal akış.

0 ise:

Build Error Alert
→ Send Error Alert
→ Stop and Error

Akış 0 ürünle sessizce başarılı bitmemeli.

Hata mesajında teknik olarak en az:
- kaynak site
- execution zamanı
- "0 ürün çıkarıldı"

gibi kısa bilgi bulunabilir.

Credential veya secret yazma.

## 8. Get Previous Snapshot

Data Table:

laptop_price_snapshots

önceki kayıtları oku.

İlk çalıştırmada tablo boş olduğunda workflow DURMAMALI.

Local Data Table node'un empty-result davranışını gerçek execution ile doğrula.

Gerekirse:
- Always Output Data
- Merge
- Code node reference
veya local n8n'de doğru çalışan başka basit yöntem

kullan.

Ama first-run gerçekten çalışmalı.

## 9. Compare Previous vs Current

EN KRİTİK mantık burası.

Karşılaştırma current snapshot Data Table'a yazılmadan ÖNCE yapılmalı.

Append-only Data Table'da aynı product_key için birçok tarihsel kayıt olabilir.

Her current ürün için:

1. geçmişte aynı product_key var mı?
2. varsa EN GÜNCEL previous kayıt hangisi?
3. previous price nedir?
4. current price nedir?

belirle.

Durumlar:

NEW
- geçmişte product_key yok

PRICE_CHANGED
- geçmişte var ve numeric previous price !== numeric current price

NO_CHANGE
- geçmişte var ve fiyat aynı

Her ürün için mümkünse karşılaştırma çıktısında:

- status
- product_key
- product_name
- price
- previous_price
- review_count
- product_link

gibi alanlar görünür olsun.

NEW için previous_price null olabilir.

NO_CHANGE kaybolmak zorunda değil; test ve gözlem için karşılaştırma çıktısında bulunması faydalı.

İlk run:
- previous tablo boşsa 117 ürünün 117'si NEW olmalı.

İkinci unchanged run:
- 117 ürünün 117'si NO_CHANGE olmalı.

Bu iki davranışı gerçek execution ile test edeceğiz.

## 10. Snapshot insert

Compare tamamlandıktan sonra current run ürünlerini:

laptop_price_snapshots

tablosuna ekle.

Her row:

- aynı run_ts
- product_key
- product_name
- price
- review_count
- product_link

içersin.

Bir run'daki 117 ürün mümkünse aynı run_ts değerini paylaşsın.

Mevcut geçmiş satırlarını update/overwrite etme.
Append-only snapshot mantığı kullan.

## 11. Change notification

Yalnız:

NEW
veya
PRICE_CHANGED

ürün varsa change notification hazırlanmalı.

117 NEW olan ilk run'da Telegram limitini aşabilecek dev metin üretme.

Build Change Notification node'u:
- toplam NEW sayısı
- toplam PRICE_CHANGED sayısı
- ilk birkaç örnek ürün
- gerekiyorsa "... ve N ürün daha"

şeklinde kısa özet hazırlayabilir.

Template'teki Telegram notification fikrini koru.

Gerçek credential kullanma.

Send Price Alert node:
- credential gerektirdiği için local test sırasında disabled olabilir
- ancak final workflow.json içinde açıkça görünür olmalı
- hangi durumda tetiklendiği bağlantılardan anlaşılmalı

NO_CHANGE-only run'da notification branch'e item gitmemeli.

## 12. Error notification

Build Error Alert node'u oluştur.

Hem:

A) HTTP/site/network failure
B) zero products

buraya ulaşabilsin.

Send Error Alert via Telegram node'u final workflow'da görünür olsun.

Credential olmadığı için disabled olabilir.

Arkasından:

Stop and Error

kullan.

Hata dalı sonunda execution "success" görünmemeli.

## 13. Türkçe Sticky Note

Workflow canvas'a kısa bir Türkçe Sticky Note ekle.

Başlık:

Laptop Fiyat Takibi — Akış Özeti

İçeriği kısa tut ve şunları anlat:

- başlangıç template #4640
- 20 sayfalık pagination
- Data Table snapshot
- NEW / PRICE_CHANGED / NO_CHANGE
- yalnız değişiklikte bildirim
- HTTP/0 ürün hata dalı

Henüz baseline/REMOVED yazma; implement edilmedi.

## 14. Zorunlu gerçek testler

Credential gerektirmeyen tüm akışı local'de gerçekten çalıştır.

### Run 1

Data Table başlangıçta boş olmalı.

Beklenen:

- 20 sayfa
- 117 ürün
- 117 NEW
- 0 PRICE_CHANGED
- 0 NO_CHANGE
- 117 snapshot row insert

Telegram disabled olabilir.

Execution başarılı olmalı.

### Run 2

Site değişmediyse hemen tekrar çalıştır.

Beklenen:

- 20 sayfa
- 117 ürün
- 0 NEW
- 0 PRICE_CHANGED
- 117 NO_CHANGE
- ikinci 117 snapshot row daha insert
- change notification true branch'ine ürün gitmemeli

Execution başarılı olmalı.

Sonuçlar site gerçekten değişmişse zorla beklenen sayıya uydurma.
Gerçek sonucu raporla ve nedenini incele.

## 15. Error branch testleri

Mümkünse final workflow'u bozmadan kontrollü test et.

En az:

A) site/network failure
- geçici olarak test amaçlı invalid bir URL ile veya kontrollü yöntemle

B) zero products
- geçici selector/test girdisi ile 0 ürün üreterek

iki durumda da:

Build Error Alert
→ Send Error Alert
→ Stop and Error

yolunun çalıştığını doğrula.

Final workflow'u test sonrası GERÇEK URL ve GERÇEK SELECTOR'lara geri döndür.

Test için yaptığın geçici değişiklikleri final workflow.json'a bırakma.

## 16. Export

Zorunlu akış doğrulandıktan sonra local n8n'deki final workflow'u export et:

B-n8n/workflow.json

Export:
- import edilebilir olmalı
- credential secret içermemeli
- actual kaynak URL'yi içermeli
- Data Table kullanımını içermeli
- Schedule açıkça görünmeli
- pagination görünmeli
- NEW / PRICE_CHANGED mantığı görünmeli
- error branch görünmeli
- Sticky Note görünmeli

Gereksiz template tag/metadata varsa güvenli biçimde temizle.

Ancak workflow'un çalışmasını bozacak metadata'yı körlemesine silme.

## 17. akis-aciklama.md

B-01 taslağını gerçek implementasyon sonucuyla güncelle.

Mutlaka:

- template adı
- canonical link
- template'ten korunan/değiştirilen/kaldırılanlar
- 20 sayfa / 117 ürün actual doğrulaması
- extraction alanları
- numeric price
- product_key seçimi
- Data Table schema
- append-only snapshot
- previous/current karşılaştırma
- NEW / PRICE_CHANGED / NO_CHANGE
- notification
- HTTP failure
- 0 ürün failure
- Run 1 sonucu
- Run 2 sonucu
- error-path test sonucu
- credential olmadığı için Telegram'ın canlı gönderilmediği bilgisi
- başka instance'ta Data Table mapping/oluşturma gereksinimi

dürüstçe yaz.

## 18. README / HANDOFF

README'yi gerçek B sonucuyla güncelle.

Henüz final bitiş saati yazma.

HANDOFF'u güncelle.

## 19. Git

Her şey çalıştıktan ve workflow.json export edildikten sonra:

- git status
- ilgili diff
- workflow.json içinde credential / token / chat id / secret taraması
- .env / node_modules kontrolü
- case-brief.md tracked değil kontrolü

yap.

Commit mesajı:

feat: n8n fiyat takip workflowunu tamamla

Remote ekleme.
Push yapma.

## Sonunda raporla ve DUR

Bana:

1. final workflow node listesini
2. Data Table id/adını ve row sayısını
3. Run 1 execution sonucu ve NEW / PRICE_CHANGED / NO_CHANGE sayıları
4. Run 2 execution sonucu ve sayıları
5. HTTP failure test sonucu
6. zero-product test sonucu
7. notification node'larının durumu
8. workflow.json export yolu
9. akis-aciklama.md güncellendi mi
10. karşılaşılan gerçek buglar ve nasıl çözüldüğü
11. commit hash'i
12. git status

raporla.

Henüz:
- baseline suppression
- REMOVED detection
- PRICE_CHANGED kontrollü screenshot testi
- final GitHub push

yapma.
````
