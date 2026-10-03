import { Lock, Eye, Database } from 'lucide-react';
import './Profil.css';

const Gizlilik = () => {
  return (
    <div className="profil-sayfa" style={{ maxWidth: '860px' }}>
      <div className="profil-baslik">
        <h1>
          Gizlilik <span className="gradyan-metin">Politikası</span>
        </h1>
        <p>Son Güncelleme: 30 Eylül 2026</p>
      </div>

      <div className="cam-kart" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '8px' }}>1. Veri Sorumlusu</h2>
          <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.65', fontSize: '0.94rem' }}>
            Salus AI olarak kullanıcılarımızın gizliliğine ve kişisel verilerinin korunmasına büyük önem veriyoruz. Bu politika, platformumuzu ziyaret ettiğinizde veya hizmetlerimizi kullandığınızda verilerinizin nasıl toplandığını ve işlendiğini açıklar.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '8px' }}>2. Toplanan Bilgiler</h2>
          <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.65', fontSize: '0.94rem' }}>
            Platformumuzda hesap oluşturduğunuzda kullanıcı adı, e-posta adresi ve şifrelenmiş parola bilgileri saklanır. Siber analiz araçları üzerinden sorguladığınız IP adresleri ve alan adları ise tehdit geçmişi oluşturmak amacıyla kaydedilebilir.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '8px' }}>3. Veri Güvenliği</h2>
          <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.65', fontSize: '0.94rem' }}>
            Tüm veri aktarımları TLS 1.3 protokolü ile şifrelenir. Parolalarınız güçlü tuzlama (salt) algoritmaları (bcrypt) ile hashlenerek saklanır.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Gizlilik;
