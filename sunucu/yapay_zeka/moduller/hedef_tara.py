"""
Salus AI - Canlı Hedef Tarama Modülü
====================================
Bu modül, kullanıcıdan gelen "hedefi tara" gibi doğal dil komutlarını yakalar,
domain/IP adresini ayıklar ve `salus_scanner` modülünü kullanarak canlı
port ve web başlık analizi gerçekleştirir.

Node.js sunucusu ve Python modül yöneticisi ile uyumludur.
"""

import re
from typing import List, Optional
import salus_scanner

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 45
VERSION: str = "2.1.0"
DESCRIPTION: str = "Canlı hedef tarama ve servis keşfi entegrasyonu"
AUTHOR: str = "Salus AI"


def can_handle(message: str) -> bool:
    """Mesajın tarama komutu içerip içermediğini kontrol eder.

    Args:
        message (str): Kullanıcı mesajı.

    Returns:
        bool: Eşleşme durumunda True.
    """
    msg = message.lower()
    return ("tara" in msg or "scan" in msg) and ("." in msg or "hedef" in msg or "site" in msg)


def execute(message: str) -> str:
    """Canlı hedef taramasını yürütür ve markdown raporu döndürür.

    Args:
        message (str): Kullanıcı komutu.

    Returns:
        str: Markdown formatında tarama sonuç raporu.
    """
    # mesaj içindeki potansiyel domain/ıp adresini ayıkla
    words = message.replace(":", " ").replace(",", " ").split()
    target: Optional[str] = None
    
    for word in words:
        # alan adı veya ıp formatında olup olmadığını kontrol et
        if "." in word and word.lower() not in ["tara", "hedefi", "siteyi", "lütfen", "scan"]:
            target = word
            break
            
    if not target:
        return "Lütfen taranacak hedefi belirtin. Örnek: `hedefi tara: example.com`"
        
    response = f"### 🔍 Salus Canlı Ağ Taraması: `{target}`\n\n"
    
    # hedef hostname'i çözümlüyoruz
    domain, ip = salus_scanner.host_cozumle(target)
    if not ip:
        return response + f"❌ **{domain}** adresi çözümlenemedi veya hedef aktif değil."
        
    response += f"**Çözümlenen IP:** `{ip}`\n\n"
    
    # salus_scanner üzerindeki yeni ve optimize edilmiş fonksiyonları çağırıyoruz
    acik_portlar = salus_scanner.portlari_tara_paralel(ip)
    web_analizi = salus_scanner.web_baslik_analizi(domain)
    
    # 1. web ve ssl analiz raporu
    response += "#### 🌐 Web ve Başlık Analizi\n"
    response += f"- **SSL/TLS Durumu:** {'✅ Aktif' if web_analizi['sslDurumu'] == 'aktif' else '❌ Pasif veya Geçersiz'}\n"
    response += f"- **Sunucu Yazılımı:** `{web_analizi['sunucuTuru']}`\n"
    response += f"- **HSTS:** {'✅ Var' if web_analizi['hsts'] else '❌ Yok (Eksik)'}\n"
    response += f"- **CSP:** {'✅ Var' if web_analizi['csp'] else '❌ Yok (Eksik)'}\n"
    response += f"- **Yanıt Süresi:** `{web_analizi.get('yanitSuresi', 'Bilinmiyor')}`\n\n"
    
    # 2. açık port raporu
    response += "#### 🚪 Açık Portlar\n"
    if not acik_portlar:
        response += "Temel güvenlik taramasında dışarı açık popüler port bulunamadı.\n"
    else:
        response += "| Port | Servis | Risk Durumu |\n|---|---|---|\n"
        for p in acik_portlar:
            risk_emoji = "🔴" if p['risk'] == "kritik" else "🟠" if p['risk'] == "yüksek" else "🟡" if p['risk'] == "orta" else "🟢"
            response += f"| **{p['port']}** | {p['servis']} | {risk_emoji} {p['risk'].capitalize()} |\n"
            
    response += "\n\n> *Not: Bu tarama Salus güvenlik altyapısı tarafından canlı olarak yapılmıştır. Daha detaylı sonuçlar için **Ağ Taraması** sayfasını kullanabilirsiniz.*"
    return response