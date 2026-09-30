import { Calendar, Clock, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Profil.css';

const Blog = () => {
  const makaleler = [
    {
      id: 1,
      baslik: '2026 Siber Tehdit Ortamı: AI Tabanlı Saldırılar ve Savunma Stratejileri',
      ozet: 'Yapay zekanın siber saldırılarda kullanımının artmasıyla birlikte savunma mekanizmalarının nasıl evrilmesi gerektiğini inceliyoruz.',
      kategori: 'Tehdit İstihbaratı',
      tarih: '28 Eylül 2026',
      okumaSuresi: '5 dk okuma',
      etiketler: ['Yapay Zeka', 'Siber Savunma', 'Tehditler']
    },
    {
      id: 2,
      baslik: 'Zero Trust (Sıfır Güven) Mimarisine Geçiş Rehberi',
      ozet: 'Kurumsal ağlarda güven sınırlarını ortadan kaldırıp kimlik ve bağlam odaklı güvenlik yapısı kurmanın adımları.',
      kategori: 'Ağ Güvenliği',
      tarih: '15 Eylül 2026',
      okumaSuresi: '8 dk okuma',
      etiketler: ['Zero Trust', 'Ağ Mimarisi', 'Kimlik Doğrulama']
    },
    {
      id: 3,
      baslik: 'HTTP Security Headers: Web Uygulamalarınızı 5 Adımda Koruyun',
      ozet: 'CSP, HSTS ve X-Frame-Options gibi kritik güvenlik başlıklarının doğru yapılandırılması ile XSS ve Clickjacking önleme.',
      kategori: 'Web Güvenliği',
      tarih: '02 Eylül 2026',
      okumaSuresi: '6 dk okuma',
      etiketler: ['Web Güvenliği', 'Headers', 'CSP']
    }
  ];

  return (
    <div className="profil-sayfa">
      <div className="profil-baslik">
        <h1>
          <span className="gradyan-metin">Salus AI</span> Blog & Araştırmalar
        </h1>
        <p>Siber güvenlik dünyasından en güncel araştırmalar, analizler ve teknik rehberler.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {makaleler.map((makale) => (
          <div key={makale.id} className="cam-kart" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="rozet rozet-birincil">{makale.kategori}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--metin-cok-soluk)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {makale.okumaSuresi}
              </span>
            </div>

            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)', lineHeight: '1.4' }}>
              {makale.baslik}
            </h2>

            <p style={{ color: 'var(--metin-soluk)', fontSize: '0.9rem', lineHeight: '1.6', flex: 1 }}>
              {makale.ozet}
            </p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {makale.etiketler.map((e, idx) => (
                <span key={idx} style={{ fontSize: '0.75rem', background: 'var(--yuzey-acik)', padding: '2px 8px', borderRadius: '6px', color: 'var(--metin-soluk)' }}>
                  #{e}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--sinir)', marginTop: 'auto' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--metin-cok-soluk)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> {makale.tarih}
              </span>
              <Link to="/ai-sohbet" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--birincil)' }}>
                İncele <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;
