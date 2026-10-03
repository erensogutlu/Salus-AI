import { Shield, Target, Award, CheckCircle2 } from 'lucide-react';
import './Profil.css';

const Hakkimizda = () => {
  return (
    <div className="profil-sayfa">
      <div className="profil-baslik">
        <h1>
          <span className="gradyan-metin">Salus AI</span> Hakkında
        </h1>
        <p>Yapay zeka teknolojileri ile siber güvenlik ekosistemini yeniden tanımlıyoruz.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="cam-kart" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '14px', color: 'var(--metin)' }}>
            Misyonumuz
          </h2>
          <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.7', fontSize: '1rem' }}>
            Salus AI, modern tehdit ortamında dijital sistemleri korumak için tasarlanmış yeni nesil yapay zeka destekli bir siber güvenlik platformudur. Amacımız, işletmelerin ve bağımsız araştırmacıların güvenlik açıklarını saldırganlardan önce tespit etmesini, ağ zafiyetlerini anında analiz etmesini ve tehdit istihbaratını gerçek zamanlı eyleme dönüştürmesini sağlamaktır.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="cam-kart" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--birincil-acik)', color: 'var(--birincil)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Shield size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--metin)' }}>Akıllı Tehdit Tespiti</h3>
            <p style={{ color: 'var(--metin-soluk)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Sıfırıncı gün (0-day) zafiyetlerini ve anomali kalıplarını derin öğrenme modelleri ile milisaniyeler içinde ortaya çıkarın.
            </p>
          </div>

          <div className="cam-kart" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--basari-acik)', color: 'var(--basari)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Target size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--metin)' }}>Hassas Ağ Taraması</h3>
            <p style={{ color: 'var(--metin-soluk)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Port durumları, açık servisler ve güvenlik duvarı konfigürasyonlarını detaylı analiz ederek ağ haritanızı güçlendirin.
            </p>
          </div>

          <div className="cam-kart" style={{ padding: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--bilgi-acik)', color: 'var(--bilgi)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Award size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--metin)' }}>Global Uyumluluk</h3>
            <p style={{ color: 'var(--metin-soluk)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              ISO 27001, SOC 2 ve KVKK/GDPR standartlarına uygun denetim logları ve güvenlik başlık analizleri.
            </p>
          </div>
        </div>

        <div className="cam-kart" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '18px', color: 'var(--metin)' }}>
            Neden Salus AI?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {[
              '7/24 Kesintisiz AI Asistanı',
              'Düşük Yanlış Pozitif (False-Positive) Oranı',
              'Otomatik Güvenlik Başlık & SSL Denetimi',
              'Gelişmiş Nmap & Log Çözümleme',
              'Anlık Denetim Günlükleri (Audit Trail)',
              'Uçtan Uca Şifreli Veri İletişimi'
            ].map((madde, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', color: 'var(--metin)' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--basari)', flexShrink: 0 }} />
                <span>{madde}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hakkimizda;
