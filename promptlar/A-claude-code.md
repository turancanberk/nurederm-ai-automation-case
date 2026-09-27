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
