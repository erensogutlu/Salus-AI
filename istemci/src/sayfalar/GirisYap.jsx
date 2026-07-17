import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import { girisYap as girisYapServisi } from '../servisler/apiServisi';
import './GirisYap.css';

const GirisYap = () => {
  const yonlendir = useNavigate();
  const { girisYap } = useYetkilendirme();

  const [formVeri, setFormVeri] = useState({
    eposta: '',
    sifre: '',
  });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);

  // form değişikliği
  const degisiklikIsle = (e) => {
    const { name, value } = e.target;
    setFormVeri((onceki) => ({ ...onceki, [name]: value }));
    setHata('');
  };

  // form gönderimi
  const formGonder = async (e) => {
    e.preventDefault();

    // doğrulama
    if (!formVeri.eposta || !formVeri.sifre) {
      setHata('Lütfen tüm alanları doldurun.');
      return;
    }

    if (!formVeri.eposta.includes('@')) {
      setHata('Geçerli bir e-posta adresi girin.');
      return;
    }

    setYukleniyor(true);
    setHata('');

    try {
      const yanit = await girisYapServisi(formVeri.eposta, formVeri.sifre);
      girisYap(yanit.jeton || yanit.token, yanit.kullanici || yanit.user);
      yonlendir('/panel');
    } catch (err) {
      setHata(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="giris-sayfa izgara-arkaplan">
      <div className="giris-arkaplan">
        <div className="giris-isik giris-isik-1" />
        <div className="giris-isik giris-isik-2" />
      </div>

      <div className="giris-kart cam-kart">
        <div className="giris-baslik">
          <div className="giris-logo">
            <Shield size={32} className="giris-logo-ikon" />
            <span className="giris-logo-metin">Salus AI</span>
          </div>
          <h2>Hoş Geldiniz</h2>
          <p>Hesabınıza giriş yapın</p>
        </div>

        {hata && <div className="giris-hata">{hata}</div>}

        <form className="giris-form" onSubmit={formGonder}>
          <div className="form-grubu">
            <label className="form-etiketi">E-posta</label>
            <div className="form-girisi-ikon">
              <Mail size={18} className="giris-ikon" />
              <input
                type="email"
                name="eposta"
                className="form-girisi"
                placeholder="ornek@eposta.com"
                value={formVeri.eposta}
                onChange={degisiklikIsle}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-grubu">
            <label className="form-etiketi">Şifre</label>
            <div className="form-girisi-ikon">
              <Lock size={18} className="giris-ikon" />
              <input
                type={sifreGoster ? 'text' : 'password'}
                name="sifre"
                className="form-girisi"
                placeholder="Şifrenizi girin"
                value={formVeri.sifre}
                onChange={degisiklikIsle}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="sifre-goster"
                onClick={() => setSifreGoster(!sifreGoster)}
                tabIndex={-1}
              >
                {sifreGoster ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="buton buton-birincil"
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <>
                <span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} />
                Giriş yapılıyor...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Giriş Yap
              </>
            )}
          </button>
        </form>

        <div className="ornek-hesaplar-bolumu" style={{ marginTop: '20px', borderTop: '1px solid var(--sinir)', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--metin-soluk)', marginBottom: '10px', textAlign: 'center' }}>Hızlı Erişim için Örnek Hesaplar:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="buton buton-hayalet"
              style={{ padding: '8px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
              onClick={() => {
                setFormVeri({ eposta: 'deneme@salus.ai', sifre: 'salus123' });
                setHata('');
              }}
            >
              <strong>Test:</strong> deneme@salus.ai (salus123)
            </button>
          </div>
        </div>

        <div className="giris-altBaglanti">
          Hesabınız yok mu?{' '}
          <Link to="/kayit">Kayıt Olun</Link>
        </div>
      </div>
    </div>
  );
};

export default GirisYap;
