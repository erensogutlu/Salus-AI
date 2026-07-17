"""
Salus AI - Örnek Modül Şablonu
================================
Bu dosya yeni modül geliştirmek isteyenler için bir şablon görevi görür.
Her modül aşağıdaki yapıyı ve standartları takip etmelidir.

Zorunlu fonksiyonlar:
 - can_handle(message: str) -> bool : Mesajın bu modüle ait olup olmadığını kontrol eder.
 - execute(message: str) -> str   : Mesajı işler ve markdown formatında yanıt döndürür.

İsteğe bağlı metadata:
 - PRIORITY (int)   : Modül önceliği (düşük sayı = yüksek öncelik, varsayılan 50)
 - VERSION (str)   : Modül versiyonu
 - DESCRIPTION (str) : Modül açıklaması
 - AUTHOR (str)    : Modül yazarı
"""

# ─── metadata ──────────────────────────────────────────────
PRIORITY: int = 99     # şablon olduğu için en düşük öncelik
VERSION: str = "2.1.0"
DESCRIPTION: str = "Geliştirici test modülü ve standart kodlama şablonu"
AUTHOR: str = "Salus AI Team"


# ─── tetıkleyıcı ───────────────────────────────────────────
def can_handle(message: str) -> bool:
    """Bu modülün gelen mesajı işleyip işlemeyeceğini kontrol eder.

    Args:
        message (str): Kullanıcıdan gelen ham mesaj.

    Returns:
        bool: Mesaj bu modül tarafından işlenebilecekse True, aksi takdirde False.
    """
    msg = message.lower().strip()
    return msg.startswith("merhaba python") or msg.startswith("test modülü")


# ─── ıslemcı ───────────────────────────────────────────────
def execute(message: str) -> str:
    """Mesajı işler ve markdown formatında yapılandırılmış yanıt döndürür.

    Args:
        message (str): İşlenecek olan ham mesaj.

    Returns:
        str: Kullanıcıya sunulacak markdown formatındaki yanıt.
    """
    return """## Salus AI Python Modül Sistemi

**Durum:** ✅ Aktif ve çalışıyor!

Bu mesaj doğrudan Python modül altyapısı tarafından üretilmiştir.

### Sistem Bilgisi
| Özellik | Değer |
|---------|-------|
| Modül Adı | Örnek Modül |
| Versiyon | 2.1.0 |
| Öncelik | 99 (Düşük) |
| Durum | Hazır ve Çalışıyor |

### Mevcut Modüller
- 🔍 **Şifre Analiz** — Şifre gücü değerlendirmesi
- **Şifre Üretici** — Güvenli şifre oluşturma
- 🧬 **Hash Tanımlayıcı** — Hash türü tanıma
- 🌐 **Header Analiz** — HTTP güvenlik başlığı kontrolü
- **IP Sorgu** — IP adresi istihbarat sorgulama
- **Base64 Aracı** — Kodlama/çözme aracı
- 🗺️ **Subdomain Bulucu** — Alt alan adı keşfi
- 🖥️ **Log Analiz** — Nmap/Masscan log ayrıştırma
- 🛡️ **Salus Scanner** — Ağ tarama motoru
"""