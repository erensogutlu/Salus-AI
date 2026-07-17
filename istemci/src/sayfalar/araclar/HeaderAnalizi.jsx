import { useState } from 'react';
import { FileCode, GlobeLock, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aracCagir } from '../../servisler/apiServisi';

const HeaderAnalizi = () => {
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
      const yanit = await aracCagir('headerAnalizi', girdi);
      
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
          <span className="gradyan-metin">Güvenlik Başlıkları</span> Analizi
        </h1>
        <p>Web sitelerinin HTTP Response Security Header (Güvenlik Başlıkları) yapılandırmalarını tarayın ve A-F notuyla güvenlik skorunu görün.</p>
      </div>

      <div className="analiz-form-kart cam-kart">
        <form className="analiz-form" onSubmit={(e) => { e.preventDefault(); islemYap(); }}>
          <div className="form-grubu">
            <label className="form-etiketi">Hedef URL</label>
            <div className="form-girisi-ikon">
              <FileCode size={18} className="ikon" />
              <input
                type="text"
                className="form-girisi"
                placeholder="örn: https://example.com"
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
              <><span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} /> İnceleniyor...</>
            ) : (
              <><GlobeLock size={18} /> Siteyi Analiz Et</>
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
              <FileCode size={28} style={{ color: 'var(--birincil)', zIndex: 3 }} />
              <div className="radar-hedef"></div>
            </div>
            <div className="tarama-mesaj">
              Güvenlik başlıkları ve <strong>çerez politikaları</strong> inceleniyor...
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

export default HeaderAnalizi;
