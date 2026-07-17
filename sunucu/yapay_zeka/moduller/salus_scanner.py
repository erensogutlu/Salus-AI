import sys
import json
import socket
import urllib.request
import urllib.parse
import time
import concurrent.futures
import salus_common

def host_cozumle(hedef):
    """Hedef URL veya domain/IP adresini temizler ve IP adresini çözer."""
    return salus_common.host_cozumle(hedef)

def banner_yakala(ip, port):
    """Açık porta bağlanıp servis versiyonunu / banner bilgisini almaya çalışır."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1.2)
    banner = ""
    try:
        s.connect((ip, port))
        if port in [80, 8080]:
            s.send(b"HEAD / HTTP/1.0\r\n\r\n")
        elif port == 443:
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with ctx.wrap_socket(s, server_hostname=ip) as ss:
                ss.send(b"HEAD / HTTP/1.0\r\n\r\n")
                banner = ss.recv(256).decode('utf-8', errors='ignore')
                for line in banner.splitlines():
                    if line.lower().startswith("server:"):
                        return line.split(":", 1)[1].strip()
                return ""
        
        banner = s.recv(256).decode('utf-8', errors='ignore').strip()
        if "HTTP/" in banner:
            for line in banner.splitlines():
                if line.lower().startswith("server:"):
                    return line.split(":", 1)[1].strip()
        
        banner = "".join(ch for ch in banner if ch.isprintable())
        if len(banner) > 60:
            banner = banner[:57] + "..."
    except Exception:
        pass
    finally:
        s.close()
    return banner

def portlari_tara_paralel(ip, portlar=None):
    """ThreadPoolExecutor kullanarak belirtilen IP adresindeki portları hızlıca tarar."""
    if portlar is None:
        portlar = [21, 22, 23, 25, 53, 80, 110, 139, 143, 443, 445, 1433, 3306, 3389, 5432, 6379, 8080, 9200]
        
    acik_portlar = []
    
    def port_kontrol(port):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.8)
        try:
            sonuc = s.connect_ex((ip, port))
            if sonuc == 0:
                try:
                    servis = socket.getservbyport(port)
                except Exception:
                    servisler = {
                        21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 53: "dns",
                        80: "http", 110: "pop3", 139: "netbios", 143: "imap",
                        443: "https", 445: "microsoft-ds", 1433: "mssql",
                        3306: "mysql", 3389: "ms-wbt-server", 5432: "postgresql",
                        6379: "redis", 8080: "http-proxy", 9200: "elasticsearch"
                    }
                    servis = servisler.get(port, "bilinmiyor")
                
                # sürüm/banner tespiti (canlı tarama)
                banner = banner_yakala(ip, port)
                if banner:
                    servis = f"{servis} ({banner})"
                
                if port in [23, 445, 3389, 6379, 9200]:
                    risk = "kritik"
                elif port in [21, 1433, 1521, 3306, 5432, 27017]:
                    risk = "yüksek"
                elif port in [22, 25, 110, 139, 143, 8080]:
                    risk = "orta"
                else:
                    risk = "düşük"
                    
                return {"port": port, "servis": servis, "risk": risk}
        except Exception:
            pass
        finally:
            s.close()
        return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(portlar), 40)) as executor:
        results = executor.map(port_kontrol, portlar)
        for r in results:
            if r:
                acik_portlar.append(r)
                
    return sorted(acik_portlar, key=lambda x: x["port"])

def web_baslik_analizi(domain):
    """Hedef web sitesinin HTTP başlıklarını ve SSL/TLS durumunu sorgular."""
    url = f"https://{domain}" if not domain.startswith(("http://", "https://")) else domain
    start_time = time.time()
    
    analiz = {
        "sslDurumu": "pasif",
        "sunucuTuru": "Bilinmiyor",
        "hsts": False,
        "csp": False,
        "yanitSuresi": "Bilinmiyor"
    }
    
    headers = None
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SalusScanner/1.0'}
        )
        # ssl doğrulamasını atlayarak güvenli olmayan sertifikalarda da başlıkları alabilmek
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        with urllib.request.urlopen(req, timeout=3.0, context=ctx) as response:
            analiz["yanitSuresi"] = f"{int((time.time() - start_time) * 1000)}ms"
            if response.url.startswith("https://"):
                analiz["sslDurumu"] = "aktif"
            headers = {k.lower(): v for k, v in response.info().items()}
    except Exception:
        # http fallback denemesi
        try:
            http_url = url.replace("https://", "http://") if url.startswith("https://") else f"http://{domain}"
            req = urllib.request.Request(
                http_url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SalusScanner/1.0'}
            )
            start_time = time.time()
            with urllib.request.urlopen(req, timeout=3.0) as response:
                analiz["yanitSuresi"] = f"{int((time.time() - start_time) * 1000)}ms"
                headers = {k.lower(): v for k, v in response.info().items()}
        except Exception:
            pass
            
    if headers:
        analiz["sunucuTuru"] = headers.get("server", "Bilinmiyor")
        if "strict-transport-security" in headers:
            analiz["hsts"] = True
        if "content-security-policy" in headers:
            analiz["csp"] = True
            
    return analiz

def tarama_yap(hedef):
    """Alan adı çözümlemesi, port tarama ve web başlık analizi adımlarını birleştirerek gerçek tarama gerçekleştirir."""
    domain, ip = host_cozumle(hedef)
    
    if not ip:
        return {
            "basarili": False,
            "hata": f"Hedef '{hedef}' çözümlenemedi. Lütfen geçerli bir domain veya IP adresi girin."
        }
        
    # eş zamanlı port tarama
    acik_portlar = portlari_tara_paralel(ip)
    
    # web başlık ve ssl analizi (ıp adresi ise atla, domain ise çalıştır)
    try:
        socket.inet_aton(domain)
        # hedef ıp olduğu için web analizi standart bir biçimde mock/atlama yapılır
        web_analizi = {
            "sslDurumu": "Bilinmiyor (IP Hedefi)",
            "sunucuTuru": "Bilinmiyor",
            "hsts": False,
            "csp": False,
            "yanitSuresi": "0ms"
        }
    except socket.error:
        web_analizi = web_baslik_analizi(domain)
        
    # açık portları formatlama ("80/tcp open" formatı)
    tespit_edilen = []
    for p in acik_portlar:
        tespit_edilen.append(f"{p['port']}/tcp open {p['servis']}")
        
    # risk puanı ve tehdit derecesi hesaplama
    risk_puani = 0
    oneriler = []
    zafiyetler = []
    
    for p in acik_portlar:
        if p["risk"] == "kritik":
            risk_puani += 30
            oneriler.append(f"Kritik {p['port']} ({p['servis']}) portunu internete kapatın.")
            zafiyetler.append({
                "zafiyet_adi": f"Açık Kritik Port: {p['port']}",
                "seviye": "kritik",
                "aciklama": f"{p['servis'].upper()} servisi dışarı açık. Olası zafiyet ve kaba kuvvet riski."
            })
        elif p["risk"] == "yüksek":
            risk_puani += 20
            oneriler.append(f"Yüksek riskli {p['port']} ({p['servis']}) portunu sınırlandırın.")
            zafiyetler.append({
                "zafiyet_adi": f"Açık Yüksek Riskli Port: {p['port']}",
                "seviye": "yüksek",
                "aciklama": f"Yetkilendirme veya veri tabanı portu ({p['port']}) dış dünyaya açık."
            })
        elif p["risk"] == "orta":
            risk_puani += 10
            oneriler.append(f"{p['port']} portundaki servis sürümlerini güncel tutun.")
        else:
            risk_puani += 2
            
    if web_analizi["sslDurumu"] == "pasif":
        risk_puani += 15
        oneriler.append("Web trafiğini şifrelemek için SSL/TLS (HTTPS) kullanın.")
        zafiyetler.append({
            "zafiyet_adi": "Eksik SSL Sertifikası",
            "seviye": "orta",
            "aciklama": "Veriler şifresiz iletiliyor, Ortadaki Adam (MITM) saldırı riski."
        })
        
    if not web_analizi["hsts"] and web_analizi["sslDurumu"] == "aktif":
        risk_puani += 5
        oneriler.append("Strict-Transport-Security (HSTS) başlığını ekleyin.")
        
    if not web_analizi["csp"]:
        risk_puani += 5
        oneriler.append("Cross-Site Scripting (XSS) saldırılarını engellemek için CSP başlığı kullanın.")
        
    risk_puani = min(100, max(5, risk_puani))
    
    if risk_puani >= 75:
        tehdit_seviyesi = "Kritik"
        tehdit_tipi = "Çoklu Açık Port & Zayıf Yapılandırma"
    elif risk_puani >= 45:
        tehdit_seviyesi = "Yüksek"
        tehdit_tipi = "Açık Servis Riski"
    elif risk_puani >= 25:
        tehdit_seviyesi = "Orta"
        tehdit_tipi = "Güvenlik Sıkılaştırma İhtiyacı"
    else:
        tehdit_seviyesi = "Düşük"
        tehdit_tipi = "Temel Tarama"
        
    if not acik_portlar:
        tespit_edilen.append("Dışa açık popüler port bulunamadı.")
        oneriler.append("Güvenlik duvarı yapılandırmanızı koruyun.")
        
    return {
        "basarili": True,
        "hedef": hedef,
        "gercek_ip": ip,
        "riskPuani": risk_puani,
        "tehditSeviyesi": tehdit_seviyesi,
        "tehditTipi": tehdit_tipi,
        "tespitEdilen": tespit_edilen,
        "oneriler": list(set(oneriler)),
        "acikPortlar": acik_portlar,
        "tesbitEdilenZafiyetler": zafiyetler,
        "sslDurumu": "aktif" if web_analizi["sslDurumu"] == "aktif" else "pasif",
        "sunucuBilgisi": {
            "os": "Linux/Unix" if "nginx" in web_analizi["sunucuTuru"].lower() or "apache" in web_analizi["sunucuTuru"].lower() else "Windows/IIS" if "iis" in web_analizi["sunucuTuru"].lower() else "Bilinmiyor",
            "server": web_analizi["sunucuTuru"]
        }
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        hedef = sys.argv[1]
        try:
            sonuc = tarama_yap(hedef)
            print(json.dumps(sonuc))
        except Exception as e:
            print(json.dumps({"basarili": False, "hata": str(e)}))
    else:
        print(json.dumps({"basarili": False, "hata": "Hedef belirtilmedi."}))