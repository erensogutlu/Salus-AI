"""
Salus AI - Siber Güvenlik Veri Kodlama/Çözme ve İçerik Güvenlik Analiz Modülü
=============================================================================
Bu modül, Base64, Hexadecimal ve URL (Percent) kodlama ve çözme işlemlerini yürütür.
İç içe geçmiş (zincirleme) Base64 yapısını algılayarak otomatik olarak 3 derinliğe
kadar çözer.

Çözülen metinler üzerinde gerçek zamanlı zararlı içerik taraması yaparak, RCE (Komut çalıştırma),
XSS (Çapraz kod çalıştırma), SQL Enjeksiyonu, LFI (Yerel dosya okuma) ve hassas veri (IP, URL)
ihlallerini siber güvenlik imzalarıyla tespit eder.
"""

import sys
import json
import io
import base64
import urllib.parse
import re
from typing import List, Optional, Tuple

# utf-8 standart giriş/çıkış yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 40
VERSION: str = "2.1.0"
DESCRIPTION: str = "Gelişmiş veri kodlama/çözme ve siber güvenlik payload tarayıcısı"
AUTHOR: str = "Salus AI"

TETIKLEYICILER: List[str] = [
    "base64 çöz", "base64 şifrele", "base64 kodla", 
    "hex çöz", "hex şifrele", "hex kodla",
    "url çöz", "url şifrele", "url kodla"
]


def can_handle(message: str) -> bool:
    """Modülün kodlama/çözme isteklerini sahiplenip sahiplenmeyeceğini denetler.

    Args:
        message (str): Gelen kullanıcı mesajı.

    Returns:
        bool: Eşleşme durumunda True.
    """
    msg = message.lower().strip()
    return any(msg.startswith(t) for t in TETIKLEYICILER)


def guvenlik_taramasi(metin: str) -> List[str]:
    """Çözülen veri içeriğinde olası zafiyet ve siber saldırı kalıplarını (payload) arar.

    Args:
        metin (str): Güvenlik taramasından geçirilecek metin.

    Returns:
        List[str]: Bulunan siber güvenlik bulgu uyarıları listesi.
    """
    bulgular: List[str] = []
    metin_lower = metin.lower()
    
    # 1. rce / shell ve komut çalıştırma imzaları
    rce_pat = r'(bash\s+-|cmd\.exe|powershell|/bin/sh|/bin/bash|eval\(|exec\(|system\(|passthru\(|shell_exec\(|popen\()'
    if re.search(rce_pat, metin, re.IGNORECASE):
        bulgular.append("⚠️ **Kritik:** Shell komutu veya dinamik kod yürütme fonksiyonu tespit edildi (RCE / Shell shock riski).")
        
    # 2. xss ve html tag enjeksiyonu
    xss_pat = r'(<script|javascript:|onerror=|onload=|alert\(|confirm\(|prompt\(|document\.cookie|srcdoc=)'
    if re.search(xss_pat, metin, re.IGNORECASE):
        bulgular.append("⚠️ **Yüksek:** Tarayıcı taraflı script veya olay tetikleyici tespit edildi (Stored/Reflected XSS riski).")
        
    # 3. sql enjeksiyon (sqli) imzaları
    sqli_pat = r"(union\s+select|select\s+.*\s+from|drop\s+table|insert\s+into|delete\s+from|or\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+|pg_sleep\(|dbms_pipe\.receive_message)"
    if re.search(sqli_pat, metin, re.IGNORECASE):
        bulgular.append("⚠️ **Yüksek:** SQL komutları veya kör SQLi gecikme fonksiyonları tespit edildi (SQL Enjeksiyon riski).")
        
    # 4. lfı / dosya yolu aşımı (local file ınclusion)
    lfi_pat = r'(\.\./\.\./|\.\.\\\.\.\\|/etc/passwd|/windows/win\.ini|php://filter|php://input)'
    if re.search(lfi_pat, metin_lower):
        bulgular.append("⚠️ **Yüksek:** Dizin aşımı veya hassas sistem dosya yolları tespit edildi (LFI / Dosya Okuma riski).")

    # 5. hassas bilgi keşfi (ıp adresi ve url)
    ip_adresleri = set(re.findall(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', metin))
    if ip_adresleri:
        bulgular.append(f" **Bilgi:** Girdide IP adresi tespit edildi: {', '.join(list(ip_adresleri)[:3])}")
        
    urller = set(re.findall(r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+', metin))
    if urller:
        bulgular.append(f" **Bilgi:** Girdide URL/Bağlantı tespit edildi: {', '.join(list(urller)[:3])}")
        
    return bulgular


def padding_ekle(b64_str: str) -> str:
    """Eksik dolgu (padding '=') karakterlerini ekleyerek Base64 dizgesini tamamlar.

    Args:
        b64_str (str): Ham base64 dizgesi.

    Returns:
        str: Padding tamamlanmış base64 dizgesi.
    """
    b64_str = b64_str.strip()
    return b64_str + '=' * (-len(b64_str) % 4)


def zincir_coz_base64(b64_str: str, max_derinlik: int = 3) -> List[str]:
    """İç içe kodlanmış Base64 (veya Base64URL) zincirini derinlemesine çözer.

    Args:
        b64_str (str): Çözümlenecek base64 dizgesi.
        max_derinlik (int): Maksimum iç içe çözme limiti.

    Returns:
        List[str]: Her bir katmanın çözülmüş metin adımları listesi.
    """
    mevcut = b64_str.strip()
    adimlar: List[str] = []
    
    for i in range(max_derinlik):
        try:
            mevcut_padded = padding_ekle(mevcut)
            decoded_bytes = b""
            # standart base64 denemesi
            try:
                decoded_bytes = base64.b64decode(mevcut_padded, validate=True)
            except Exception:
                # url-safe base64 denemesi (örn: - ve _ içeren yapılar)
                decoded_bytes = base64.urlsafe_b64decode(mevcut_padded)
                
            yeni_metin = decoded_bytes.decode('utf-8')
            
            # eğer çözülen metin boş veya bir öncekinin aynısı ise döngüyü sonlandır
            if not yeni_metin or yeni_metin == mevcut:
                break
                
            adimlar.append(yeni_metin)
            mevcut = yeni_metin
        except Exception:
            # utf-8 ile çözülemedi, binary veya geçersiz veri
            if i == 0 and len(adimlar) == 0:
                try:
                    # belki utf-8 değil, ham ikili (binary) veridir. hex formatında gösterelim.
                    hex_veri = base64.b64decode(padding_ekle(mevcut)).hex()
                    return [f"[Binary Veri (Hex)]: {hex_veri[:100]}..."]
                except Exception:
                    pass
            break
            
    return adimlar


def execute(message: str) -> str:
    """Kodlama/Çözme komutunu işler ve markdown tablosunda sonuçları sunar.

    Args:
        message (str): Kullanıcıdan gelen komut mesajı.

    Returns:
        str: Markdown formatında sonuçlar.
    """
    msg_lower = message.lower().strip()
    komut = ""
    veri = ""
    
    # komut ve veriyi ayırma
    for tetikleyici in TETIKLEYICILER:
        if msg_lower.startswith(tetikleyici):
            komut = tetikleyici
            veri = message[len(tetikleyici):].strip()
            break
            
    if not veri:
        return f"Lütfen işlemin yanına veriyi ekleyin. Örnek: `{komut} merhaba`"

    md = f"## 🔍 Gelişmiş Kodlama / Çözme Analizi\n\n"
    bulgular: List[str] = []
    
    try:
        if "çöz" in komut:
            # ─── çözme (decodıng) işlemleri ───
            if "base64" in komut:
                md += "**İşlem Tipi:** Base64 / Base64URL Kod Çözücü\n\n"
                adimlar = zincir_coz_base64(veri)
                
                if not adimlar:
                    return md + "❌ **Hata:** Girdi geçerli bir Base64/Base64URL dizgesi değil veya bozuk."
                    
                son_metin = adimlar[-1]
                bulgular = guvenlik_taramasi(son_metin)
                
                if len(adimlar) > 1:
                    md += f"🔄 **{len(adimlar)} Katmanlı Base64 Şifrelemesi Çözüldü!**\n\n"
                    for i, adim in enumerate(adimlar):
                        md += f"**Katman {i+1}:**\n```text\n{adim}\n```\n"
                else:
                    md += f"**Çözülen Sonuç:**\n```text\n{son_metin}\n```\n"
                    
            elif "hex" in komut:
                md += "**İşlem Tipi:** Hexadecimal Kod Çözücü\n\n"
                # olası boşluk ve 0x öneklerini temizle
                veri_temiz = veri.replace(" ", "").replace("0x", "").replace("\\x", "")
                try:
                    son_metin = bytes.fromhex(veri_temiz).decode('utf-8')
                    md += f"**Çözülen Sonuç:**\n```text\n{son_metin}\n```\n"
                    bulgular = guvenlik_taramasi(son_metin)
                except UnicodeDecodeError:
                    # utf-8 olmayan binary hexadecimal veriler
                    hex_bytes = bytes.fromhex(veri_temiz)
                    md += f"**Çözülen Sonuç (Binary Hex):**\n```text\n{hex_bytes.hex()}\n```\n"
                    
            elif "url" in komut:
                md += "**İşlem Tipi:** URL (Percent) Kod Çözücü\n\n"
                son_metin = urllib.parse.unquote_plus(veri)
                md += f"**Çözülen Sonuç:**\n```text\n{son_metin}\n```\n"
                bulgular = guvenlik_taramasi(son_metin)
                
            # güvenlik bulguları çıktısı
            if bulgular:
                md += "\n### 🛡️ İçerik Güvenlik Taraması Bulguları\n"
                md += "> Çözümlenen içerik içerisinde potansiyel zararlı kod kalıpları veya hassas veri sızıntısı tespit edildi:\n\n"
                for b in bulgular:
                    md += f"- {b}\n"
            else:
                md += "\n> ✅ **Güvenli:** Çözülen içerik üzerinde bilinen zararlı bir kalıp (XSS, SQLi, LFI, RCE) tespit edilmedi.\n"

        else:
            # ─── kodlama (encodıng) işlemleri ───
            if "base64" in komut:
                md += "**İşlem Tipi:** Base64 Kodlama\n\n"
                b64 = base64.b64encode(veri.encode('utf-8')).decode('utf-8')
                b64_url = base64.urlsafe_b64encode(veri.encode('utf-8')).decode('utf-8').rstrip('=')
                
                md += f"**Standart Base64:**\n```text\n{b64}\n```\n"
                md += f"**URL-Safe Base64 (Padding Hariç):**\n```text\n{b64_url}\n```\n"
                
            elif "hex" in komut:
                md += "**İşlem Tipi:** Hexadecimal Kodlama\n\n"
                hex_str = veri.encode('utf-8').hex()
                md += f"**Hexadecimal Sonuç:**\n```text\n{hex_str}\n```\n"
                md += f"**C-Style Formatı (\\\\x):**\n```text\n" + "".join(f"\\x{hex_str[i:i+2]}" for i in range(0, len(hex_str), 2)) + "\n```\n"
                
            elif "url" in komut:
                md += "**İşlem Tipi:** URL (Percent) Kodlama\n\n"
                url_str = urllib.parse.quote_plus(veri)
                md += f"**Kodlanmış URL Sonucu:**\n```text\n{url_str}\n```\n"

    except Exception as e:
        md += f"❌ **İşlem Hatası:** Girdi bu formata uygun değil veya bozuk. Detay: {str(e)}"
        
    return md