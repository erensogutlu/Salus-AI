import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  Wifi,
  User,
  BarChart3,
  Settings,
  Menu,
  X,
  FileText,
  Terminal,
} from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import './Kenar.css';

const Kenar = () => {
  const { kullanici } = useYetkilendirme();
  const [acik, setAcik] = useState(false);

  // kullanıcı baş harfi
  const basHarf = kullanici?.tam_ad
    ? kullanici.tam_ad.charAt(0).toUpperCase()
    : kullanici?.kullanici_adi
    ? kullanici.kullanici_adi.charAt(0).toUpperCase()
    : 'K';

  // menü öğeleri
  const menuOgeleri = [
    { baslik: 'Ana Menü', ogeler: [
      { yol: '/panel', etiket: 'Panel', ikon: LayoutDashboard },
      { yol: '/ai-sohbet', etiket: 'AI Sohbet', ikon: MessageSquare },
      { yol: '/tehdit-analiz', etiket: 'Tehdit Analiz', ikon: Search },
      { yol: '/ag-tarama', etiket: 'Ağ Tarama', ikon: Wifi },
      { yol: '/log-analiz', etiket: 'Log Analiz', ikon: Terminal },
      { yol: '/raporlar', etiket: 'Raporlar', ikon: FileText },
    ]},
    { baslik: 'Hesap', ogeler: [
      { yol: '/profil', etiket: 'Profil', ikon: User },
    ]},
  ];

  return (
    <>
      {/* mobil tetik butonu */}
      <button className="kenar-mobil-tetik" onClick={() => setAcik(true)}>
        <Menu size={22} />
      </button>

      {/* mobil arkaplan */}
      <div
        className={`kenar-arka ${acik ? 'acik' : ''}`}
        onClick={() => setAcik(false)}
      />

      {/* kenar çubuğu */}
      <aside className={`kenar-cubugu ${acik ? 'acik' : ''}`}>
        {/* mobilde kapat butonu */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            onClick={() => setAcik(false)}
            style={{
              display: acik ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              color: 'var(--metin-soluk)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* menü grupları */}
        {menuOgeleri.map((grup, indeks) => (
          <div key={indeks}>
            <div className="kenar-baslik">{grup.baslik}</div>
            {grup.ogeler.map((oge) => (
              <NavLink
                key={oge.yol}
                to={oge.yol}
                className={({ isActive }) =>
                  `kenar-baglanti ${isActive ? 'aktif' : ''}`
                }
                onClick={() => setAcik(false)}
              >
                <div className="ikon-kapsayici">
                  <oge.ikon size={18} />
                </div>
                {oge.etiket}
              </NavLink>
            ))}
            {indeks < menuOgeleri.length - 1 && <div className="kenar-ayirici" />}
          </div>
        ))}

        {/* kullanıcı bilgisi */}
        {kullanici && (
          <div className="kenar-kullanici">
            <div className="kenar-kullanici-avatar">{basHarf}</div>
            <div className="kenar-kullanici-bilgi">
              <div className="kenar-kullanici-ad">
                {kullanici.tam_ad || kullanici.kullanici_adi || 'Kullanıcı'}
              </div>
              <div className="kenar-kullanici-rol">Kullanıcı</div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Kenar;
