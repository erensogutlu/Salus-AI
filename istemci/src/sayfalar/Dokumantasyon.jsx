import { Terminal, Shield, Search, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Profil.css';

const Dokumantasyon = () => {
  const bolumler = [
    {
      ikon: Shield,
      baslik: 'Başlangıç Rehberi',
      aciklama: 'Salus AI platformuna hızlı giriş, hesap oluşturma ve panel genel bakışı.',
      link: '/kayit'
    },
    {
      ikon: Search,
      baslik: 'Tehdit Analizi API & Web Arayüzü',
      aciklama: 'URL, domain ve IP adreslerinin taranması, risk skorlaması ve CVE eşleştirmeleri.',
      link: '/tehdit-analiz'
    },
    {
      ikon: Terminal,
      baslik: 'Ağ & Port Tarama Motoru',
      aciklama: 'Açık port analizleri, Nmap çıktılarının AI ile çözümlenmesi ve servis tespitleri.',
      link: '/ag-tarama'
    },
    {
      ikon: Key,
      baslik: 'Kripto & Güvenlik Araçları',
      aciklama: 'Hash tespiti, Base64/Hex/URL kodlama ve entropi bazlı şifre dayanıklılık testleri.',
      link: '/araclar/kripto'
    }
  ];

  return (
    <div className="profil-sayfa">
      <div className="profil-baslik">
        <h1>
          <span className="gradyan-metin">Salus AI</span> Dokümantasyon
        </h1>
        <p>Geliştirici kılavuzları, API referansları ve siber güvenlik araçları kullanım rehberi.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {bolumler.map((bolum, i) => (
          <div key={i} className="cam-kart" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--birincil-acik)', color: 'var(--birincil)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <bolum.ikon size={22} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)' }}>{bolum.baslik}</h2>
            <p style={{ color: 'var(--metin-soluk)', fontSize: '0.9rem', lineHeight: '1.6', flex: 1 }}>{bolum.aciklama}</p>
            <Link to={bolum.link} className="buton buton-hayalet" style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.84rem' }}>
              Detayları İncele →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dokumantasyon;
