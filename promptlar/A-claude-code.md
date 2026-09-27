# Bölüm A — Claude Code Promptları

Bu dosya, çalışma boyunca yapay zekâ aracına (Claude Code) yazılan promptları **silmeden, sırasıyla ve olduğu gibi** içerir (başarısız denemeler dahil).

---

## 01

````text
Bu klasörde gerçek bir iş mülakatı case'ini yapacağız. Süremiz 3 saat ve teslim GitHub repository üzerinden olacak.

Önce mevcut klasörü dikkatlice incele.

Klasörde şu iki girdi dosyası bulunmalı:
- case-brief.md
- mesajlar.json

ÖNEMLİ:
- Bu iki girdi dosyasını değiştirme.
- Henüz Bölüm A kodunu yazma.
- Henüz Bölüm B n8n workflow'unu oluşturma.
- Önce brief'i eksiksiz analiz et, proje iskeletini hazırla ve Git repository düzenini kur.
- Brief'te yazmayan bir şeyi zorunlu gereksinimmiş gibi varsayma.
- Çalışma boyunca küçük ve anlamlı Git commitleri kullanacağız.
- Tüm Git commit mesajları Türkçe olacak.
- Ben açıkça söylemeden remote oluşturma veya push yapma.
- API key, credential, .env, node_modules veya gereksiz local dosyaları commit etme.

## 1. Brief ve girdi kontrolü

Önce:
- case-brief.md dosyasını tamamen oku.
- mesajlar.json dosyasını oku ve gerçekten 15 mesaj içerdiğini doğrula.
- Her mesajın id, kanal, musteri_id, mesaj alanlarına sahip olduğunu kontrol et.
- Girdi dosyalarını değiştirme.

Bana kısa ama eksiksiz olarak şunları çıkar:

### Bölüm A
- zorunlu gereksinimler
- zorunlu çıktılar
- güvenlik açısından kritik kurallar
- özellikle başka müşterinin sipariş bilgisinin sızmaması için yapılması gereken kontroller
- iade-sikayet / istenmeyen-etki davranışı
- sipariş bulunamadı davranışı
- çoklu niyetli mesajlarda tek konu seçimi için önerdiğin öncelik
- hangi 15 mesajın hangi edge-case'i test ettiğine dair kısa değerlendirme
- bonus /products/search gereksiniminin zorunlu olmadığını ayrıca belirt

### Bölüm B
- workflow.json içinde görünmesi zorunlu tüm node/mantıklar
- pagination gereksinimi
- numeric price gereksinimi
- timestamp + storage gereksinimi
- NEW / PRICE_CHANGED karşılaştırma gereksinimi
- notification gereksinimi
- site açılamaması VE 0 ürün durumu için hata dalı
- kullanılacak başlangıç n8n template'inin ADI ve LİNKİNİN akis-aciklama.md içinde bulunmasının zorunlu olduğunu özellikle not et
- screenshot'ın bonus olduğunu belirt

### Teslim
- zorunlu repository dosyaları
- README'de bulunması gereken bilgiler
- prompt kayıt kuralı
- Git / .gitignore kuralları
- GitHub teslim gereksinimi

## 2. Proje iskeletini oluştur

Brief ile uyumlu şekilde şu yapıyı hazırla:

README.md
.gitignore
A-mesaj-otomasyonu/
B-n8n/
promptlar/
  A-claude-code.md
  B-n8n.md
HANDOFF.md

README şimdilik iskelet olsun. İçinde en az:
- Projenin amacı
- Başlangıç zamanı
- Bölüm A
- Bölüm B
- Nasıl çalıştırılır
- Test sonuçları
- Bilinen eksikler / takıldığım noktalar
- AI kullanımı

başlıkları bulunsun.

Başlangıç zamanını tahmin etme. Terminalden yerel tarih/saat bilgisini kontrol et ve README'ye gerçek başlangıç zamanını yaz.

.gitignore içine en az:
- .env
- .env.*
- node_modules/
- işletim sistemi / editör gereksiz dosyaları
- credential veya secret taşıyabilecek geçici dosyalar

için uygun kuralları ekle.

HANDOFF.md dosyasında şimdilik:
- brief'in kritik gereksinimleri
- mevcut aşama
- henüz yapılmayanlar
- Git durumu

bulunsun.

## 3. Prompt kaydı

Bu mesajı, yani şu anda sana gönderdiğim ilk promptu,
promptlar/A-claude-code.md dosyasına
01 numarayla ve HİÇ DEĞİŞTİRMEDEN kaydet.

Çalışma boyunca:
- promptları silme,
- yeniden yazma,
- özetleme,
- başarısız promptları kaldırma.

Bölüm B'ye geçtiğimizde o promptlar B-n8n.md'ye aynı şekilde kaydedilecek.

## 4. Git

Mevcut klasör Git repository değilse git init yap.

Commit atmadan önce:
- git status
- uygun git diff kontrollerini yap
- secret / credential / .env / node_modules / gereksiz dosya olmadığını doğrula

Bu aşamada yalnızca proje iskeleti ve dokümantasyon hazırlığı commit edilsin.

Commit mesajı:

chore: proje iskeletini ve teslim yapısını hazırla

Remote oluşturma.
Push yapma.

## 5. Şimdilik ekstra özellik geliştirme

Henüz uygulama ama ilerisi için HANDOFF.md içinde "zorunlular bittikten sonra değerlendirilecek" şeklinde kısa bir not bırak:

- A özetinde kanal dağılımı, devir nedenleri, başarısız müşteri doğrulama sayısı, bulunamayan sipariş sayısı ve spam sayısı
- /products/search bonusu
- n8n first-run/baseline notification suppression
- REMOVED ürün tespiti
- normal başarılı run ve PRICE_CHANGED run screenshot'ları
- Türkçe n8n açıklama Sticky Note'u
- README design decisions / production notes

Bunların hiçbiri şu anda zorunlu gereksinimlerin önüne geçmesin.

## 6. Bu aşamanın sonunda

Bana yalnızca şunları raporla:

1. Brief'ten çıkardığın zorunlu checklist
2. mesajlar.json kontrol sonucu
3. oluşturduğun dosya/klasörler
4. Git status özeti
5. oluşturulan commit'in hash'i
6. dikkat etmemiz gereken en kritik 5 risk
7. Bölüm A'ya geçmeye hazır olup olmadığımız

Sonunda dur ve Bölüm A'yı uygulamaya başlamak için benden onay iste.
````

---

## 02

````text
İskelet kontrolü iyi. Bölüm A'ya başlamadan önce üç küçük düzeltme yapalım.

Bu promptu promptlar/A-claude-code.md dosyasına 02 numarayla ve değiştirmeden ekle.

1. case-brief.md teslim artefaktı değil ve public GitHub reposunda yer almasına gerek yok.
   - Dosyayı yerelden SİLME veya içeriğini değiştirme.
   - Git takibinden çıkar.
   - Henüz remote/push olmadığı için case-brief.md ilk commit geçmişinde de kalmayacak şekilde mevcut ilk commit'i uygun biçimde düzelt.
   - Dosyanın sonraki git add işlemlerinde yanlışlıkla tekrar eklenmesini yerel Git exclude mekanizmasıyla engelle.
   - mesajlar.json repoda kalacak; uygulamanın çalışma girdisidir.
   - İşlem sonunda `git ls-files case-brief.md` çıktısının boş olduğunu ve case-brief.md'nin commit geçmişinde kalmadığını doğrula.

2. README başlangıç zamanını resmi case başlangıcımız olan:
   2026-09-27 13:00 (+03)
   olarak düzelt.
   Bitiş zamanı final aşamasında gerçek bitiş saatimizle doldurulacak.

3. Bölüm A için teknoloji kararımız:
   Node.js 18+ kullanacağız.
   - harici npm bağımlılığı kullanma
   - yerleşik fetch kullan
   - test için node:assert / node:test yeterli
   - runtime LLM veya AI API entegrasyonu yapma
   - güvenlik ve kimlik doğrulama deterministik olacak

Henüz Bölüm A kodunu yazma.

Git tarafında:
- prompt 02'nin kendisini şimdilik çalışma alanında bırakabilirsin; bir sonraki anlamlı Bölüm A commit'ine dahil edilecek.
- case-brief.md'nin ilk commit geçmişinden çıkarıldığını doğrula.
- remote ekleme ve push yapma.

Sonunda yalnızca:
- case-brief.md'nin artık tracked/history içinde olup olmadığını,
- mesajlar.json'un tracked olduğunu,
- README başlangıç saatini,
- seçilen Node.js yaklaşımını,
- güncel HEAD commit hash'ini,
- git status'u

raporla ve dur.
````

---

## 03

````text
Bölüm A'nın zorunlu kısmını şimdi uygula.

Bu promptu promptlar/A-claude-code.md dosyasına 03 numarayla ve değiştirmeden ekle.

Amaç:
mesajlar.json içindeki 15 mesajı deterministik kurallarla işle,
DummyJSON sipariş API'sini güvenli kullan,
talepler.json ve tek sayfalık HTML özet üret.

Henüz /products/search bonusunu ekleme.
Henüz Bölüm B'ye geçme.
Önce Bölüm A'nın zorunlu maddelerini eksiksiz ve test edilmiş şekilde bitirelim.

## Teknoloji

Node.js 18+ kullan.
Harici npm paketi kullanma.
Yerleşik:
- fetch
- node:test
- node:assert

yeterli.

Önerilen dosyalar:

A-mesaj-otomasyonu/
- kurallar.js
- isle.js
- test.js
- talepler.json
- ozet.html

Girdi kökteki mesajlar.json olacak ve kesinlikle değiştirilmemeli.

## 1. Sınıflandırma

Her mesaja yalnızca şu konulardan birini ata:

- urun-sorusu
- fiyat
- siparis-durumu
- iade-sikayet
- istenmeyen-etki
- diger

Çoklu niyette şu önceliği kullan:

istenmeyen-etki
> iade-sikayet
> siparis-durumu
> fiyat
> urun-sorusu
> diger

İkincil niyet varsa kısa biçimde `not` alanında belirtilebilir.

Actual mesajlar için beklediğim ana sınıflandırmayı testlerde açıkça doğrula:

1  -> siparis-durumu
2  -> siparis-durumu
3  -> siparis-durumu
4  -> istenmeyen-etki
5  -> iade-sikayet
6  -> siparis-durumu
7  -> diger
8  -> siparis-durumu  (fiyat ikincil niyet)
9  -> urun-sorusu
10 -> fiyat
11 -> urun-sorusu
12 -> diger
13 -> urun-sorusu
14 -> fiyat
15 -> urun-sorusu

Özellikle:
- mesaj 7'deki `%100` ve URL sayı olarak yorumlanmamalı
- mesaj 13'teki `200 ml` sipariş numarası sanılmamalı
- mesaj 12'de "siparişler" kelimesi geçmesine rağmen belirli bir sipariş numarası olmadığı için siparis-durumu olarak sınıflandırma

## 2. Sipariş numarası çıkarma

Sadece bağlamlı sipariş numarası kalıplarını kabul et.

Örn:
- "12 numaralı sipariş"
- "sipariş no 12"
- "order #3"
- benzeri açık sipariş bağlamları

Mesajdaki her sayıyı sipariş numarası kabul etme.

Birden fazla farklı sipariş numarası çıkarsa güvenli tarafta kal ve temsilciye devret.

Sipariş numarası çıkarılamayan siparis-durumu mesajında API çağrısı yapma.

## 3. Hassas konular

iade-sikayet ve istenmeyen-etki için:

- devret: true
- teşhis verme
- tedavi önerme
- ürün önerme
- "şunu kullan / bırak / şu ilacı al" gibi yönlendirme yapma
- yalnızca insan temsilciye yönlendiren kısa ve güvenli cevap oluştur

Özellikle mesaj 4'te "Ne yapmalıyım?" sorusuna tıbbi öneri verme.

## 4. Sipariş güvenliği

siparis-durumu mesajlarında:

GET https://dummyjson.com/carts/{id}

kullan.

API'den gelen cart için sahiplik kontrolü:

Number(cart.userId) === Number(musteri_id)

olmadan hiçbir sipariş detayı cevap veya not alanına yazılmasın.

Eşleşmiyorsa:
- devret: true
- ürün adı verme
- toplam verme
- quantity verme
- başka müşteriyle ilgili herhangi bir alan verme
- ham API cevabını loglama
- teknik hata detayı müşteriye gösterme
- güvenli biçimde "sipariş sahipliği doğrulanamadı, temsilciye aktarıldı" benzeri cevap oluştur

Eşleşiyorsa:
- devret: false
- ürün adlarını yaz
- istersen miktarları da yaz
- toplam tutarı yaz
- API'de olmayan kargo firması / kargoya verilme zamanı / teslim tarihi gibi bilgileri UYDURMA

Özellikle actual veride:
- mesaj 1 / cart 12 -> musteri_id 7 ile sahiplik eşleşmiyor; bilgi sızmamalı
- mesaj 2 / cart 5 -> eşleşen normal akış
- mesaj 6 / cart 3 -> İngilizce normal akış
- mesaj 8 / cart 4 -> eşleşen sipariş akışı, fiyat sorusu ikincil niyet

İngilizce mesaj 6 için mümkünse İngilizce sipariş cevap şablonu kullan.

## 5. API hata davranışı

404 / not found:
- anlaşılır müşteri mesajı
- teknik hata metni yok
- brief bunu devret=true yapmak zorunda demiyor; devret=false kalabilir

Ağ hatası / timeout / 5xx / bozuk JSON / beklenmeyen API yapısı:
- güvenli tarafta kal
- devret: true
- teknik ayrıntıyı cevap_taslagi veya not içine sızdırma
- programın tüm mesaj işlemeyi bırakmasına izin verme

Fetch için makul bir timeout ekle.

## 6. Diğer konular

fiyat / urun-sorusu:
- henüz /products/search bonusunu kullanma
- API'de olmayan ürün, fiyat, içerik, cilt uygunluğu, hayvan testi bilgisi uydurma
- kısa ve güvenli cevap taslağı üret
- gerekiyorsa bilgi kaynağı olmadığı için temsilciden teyit edileceğini belirt

diger / spam:
- spam mesajına ürün veya sipariş cevabı üretme
- istersen cevap_taslagi boş string olabilir

## 7. talepler.json

Tam 15 kayıt olmalı.

Her kayıt yalnızca şu 5 alanı içersin:

{
  "id": ...,
  "konu": "...",
  "devret": true/false,
  "cevap_taslagi": "...",
  "not": "..."
}

Ham API alanlarını output'a ekleme.

Özellikle userId gibi iç alanlar talepler.json'a yazılmamalı.

## 8. ozet.html

Tek sayfalık basit HTML üret.

Zorunlu olarak:
- toplam mesaj sayısı
- konu bazında sayılar
- temsilciye devredilen mesaj sayısı

görünsün.

Framework kullanma.
Harici JS/CSS dependency kullanma.
Kullanıcı verisi HTML'e yazılıyorsa HTML escape uygula.

Şimdilik ekstra dashboard özellikleri ekleme; zorunlu akış geçtikten sonra ayrı promptla geliştireceğiz.

## 9. Testler

test.js içinde kritik davranışları gerçek assert'lerle doğrula.

En az:
- 15 actual mesajın beklenen konu sınıflandırması
- mesaj 13'te 200'ün sipariş no sayılmaması
- mesaj 7'de URL/%100'ün sipariş no sayılmaması
- hassas konuların devret=true olması
- hassas cevaplarda teşhis / ürün önerisi olmadığını kontrol eden temel test
- sahiplik eşleşmesi / eşleşmemesi
- eşleşmeyen siparişte ürün/toplam/userId sızıntısı olmaması
- 404
- ağ hatası
- HTTP 500
- bozuk JSON
- yanlış cart id / beklenmeyen yapı
- mümkünse string userId gibi tip edge-case'i

Testlerde sahte fetch kullanabilirsin; her test için gerçek API'ye gitme.

Sonra:
1. node A-mesaj-otomasyonu/test.js
2. node A-mesaj-otomasyonu/isle.js

çalıştır.

Canlı API run sonucunu incele.

Ayrıca otomatik bir çıktı doğrulaması yap:
- 15 kayıt var mı
- her kayıtta yalnız 5 alan var mı
- konu enum dışında değer var mı
- devret boolean mı
- hassas konular devredilmiş mi
- eşleşmeyen sipariş bilgisinde sızıntı var mı
- mesajlar.json değişmemiş mi

Bir test başarısız olursa beklentiyi teste uydurmak için değiştirme.
Önce hatanın sebebini bul ve gerçek davranışı düzelt.

## 10. Git

Her şey gerçekten çalıştıktan sonra:

- git status
- ilgili git diff
- secret / credential / .env / node_modules kontrolü
- case-brief.md'nin tracked olmadığını tekrar doğrula

yap.

Bu aşamanın çalışan Bölüm A halini commit et.

Commit mesajı:

feat: müşteri mesajı otomasyonunu tamamla

README.md ve HANDOFF.md'yi mevcut gerçek sonuçlarla kısa biçimde güncelle.
Prompt 02 ve 03 de bu commit'e dahil olabilir.

Remote ekleme.
Push yapma.

## Sonunda raporla ve dur

Bana:
1. oluşturulan dosyaları
2. test sayısını ve sonucunu
3. canlı 15 mesaj sonucunu
4. devret=true olan mesaj id'lerini
5. konu dağılımını
6. sipariş güvenliği test sonucunu
7. yakaladığın hata veya düzeltmeleri
8. git commit hash'ini
9. git status'u
10. Bölüm A zorunlularının tamamlanıp tamamlanmadığını

raporla.

Henüz /products/search bonusuna veya Bölüm B'ye geçme.
````

---

## 04

````text
Bölüm A dosyalarını bağımsız olarak tekrar gözden geçirdik. Zorunlu akış ve 37 test geçiyor.

Ancak sahiplik eşleşmeyen siparişte `not` alanında:
"sipariş bu müşteriye ait değil"
ifadesi gereksiz biçimde siparişin varlığını / başka bir müşteriye ait olduğunu doğruluyor.

Bu promptu promptlar/A-claude-code.md dosyasına 04 numarayla ve değiştirmeden ekle.

Yalnızca bu güvenlik nüansını düzelt:

1. Sahiplik eşleşmediğinde `not` nötr olsun.
   Örneğin:
   "Sipariş sahipliği doğrulanamadı; sipariş detayı paylaşılmadı, temsilci kimlik doğrulaması yapmalı."

   Başka müşteriye ait olduğunu açıkça söyleme.
   userId, ürün, miktar veya toplam gibi hiçbir sipariş verisini yazma.

2. `cevap_taslagi` mevcut nötr haliyle kalabilir:
   "hesabınızla doğrulanamadı..." yaklaşımı uygun.

3. test.js'e bu davranışı koruyan bir assertion ekle:
   - eşleşmeyen siparişte `not` alanı "bu müşteriye ait değil", "başka müşteri" veya benzeri sahiplik sonucunu açıkça ifşa etmesin.
   - mevcut ürün / toplam / userId sızıntı testleri aynen kalsın.

4. dogrula.js içindeki canlı sızıntı kontrolüne de mümkünse aynı nötr-not kontrolünü ekle.

5. talepler.json'u yeniden üret ve mesaj 1'in not alanının nötr olduğunu doğrula.

6. Tüm testleri tekrar çalıştır:
   node A-mesaj-otomasyonu/test.js
   node A-mesaj-otomasyonu/isle.js
   node A-mesaj-otomasyonu/dogrula.js

Başka davranışı değiştirme.
Henüz bonus /products/search veya Bölüm B'ye geçme.

Git diff ve status'u kontrol ettikten sonra küçük bir commit oluştur.

Commit mesajı:
fix: sipariş sahipliği notunu güvenli hale getir

Remote ekleme veya push yapma.

Sonunda:
- değişen satırları,
- test sonucunu,
- mesaj 1'in yeni not metnini,
- commit hash'ini,
- git status'u

raporla ve dur.
````

---

## 05

````text
Bölüm A'nın zorunlu kısmı ve güvenlik düzeltmesi tamamlandı.

Şimdi yalnızca A bölümünün operasyonel özetini geliştir.
Henüz /products/search bonusuna geçme.
Henüz Bölüm B'ye geçme.

Bu promptu promptlar/A-claude-code.md dosyasına 05 numarayla ve değiştirmeden ekle.

Amaç:
ozet.html brief'in zorunlu özet gereksinimini korurken, gerçek bir operasyon ekibinin hızlıca kullanabileceği daha okunabilir ve faydalı tek sayfalık bir özet olsun.

## 1. Mevcut zorunlu bilgileri koru

HTML'de mutlaka kalmalı:

- toplam mesaj sayısı
- konu bazında mesaj sayıları
- temsilciye devredilen mesaj sayısı

Bunlar brief gereğidir; kaldırma.

## 2. Şu ek operasyon metriklerini ekle

Mümkün olduğunca mevcut işleme sonuçlarından deterministik olarak hesapla:

- kanal dağılımı:
  - WhatsApp
  - Instagram

- devir nedenleri:
  - sipariş sahipliği doğrulanamadı
  - istenmeyen etki
  - iade / şikayet
  - varsa diğer güvenli devir nedenleri

- sahiplik doğrulaması başarısız sipariş sayısı

- bulunamayan sipariş sayısı

- spam / alakasız mesaj sayısı

- temsilci kuyruğu:
  yalnızca devret=true kayıtları için:
  - mesaj id
  - kanal
  - konu
  - kısa devir nedeni

Müşteri mesajının tam metnini veya sipariş/API detaylarını bu tabloya koyma.

## 3. Görsel düzen

Framework veya harici dependency kullanma.

Tek HTML dosyası içinde sade CSS kullan.

Daha okunabilir bir operasyon dashboard görünümü oluştur:

- üstte başlık ve kısa açıklama
- KPI kartları
- konu dağılımı tablosu
- kanal dağılımı
- temsilci kuyruğu
- mümkünse temiz responsive düzen

Abartılı animasyon, grafik kütüphanesi veya JS kullanma.
Basit, profesyonel ve okunabilir olsun.

Türkçe metin kullan.

HTML'e dinamik veri yazarken escapeHtml güvenliği korunmalı.

## 4. Hesaplama mantığı

Metrikleri mümkünse `ozetHesapla` içinde üret.

Metin içindeki `not` değerlerini sonradan regex ile tahmin etmek yerine,
işleme aşamasında zaten bilinen güvenli durumları kullanabiliyorsan bunu tercih et.

Ancak `talepler.json` brief gereği yalnızca şu 5 alanı içermeye devam etmeli:

id
konu
devret
cevap_taslagi
not

Yeni output alanı ekleme.

Gerekirse özet hesaplama sırasında `mesajlar.json` kanal bilgisiyle talepleri id üzerinden eşleştir.

## 5. Test

Mevcut 37 testi bozma.

Yeni özet metrikleri için en az şu kontrolleri ekle:

- toplam 15
- kanal toplamları 15 ediyor
- devredilen sayısı 3
- temsilci kuyruğunda yalnızca devret=true kayıtları var
- kuyrukta sipariş ürün adı / toplam / userId gibi API detayı yok
- HTML temel bölümleri gerçekten içeriyor
- escapeHtml koruması devam ediyor

Sonra çalıştır:

node A-mesaj-otomasyonu/test.js
node A-mesaj-otomasyonu/isle.js
node A-mesaj-otomasyonu/dogrula.js

ozet.html'i üret ve gerçek verilerle metriklerin doğru olduğunu kontrol et.

## 6. README / HANDOFF

README'de Bölüm A özetinin:
- brief zorunlularını
- kanal dağılımını
- devir nedenlerini
- güvenlik / operasyon metriklerini

gösterdiğini kısa biçimde belirt.

HANDOFF'u güncel tut.

## 7. Git

Diff ve status kontrolünden sonra küçük bir commit oluştur.

Commit mesajı:

feat: talep özetini operasyon metrikleriyle geliştir

Remote ekleme.
Push yapma.

## Sonunda raporla ve dur

Bana:

1. eklenen metrikleri
2. yeni test sayısını ve sonucunu
3. gerçek HTML'deki sayısal özetleri
4. temsilci kuyruğundaki kayıtları
5. HTML'de hassas veri bulunmadığını nasıl doğruladığını
6. commit hash'ini
7. git status'u

raporla.

Henüz /products/search veya Bölüm B'ye geçme.
````

---

## 06

````text
Bölüm A'nın zorunlu kısmı, güvenlik kontrolleri ve operasyon özeti tamamlandı.

Şimdi yalnızca brief'teki isteğe bağlı `/products/search` bonusunu kontrollü şekilde ekle.
Bu bonus bittikten sonra Bölüm A'yı kapatacağız.

Bu promptu promptlar/A-claude-code.md dosyasına 06 numarayla ve değiştirmeden ekle.

Henüz Bölüm B'ye geçme.

## Amaç

`urun-sorusu` ve `fiyat` mesajlarında, mesajda belirli bir ürün aranabiliyorsa:

GET https://dummyjson.com/products/search?q=...

endpoint'ini kullan.

Ancak DummyJSON genel mağaza API'si olduğu için sonuçların kozmetik sorusuyla gerçekten ilgili olmayabileceğini unutma.

YANLIŞ veya ilgisiz ürün bilgisini cevap taslağına eklemektense hiçbir sonuç kullanmamak tercih edilir.

## 1. Hangi mesajlarda arama yap

Yalnız:
- urun-sorusu
- fiyat

konularında değerlendir.

Belirli bir ürün sorgusu çıkarılamıyorsa API çağrısı yapma.

Örneğin:
- "Retinol serumunuz var mı?" -> ürün sorgusu çıkarılabilir
- "Nemlendirici krem ne kadar?" -> ürün sorgusu çıkarılabilir
- "C vitamini serumu..." -> ürün sorgusu çıkarılabilir
- "Tonik 200 ml mi?" -> ürün sorgusu çıkarılabilir
- "İndirim kodunuz var mı, fiyat listesi paylaşır mısınız?" -> belirli ürün yok, arama yapma
- "ürünleriniz hayvanlar üzerinde test ediliyor mu?" -> belirli ürün yok, arama yapma

Mesaj 8'de sipariş-durumu birincil konu olduğu için bu bonus kapsamında ayrıca ürün araması yapma.

## 2. Güvenli sorgu

Mesajın tamamını körlemesine query olarak gönderme.

Kısa ürün sorgusu üret.

Türkçe ürün terimleri için gerekirse çok küçük ve açık bir mapping kullanılabilir:
- nemlendirici -> moisturizer
- tonik -> toner
- güneş kremi -> sunscreen
- c vitamini -> vitamin c
- retinol -> retinol

Bunu gereksiz büyütme.

Query URL'sini güvenli biçimde encode et.

## 3. Sonuç doğrulama

API'den sonuç geldi diye otomatik olarak kullanma.

Bir sonucun cevapta kullanılabilmesi için ürün başlığının sorguyla makul şekilde ilişkili olduğunu deterministik olarak doğrula.

Basit token/anahtar kelime eşleşmesi yeterli.

İlgisiz ürünleri ASLA cevaba ekleme.

Sonuç yoksa veya sonuçlar ilgisizse mevcut güvenli fallback cevabı aynen kullan:
"bilgiyi doğrulanmış kaynaktan teyit ederek ekibimiz dönüş yapacaktır" yaklaşımı.

## 4. Cevap davranışı

Fiyat mesajında gerçekten ilgili ürün bulunursa:
- ürün adı
- API'deki güncel fiyat

kullanılabilir.

urun-sorusu mesajında ilgili ürün bulunursa:
- ürünün API'de bulunduğunu / ürün adını söyleyebilirsin
- ancak API'nin desteklemediği:
  - cilt uygunluğu
  - kullanım tavsiyesi
  - içerik
  - alkol bilgisi
  - hayvan testi bilgisi
  - medikal tavsiye

uydurulmayacak.

Örneğin "Retinol ürününü buldum" demek mümkün olabilir;
"Kuru cilt için uygundur" deme.

## 5. Hata davranışı

/products/search bonus API çağrısı:
- ağ hatası
- timeout
- 5xx
- bozuk JSON
- beklenmeyen yapı

üretirse ana mesaj işleme başarısız olmasın.

Bu bonus olduğu için:
- mevcut güvenli fallback cevabını kullan
- sırf ürün arama servisi hata verdi diye devret=true yapma
- teknik hata detayını müşteriye veya talepler.json'a yazma

## 6. talepler.json

Brief'in formatı değişmeyecek.

Her kayıt yine yalnızca:

id
konu
devret
cevap_taslagi
not

alanlarını içersin.

## 7. Testler

Mevcut 43 testi bozma.

Sahte fetch ile en az şunları ekle:

- ilgili ürün sonucu -> fiyat mesajında ürün adı + fiyat kullanılabilir
- ilgisiz search sonucu -> kullanılmaz, fallback
- 0 sonuç -> fallback
- search API 500 -> fallback
- bozuk JSON -> fallback
- belirli ürün olmayan fiyat mesajında search çağrılmaz
- hayvan testi sorusunda search çağrılmaz
- sipariş mesajı 8 için search çağrılmaz
- API sonucu olsa bile cilt uygunluğu / içerik / hayvan testi gibi bilgi uydurulmaz

Sonra:

node A-mesaj-otomasyonu/test.js
node A-mesaj-otomasyonu/isle.js
node A-mesaj-otomasyonu/dogrula.js

çalıştır.

Canlı API run'ında hangi mesajlarda search çağrıldığını ve gerçekten ilgili sonuç kullanılıp kullanılmadığını raporla.

DummyJSON'da kozmetik sonucu çıkmaması veya sonuçların ilgisiz olup elenmesi BAŞARISIZLIK değildir.
Brief açısından API'nin doğru ve güvenli kullanılması yeterlidir.

## 8. Dokümantasyon

README'de kısa biçimde:
- `/products/search` bonusunun uygulandığını
- yalnız ilgili sonuçların kullanıldığını
- ilgisiz/boş sonuçta fallback yapıldığını

belirt.

HANDOFF'u güncelle.

## 9. Git

Testler geçtikten sonra diff/status kontrolü yap.

Commit mesajı:

feat: ürün arama bonusunu güvenli şekilde ekle

Remote ekleme.
Push yapma.

## Sonunda raporla ve dur

Bana:

1. hangi actual mesajlarda search çağrıldığını
2. kullanılan query'leri
3. API'nin hangi sonuçlarını ilgili kabul ettiğini
4. hangi mesajların fallback'te kaldığını
5. yeni toplam test sayısını
6. talepler.json formatının değişmediğini
7. commit hash'ini
8. git status'u

raporla.

Bölüm B'ye henüz başlama.
````
