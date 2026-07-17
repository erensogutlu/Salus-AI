"""
Salus AI - Subdomain Keşif ve Alt Alan Adı Devralma (Takeover) Tespiti
====================================================================
Bu modül, hedef domain'e ait alt alan adlarını (subdomain) crt.sh (Certificate Transparency)
günlükleri üzerinden ve yedekli olarak HackerTarget API'si üzerinden keşfeder.

Keşfedilen her alt alan adı için DNS çözümlemesi yapar, CNAME kayıtlarını sorgulayarak
bulut sağlayıcılara (AWS, GitHub Pages, Netlify vb.) yönlenmiş sahipsiz subdomain'leri (Takeover)
tespit eder ve HTTP yanıt durum kodlarını inceler.
"""

import sys
import json
import io
import urllib.request
import urllib.error
import socket
import concurrent.futures
import time
import secrets
from typing import List, Dict, Tuple, Set, Optional, Any
import salus_common

# utf-8 standart giriş/çıkış yapılandırması
salus_common.reconfigure_utf8()

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 35
VERSION: str = "2.1.0"
DESCRIPTION: str = "Yedekli sertifika günlüğü subdomain keşif ve takeover tarayıcı"
AUTHOR: str = "Salus AI"

# bilinen subdomain takeover (alt alan adı devralma) cname ımza tablosu
# format: "imza_cname": "bulut servis sağlayıcı adı"
TAKEOVER_IMZALARI: Dict[str, str] = {
    "github.io": "GitHub Pages",
    "herokudns.com": "Heroku",
    "herokussl.com": "Heroku",
    "s3.amazonaws.com": "AWS S3 Bucket",
    "s3-website": "AWS S3 Website",
    "azurewebsites.net": "Azure App Service",
    "trafficmanager.net": "Azure Traffic Manager",
    "cloudfront.net": "AWS CloudFront",
    "fastly.net": "Fastly CDN",
    "zendesk.com": "Zendesk Helppage",
    "helpscoutdocs.com": "HelpScout Docs",
    "readme.io": "ReadMe.io",
    "ghost.io": "Ghost Blog",
    "pantheonsite.io": "Pantheon",
    "myshopify.com": "Shopify Store",
    "bitbucket.io": "Bitbucket Cloud",
    "surge.sh": "Surge.sh static web",
    "strikinglydns.com": "Strikingly",
    "webflow.io": "Webflow Site",
    "netlify.app": "Netlify static site",
    "vercel.app": "Vercel static site",
    "fly.dev": "Fly.io app",
    "firebaseapp.com": "Firebase Hosting"
}


def can_handle(message: str) -> bool:
    """Modülün subdomain keşif isteklerini sahiplenip sahiplenmeyeceğini kontrol eder.

    Args:
        message (str): Gelen mesaj.

    Returns:
        bool: Eşleşme durumunda True.
    """
    msg = message.lower().strip()
    return msg.startswith("subdomain") or msg.startswith("alt alan")


def wildcard_dns_kontrolu(domain: str) -> bool:
    """Hedef altyapıda Wildcard (*) DNS yapılandırması olup olmadığını tespit eder.

    Args:
        domain (str): Hedef ana alan adı.

    Returns:
        bool: Wildcard DNS aktif ise True.
    """
    rastgele_sub = secrets.token_hex(8) + "." + domain
    try:
        socket.gethostbyname(rastgele_sub)
        return True
    except socket.gaierror:
        return False


def cname_getir(subdomain: str) -> Optional[str]:
    """Alt alan adının kanonik ismini (CNAME) soket katmanında çözümlemeye çalışır.

    Args:
        subdomain (str): Çözümlenecek subdomain.

    Returns:
        Optional[str]: CNAME hedef adresi veya yoksa None.
    """
    try:
        # socket.getaddrinfo ile aı_canonname kullanılarak kanonik isim (cname) çekilir
        sonuc = socket.getaddrinfo(subdomain, None, 0, socket.SOCK_STREAM, 0, socket.AI_CANONNAME)
        canon = sonuc[0][3]
        if canon and canon.lower() != subdomain.lower():
            return canon.lower()
    except Exception:
        pass
    return None


def subdomain_dogrula(subdomain: str) -> Dict[str, Any]:
    """Subdomain'i DNS çözümlemesinden geçirir, HTTP isteğiyle kontrol eder ve takeover riskini ölçer.

    Args:
        subdomain (str): Doğrulanacak subdomain.

    Returns:
        Dict[str, Any]: Durum, IP, CNAME ve Risk analiz verisi.
    """
    ip = "-"
    durum = "Yanıtsız"
    risk = "Düşük 🟢"
    cname_val = "-"
    
    # 1. dns çözümleme
    try:
        ip = socket.gethostbyname(subdomain)
    except socket.gaierror:
        return {
            "subdomain": subdomain,
            "ip": "-",
            "durum": "DNS Çözümlenemedi",
            "risk": "Yok",
            "cname": "-"
        }
        
    # 2. cname sorgusu ve takeover analizi
    cname = cname_getir(subdomain)
    if cname:
        cname_val = cname
        for imza, saglayici in TAKEOVER_IMZALARI.items():
            if imza in cname:
                risk = f"Kritik (Takeover: {saglayici} 🔴)"
                break
                
    # 3. http istek kontrolü (hızlı zaman aşımı)
    try:
        req = urllib.request.Request(
            f"http://{subdomain}",
            headers={'User-Agent': 'Mozilla/5.0 SalusAI/2.1'}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            durum = str(response.getcode())
    except urllib.error.HTTPError as e:
        durum = str(e.code)
        # bulut servisleri 404 veriyorsa ve cname biliniyorsa takeover ihtimalini yükseltir
        if e.code == 404 and "Kritik" not in risk:
            risk = "Orta 🟠 (404 Potansiyel Risk)"
    except Exception:
        pass
        
    return {
        "subdomain": subdomain,
        "ip": ip,
        "durum": durum,
        "risk": risk,
        "cname": cname_val
    }


def crt_sh_sorgula(domain: str) -> Set[str]:
    """crt.sh veritabanını sorgulayarak sertifika şeffaflık kayıtlarından subdomain'leri çeker.

    Args:
        domain (str): Hedef alan adı.

    Returns:
        Set[str]: Keşfedilen subdomain kümesi.
    """
    bulunanlar: Set[str] = set()
    url = f"https://crt.sh/?q=%25.{domain}&output=json"
    
    # retry (tekrar deneme) mekanizması
    for deneme in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=12) as response:
                veri = json.loads(response.read().decode('utf-8'))
                for kayit in veri:
                    ad = kayit.get("name_value", "").lower()
                    for alt_ad in ad.split("\n"):
                        alt_ad = alt_ad.strip()
                        if alt_ad and not alt_ad.startswith("*.") and alt_ad.endswith(domain):
                            bulunanlar.add(alt_ad)
                return bulunanlar
        except Exception as e:
            time.sleep(1.5 * (deneme + 1))
            
    return bulunanlar


def hackertarget_sorgula(domain: str) -> Set[str]:
    """Yedek kaynak olarak HackerTarget API'sinden subdomain araması yapar.

    Args:
        domain (str): Hedef domain.

    Returns:
        Set[str]: Keşfedilen subdomain kümesi.
    """
    bulunanlar: Set[str] = set()
    url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8) as response:
            ham_veri = response.read().decode('utf-8')
            for satir in ham_veri.splitlines():
                if "," in satir:
                    alt_ad = satir.split(",")[0].strip().lower()
                    if alt_ad.endswith(domain) and not alt_ad.startswith("*."):
                        bulunanlar.add(alt_ad)
    except Exception:
        pass
    return bulunanlar


def execute(message: str) -> str:
    """Subdomain keşfini ve takeover analizini yürütür, markdown raporu üretir.

    Args:
        message (str): Kullanıcı komutu.

    Returns:
        str: Keşif ve risk raporu tablosu.
    """
    parcalar = message.split()
    if len(parcalar) < 2:
        return "Lütfen sorgulanacak alan adını belirtin. Örnek: `subdomain google.com`"
        
    hedef = salus_common.clean_domain_or_ip(message, "subdomain" if message.lower().startswith("subdomain") else "alt alan")

    md = f"## 🗺️ Gelişmiş Subdomain Keşif Raporu: `{hedef}`\n\n"
    
    # 1. wildcard dns durum tespiti
    is_wildcard = wildcard_dns_kontrolu(hedef)
    if is_wildcard:
        md += "> ⚠️ **Önemli Uyarı:** Hedef alan adında **Wildcard DNS (*)** tespit edilmiştir. Rasgele uydurulan alt alan adları bile bir varsayılan IP'ye çözümlenecektir. Bu nedenle aşağıdaki 'Aktif' IP sonuçları yönlendirme sunucusuna (catch-all) ait olabilir.\n\n"

    # 2. çok kaynaklı alt alan adı toplama
    # crt.sh ve hackertarget paralel sorgulanır
    bulunanlar: Set[str] = set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f_crt = executor.submit(crt_sh_sorgula, hedef)
        f_ht = executor.submit(hackertarget_sorgula, hedef)
        
        # sonuçları kümede birleştir
        bulunanlar.update(f_crt.result())
        bulunanlar.update(f_ht.result())

    if not bulunanlar:
        return md + "❌ **Arama Sonucu:** crt.sh ve yedek API servislerinden hedef alan adına ait herhangi bir alt alan adı kaydı çekilemedi."

    # sonuç sınırlandırması (dos ve zaman aşımı koruması)
    bulunanlar_liste = list(bulunanlar)
    toplam = len(bulunanlar_liste)
    limit = 30
    
    md += f"Ağ istihbarat kaynaklarından toplam **{toplam}** adet alt alan adı tespit edildi.\n"
    if toplam > limit:
        # kararlılık için popüler olanları veya ilk 30'u al
        bulunanlar_liste = bulunanlar_liste[:limit]
        md += f"*(Analiz süresini optimize etmek için en öncelikli {limit} subdomain detaylandırılıyor...)*\n\n"
    else:
        md += "\n"

    md += "| Subdomain | Çözümlenen IP | HTTP Durum | Takeover Riski | CNAME Hedefi |\n"
    md += "|:----------|:--------------|:-----------|:---------------|:-------------|\n"

    # 3. paralel subdomain doğrulama (10 thread worker)
    analiz_sonuclari: List[Dict[str, Any]] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        gelecekler = {executor.submit(subdomain_dogrula, sub): sub for sub in bulunanlar_liste}
        for gelecek in concurrent.futures.as_completed(gelecekler):
            analiz_sonuclari.append(gelecek.result())

    # sıralama: önce dns'i çözülen ve risk seviyesi yüksek olanları listele
    analiz_sonuclari.sort(key=lambda x: (
        x["ip"] == "-",
        "Kritik" not in x["risk"],
        "Orta" not in x["risk"],
        x["subdomain"]
    ))

    for s in analiz_sonuclari:
        cname_kisa = s['cname']
        if len(cname_kisa) > 30:
            cname_kisa = cname_kisa[:27] + "..."
            
        md += f"| `{s['subdomain']}` | `{s['ip']}` | {s['durum']} | {s['risk']} | `{cname_kisa}` |\n"

    md += "\n> 🛡️ **Subdomain Takeover (Alt Alan Adı Devralma) Nedir?**\n"
    md += "> Bir subdomain CNAME kaydı ile bulut sağlayıcılara (örn: AWS S3, GitHub Pages, Netlify) yönlendirilmiş ancak buluttaki ilgili servis silinmiş/bırakılmışsa; bir saldırgan aynı isimle bulut sağlayıcı üzerinde hesap açıp bu alt alan adını kendi kontrolüne geçirebilir. Bu durum itibar kaybı ve kimlik avı saldırılarına yol açar."
    
    return md