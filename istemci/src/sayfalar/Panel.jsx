import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  Activity,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Wifi,
  FileText,
  Bug,
  ArrowRight,
  Database,
  Terminal,
  Lock,
  Globe,
  Hash,
  Sliders
} from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import { panelVerisi } from '../servisler/apiServisi';
import YuklemeSpinner from '../bilesenler/YuklemeSpinner';
import './Panel.css';

const Panel = () => {
  const { kullanici } = useYetkilendirme();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [panelVeri, setPanelVeri] = useState(null);

  useEffect(() => {
    const veriYukle = async () => {
      try {
        const yanit = await panelVerisi();
        if (yanit.basarili) {
          setPanelVeri(yanit.veri);
        }
      } catch (hata) {
        console.error('Panel verileri yuklenirken hata olustu:', hata);
      } finally {
        setYukleniyor(false);
      }
    };

    veriYukle();
  }, []);

  if (yukleniyor) {
    return <div className="panel-sayfa"><YuklemeSpinner boyut="buyuk" metin="Panel yükleniyor..." /></div>;
  }

  const veri = panelVeri;

  return (
    <div className="panel-sayfa">
      {/* karşılama banner */}
      <div className="panel-karsilama">
        <h1>
          Hoş geldin, <span className="gradyan-metin">{kullanici?.tam_ad || kullanici?.kullanici_adi || 'Kullanıcı'}</span> 👋
        </h1>
        <p>Sistem aktivitelerinize ve tehdit istatistiklerine genel bakış.</p>
      </div>

      {/* istatistik kartları */}
      <div className="panel-istatistikler">
        <div className="istatistik-kart cam-kart">
          <div className="istatistik-kart-ikon birincil">
            <Search size={22} />
          </div>
          <div className="istatistik-kart-bilgi">
            <div className="istatistik-kart-deger">{veri.toplamTarama}</div>
            <div className="istatistik-kart-etiket">Toplam Analiz ve Tarama</div>
            <span className={`istatistik-kart-degisim ${(veri.taramaDegisim || 0) >= 0 ? 'artis' : 'azalis'}`}>
              {(veri.taramaDegisim || 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{' '}
              {(veri.taramaDegisim || 0) >= 0 ? `+${veri.taramaDegisim || 0}%` : `${veri.taramaDegisim || 0}%`}
            </span>
          </div>
        </div>

        <div className="istatistik-kart cam-kart">
          <div className="istatistik-kart-ikon uyari">
            <AlertTriangle size={22} />
          </div>
          <div className="istatistik-kart-bilgi">
            <div className="istatistik-kart-deger">{veri.tespitEdilenTehdit}</div>
            <div className="istatistik-kart-etiket">Tespit Edilen Tehditler</div>
            <span className={`istatistik-kart-degisim ${(veri.tehditDegisim || 0) > 0 ? 'azalis' : 'artis'}`}>
              {(veri.tehditDegisim || 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{' '}
              {(veri.tehditDegisim || 0) >= 0 ? `+${veri.tehditDegisim || 0}%` : `${veri.tehditDegisim || 0}%`}
            </span>
          </div>
        </div>

        <div className="istatistik-kart cam-kart">
          <div className="istatistik-kart-ikon ikincil">
            <Database size={22} />
          </div>
          <div className="istatistik-kart-bilgi">
            <div className="istatistik-kart-deger">{veri.aktifAraclar || 0}</div>
            <div className="istatistik-kart-etiket">Aktif AI Araçları</div>
            <span className="istatistik-kart-degisim artis">
              <CheckCircle size={12} /> Sistem Optimizasyonlu
            </span>
          </div>
        </div>
      </div>

      {/* orta grid: tehdit listesi + tehdit dağılımı */}
      <div className="panel-alt-grid">
        {/* son tehditler */}
        <div className="cam-kart">
          <div className="panel-tablo-baslik">
            <h3>Son Aktivite ve Tehditler</h3>
            <Link to="/tehdit-analiz" className="buton buton-hayalet" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Analizlere Git <ArrowRight size={14} />
            </Link>
          </div>
          <div className="panel-tablo-govde">
            {veri.sonTehditler && veri.sonTehditler.length > 0 ? (
              veri.sonTehditler.map((tehdit) => (
                <div key={tehdit.id} className="tehdit-satir">
                  <div className={`tehdit-ikon ${tehdit.seviye}`}>
                    {tehdit.seviye === 'yuksek' ? <AlertTriangle size={16} /> :
                     tehdit.seviye === 'orta' ? <Bug size={16} /> :
                     <CheckCircle size={16} />}
                  </div>
                  <div className="tehdit-bilgi">
                    <div className="tehdit-ad">{tehdit.ad}</div>
                    <div className="tehdit-zaman">{tehdit.zaman}</div>
                  </div>
                  <span className={`rozet rozet-${tehdit.seviye === 'yuksek' ? 'tehlike' : tehdit.seviye === 'orta' ? 'uyari' : 'basari'}`}>
                    {tehdit.seviye === 'yuksek' ? 'Yüksek' : tehdit.seviye === 'orta' ? 'Orta' : 'Düşük'}
                  </span>
                </div>
              ))
            ) : (
              <div className="tehdit-bos-mesaj" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--metin-soluk)', fontSize: '0.9rem' }}>
                Henüz kayıtlı bir siber tehdit veya analiz bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* tehdit dağılımı */}
        <div className="cam-kart tehdit-dagilim">
          <h3 className="tehdit-dagilim-baslik">Tehdit Dağılımı</h3>
          <div className="dagilim-cubuk-kapsayici">
            {[
              { etiket: 'Kritik', deger: veri.tehditDagilim?.kritik || 0, renk: 'var(--tehlike)', oran: veri.tehditDagilim?.kritik || 0 },
              { etiket: 'Yüksek', deger: veri.tehditDagilim?.yuksek || 0, renk: '#f97316', oran: veri.tehditDagilim?.yuksek || 0 },
              { etiket: 'Orta', deger: veri.tehditDagilim?.orta || 0, renk: 'var(--uyari)', oran: veri.tehditDagilim?.orta || 0 },
              { etiket: 'Düşük', deger: veri.tehditDagilim?.dusuk || 0, renk: 'var(--basari)', oran: veri.tehditDagilim?.dusuk || 0 },
            ].map((oge, i) => (
              <div key={i} className="dagilim-cubuk-satir">
                <div className="dagilim-cubuk-ust">
                  <span className="dagilim-cubuk-etiket">{oge.etiket}</span>
                  <span className="dagilim-cubuk-deger" style={{ color: oge.renk }}>{oge.deger}%</span>
                </div>
                <div className="dagilim-cubuk">
                  <div
                    className="dagilim-cubuk-dolgu"
                    style={{ width: `${oge.oran}%`, background: oge.renk }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* hızlı işlemler (tam genişlik) */}
      <div className="cam-kart" style={{ marginTop: '24px' }}>
        <div className="panel-tablo-baslik">
          <h3>Hızlı İşlemler ve Araçlar</h3>
        </div>
        <div className="hizli-islemler" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Link to="/ai-sohbet" className="hizli-islem-buton">
            <MessageSquare size={18} />
            AI Sohbet
          </Link>
          <Link to="/raporlar" className="hizli-islem-buton">
            <FileText size={18} />
            Raporlar Merkezi
          </Link>
          <Link to="/tehdit-analiz" className="hizli-islem-buton">
            <Search size={18} />
            Tehdit Analizi
          </Link>
          <Link to="/log-analiz" className="hizli-islem-buton">
            <Terminal size={18} />
            Log Analizi
          </Link>
          <Link to="/araclar/sifre" className="hizli-islem-buton">
            <Lock size={18} />
            Şifre Araçları
          </Link>
          <Link to="/araclar/subdomain" className="hizli-islem-buton">
            <Globe size={18} />
            Subdomain Keşfi
          </Link>
          <Link to="/ag-tarama" className="hizli-islem-buton">
            <Wifi size={18} />
            Ağ Tarama
          </Link>
          <Link to="/araclar/ip-sorgu" className="hizli-islem-buton">
            <Globe size={18} />
            IP Sorgulama
          </Link>
          <Link to="/araclar/header" className="hizli-islem-buton">
            <Sliders size={18} />
            Header Analizi
          </Link>
          <Link to="/araclar/kripto" className="hizli-islem-buton">
            <Hash size={18} />
            Kripto & Base64
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Panel;

