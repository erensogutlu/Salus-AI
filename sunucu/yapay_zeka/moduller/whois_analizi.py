"""
Salus AI - WHOIS Sorgulama Modülü
=================================
Bu modül, alan adlarının WHOIS bilgilerini doğrudan IANA ve ilgili alan adı
kayıt otoritesi WHOIS sunucularından TCP Port 43 bağlantısı kurarak çeker.

Harici kütüphane bağımlılığı bulunmamaktadır.
"""

import sys
import json
import io
import socket
import re
import urllib.parse
from datetime import datetime
from typing import Dict, Any, List
import salus_common

# utf-8 standart giriş/çıkış yapılandırması
salus_common.reconfigure_utf8()

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 42
VERSION: str = "1.0.0"
DESCRIPTION: str = "TCP Port 43 üzerinden domain tescil ve sahiplik (WHOIS) sorgulayıcı"
AUTHOR: str = "Salus AI"

def can_handle(message: str) -> bool:
    """Modülün gelen WHOIS isteklerini işleyip işlemeyeceğini kontrol eder."""
    msg = message.lower().strip()
    return msg.startswith("whois ") or msg.startswith("whois sorgula")

def domain_ayikla(message: str) -> str:
    """Gelen mesajdan alan adını temizler."""
    keyword = "whois sorgula" if message.lower().startswith("whois sorgula") else "whois"
    return salus_common.clean_domain_or_ip(message, keyword)

def raw_whois_sorgu(domain: str) -> str:
    """IANA sunucusuna sorgu atar, referans WHOIS sunucusunu bulup detaylı bilgiyi sorgular."""
    server = "whois.iana.org"
    try:
        # 1. aşama: ıana sorgusu
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3.5)
        s.connect((server, 43))
        s.send((domain + "\r\n").encode("utf-8"))
        response = b""
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            response += chunk
        s.close()
        text = response.decode("utf-8", errors="ignore")
        
        # referans server tespiti
        refer_server = None
        for line in text.splitlines():
            if line.strip().lower().startswith("refer:"):
                refer_server = line.split("refer:")[1].strip()
                break
                
        # eğer referans server bulunamazsa, uzantıya göre varsayılan eşleşme
        if not refer_server:
            uzanti = domain.split('.')[-1]
            varsayilan_sunucular = {
                "com": "whois.verisign-grs.com",
                "net": "whois.verisign-grs.com",
                "org": "whois.pir.org",
                "info": "whois.afilias.net",
                "biz": "whois.nic.biz",
                "tr": "whois.nic.tr",
                "io": "whois.nic.io",
                "co": "whois.nic.co",
                "dev": "whois.nic.google",
                "app": "whois.nic.google",
                "cloud": "whois.nic.cloud",
                "xyz": "whois.nic.xyz",
                "de": "whois.denic.de",
                "ru": "whois.tcinet.ru",
                "fr": "whois.nic.fr",
                "uk": "whois.nic.uk",
                "me": "whois.nic.me"
            }
            refer_server = varsayilan_sunucular.get(uzanti, "whois.internic.net")
            
        # 2. aşama: referans sunucudan detaylı sorgu
        s2 = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s2.settimeout(3.5)
        s2.connect((refer_server, 43))
        s2.send((domain + "\r\n").encode("utf-8"))
        response2 = b""
        while True:
            chunk = s2.recv(4096)
            if not chunk:
                break
            response2 += chunk
        s2.close()
        return response2.decode("utf-8", errors="ignore")
        
    except Exception as e:
        return f"Hata: {str(e)}"

def parsed_whois_verisi(whois_text: str) -> Dict[str, Any]:
    """Ham WHOIS metninden önemli kayıt verilerini regex ile ayıklar."""
    detaylar = {
        "kayit_kurulusu": "Bilinmiyor",
        "olusturma_tarihi": "Bilinmiyor",
        "bitis_tarihi": "Bilinmiyor",
        "guncelleme_tarihi": "Bilinmiyor",
        "durum": "Bilinmiyor",
        "nameservers": []
    }
    
    # regex kalıpları
    kurulus_matches = re.findall(r'(?:Registrar:|Registrar Organization:)\s*(.+)', whois_text, re.IGNORECASE)
    if kurulus_matches:
        detaylar["kayit_kurulusu"] = kurulus_matches[0].strip()
        
    tarih_kalip_olusturma = [
        r'(?:Creation Date|Created On|Registration Time|Created):\s*([^\r\n]+)',
        r'(?:Registration Date):\s*([^\r\n]+)'
    ]
    for k in tarih_kalip_olusturma:
        m = re.findall(k, whois_text, re.IGNORECASE)
        if m:
            detaylar["olusturma_tarihi"] = m[0].strip()
            break
            
    tarih_kalip_bitis = [
        r'(?:Registry Expiry Date|Expiration Date|Expiration Time|Expires):\s*([^\r\n]+)',
        r'(?:Valid Until):\s*([^\r\n]+)'
    ]
    for k in tarih_kalip_bitis:
        m = re.findall(k, whois_text, re.IGNORECASE)
        if m:
            detaylar["bitis_tarihi"] = m[0].strip()
            break
            
    ns_matches = re.findall(r'(?:Name Server|Nameservers):\s*([a-zA-Z0-9\.\-_]+)', whois_text, re.IGNORECASE)
    if ns_matches:
        detaylar["nameservers"] = list(set([n.strip().lower() for n in ns_matches if '.' in n]))
        
    status_matches = re.findall(r'(?:Domain Status|Status):\s*([a-zA-Z0-9]+)', whois_text, re.IGNORECASE)
    if status_matches:
        detaylar["durum"] = ", ".join(list(set([s.strip() for s in status_matches])))
        
    return detaylar

def execute(message: str) -> str:
    """WHOIS sorgusunu çalıştırır ve raporu markdown tablosu biçiminde döndürür."""
    domain = domain_ayikla(message)
    if not domain or "." not in domain:
        return "Lütfen sorgulanacak geçerli bir domain belirtin. Örnek: `whois github.com`"
        
    md = f"## 🗺️ Domain Kayıt Bilgisi (WHOIS): `{domain}`\n\n"
    
    raw_text = raw_whois_sorgu(domain)
    if raw_text.startswith("Hata:"):
        return md + f"❌ **WHOIS Çekilemedi:** Sunucuya erişim sağlanamadı veya sorgu engellendi."
        
    veriler = parsed_whois_verisi(raw_text)
    
    # tarihleri güzelleştirme denemesi (ıso formatını sadeleştirme)
    def tarih_duzenle(tarih_str):
        if tarih_str == "Bilinmiyor":
            return tarih_str
        try:
            # örnek: 2020-03-05t10:15:30z
            clean_date = tarih_str.split('T')[0]
            # örnek: 2020-03-05 10:15:30
            clean_date = clean_date.split(' ')[0]
            # yyyy-mm-dd kontrolü
            parts = clean_date.split('-')
            if len(parts) == 3:
                return f"{parts[2]}/{parts[1]}/{parts[0]}"
        except Exception:
            pass
        return tarih_str[:15]

    olusturma = tarih_duzenle(veriler["olusturma_tarihi"])
    bitis = tarih_duzenle(veriler["bitis_tarihi"])
    
    # markdown tablosu oluştur
    md += "### 📋 Alan Adı Tescil Bilgileri\n"
    md += "| Parametre | Değer |\n"
    md += "|:---|:---|\n"
    md += f"| **Alan Adı** | `{domain}` |\n"
    md += f"| **Kayıt Kuruluşu (Registrar)** | {veriler['kayit_kurulusu']} |\n"
    md += f"| **Oluşturulma Tarihi** | {olusturma} |\n"
    md += f"| **Bitiş Tarihi (Expiry)** | {bitis} |\n"
    
    if veriler["nameservers"]:
        ns_str = ", ".join([f"`{ns}`" for ns in veriler["nameservers"][:4]])
        md += f"| **Nameserver (NS) Sunucuları** | {ns_str} |\n"
        
    md += f"\n### 📝 Detaylı WHOIS Ham Çıktısı\n"
    md += "<details>\n<summary>Ham WHOIS verilerini görmek için tıklayın</summary>\n\n"
    md += f"```text\n{raw_text[:3000]}\n"
    if len(raw_text) > 3000:
        md += "... [Metin Çok Uzun Olduğundan Kırpıldı] ...\n"
    md += "```\n</details>"
    
    return md