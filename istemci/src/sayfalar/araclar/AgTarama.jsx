import { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  Shield,
  AlertTriangle,
  CheckCircle,
  AlertOctagon,
  Info,
  Server,
  RefreshCw,
  Clock,
  Globe,
} from 'lucide-react';
import { agTaramaBaslat, taramaSonuclari } from '../../servisler/apiServisi';
import './AgTarama.css';

const AgTarama = () => {
  const [hedef, setHedef] = useState('');
  const [taramaAktif, setTaramaAktif] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);
  const [loglar, setLoglar] = useState([]);
  const [portlar, setPortlar] = useState([]);
  const [zafiyetler, setZafiyetler] = useState([]);
  const [oneriler, setOneriler] = useState([]);
  const [gecmis, setGecmis] = useState([]);
  const terminalSonuRef = useRef(null);

  // terminali otomatik aşağı kaydırma iptal edildi (kullanıcı isteği üzerine)
  // useeffect(() => {
  // if (terminalsonuref.current) {
  // terminalsonuref.current.scrollıntoview({ behavior: 'smooth' });
  // }
  // }, [loglar]);

  // tarama geçmişini veritabanından yükle
  const gecmisYukle = async () => {
    try {
      const yanit = await taramaSonuclari();
      if (yanit.basarili && yanit.veri) {
        setGecmis(yanit.veri);
      }
    } catch (hata) {
      console.error('Tarama gecmisi yuklenirken hata:', hata);
    }
  };

  useEffect(() => {
    gecmisYukle();
  }, []);

  // tarama logları ekleme fonksiyonu
  const logEkle = (metin, tip = 'bilgi') => {
    setLoglar((onceki) => [...onceki, { metin, tip, id: Math.random() }]);
  };

  // simülasyonu başlatma
  const taramayiBaslat = async (e) => {
    e.preventDefault();
    if (!hedef.trim()) return;

    setTaramaAktif(true);
    setTamamlandi(false);
    setLoglar([]);
    setPortlar([]);
    setZafiyetler([]);
    setOneriler([]);

    const beklet = (ms) => new Promise((coz) => setTimeout(coz, ms));

    // simülasyon adımları ve log yazdırma işlemleri
    logEkle(`[+] Tarama başlatılıyor: ${hedef}`, 'komut');
    await beklet(600);
    logEkle(`[*] DNS çözümleniyor: ${hedef}...`, 'bilgi');
    await beklet(800);
    
    const rastgeleIp = `192.168.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
    logEkle(`[+] IP Adresi tespit edildi: ${rastgeleIp}`, 'basari');
    await beklet(600);
    
    logEkle(`[*] Ping testi yapılıyor (ICMP Echo Request)...`, 'bilgi');
    await beklet(700);
    logEkle(`[+] Sunucu aktif (RTT: ${Math.floor(Math.random() * 45) + 5}ms)`, 'basari');
    await beklet(500);

    logEkle(`[*] Port taraması başlatılıyor (En popüler 1000 TCP portu)...`, 'komut');
    await beklet(900);

    try {
      const yanit = await agTaramaBaslat(hedef);
      if (yanit.basarili && yanit.veri) {
        const veri = yanit.veri;
        
        // portları veritabanından gelen veriyle doldur
        const gelenPortlar = (veri.acikPortlar || []).map(p => ({
          port: p.port,
          servis: p.servis,
          durum: 'acik',
          aciklama: `${p.servis} Servisi (${p.risk.toUpperCase()} Risk)`
        }));
        
        // terminale yazdıracak açık portları loglayalım
        for (let i = 0; i < gelenPortlar.length; i++) {
          const p = gelenPortlar[i];
          logEkle(`[!] AÇIK PORT BULUNDU: ${p.port}/${p.servis} (${p.aciklama})`, 'uyari');
          await beklet(400);
        }
        
        // kapalı portlardan birkaç simülasyon ekleyelim ki boş durmasın
        const kapaliPortlar = [
          { port: 21, servis: 'FTP', durum: 'kapali', aciklama: 'Dosya aktarım protokolü' },
          { port: 23, servis: 'Telnet', durum: 'kapali', aciklama: 'Şifrelenmemiş terminal bağlantısı' },
          { port: 25, servis: 'SMTP', durum: 'kapali', aciklama: 'E-posta gönderim servisi' }
        ].filter(kp => !gelenPortlar.some(gp => gp.port === kp.port));
        
        for (let i = 0; i < Math.min(2, kapaliPortlar.length); i++) {
          const p = kapaliPortlar[i];
          logEkle(`[*] Kapalı Port: ${p.port}/${p.servis}`, 'bilgi');
          await beklet(300);
        }

        logEkle(`[*] Zafiyet taraması başlatılıyor...`, 'komut');
        await beklet(800);
        
        // zafiyetleri apı'den alalım
        const gelenZafiyetler = (veri.tesbitEdilenZafiyetler || []).map((z, index) => {
          const seviyeStr = z.seviye === 'kritik' ? 'kritik' : z.seviye === 'yüksek' ? 'yuksek' : z.seviye === 'orta' ? 'orta' : 'dusuk';
          let bazSkor = seviyeStr === 'kritik' ? 90 : seviyeStr === 'yuksek' ? 75 : seviyeStr === 'orta' ? 50 : 25;
          const exploitSkoru = Math.min(100, bazSkor + Math.floor(Math.random() * 10));
          
          return {
            id: index + 1,
            baslik: z.aciklama,
            seviye: seviyeStr,
            aciklama: `${z.aciklama} tespiti yapılmıştır. Güvenlik açığının sömürülmesi durumunda sisteme sızma veya yetki yükseltme gerçekleşebilir.`,
            cve: z.cve,
            exploitSkoru
          };
        });

        gelenZafiyetler.forEach((z) => {
          if (z.seviye === 'kritik') {
            logEkle(`[CRITICAL] KRİTİK ZAFİYET BULUNDU: ${z.baslik} (${z.cve})`, 'hata');
          } else if (z.seviye === 'yuksek') {
            logEkle(`[HIGH] YÜKSEK SEVİYELİ ZAFİYET BULUNDU: ${z.baslik} (${z.cve})`, 'hata');
          } else if (z.seviye === 'orta') {
            logEkle(`[+] Zafiyet tespit edildi: ${z.baslik} - Derece: ORTA (${z.cve})`, 'uyari');
          } else {
            logEkle(`[+] Zafiyet tespit edildi: ${z.baslik} - Derece: DÜŞÜK (${z.cve})`, 'bilgi');
          }
        });
        await beklet(1000);

        logEkle(`[+] Tarama başarıyla tamamlandı. Sonuçlar rapor haline getirildi.`, 'basari');

        // tüm portları birleştirip gösterelim
        const tumPortlar = [
          ...gelenPortlar,
          ...kapaliPortlar
        ].sort((a, b) => a.port - b.port);

        setPortlar(tumPortlar);
        setZafiyetler(gelenZafiyetler);
        
        // önerileri apı'den alalım
        const gelenOneriler = (veri.oneriler || []).map(oneri => ({
          baslik: oneri,
          aciklama: `Bu önlem sisteminizi güvenceye almak için önerilmektedir.`
        }));
        setOneriler(gelenOneriler);
        
        setTaramaAktif(false);
        setTamamlandi(true);

        // geçmişi tekrar yükle
        gecmisYukle();
      } else {
        throw new Error('Analiz basarisiz oldu');
      }
    } catch (hata) {
      console.error('Tarama esnasinda hata:', hata);
      logEkle(`[-] Hata: Tarama gerçekleştirilemedi. Sunucu hatası.`, 'hata');
      setTaramaAktif(false);
    }
  };

  return (
    <div className="ag-tarama-sayfa">
      <div className="ag-tarama-sayfa-baslik">
        <h1>Ağ Güvenliği Taraması</h1>
        <p>Belirttiğiniz IP adresi veya alan adındaki açık portları ve siber güvenlik zafiyetlerini simüle ederek analiz edin.</p>
      </div>

      <div className="cam-kart analiz-form-kart" style={{ padding: '24px', marginBottom: '24px' }}>
        <form onSubmit={taramayiBaslat} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div className="form-grubu">
            <label className="form-etiketi">Hedef IP veya Alan Adı</label>
            <input
              type="text"
              placeholder="Örn: 192.168.1.1 veya salus-ai.com"
              value={hedef}
              onChange={(e) => setHedef(e.target.value)}
              disabled={taramaAktif}
              className="form-girisi"
              required
            />
          </div>
          <button
            type="submit"
            disabled={taramaAktif || !hedef.trim()}
            className="buton buton-birincil"
            style={{ height: '46px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {taramaAktif ? <RefreshCw className="donen-ikon" size={18} /> : <Play size={18} />}
            {taramaAktif ? 'Taranıyor...' : 'Taramayı Başlat'}
          </button>
        </form>
      </div>

      {/* terminal çıktısı */}
      {(taramaAktif || loglar.length > 0) && (
        <div className="terminal-kapsayici">
          <div className="terminal-baslik">
            <span className="terminal-nokta kirmizi"></span>
            <span className="terminal-nokta sari"></span>
            <span className="terminal-nokta yesil"></span>
            <span className="terminal-baslik-metin">salus-network-scanner v1.0.0</span>
          </div>
          <div className="terminal-govde">
            {loglar.map((log) => (
              <span key={log.id} className={`terminal-satir ${log.tip}`}>
                {log.metin}
              </span>
            ))}
            {taramaAktif && <span className="terminal-imlec"></span>}
            <div ref={terminalSonuRef} />
          </div>
        </div>
      )}

      {/* tarama bittikten sonra sonuçlar */}
      {tamamlandi && (
        <div className="tarama-sonuclari" style={{ animation: 'slaytYukari 0.4s ease-out' }}>
          
          {/* port tarama tablosu */}
          <div className="cam-kart port-tablo-kapsayici" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 className="port-tablo-baslik">
              <Server size={20} className="neon-metin" />
              Açık Portlar ve Servis Durumları
            </h3>
            <div className="tablo-kapsayici" style={{ border: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--sinir)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--metin-soluk)', fontSize: '0.85rem' }}>PORT</th>
                    <th style={{ padding: '12px 8px', color: 'var(--metin-soluk)', fontSize: '0.85rem' }}>SERVİS</th>
                    <th style={{ padding: '12px 8px', color: 'var(--metin-soluk)', fontSize: '0.85rem' }}>DURUM</th>
                    <th style={{ padding: '12px 8px', color: 'var(--metin-soluk)', fontSize: '0.85rem' }}>DETAY/VERSİYON</th>
                  </tr>
                </thead>
                <tbody>
                  {portlar.map((p) => (
                    <tr key={p.port} style={{ borderBottom: '1px solid var(--sinir)' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'var(--font-kod)', fontSize: '0.9rem', fontWeight: 600 }}>{p.port}</td>
                      <td style={{ padding: '12px 8px', fontSize: '0.9rem' }}>{p.servis}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`port-durumu ${p.durum}`}>
                          {p.durum === 'acik' && <AlertTriangle size={14} />}
                          {p.durum === 'kapali' && <CheckCircle size={14} />}
                          {p.durum === 'filtreli' && <Info size={14} />}
                          {p.durum.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--metin-soluk)', fontSize: '0.85rem' }}>{p.aciklama}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* zafiyetler gridi */}
          <div className="zafiyetler-bolumu" style={{ marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', fontSize: '1.1rem' }}>
              <AlertOctagon size={20} className="neon-metin" style={{ color: 'var(--tehlike)' }} />
              Tespit Edilen Güvenlik Zafiyetleri
            </h3>
            <div className="zafiyet-grid">
              {zafiyetler.map((z) => {
                let barColor = z.seviye === 'kritik' ? 'var(--tehlike)' : z.seviye === 'yuksek' ? '#f97316' : z.seviye === 'orta' ? 'var(--uyari)' : 'var(--basari)';
                return (
                  <div key={z.id} className={`cam-kart zafiyet-kart ${z.seviye}`}>
                    <div className="zafiyet-kart-baslik">
                      <h4>{z.baslik}</h4>
                      <span className={`rozet rozet-${z.seviye}`} style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        {z.seviye}
                      </span>
                    </div>
                    <p>{z.aciklama}</p>
                    <div className="zafiyet-cid">{z.cve}</div>
                    
                    {/* sömürülebilirlik barı */}
                    <div className="exploit-bar-kapsayici" title="Exploitability Score">
                      <div className="exploit-bar" style={{ width: `${z.exploitSkoru}%`, background: barColor }}></div>
                    </div>
                    <div className="exploit-etiket">
                      <span>Sömürülebilirlik</span>
                      <span>{z.exploitSkoru}/100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* siber güvenlik önerileri */}
          <div className="cam-kart ag-oneriler" style={{ padding: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} style={{ color: 'var(--basari)' }} />
              Salus AI Güvenlik Önerileri
            </h3>
            <div style={{ marginTop: '16px' }}>
              {oneriler.map((o, index) => (
                <div key={index} className="ag-oneri-kart cam-kart" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div className="ag-oneri-numara">{index + 1}</div>
                  <div className="ag-oneri-icerik">
                    <h4>{o.baslik}</h4>
                    <p>{o.aciklama}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* tarama geçmişi */}
      <div className="ag-tarama-gecmis" style={{ marginTop: '30px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', fontSize: '1.1rem' }}>
          <Clock size={20} className="neon-metin" />
          Ağ Taraması Geçmişi
        </h3>
        <div className="tablo-kapsayici cam-kart">
          <table className="tablo">
            <thead>
              <tr>
                <th>Hedef</th>
                <th>Açık Portlar</th>
                <th>Tespit Edilen Zafiyetler</th>
                <th>Tarama Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {gecmis && gecmis.length > 0 ? (
                gecmis.map((kayit) => {
                  const portlarDizi = typeof kayit.acik_portlar === 'string' ? JSON.parse(kayit.acik_portlar) : kayit.acik_portlar || [];
                  const zafiyetlerDizi = typeof kayit.zafiyetler === 'string' ? JSON.parse(kayit.zafiyetler) : kayit.zafiyetler || [];
                  
                  return (
                    <tr key={kayit.id}>
                      <td style={{ fontFamily: 'var(--font-kod)', fontSize: '0.85rem', color: 'var(--birincil)' }}>
                        {kayit.hedef_ip}
                      </td>
                      <td style={{ fontWeight: 600 }}>{portlarDizi.length} Port Açık</td>
                      <td>
                        <span className={`rozet ${zafiyetlerDizi.length > 0 ? 'rozet-tehlike' : 'rozet-basari'}`}>
                          {zafiyetlerDizi.length} Zafiyet
                        </span>
                      </td>
                      <td style={{ color: 'var(--metin-soluk)', fontSize: '0.85rem' }}>
                        {new Date(kayit.tarama_tarihi).toISOString().split('T')[0]}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--metin-soluk)', padding: '20px' }}>
                    Henüz ağ taraması yapılmamış.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AgTarama;
