import './Profil.css';

const Cerezler = () => {
  return (
    <div className="profil-sayfa" style={{ maxWidth: '860px' }}>
      <div className="profil-baslik">
        <h1>
          Çerez <span className="gradyan-metin">Politikası</span>
        </h1>
        <p>Son Güncelleme: 30 Eylül 2026</p>
      </div>

      <div className="cam-kart" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '8px' }}>1. Çerezler Nedir?</h2>
          <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.65', fontSize: '0.94rem' }}>
            Çerezler (cookies), web sitemizi ziyaret ettiğinizde tarayıcınız tarafından cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler, oturumunuzu güvenli bir şekilde sürdürmenizi ve tercihlerinizi (örneğin tema seçimini) hatırlamamızı sağlar.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '8px' }}>2. Kullandığımız Çerez Türleri</h2>
          <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.65', fontSize: '0.94rem' }}>
            <strong>Zorunlu Çerezler:</strong> Giriş yetkilendirmesi ve oturum güvenliği için gereklidir.<br />
            <strong>İşlevsel Çerezler:</strong> Koyu/Açık tema gibi kullanıcı tercihlerini kaydetmek için kullanılır.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Cerezler;
