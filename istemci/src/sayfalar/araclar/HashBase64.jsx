import { useState } from 'react';
import { Hash, Code, Fingerprint, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aracCagir } from '../../servisler/apiServisi';

const HashBase64 = () => {
  const [aktifSekme, setAktifSekme] = useState('hash');
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
      const aracTipi = aktifSekme === 'hash' ? 'hashTanimlayici' : 'base64Araci';
      // base64 aracı için girdi "base64 çöz <veri>" formatında gelmeli.
      // sadece veri gelirse başına "base64 çöz" ekleyebiliriz veya kullanıcıya "base64 şifrele merhaba" yazmasını söyleyebiliriz.
      // kullanıcı deneyimini artırmak için dropdown ekliyorum. ama state kullanmadığım için placeholder'da tarif edeyim.
      const yanit = await aracCagir(aracTipi, girdi);
      
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
          <span className="gradyan-metin">Kriptografi</span> ve Kodlama
        </h1>
        <p>Gelişmiş Hash Tipi Tanımlama ve Çok Katmanlı Base64/Hex/URL Kodlama Aracı.</p>
      </div>

      <div className="sonuc-sekmeler" style={{ marginBottom: '20px', background: 'transparent', padding: 0 }}>
        <button 
          className={`sekme-buton ${aktifSekme === 'hash' ? 'aktif' : ''}`} 
          onClick={() => {setAktifSekme('hash'); setSonuc(''); setHata(''); setGirdi('');}}
        >
          <Fingerprint size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
          Hash Tanımlayıcı
        </button>
        <button 
          className={`sekme-buton ${aktifSekme === 'base64' ? 'aktif' : ''}`} 
          onClick={() => {setAktifSekme('base64'); setSonuc(''); setHata(''); setGirdi('');}}
        >
          <Code size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
          Base64 / Hex Çözücü
        </button>
      </div>

      <div className="analiz-form-kart cam-kart">
        <form className="analiz-form" onSubmit={(e) => { e.preventDefault(); islemYap(); }} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="form-grubu">
            <label className="form-etiketi">
              {aktifSekme === 'hash' ? 'Bilinmeyen Hash Değeri' : 'İşlem ve Veri (Örn: base64 çöz aGVs... , hex şifrele siber)'}
            </label>
            <div className="form-girisi-ikon">
              <Hash size={18} className="ikon" style={{ top: '24px' }}/>
              <textarea
                className="form-girisi"
                rows={4}
                placeholder={aktifSekme === 'hash' ? 'Örn: 098f6bcd4621d373cade4e832627b4f6' : 'Komutunuzu yazın (base64 çöz, base64 şifrele, hex çöz, url çöz...)'}
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
            style={{ alignSelf: 'flex-start', marginTop: '12px' }}
          >
            {yukleniyor ? (
              <><span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} /> İşleniyor...</>
            ) : (
              <><Cpu size={18} /> {aktifSekme === 'hash' ? 'Algoritmayı Bul' : 'İşlemi Başlat'}</>
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
        <div className="analiz-sonuc cam-kart">
          <div className="tarama-animasyon">
            <div className="tarama-radar">
              <Hash size={28} style={{ color: 'var(--birincil)', zIndex: 3 }} />
              <div className="radar-hedef"></div>
            </div>
            <div className="tarama-mesaj">
              <strong>Şifreleme Yapısı</strong> analiz ediliyor...
            </div>
          </div>
        </div>
      )}

      {sonuc && !yukleniyor && (
        <div className="analiz-sonuc cam-kart" style={{ padding: '24px' }}>
          <div className="analiz-sonuc-baslik" style={{ margin: '-24px -24px 24px -24px' }}>
            <h3>Analiz Raporu</h3>
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

export default HashBase64;
