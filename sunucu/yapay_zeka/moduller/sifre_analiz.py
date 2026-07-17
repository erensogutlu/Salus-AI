"""
Salus AI - Şifre Gücü ve Entropi Analiz Modülü
==============================================
Bu modül, verilen bir şifrenin siber güvenlik standartlarına uygunluğunu analiz eder.
Karakter seti havuzunun genişliğini, teorik ve pratik entropi (bilgi belirsizliği) bit değerini hesaplar,
l33tspeak dönüşümlerini çözerek sözlük tabanlı tarama yapar ve klavye örüntülerini analiz eder.

Modern 8x RTX 4090 GPU kümeleri gibi yüksek performanslı kaba kuvvet (brute-force) donanımları
referans alınarak çevrimdışı kırılma süresi tahminleri üretilir.
"""

import sys
import json
import io
import math
import re
from typing import List, Dict, Set, Tuple

# utf-8 standart giriş/çıkış yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 20
VERSION: str = "2.1.0"
DESCRIPTION: str = "Gelişmiş şifre gücü, klavye örüntüsü ve pratik entropi analizörü"
AUTHOR: str = "Salus AI"

# siber güvenlikte en sık karşılaşılan zayıf parolalar (top 20 ingilizce)
YAYGIN_SIFRELER: Set[str] = {
    "123456", "123456789", "password", "qwerty", "12345", "12345678", "111111",
    "123123", "admin", "welcome", "1234567", "1234567890", "iloveyou", "test",
    "letmein", "monkey", "dragon", "master", "trustno1", "qazwsx", "asdfghjkl"
}

# türkiye'de en yaygın kullanılan zayıf kelimeler/parolalar
YAYGIN_TURKCE: Set[str] = {
    "ankara", "istanbul", "izmir", "galatasaray", "fenerbahce", "besiktas",
    "trabzonspor", "turkiye", "mustafa", "mehmet", "ahmet", "sanane",
    "1903", "1905", "1907", "1453", "1923"
}

# l33t speak dönüşüm tablosu (sözlük atlatma tespiti için)
L33T_MAP: Dict[str, str] = {
    '@': 'a', '4': 'a',
    '8': 'b',
    '(': 'c', '<': 'c',
    '3': 'e',
    '1': 'i', '!': 'i',
    '0': 'o',
    '$': 's', '5': 's',
    '7': 't', '+': 't',
    'v': 'u'
}


def can_handle(message: str) -> bool:
    """Bu modülün şifre analiz isteklerini sahiplenip sahiplenmeyeceğini kontrol eder.

    Args:
        message (str): Gelen kullanıcı mesajı.

    Returns:
        bool: Eşleşme durumunda True.
    """
    msg = message.lower().strip()
    return msg.startswith("şifre analiz") or msg.startswith("sifre analiz")


def normalizasyon_l33t(sifre: str) -> str:
    """Şifre içindeki l33tspeak karakterleri standart harflere dönüştürür.

    Args:
        sifre (str): Orijinal şifre.

    Returns:
        str: Normalize edilmiş küçük harfli şifre.
    """
    sonuc = sifre.lower()
    for k, v in L33T_MAP.items():
        sonuc = sonuc.replace(k, v)
    return sonuc


def desen_kontrol(sifre: str) -> List[str]:
    """Şifre içindeki tekrarlanan, sıralı ve klavye örüntülerini kontrol eder.

    Args:
        sifre (str): Analiz edilecek şifre.

    Returns:
        List[str]: Tespit edilen zayıf örüntü uyarıları.
    """
    uyarilar: List[str] = []
    kucuk = sifre.lower()
    
    # 1. aynı karakter tekrarları (örn: aaa, 1111)
    if re.search(r'(.)\1{2,}', kucuk):
        uyarilar.append("Şifrenizde 3 veya daha fazla aynı karakter peş peşe tekrarlanıyor.")
        
    # 2. sıralı sayılar ve harfler (düz ve ters)
    sayi_sirali = ["1234", "2345", "3456", "4567", "5678", "6789", "7890", "0123", "4321", "9876", "8765"]
    if any(s in kucuk for s in sayi_sirali):
        uyarilar.append("Şifrenizde kolay tahmin edilebilir sıralı sayılar bulunuyor.")
        
    harf_sirali = ["abcd", "bcde", "cdef", "defg", "efgh", "ijkl", "mnop", "qrst", "uvwx", "wxyz"]
    if any(s in kucuk for s in harf_sirali):
        uyarilar.append("Şifrenizde sıralı alfabetik harf dizilimi bulunuyor.")
        
    # 3. klasik klavye yürüyüşleri (qwerty ve türkçe f/q dizilimi)
    klavye_desenleri = ["qwerty", "asdfgh", "zxcvbn", "qazwsx", "wsxcde", "edcvfr", "mnbvcx", "ytrewq"]
    if any(s in kucuk for s in klavye_desenleri):
        uyarilar.append("Şifrenizde klavyedeki tuş sırasını takip eden kolay örüntüler bulunuyor.")
        
    return uyarilar


def sure_formatla(saniye: float) -> str:
    """Saniye cinsinden süreyi okunabilir zaman birimlerine dönüştürür.

    Args:
        saniye (float): Zaman farkı (saniye).

    Returns:
        str: Okunabilir zaman etiketi.
    """
    if saniye < 1:
        return "Anında (Saliseler içinde)"
    if saniye < 60:
        return f"{int(saniye)} Saniye"
    if saniye < 3600:
        return f"{int(saniye/60)} Dakika"
    if saniye < 86400:
        return f"{int(saniye/3600)} Saat"
    if saniye < 31536000:
        return f"{int(saniye/86400)} Gün"
        
    yillar = int(saniye/31536000)
    if yillar > 1000000000:
        return "Milyarlarca Yıl 🌌"
    if yillar > 1000000:
        return "Milyonlarca Yıl 🌌"
    if yillar > 1000:
        return "Binlerce Yıl 🏛️"
    return f"{yillar} Yıl"


def execute(message: str) -> str:
    """Gelen şifre analiz isteğini yürütür ve detaylı raporu oluşturur.

    Args:
        message (str): Ham kullanıcı girdisi.

    Returns:
        str: Analiz sonuçlarını barındıran markdown tablosu.
    """
    parcalar = message.split(maxsplit=2)
    if len(parcalar) < 3:
        return "Lütfen analiz edilecek şifreyi yazın. Örnek: `şifre analiz P@ssw0rd123`"
        
    sifre = parcalar[2].strip()
    uzunluk = len(sifre)
    
    if uzunluk == 0:
        return "Şifre boş olamaz."
        
    # karakter setlerinin tespiti ve havuz boyutunun hesabı
    havuz_boyutu = 0
    kucuk_harf = any(c.islower() for c in sifre)
    buyuk_harf = any(c.isupper() for c in sifre)
    rakam = any(c.isdigit() for c in sifre)
    ozel_karakter = any(not c.isalnum() for c in sifre)
    
    if kucuk_harf:
        havuz_boyutu += 26
    if buyuk_harf:
        havuz_boyutu += 26
    if rakam:
        havuz_boyutu += 10
    if ozel_karakter:
        havuz_boyutu += 32
        
    # teorik entropi formülü: l * log2(r)
    entropi = uzunluk * math.log2(havuz_boyutu) if havuz_boyutu > 0 else 0
    orijinal_entropi = entropi
    
    # pratik entropi ve ceza puanları (gelişmiş zafiyet kontrolleri)
    ceza_puani = 0.0
    uyarilar: List[str] = []
    
    sifre_kucuk = sifre.lower()
    sifre_l33t = normalizasyon_l33t(sifre)
    
    # 1. sözlük & yaygın parola kontrolü (normalize edilmiş hallerle)
    sozlukte_var = False
    tum_sozluk = YAYGIN_SIFRELER.union(YAYGIN_TURKCE)
    
    for kelime in tum_sozluk:
        if kelime in sifre_kucuk or kelime in sifre_l33t:
            ceza_puani += entropi * 0.45  # %45 entropi cezası
            uyarilar.append(f"Şifreniz çok yaygın bir parola veya kelimeyi ({kelime}) içeriyor.")
            sozlukte_var = True
            break
            
    # 2. desen & tekrar kontrolleri
    desenler = desen_kontrol(sifre)
    if desenler:
        uyarilar.extend(desenler)
        ceza_puani += (entropi * 0.20 * len(desenler))
        
    # 3. çeşitlilik cezaları
    if kucuk_harf and not (buyuk_harf or rakam or ozel_karakter):
        uyarilar.append("Sadece küçük harfler kullanılmış. Karakter çeşitliliği yetersiz.")
        ceza_puani += entropi * 0.15
    elif rakam and not (buyuk_harf or kucuk_harf or ozel_karakter):
        uyarilar.append("Sadece rakamlardan oluşuyor (PIN formatı). Çok hızlı kırılabilir.")
        ceza_puani += entropi * 0.35
        
    # nihai düzeltilmiş pratik entropiyi hesapla
    entropi = max(0.0, orijinal_entropi - ceza_puani)
    
    # kırılma süreleri tahminleri
    # 1. online saldırı: saniyede 100 istek (rate-limiting ve web gecikmesi varsayımıyla)
    online_saniye = (havuz_boyutu ** uzunluk) / 100 if havuz_boyutu > 0 else 0
    
    # 2. offline gpu kaba kuvvet saldırısı: saniyede 100 milyar deneme
    # referans: 8 adet rtx 4090 gpu barındıran modern bir parola kırma donanım kümesi
    gpu_saniye = (havuz_boyutu ** uzunluk) / 100000000000 if havuz_boyutu > 0 else 0
    
    # güç seviyesi sınıflandırması
    if entropi < 35:
        seviye = "Zayıf 🔴"
    elif entropi < 60:
        seviye = "Orta 🟠"
    elif entropi < 80:
        seviye = "Güçlü 🟢"
    else:
        seviye = "Kırılamaz / Ultra Güvenli 🛡️"
        
    # markdown çıktısını hazırlama
    md = f"## 🔒 Kapsamlı Şifre Analiz Sonucu\n\n"
    md += f"**Güvenlik Seviyesi:** {seviye}\n"
    md += f"**Şifre Uzunluğu:** {uzunluk} karakter\n"
    md += f"**Pratik Entropi:** {entropi:.1f} bit *(Teorik Entropi: {orijinal_entropi:.1f} bit)*\n\n"
    
    md += "### ⏱️ Tahmini Parola Kırılma Süreleri\n"
    md += f"- 🌐 **Çevrimiçi Saldırı (100 deneme/sn):** {sure_formatla(online_saniye)}\n"
    md += f"- **Çevrimdışı GPU Saldırısı (100 Milyar deneme/sn - 8x RTX 4090):** {sure_formatla(gpu_saniye)}\n\n"
    
    md += "### Karakter Seti Analizi\n"
    md += f"- Küçük Harf [a-z]: {'✅ Var' if kucuk_harf else '❌ Yok'}\n"
    md += f"- Büyük Harf [A-Z]: {'✅ Var' if buyuk_harf else '❌ Yok'}\n"
    md += f"- Rakamlar [0-9]: {'✅ Var' if rakam else '❌ Yok'}\n"
    md += f"- Özel Karakterler/Semboller: {'✅ Var' if ozel_karakter else '❌ Yok'}\n\n"
    
    if uyarilar:
        md += "### ⚠️ Zafiyetler ve Güvenlik Açıkları\n"
        for uyari in sorted(list(set(uyarilar))):
            md += f"- {uyari}\n"
            
    # profesyonel öneriler
    md += "\n### Profesyonel Güvenlik Tavsiyesi\n"
    tavsiyeler = []
    if uzunluk < 12:
        tavsiyeler.append("Şifre uzunluğunu en az 12-16 karaktere çıkarın. Her ek karakter kırılma zorluğunu logaritmik olarak artırır.")
    if sozlukte_var:
        tavsiyeler.append("Sözlükte yer alan kelimeler yerine, tahmin edilemeyecek rastgele dizgeler veya 'Passphrase' (Parola Cümlesi) yöntemini kullanın.")
    if not ozel_karakter:
        tavsiyeler.append("Şifrenize en az 2-3 adet özel sembol (!, @, #, $, %, vb.) ekleyerek karakter havuzunu genişletin.")
    if not buyuk_harf or not kucuk_harf:
        tavsiyeler.append("Büyük ve küçük harfleri karışık kullanarak parola örüntüsünü karmaşıklaştırın.")
    if entropi >= 80 and not uyarilar:
        tavsiyeler.append("Harika! Güvenlik standartlarının üstünde bir şifre. Bu şifreyi diğer platformlarda tekrar kullanmadığınızdan ve 2FA (İki Faktörlü Doğrulama) aktif ettiğinizden emin olun.")
        
    for tavsiye in tavsiyeler:
        md += f"- {tavsiye}\n"
        
    return md