"""
Salus AI - IP İstihbaratı ve Tehdit Bilgisi Sorgulama
=====================================================
Bu modül, verilen bir IPv4 veya IPv6 adresinin coğrafi konumunu, ISP (İnternet Servis Sağlayıcısı)
bilgilerini, AS numarasını (Autonomous System), PTR (Ters DNS) kaydını ve
VPN/Proxy/Tor gibi gizlilik/anonimlik durumlarını sorgular.

Servis kesintilerine karşı 3 katmanlı yedekli API sorgulama mekanizmasına (ipwho.is, ip-api.com, ipapi.co) sahiptir.
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
VERSION: str = "2.1.0"
DESCRIPTION: str = "Çok kaynaklı yedekli IP coğrafi konum ve tehdit istihbaratı sorgulayıcı"
AUTHOR: str = "Salus AI"


def can_handle(message: str) -> bool:
    """Modülün IP sorgulama isteklerini sahiplenip sahiplenmeyeceğini denetler.

    Args:
        message (str): Gelen mesaj.

    Returns:
        bool: Eşleşme durumunda True.
    """
    msg = message.lower().strip()
    return msg.startswith("ip sorgula") or msg.startswith("ip nedir") or msg.startswith("ip bilgi")


def reverse_dns_getir(ip: str) -> Optional[str]:
    """Verilen IP adresi için Ters DNS (PTR) kaydını sorgular.

    Args:
        ip (str): Hedef IP adresi.

    Returns:
        Optional[str]: Bulunan hostname bilgisi veya None.
    """
    try:
        return socket.gethostbyaddr(ip)[0]
    except (socket.herror, Exception):
        return None


def api_sorgula(ip: str) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """Yedekli ve hata toleranslı 3 katmanlı IP istihbaratı API sorgulaması yapar.

    Args:
        ip (str): Sorgulanacak IP adresi.

    Returns:
        Tuple[Optional[str], Optional[Dict[str, Any]]]: API kaynağı adı ve gelen ham JSON veri sözlüğü.
    """
    # 1. öncelikli kaynak: ipwho.is (limitsiz, https, vpn/tor detayı içerir)
    url_1 = f"https://ipwho.is/{ip}"
    try:
        req = urllib.request.Request(url_1, headers={'User-Agent': 'Mozilla/5.0 SalusAI/2.1'})
        with urllib.request.urlopen(req, timeout=4) as response:
            veri = json.loads(response.read().decode('utf-8'))
            if veri.get("success"):
                return "ipwho", veri
    except Exception:
        pass

    # 2. yedek kaynak: ip-api.com (ücretsiz, http, hızlı)
    url_2 = f"http://ip-api.com/json/{ip}?fields=status,message,country,city,timezone,isp,org,as,query"
    try:
        req = urllib.request.Request(url_2, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as response:
            veri = json.loads(response.read().decode('utf-8'))
            if veri.get("status") == "success":
                return "ip-api", veri
    except Exception:
        pass

    # 3. ikinci yedek kaynak: ipapi.co (https, günlük limitli)
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
    """IP sorgulama komutunu çalıştırır ve markdown raporu döndürür.

    Args:
        message (str): Kullanıcı mesajı.

    Returns:
        str: Markdown formatında IP raporu.
    """
    parcalar = message.split()
    
    if len(parcalar) < 3:
        return "Lütfen sorgulanacak IP adresini belirtin. Örnek: `ip sorgula 8.8.8.8`"
        
    ip_adresi = parcalar[2].strip()
    
    # kapsamlı ıp format doğrulaması (ıpv4 / ıpv6)
    ip_gecerli = False
    try:
        socket.inet_aton(ip_adresi)
        ip_gecerli = True
    except socket.error:
        try:
            socket.inet_pton(socket.AF_INET6, ip_adresi)
            ip_gecerli = True
        except socket.error:
            pass
            
    if not ip_gecerli:
        return f"❌ **Hatalı IP Formatı:** `{ip_adresi}`. Lütfen geçerli bir IPv4 veya IPv6 adresi girin."

    md = f"## 🌐 IP İstihbarat ve Konum Raporu: `{ip_adresi}`\n\n"

    api_kaynagi, veri = api_sorgula(ip_adresi)
    if not veri:
        return md + "❌ **Bağlantı Hatası:** IP bilgileri API sunucularından çekilemedi. Bağlantı engellenmiş veya istek limitine ulaşılmış olabilir."

    # ters dns sorgulaması
    rdns = reverse_dns_getir(ip_adresi)

    # değişkenlerin varsayılan değerleri
    ulke = "Bilinmiyor"
    sehir = "Bilinmiyor"
    kita = "Bilinmiyor"
    bayrak = "🌐"
    isp = "Bilinmiyor"
    org = "Bilinmiyor"
    asn = "Bilinmiyor"
    zaman_dilimi = "Bilinmiyor"
    
    is_vpn, is_proxy, is_tor, is_hosting = False, False, False, False

    # apı kaynağına göre alanları ayrıştırma
    if api_kaynagi == "ipwho":
        ulke = veri.get("country", "Bilinmiyor")
        sehir = veri.get("city", "Bilinmiyor")
        kita = veri.get("continent", "Bilinmiyor")
        bayrak = veri.get("flag", {}).get("emoji", "🌐")
        
        isp = veri.get("connection", {}).get("isp", "Bilinmiyor")
        org = veri.get("connection", {}).get("org", "Bilinmiyor")
        asn = veri.get("connection", {}).get("asn", "Bilinmiyor")
        zaman_dilimi = veri.get("timezone", {}).get("id", "Bilinmiyor")
        
        # tehdit istihbaratı detayları
        security = veri.get("security", {})
        is_vpn = security.get("vpn", False)
        is_proxy = security.get("proxy", False)
        is_tor = security.get("tor", False)
        is_hosting = security.get("hosting", False)

    elif api_kaynagi == "ip-api":
        ulke = veri.get("country", "Bilinmiyor")
        sehir = veri.get("city", "Bilinmiyor")
        isp = veri.get("isp", "Bilinmiyor")
        org = veri.get("org", "Bilinmiyor")
        asn = veri.get("as", "Bilinmiyor")
        zaman_dilimi = veri.get("timezone", "Bilinmiyor")
        
        # ip-api ücretsiz sürümde proxy/vpn detayı vermez
        is_vpn, is_proxy, is_tor, is_hosting = False, False, False, False

    elif api_kaynagi == "ipapi":
        ulke = veri.get("country_name", "Bilinmiyor")
        sehir = veri.get("city", "Bilinmiyor")
        kita = veri.get("continent_code", "Bilinmiyor")
        isp = veri.get("org", "Bilinmiyor")
        org = veri.get("org", "Bilinmiyor")
        asn = veri.get("asn", "Bilinmiyor")
        zaman_dilimi = veri.get("timezone", "Bilinmiyor")

    # markdown raporu oluşturma
    md += "### 📍 Coğrafi Konum Bilgileri\n"
    md += f"- **Ülke:** {bayrak} {ulke}\n"
    md += f"- **Şehir / Bölge:** {sehir}\n"
    md += f"- **Kıta:** {kita}\n"
    md += f"- **Zaman Dilimi:** {zaman_dilimi}\n\n"
    
    md += "### 🏢 Ağ İstihbaratı ve ISP\n"
    md += f"- **İnternet Servis Sağlayıcı (ISP):** `{isp}`\n"
    md += f"- **Organizasyon / Kurum:** `{org}`\n"
    md += f"- **AS Numarası (Otonom Sistem):** `AS{asn}`\n"
    md += f"- **Ters DNS (PTR Kaydı):** `{rdns if rdns else 'Bulunamadı / PTR Kaydı Yok'}`\n\n"

    md += "### 🛡️ Tehdit ve Gizlilik Analizi\n"
    
    # ipwho dışındaki apı'ler tehdit bilgisi vermiyorsa uyar
    if api_kaynagi != "ipwho":
        md += "> ⚠️ **Bilgi:** Yedek API kullanıldığı için VPN/Proxy/Tor detaylı tehdit analizi bu sorguda gerçekleştirilemedi.\n\n"
    else:
        riskli_mi = is_vpn or is_proxy or is_tor
        if riskli_mi:
            md += "> 🔴 **DİKKAT:** Bu IP adresinde aktif anonimleştirme / gizlenme servisi tespit edildi.\n\n"
        else:
            md += "> ✅ **Temiz:** Bu IP adresi bilinen bir proxy, VPN veya Tor çıkış noktası olarak işaretlenmemiş.\n\n"
            
        md += "| Gizlilik / Tehdit Kategorisi | Durum |\n"
        md += "|:---------------------------|:------|\n"
        md += f"| **VPN Kullanımı** | {'🔴 Tespit Edildi (VPN)' if is_vpn else '🟢 Hayır (Bireysel/Kurumsal)'} |\n"
        md += f"| **Açık Proxy** | {'🔴 Tespit Edildi (Proxy)' if is_proxy else '🟢 Hayır'} |\n"
        md += f"| **Tor Çıkış Düğümü (Tor Node)**| {'🔴 Tespit Edildi (CRITICAL)' if is_tor else '🟢 Hayır'} |\n"
        md += f"| **Hosting/Bulut Sunucu (Cloud)**| {'🟠 Bulut Sağlayıcı / Veri Merkezi' if is_hosting else '🟢 Ev/İşyeri Bağlantısı'} |\n"

    md += f"\n*(Veri Kaynağı: {api_kaynagi.upper()})*"
    
    return md