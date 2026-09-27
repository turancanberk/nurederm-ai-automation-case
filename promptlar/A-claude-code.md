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
