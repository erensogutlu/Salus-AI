"""
Salus AI - Web Güvenlik Başlıkları ve SSL/TLS Analiz Modülü
===========================================================
Bu modül, hedef web sitesinin HTTP yanıt güvenlik başlıklarını (HSTS, CSP, X-Frame-Options vb.),
CORS ve Çerez (Cookie) yapılandırmalarını ve SSL/TLS sertifika parametrelerini inceler.

Güvenlik başlıklarının durumuna göre 100 üzerinden bir güvenlik puanı hesaplar,
bilgi sızıntılarını (Server banner, X-Powered-By vb.) raporlar ve eksik güvenlik başlıkları için
Nginx ve Apache web sunucusu konfigürasyon önerileri sunar.
"""

import sys
import json
import io
import urllib.request
import urllib.error
import ssl
import socket
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any

# utf-8 standart giriş/çıkış yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 40
VERSION: str = "2.1.0"
DESCRIPTION: str = "Kapsamlı HTTP header denetleyicisi, SSL analizörü ve düzeltme rehberi"
AUTHOR: str = "Salus AI"

# kontrol edilecek güvenlik başlıkları, puan değerleri ve açıklamaları
GUVENLIK_BASLIKLARI: Dict[str, Dict[str, Any]] = {
    "strict-transport-security": {
        "puan": 15, 
        "isim": "HSTS", 
        "tavsiye": "HTTPS bağlantılarını zorunlu kılar.",
        "nginx": "add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;",
        "apache": "Header always set Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\""
    },
    "content-security-policy": {
        "puan": 20, 
        "isim": "CSP", 
        "tavsiye": "Tarayıcıda çalışabilecek kaynakları kısıtlayarak XSS ve veri enjeksiyonu saldırılarını önler.",
        "nginx": "add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self';\" always;",
        "apache": "Header always set Content-Security-Policy \"default-src 'self';\""
    },
    "x-frame-options": {
        "puan": 10, 
        "isim": "X-Frame-Options", 
        "tavsiye": "Sitenin iframeler içinde çağrılmasını kısıtlayarak Clickjacking (Tıklama Sahtekarlığı) saldırılarını engeller.",
        "nginx": "add_header X-Frame-Options \"DENY\" always;",
        "apache": "Header always set X-Frame-Options \"DENY\""
    },
    "x-content-type-options": {
        "puan": 10, 
        "isim": "X-Content-Type-Options", 
        "tavsiye": "Tarayıcının MIME-type sniffing yapmasını engelleyerek zararlı dosyaların çalışmasını önler.",
        "nginx": "add_header X-Content-Type-Options \"nosniff\" always;",
        "apache": "Header always set X-Content-Type-Options \"nosniff\""
    },
    "referrer-policy": {
        "puan": 10, 
        "isim": "Referrer-Policy", 
        "tavsiye": "Yönlendirme (referrer) başlıklarında hassas verilerin sızmasını sınırlandırır.",
        "nginx": "add_header Referrer-Policy \"no-referrer-when-downgrade\" always;",
        "apache": "Header always set Referrer-Policy \"no-referrer-when-downgrade\""
    },
    "permissions-policy": {
        "puan": 10, 
        "isim": "Permissions-Policy", 
        "tavsiye": "Kamera, mikrofon, lokasyon gibi tarayıcı API özelliklerine erişimi kısıtlar.",
        "nginx": "add_header Permissions-Policy \"camera=(), microphone=(), geolocation=()\" always;",
        "apache": "Header always set Permissions-Policy \"camera=(), microphone=(), geolocation=()\""
    },
    "cross-origin-opener-policy": {
        "puan": 5, 
        "isim": "COOP", 
        "tavsiye": "Cross-origin belge pencerelerinin birbirini etkilemesini önler.",
        "nginx": "add_header Cross-Origin-Opener-Policy \"same-origin\" always;",
        "apache": "Header always set Cross-Origin-Opener-Policy \"same-origin\""
    },
    "cross-origin-embedder-policy": {
        "puan": 5, 
        "isim": "COEP", 
        "tavsiye": "Sitenin cross-origin kaynakları izinsiz yüklemesini engeller.",
        "nginx": "add_header Cross-Origin-Embedder-Policy \"require-corp\" always;",
        "apache": "Header always set Cross-Origin-Embedder-Policy \"require-corp\""
    },
    "cross-origin-resource-policy": {
        "puan": 5, 
        "isim": "CORP", 
        "tavsiye": "Kaynakların başka web siteleri tarafından okunmasını/yüklenmesini önler.",
        "nginx": "add_header Cross-Origin-Resource-Policy \"same-origin\" always;",
        "apache": "Header always set Cross-Origin-Resource-Policy \"same-origin\""
    },
    "x-xss-protection": {
        "puan": 0, 
        "isim": "X-XSS-Protection", 
        "tavsiye": "Eski tarayıcılarda basit XSS filtrelerini tetikler (Modern tarayıcılarda CSP tercih edilir).",
        "nginx": "add_header X-XSS-Protection \"1; mode=block\" always;",
        "apache": "Header always set X-XSS-Protection \"1; mode=block\""
    }
}


def can_handle(message: str) -> bool:
    """Modülün gelen site analiz isteklerini sahiplenip sahiplenmeyeceğini kontrol eder.

    Args:
        message (str): Kullanıcı mesajı.

    Returns:
        bool: Eşleşme durumunda True.
    """
    msg = message.lower().strip()
    return msg.startswith("site analiz") or msg.startswith("header analiz")


def ssl_sertifika_getir(hostname: str) -> Dict[str, Any]:
    """Hedef alan adının SSL sertifikasını ve TLS bağlantı parametrelerini analiz eder.

    Args:
        hostname (str): Hedef domain.

    Returns:
        Dict[str, Any]: SSL sertifikasının geçerlilik durumu ve detayları.
    """
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    detaylar = {
        "aktif": False,
        "versiyon": "Bilinmiyor",
        "cipher": "Bilinmiyor",
        "yayinlayici": "Bilinmiyor",
        "kalan_gun": -1
    }
    
    try:
        with socket.create_connection((hostname, 443), timeout=4) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                detaylar["aktif"] = True
                detaylar["versiyon"] = ssock.version()
                detaylar["cipher"] = ssock.cipher()[0]
                
                cert = ssock.getpeercert(binary_form=False)
                if cert:
                    # yayınlayıcıyı al
                    issuer = cert.get('issuer', [])
                    for sub in issuer:
                        for key, val in sub:
                            if key == 'organizationName':
                                detaylar["yayinlayici"] = val
                                break
                                
                    # bitiş tarihini ve kalan gün sayısını al
                    not_after_str = cert.get('notAfter')
                    if not_after_str:
                        try:
                            bitis_tarihi = datetime.strptime(not_after_str, '%b %d %H:%M:%S %Y %Z')
                            kalan_sure = bitis_tarihi - datetime.utcnow()
                            detaylar["kalan_gun"] = max(0, kalan_sure.days)
                        except Exception:
                            pass
    except Exception:
        pass
        
    return detaylar


def url_temizle(hedef: str) -> Tuple[str, str]:
    """Komut girdisindeki URL adresini temizler ve domain adını ayırır.

    Args:
        hedef (str): Ham komut girdisi.

    Returns:
        Tuple[str, str]: Standartlaştırılmış tam URL ve alan adı (domain).
    """
    hedef = hedef.lower().strip()
    if hedef.startswith("site analiz "):
        hedef = hedef[12:]
    if hedef.startswith("header analiz "):
        hedef = hedef[14:]
        
    hedef = hedef.strip()
    if not hedef.startswith("http"):
        hedef = "https://" + hedef
        
    # domain kısmını ayıkla
    domain = hedef.split("://")[1].split("/")[0].split(":")[0]
    return hedef, domain


def execute(message: str) -> str:
    """Web analiz komutunu çalıştırır ve detaylı markdown raporunu üretir.

    Args:
        message (str): Kullanıcı komutu.

    Returns:
        str: Güvenlik başlığı, çerez ve SSL detaylarını içeren markdown metni.
    """
    url, domain = url_temizle(message)
    if not domain or "." not in domain:
        return "Lütfen analiz edilecek geçerli bir alan adı girin. Örnek: `site analiz google.com`"

    md = f"## 🌐 Kapsamlı Web Güvenlik Analizi: `{domain}`\n\n"

    # ─── 1. http istek ve başlık ayrıştırma ───
    headers: Dict[str, str] = {}
    hata_mesaji: Optional[str] = None
    
    try:
        # user-agent ve yönlendirmeleri ele alan urllib yapılandırması
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SalusHeaderAnalyser/2.1'}
        )
        # ssl hatalarında yarıda kalmaması için doğrulamayı devre dışı bırakıyoruz
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, timeout=8, context=ctx) as response:
            headers = {k.lower(): str(v) for k, v in dict(response.info()).items()}
    except urllib.error.HTTPError as e:
        headers = {k.lower(): str(v) for k, v in dict(e.headers).items()}
    except urllib.error.URLError as e:
        hata_mesaji = str(e.reason)
    except Exception as e:
        hata_mesaji = str(e)

    if hata_mesaji:
        return md + f"❌ **Bağlantı Hatası:** Hedefe ulaşılamadı. Sunucu kapalı veya istek zaman aşımına uğramış olabilir. (Detay: {hata_mesaji})"

    # ─── 2. ssl/tls güvenlik analizi ───
    ssl_bilgi = ssl_sertifika_getir(domain)
    md += "### SSL/TLS Bağlantı Güvenliği\n"
    if ssl_bilgi["aktif"]:
        kalan = ssl_bilgi['kalan_gun']
        gun_str = f"({kalan} gün kaldı)" if kalan != -1 else ""
        md += f"- **Durum:** ✅ Güvenli SSL/TLS Bağlantısı (HTTPS)\n"
        md += f"- **Protokol Sürümü:** `{ssl_bilgi.get('versiyon', 'Bilinmiyor')}`\n"
        md += f"- **Şifreleme Algoritması (Cipher):** `{ssl_bilgi.get('cipher', 'Bilinmiyor')}`\n"
        md += f"- **Sertifika Yayınlayıcısı:** `{ssl_bilgi.get('yayinlayici', 'Bilinmiyor')}` {gun_str}\n\n"
    else:
        md += f"- **Durum:** ❌ SSL Tespiti Başarısız veya Bağlantı Şifresiz (HTTP - Kritik Risk!)\n\n"

    # ─── 3. http güvenlik başlıkları ve puanlama ───
    md += "### 🛡️ HTTP Güvenlik Başlıkları Analizi\n"
    md += "| Güvenlik Başlığı | Durum | İçerik / Tavsiye |\n"
    md += "|:-----------------|:------|:-----------------|\n"
    
    puan = 0
    max_puan = 90  # x-xss hariç maksimum puan
    eksik_basliklar_detay: List[Tuple[str, str, str]] = []
    
    for key, bilgi in GUVENLIK_BASLIKLARI.items():
        if key in headers:
            durum = "✅ Mevcut"
            puan += bilgi["puan"]
            icerik = headers[key]
            if len(icerik) > 50:
                icerik = icerik[:47] + "..."
            aciklama = f"`{icerik}`"
        else:
            durum = "❌ Eksik"
            aciklama = f"*(Tavsiye: {bilgi['tavsiye']})*"
            if bilgi["puan"] > 0:  # puan değeri olan eksik başlıkları düzeltme rehberi için ayır
                eksik_basliklar_detay.append((bilgi["isim"], bilgi["nginx"], bilgi["apache"]))
                
        md += f"| **{bilgi['isim']}** | {durum} | {aciklama} |\n"

    # ─── 4. cors ve çerez (cookıe) analizi ───
    md += "\n### 🍪 Çerez (Cookie) ve CORS Yapılandırması\n"
    cors_degeri = headers.get("access-control-allow-origin", "")
    
    if cors_degeri == "*":
        md += "- ⚠️ **CORS Riski:** `Access-Control-Allow-Origin: *` olarak ayarlanmış. Herhangi bir dış kaynak verilerinize erişebilir.\n"
    elif cors_degeri:
        md += f"- ✅ **CORS Yapılandırması:** Güvenli / Kısıtlı (`{cors_degeri}`)\n"
    else:
        md += "- **CORS Yapılandırması:** Belirtilmemiş (Varsayılan Aynı Köken Politikası - Same Origin Policy geçerli)\n"

    cookie_degeri = headers.get("set-cookie", "")
    if cookie_degeri:
        httponly = "httponly" in cookie_degeri.lower()
        secure = "secure" in cookie_degeri.lower()
        samesite = "samesite" in cookie_degeri.lower()
        
        md += f"- 🍪 **Çerez Bayrakları:** "
        md += f"{'✅ HttpOnly ' if httponly else '❌ HttpOnly Eksik (XSS Sızıntı Riski), '}"
        md += f"{'✅ Secure ' if secure else '❌ Secure Eksik (Plaintext Sızıntı Riski), '}"
        md += f"{'✅ SameSite' if samesite else '❌ SameSite Eksik (CSRF Riski)'}\n"
    else:
        md += "- **Çerez Durumu:** Bu istekte çerez atanmadı (Set-Cookie yok).\n"

    # ─── 5. bilgi sızıntısı (ınformatıon dısclosure) ───
    md += "\n### 🔎 Bilgi Sızıntısı Tespiti\n"
    sunucu_bilgisi = headers.get("server", "")
    powered_by = headers.get("x-powered-by", "")
    asp_version = headers.get("x-aspnet-version", "")
    
    sizinti_var = False
    if sunucu_bilgisi:
        md += f"- ⚠️ **Sunucu Başlığı Aktif:** `{sunucu_bilgisi}` (Saldırganlar sürüm zafiyetlerini tarayabilir)\n"
        puan = max(0, puan - 5)
        sizinti_var = True
    if powered_by:
        md += f"- ⚠️ **Teknoloji Başlığı Sızıyor (X-Powered-By):** `{powered_by}`\n"
        puan = max(0, puan - 5)
        sizinti_var = True
    if asp_version:
        md += f"- ⚠️ **Net Sürüm Bilgisi Sızıyor (X-AspNet-Version):** `{asp_version}`\n"
        puan = max(0, puan - 5)
        sizinti_var = True
        
    if not sizinti_var:
        md += "- ✅ Sunucu veya arka plan altyapı sürüm bilgisi sızıntısı tespit edilmedi.\n"

    # ─── 6. düzeltme ve iyileştirme rehberi (confıguratıon recommendatıons) ───
    if eksik_basliklar_detay:
        md += "\n### 🛠️ Sunucu İyileştirme ve Düzeltme Rehberi\n"
        md += "Eksik olan güvenlik başlıklarını düzeltmek için web sunucusu konfigürasyon dosyalarınıza aşağıdaki yönergeleri ekleyin:\n\n"
        
        for isim, nginx_cmd, apache_cmd in eksik_basliklar_detay:
            md += f"#### {isim} Başlığı Ekleme\n"
            md += "##### Nginx Konfigürasyonu:\n"
            md += f"```nginx\n{nginx_cmd}\n```\n"
            md += "##### Apache (.htaccess / httpd.conf):\n"
            md += f"```apache\n{apache_cmd}\n```\n"

    # ─── 7. genel güvenlik notu hesaplama ───
    final_puan = min(100, int((puan / max_puan) * 100))
    if final_puan >= 90:
        harf_notu = "A+ 🥇 (Mükemmel Güvenlik)"
    elif final_puan >= 80:
        harf_notu = "A 🟢 (Güvenli / Çok İyi)"
    elif final_puan >= 65:
        harf_notu = "B 🟡 (İyi / Geliştirilebilir)"
    elif final_puan >= 50:
        harf_notu = "C 🟠 (Orta / Zayıf Noktaları Var)"
    elif final_puan >= 35:
        harf_notu = "D 🔴 (Güvensiz / Yüksek Risk)"
    else:
        harf_notu = "F ❌ (Kritik Risk Seviyesi)"

    md = f"> 🏆 **Web Güvenlik Derecesi:** **{harf_notu}** ({final_puan}/100)\n\n" + md

    return md