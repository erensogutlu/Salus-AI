"""
Salus AI - Gelişmiş Log Analiz Modülü
====================================
Bu modül, Nmap veya Masscan tarama loglarını analiz ederek açık portları,
çalışan servisleri, işletim sistemini, SSL/TLS durumunu ve olası güvenlik
zafiyetlerini ayrıştırır. Bulunan verilere göre kapsamlı bir risk puanı ve
tehdit raporu üretir.

Node.js sunucusu ile JSON standardı üzerinden entegre çalışır.
"""

import sys
import json
import base64
import io
import re
import logging
from typing import Any, Dict, List, Tuple, Optional

# loglama yapılandırması (stderr'e yönlendirilmiş)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger("LogAnaliz")

# utf-8 standart giriş/çıkış yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# riskli servis tanımlamaları: port -> (servis adı, risk seviyesi, açıklama)
RISKLI_SERVISLER: Dict[int, Tuple[str, str, str]] = {
    21: ("FTP", "yüksek", "Kaba kuvvet saldırısı veya şifresiz veri aktarımı riski."),
    22: ("SSH", "orta", "Eski versiyonlarda (örn: CVE-2023-38408) RCE riski."),
    23: ("Telnet", "kritik", "Tamamen şifresiz iletişim. Parola sızıntısı kesin."),
    110: ("POP3", "yüksek", "Şifresiz e-posta erişimi."),
    139: ("NetBIOS", "yüksek", "Ağ numaralandırması ve bilgi sızıntısı."),
    143: ("IMAP", "yüksek", "Şifresiz e-posta erişimi."),
    389: ("LDAP", "yüksek", "Anonim erişim açıksa dizin sızıntısı (örn: CVE-2020-1472)."),
    445: ("SMB", "kritik", "NTLM Relay, EternalBlue (CVE-2017-0144) ve fidyeyazılım (WannaCry) riski."),
    873: ("Rsync", "yüksek", "Kimlik doğrulamasız dosya senkronizasyonu / sızıntı."),
    1433: ("MSSQL", "yüksek", "Doğrudan internete açık veritabanı. Kaba kuvvet riski."),
    1521: ("Oracle DB", "yüksek", "Doğrudan internete açık veritabanı."),
    2049: ("NFS", "kritik", "Yetkisiz ağ paylaşımı montajı (Mount) riski."),
    2181: ("ZooKeeper", "yüksek", "Anonim yapılandırma değişikliği riski."),
    2375: ("Docker API", "kritik", "Şifresiz açık Docker API (Doğrudan root seviyesinde RCE)."),
    3306: ("MySQL", "yüksek", "Doğrudan internete açık veritabanı."),
    3389: ("RDP", "kritik", "BlueKeep (CVE-2019-0708) ve sürekli kaba kuvvet fidye saldırısı riski."),
    5432: ("PostgreSQL", "yüksek", "Doğrudan internete açık veritabanı."),
    5900: ("VNC", "kritik", "Şifresiz/Zayıf şifreli uzaktan masaüstü."),
    5984: ("CouchDB", "yüksek", "Açık veritabanı riski."),
    6379: ("Redis", "kritik", "Kimlik doğrulamasız Redis (Anahtar silme ve RCE) riski."),
    8080: ("HTTP-Proxy", "orta", "Yönetim paneli veya eski servis barındırma ihtimali."),
    9200: ("Elasticsearch", "kritik", "Veri sızıntısı ve kimlik doğrulamasız sorgu riski."),
    10050: ("Zabbix", "yüksek", "Bilgi sızıntısı ve RCE."),
    11211: ("Memcached", "kritik", "DDoS amplifikasyon ve yetkisiz veri erişimi riski."),
    27017: ("MongoDB", "kritik", "Kimlik doğrulamasız veritabanı sızıntısı riski (Fidye yazılım hedefi).")
}


def b64_coz(log_metni: str) -> str:
    """Eğer girdi base64 formatındaysa çözer, değilse olduğu gibi döndürür.

    Args:
        log_metni (str): Analiz edilecek ham veya base64 kodlu log metni.

    Returns:
        str: UTF-8 formatında çözülmüş log metni.
    """
    cleaned = log_metni.strip()
    # base64 regex kontrolü (güvenli, sınırlı uzunluk eşleşmeli)
    if re.match(r'^[A-Za-z0-9+/]+={0,2}$', cleaned) and len(cleaned) > 20:
        try:
            return base64.b64decode(cleaned).decode('utf-8')
        except Exception as e:
            logger.debug(f"Base64 çözme denenirken hata oluştu (normal metin olarak devam edilecek): {e}")
    return log_metni


def nmap_port_ayristir(log: str) -> List[Dict[str, Any]]:
    """Nmap standart port tarama çıktısını regex ile ayrıştırır.

    Args:
        log (str): Nmap log içeriği.

    Returns:
        List[Dict[str, Any]]: Ayrıştırılmış port bilgileri listesi.
    """
    portlar: List[Dict[str, Any]] = []
    # nmap port regex'i (redos korumalı ve optimize edilmiş)
    # örnek: 22/tcp open ssh openssh 8.2p1 ubuntu 4ubuntu0.5
    regex = r"^(\d+)/([a-zA-Z0-9\-]+)\s+open\s+([a-zA-Z0-9\-\_]+)(?:\s+(.+))?$"
    
    for line in log.splitlines():
        match = re.match(regex, line.strip())
        if match:
            try:
                p_no = int(match.group(1))
                protokol = match.group(2)
                servis = match.group(3)
                versiyon = match.group(4).strip() if match.group(4) else ""
                
                portlar.append({
                    "port": p_no,
                    "protokol": protokol,
                    "servis": servis,
                    "versiyon": versiyon
                })
            except ValueError:
                continue
    return portlar


def masscan_port_ayristir(log: str) -> List[Dict[str, Any]]:
    """Masscan tarama çıktısını regex ile ayrıştırır.

    Args:
        log (str): Masscan log içeriği.

    Returns:
        List[Dict[str, Any]]: Ayrıştırılmış port bilgileri listesi.
    """
    portlar: List[Dict[str, Any]] = []
    # örnek: discovered open port 80/tcp on 192.168.1.1
    regex = r"Discovered open port (\d+)/([a-zA-Z0-9\-]+) on ([0-9\.]+)"
    
    for match in re.finditer(regex, log):
        try:
            portlar.append({
                "port": int(match.group(1)),
                "protokol": match.group(2),
                "servis": "Bilinmiyor",
                "versiyon": ""
            })
        except (ValueError, IndexError):
            continue
            
    return portlar


def os_ve_cihaz_ayristir(log: str) -> str:
    """Nmap çıktısından İşletim Sistemi (OS) veya cihaz bilgilerini ayrıştırır.

    Args:
        log (str): Log içeriği.

    Returns:
        str: Tespit edilen işletim sistemi adı veya "Bilinmiyor".
    """
    # os details: linux 3.2 - 4.9, routeros 6.32
    os_match = re.search(r"OS details:\s*([^\r\n]+)", log, re.IGNORECASE)
    if os_match:
        return os_match.group(1).strip()
    
    # alternatif: mac tabanlı tespit (mac address: 00:11:22:33:44:55 (cisco systems))
    mac_match = re.search(r"MAC Address: (?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\s+\(([^)]+)\)", log)
    if mac_match:
        return mac_match.group(1).strip() + " Cihazı"
        
    return "Bilinmiyor"


def ssl_ve_nse_ayristir(log: str) -> Tuple[str, List[Dict[str, str]]]:
    """NSE script çıktılarından SSL durumunu ve zafiyet raporlarını ayrıştırır.

    Args:
        log (str): Log içeriği.

    Returns:
        Tuple[str, List[Dict[str, str]]]: SSL Durum metni ve bulunan zafiyetlerin listesi.
    """
    zafiyetler: List[Dict[str, str]] = []
    ssl_durumu = "Bilinmiyor"
    
    # ssl/tls tespiti
    if "ssl-cert:" in log or "443/tcp open" in log or "8443/tcp open" in log:
        ssl_durumu = "Aktif (Hedefte SSL tespit edildi)"
        if "TLSv1.0" in log or "SSLv3" in log or "TLSv1.1" in log:
            ssl_durumu += " - ⚠️ Uyarı: Eski ve zayıf protokoller (SSLv3/TLSv1.0/TLSv1.1) aktif."
            zafiyetler.append({
                "cve": "Zayıf SSL/TLS Yapılandırması",
                "aciklama": "Eski protokol kullanımı (POODLE, BEAST vb. MITM saldırı riskleri).",
                "seviye": "Yüksek"
            })

    # nse zafiyet tespiti (örn: | smb-vuln-ms17-010: vulnerable)
    vuln_matches = re.finditer(r"\|\s+([a-zA-Z0-9\-]+):\s+VULNERABLE", log)
    for v in vuln_matches:
        zafiyetler.append({
            "cve": v.group(1).upper(),
            "aciklama": "Nmap NSE Scripti tarafından doğrulanan zafiyet.",
            "seviye": "Kritik"
        })
        
    return ssl_durumu, zafiyetler


def main() -> None:
    """Log analizinin ana yürütme fonksiyonu."""
    if len(sys.argv) < 2:
        print(json.dumps({
            "basarili": False,
            "hata": "Log verisi alınamadı.",
            "mesaj": "Log verisi alınamadı."
        }))
        return

    try:
        girdi = sys.argv[1]
        log_icerik = b64_coz(girdi)
        
        # 1. hedef ıp/domain tespiti
        hedef = "Bilinmiyor"
        hedef_match = re.search(r"Nmap scan report for ([\w\.\-]+)(?:\s+\(([0-9\.]+)\))?", log_icerik)
        if hedef_match:
            hedef = hedef_match.group(2) if hedef_match.group(2) else hedef_match.group(1)
        else:
            # masscan çıktısı için hedef bulma
            hedef_match = re.search(r"on ([0-9\.]+)", log_icerik)
            if hedef_match:
                hedef = hedef_match.group(1)

        # 2. port ve servis ayrıştırma (nmap veya masscan)
        portlar = nmap_port_ayristir(log_icerik)
        if not portlar:
            portlar = masscan_port_ayristir(log_icerik)
            
        # portları tekilleştir
        port_dict = {}
        for p in portlar:
            port_dict[p["port"]] = p
        portlar = list(port_dict.values())

        # 3. os, ssl ve nse analizi
        os_bilgisi = os_ve_cihaz_ayristir(log_icerik)
        ssl_durumu, script_zafiyetleri = ssl_ve_nse_ayristir(log_icerik)

        # 4. detaylı risk ve tehdit hesaplaması
        risk_puani = 0
        tespit_edilen: List[str] = []
        oneriler: List[str] = []
        acik_port_sonuc: List[Dict[str, Any]] = []
        zafiyetler = script_zafiyetleri
        
        kritik_sayisi = 0
        yuksek_sayisi = 0
        db_port_sayisi = 0

        for p in portlar:
            port_no = p["port"]
            servis = p["servis"].upper()
            versiyon = p["versiyon"]
            
            risk_derecesi = "Düşük"
            versiyon_ek = f" (Versiyon: {versiyon})" if versiyon else ""
            
            if port_no in RISKLI_SERVISLER:
                bilgi = RISKLI_SERVISLER[port_no]
                risk_derecesi = bilgi[1].capitalize()
                aciklama = bilgi[2]
                servis = f"{servis} / {bilgi[0]}"
                
                tespit = f"Açık Port {port_no} ({servis}){versiyon_ek}: {aciklama}"
                tespit_edilen.append(tespit)
                
                if risk_derecesi == "Kritik":
                    kritik_sayisi += 1
                    risk_puani += 35
                    oneriler.append(f"{port_no} portunu acilen kapatın veya sadece VPN/IP Beyaz Liste arkasından erişime izin verin.")
                elif risk_derecesi == "Yüksek":
                    yuksek_sayisi += 1
                    risk_puani += 20
                    oneriler.append(f"{port_no} ({servis}) portunu genel internet erişimine kapatın.")
                    
                if port_no in [1433, 1521, 3306, 5432, 5984, 6379, 9200, 11211, 27017]:
                    db_port_sayisi += 1
            else:
                # standart web portları dışındaki portlar için küçük risk ekle
                if port_no not in [80, 443]:
                    risk_puani += 5

            acik_port_sonuc.append({
                "port": port_no,
                "servis": f"{servis}{versiyon_ek}",
                "risk": risk_derecesi.lower()
            })

        # bileşik risk kuralları
        if db_port_sayisi > 0 and "Aktif" not in ssl_durumu:
            risk_puani += 25
            tespit_edilen.append("Bileşik Risk: Şifrelenmemiş (HTTP/Plaintext) kanal üzerinden erişilebilen veritabanı portları tespit edildi.")
            oneriler.append("Tüm veritabanı bağlantılarında SSL/TLS şifrelemesini zorunlu kılın.")
            
        if kritik_sayisi >= 2:
            risk_puani += 30
            tespit_edilen.append("Bileşik Risk: Hedef sistemde birden fazla kritik yönetimsel servis (RDP/SMB/Telnet vb.) dışa açık.")
            
        if any(p["versiyon"] for p in portlar):
            oneriler.append("Açık servis versiyonlarını bilinen zafiyet veri tabanları (NVD, CVE) üzerinden düzenli olarak kontrol edin.")

        # risk puanını sınırlandır [0-100]
        risk_puani = min(100, risk_puani)
        
        if risk_puani == 0 and not portlar:
            tespit_edilen.append("Log içeriğinde açık bir port veya belirgin zafiyet bulunamadı.")
            
        # tehdit seviyesi etiketi
        if risk_puani <= 10:
            seviye = "güvenli"
        elif risk_puani <= 30:
            seviye = "düşük"
        elif risk_puani <= 60:
            seviye = "orta"
        elif risk_puani <= 85:
            seviye = "yüksek"
        else:
            seviye = "kritik"

        # sonuç objesi
        sonuc = {
            "basarili": True,
            "hedef": hedef,
            "riskPuani": risk_puani,
            "tehditSeviyesi": seviye,
            "tehditTipi": "Tarama Log Analizi",
            "tespitEdilen": tespit_edilen if tespit_edilen else ["Zafiyet tespit edilmedi."],
            "oneriler": list(set(oneriler)) if oneriler else ["Mevcut güvenli yapılandırmayı koruyun."],
            "acikPortlar": sorted(acik_port_sonuc, key=lambda x: x["port"]),
            "tesbitEdilenZafiyetler": zafiyetler,
            "sslDurumu": ssl_durumu,
            "sunucuBilgisi": {
                "isletimSistemi": os_bilgisi,
                "taramaCipi": "Nmap / Masscan"
            }
        }
        
        print(json.dumps(sonuc, ensure_ascii=False))

    except Exception as e:
        logger.error(f"Beklenmeyen log analiz hatası: {e}", exc_info=True)
        print(json.dumps({
            "basarili": False,
            "hata": str(e),
            "mesaj": "Log analizi sırasında teknik bir hata oluştu."
        }))


if __name__ == "__main__":
    main()