import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle } from 'lucide-react';
import './Profil.css';

const Iletisim = () => {
  const [gonderildi, setGonderildi] = useState(false);
  const [form, setForm] = useState({ ad: '', eposta: '', konu: '', mesaj: '' });

  const gonder = (e) => {
    e.preventDefault();
    if (!form.ad || !form.eposta || !form.mesaj) return;
    setGonderildi(true);
  };

  return (
    <div className="profil-sayfa">
      <div className="profil-baslik">
        <h1>
          Bizimle <span className="gradyan-metin">İletişime Geçin</span>
        </h1>
        <p>Görüşleriniz, kurumsal işbirlikleri ve teknik destek talepleriniz için buradayız.</p>
      </div>

      <div className="profil-grid">
        {/* Sol kart */}
        <div className="cam-kart profil-sol-kart" style={{ textAlign: 'left', alignItems: 'flex-start', gap: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--metin)' }}>İletişim Bilgileri</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--birincil-acik)', color: 'var(--birincil)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Mail size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--metin-soluk)', fontWeight: 600 }}>E-Posta</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--metin)', fontWeight: 500 }}>destek@salusai.com</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--basari-acik)', color: 'var(--basari)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--metin-soluk)', fontWeight: 600 }}>Telefon</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--metin)', fontWeight: 500 }}>+90 (212) 555 0199</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bilgi-acik)', color: 'var(--bilgi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--metin-soluk)', fontWeight: 600 }}>Merkez Ofis</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--metin)', fontWeight: 500 }}>Levent, Büyükdere Cad. No:199, İstanbul</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ kart */}
        <div className="cam-kart profil-sag-kart">
          {gonderildi ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <CheckCircle size={48} style={{ color: 'var(--basari)', margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '8px' }}>Mesajınız Alındı!</h2>
              <p style={{ color: 'var(--metin-soluk)', fontSize: '0.95rem', marginBottom: '24px' }}>
                En kısa süre içerisinde ekibimiz e-posta adresiniz üzerinden geri dönüş sağlayacaktır.
              </p>
              <button className="buton buton-birincil" onClick={() => { setGonderildi(false); setForm({ ad: '', eposta: '', konu: '', mesaj: '' }); }}>
                Yeni Mesaj Gönder
              </button>
            </div>
          ) : (
            <form onSubmit={gonder} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--metin)', marginBottom: '6px' }}>Bize Mesaj Bırakın</h2>
              
              <div className="profil-form-satir" style={{ marginBottom: 0 }}>
                <div className="form-grubu">
                  <label className="form-etiketi">Adınız Soyadınız</label>
                  <input
                    type="text"
                    className="form-girisi"
                    placeholder="Ad Soyad"
                    value={form.ad}
                    onChange={(e) => setForm({ ...form, ad: e.target.value })}
                    required
                  />
                </div>
                <div className="form-grubu">
                  <label className="form-etiketi">E-Posta Adresiniz</label>
                  <input
                    type="email"
                    className="form-girisi"
                    placeholder="ornek@alanadi.com"
                    value={form.eposta}
                    onChange={(e) => setForm({ ...form, eposta: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grubu">
                <label className="form-etiketi">Konu</label>
                <input
                  type="text"
                  className="form-girisi"
                  placeholder="Mesajınızın konusu"
                  value={form.konu}
                  onChange={(e) => setForm({ ...form, konu: e.target.value })}
                />
              </div>

              <div className="form-grubu">
                <label className="form-etiketi">Mesajınız</label>
                <textarea
                  className="form-girisi"
                  rows={5}
                  placeholder="Mesajınızı detaylıca belirtin..."
                  value={form.mesaj}
                  onChange={(e) => setForm({ ...form, mesaj: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="buton buton-birincil" style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
                <Send size={16} /> Gönder
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Iletisim;
