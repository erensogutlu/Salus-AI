"""
Salus AI - CVE Zafiyet Sorgulama Modülü
========================================
Bu modül, kritik siber güvenlik açıklarını (CVE) sorgulamak, CVSS risk puanlarını
ve iyileştirme adımlarını sunmak için yerleşik bir bilgi tabanı ve arama
motoru sağlar.

Node.js ve Python modül yöneticisi entegrasyonuna uygundur.
"""

import sys
import json
import io
import re
import urllib.request
from typing import Dict, Any, List
import salus_common

# utf-8 standart giriş/çıkış yapılandırması
salus_common.reconfigure_utf8()

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 43
VERSION: str = "1.0.0"
DESCRIPTION: str = "Kritik CVE zafiyet veri tabanı ve arama aracı"
AUTHOR: str = "Salus AI"

# kritik ve popüler cve veritabanı
CVE_DATABASE: Dict[str, Dict[str, Any]] = {
    "CVE-2021-44228": {
        "ad": "Log4Shell",
        "urun": "Apache Log4j2 (v2.0-beta9 - v2.14.1)",
        "cvss": 10.0,
        "seviye": "Kritik 🔴",
        "aciklama": "Apache Log4j2 kütüphanesindeki JNDI özelliklerinin güvensiz çözümlenmesi sonucu saldırganların hedef sunucu üzerinde uzaktan kod yürütmesine (RCE) olanak tanır.",
        "cozum": "Log4j sürümünü en az 2.17.1'e yükseltin. Geçici çözüm olarak `log4j2.formatMsgNoLookups=true` parametresini JVM argümanlarına ekleyin."
    },
    "CVE-2017-0144": {
        "ad": "EternalBlue",
        "urun": "Microsoft Windows Server 2003/2008/2012/2016, Windows Vista/7/8.1/10 (SMBv1)",
        "cvss": 8.1,
        "seviye": "Kritik 🔴",
        "aciklama": "Windows SMBv1 protokolündeki arabellek taşması açığı. WannaCry ve Petya fidye yazılımları tarafından dünya genelinde sistemleri ele geçirmek için kullanılmıştır.",
        "cozum": "Microsoft MS17-010 güvenlik güncelleştirmesini acilen yükleyin ve SMBv1 protokolünü sistem düzeyinde devre dışı bırakın."
    },
    "CVE-2014-0160": {
        "ad": "Heartbleed",
        "urun": "OpenSSL (1.0.1 - 1.0.1f)",
        "cvss": 7.5,
        "seviye": "Yüksek 🟠",
        "aciklama": "OpenSSL TLS Heartbeat eklentisindeki bellek sınır kontrolü hatası. Saldırganların sunucu belleğinden şifreleri, özel anahtarları (private keys) ve kullanıcı oturum verilerini sızdırmasına izin verir.",
        "cozum": "OpenSSL sürümünü acilen 1.0.1g veya üzerine güncelleyin. Eski SSL sertifikalarını ve özel anahtarlarını geçersiz kılarak yenileyin."
    },
    "CVE-2021-34473": {
        "ad": "ProxyShell (ProxyLogon bileşeni)",
        "urun": "Microsoft Exchange Server 2013, 2016, 2019",
        "cvss": 9.8,
        "seviye": "Kritik 🔴",
        "aciklama": "Microsoft Exchange sunucularında IIS bileşenindeki yetkilendirme atlatma ve arkasından Powershell aracılığıyla RCE (uzaktan kod yürütme) açığı.",
        "cozum": "Microsoft KB5001779 veya en güncel Exchange Server toplu güncelleştirmelerini (Cumulative Updates) yükleyin."
    },
    "CVE-2023-38408": {
        "ad": "OpenSSH Agent Forwarding RCE",
        "urun": "OpenSSH (v4.0p1 - v9.3p1)",
        "cvss": 8.1,
        "seviye": "Yüksek 🟠",
        "aciklama": "OpenSSH ssh-agent aracı üzerinde PKCS#11 sağlayıcılarının yüklenmesi sırasında oluşan ve agent forwarding aktifken kurban sunucuda RCE sağlayan güvenlik açığı.",
        "cozum": "OpenSSH sürümünü 9.3p2 veya daha yeni bir sürüme yükseltin. `ssh-agent` yönlendirmesini yalnızca kesinlikle gerektiğinde kullanın."
    },
    "CVE-2022-22965": {
        "ad": "Spring4Shell",
        "urun": "Spring Framework (JDK 9+ kullanan v5.3.0-17, v5.2.0-19)",
        "cvss": 9.8,
        "seviye": "Kritik 🔴",
        "aciklama": "Spring Framework'teki veri bağlama (Data Binding) mekanizmasının sınıf yükleyicisini (class loader) manipüle etmesi sonucu Apache Tomcat üzerinde web shell yüklenmesine yol açan RCE açığı.",
        "cozum": "Spring Framework sürümünü 5.3.18 veya 5.2.20'ye yükseltin. Tomcat ve JDK güncellemelerini uygulayın."
    },
    "CVE-2014-6271": {
        "ad": "Shellshock",
        "urun": "GNU Bash (v4.3 ve öncesi)",
        "cvss": 10.0,
        "seviye": "Kritik 🔴",
        "aciklama": "GNU Bash kabuğunun çevre değişkenlerindeki (environment variables) fonksiyon tanımlamalarını ayrıştırırken hata yapması sonucu CGI betikleri üzerinden yetkisiz kod yürütme zafiyeti.",
        "cozum": "Bash paketini dağıtımınızın yayınladığı en güncel güvenlik yamasıyla güncelleyin (`apt-get install --only-upgrade bash` vb.)."
    },
    "CVE-2024-3094": {
        "ad": "XZ Utils Arka Kapı Zafiyeti",
        "urun": "XZ Utils / liblzma (v5.6.0 ve v5.6.1)",
        "cvss": 10.0,
        "seviye": "Kritik 🔴",
        "aciklama": "XZ Utils sıkıştırma kütüphanesine kasıtlı olarak eklenmiş bir arka kapı (backdoor). OpenSSH (sshd) üzerinden yetkisiz uzaktan erişime ve kod yürütülmesine izin verebilir.",
        "cozum": "XZ Utils sürümünü etkilenmeyen güvenli bir sürüme (örn: 5.4.6) acilen düşürün (downgrade) veya dağıtımınızın yamalanmış sürümüne geçin."
    },
    "CVE-2023-49103": {
        "ad": "ownCloud Graph API Bilgi Sızıntısı",
        "urun": "ownCloud graphapi (v0.2.0 - v0.3.0)",
        "cvss": 10.0,
        "seviye": "Kritik 🔴",
        "aciklama": "ownCloud Graph API eklentisinde yetkisiz erişimle PHP ortam değişkenlerinin (environment variables) sızdırılması zafiyeti. Docker ortamlarında admin parolaları ve lisans anahtarları gibi kritik sırlar sızdırılabilir.",
        "cozum": "ownCloud graphapi eklentisini devre dışı bırakın veya 0.3.1+ sürümüne güncelleyin. Docker container ortamlarındaki sırları (secrets) değiştirin."
    },
    "CVE-2024-21626": {
        "ad": "runc Container Escape (Konteyner Kaçış) Açığı",
        "urun": "runc (v1.0.0-rc93 - v1.1.11)",
        "cvss": 8.6,
        "seviye": "Yüksek 🟠",
        "aciklama": "runc bileşenindeki dosya tanımlayıcısı (file descriptor) sızıntısı. Saldırganların konteyner içinden ana işletim sisteminin dosya yapısına sızmasına ve yetkisiz komut çalıştırmasına (escape) olanak verir.",
        "cozum": "runc paketini 1.1.12 veya daha yeni bir sürüme acilen yükseltin."
    }
}

def can_handle(message: str) -> bool:
    """Modülün gelen CVE sorgu komutlarını işleyip işlemeyeceğini kontrol eder."""
    msg = message.lower().strip()
    return msg.startswith("cve ") or msg.startswith("cve sorgula") or msg.startswith("zafiyet sorgula")

def terim_ayikla(message: str) -> str:
    """Komuttan aranacak CVE kodunu veya terimini ayıklar."""
    parcalar = message.split()
    if message.lower().startswith("cve sorgula"):
        hedef = " ".join(parcalar[2:])
    elif message.lower().startswith("zafiyet sorgula"):
        hedef = " ".join(parcalar[2:])
    else:
        hedef = " ".join(parcalar[1:])
    return hedef.strip()

def execute(message: str) -> str:
    """CVE sorgulamasını yürütür ve markdown formatında rapor üretir."""
    terim = terim_ayikla(message)
    if not terim:
        return "Lütfen sorgulanacak CVE kodunu veya yazılım adını belirtin. Örnek: `cve CVE-2021-44228` veya `cve apache`"
        
    md = f"## 🔍 CVE Güvenlik Açığı Raporu\n\n"
    
    # 1. tam eşleşme kontrolü (örn: cve-2021-44228 formatı)
    cve_kodu = terim.upper()
    
    if cve_kodu in CVE_DATABASE:
        data = CVE_DATABASE[cve_kodu]
        md += f"### {cve_kodu}: {data['ad']}\n"
        md += f"- **Etkilenen Yazılım/Ürün:** `{data['urun']}`\n"
        md += f"- **CVSS Derecesi:** `{data['cvss']}/10.0` ({data['seviye']})\n\n"
        md += f"####  Zafiyet Açıklaması\n"
        md += f"{data['aciklama']}\n\n"
        md += f"#### 🛡️ İyileştirme ve Çözüm Adımları\n"
        md += f"{data['cozum']}\n"
        return md
        
    # 2. genel arama kontrolü (keywords)
    arama_sonuclari = []
    terim_lower = terim.lower()
    
    for cve, data in CVE_DATABASE.items():
        if (terim_lower in cve.lower() or 
            terim_lower in data["ad"].lower() or 
            terim_lower in data["urun"].lower() or 
            terim_lower in data["aciklama"].lower()):
            arama_sonuclari.append((cve, data))
            
    if arama_sonuclari:
        md += f"**'{terim}'** terimiyle eşleşen yerel veritabanı kayıtları:\n\n"
        for cve, data in arama_sonuclari:
            md += f"#### 🔴 {cve}: {data['ad']} ({data['seviye']})\n"
            md += f"- **Etkilenen Ürün:** `{data['urun']}` (CVSS: `{data['cvss']}`)\n"
            md += f"- **Açıklama:** {data['aciklama']}\n"
            md += f"- **Çözüm:** *{data['cozum']}*\n\n"
            md += "---\n\n"
        return md
        
    # 3. veritabanında bulunamadıysa dinamik cve apı fallback ve bilgilendirme
    cve_pattern = r'^CVE-\d{4}-\d{4,7}$'
    if re.match(cve_pattern, cve_kodu):
        try:
            req = urllib.request.Request(
                f"https://cve.circl.lu/api/cve/{cve_kodu}",
                headers={'User-Agent': 'Mozilla/5.0 SalusAI/2.1'}
            )
            with urllib.request.urlopen(req, timeout=2.5) as response:
                api_data = json.loads(response.read().decode('utf-8'))
                if api_data and "summary" in api_data:
                    summary = api_data.get("summary", "Açıklama bulunamadı.")
                    cvss = api_data.get("cvss", "Bilinmiyor")
                    
                    seviye = "Bilinmiyor ⚪"
                    if isinstance(cvss, (int, float)):
                        if cvss >= 9.0:
                            seviye = "Kritik 🔴"
                        elif cvss >= 7.0:
                            seviye = "Yüksek 🟠"
                        elif cvss >= 4.0:
                            seviye = "Orta 🟡"
                        else:
                            seviye = "Düşük 🟢"
                    
                    md += f"### {cve_kodu}: {api_data.get('Ad', 'Canlı API Çıktısı')}\n"
                    md += f"- **CVSS Derecesi:** `{cvss}/10.0` ({seviye})\n\n"
                    md += f"####  Zafiyet Açıklaması\n"
                    md += f"{summary}\n\n"
                    md += f"#### 🛡️ İyileştirme ve Çözüm Adımları\n"
                    md += "Bu siber güvenlik açığı için resmi satıcı yamalarını yükleyin. Detaylı bilgi için aşağıdaki bağlantıları takip edebilirsiniz:\n"
                    md += f"- [NIST National Vulnerability Database (NVD)](https://nvd.nist.gov/vuln/detail/{cve_kodu})\n"
                    md += f"- [MITRE CVE List](https://cve.mitre.org/cgi-bin/cvename.cgi?name={cve_kodu})\n"
                    return md
        except Exception:
            pass

        md += f"### ⚠️ {cve_kodu} Kaydı Çevrimdışı/Çevrimiçi Veritabanlarında Bulunmuyor\n"
        md += "Belirttiğiniz CVE kodu geçerli bir formattadır ancak veritabanlarımızda yer almamaktadır.\n\n"
        md += "#### 🌐 NVD ve MITRE Sorgulama Bağlantıları\n"
        md += f"Bu zafiyet hakkında resmi veritabanlarından bilgi edinmek için aşağıdaki bağlantıları kullanabilirsiniz:\n"
        md += f"- [NIST National Vulnerability Database (NVD)](https://nvd.nist.gov/vuln/detail/{cve_kodu})\n"
        md += f"- [MITRE CVE List](https://cve.mitre.org/cgi-bin/cvename.cgi?name={cve_kodu})\n"
        return md
        
    # kelime araması bulunamadıysa öneri sunalım
    md += f"❌ **'{terim}'** ile ilgili yerel veritabanımızda kritik bir güvenlik açığı kaydı bulunamadı.\n\n"
    md += "Aramak istediğiniz zafiyeti `CVE-2021-44228` formatında girmeyi deneyebilir veya `apache`, `windows`, `ssh`, `openssl` gibi genel kelimelerle sorgulama yapabilirsiniz.\n"
    return md