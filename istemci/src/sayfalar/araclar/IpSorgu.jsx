import { useState } from 'react';
import { Search, MapPin, ShieldAlert, Wifi, Globe, Copy, Check, Compass, Radio } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aracCagir } from '../../servisler/apiServisi';

const IpSorgu = () => {
  const [girdi, setGirdi] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState('');
  const [hata, setHata] = useState('');
  const [kopyalandi, setKopyalandi] = useState(false);

  const islemYap = async (hedefMetin = girdi) => {
    const sorgulanacak = hedefMetin.trim() || 'kendi';
    setYukleniyor(true);
    setHata('');
    setSonuc('');
    
    try {
      const yanit = await aracCagir('ipSorgu', sorgulanacak);
      
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

  const panoyaKopyala = () => {
    if (!sonuc) return;
    navigator.clipboard.writeText(sonuc);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  };

  // koordinatları ayıkla
  const koordinatMatch = sonuc.match(/Koordinatlar.*?`([-\d.]+),\s*([-\d.]+)`/);
  const enlem = koordinatMatch ? parseFloat(koordinatMatch[1]) : null;
  const boylam = koordinatMatch ? parseFloat(koordinatMatch[2]) : null;

  return (
    <div className="tehdit-sayfa">
      <div className="tehdit-sayfa-baslik">
        <h1>
          <span className="gradyan-metin">IP Coğrafi Konum</span> & İstihbarat
        </h1>
        <p>IP adresleri ve alan adlarının dünya üzerindeki fiziksel konumunu, servis sağlayıcısını (ISP), otonom sistem numarasını (ASN) ve VPN/Tor gizlilik durumunu tespit edin.</p>
      </div>

      <div className="analiz-form-kart">
        <form className="analiz-form" onSubmit={(e) => { e.preventDefault(); islemYap(); }}>
          <div className="form-grubu">
            <label className="form-etiketi">Sorgulanacak IP Adresi veya Domain</label>
            <div className="form-girisi-ikon">
              <MapPin size={18} className="ikon" />
              <input
                type="text"
                className="form-girisi"
                placeholder="Örn: 8.8.8.8, 1.1.1.1 veya alanadi.com (Boş bırakırsanız kendi IP'niz sorgulanır)"
                value={girdi}
                onChange={(e) => setGirdi(e.target.value)}
                disabled={yukleniyor}
              />
            </div>
          </div>
          <button
            type="submit"
            className="buton buton-birincil"
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <><span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} /> Aranıyor...</>
            ) : (
              <><Search size={18} /> Konumu Tespit Et</>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px', alignItems: 'center' }}>
          <button
            type="button"
            className="buton buton-hayalet buton-kucuk"
            onClick={() => { setGirdi(''); islemYap(''); }}
            disabled={yukleniyor}
            style={{ fontSize: '0.8rem', padding: '5px 12px' }}
          >
            <Radio size={14} style={{ color: 'var(--birincil)' }} /> Kendi IP'mi Sorgula
          </button>
          
          <span style={{ fontSize: '0.78rem', color: 'var(--metin-cok-soluk)', margin: '0 4px' }}>|</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--metin-soluk)' }}>Hızlı Örnekler:</span>
          {['8.8.8.8', '1.1.1.1', '9.9.9.9', 'github.com'].map((ornek) => (
            <button
              key={ornek}
              type="button"
              className="buton buton-hayalet buton-kucuk"
              onClick={() => { setGirdi(ornek); islemYap(ornek); }}
              style={{ fontSize: '0.78rem', padding: '3px 8px' }}
            >
              {ornek}
            </button>
          ))}
        </div>
      </div>

      {hata && (
        <div className="bildirim bildirim-hata" style={{ position: 'relative', top: 0, right: 0, marginBottom: '20px', maxWidth: '100%' }}>
          {hata}
        </div>
      )}

      {yukleniyor && (
        <div className="analiz-sonuc">
          <div className="tarama-animasyon">
            <div className="tarama-ilerleme-bar">
              <div className="tarama-ilerleme-cizgi" style={{ width: '75%', animation: 'nabiz 1.5s infinite' }} />
            </div>
            <div className="tarama-mesaj">
              <strong>Global coğrafi istihbarat</strong> sorgulanıyor...
            </div>
          </div>
        </div>
      )}

      {sonuc && !yukleniyor && (
        <div className="analiz-sonuc" style={{ padding: '20px' }}>
          <div className="analiz-sonuc-baslik" style={{ margin: '-20px -20px 20px -20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} style={{ color: 'var(--birincil)' }} />
              <h3>Coğrafi İstihbarat Raporu</h3>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="buton buton-hayalet buton-kucuk"
                onClick={panoyaKopyala}
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              >
                {kopyalandi ? <><Check size={14} style={{ color: 'var(--basari)' }} /> Kopyalandı</> : <><Copy size={14} /> Raporu Kopyala</>}
              </button>
              <span className="rozet rozet-basari">Tamamlandı</span>
            </div>
          </div>

          {/* harita önizlemesi */}
          {enlem && boylam && (
            <div style={{
              marginBottom: '20px',
              borderRadius: 'var(--yuvarlatma)',
              overflow: 'hidden',
              border: '1px solid var(--sinir)',
              background: 'var(--yuzey-acik)'
            }}>
              <iframe
                title="IP Konum Haritası"
                width="100%"
                height="220"
                style={{ border: 0, display: 'block', filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${boylam - 0.05}%2C${enlem - 0.05}%2C${boylam + 0.05}%2C${enlem + 0.05}&layer=mapnik&marker=${enlem}%2C${boylam}`}
              />
              <div style={{ padding: '8px 14px', fontSize: '0.78rem', color: 'var(--metin-soluk)', display: 'flex', justifyContent: 'space-between', background: 'var(--yuzey)' }}>
                <span>📍 Enlem: <strong>{enlem}</strong> | Boylam: <strong>{boylam}</strong></span>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${enlem}&mlon=${boylam}#map=12/${enlem}/${boylam}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--birincil)', textDecoration: 'none' }}
                >
                  Haritayı Büyüt ↗
                </a>
              </div>
            </div>
          )}

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

export default IpSorgu;
