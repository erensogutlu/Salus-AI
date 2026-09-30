import './Profil.css';

const Sartlar = () => {
  return (
    <div className="profil-sayfa" style={{ maxWidth: '860px' }}>
      <div className="profil-baslik">
        <h1>
          Kullanım <span className="gradyan-metin">Şartları</span>
        </h1>
        <p>Son Güncelleme: 30 Eylül 2026</p>
      </div>

      <div className="cam-kart" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '8px' }}>1. Kabul Edilebilir Kullanım</h2>
          <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.65', fontSize: '0.94rem' }}>
            Salus AI tarafından sağlanan siber güvenlik araçları yalnızca yetkili olduğunuz sistemler veya kamuya açık istihbarat kaynakları üzerinde meşru analiz amaçlarıyla kullanılmalıdır. Platformun yasa dışı siber saldırı veya yetkisiz erişim amacıyla kullanılması kesinlikle yasaktır.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '8px' }}>2. Sorumluluk Reddi</h2>
          <p style={{ color: 'var(--metin-soluk)', lineHeight: '1.65', fontSize: '0.94rem' }}>
            Yapay zeka modellerimiz ve analiz araçlarımız tarafından üretilen raporlar tavsiye niteliğindedir. Salus AI, tespit edilen veya edilemeyen güvenlik açıklarından doğabilecek doğrudan veya dolaylı zararlardan sorumlu tutulamaz.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Sartlar;
