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

---

## 03

````text
Zorunlu Bölüm B tamamlandı ve iki normal run + error-path testleri geçti.

Şimdi yalnızca kontrollü PRICE_CHANGED senaryosunu gerçek local n8n üzerinde doğrula ve bonus screenshot'ları hazırla.

Bu promptu promptlar/B-n8n.md dosyasına 03 numarayla ve HİÇ DEĞİŞTİRMEDEN ekle.

Bu aşamada:
- baseline suppression ekleme
- REMOVED detection ekleme
- workflow mimarisini yeniden tasarlama

Yapma.

Amaç yalnızca mevcut zorunlu workflow'un PRICE_CHANGED yolunu gerçek execution ile kanıtlamak.

## 1. Kontrollü test yaklaşımı

Gerçek web sitesindeki fiyatı değiştirmiyoruz.

Data Table:
laptop_price_snapshots

içinde mevcut ürünlerden yalnızca BİR tanesinin en güncel previous snapshot fiyatını geçici olarak değiştir.

Örnek:

gerçek/current fiyat: 699.99
en güncel previous snapshot: 699.99

test için yalnız previous snapshot:
699.99 → 649.99

Sonra workflow'u normal gerçek URL ile çalıştır.

Beklenen:

- toplam 117 ürün
- 0 NEW
- 1 PRICE_CHANGED
- 116 NO_CHANGE

Site gerçekten bu sırada değiştiyse gerçek sonucu zorla bu sayılara uydurma; nedenini incele.

## 2. Hangi satırı değiştirdiğini dikkatli seç

Append-only tabloda aynı product_key için birden fazla snapshot var.

Mutlaka workflow'un previous olarak seçeceği EN GÜNCEL önceki satırı değiştir.

Ürünün:
- product_key
- product_name
- gerçek current price
- test previous price

bilgilerini kaydet.

Mümkünse Data Table'ı programatik/local n8n araçlarıyla değiştir.

Eğer mevcut araçlarla güvenli biçimde row update mümkün değilse DUR ve bana hangi satırı UI'dan değiştirmem gerektiğini açıkça söyle.
Rastgele eski snapshot değiştirme.

## 3. Workflow çalıştır

Gerçek final workflow'u çalıştır.

Compare Previous vs Current node'unda değiştirdiğimiz ürün için en az:

status: PRICE_CHANGED
previous_price: testte verdiğimiz eski fiyat
price: gerçek site fiyatı

görünmeli.

Has New or Price Changed? true kolunda yalnızca değişiklik item'ı / değişiklik özeti bulunmalı.

Build Change Notification çıktısında bu ürün görünmeli.

Telegram disabled kalabilir; gerçek mesaj gönderme.

## 4. Snapshot etkisi

Bu PRICE_CHANGED run doğal olarak Data Table'a yeni ve GERÇEK current fiyatla bir snapshot daha yazabilir.

Bu sorun değil ve test sonucunun geçmiş kaydıdır.

Ancak TEST İÇİN ELLE değiştirdiğimiz eski previous snapshot satırını test sonunda orijinal gerçek fiyatına GERİ DÖNDÜR.

Yani:

- manuel bozduğumuz historical row restore edilecek
- workflow'un gerçek PRICE_CHANGED execution sırasında eklediği yeni snapshot silinmeyecek

Bu ayrımı açıkça koru.

Restore sonrası Data Table'ın son current snapshot'ının gerçek site fiyatını içerdiğini doğrula.

## 5. Screenshot

B-n8n altında screenshots klasörü oluştur:

B-n8n/screenshots/

İki temiz ekran görüntüsü istiyorum:

1. workflow-success.png
   - final workflow canvas
   - normal başarılı akış anlaşılır biçimde görünsün
   - mümkünse Run 2 gibi NO_CHANGE execution'dan node item sayıları görünür olsun

2. price-changed-test.png
   - PRICE_CHANGED kontrollü execution
   - Compare / condition / notification tarafında 1 PRICE_CHANGED olduğu anlaşılır olsun
   - mümkünse output panelinde:
     status
     previous_price
     price
     product_name
     görünsün

Credential, token, encryption key veya başka secret screenshot'ta ASLA görünmesin.

Screenshot alırken Data Table içindeki gereksiz müşteri/secret veri zaten yok ancak local config / terminal / credential ekranı görünmesin.

## 6. Dokümantasyon

akis-aciklama.md içine açıkça yaz:

- bu gerçek site fiyat değişikliği değildi
- kontrollü bir testti
- yalnızca bir ürünün en güncel previous snapshot fiyatı geçici olarak değiştirildi
- workflow gerçek site fiyatını çekince PRICE_CHANGED üretti
- test sonrası değiştirilmiş historical satır orijinal fiyatına geri getirildi
- workflow'un test execution sırasında eklediği gerçek current snapshot geçmişte bırakıldı

README'de de bunu 1-2 cümleyle dürüstçe belirt.

## 7. Encryption key kontrolü

Önceki teknik incelemede local ~/.n8n/config içindeki encryptionKey terminale yanlışlıkla basılmıştı.

Gerçek değer:
- hiçbir repo dosyasına
- prompt dosyasına
- workflow.json'a
- README'ye
- akis-aciklama.md'ye
- screenshot'a

girmemiş olmalı.

Gerçek değeri bana veya rapora yazma.

Sadece repository üzerinde secret taraması yap ve "repo içinde bulunmadı" sonucunu raporla.

## 8. Test sonrası kontrol

Mevcut final workflow URL/selectors/config geri dönmüş olmalı.

Final workflow'u PRICE_CHANGED testinden sonra değiştirmediysen tekrar normal run yapmak zorunda değilsin.

Ancak:
- geçici test workflow kalmadığını
- yanlış fiyatla bırakılmış historical satır olmadığını
- workflow export'unun hâlâ gerçek URL'yi kullandığını

doğrula.

## 9. Git

Screenshot ve dokümantasyon tamamlanınca:

git status
git diff
secret taraması

yap.

Commit mesajı:

test: fiyat değişikliği senaryosunu doğrula

Remote ekleme.
Push yapma.

## Sonunda raporla ve DUR

Bana:

1. test edilen ürün adı
2. gerçek fiyat
3. geçici previous fiyat
4. execution id
5. NEW / PRICE_CHANGED / NO_CHANGE sayıları
6. Compare node'daki ilgili ürün çıktısı
7. historical row restore edildi mi
8. screenshot dosyaları
9. encryptionKey repo içinde bulunuyor mu (değeri ASLA yazma)
10. commit hash'i
11. git status

raporla.
````

---

## 04

````text
B-n8n/screenshots/ klasörüne iki manuel ekran görüntüsü ekledim:

- workflow-success.png
- price-changed-test.png

Bu promptu promptlar/B-n8n.md dosyasına 04 numarayla ve değiştirmeden ekle.

Önce iki screenshot'ı kontrol et.

Şunları doğrula:
- görüntüler gerçekten final workflow / ilgili execution'lara ait
- workflow-success.png normal başarılı çalışmayı gösteriyor
- price-changed-test.png kontrollü PRICE_CHANGED sonucunu gösteriyor
- credential, token, encryptionKey, parola veya başka secret görünmüyor
- görüntüler okunabilir

Görüntüler uygunsa:
- akis-aciklama.md içinde screenshot bölümüne bu iki dosyayı ve ne gösterdiklerini ekle
- README'de screenshotların B-n8n/screenshots altında bulunduğunu kısa belirt
- başka workflow davranışını değiştirme

Sonra git status ve diff kontrolü yap.

Commit mesajı:
docs: n8n çalışma ekran görüntülerini ekle

Remote ekleme veya push yapma.

Sonunda yalnızca:
- iki screenshot'ın güvenlik kontrolü sonucu
- dokümantasyonda ne güncellendi
- commit hash
- git status

raporla ve dur.
````

---

## 05

````text
Zorunlu Bölüm A ve B tamamlandı. Bonus ürün arama, operasyon özeti, gerçek n8n run'ları, error-path testleri ve iki screenshot da mevcut.

Artık YENİ ÖZELLİK EKLEME.

Baseline suppression ve REMOVED detection eklemeyeceğiz.
Mevcut çalışan mimariyi gereksiz refactor etme.

Şimdi tüm repository için final teslim öncesi audit yap.

Bu promptu promptlar/B-n8n.md dosyasına 05 numarayla ve HİÇ DEĞİŞTİRMEDEN ekle.

Henüz:
- GitHub remote oluşturma
- push yapma
- README bitiş saatini kesinleştirme
- e-posta gönderme

yapma.

Önce teslim paketinin brief'e birebir uyduğunu doğrula.

## 1. Repository yapısı

Repo kökünü kontrol et.

En az şunlar mevcut olmalı:

README.md
.gitignore
mesajlar.json

A-mesaj-otomasyonu/
  kurallar.js
  isle.js
  test.js
  dogrula.js
  talepler.json
  ozet.html

B-n8n/
  workflow.json
  akis-aciklama.md
  screenshots/
    workflow-success.png
    price-changed-test.png

promptlar/
  A-claude-code.md
  B-n8n.md

HANDOFF.md

case-brief.md:
- yerelde bulunabilir
- Git tarafından tracked olmamalı
- commit geçmişinde bulunmamalı

Gereksiz practice dosyası, tablet workflow'u, eski export, geçici test scripti veya debug çıktısı repo içinde kalmamalı.

Özellikle repo genelinde şu tür eski/practice referanslarını ara:

- case-brief-practice
- mesajlar-practice
- tablet_price_snapshots
- /computers/tablets
- PRACTICE
- geçici workflow export isimleri

Gerçek case için bilinçli bir açıklamanın parçası değilse kaldırma gerekip gerekmediğini raporla.

## 2. Bölüm A final doğrulama

Tekrar çalıştır:

node A-mesaj-otomasyonu/test.js
node A-mesaj-otomasyonu/isle.js
node A-mesaj-otomasyonu/dogrula.js

Doğrula:

- tüm testler geçiyor
- 15 kayıt
- her talepler.json kaydı yalnız:
  id
  konu
  devret
  cevap_taslagi
  not
  alanlarını içeriyor
- hassas mesajlar devrediliyor
- mesaj 1 başka müşterinin ürün/toplam/userId bilgisini sızdırmıyor
- mesaj 1'in not'u sahiplik varlığını gereksiz ifşa etmiyor
- 404 ile sistem hatası ayrılmış
- ürün/fiyat cevaplarında uydurma bilgi yok
- products/search bonusu hatasında ana akış bozulmuyor
- mesajlar.json değişmemiş
- ozet.html brief'in zorunlu metriklerini ve ek operasyon metriklerini içeriyor

A tarafında yeni davranış ekleme.

## 3. Bölüm B workflow.json statik audit

workflow.json'u JSON olarak parse et ve tek tek doğrula:

- import edilebilir geçerli JSON
- Daily Schedule / Cron günde bir kez 08:00
- Europe/Istanbul timezone ayarı
- actual laptop URL:
  https://webscraper.io/test-sites/e-commerce/static/computers/laptops
- ?page=N pagination
- pageCount ile sayfa ilerleme
- rel="next" bitiş mantığı
- maksimum sayfa sınırı
- request interval / timeout
- product_name extraction
- numeric price
- review_count
- product_link
- product_key
- Data Table snapshot
- run_ts
- previous/current comparison
- NEW
- PRICE_CHANGED
- NO_CHANGE
- Insert Snapshot
- yalnız NEW/PRICE_CHANGED notification yolu
- HTTP/network error branch
- zero-products error branch
- Stop and Error
- Türkçe Sticky Note

Gerçek credential/token/chat id bulunmamalı.
Yer tutucu değerler açıkça yer tutucu olmalı.

Workflow içinde yanlışlıkla:
- tablet URL'si
- practice tablo adı
- localhost credential
- test URL'si
- invalid hostname
- geçici selector

kalmadığını doğrula.

Final workflow'u değiştirme; yalnız gerçek bir teslim hatası varsa düzeltmeden önce raporla.

## 4. akis-aciklama.md audit

Şunların bulunduğunu doğrula:

- başlangıç template adı:
  Competitor price monitoring with web scraping,Google Sheets & Telegram
- template #4640 canonical link
- template'ten nelerin korunduğu/değiştirildiği/kaldırıldığı
- actual laptop sitesi
- 20 sayfa / 117 ürün doğrulaması
- extraction alanları
- numeric price
- Data Table adı ve schema
- append-only snapshot
- product_key tercihi
- NEW / PRICE_CHANGED / NO_CHANGE
- Run 1 sonucu
- Run 2 sonucu
- kontrollü PRICE_CHANGED sonucu
- bu PRICE_CHANGED testinin gerçek site değişikliği olmadığı açıklaması
- historical test satırının restore edildiği
- HTTP/network error testi
- 0 ürün testi
- Telegram credential olmadığı ve gerçek mesaj gönderilmediği
- başka n8n instance'ında Data Table oluşturma/mapping gereksinimi
- screenshot dosyaları ve neyi gösterdikleri

Execution numaraları ve satır sayıları kendi bağlamlarında çelişmemeli.
Örneğin "test anındaki 351 satır" ile screenshot sonrası 819 satır birbirine karıştırılmamalı.

## 5. README final audit

README kısa ama yeterli olsun.

Doğrula:

- proje amacı
- başlangıç zamanı: 2026-09-27 13:00 (+03)
- bitiş zamanı için henüz final aşamayı bekleyen açık alan varsa bunu raporla
- nasıl çalıştırılır
- Bölüm A komutları
- Bölüm A sonuçları
- Bölüm B import/kullanım bilgisi
- template #4640
- storage/Data Table bilgisi
- gerçek test sonuçları
- screenshots
- bilinen sınırlamalar
- gerçek Telegram mesajı gönderilmediği
- başka instance'ta Data Table mapping gerektiği
- AI kullanımı / prompt kayıtları
- tamamlanmayan bir şey varsa dürüstçe yazılmış olması

README hiçbir sonucu olduğundan daha iyi göstermesin.

## 6. Prompt günlükleri

A-claude-code.md:
- 01–06 mevcut mu
- sıralı mı
- promptlar değiştirilmeden tutulmuş mu

B-n8n.md:
- 01–05 mevcut mu
- sıralı mı
- başarısız denemeleri veya düzeltme promptlarını silmiş miyiz

Prompt günlüklerinde:
- gerçek encryptionKey
- credential
- parola
- token

bulunmadığını kontrol et.

## 7. Git geçmişi

Çalıştır:

git status
git log --oneline --decorate

Commit geçmişinin küçük ve anlamlı kilometre taşları gösterdiğini doğrula.

Özellikle mevcut commitlerin:
- iskelet
- A implementation
- security fix
- operasyon özeti
- products/search bonus
- B teknik doğrulama
- B workflow
- PRICE_CHANGED test
- screenshots

gibi ilerlemeyi gösterdiğini kontrol et.

Commit mesajları Türkçe olmalı.

Henüz history rewrite yapma.
Gerçek bir problem yoksa commitleri squash/amend etme.

## 8. Secret / kişisel veri taraması

Tüm tracked repository ve mümkünse git geçmişinde şunları ara:

- API key
- token
- password
- credential secret
- encryptionKey gerçek değeri
- .env
- özel credential id / auth header
- kişisel local filesystem path
- e-posta/parola gibi gereksiz kişisel bilgiler

Brief'teki teslim e-posta adresinin dokümanda geçmesi secret değildir.

Gerçek encryptionKey değerini ASLA rapora yazma.

Screenshot metadata ve görünür içerik daha önce kontrol edildi; tekrar hızlıca doğrulayabilirsin.

## 9. Brief checklist

case-brief.md dosyasını yerelden tekrar oku fakat commit etme.

Brief'teki maddeleri tek tek checklist olarak kontrol et:

A zorunluları
A çıktıları
A güvenlik
A bonus

B zorunluları
template adı + link
pagination
numeric price
timestamp storage
change detection
notification
error branch
workflow.json
akis-aciklama.md
screenshots bonus

README
.gitignore
prompt kayıtları
küçük commitler
GitHub teslimi

GitHub teslimi henüz yapılmadığı için yalnızca onu PENDING olarak işaretle.
README bitiş saati de final push aşamasına kadar PENDING olabilir.

## 10. Değişiklik politikası

Audit sırasında kritik olmayan:
- stil
- isim
- format
- yorum
- refactor

değişikliği yapma.

Sadece teslimi gerçekten bozacak bir problem varsa düzelt.

Bir problem bulursan:
- önce sebebini belirle
- minimum fix yap
- ilgili testleri yeniden çalıştır

Audit sonucunda dosya değişikliği gerekiyorsa küçük commit oluştur:

fix: final teslim denetimindeki eksikleri düzelt

Değişiklik gerekmiyorsa sırf commit olsun diye commit atma.

Remote ekleme.
Push yapma.

## Sonunda raporla ve DUR

Bana yalnızca:

1. brief checklist sonucu: PASS / PENDING / FAIL
2. A test sonucu
3. B workflow statik audit sonucu
4. README / akis-aciklama tutarlılık sonucu
5. prompt günlükleri sonucu
6. secret taraması sonucu
7. practice/geçici dosya kalıntısı var mı
8. git log özeti
9. yapılan herhangi bir final fix varsa ne olduğu + commit hash
10. git status
11. GitHub push öncesi kalan maddeler

raporla.

Henüz remote oluşturma veya push yapma.
````

---

## 06

````text
Final audit geçti. Artık kod, test veya workflow davranışında yeni özellik/refactor yapma.

Bu promptu promptlar/B-n8n.md dosyasına 06 numarayla ve değiştirmeden ekle.

Şimdi final teslim hazırlığını yap.

## 1. README son kontrolü

README'de yanlışlıkla:
"hassas mesajlar 1,4,5"
gibi bir ifade varsa düzelt.

Doğru ayrım:
- devredilen mesajlar: 1, 4, 5
- hassas konular: 4 ve 5
- mesaj 1: sipariş sahipliği doğrulanamadığı için güvenlik nedeniyle devredildi

Başka içerik değiştirme.

## 2. Bitiş saati

Terminalden gerçek yerel tarih/saat bilgisini al.

README'de:

Başlangıç: 2026-09-27 13:00 (+03)
Bitiş: <gerçek final hazırlık zamanı> (+03)

şeklinde gerçek bitiş saatini yaz.

Bitiş zamanı olarak tahmini saat kullanma.

## 3. Son test / secret kontrolü

Son kez:

node A-mesaj-otomasyonu/test.js
node A-mesaj-otomasyonu/isle.js
node A-mesaj-otomasyonu/dogrula.js

çalıştır.

Ardından:

- git status
- git diff
- tracked dosyalarda secret/token/password/encryptionKey gerçek değeri araması
- workflow.json parse kontrolü
- case-brief.md tracked değil kontrolü

yap.

Yeni problem yoksa yalnız README/prompt/final metadata değişikliklerini commit et.

Commit mesajı:

docs: teslim bilgilerini tamamla

## 4. GitHub

Önce mevcut GitHub auth durumunu kontrol et.

Eğer `gh` CLI authenticated ise:

- yeni PUBLIC repository oluştur
- uygun, profesyonel ve kısa bir repo adı kullan
- mevcut local repo'yu remote'a bağla
- main branch'i push et

Repo adı için öneri:
nurederm-ai-automation-case

Eğer bu isim doluysa benzer temiz bir isim seç.

Eğer GitHub auth yoksa veya repo oluşturamıyorsan:
- hiçbir şeyi zorlamadan dur
- bana hangi manuel adımı yapmam gerektiğini söyle

Force push kullanma.

## 5. Push sonrası doğrulama

Push başarılıysa:

- remote URL'yi göster
- `git status` temiz mi kontrol et
- `git log --oneline` ile commitlerin push edildiğini doğrula
- public repo URL'sinin erişilebilir olduğunu mümkünse kontrol et
- README, A-mesaj-otomasyonu, B-n8n/workflow.json,
  B-n8n/akis-aciklama.md, screenshots ve promptlar klasörlerinin repoda bulunduğunu doğrula
- case-brief.md'nin GitHub'da bulunmadığını doğrula
- secret bulunmadığını tekrar doğrula

## 6. Mail

Mail gönderme.

Bana gönderilmeye hazır kısa bir mail metni hazırla:

Konu:
Nurederm AI Automation Case — Canberk

İçerik:
- kısa selamlama
- case'in tamamlandığı
- GitHub repo linki
- teşekkür / iyi çalışmalar

Abartılı açıklama ekleme.

## Sonunda raporla

1. gerçek bitiş saati
2. son A test sonucu
3. final commit hash
4. GitHub repo URL
5. push başarılı mı
6. repo public erişilebilir mi
7. case-brief.md repoda yok mu
8. secret scan sonucu
9. git status
10. hazır e-posta metni

Eğer GitHub auth yüzünden manuel işlem gerekiyorsa o noktada dur ve bana açık adımlar ver.
````
