import { useState } from 'react';
import { Globe, Server, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aracCagir } from '../../servisler/apiServisi';

const SubdomainBulucu = () => {
  const [girdi, setGirdi] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState('');
  const [hata, setHata] = useState('');

  const islemYap = async () => {
    if (!girdi) return;
    setYukleniyor(true);
    setHata('');
    setSonuc('');
    
    try {
      const yanit = await aracCagir('subdomainBulucu', girdi);
      
      if (yanit.basarili) {
        setSonuc(yanit.sonuc);
      } else {
        setHata(yanit.mesaj || 'İşlem sırasında bir hata oluştu.');
      }
    } catch (err) {
      setHata(err.message || 'Sunucu ile bağlantı kurulamadı.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="tehdit-sayfa">
      <div className="tehdit-sayfa-baslik">
        <h1>
          <span className="gradyan-metin">Subdomain</span> Keşfi
        </h1>
        <p>Hedef alan adının alt alan adlarını bulun, DNS kayıtlarını çözümleyin ve olası "Subdomain Takeover" risklerini tespit edin.</p>
      </div>

      <div className="analiz-form-kart cam-kart">
        <form className="analiz-form" onSubmit={(e) => { e.preventDefault(); islemYap(); }}>
          <div className="form-grubu">
            <label className="form-etiketi">Hedef Alan Adı</label>
            <div className="form-girisi-ikon">
              <Globe size={18} className="ikon" />
              <input
                type="text"
                className="form-girisi"
                placeholder="örn: example.com"
                value={girdi}
                onChange={(e) => setGirdi(e.target.value)}
                disabled={yukleniyor}
              />
            </div>
          </div>
          <button
            type="submit"
            className="buton buton-birincil"
            disabled={yukleniyor || !girdi.trim()}
          >
            {yukleniyor ? (
              <><span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} /> Taranıyor...</>
            ) : (
              <><Server size={18} /> Taramayı Başlat</>
            )}
          </button>
        </form>
      </div>

      {hata && (
        <div className="bildirim bildirim-hata" style={{ position: 'relative', top: 0, right: 0, marginBottom: '20px', maxWidth: '100%' }}>
          {hata}
        </div>
      )}

      {yukleniyor && (
        <div className="analiz-sonuc cam-kart" style={{ padding: 0 }}>
          <div className="tarama-animasyon">
            <div className="tarama-durum-rozet">
              <span className="tarama-durum-nokta" />
              CANLI İSTİHBARAT TARAMASI
            </div>

            <div className="tarama-radar-kapsayici">
              <div className="tarama-radar-halka" />
              <div className="tarama-radar-halka-2" />
              <div className="tarama-radar-merkez">
                <Globe size={22} />
              </div>
            </div>

            <div className="tarama-mesaj-kapsayici">
              <div className="tarama-mesaj">
                Sertifika günlükleri (CT) ve <strong>DNS kayıtları</strong> taranıyor...
              </div>
              <div className="tarama-alt-mesaj">
                Hedef: {girdi} • Protokol: TLS / DNS / HTTP • Kaynak: crt.sh & Yerel DNS
              </div>
            </div>

            <div className="tarama-ilerleme-kapsayici">
              <div className="tarama-ilerleme-bar">
                <div className="tarama-ilerleme-cizgi" style={{ width: '80%' }} />
              </div>
            </div>

            <div className="tarama-adimlar">
              <span className="tarama-adim tamamlandi">
                <Activity size={14} /> Sertifika Logları (CT)
              </span>
              <span className="tarama-adim aktif">
                <Server size={14} /> DNS & CNAME Çözümleme
              </span>
              <span className="tarama-adim">
                <Globe size={14} /> Takeover & Durum Tespiti
              </span>
            </div>
          </div>
        </div>
      )}

      {sonuc && !yukleniyor && (
        <div className="analiz-sonuc cam-kart" style={{ padding: '24px' }}>
          <div className="analiz-sonuc-baslik" style={{ margin: '-24px -24px 24px -24px' }}>
            <h3>Tarama Raporu</h3>
            <span className="rozet rozet-bilgi">Tamamlandı</span>
          </div>
          <div className="analiz-sonuc-govde markdown-icerik" style={{ padding: 0, minHeight: 'auto' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {sonuc}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubdomainBulucu;
