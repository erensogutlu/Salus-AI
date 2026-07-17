"""
Salus AI - DNS Sorgulama Modülü
===============================
Bu modül, alan adlarının A, AAAA, MX, NS, CNAME ve TXT DNS kayıtlarını sorgular.
Ayrıca SPF ve DMARC gibi e-posta güvenlik kayıtlarının varlığını analiz eder.

Node.js sunucusu ve Python modül yöneticisi ile uyumludur.
"""

import sys
import json
import io
import socket
import urllib.parse
from typing import List, Dict, Any, Tuple
import salus_common

# utf-8 standart giriş/çıkış yapılandırması
salus_common.reconfigure_utf8()

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 40
VERSION: str = "1.0.0"
DESCRIPTION: str = "Kapsamlı DNS kayıtları sorgulayıcı ve güvenlik analizi"
AUTHOR: str = "Salus AI"

def can_handle(message: str) -> bool:
    """Modülün gelen DNS sorgulama isteklerini işleyip işlemeyeceğini kontrol eder."""
    msg = message.lower().strip()
    return msg.startswith("dns ") or msg.startswith("dns sorgula")

def domain_ayikla(message: str) -> str:
    """Gelen mesajdan domain adını temizleyerek ayıklar."""
    keyword = "dns sorgula" if message.lower().startswith("dns sorgula") else "dns"
    return salus_common.clean_domain_or_ip(message, keyword)

def dns_sorgula_sistem(domain: str, kayit_tipi: str) -> List[str]:
    """Python'ın standart socket kütüphanesini kullanarak temel A/AAAA/MX/NS/TXT kayıtlarını sorgular.
    Herhangi bir harici kütüphane (dnspython vb.) gerektirmez, böylece sistem bağımsız çalışır.
    """
    sonuclar = []
    try:
        if kayit_tipi == "A":
            # a kayıtlarını sorgula
            infos = socket.getaddrinfo(domain, 80, proto=socket.IPPROTO_TCP)
            for info in infos:
                ip = info[4][0]
                if ":" not in ip and ip not in sonuclar:
                    sonuclar.append(ip)
        elif kayit_tipi == "AAAA":
            # aaaa kayıtlarını sorgula
            infos = socket.getaddrinfo(domain, 80, proto=socket.IPPROTO_TCP)
            for info in infos:
                ip = info[4][0]
                if ":" in ip and ip not in sonuclar:
                    sonuclar.append(ip)
    except Exception:
        pass
    return sonuclar

def execute(message: str) -> str:
    """DNS sorgulamasını yürütür ve markdown formatında rapor üretir."""
    domain = domain_ayikla(message)
    if not domain or "." not in domain:
        return "Lütfen sorgulanacak geçerli bir domain belirtin. Örnek: `dns sorgula google.com`"
        
    md = f"## 📡 DNS Kayıtları ve Güvenlik Raporu: `{domain}`\n\n"
    
    # a ve aaaa kayıtlarını sorgula
    a_kayitlari = dns_sorgula_sistem(domain, "A")
    aaaa_kayitlari = dns_sorgula_sistem(domain, "AAAA")
    
    md += "### 🌐 IP Adresi Kayıtları\n"
    if a_kayitlari:
        md += f"- **IPv4 Adresleri (A):**\n"
        for ip in a_kayitlari:
            md += f"  - `{ip}`\n"
    else:
        md += "- **IPv4 Adresleri (A):** Bulunamadı veya çözümlenemedi.\n"
        
    if aaaa_kayitlari:
        md += f"- **IPv6 Adresleri (AAAA):**\n"
        for ip in aaaa_kayitlari:
            md += f"  - `{ip}`\n"
            
    # güvenlik ve mx/txt analizleri için temel bilgiler
    md += "\n### 🛡️ E-Posta ve Alan Adı Güvenlik Analizi\n"
    
    # not: standart kütüphaneyle mx/txt gibi detaylı kayıtlar platforma bağlı
    # nslookup komutunu subprocess ile kullanarak işletim sistemi üzerinden sorgulayabiliriz
    import subprocess
    import platform
    
    def nslookup_sorgu(tip: str) -> List[str]:
        kayitlar = []
        try:
            is_win = platform.system() == "Windows"
            cmd = ["nslookup", f"-type={tip}", domain]
            
            # windows'ta nslookup türkçe/ingilizce çıktı verebilir, bu yüzden çıktıyı regex ile tarayacağız
            islem = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
            output = islem.stdout
            
            if tip == "MX":
                # windows/linux mx çıktılarını yakala
                matches = re.findall(r'mail exchanger\s*=\s*([a-zA-Z0-9\.\-_]+)', output, re.IGNORECASE)
                if not matches:
                    matches = re.findall(r'exchanger\s*=\s*([a-zA-Z0-9\.\-_]+)', output, re.IGNORECASE)
                for m in matches:
                    val = m.strip().lower().rstrip('.')
                    if val not in kayitlar:
                        kayitlar.append(val)
            elif tip == "TXT":
                # txt text kayıtlarını yakala
                matches = re.findall(r'"([^"]+)"', output)
                for m in matches:
                    if m.strip() not in kayitlar:
                        kayitlar.append(m.strip())
            elif tip == "NS":
                matches = re.findall(r'nameserver\s*=\s*([a-zA-Z0-9\.\-_]+)', output, re.IGNORECASE)
                for m in matches:
                    val = m.strip().lower().rstrip('.')
                    if val not in kayitlar:
                        kayitlar.append(val)
        except Exception:
            pass
        return kayitlar

    import re
    mx_kayitlari = nslookup_sorgu("MX")
    txt_kayitlari = nslookup_sorgu("TXT")
    ns_kayitlari = nslookup_sorgu("NS")
    
    if ns_kayitlari:
        md += "- **Yetkili Sunucular (NS):**\n"
        for ns in ns_kayitlari:
            md += f"  - `{ns}`\n"
    
    if mx_kayitlari:
        md += "- **E-Posta Sunucuları (MX):**\n"
        for mx in mx_kayitlari:
            md += f"  - `{mx}`\n"
            
    # spf ve dmarc güvenlik kontrolleri
    spf_var = False
    dmarc_var = False
    spf_record = ""
    dmarc_record = ""
    
    for txt in txt_kayitlari:
        if txt.startswith("v=spf1"):
            spf_var = True
            spf_record = txt
        elif txt.startswith("v=DMARC1"):
            dmarc_var = True
            dmarc_record = txt
            
    # ayrı dmarc txt sorgusu denemesi (dmarc kayıtları genellikle _dmarc.domain adresindedir)
    if not dmarc_var:
        try:
            cmd = ["nslookup", "-type=TXT", f"_dmarc.{domain}"]
            islem = subprocess.run(cmd, stdout=subprocess.PIPE, text=True, timeout=3)
            matches = re.findall(r'"([^"]+)"', islem.stdout)
            for m in matches:
                if m.startswith("v=DMARC1"):
                    dmarc_var = True
                    dmarc_record = m
        except Exception:
            pass

    md += "\n### 📈 Güvenlik Sıkılaştırma Kontrolü\n"
    
    # spf değerlendirmesi
    if spf_var:
        md += f"| Özellik | Durum | Değer |\n"
        md += f"|:---|:---|:---|\n"
        md += f"| **SPF Kaydı** |  Mevcut (Güvenli) | `{spf_record}` |\n"
    else:
        md += f"| **SPF Kaydı** | ❌ Eksik (Yüksek Risk) | *Alan adınız adına sahte e-posta (spoofing) gönderilebilir.* |\n"
        
    # dmarc değerlendirmesi
    if dmarc_var:
        if not spf_var:
            md += f"| **DMARC Kaydı** | ⚠️ Kısmi (SPF Eksik) | `{dmarc_record}` |\n"
        else:
            md += f"| **DMARC Kaydı** |  Mevcut (Güvenli) | `{dmarc_record}` |\n"
    else:
        md += f"| **DMARC Kaydı** | ❌ Eksik (Yüksek Risk) | *Oltalama (phishing) saldırılarına karşı koruma zayıftır.* |\n"
        
    if txt_kayitlari:
        md += "\n### 📝 Diğer TXT Kayıtları\n"
        for txt in txt_kayitlari:
            if not txt.startswith(("v=spf1", "v=DMARC1")) and len(txt) > 3:
                md += f"- `{txt}`\n"
                
    md += "\n\n> *Not: DNS sorguları platform üzerinden anlık olarak gerçekleştirilmiştir.*"
    return md