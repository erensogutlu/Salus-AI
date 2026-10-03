import { MapPin, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Profil.css';

const Kariyer = () => {
  const pozisyonlar = [
    {
      id: 1,
      baslik: 'Kıdemli AI Güvenlik Araştırmacısı',
      departman: 'Yapay Zeka & Siber İstihbarat',
      lokasyon: 'İstanbul / Hibrit',
      tip: 'Tam Zamanlı',
      aciklama: 'Büyük dil modellerinin güvenliği, jailbreak tespiti ve savunma optimizasyonları geliştirecek kıdemli araştırmacı.'
    },
    {
      id: 2,
      baslik: 'Siber Güvenlik Backend Geliştiricisi',
      departman: 'Mühendislik',
      lokasyon: 'Uzaktan (Remote)',
      tip: 'Tam Zamanlı',
      aciklama: 'Node.js, PostgreSQL ve mikroservis mimarileri ile yüksek performanslı tehdit analiz motoru geliştirecek yazılımcı.'
    },
    {
      id: 3,
      baslik: 'Frontend (React / UI) Mühendisi',
      departman: 'Ürün & Tasarım',
      lokasyon: 'İstanbul / Hibrit',
      tip: 'Tam Zamanlı',
      aciklama: 'Modern web standartları, animasyonlar ve siber güvenlik dashboardları geliştirecek deneyimli arayüz mühendisi.'
    }
  ];

  return (
    <div className="profil-sayfa">
      <div className="profil-baslik">
        <h1>
          <span className="gradyan-metin">Salus AI</span> Kariyer Fırsatları
        </h1>
        <p>Yapay zeka ve siber güvenliğin kesişim noktasında geleceği inşa eden ekibimize katılın.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="cam-kart" style={{ padding: '28px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, var(--birincil-acik), rgba(94, 92, 230, 0.05))' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--birincil)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '4px' }}>
              Yenilikçi Kültür ve Sürekli Gelişim
            </h3>
            <p style={{ color: 'var(--metin-soluk)', fontSize: '0.9rem' }}>
              Ekip üyelerimize sürekli öğrenme bütçesi, esnek çalışma saatleri ve en son teknoloji donanım desteği sağlıyoruz.
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--metin)', marginTop: '12px' }}>
          Açık Pozisyonlar
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pozisyonlar.map((pozisyon) => (
            <div key={pozisyon.id} className="cam-kart" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--metin)' }}>{pozisyon.baslik}</h3>
                  <p style={{ color: 'var(--birincil)', fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{pozisyon.departman}</p>
                </div>
                <Link to="/iletisim" className="buton buton-birincil buton-kucuk">
                  Başvur <ArrowRight size={14} />
                </Link>
              </div>
              <p style={{ color: 'var(--metin-soluk)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {pozisyon.aciklama}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--metin-cok-soluk)', paddingTop: '8px', borderTop: '1px solid var(--sinir)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {pozisyon.lokasyon}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {pozisyon.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kariyer;
