"""
Salus AI - Gelişmiş Hash Tipi Tanımlayıcı (40+ Algoritma)
=========================================================
Bu modül, verilen bir kriptografik hash değerini (veya tuzlanmış hash dizgesini)
regex desen eşleşmesi, uzunluk analizi ve yapısal önek (prefix) kontrolleriyle
analiz eder. 40'tan fazla popüler hash algoritmasını (MD5, SHA ailesi, Bcrypt, Argon2,
Cisco, MS-SQL vb.) tanır.

Çakışan ham hex hash yapıları için (örn: 32 karakter MD5 mi NTLM mi?) olasılık
(güven) skoru hesaplar ve güvenlik tavsiyeleri verir.
"""

import sys
import json
import io
import re
from typing import List, Tuple, Dict, Any

# utf-8 standart giriş/çıkış yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 30
VERSION: str = "2.1.0"
DESCRIPTION: str = "Gelişmiş kriptografik hash algoritması tespit edici ve analizörü"
AUTHOR: str = "Salus AI"


def can_handle(message: str) -> bool:
    """Modülün gelen hash tanımlama isteklerini işleyip işlemeyeceğini kontrol eder.

    Args:
        message (str): Kullanıcı mesajı.

    Returns:
        bool: Eşleşme durumunda True.
    """
    msg = message.lower().strip()
    return "hash" in msg and any(x in msg for x in ["tan", "analiz", "nedir", "türü"])


# hash veritabanı: (regex deseni, algoritma adı, güvenlik seviyesi)
# not: önek barındıran belirgin formatlar çakışmayı önlemek için üst sıradadır.
HASH_YAPILARI: List[Tuple[str, str, str]] = [
    # argon2 ailesi
    (r'^\$argon2[id]\$v=\d+\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+(\$[A-Za-z0-9+/]+)?$', 'Argon2 (id/i/d)', 'Çok Güçlü 🛡️'),
    # bcrypt ailesi
    (r'^\$2[abyx]\$[0-9]{2}\$[./A-Za-z0-9]{53}$', 'bcrypt (Blowfish)', 'Güçlü 🟢'),
    # scrypt
    (r'^\$scrypt\$ln=\d+,r=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$', 'scrypt', 'Güçlü 🟢'),
    # pbkdf2 varyasyonları
    (r'^\$pbkdf2-sha256\$\d+\$[A-Za-z0-9./]+\$[A-Za-z0-9./]+$', 'PBKDF2-SHA256 (Passlib)', 'Güçlü 🟢'),
    (r'^pbkdf2_sha256\$\d+\$[A-Za-z0-9]+\$[A-Za-z0-9+/=]+$', 'Django PBKDF2-SHA256', 'Güçlü 🟢'),
    (r'^pbkdf2_sha1\$\d+\$[A-Za-z0-9]+\$[A-Za-z0-9+/=]+$', 'Django PBKDF2-SHA1', 'Orta 🟠'),
    # wordpress & phpbb3
    (r'^\$P\$[A-Za-z0-9./]{31}$', 'WordPress (phpass)', 'Zayıf 🔴'),
    (r'^\$H\$[A-Za-z0-9./]{31}$', 'phpBB3', 'Zayıf 🔴'),
    # drupal
    (r'^\$S\$[A-Za-z0-9./]{52}$', 'Drupal 7+', 'Güçlü 🟢'),
    # sha-crypt (linux / cisco)
    (r'^\$5\$[A-Za-z0-9./]{1,16}\$[A-Za-z0-9./]{43}$', 'SHA-256 Crypt (Linux/Cisco Type 8)', 'Orta 🟠'),
    (r'^\$6\$[A-Za-z0-9./]{1,16}\$[A-Za-z0-9./]{86}$', 'SHA-512 Crypt (Linux/Cisco Type 9)', 'Güçlü 🟢'),
    (r'^\$1\$[A-Za-z0-9./]{1,8}\$[A-Za-z0-9./]{22}$', 'MD5 Crypt (Cisco Type 5 / Linux)', 'Zayıf 🔴'),
    # cisco type 4
    (r'^\$4\$[A-Za-z0-9./]{43}$', 'Cisco Type 4 (SHA-256)', 'Orta 🟠'),
    # cisco type 7 (basit xor, şifreleme değil)
    (r'^[0-9A-Fa-f]{2}[0-9A-Fa-f]{2,}$', 'Cisco Type 7', 'Kritik  (Kolayca Çözülebilir)'),
    # mysql5
    (r'^\*[A-Fa-f0-9]{40}$', 'MySQL5 (Dual SHA-1)', 'Orta 🟠'),
    # netntlmv2 / ntlmv2 (domain tuzlu)
    (r'^[a-zA-Z0-9\-_]+::[a-zA-Z0-9\-_]+:[0-9a-fA-F]{16}:[0-9a-fA-F]{32}:[0-9a-fA-F]{32,}$', 'NetNTLMv2 / NetNTLMv1', 'Orta 🟠'),
    # cisco type 9 (sha-512 base64 varyantı)
    (r'^\$9\$[A-Za-z0-9./]{1,16}\$[A-Za-z0-9./]{86}$', 'Cisco Type 9 (scrypt)', 'Güçlü 🟢'),

    # saf hex tabanlı formatlar (uzunluğa göre eşleşme)
    (r'^[a-fA-F0-9]{8}$', 'CRC32 / Adler-32 / fnv1a-32', 'Zayıf 🔴 (Sadece bütünlük kontrolü)'),
    (r'^[a-fA-F0-9]{16}$', 'MySQL323 / Haval-128 / LM (Eski / < v4.1)', 'Kritik '),
    (r'^[a-fA-F0-9]{32}$', 'MD5 / NTLM / MD4 / RipeMD-128 / Domain Cached Credentials (DCC)', 'Zayıf 🔴 / Kritik '), # çakışmalı hex
    (r'^[a-fA-F0-9]{40}$', 'SHA-1 / RIPEMD-160 / MySQL5 (Yıldızsız) / Tiger-160', 'Zayıf 🔴'), # çakışmalı hex
    (r'^[a-fA-F0-9]{56}$', 'SHA-224 / SHA-3-224 / Blake2s-224', 'Orta 🟠'),
    (r'^[a-fA-F0-9]{64}$', 'SHA-256 / SHA-3-256 / GOST R 34.11-94 / Blake2s-256 / Blake3', 'Güçlü 🟢'),
    (r'^[a-fA-F0-9]{96}$', 'SHA-384 / SHA-3-384 / Blake2b-384', 'Güçlü 🟢'),
    (r'^[a-fA-F0-9]{128}$', 'SHA-512 / SHA-3-512 / Whirlpool / Blake2b-512', 'Çok Güçlü 🛡️'),
]


def analiz_et(hash_metni: str) -> Tuple[List[Dict[str, str]], str]:
    """Verilen hash değerini regex listesiyle karşılaştırıp olası algoritmaları belirler.

    Args:
        hash_metni (str): Analiz edilecek ham hash metni.

    Returns:
        Tuple[List[Dict[str, str]], str]: Tespit edilen algoritmalar ve tuz uyarısı.
    """
    sonuclar: List[Dict[str, str]] = []
    tuz_uyarisi = ""
    analiz_edilecek = hash_metni.strip()

    # tuzlanmış hash tespiti (örn: hash:salt veya username:hash:salt)
    if ":" in analiz_edilecek:
        bolumler = analiz_edilecek.split(":")
        # en uzun parça muhtemelen hash'tir
        olasi_hash = max(bolumler, key=len)
        tuzlar = [b for b in bolumler if b != olasi_hash]
        
        if len(olasi_hash) >= 16:
            analiz_edilecek = olasi_hash
            tuz_uyarisi = f"*(Tuzlanmış/Birleştirilmiş Yapı Tespit Edildi. Tuz: {':'.join(tuzlar)})*"

    # tüm regex desenlerini kontrol et
    for kalip, isim, seviye in HASH_YAPILARI:
        if re.match(kalip, analiz_edilecek):
            # hex çakışması olan durumlarda güven skoru dağılımı yapılır
            if isim == "MD5 / NTLM / MD4 / RipeMD-128 / Domain Cached Credentials (DCC)":
                sonuclar.append({"isim": "MD5 (En Yaygın Hex)", "seviye": "Zayıf 🔴", "guven": "%65"})
                sonuclar.append({"isim": "NTLM (Windows Parola Depolama)", "seviye": "Zayıf 🔴", "guven": "%20"})
                sonuclar.append({"isim": "RipeMD-128", "seviye": "Orta 🟠", "guven": "%8"})
                sonuclar.append({"isim": "MD4 (Eski/Kritik)", "seviye": "Kritik ", "guven": "%5"})
                sonuclar.append({"isim": "Domain Cached Credentials (mscash)", "seviye": "Zayıf 🔴", "guven": "%2"})
                continue
                
            elif isim == "SHA-1 / RIPEMD-160 / MySQL5 (Yıldızsız) / Tiger-160":
                sonuclar.append({"isim": "SHA-1 (En Yaygın Hex)", "seviye": "Zayıf 🔴", "guven": "%80"})
                sonuclar.append({"isim": "RIPEMD-160", "seviye": "Orta 🟠", "guven": "%12"})
                sonuclar.append({"isim": "MySQL5 (Yıldız Karakteri Eksik)", "seviye": "Orta 🟠", "guven": "%6"})
                sonuclar.append({"isim": "Tiger-160", "seviye": "Zayıf 🔴", "guven": "%2"})
                continue
                
            elif "/" in isim:
                turler = isim.split(" / ")
                seviyeler = seviye.split(" / ") if " / " in seviye else [seviye] * len(turler)
                pay = int(100 / len(turler))
                for idx, tur in enumerate(turler):
                    sonuclar.append({"isim": tur, "seviye": seviyeler[idx], "guven": f"%{pay}"})
                continue
                
            sonuclar.append({
                "isim": isim,
                "seviye": seviye,
                "guven": "%100 (Kesin Eşleşme)"
            })
            break  # üst sırada daha belirgin regex eşleştiyse aramayı sonlandır

    return sonuclar, tuz_uyarisi


def execute(message: str) -> str:
    """Komutu ayrıştırır, girdileri alır ve hash analiz raporunu markdown olarak sunar.

    Args:
        message (str): Kullanıcı mesajı.

    Returns:
        str: Markdown formatında analiz raporu.
    """
    parcalar = message.split()
    
    # hash verisini komut içerisinden ayrıştırma
    if message.lower().startswith("hash nedir"):
        hashler_metni = message[10:].strip()
    elif message.lower().startswith("hash tanimla"):
        hashler_metni = message[12:].strip()
    elif message.lower().startswith("hash analiz"):
        hashler_metni = message[11:].strip()
    else:
        hashler_metni = " ".join(parcalar[2:]) if len(parcalar) > 2 else (" ".join(parcalar[1:]) if len(parcalar) > 1 else "")
        
    if not hashler_metni:
        return "Lütfen analiz edilecek hash değerini girin. Birden fazla hash'i satır satır veya virgülle ayırarak yazabilirsiniz."

    # çoklu hash desteği (satır satır ayrıştır)
    girdiler = [h.strip() for h in hashler_metni.replace(',', '\n').split('\n') if h.strip()]
    
    # dos koruma limitasyonu
    if len(girdiler) > 10:
        girdiler = girdiler[:10]
        fazla_uyari = "\n*Not: Sistem kararlılığını korumak amacıyla sadece ilk 10 hash değeri analiz edilmiştir.*\n"
    else:
        fazla_uyari = ""

    md = "## 🧬 Gelişmiş Kriptografik Hash Analiz Raporu\n"
    md += fazla_uyari

    for i, girdi in enumerate(girdiler):
        if len(girdi) < 4:
            continue
            
        sonuclar, tuz_uyarisi = analiz_et(girdi)
        
        md += f"\n### Girdi {i+1}: `{girdi[:35]}{'...' if len(girdi)>35 else ''}`\n"
        md += f"- **Karakter Sayısı:** {len(girdi)} karakter\n"
        
        if tuz_uyarisi:
            md += f"- **Yapı Analizi:** {tuz_uyarisi}\n"
            
        if not sonuclar:
            md += "❌ **Analiz Sonucu:** Bu girdinin yapısı bilinen standart hash algoritmalarıyla eşleşmedi. Özel (custom) bir şifreleme, tuzlu yapı veya düz metin olabilir.\n"
        else:
            md += "\n| Olası Algoritma Türü | Güvenlik Derecesi | Tahmini Eşleşme Payı |\n"
            md += "|:-------------------|:------------------|:---------------------|\n"
            for sonuc in sonuclar:
                md += f"| **{sonuc['isim']}** | {sonuc['seviye']} | {sonuc['guven']} |\n"

    md += "\n> 🛡️ **Siber Güvenlik Standart Notu:** Zayıf (🔴) veya Kritik olarak işaretlenen algoritmalar (MD5, SHA-1, LM, NTLM vb.) modern kırma donanımları karşısında güvensizdir ve parola saklama amacıyla kesinlikle **kullanılmamalıdır**. Modern sistemlerde şifre depolama için Argon2id, PBKDF2 veya bcrypt tercih edilmelidir."
    
    return md