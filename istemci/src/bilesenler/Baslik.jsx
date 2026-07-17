import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  MessageSquare,
  Search,
  Wifi,
  User,
  LogOut,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogIn,
  UserPlus,
  FileText,
  Terminal,
  Wrench,
  Lock,
  Globe,
  FileCode,
  Hash,
  Sliders
} from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import './Baslik.css';

const Baslik = () => {
  const { kullanici, oturumAcikMi, cikisYap } = useYetkilendirme();
  const yonlendir = useNavigate();
  const [menuAcik, setMenuAcik] = useState(false);
  const [araclarMenuAcik, setAraclarMenuAcik] = useState(false);
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false);
  const menuRef = useRef(null);
  const araclarRef = useRef(null);

  // menü dışına tıklanınca kapat
  useEffect(() => {
    const disariTiklama = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAcik(false);
      }
      if (araclarRef.current && !araclarRef.current.contains(e.target)) {
        setAraclarMenuAcik(false);
      }
    };
    document.addEventListener('mousedown', disariTiklama);
    return () => document.removeEventListener('mousedown', disariTiklama);
  }, []);

  // mobil menü açıkken sayfa kaydırmasını engelle (toggle kaydırma hatası düzeltmesi)
  useEffect(() => {
    if (mobilMenuAcik) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobilMenuAcik]);

  // çıkış işlemi
  const cikisIslemi = () => {
    cikisYap();
    setMenuAcik(false);
    setAraclarMenuAcik(false);
    setMobilMenuAcik(false);
    yonlendir('/');
  };

  // kullanıcı baş harfi
  const basHarf = kullanici?.tam_ad
    ? kullanici.tam_ad.charAt(0).toUpperCase()
    : kullanici?.kullanici_adi
    ? kullanici.kullanici_adi.charAt(0).toUpperCase()
    : 'K';

  const navLinkleri = [
    { yol: '/', etiket: 'Ana Sayfa', ikon: null },
    { yol: '/ai-sohbet', etiket: 'AI Sohbet', ikon: MessageSquare },
    { yol: '/raporlar', etiket: 'Raporlar', ikon: FileText },
  ];

  const siberAraclarLinkleri = [
    { yol: '/tehdit-analiz', etiket: 'Tehdit Analizi', ikon: Search },
    { yol: '/ag-tarama', etiket: 'Ağ Tarama', ikon: Wifi },
    { yol: '/log-analiz', etiket: 'Gelişmiş Log Analizi', ikon: Terminal },
    { yol: '/araclar/sifre', etiket: 'Şifre Araçları', ikon: Lock },
    { yol: '/araclar/kripto', etiket: 'Hash & Base64', ikon: Hash },
    { yol: '/araclar/ip-sorgu', etiket: 'IP Sorgulama', ikon: Search },
    { yol: '/araclar/subdomain', etiket: 'Subdomain Bulucu', ikon: Globe },
    { yol: '/araclar/header', etiket: 'Güvenlik Başlıkları', ikon: FileCode }
  ];

  return (
    <header className="baslik">
      <div className="baslik-icerik">
        {/* logo */}
        <Link to="/" className="baslik-logo">
          <Shield size={28} className="baslik-logo-ikon" />
          <span className="baslik-logo-metin">Salus AI</span>
        </Link>

        {/* masaüstü navigasyon */}
        <nav className="baslik-nav">
          {navLinkleri.map((baglanti) => (
            <NavLink
              key={baglanti.yol}
              to={baglanti.yol}
              end={baglanti.yol === '/'}
              className={({ isActive }) =>
                `baslik-nav-baglanti ${isActive ? 'aktif' : ''}`
              }
            >
              {baglanti.ikon && <baglanti.ikon size={16} />}
              {baglanti.etiket}
            </NavLink>
          ))}

          {/* araçlar menüsü (dropdown) */}
          <div className="kullanici-menu" ref={araclarRef}>
            <button
              className="baslik-nav-baglanti"
              onClick={() => setAraclarMenuAcik(!araclarMenuAcik)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}
            >
              <Wrench size={16} />
              Siber Araçlar
              <ChevronDown size={14} style={{
                transition: 'transform 0.2s',
                transform: araclarMenuAcik ? 'rotate(180deg)' : 'rotate(0)',
                marginLeft: '4px'
              }} />
            </button>
            
            {araclarMenuAcik && (
              <div className="kullanici-menu-acilir" style={{ left: 0, right: 'auto', minWidth: '220px' }}>
                {siberAraclarLinkleri.map((arac) => (
                  <Link
                    key={arac.yol}
                    to={arac.yol}
                    className="kullanici-menu-oge"
                    onClick={() => setAraclarMenuAcik(false)}
                  >
                    <arac.ikon size={16} /> {arac.etiket}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* sağ bölüm */}
        <div className="baslik-sag">
          {oturumAcikMi ? (
            <div className="kullanici-menu" ref={menuRef}>
              <button
                className="kullanici-menu-tetik"
                onClick={() => setMenuAcik(!menuAcik)}
              >
                {kullanici?.profil_resmi ? (
                  <img src={kullanici.profil_resmi} alt="Profil" className="kullanici-avatar" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="kullanici-avatar">{basHarf}</div>
                )}
                <span className="kullanici-menu-ad">
                  {kullanici?.kullanici_adi || 'Kullanıcı'}
                </span>
                <ChevronDown size={14} style={{
                  transition: 'transform 0.2s',
                  transform: menuAcik ? 'rotate(180deg)' : 'rotate(0)',
                }} />
              </button>

              {menuAcik && (
                <div className="kullanici-menu-acilir">
                  {kullanici?.rol === 'admin' && (
                    <Link
                      to="/yonetim"
                      className="kullanici-menu-oge"
                      onClick={() => setMenuAcik(false)}
                      style={{ color: 'var(--birincil)' }}
                    >
                      <Sliders size={16} />
                      Yönetici Paneli
                    </Link>
                  )}
                  <Link
                    to="/profil"
                    className="kullanici-menu-oge"
                    onClick={() => setMenuAcik(false)}
                  >
                    <User size={16} />
                    Profil
                  </Link>
                  <Link
                    to="/panel"
                    className="kullanici-menu-oge"
                    onClick={() => setMenuAcik(false)}
                  >
                    <LayoutDashboard size={16} />
                    Panel
                  </Link>
                  <Link
                    to="/ayarlar"
                    className="kullanici-menu-oge"
                    onClick={() => setMenuAcik(false)}
                  >
                    <Settings size={16} />
                    Ayarlar
                  </Link>
                  <div className="kullanici-menu-ayirici" />
                  <button
                    className="kullanici-menu-oge tehlike"
                    onClick={cikisIslemi}
                  >
                    <LogOut size={16} />
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/giris" className="buton buton-hayalet" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <LogIn size={16} />
                Giriş Yap
              </Link>
              <Link to="/kayit" className="buton buton-birincil" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <UserPlus size={16} />
                Kayıt Ol
              </Link>
            </>
          )}

          {/* mobil menü butonu */}
          <button
            className="mobil-menu-buton"
            onClick={() => setMobilMenuAcik(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* mobil menü arkaplanı */}
      <div
        className={`mobil-nav-arka ${mobilMenuAcik ? 'acik' : ''}`}
        onClick={() => setMobilMenuAcik(false)}
      />

      {/* mobil menü */}
      <div className={`mobil-nav ${mobilMenuAcik ? 'acik' : ''}`}>
          <div className="mobil-nav-baslik">
            <Link to="/" className="baslik-logo" onClick={() => setMobilMenuAcik(false)}>
              <Shield size={24} className="baslik-logo-ikon" />
              <span className="baslik-logo-metin">Salus AI</span>
            </Link>
            <button
              className="mobil-menu-buton"
              onClick={() => setMobilMenuAcik(false)}
              style={{ border: 'none' }}
            >
              <X size={20} />
            </button>
          </div>

          {navLinkleri.map((baglanti) => (
            <NavLink
              key={baglanti.yol}
              to={baglanti.yol}
              end={baglanti.yol === '/'}
              className={({ isActive }) =>
                `baslik-nav-baglanti ${isActive ? 'aktif' : ''}`
              }
              onClick={() => setMobilMenuAcik(false)}
            >
              {baglanti.ikon && <baglanti.ikon size={18} />}
              {baglanti.etiket}
            </NavLink>
          ))}
          
          {/* mobil araçlar menüsü */}
          <div className="kullanici-menu-ayirici" style={{ margin: '8px 0' }} />
          <div style={{ padding: '0 16px', fontSize: '0.8rem', color: 'var(--metin-ikincil)', textTransform: 'uppercase', letterSpacing: '1px' }}>Siber Araçlar</div>
          {siberAraclarLinkleri.map((arac) => (
            <Link
              key={arac.yol}
              to={arac.yol}
              className="baslik-nav-baglanti"
              onClick={() => setMobilMenuAcik(false)}
            >
              <arac.ikon size={18} /> {arac.etiket}
            </Link>
          ))}
          <div className="kullanici-menu-ayirici" style={{ margin: '12px 0' }} />

          {oturumAcikMi ? (
            <>
              {kullanici?.rol === 'admin' && (
                <Link
                  to="/yonetim"
                  className="baslik-nav-baglanti"
                  onClick={() => setMobilMenuAcik(false)}
                  style={{ color: 'var(--birincil)' }}
                >
                  <Sliders size={18} />
                  Yönetici Paneli
                </Link>
              )}
              <Link
                to="/profil"
                className="baslik-nav-baglanti"
                onClick={() => setMobilMenuAcik(false)}
              >
                <User size={18} />
                Profil
              </Link>
              <button
                className="baslik-nav-baglanti"
                onClick={cikisIslemi}
                style={{ color: 'var(--tehlike)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <LogOut size={18} />
                Çıkış Yap
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <Link
                to="/giris"
                className="buton buton-hayalet"
                onClick={() => setMobilMenuAcik(false)}
              >
                <LogIn size={16} />
                Giriş Yap
              </Link>
              <Link
                to="/kayit"
                className="buton buton-birincil"
                onClick={() => setMobilMenuAcik(false)}
              >
                <UserPlus size={16} />
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
    </header>
  );
};

export default Baslik;
