"""
Salus AI - Siber Güvenlik Veri Kodlama/Çözme ve İçerik Güvenlik Analiz Modülü
=============================================================================
Bu modül, Base64, URL (Percent-Encoding), HTML Entity (Named, Decimal, Hexadecimal),
Hexadecimal ve Binary kodlama/çözme işlemlerini yürütür.

Özellikler:
- Çok katmanlı otomatik Base64 zincir çözücü
- HTML Entity Encoder/Decoder (Named & Numeric & Hexadecimal)
- URL Encoder/Decoder (RFC 3986, component & full URI)
- Hex & Binary dönüşümleri
- Gerçek zamanlı siber güvenlik saldırı payload tarayıcısı (XSS, SQLi, LFI, RCE)
"""

import sys
import json
import io
import base64
import urllib.parse
import html
import re
from typing import List, Optional, Tuple, Dict, Any

# utf-8 yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# modül bilgileri
PRIORITY: int = 40
VERSION: str = "2.2.0"
DESCRIPTION: str = "Base64, URL, HTML Entity ve Hex kodlama/çözme motoru"
AUTHOR: str = "Salus AI"

TETIKLEYICILER: List[str] = [
    "base64 çöz", "base64 şifrele", "base64 kodla", "base64 encode", "base64 decode",
    "hex çöz", "hex şifrele", "hex kodla", "hex encode", "hex decode",
    "url çöz", "url şifrele", "url kodla", "url encode", "url decode",
    "html entity çöz", "html entity kodla", "html çöz", "html kodla", "html encode", "html decode"
]


def can_handle(message: str) -> bool:
    """Modülün kodlama/çözme isteklerini sahiplenip sahiplenmeyeceğini denetler."""
    msg = message.lower().strip()
    return any(msg.startswith(t) for t in TETIKLEYICILER)


def guvenlik_taramasi(metin: str) -> List[str]:
    """Çözülen veri içeriğinde olası zafiyet ve siber saldırı kalıplarını (payload) arar."""
    bulgular: List[str] = []
    metin_lower = metin.lower()
    
    # rce ve komut imzaları
    rce_pat = r'(bash\s+-|cmd\.exe|powershell|/bin/sh|/bin/bash|eval\(|exec\(|system\(|passthru\(|shell_exec\(|popen\()'
    if re.search(rce_pat, metin, re.IGNORECASE):
        bulgular.append("Kritik: Shell komutu veya dinamik kod yürütme fonksiyonu tespit edildi (RCE riski).")
        
    # xss imzaları
    xss_pat = r'(<script|javascript:|onerror=|onload=|alert\(|confirm\(|prompt\(|document\.cookie|srcdoc=)'
    if re.search(xss_pat, metin, re.IGNORECASE):
        bulgular.append("Yüksek: Tarayıcı taraflı script veya olay tetikleyici tespit edildi (XSS riski).")
        
    # sqli imzaları
    sqli_pat = r"(union\s+select|select\s+.*\s+from|drop\s+table|insert\s+into|delete\s+from|or\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+|pg_sleep\(|dbms_pipe\.receive_message)"
    if re.search(sqli_pat, metin, re.IGNORECASE):
        bulgular.append("Yüksek: SQL komutları veya SQLi gecikme fonksiyonları tespit edildi (SQL Enjeksiyon riski).")
        
    # lfi imzaları
    lfi_pat = r'(\.\./\.\./|\.\.\\\.\.\\|/etc/passwd|/windows/win\.ini|php://filter|php://input)'
    if re.search(lfi_pat, metin_lower):
        bulgular.append("Yüksek: Dizin aşımı veya hassas sistem dosya yolları tespit edildi (LFI riski).")

    # ip ve url tespiti
    ip_adresleri = set(re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', metin))
    if ip_adresleri:
        bulgular.append(f"Bilgi: Girdide IP adresi tespit edildi: {', '.join(list(ip_adresleri)[:3])}")
        
    urller = set(re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', metin))
    if urller:
        bulgular.append(f"Bilgi: Girdide URL tespit edildi: {', '.join(list(urller)[:3])}")
        
    return bulgular


def padding_ekle(b64_str: str) -> str:
    """Eksik dolgu (padding '=') karakterlerini ekleyerek Base64 dizgesini tamamlar."""
    b64_str = b64_str.strip()
    return b64_str + '=' * (-len(b64_str) % 4)


def zincir_coz_base64(b64_str: str, max_derinlik: int = 3) -> List[str]:
    """İç içe kodlanmış Base64 zincirini derinlemesine çözer."""
    mevcut = b64_str.strip()
    adimlar: List[str] = []
    
    for i in range(max_derinlik):
        try:
            mevcut_padded = padding_ekle(mevcut)
            try:
                decoded_bytes = base64.b64decode(mevcut_padded, validate=True)
            except Exception:
                decoded_bytes = base64.urlsafe_b64decode(mevcut_padded)
                
            yeni_metin = decoded_bytes.decode('utf-8')
            if not yeni_metin or yeni_metin == mevcut:
                break
                
            adimlar.append(yeni_metin)
            mevcut = yeni_metin
        except Exception:
            if i == 0 and len(adimlar) == 0:
                try:
                    hex_veri = base64.b64decode(padding_ekle(mevcut)).hex()
                    return [f"[Binary Veri (Hex)]: {hex_veri[:100]}..."]
                except Exception:
                    pass
            break
            
    return adimlar


def html_entity_kodla(metin: str, mod: str = "named") -> Dict[str, str]:
    """HTML Entity formatında kodlama yapar."""
    # named entity dönüşümü
    named = html.escape(metin, quote=True)
    
    # ondalık entity dönüşümü
    decimal = "".join(f"&#{ord(c)};" if ord(c) > 127 or c in '<>&"\'/' else c for c in metin)
    
    # tam ondalık dönüşüm
    decimal_full = "".join(f"&#{ord(c)};" for c in metin)
    
    # onaltılık entity dönüşümü
    hexadecimal = "".join(f"&#x{ord(c):X};" if ord(c) > 127 or c in '<>&"\'/' else c for c in metin)
    
    return {
        "named": named,
        "decimal": decimal,
        "decimal_full": decimal_full,
        "hexadecimal": hexadecimal
    }


def html_entity_coz(metin: str) -> str:
    """HTML Entity (named, decimal, hex) kodunu çözer."""
    # html entity çözme
    return html.unescape(metin)


def execute(message: str) -> str:
    """Kodlama/Çözme komutunu işler ve markdown formatında sonuçları sunar."""
    msg_lower = message.lower().strip()
    komut = ""
    veri = ""
    
    for tetikleyici in TETIKLEYICILER:
        if msg_lower.startswith(tetikleyici):
            komut = tetikleyici
            veri = message[len(tetikleyici):].strip()
            break
            
    if not veri:
        return f"Lütfen işlemin yanına veriyi ekleyin. Örnek: `{komut} merhaba`"

    md = f"## Kodlama / Çözme Analizi\n\n"
    bulgular: List[str] = []
    
    try:
        if "çöz" in komut or "decode" in komut:
            # çözme işlemleri
            if "base64" in komut:
                md += "**İşlem:** Base64 / Base64URL Çözücü\n\n"
                adimlar = zincir_coz_base64(veri)
                if not adimlar:
                    return md + "Hata: Girdi geçerli bir Base64 dizgesi değil."
                son_metin = adimlar[-1]
                bulgular = guvenlik_taramasi(son_metin)
                if len(adimlar) > 1:
                    md += f"**{len(adimlar)} Katmanlı Base64 Çözüldü:**\n\n"
                    for i, adim in enumerate(adimlar):
                        md += f"**Katman {i+1}:**\n```text\n{adim}\n```\n"
                else:
                    md += f"**Çözülen Sonuç:**\n```text\n{son_metin}\n```\n"

            elif "html" in komut:
                md += "**İşlem:** HTML Entity Çözücü\n\n"
                son_metin = html_entity_coz(veri)
                md += f"**Çözülen Sonuç:**\n```text\n{son_metin}\n```\n"
                bulgular = guvenlik_taramasi(son_metin)

            elif "hex" in komut:
                md += "**İşlem:** Hexadecimal Çözücü\n\n"
                veri_temiz = veri.replace(" ", "").replace("0x", "").replace("\\x", "")
                try:
                    son_metin = bytes.fromhex(veri_temiz).decode('utf-8')
                    md += f"**Çözülen Sonuç:**\n```text\n{son_metin}\n```\n"
                    bulgular = guvenlik_taramasi(son_metin)
                except UnicodeDecodeError:
                    hex_bytes = bytes.fromhex(veri_temiz)
                    md += f"**Çözülen Sonuç (Binary Hex):**\n```text\n{hex_bytes.hex()}\n```\n"

            elif "url" in komut:
                md += "**İşlem:** URL (Percent) Çözücü\n\n"
                son_metin = urllib.parse.unquote_plus(veri)
                md += f"**Çözülen Sonuç:**\n```text\n{son_metin}\n```\n"
                bulgular = guvenlik_taramasi(son_metin)

            if bulgular:
                md += "\n### Güvenlik Taraması Bulguları\n"
                for b in bulgular:
                    md += f"- {b}\n"
            else:
                md += "\n> Güvenli: Çözülen içerik üzerinde bilinen zararlı bir saldırı kalıbı tespit edilmedi.\n"

        else:
            # kodlama işlemleri
            if "base64" in komut:
                md += "**İşlem:** Base64 Kodlama\n\n"
                b64 = base64.b64encode(veri.encode('utf-8')).decode('utf-8')
                b64_url = base64.urlsafe_b64encode(veri.encode('utf-8')).decode('utf-8').rstrip('=')
                md += f"**Standart Base64:**\n```text\n{b64}\n```\n"
                md += f"**URL-Safe Base64:**\n```text\n{b64_url}\n```\n"

            elif "html" in komut:
                md += "**İşlem:** HTML Entity Kodlama\n\n"
                entities = html_entity_kodla(veri)
                md += f"**Named Entity:**\n```text\n{entities['named']}\n```\n"
                md += f"**Numeric Decimal:**\n```text\n{entities['decimal']}\n```\n"
                md += f"**Hexadecimal Entity:**\n```text\n{entities['hexadecimal']}\n```\n"

            elif "hex" in komut:
                md += "**İşlem:** Hexadecimal Kodlama\n\n"
                hex_str = veri.encode('utf-8').hex()
                md += f"**Hexadecimal Sonuç:**\n```text\n{hex_str}\n```\n"
                md += f"**C-Style Formatı (\\\\x):**\n```text\n" + "".join(f"\\x{hex_str[i:i+2]}" for i in range(0, len(hex_str), 2)) + "\n```\n"

            elif "url" in komut:
                md += "**İşlem:** URL (Percent) Kodlama\n\n"
                url_str = urllib.parse.quote_plus(veri)
                url_rfc = urllib.parse.quote(veri)
                md += f"**URL Component (Parametre Uyumlu):**\n```text\n{url_str}\n```\n"
                md += f"**Standart URI (RFC 3986):**\n```text\n{url_rfc}\n```\n"

    except Exception as e:
        md += f"Hata: Girdi bu formata uygun değil veya bozuk. Detay: {str(e)}"
        
    return md