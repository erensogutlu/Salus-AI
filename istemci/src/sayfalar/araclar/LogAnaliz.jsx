import { useState } from 'react';
import { logAnaliziYap } from '../../servisler/apiServisi';
import { Shield, FileSearch, Terminal, AlertTriangle, CheckCircle, Activity, Globe } from 'lucide-react';
import YuklemeSpinner from '../../bilesenler/YuklemeSpinner';
import './LogAnaliz.css';

const ornekNmap = `Starting Nmap 7.93 ( https://nmap.org ) at 2024-03-15 10:00
Nmap scan report for target.example.com (192.168.1.100)
Host is up (0.0020s latency).
Not shown: 994 closed tcp ports (reset)
PORT     STATE SERVICE
21/tcp   open  ftp
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
3306/tcp open  mysql
3389/tcp open  ms-wbt-server
OS details: Linux 4.15 - 5.6
Network Distance: 2 hops

Nmap done: 1 IP address (1 host up) scanned in 12.34 seconds`;

const LogAnaliz = () => {
  const [logMetni, setLogMetni] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [hata, setHata] = useState('');

  const ornekDoldur = () => {
    setLogMetni(ornekNmap);
  };

  const analizEt = async () => {
    if (!logMetni.trim()) {
      setHata('Lütfen analiz edilecek log metnini girin.');
      return;
    }

    try {
      setYukleniyor(true);
      setHata('');
      setSonuc(null);

      const yanit = await logAnaliziYap(logMetni);

      if (yanit.basarili) {
        setSonuc(yanit.veri);
      } else {
        setHata(yanit.mesaj || 'Analiz sırasında bir hata oluştu.');
      }
    } catch (err) {
      setHata(err.message || 'Sunucu ile iletişim kurulamadı.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="log-analiz-sayfa">
      <div className="log-analiz-baslik">
        <h1>
          <span className="gradyan-metin">Gelişmiş</span> Log Analizi
        </h1>
        <p>Nmap veya diğer port tarama araçlarının çıktılarını profesyonelce analiz edin.</p>
      </div>

      <div className="log-giris-alani">
        <label htmlFor="logInput">
          <Terminal size={18} /> Terminal Çıktısı
        </label>
        <textarea
          id="logInput"
          className="log-textarea"
          placeholder="Nmap tarama sonucunu buraya yapıştırın (örn: nmap -sV hedef.com)..."
          value={logMetni}
          onChange={(e) => setLogMetni(e.target.value)}
        />
        
        {hata && (
          <div className="form-hata" style={{ marginBottom: '16px' }}>
            {hata}
          </div>
        )}

        <div className="log-buton-grup">
          <button className="log-ornek-buton" onClick={ornekDoldur} disabled={yukleniyor}>
            Örnek Çıktı Ekle
          </button>
          <button 
            className="buton buton-birincil" 
            onClick={analizEt}
            disabled={yukleniyor}
          >
            {yukleniyor ? 'Analiz Ediliyor...' : 'Analiz Et'} <FileSearch size={18} />
          </button>
        </div>
      </div>

      {yukleniyor && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
          <YuklemeSpinner />
          <p style={{ marginTop: '16px', color: 'var(--metin-soluk)' }}>Yapay zeka logları yorumluyor...</p>
        </div>
      )}

      {sonuc && (
        <div className="analiz-sonuc-kart">
          <div className="sonuc-ozet-baslik">
            <div className="sonuc-ozet-sol">
              <h2><Globe size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> {sonuc.hedef}</h2>
              <p>Gerçek IP: {sonuc.gercek_ip} | Risk Puanı: {sonuc.riskPuani}/100</p>
            </div>
            <div className={`risk-rozet ${sonuc.tehditSeviyesi}`}>
              {sonuc.tehditSeviyesi} Risk
            </div>
          </div>

          <div className="sonuc-icerik">
            <div className="sonuc-bolum">
              <h3><Shield size={18} /> Açık Portlar</h3>
              {sonuc.acikPortlar && sonuc.acikPortlar.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="port-tablosu">
                    <thead>
                      <tr>
                        <th>Port/Proto</th>
                        <th>Servis</th>
                        <th>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sonuc.acikPortlar.map((p, i) => (
                        <tr key={i}>
                          <td>
                            <span className="port-num">{p.port}</span>
                            <span className="port-proto">/{p.protokol}</span>
                          </td>
                          <td>{p.servis}</td>
                          <td>
                            <span style={{ 
                              color: p.risk === 'kritik' ? 'var(--tehlike)' : 
                                     p.risk === 'yüksek' ? 'var(--uyari)' : 
                                     p.risk === 'orta' ? '#60a5fa' : 'var(--basari)',
                              textTransform: 'capitalize',
                              fontWeight: '600'
                            }}>
                              {p.risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--metin-soluk)' }}>Açık port tespit edilemedi.</p>
              )}
            </div>

            <div className="sonuc-bolum">
              <h3><Activity size={18} /> Önemli Tespitler</h3>
              <ul className="sonuc-liste">
                {sonuc.tespitEdilen.map((tespit, i) => (
                  <li key={i} className="sonuc-liste-oge">
                    {tespit}
                  </li>
                ))}
              </ul>
            </div>

            {sonuc.tesbitEdilenZafiyetler && sonuc.tesbitEdilenZafiyetler.length > 0 && (
              <div className="sonuc-bolum bolum-tam-genislik">
                <h3 style={{ color: 'var(--tehlike)' }}><AlertTriangle size={18} /> Olası Zafiyetler ve CVE'ler</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {sonuc.tesbitEdilenZafiyetler.map((z, i) => (
                    <div key={i} className="zafiyet-kart">
                      <div className="zafiyet-baslik">
                        <span>{z.aciklama}</span>
                        <span className="zafiyet-cve">{z.cve}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--metin-soluk)' }}>
                        Seviye: <strong style={{ textTransform: 'capitalize' }}>{z.seviye}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="sonuc-bolum bolum-tam-genislik">
              <h3 style={{ color: 'var(--basari)' }}><CheckCircle size={18} /> Çözüm Önerileri</h3>
              <ul className="sonuc-liste" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {sonuc.oneriler.map((oneri, i) => (
                  <li key={i} className="sonuc-liste-oge" style={{ borderLeftColor: 'var(--basari)' }}>
                    {oneri}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default LogAnaliz;
