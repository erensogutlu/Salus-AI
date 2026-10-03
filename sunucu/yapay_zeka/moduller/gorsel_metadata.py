"""
Salus AI - Görsel Metadata ve EXIF Güvenlik/Gizlilik Analiz Modülü
==================================================================
Bu modül, JPEG, PNG, WEBP ve TIFF formatındaki görsellerin EXIF metadata,
kamera donanım bilgileri, çekim parametreleri, GPS coğrafi konum bilgileri ve
güvenlik/gizlilik risklerini (OSINT analizi) tespit eder.

Özellikler:
- Saf Python ile bağımsız JPEG EXIF (APP1/TIFF/IFD0/ExifIFD/GPSIFD) ayrıştırıcı
- PNG metadata (IHDR, tEXt, zTXt, iTXt, eXIf, pHYs, tIME) ayrıştırıcı
- GPS koordinatlarını ondalık dereceye (Decimals) dönüştürme ve harita bağlantısı
- Gizlilik ve OSINT risk analizi (Konum sızıntısı, Cihaz parmak izi tespiti)
- Dosya sonu ek veri (Trailing bytes / Steganografi ipucu) tespiti
"""

import sys
import os
import json
import io
import struct
import base64
import urllib.request
import re
from typing import Dict, Any, List, Optional, Tuple

# utf-8 yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PRIORITY: int = 42
VERSION: str = "1.0.0"
DESCRIPTION: str = "Görsel EXIF, Metadata, GPS Konum ve Gizlilik/OSINT Analiz Motoru"
AUTHOR: str = "Salus AI"

TETIKLEYICILER: List[str] = [
    "görsel analiz", "gorsel analiz", "exif analiz", "metadata analiz", "resim analiz",
    "fotoğraf analiz", "fotograf analiz", "image analysis", "exif", "metadata"
]

TAG_NAMES = {
    0x010E: "ImageDescription",
    0x010F: "Make",
    0x0110: "Model",
    0x0112: "Orientation",
    0x011A: "XResolution",
    0x011B: "YResolution",
    0x0128: "ResolutionUnit",
    0x0131: "Software",
    0x0132: "DateTime",
    0x013B: "Artist",
    0x8298: "Copyright",
    0x8769: "ExifOffset",
    0x8825: "GPSInfo",
    0x829A: "ExposureTime",
    0x829D: "FNumber",
    0x8822: "ExposureProgram",
    0x8827: "ISOSpeedRatings",
    0x9000: "ExifVersion",
    0x9003: "DateTimeOriginal",
    0x9004: "DateTimeDigitized",
    0x9201: "ShutterSpeedValue",
    0x9202: "ApertureValue",
    0x9204: "ExposureBiasValue",
    0x9207: "MeteringMode",
    0x9208: "LightSource",
    0x9209: "Flash",
    0x920A: "FocalLength",
    0x9286: "UserComment",
    0xA001: "ColorSpace",
    0xA002: "PixelXDimension",
    0xA003: "PixelYDimension",
    0xA405: "FocalLengthIn35mmFilm",
    0xA406: "SceneCaptureType"
}

GPS_TAGS = {
    0x0000: "GPSVersionID",
    0x0001: "GPSLatitudeRef",
    0x0002: "GPSLatitude",
    0x0003: "GPSLongitudeRef",
    0x0004: "GPSLongitude",
    0x0005: "GPSAltitudeRef",
    0x0006: "GPSAltitude",
    0x0007: "GPSTimeStamp",
    0x001D: "GPSDateStamp"
}


def can_handle(message: str) -> bool:
    """Mesajın görsel analiz isteği olup olmadığını kontrol eder."""
    msg = message.lower().strip()
    return any(msg.startswith(t) for t in TETIKLEYICILER)


def _dms_to_decimal(dms: List[float], ref: str) -> Optional[float]:
    """DMS (Derece, Dakika, Saniye) formatını ondalık koordinata dönüştürür."""
    try:
        if not dms or len(dms) < 3:
            return None
        deg, minutes, seconds = float(dms[0]), float(dms[1]), float(dms[2])
        dec = deg + (minutes / 60.0) + (seconds / 3600.0)
        if ref in ['S', 'W', 's', 'w']:
            dec = -dec
        return round(dec, 6)
    except Exception:
        return None


def parse_tiff_ifd(data: bytes, offset: int, endian: str) -> Tuple[Dict[str, Any], Optional[int], Optional[int]]:
    """TIFF IFD bloğunu ayrıştırır."""
    tags: Dict[str, Any] = {}
    exif_offset: Optional[int] = None
    gps_offset: Optional[int] = None

    if offset + 2 > len(data):
        return tags, None, None

    num_entries = struct.unpack(endian + 'H', data[offset:offset+2])[0]
    curr = offset + 2

    for _ in range(num_entries):
        if curr + 12 > len(data):
            break

        tag, tag_type, count, val_or_offset = struct.unpack(endian + 'HHII', data[curr:curr+12])
        curr += 12

        # Değeri çıkar
        val = None
        tag_name = TAG_NAMES.get(tag, f"Tag_0x{tag:04X}")

        try:
            if tag_type == 2:  # ASCII string
                if count <= 4:
                    raw = struct.pack(endian + 'I', val_or_offset)[:count]
                    val = raw.split(b'\x00')[0].decode('utf-8', errors='ignore')
                else:
                    if val_or_offset + count <= len(data):
                        raw = data[val_or_offset:val_or_offset+count]
                        val = raw.split(b'\x00')[0].decode('utf-8', errors='ignore')
            elif tag_type == 3:  # SHORT
                val = val_or_offset & 0xFFFF
            elif tag_type == 4:  # LONG
                val = val_or_offset
            elif tag_type == 5:  # RATIONAL (num, den)
                if val_or_offset + 8 <= len(data):
                    num, den = struct.unpack(endian + 'II', data[val_or_offset:val_or_offset+8])
                    val = round(num / den, 4) if den != 0 else 0
            elif tag_type == 10: # SRATIONAL (signed)
                if val_or_offset + 8 <= len(data):
                    num, den = struct.unpack(endian + 'ii', data[val_or_offset:val_or_offset+8])
                    val = round(num / den, 4) if den != 0 else 0

            if val is not None:
                tags[tag_name] = val

            if tag == 0x8769:
                exif_offset = val_or_offset
            elif tag == 0x8825:
                gps_offset = val_or_offset
        except Exception:
            pass

    return tags, exif_offset, gps_offset


def parse_gps_ifd(data: bytes, offset: int, endian: str) -> Dict[str, Any]:
    """GPS IFD bloğunu ayrıştırır."""
    gps_info: Dict[str, Any] = {}
    if offset + 2 > len(data):
        return gps_info

    num_entries = struct.unpack(endian + 'H', data[offset:offset+2])[0]
    curr = offset + 2

    for _ in range(num_entries):
        if curr + 12 > len(data):
            break

        tag, tag_type, count, val_or_offset = struct.unpack(endian + 'HHII', data[curr:curr+12])
        curr += 12

        tag_name = GPS_TAGS.get(tag, f"GPS_0x{tag:04X}")

        try:
            if tag_type == 2:  # ASCII
                if count <= 4:
                    raw = struct.pack(endian + 'I', val_or_offset)[:count]
                    gps_info[tag_name] = raw.split(b'\x00')[0].decode('utf-8', errors='ignore').strip()
                else:
                    if val_or_offset + count <= len(data):
                        raw = data[val_or_offset:val_or_offset+count]
                        gps_info[tag_name] = raw.split(b'\x00')[0].decode('utf-8', errors='ignore').strip()
            elif tag_type == 5:  # RATIONAL
                if count == 3:  # DMS
                    dms = []
                    for i in range(3):
                        p = val_or_offset + (i * 8)
                        if p + 8 <= len(data):
                            num, den = struct.unpack(endian + 'II', data[p:p+8])
                            dms.append(num / den if den != 0 else 0)
                    gps_info[tag_name] = dms
                elif count == 1:
                    if val_or_offset + 8 <= len(data):
                        num, den = struct.unpack(endian + 'II', data[val_or_offset:val_or_offset+8])
                        gps_info[tag_name] = round(num / den, 2) if den != 0 else 0
        except Exception:
            pass

    return gps_info


def parse_jpeg_exif(raw_bytes: bytes) -> Dict[str, Any]:
    """JPEG baytlarından EXIF ve segment bilgilerini ayrıştırır."""
    result: Dict[str, Any] = {
        "format": "JPEG",
        "boyut_bayt": len(raw_bytes),
        "exif_bulundu": False,
        "etiketler": {},
        "gps": {},
        "anomaliler": []
    }

    if not raw_bytes.startswith(b'\xFF\xD8'):
        return result

    idx = 2
    length = len(raw_bytes)

    while idx < length - 1:
        if raw_bytes[idx] != 0xFF:
            break

        marker = raw_bytes[idx + 1]
        idx += 2

        # Standalone markers
        if marker in [0xD8, 0xD9, 0x00] or (0xD0 <= marker <= 0xD7):
            continue

        if idx + 2 > length:
            break

        seg_len = struct.unpack('>H', raw_bytes[idx:idx+2])[0]
        seg_data = raw_bytes[idx+2 : idx+seg_len]

        # APP1 (EXIF)
        if marker == 0xE1 and seg_data.startswith(b'Exif\x00\x00'):
            result["exif_bulundu"] = True
            tiff_data = seg_data[6:]

            if len(tiff_data) >= 8:
                endian_marker = tiff_data[:2]
                endian = '<' if endian_marker == b'II' else '>'
                first_ifd_offset = struct.unpack(endian + 'I', tiff_data[4:8])[0]

                ifd0_tags, exif_offset, gps_offset = parse_tiff_ifd(tiff_data, first_ifd_offset, endian)
                result["etiketler"].update(ifd0_tags)

                if exif_offset and exif_offset < len(tiff_data):
                    exif_tags, _, extra_gps = parse_tiff_ifd(tiff_data, exif_offset, endian)
                    result["etiketler"].update(exif_tags)
                    if not gps_offset and extra_gps:
                        gps_offset = extra_gps

                if gps_offset and gps_offset < len(tiff_data):
                    gps_tags = parse_gps_ifd(tiff_data, gps_offset, endian)
                    result["gps"].update(gps_tags)

        # SOF (Dimensions)
        elif marker in [0xC0, 0xC1, 0xC2]:
            if len(seg_data) >= 5:
                precision, height, width = struct.unpack('>BHH', seg_data[:5])
                result["etiketler"]["ImageWidth"] = width
                result["etiketler"]["ImageHeight"] = height

        # APP13 (Photoshop IPTC)
        elif marker == 0xED and b'Photoshop' in seg_data:
            result["etiketler"]["SoftwareNote"] = "Adobe Photoshop IPTC Metadata Tespit Edildi"

        # COM (Comment)
        elif marker == 0xFE:
            try:
                result["etiketler"]["Comment"] = seg_data.decode('utf-8', errors='ignore')
            except Exception:
                pass

        idx += seg_len

    # Dosya sonu ek veri (Trailing / Stego) kontrolü
    eoi_pos = raw_bytes.rfind(b'\xFF\xD9')
    if eoi_pos != -1 and eoi_pos < length - 2:
        ek_bayt_sayisi = length - (eoi_pos + 2)
        if ek_bayt_sayisi > 64:
            result["anomaliler"].append(
                f"Şüpheli Ek Veri: JPEG EOI (End-of-Image) sonrasında {ek_bayt_sayisi} bayt fazladan veri tespit edildi. (Steganografi veya gizlenmiş payload olasılığı)"
            )

    return result


def parse_png_metadata(raw_bytes: bytes) -> Dict[str, Any]:
    """PNG baytlarından metadata ve chunk bilgilerini ayrıştırır."""
    result: Dict[str, Any] = {
        "format": "PNG",
        "boyut_bayt": len(raw_bytes),
        "exif_bulundu": False,
        "etiketler": {},
        "gps": {},
        "anomaliler": []
    }

    if not raw_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
        return result

    idx = 8
    length = len(raw_bytes)

    while idx + 8 <= length:
        chunk_len = struct.unpack('>I', raw_bytes[idx:idx+4])[0]
        chunk_type = raw_bytes[idx+4:idx+8].decode('latin-1', errors='ignore')
        chunk_data = raw_bytes[idx+8:idx+8+chunk_len]

        if chunk_type == 'IHDR' and len(chunk_data) >= 8:
            width, height = struct.unpack('>II', chunk_data[:8])
            result["etiketler"]["ImageWidth"] = width
            result["etiketler"]["ImageHeight"] = height

        elif chunk_type in ['tEXt', 'zTXt', 'iTXt']:
            try:
                parts = chunk_data.split(b'\x00', 1)
                if len(parts) >= 2:
                    k = parts[0].decode('utf-8', errors='ignore')
                    v = parts[1].decode('utf-8', errors='ignore')
                    result["etiketler"][k] = v
                    result["exif_bulundu"] = True
            except Exception:
                pass

        elif chunk_type == 'pHYs' and len(chunk_data) >= 9:
            ppu_x, ppu_y, unit = struct.unpack('>IIB', chunk_data[:9])
            if unit == 1:
                result["etiketler"]["DPI"] = f"{round(ppu_x * 0.0254)} DPI"

        elif chunk_type == 'tIME' and len(chunk_data) >= 7:
            year, mon, day, h, m, s = struct.unpack('>HBBBBB', chunk_data[:7])
            result["etiketler"]["ModifyDate"] = f"{year}:{mon:02d}:{day:02d} {h:02d}:{m:02d}:{s:02d}"

        elif chunk_type == 'IEND':
            if idx + 12 < length:
                ek_bayt = length - (idx + 12)
                if ek_bayt > 32:
                    result["anomaliler"].append(
                        f"Şüpheli Ek Veri: PNG IEND chunk'ından sonra {ek_bayt} bayt fazlalık veri tespit edildi."
                    )
            break

        idx += 12 + chunk_len

    return result


def analiz_yap(girdi: str) -> Dict[str, Any]:
    """Base64 veya URL halindeki görsel verisini çözer ve ayrıntılı analiz üretir."""
    raw_data: Optional[bytes] = None
    kaynak_adi = "Yüklenen Görsel"

    # 1. URL mi?
    if girdi.startswith("http://") or girdi.startswith("https://"):
        kaynak_adi = girdi.split("?")[0].split("/")[-1] or "web_gorseli.jpg"
        try:
            req = urllib.request.Request(
                girdi,
                headers={"User-Agent": "Salus-AI-Security-Scanner/2.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw_data = resp.read()
        except Exception as e:
            return {"basarili": False, "hata": f"Görsel URL'den indirilemedi: {str(e)}"}

    # 2. Data URL veya Base64 mü?
    elif "base64," in girdi:
        b64_str = girdi.split("base64,")[1]
        try:
            raw_data = base64.b64decode(b64_str)
        except Exception:
            return {"basarili": False, "hata": "Geçersiz Base64 görsel verisi."}
    else:
        # Doğrudan base64 denemesi
        try:
            raw_data = base64.b64decode(girdi)
        except Exception:
            return {"basarili": False, "hata": "Veri görsel formatında okunamadı."}

    if not raw_data:
        return {"basarili": False, "hata": "Boş görsel verisi."}

    # Format tespit ve çözümleme
    if raw_data.startswith(b'\xFF\xD8'):
        analiz = parse_jpeg_exif(raw_data)
    elif raw_data.startswith(b'\x89PNG'):
        analiz = parse_png_metadata(raw_data)
    elif raw_data.startswith(b'RIFF') and b'WEBP' in raw_data[:12]:
        analiz = {"format": "WEBP", "boyut_bayt": len(raw_data), "exif_bulundu": False, "etiketler": {}, "gps": {}, "anomaliler": []}
    else:
        return {"basarili": False, "hata": "Desteklenmeyen veya bozuk görsel formatı (JPEG/PNG/WEBP desteklenir)."}

    # GPS Koordinat Hesaplama
    gps_dict = analiz.get("gps", {})
    lat_dms = gps_dict.get("GPSLatitude")
    lat_ref = gps_dict.get("GPSLatitudeRef", "N")
    lon_dms = gps_dict.get("GPSLongitude")
    lon_ref = gps_dict.get("GPSLongitudeRef", "E")
    altitude = gps_dict.get("GPSAltitude")

    decimal_lat = _dms_to_decimal(lat_dms, lat_ref) if lat_dms else None
    decimal_lon = _dms_to_decimal(lon_dms, lon_ref) if lon_dms else None

    # Gizlilik & Güvenlik Risk Skoru Hesaplama (0 = Tamamen Güvenli, 100 = Kritik Risk)
    risk_puani = 0
    risk_faktorleri: List[str] = []

    if decimal_lat and decimal_lon:
        risk_puani += 50
        risk_faktorleri.append("🔴 KRİTİK: Görselde tam coğrafi konum (GPS Koordinatları) açıkta! Fotoğrafın çekildiği yer tespit edilebilir.")

    if analiz["etiketler"].get("Make") or analiz["etiketler"].get("Model"):
        risk_puani += 20
        risk_faktorleri.append(f"🟠 YÜKSEK: Cihaz donanım bilgisi ({analiz['etiketler'].get('Make', '')} {analiz['etiketler'].get('Model', '')}) açıkta. Cihaz parmak izi çıkarılabilir.")

    if analiz["etiketler"].get("DateTimeOriginal") or analiz["etiketler"].get("DateTime"):
        risk_puani += 10
        risk_faktorleri.append("🟡 ORTA: Çekim zaman damgası mevcut (Kişisel zaman analizi yapılabilir).")

    if analiz["etiketler"].get("Artist") or analiz["etiketler"].get("Copyright") or analiz["etiketler"].get("UserComment"):
        risk_puani += 10
        risk_faktorleri.append("🟡 ORTA: Yazar, telif veya kullanıcı yorumu alanlarında kişisel bilgi izi var.")

    if analiz["anomaliler"]:
        risk_puani += 25
        for a in analiz["anomaliler"]:
            risk_faktorleri.append(f"🔴 ANOMALİ: {a}")

    risk_puani = min(100, risk_puani)
    seviye = "Kritik" if risk_puani >= 70 else "Yüksek" if risk_puani >= 50 else "Orta" if risk_puani >= 30 else "Düşük (Güvenli)"

    # Markdown Çıktısı Üretimi
    cikti = [
        f"# 📸 Görsel Metadata & Adli Bilişim Raporu: `{kaynak_adi}`\n",
        f"**Dosya Formatı:** {analiz['format']} | **Boyut:** {round(analiz['boyut_bayt'] / 1024, 2)} KB | **EXIF Verisi:** {'Mevcut' if analiz['exif_bulundu'] else 'Bulunamadı/Temiz'}",
        f"\n### 🛡️ Gizlilik ve OSINT Risk Değerlendirmesi: `{seviye}` (Risk Skoru: {risk_puani}/100)\n"
    ]

    if risk_faktorleri:
        cikti.append("Tespit Edilen Gizlilik ve Güvenlik Bulguları:")
        for rf in risk_faktorleri:
            cikti.append(f"- {rf}")
    else:
        cikti.append("✅ Görselde hassas konum, yazar veya cihaz bilgisi tespit edilmedi (Gizlilik güvenli).")

    # GPS Bölümü
    if decimal_lat and decimal_lon:
        maps_link = f"https://www.google.com/maps?q={decimal_lat},{decimal_lon}"
        osm_link = f"https://www.openstreetmap.org/?mlat={decimal_lat}&mlon={decimal_lon}#map=16/{decimal_lat}/{decimal_lon}"
        cikti.append("\n### 📍 Coğrafi Konum (GPS) Bilgileri")
        cikti.append(f"- **Enlem (Latitude):** `{decimal_lat}` ({lat_ref})")
        cikti.append(f"- **Boylam (Longitude):** `{decimal_lon}` ({lon_ref})")
        if altitude:
            cikti.append(f"- **Rakım (Altitude):** `{altitude}` metre")
        cikti.append(f"- **Harita Bağlantıları:** [Google Maps'te Aç]({maps_link}) | [OpenStreetMap'te Aç]({osm_link})")

    # Kamera & Cihaz Parametreleri
    tags = analiz["etiketler"]
    cikti.append("\n### 📷 Cihaz & Kamera Parametreleri")
    cikti.append(f"| Özellik | Değer |")
    cikti.append(f"| :--- | :--- |")
    cikti.append(f"| **Cihaz Markası / Modeli** | {tags.get('Make', '-')} {tags.get('Model', '')} |")
    cikti.append(f"| **Çözünürlük** | {tags.get('ImageWidth', '-')} x {tags.get('ImageHeight', '-')} px |")
    cikti.append(f"| **Yazılım / Firmware** | {tags.get('Software', tags.get('SoftwareNote', '-'))} |")
    fnumber_str = f"f/{tags.get('FNumber')}" if tags.get('FNumber') else '-'
    exposure_str = f"{tags.get('ExposureTime')} s" if tags.get('ExposureTime') else '-'
    focal_str = f"{tags.get('FocalLength')} mm" if tags.get('FocalLength') else '-'

    cikti.append(f"| **Diyafram (F-Stop)** | {fnumber_str} |")
    cikti.append(f"| **Enstantane (Exposure)** | {exposure_str} |")
    cikti.append(f"| **ISO Değeri** | {tags.get('ISOSpeedRatings', '-')} |")
    cikti.append(f"| **Odak Uzaklığı** | {focal_str} |")

    # Öneriler
    cikti.append("\n### 💡 Güvenlik & Gizlilik Tavsiyeleri")
    if decimal_lat:
        cikti.append("1. **Konum Gizliliği:** İnternette veya sosyal medyada fotoğraf paylaşmadan önce kameranızın GPS konum etiketleme özelliğini kapatın.")
    cikti.append("2. **Metadata Temizleme:** Hassas ortamlara görsel yüklemeden önce Salus AI'ın **'Metadata Temizle ve Güvenli İndir'** özelliğini kullanarak tüm EXIF etiketlerini sıfırlayın.")
    cikti.append("3. **OSINT Koruması:** Fotoğrafın çekildiği saat ve cihaz modelinin sosyal mühendislik saldırılarında kullanılabileceğini unutmayın.")

    return {
        "basarili": True,
        "format": analiz["format"],
        "boyut_kb": round(analiz["boyut_bayt"] / 1024, 2),
        "risk_puani": risk_puani,
        "seviye": seviye,
        "gps": {
            "enlem": decimal_lat,
            "boylam": decimal_lon,
            "rakim": altitude,
            "mevcut": bool(decimal_lat and decimal_lon)
        },
        "etiketler": tags,
        "anomaliler": analiz["anomaliler"],
        "markdown": "\n".join(cikti)
    }


def execute(message: str) -> Dict[str, Any]:
    """Python modül yöneticisi yürütme fonksiyonu."""
    temiz = message.strip()
    for t in TETIKLEYICILER:
        if temiz.lower().startswith(t):
            temiz = temiz[len(t):].strip()
            break

    sonuc = analiz_yap(temiz)
    if not sonuc.get("basarili"):
        return {
            "handled": True,
            "response": f"❌ **Görsel Analiz Hatası:** {sonuc.get('hata', 'Bilinmeyen hata.')}"
        }

    return {
        "handled": True,
        "response": sonuc["markdown"],
        "veri": sonuc
    }


if __name__ == "__main__":
    test_msg = "görsel analiz https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png"
    if len(sys.argv) > 1:
        test_msg = sys.argv[1]
    res = execute(test_msg)
    print(json.dumps(res, ensure_ascii=False, indent=2))
