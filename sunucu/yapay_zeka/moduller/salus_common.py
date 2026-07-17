"""
Salus AI - Ortak Yardımcı Metotlar Modülü
=========================================
Bu modül, siber güvenlik araçlarının ortak olarak kullandığı domain/URL ayıklama,
IP/Host çözümleme, UTF-8 G/Ç yapılandırması ve Base64 çözme metotlarını barındırır.
"""

import sys
import io
import urllib.parse
import socket
import base64
import re
from typing import Tuple, Optional

def reconfigure_utf8() -> None:
    """Standart çıktıyı (stdout) UTF-8 karakter kodlaması ile yeniden yapılandırır."""
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    else:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def clean_domain_or_ip(message_or_url: str, keyword: Optional[str] = None) -> str:
    """Gelen mesaj veya URL içeriğinden sadece domain veya IP kısmını temizleyerek ayıklar."""
    parcalar = message_or_url.split()
    if keyword and message_or_url.lower().startswith(keyword.lower()):
        # anahtar kelimeyi ve sonrasındaki komut kısmını geç
        kelime_uzunlugu = len(keyword.split())
        hedef = " ".join(parcalar[kelime_uzunlugu:])
    else:
        if len(parcalar) > 1:
            hedef = " ".join(parcalar[1:])
        else:
            hedef = message_or_url
            
    hedef = hedef.lower().strip()
    
    # url yapısı temizliği
    if "://" in hedef:
        try:
            hedef = urllib.parse.urlparse(hedef).netloc
        except Exception:
            pass
            
    # path, query string veya port kısımlarını temizle
    hedef = hedef.split('/')[0].split('?')[0].split(':')[0].strip()
    return hedef

def b64_coz(metin: str) -> str:
    """Base64 kodlu verileri eksik dolgu (padding) karakterlerini tamamlayarak güvenli şekilde çözer."""
    cleaned = metin.strip()
    # base64 olabilecek karakterleri ve uzunluğu doğrula
    if re.match(r'^[A-Za-z0-9+/]+={0,2}$', cleaned) and len(cleaned) > 4:
        try:
            missing_padding = len(cleaned) % 4
            if missing_padding:
                cleaned += '=' * (4 - missing_padding)
            return base64.b64decode(cleaned).decode('utf-8')
        except Exception:
            pass
    return metin

def host_cozumle(hedef: str) -> Tuple[str, Optional[str]]:
    """Gelen ham hedef adresinden domain ayıklar ve IP adresine çözümler."""
    clean_target = clean_domain_or_ip(hedef)
    try:
        # ıp adresi mi kontrol et
        socket.inet_aton(clean_target)
        return clean_target, clean_target
    except socket.error:
        try:
            ip = socket.gethostbyname(clean_target)
            return clean_target, ip
        except Exception:
            return clean_target, None