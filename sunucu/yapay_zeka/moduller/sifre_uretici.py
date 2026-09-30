"""
Salus AI - Kriptografik Güvenli Şifre ve Passphrase Üretici
===========================================================
Bu modül, kriptografik olarak güvenli sözde rastgele sayı üreteci (secrets modülü)
kullanarak yüksek entropili şifreler ve hatırlanabilir parola cümleleri (passphrase) üretir.

Olası brute-force saldırılarına dayanıklı, çeşitli uzunluklarda ve karakter
kümesi seçenekleriyle 3 farklı alternatif sunar.
"""

import sys
import json
import io
import math
import secrets
import string
from typing import List, Tuple, Dict, Any

# utf-8 yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# modül bilgileri
PRIORITY: int = 20
VERSION: str = "2.1.0"
DESCRIPTION: str = "Kriptografik güvenli şifre ve parola cümlesi (passphrase) oluşturucu"
AUTHOR: str = "Salus AI"

TETIKLEYICILER: List[str] = ["şifre üret", "sifre uret", "parola üret", "parola uret"]

# türkçe kelime havuzu
TURKCE_KELIMELER: List[str] = [
    "akil", "alan", "altin", "arac", "aslan", "ayar", "ayna", "baca", "bakir", "balik",
    "baris", "basari", "baskan", "bayrak", "bekci", "belge", "beyin", "bilgi", "bilim", "bina",
    "birlik", "boya", "bulut", "cadde", "cevre", "ceviz", "cicek", "ciftci", "cizgi", "dagci",
    "damla", "deger", "demir", "deniz", "ders", "destan", "detay", "dilek", "direk", "dogu",
    "dunya", "duvar", "ekran", "elma", "emek", "enerji", "erken", "eylem", "fark", "fikir",
    "fizik", "gece", "gezi", "giris", "gozluk", "guc", "gumus", "gunes", "guven", "haber",
    "halka", "harita", "hastane", "hedef", "hizmet", "huzur", "isik", "kablo", "kagit", "kahve",
    "kalem", "kalp", "kamera", "kanun", "kaplan", "karar", "kartal", "kaynak", "kedi", "kemer",
    "kimya", "kitap", "klavye", "konu", "kopek", "kopru", "kural", "kurum", "kutup", "kuzu",
    "liman", "liste", "maden", "mavi", "medya", "merkez", "metot", "meyve", "mimar", "muzik",
    "nehir", "nesil", "nukleer", "ocak", "oda", "orman", "ortak", "oyun", "ozgur", "paket",
    "pamuk", "parola", "pazar", "petrol", "piyano", "proje", "radyo", "renk", "resim", "roket",
    "roman", "ruzgar", "saat", "sabah", "saglik", "sahil", "sari", "savas", "sehir", "seker",
    "selale", "sembol", "sevgi", "sinir", "sistem", "siyah", "sozluk", "surec", "tarih", "tarim",
    "tasarim", "tavan", "tehlike", "teknik", "telefon", "teori", "toprak", "toren", "trafik", "tren",
    "turk", "uyum", "uzay", "vadi", "veri", "vezir", "yagmur", "yakin", "yasam", "yazar",
    "yesil", "yildiz", "yolcu", "yonetim", "yontem", "yurek", "zafer", "zaman", "zeytin", "zincir"
]


def can_handle(message: str) -> bool:
    """Modülün şifre üretme isteklerini sahiplenip sahiplenmeyeceğini kontrol eder.

    Args:
        message (str): Kullanıcı mesajı.

    Returns:
        bool: Eşleşme durumunda True.
    """
    msg = message.lower().strip()
    return any(msg.startswith(t) for t in TETIKLEYICILER) or "hatırlanabilir şifre" in msg or "passphrase" in msg


def rastgele_sifre_uret(uzunluk: int, ozel_haric: bool) -> Tuple[str, float]:
    """Kriptografik güvenli rastgele şifre üretir ve entropisini hesaplar.

    Args:
        uzunluk (int): Şifre karakter uzunluğu.
        ozel_haric (bool): True ise özel karakter eklenmez.

    Returns:
        Tuple[str, float]: Üretilen şifre ve hesaplanan entropi (bit).
    """
    harfler_kucuk = string.ascii_lowercase
    harfler_buyuk = string.ascii_uppercase
    rakamlar = string.digits
    ozeller = "!@#$%^&*()-_=+[]{}|;:,.<>?"
    
    havuz = harfler_kucuk + harfler_buyuk + rakamlar
    if not ozel_haric:
        havuz += ozeller
        
    havuz_boyutu = len(havuz)
    max_deneme = 1000
    sifre = ""
    
    for _ in range(max_deneme):
        sifre = ''.join(secrets.choice(havuz) for _ in range(uzunluk))
        # şifre karmaşıklık kontrolü
        kucuk_kontrol = any(c.islower() for c in sifre)
        buyuk_kontrol = any(c.isupper() for c in sifre)
        rakam_kontrol = any(c.isdigit() for c in sifre)
        ozel_kontrol = ozel_haric or any(c in ozeller for c in sifre)
        
        if kucuk_kontrol and buyuk_kontrol and rakam_kontrol and ozel_kontrol:
            break
            
    # entropi hesabı
    entropi = uzunluk * math.log2(havuz_boyutu)
    return sifre, entropi


def passphrase_uret(kelime_sayisi: int) -> Tuple[str, float]:
    """Türkçe kelime havuzunu kullanarak kriptografik güvenli parola cümlesi (passphrase) üretir.

    Args:
        kelime_sayisi (int): Cümlede yer alacak kelime sayısı.

    Returns:
        Tuple[str, float]: Üretilen passphrase ve hesaplanan entropi (bit).
    """
    secilenler = [secrets.choice(TURKCE_KELIMELER) for _ in range(kelime_sayisi)]
    
    # ayıraç ve sayı eki
    ayirac = secrets.choice(["-", ".", "_"])
    sayi_eki = secrets.randbelow(90) + 10  # rastgele sayı eki
    passphrase = ayirac.join(secilenler) + str(sayi_eki)
    
    # parola öbeği entropisi
    entropi = (kelime_sayisi * math.log2(len(TURKCE_KELIMELER))) + math.log2(3) + math.log2(90)
    
    return passphrase, entropi


def seviye_belirle(entropi: float) -> str:
    """Entropi değerine göre şifre güvenlik sınıflandırmasını belirler.

    Args:
        entropi (float): Şifre bilgi belirsizliği (bit).

    Returns:
        str: Güvenlik seviyesi etiketi.
    """
    if entropi < 40:
        return "Zayıf 🔴"
    if entropi < 60:
        return "Orta 🟠"
    if entropi < 80:
        return "Güvenli 🟢"
    return "Mükemmel / Ultra Güvenli 🛡️"


def execute(message: str) -> str:
    """Şifre/Passphrase üretme komutunu işler ve yanıt oluşturur.

    Args:
        message (str): Kullanıcıdan gelen komut mesajı.

    Returns:
        str: Markdown formatında şifre listesi.
    """
    msg_lower = message.lower()
    
    # parametre kontrolü
    passphrase_modu = "passphrase" in msg_lower or "hatırlana" in msg_lower or "kelime" in msg_lower
    ozel_haric = "özel karakter" in msg_lower and any(x in msg_lower for x in ["olmasın", "hariç", "kullanma"])
    
    # varsayılan uzunluk
    uzunluk = 16
    kelime_sayisi = 4
    
    # sayı parametreleri
    sayilar = [int(s) for s in msg_lower.split() if s.isdigit()]
    if sayilar:
        sayi = sayilar[0]
        if passphrase_modu:
            kelime_sayisi = max(3, min(sayi, 10))  # kelime sınırı
        else:
            uzunluk = max(8, min(sayi, 128))       # karakter sınırı
            
    sonuclar: List[Dict[str, Any]] = []
    
    # alternatif şifreler
    for _ in range(3):
        if passphrase_modu:
            sifre, entropi = passphrase_uret(kelime_sayisi)
            tur = f"{kelime_sayisi} Kelimeli Türkçe Passphrase"
        else:
            sifre, entropi = rastgele_sifre_uret(uzunluk, ozel_haric)
            tur = f"{uzunluk} Karakterli Rastgele{' (Özel Karakter Hariç)' if ozel_haric else ''}"
            
        sonuclar.append({
            "sifre": sifre,
            "entropi": entropi,
            "tur": tur
        })
        
    baslik_tur = "Parola Cümlesi (Passphrase)" if passphrase_modu else "Kriptografik Güvenli Şifre"
    md = f"## 🔑 {baslik_tur} Üretim Sonuçları\n\n"
    md += "Sizin için kriptografik olarak güvenli 3 alternatif ürettim. İstediğinizi kopyalayarak kullanabilirsiniz:\n\n"
    
    for i, snc in enumerate(sonuclar):
        seviye = seviye_belirle(snc['entropi'])
        md += f"### Seçenek {i+1}: {seviye}\n"
        md += f"```text\n{snc['sifre']}\n```\n"
        md += f"- **Şifre Tipi:** {snc['tur']}\n"
        md += f"- **Entropi Değeri:** {snc['entropi']:.1f} bit\n\n"
        
    md += "> 💡 **Güvenlik İpucu:** Üretilen şifrelerinizi güvende tutmak için güvenilir bir **Şifre Yöneticisi (Password Manager)** kullanmanız ve önemli hesaplarınızda **MFA/2FA** (Çok Faktörlü Doğrulama) özelliğini aktif etmeniz önemle tavsiye edilir."
    
    return md