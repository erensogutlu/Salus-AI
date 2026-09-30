import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  Wifi,
  User,
  FileText,
  Terminal,
  Lock,
  Hash,
  Globe,
  FileCode,
  Sliders,
  Menu,
  X,
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
    {
      baslik: 'Genel',
      ogeler: [
        { yol: '/panel', etiket: 'Panel', ikon: LayoutDashboard },
        { yol: '/ai-sohbet', etiket: 'AI Sohbet', ikon: MessageSquare },
        { yol: '/raporlar', etiket: 'Raporlar', ikon: FileText },
      ],
    },
    {
      baslik: 'Siber Araçlar',
      ogeler: [
        { yol: '/tehdit-analiz', etiket: 'Tehdit Analizi', ikon: Search },
        { yol: '/ag-tarama', etiket: 'Ağ Tarama', ikon: Wifi },
        { yol: '/log-analiz', etiket: 'Log Analizi', ikon: Terminal },
        { yol: '/araclar/sifre', etiket: 'Şifre Araçları', ikon: Lock },
        { yol: '/araclar/kripto', etiket: 'Hash & Base64', ikon: Hash },
        { yol: '/araclar/ip-sorgu', etiket: 'IP Sorgulama', ikon: Globe },
        { yol: '/araclar/subdomain', etiket: 'Subdomain Keşfi', ikon: Search },
        { yol: '/araclar/header', etiket: 'Güvenlik Başlıkları', ikon: FileCode },
      ],
    },
    {
      baslik: 'Hesap',
      ogeler: [
        { yol: '/profil', etiket: 'Profil', ikon: User },
        ...(kullanici?.rol === 'admin'
          ? [{ yol: '/yonetim', etiket: 'Yönetici Paneli', ikon: Sliders }]
          : []),
      ],
    },
  ];

  return (
    <>
      {/* mobil tetik butonu */}
      <button className="kenar-mobil-tetik" onClick={() => setAcik(true)} aria-label="Menüyü Aç">
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
        <div className="kenar-kapat-satir">
          <span className="kenar-logo-metin">Menü</span>
          <button
            onClick={() => setAcik(false)}
            className="kenar-kapat-buton"
            aria-label="Menüyü Kapat"
          >
            <X size={18} />
          </button>
        </div>

        {/* menü grupları */}
        {menuOgeleri.map((grup, indeks) => (
          <div key={indeks} className="kenar-grup">
            <div className="kenar-baslik">{grup.baslik}</div>
            {grup.ogeler.map((oge) => (
              <NavLink
                key={oge.yol}
                to={oge.yol}
                end={oge.yol === '/panel'}
                className={({ isActive }) =>
                  `kenar-baglanti ${isActive ? 'aktif' : ''}`
                }
                onClick={() => setAcik(false)}
              >
                <div className="ikon-kapsayici">
                  <oge.ikon size={18} />
                </div>
                <span>{oge.etiket}</span>
              </NavLink>
            ))}
            {indeks < menuOgeleri.length - 1 && <div className="kenar-ayirici" />}
          </div>
        ))}

        {/* kullanıcı bilgisi */}
        {kullanici && (
          <div className="kenar-kullanici">
            {kullanici.profil_resmi ? (
              <img src={kullanici.profil_resmi} alt="Profil" className="kenar-kullanici-avatar" />
            ) : (
              <div className="kenar-kullanici-avatar">{basHarf}</div>
            )}
            <div className="kenar-kullanici-bilgi">
              <div className="kenar-kullanici-ad">
                {kullanici.tam_ad || kullanici.kullanici_adi || 'Kullanıcı'}
              </div>
              <div className="kenar-kullanici-rol">
                {kullanici.rol === 'admin' ? 'Yönetici' : 'Kullanıcı'}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Kenar;
