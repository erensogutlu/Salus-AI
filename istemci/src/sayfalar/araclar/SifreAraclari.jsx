import { useState } from 'react';
import { Lock, Shield, ShieldAlert, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aracCagir } from '../../servisler/apiServisi';

const SifreAraclari = () => {
  const [aktifSekme, setAktifSekme] = useState('analiz');
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
      const aracTipi = aktifSekme === 'analiz' ? 'sifreAnaliz' : 'sifreUretici';
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
          <span className="gradyan-metin">Şifre</span> Araçları
        </h1>
        <p>Gelişmiş entropi analizi ve kriptografik rastgele şifre üretimi</p>
      </div>

      <div className="sonuc-sekmeler" style={{ marginBottom: '20px', background: 'transparent', padding: 0 }}>
        <button 
          className={`sekme-buton ${aktifSekme === 'analiz' ? 'aktif' : ''}`} 
          onClick={() => {setAktifSekme('analiz'); setSonuc(''); setHata(''); setGirdi('');}}
        >
          <ShieldAlert size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
          Şifre Gücü Analizi
        </button>
        <button 
          className={`sekme-buton ${aktifSekme === 'uretici' ? 'aktif' : ''}`} 
          onClick={() => {setAktifSekme('uretici'); setSonuc(''); setHata(''); setGirdi('16');}}
        >
          <Shield size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> 
          Güvenli Şifre Üret
        </button>
      </div>

      <div className="analiz-form-kart cam-kart">
        <form className="analiz-form" onSubmit={(e) => { e.preventDefault(); islemYap(); }}>
          <div className="form-grubu">
            <label className="form-etiketi">
              {aktifSekme === 'analiz' ? 'Analiz Edilecek Şifre' : 'Özellikler (Karakter sayısı veya Passphrase formatı)'}
            </label>
            <div className="form-girisi-ikon">
              <Lock size={18} className="ikon" />
              <input
                type="text"
                className="form-girisi"
                placeholder={aktifSekme === 'analiz' ? 'Örn: P@ssw0rd123 veya kedi-masa-deniz' : 'Örn: 16 veya passphrase'}
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
              <><span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} /> İşleniyor...</>
            ) : (
              <><Cpu size={18} /> {aktifSekme === 'analiz' ? 'Analizi Başlat' : 'Şifreleri Üret'}</>
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
              <Lock size={28} style={{ color: 'var(--birincil)', zIndex: 3 }} />
              <div className="radar-hedef"></div>
            </div>
            <div className="tarama-mesaj">
              <strong>Yapay Zeka Modülü</strong> çalışıyor...
            </div>
          </div>
        </div>
      )}

      {sonuc && !yukleniyor && (
        <div className="analiz-sonuc cam-kart" style={{ padding: '24px' }}>
          <div className="analiz-sonuc-baslik" style={{ margin: '-24px -24px 24px -24px' }}>
            <h3>Yapay Zeka Raporu</h3>
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

export default SifreAraclari;
