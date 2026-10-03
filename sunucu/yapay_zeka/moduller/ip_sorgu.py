"""
salus aı - ıp coğrafi konum ve tehdit istihbaratı sorgulama modülü
===================================================================
bu modül, verilen bir ıpv4, ıpv6 adresi veya domain adının coğrafi konumunu (enlem, boylam, şehir, ülke),
ısp ve asn ağ bilgilerini, ters dns (ptr) kaydını ve vpn/proxy/tor gibi gizlilik ve tehdit durumlarını sorgular.
"""

import sys
import json
import io
import urllib.request
import urllib.error
import socket
from typing import Tuple, Dict, Any, Optional, List

# utf-8 standart giriş/çıkış yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 35
VERSION: str = "2.2.0"
DESCRIPTION: str = "Gelişmiş IP coğrafi konum, koordinat ve tehdit istihbaratı sorgulayıcı"
AUTHOR: str = "Salus AI"


def can_handle(message: str) -> bool:
    """modülün ıp sorgulama isteklerini sahiplenip sahiplenmeyeceğini denetler."""
    msg = message.lower().strip()
    return msg.startswith("ip sorgula") or msg.startswith("ip nedir") or msg.startswith("ip bilgi") or msg.startswith("ip konum")


def reverse_dns_getir(ip: str) -> Optional[str]:
    """verilen ıp adresi için ters dns (ptr) kaydını sorgular."""
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, Exception):
        return None


def host_coz_ip(hedef: str) -> Optional[str]:
    """domain adını ıp adresine dönüştürür veya ıp'yi doğrular."""
    hedef = hedef.replace("https://", "").replace("http://", "").split("/")[0].strip()
    try:
        return socket.gethostbyname(hedef)
    except Exception:
        return None


def api_sorgula(ip: str) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """yedekli ve hata toleranslı ıp istihbaratı apı sorgulaması yapar."""
    # 1. öncelikli kaynak: ipwho.is (enlem, boylam, vpn/tor detayı içerir)
    url_1 = f"https://ipwho.is/{ip}"
    try:
        req = urllib.request.Request(url_1, headers={'User-Agent': 'Mozilla/5.0 SalusAI/2.2'})
        with urllib.request.urlopen(req, timeout=4) as response:
            veri = json.loads(response.read().decode('utf-8'))
            if veri.get("success"):
                return "ipwho", veri
    except Exception:
        pass

    # 2. yedek kaynak: ip-api.com
    url_2 = f"http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query"
    try:
        req = urllib.request.Request(url_2, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as response:
            veri = json.loads(response.read().decode('utf-8'))
            if veri.get("status") == "success":
                return "ip-api", veri
    except Exception:
        pass

    # 3. ikinci yedek kaynak: ipapi.co
    url_3 = f"https://ipapi.co/{ip}/json/"
    try:
        req = urllib.request.Request(url_3, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as response:
            veri = json.loads(response.read().decode('utf-8'))
            if "error" not in veri:
                return "ipapi", veri
    except Exception:
        pass

    return None, None


def execute(message: str) -> str:
    """ıp sorgulama komutunu çalıştırır ve rapor döndürür."""
    parcalar = message.split()
    
    # ip sorgula <ip> veya sadece ip sorgula (boşsa kendi ip)
    if len(parcalar) >= 3:
        hedef_girdi = parcalar[2].strip()
    elif len(parcalar) == 2 and parcalar[1] not in ["sorgula", "nedir", "bilgi", "konum"]:
        hedef_girdi = parcalar[1].strip()
    else:
        hedef_girdi = ""
        
    # eğer hedef girilmediyse veya "kendi" dendiyse
    if not hedef_girdi or hedef_girdi.lower() in ["kendi", "benim", "me"]:
        # genel ip sorgusu için boş bırakıp servise soracağız
        ip_adresi = ""
    else:
        ip_adresi = host_coz_ip(hedef_girdi)
        if not ip_adresi:
            return f"Hatalı IP veya Alan Adı: `{hedef_girdi}`. Lütfen geçerli bir IPv4, IPv6 veya alan adı girin."

    api_kaynagi, veri = api_sorgula(ip_adresi)
    if not veri:
        return "Bağlantı Hatası: IP bilgileri API sunucularından çekilemedi. Lütfen tekrar deneyin."

    # gerçek çözülen ip
    cozulen_ip = veri.get("ip") or veri.get("query") or ip_adresi

    # ters dns sorgulaması
    rdns = reverse_dns_getir(cozulen_ip) if cozulen_ip else None

    # değişkenler
    ulke = "Bilinmiyor"
    ulke_kodu = ""
    sehir = "Bilinmiyor"
    bolge = "Bilinmiyor"
    posta_kodu = "Bilinmiyor"
    enlem = 0.0
    boylam = 0.0
    isp = "Bilinmiyor"
    org = "Bilinmiyor"
    asn = "Bilinmiyor"
    zaman_dilimi = "Bilinmiyor"
    
    is_vpn, is_proxy, is_tor, is_hosting = False, False, False, False

    if api_kaynagi == "ipwho":
        ulke = veri.get("country", "Bilinmiyor")
        ulke_kodu = veri.get("country_code", "")
        sehir = veri.get("city", "Bilinmiyor")
        bolge = veri.get("region", "Bilinmiyor")
        posta_kodu = veri.get("postal", "Bilinmiyor")
        enlem = veri.get("latitude", 0.0)
        boylam = veri.get("longitude", 0.0)
        
        isp = veri.get("connection", {}).get("isp", "Bilinmiyor")
        org = veri.get("connection", {}).get("org", "Bilinmiyor")
        asn = str(veri.get("connection", {}).get("asn", "Bilinmiyor"))
        zaman_dilimi = veri.get("timezone", {}).get("id", "Bilinmiyor")
        
        security = veri.get("security", {})
        is_vpn = security.get("vpn", False)
        is_proxy = security.get("proxy", False)
        is_tor = security.get("tor", False)
        is_hosting = security.get("hosting", False)

    elif api_kaynagi == "ip-api":
        ulke = veri.get("country", "Bilinmiyor")
        ulke_kodu = veri.get("countryCode", "")
        sehir = veri.get("city", "Bilinmiyor")
        bolge = veri.get("regionName", "Bilinmiyor")
        posta_kodu = veri.get("zip", "Bilinmiyor")
        enlem = veri.get("lat", 0.0)
        boylam = veri.get("lon", 0.0)
        isp = veri.get("isp", "Bilinmiyor")
        org = veri.get("org", "Bilinmiyor")
        asn = str(veri.get("as", "Bilinmiyor"))
        zaman_dilimi = veri.get("timezone", "Bilinmiyor")

    elif api_kaynagi == "ipapi":
        ulke = veri.get("country_name", "Bilinmiyor")
        ulke_kodu = veri.get("country_code", "")
        sehir = veri.get("city", "Bilinmiyor")
        bolge = veri.get("region", "Bilinmiyor")
        posta_kodu = veri.get("postal", "Bilinmiyor")
        enlem = veri.get("latitude", 0.0)
        boylam = veri.get("longitude", 0.0)
        isp = veri.get("org", "Bilinmiyor")
        org = veri.get("org", "Bilinmiyor")
        asn = str(veri.get("asn", "Bilinmiyor"))
        zaman_dilimi = veri.get("timezone", "Bilinmiyor")

    md = f"## IP ve Coğrafi Konum Raporu: `{cozulen_ip}`\n\n"
    
    md += "### Coğrafi Konum Bilgileri\n"
    md += f"- **Ülke:** {ulke} ({ulke_kodu})\n"
    md += f"- **Şehir / İlçe:** {sehir}\n"
    md += f"- **Bölge / Eyalet:** {bolge}\n"
    md += f"- **Posta Kodu:** {posta_kodu}\n"
    md += f"- **Koordinatlar (Enlem / Boylam):** `{enlem}, {boylam}`\n"
    md += f"- **Zaman Dilimi:** {zaman_dilimi}\n\n"
    
    md += "### Ağ ve Otonom Sistem (ASN) Bilgileri\n"
    md += f"- **İnternet Servis Sağlayıcı (ISP):** `{isp}`\n"
    md += f"- **Kurum / Organizasyon:** `{org}`\n"
    md += f"- **ASN:** `{asn if asn.startswith('AS') else 'AS' + asn}`\n"
    md += f"- **Ters DNS (PTR Kaydı):** `{rdns if rdns else 'PTR Kaydı Yok / Çözülemedi'}`\n\n"

    md += "### Güvenlik ve Tehdit İstihbaratı\n"
    if api_kaynagi == "ipwho":
        riskli = is_vpn or is_proxy or is_tor
        if riskli:
            md += "> Uyarı: Bu IP adresinde aktif bir anonimleştirme/gizlenme servisi (VPN/Tor/Proxy) tespit edildi.\n\n"
        else:
            md += "> Durum: Bu IP adresi temiz, bilinen bir genel VPN/Proxy/Tor çıkış noktası olarak işaretlenmemiş.\n\n"
            
        md += "| Kategori | Durum |\n"
        md += "|:---------|:------|\n"
        md += f"| **VPN Kullanımı** | {'Aktif (VPN)' if is_vpn else 'Hayır'} |\n"
        md += f"| **Açık Proxy** | {'Aktif (Proxy)' if is_proxy else 'Hayır'} |\n"
        md += f"| **Tor Düğümü (Tor Node)** | {'Aktif (Tor)' if is_tor else 'Hayır'} |\n"
        md += f"| **Hosting / Veri Merkezi** | {'Veri Merkezi / Sunucu IP' if is_hosting else 'Bireysel / Kurumsal Hat'} |\n"
    else:
        md += "> Bilgi: Basit konumlandırma modunda sorgulandı.\n"

    return md