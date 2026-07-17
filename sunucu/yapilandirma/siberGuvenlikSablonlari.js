const siberGuvenlikYanitlari = {
  zararliYazilim: {
    anahtarKelimeler: ['malware', 'zararlı yazılım', 'virüs', 'trojan', 'truva', 'solucan', 'worm', 'ransomware', 'fidye', 'spyware', 'casus', 'rootkit', 'keylogger', 'botnet'],
    yanitlar: [
      `Zararlı yazılımlar (malware), bilgisayar sistemlerine zarar vermek, yetkisiz erişim sağlamak veya hassas verileri çalmak amacıyla tasarlanmış kötü amaçlı yazılımlardır. Bu yazılımlar virüsler, truva atları, solucanlar, fidye yazılımları (ransomware), casus yazılımlar (spyware) ve rootkit'ler gibi çeşitli türlere ayrılır. Her bir tür, farklı saldırı vektörleri ve yayılma yöntemleri kullanır.\n\nKorunma yöntemleri arasında güncel antivirüs yazılımları kullanmak, işletim sistemi ve uygulamaları düzenli olarak güncellemek, bilinmeyen kaynaklardan dosya indirmemek ve e-posta eklerini dikkatli açmak yer alır. Ayrıca güvenlik duvarı (firewall) kullanmak ve ağ trafiğini izlemek de önemli önlemler arasındadır.\n\nKurumsal ortamlarda, uç nokta koruma platformları (EPP), uç nokta tespit ve yanıt (EDR) çözümleri ve ağ tabanlı tehdit algılama sistemleri (NIDS) kullanılması önerilir. Sandbox ortamlarında şüpheli dosyaların analiz edilmesi ve düzenli yedekleme stratejilerinin uygulanması da kritik öneme sahiptir.\n\nSalus AI olarak, sistemlerinizi zararlı yazılımlara karşı taramak ve potansiyel tehditleri tespit etmek için gelişmiş analiz araçları sunuyoruz. Düzenli tarama ve izleme ile güvenlik seviyenizi en üst düzeyde tutabilirsiniz.`
    ]
  },
  oltalama: {
    anahtarKelimeler: ['phishing', 'oltalama', 'sahte mail', 'sahte e-posta', 'sosyal mühendislik', 'social engineering', 'kimlik avı', 'dolandırıcılık'],
    yanitlar: [
      `Oltalama (phishing) saldırıları, siber güvenlik dünyasında en yaygın ve tehlikeli saldırı türlerinden biridir. Bu saldırılarda, saldırganlar güvenilir kurum veya kişileri taklit ederek kullanıcıların hassas bilgilerini (şifre, kredi kartı bilgileri, kişisel veriler) ele geçirmeye çalışır. E-posta, SMS (smishing), telephone (vishing) ve sahte web siteleri aracılığıyla gerçekleştirilebilir.\n\nOltalama saldırılarını tespit etmek için dikkat edilmesi gereken işaretler şunlardır: acil eylem çağrısı içeren mesajlar, yazım hataları barındıran e-postalar, şüpheli bağlantı adresleri, bilinmeyen göndericilerden gelen ekler ve kişisel bilgi talep eden mesajlar. URL'leri dikkatli kontrol etmek, SSL sertifikasını doğrulamak ve gönderici adresini incelemek temel korunma adımlarıdır.\n\nKurumsal düzeyde, çalışan farkındalık eğitimleri düzenlemek, e-posta filtreleme sistemleri kurmak, çok faktörlü kimlik doğrulama (MFA) uygulamak ve düzenli oltalama simülasyonları yapmak etkili koruma yöntemleridir. DMARC, SPF ve DKIM gibi e-posta doğrulama protokollerinin yapılandırılması da önemlidir.\n\nSalus AI, şüpheli URL'leri ve e-posta bağlantılarını analiz ederek oltalama girişimlerini tespit etmenize yardımcı olur. Tehdit istihbarat veritabanımız sürekli güncellenerek en son oltalama kampanyalarına karşı koruma sağlar.`
    ]
  },
  guvenlikDuvari: {
    anahtarKelimeler: ['firewall', 'güvenlik duvarı', 'ateş duvarı', 'waf', 'ids', 'ips', 'saldırı tespit', 'saldırı önleme', 'intrusion'],
    yanitlar: [
      `Güvenlik duvarı (firewall), ağ trafiğini izleyen ve önceden belirlenmiş güvenlik kurallarına göre gelen ve giden trafiği filtreleyen bir ağ güvenlik sistemidir. Donanım tabanlı, yazılım tabanlı veya bulut tabanlı olarak uygulanabilir. Temel türleri arasında paket filtreleme, durum denetimli (stateful), uygulama katmanı ve yeni nesil güvenlik duvarları (NGFW) yer alır.\n\nYeni nesil güvenlik duvarları (NGFW), geleneksel güvenlik duvarı özelliklerinin yanı sıra derin paket inceleme (DPI), saldırı önleme sistemi (IPS), uygulama farkındalığı ve SSL/TLS şifre çözme gibi gelişmiş yetenekler sunar. Web uygulama güvenlik duvarı (WAF) ise özellikle web uygulamalarını SQL enjeksiyonu, XSS ve CSRF gibi saldırılara karşı korur.\n\nEtkili bir güvenlik duvarı yapılandırması için en az yetki ilkesi uygulanmalı, varsayılan olarak tüm trafik reddedilmeli ve yalnızca gerekli portlar ve protokoller açılmalıdır. Kural setleri düzenli olarak gözden geçirilmeli, günlükler merkezi bir SIEM sistemine gönderilmeli ve anomali tespiti için yapay zeka destekli analiz kullanılmalıdır.\n\nSalus AI platformu, güvenlik duvarı yapılandırmalarınızı analiz ederek potansiyel zayıflıkları tespit eder ve en iyi uygulamalara uygun öneriler sunar. Ağ trafiği analizi ile şüpheli aktiviteleri gerçek zamanlı olarak izleyebilirsiniz.`
    ]
  },
  sifreleme: {
    anahtarKelimeler: ['şifreleme', 'encryption', 'kriptografi', 'aes', 'rsa', 'ssl', 'tls', 'hash', 'hashing', 'md5', 'sha', 'sertifika', 'certificate', 'https'],
    yanitlar: [
      `Şifreleme (encryption), verileri yetkisiz erişime karşı korumak için düz metni (plaintext) okunamaz bir formata (ciphertext) dönüştürme işlemidir. Simetrik şifreleme (AES, DES, 3DES) ve asimetrik şifreleme (RSA, ECC, DSA) olmak üzere iki temel yöntemi vardır. Modern güvenlik sistemlerinde genellikle her iki yöntem birlikte kullanılır.\n\nSSL/TLS protokolleri, internet üzerindeki iletişimi şifreleyerek güvenli hale verir. HTTPS, web trafiğinin TLS ile şifrelenmesidir. Dijital sertifikalar, sunucu kimliğini doğrulamak için kullanılır ve güvenilir sertifika otoriteleri (CA) tarafından imzalanır. Let's Encrypt gibi ücretsiz sertifika sağlayıcıları da mevcuttur.\n\nHash fonksiyonları (SHA-256, SHA-3, bcrypt, Argon2) ise tek yönlü şifreleme için kullanılır ve özellikle parola saklamada kritik öneme sahiptir. MD5 ve SHA-1 artık güvenli kabul edilmemektedir. Parola hash'leme için bcrypt, scrypt veya Argon2 algoritmaları önerilir. Tuzlama (salting) işlemi, rainbow table saldırılarına karşı koruma sağlar.\n\nSalus AI, şifreleme uygulamalarınızı değerlendirerek zayıf algoritma kullanımı, süresi dolmuş sertifikalar ve güvensiz yapılandırmalar gibi sorunları tespit eder. Uçtan uca şifreleme stratejileri oluşturmanıza yardımcı olur.`
    ]
  },
  agGuvenligi: {
    anahtarKelimeler: ['ağ güvenliği', 'network security', 'vpn', 'dns', 'ddos', 'dos', 'tcp', 'udp', 'port', 'ağ', 'network', 'ip adresi', 'subnet', 'vlan', 'proxy', 'nat'],
    yanitlar: [
      `Ağ güvenliği, bilgisayar ağlarını yetkisiz erişim, kötüye kullanım, değişiklik veya hizmet reddi saldırılarından korumak için uygulanan politika, süreç ve teknolojilerin bütünüdür. Temel bileşenleri arasında güvenlik duvarları, VPN'ler, IDS/IPS sistemleri, ağ segmentasyonu ve erişim kontrol listeleri (ACL) yer alır.\n\nDDoS (Dağıtık Hizmet Reddi) saldırıları, bir hedefe aşırı trafik göndererek hizmeti kullanılamaz hale getirmeyi amaçlar. Bu saldırılara karşı korunmak için CDN hizmetleri, trafik analiz araçları, rate limiting ve anycast ağ mimarileri kullanılabilir. DNS güvenliği için DNSSEC uygulanması ve DNS sorgularının şifrelenmesi (DoH/DoT) önerilir.\n\nVPN (Sanal Özel Ağ), internet üzerinde şifrelenmiş bir tünel oluşturarak güvenli uzak erişim sağlar. IPSec, OpenVPN, WireGuard ve L2TP/IPSec gibi protokoller kullanılır. Zero Trust (Sıfır Güven) modeli, modern ağ güvenliğinin temel yaklaşımı olup "asla güvenme, her zaman doğrula" prensibine dayanır.\n\nSalus AI, ağ altyapınızı tarayarak açık portları, güvensiz servisleri ve potansiyel saldırı yüzeylerini tespit eder. Ağ trafiği analizi ile anormal aktiviteleri belirleyerek proaktif güvenlik önlemleri almanıza yardımcı olur.`
    ]
  },
  zafiyetDegerlendirme: {
    anahtarKelimeler: ['zafiyet', 'vulnerability', 'güvenlik açığı', 'cve', 'exploit', 'istismar', 'yama', 'patch', 'güncelleme', 'pentest', 'penetrasyon', 'sızma testi', 'owasp', 'sql injection', 'xss', 'csrf'],
    yanitlar: [
      `Zafiyet değerlendirmesi, bilgi sistemlerindeki güvenlik açıklarını sistematik olarak tespit etme, sınıflandırma ve önceliklendirme sürecidir. Bu süreçte otomatik tarama araçları (Nessus, OpenVAS, Qualys), manuel testler ve kod incelemeleri kullanılır. CVE (Common Vulnerabilities and Exposures) ve CVSS (Common Vulnerability Scoring System) standartları ile zafiyetler evrensel olarak tanımlanır ve derecelendirilir.\n\nPenetrasyon testi (pentest), bir sistemin güvenlik kontrollerini test etmek için yetkili simüle edilmiş saldırılar gerçekleştirme sürecidir. Kara kutu, beyaz kutu ve gri kutu olmak üzere üç ana yaklaşımı vardır. OWASP Top 10, web uygulamalarındaki en kritik güvenlik risklerini listeler ve SQL Injection, XSS, CSRF, güvensiz doğrudan nesne referansları gibi yaygın zafiyetleri kapsar.\n\nZafiyet yönetim yaşam döngüsü şu adımlardan oluşur: keşif, önceliklendirme, iyileştirme, doğrulama ve raporlama. Kritik zafiyetler derhal yamalanmalı, yüksek riskli olanlar 30 gün içinde, orta riskli olanlar 90 gün içinde giderilmelidir. Düzenli zafiyet taramaları ve penetrasyon testleri güvenlik duruşunuzu sürekli iyileştirir.\n\nSalus AI platformu, hedef sistemlerinizi kapsamlı bir şekilde tarayarak bilinen zafiyetleri tespit eder, risk seviyelerini değerlendirir ve önceliklendirme yaparak iyileştirme önerileri sunar. Sürekli izleme ile yeni ortaya çıkan tehditlere karşı sizi anında bilgilendirir.`
    ]
  },
  sifrePolitikasi: {
    anahtarKelimeler: ['şifre', 'parola', 'password', 'güçlü şifre', 'iki faktörlü', '2fa', 'mfa', 'kimlik doğrulama', 'authentication', 'oturum', 'session'],
    yanitlar: [
      `Güçlü şifre politikaları, siber güvenliğin temel taşlarından biridir. Modern şifre standartları, en az 12 karakter uzunluğunda, büyük-küçük harf, rakam ve özel karakter kombinasyonları içeren şifrelerin kullanılmasını önerir. NIST'in güncel kılavuzlarına göre, şifre karmaşıklık kurallarından ziyade uzunluk ve tahmin edilemezlik daha önemlidir.\n\nÇok faktörlü kimlik doğrulama (MFA/2FA), güvenlik katmanını önemli ölçüde artırır. Bildiğiniz bir şey (şifre), sahip olduğunuz bir şey (telefon, güvenlik anahtarı) ve olduğunuz bir şey (biyometrik) olmak üzere en az iki faktörün birlikte kullanılmasını gerektirir. TOTP uygulamaları (Google Authenticator, Authy) veya FIDO2/WebAuthn donanım anahtarları (YubiKey) en güvenli MFA yöntemleridir.\n\nŞifre yöneticileri (password managers) kullanarak her hesap için benzersiz ve güçlü şifreler oluşturabilirsiniz. Kurumsal ortamlarda, Active Directory şifre politikaları, hesap kilitleme mekanizmaları ve düzenli şifre denetimleri uygulanmalıdır. Şifrelerin düz metin olarak saklanması kesinlikle kabul edilemez; bcrypt, Argon2 veya PBKDF2 gibi güvenli hash algoritmları kullanılmalıdır.\n\nSalus AI, kuruluşunuzun şifre politikalarını değerlendirerek zayıf noktaları tespit eder ve endüstri standartlarına uygun iyileştirme önerileri sunar. Sızdırılmış şifre veritabanlarıyla karşılaştırma yaparak risk altındaki hesapları belirler.`
    ]
  },
  genelGuvenlik: {
    anahtarKelimeler: ['güvenlik', 'siber güvenlik', 'cybersecurity', 'güvenli', 'koruma', 'savunma', 'risk', 'tehdit', 'saldırı', 'attack', 'defense', 'breach', 'ihlal', 'veri sızıntısı'],
    yanitlar: [
      `Siber güvenlik, dijital varlıkları, sistemleri ve ağları yetkisiz erişim, saldırı ve hasardan korumak için uygulanan kapsamlı bir disiplindir. Modern siber güvenlik yaklaşımı, önleme, tespit, müdahale ve kurtarma olmak üzere dört temel aşamadan oluşur. Defense-in-depth (derinlemesine savunma) stratejisi, birden fazla güvenlik katmanı oluşturarak tek bir noktadaki başarısızlığın tüm sistemi tehlikeye atmasını engeller.\n\nTemel siber güvenlik uygulamaları arasında düzenli yazılım güncellemeleri, güçlü erişim kontrolü, ağ segmentasyonu, veri şifreleme, yedekleme stratejileri ve olay müdahale planları yer alır. SIEM (Security Information and Event Management) sistemleri, güvenlik olaylarını merkezi olarak izlemek ve analiz etmek için kullanılır.\n\nSiber güvenlik çerçeveleri (NIST CSF, ISO 27001, CIS Controls) kuruluşların güvenlik programlarını yapılandırmalarına yardımcı olur. Risk değerlendirmesi, varlık envanteri, tehdit modelleme ve güvenlik açığı yönetimi süreçlerinin düzenli olarak uygulanması kritik öneme sahiptir. Çalışan güvenlik farkındalık eğitimleri de insan faktöründen kaynaklanan riskleri azaltır.\n\nSalus AI, kapsamlı siber güvenlik çözümleri sunarak dijital varlıklarınızı korumaya yardımcı olur. Tehdit istihbaratı, zafiyet taraması, güvenlik değerlendirmesi ve sürekli izleme hizmetleri ile güvenlik duruşunuzu güçlendirir.`
    ]
  }
};

const varsayilanYanit = `Merhaba! Ben Salus AI siber güvenlik asistanıyım. Size aşağıdaki konularda yardımcı olabilirim:

• **Zararlı Yazılımlar**: Virüs, truva atı, fidye yazılımı ve diğer kötü amaçlı yazılımlar hakkında bilgi
• **Oltalama Saldırıları**: Phishing, sosyal mühendislik ve kimlik avı korunma yöntemleri
• **Güvenlik Duvarı**: Firewall yapılandırması, IDS/IPS ve ağ koruması
• **Şifreleme**: SSL/TLS, AES, RSA ve kriptografi konuları
• **Ağ Güvenliği**: VPN, DDoS koruması, DNS güvenliği
• **Zafiyet Değerlendirmesi**: Penetrasyon testi, CVE analizi, OWASP standartları
• **Şifre Politikaları**: Güçlü şifre oluşturma, MFA/2FA, kimlik doğrulama

Siber güvenlik ile ilgili herhangi bir konuda soru sorabilirsiniz. Detaylı ve profesyonel yanıtlar sunmaya hazırım.`;

module.exports = {
  siberGuvenlikYanitlari,
  varsayilanYanit
};
