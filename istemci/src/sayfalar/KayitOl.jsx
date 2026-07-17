import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, User, UserPlus, AtSign } from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import { kayitOl as kayitOlServisi } from '../servisler/apiServisi';
import './KayitOl.css';

const KayitOl = () => {
  const yonlendir = useNavigate();
  const { kayitOl } = useYetkilendirme();

  const [formVeri, setFormVeri] = useState({
    tamAd: '',
    kullaniciAdi: '',
    eposta: '',
    sifre: '',
    sifreTekrar: '',
  });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [sartlarKabul, setSartlarKabul] = useState(false);

  // form değişikliği
  const degisiklikIsle = (e) => {
    const { name, value } = e.target;
    setFormVeri((onceki) => ({ ...onceki, [name]: value }));
    setHata('');
  };

  // şifre güç hesaplama
  const sifreGuc = useMemo(() => {
    const sifre = formVeri.sifre;
    if (!sifre) return { seviye: 0, metin: '', sinif: '' };

    let puan = 0;
    if (sifre.length >= 6) puan++;
    if (sifre.length >= 10) puan++;
    if (/[A-Z]/.test(sifre)) puan++;
    if (/[0-9]/.test(sifre)) puan++;
    if (/[^A-Za-z0-9]/.test(sifre)) puan++;

    if (puan <= 2) return { seviye: 1, metin: 'Zayıf', sinif: 'zayif' };
    if (puan <= 3) return { seviye: 2, metin: 'Orta', sinif: 'orta' };
    return { seviye: 3, metin: 'Güçlü', sinif: 'guclu' };
  }, [formVeri.sifre]);

  // form gönderimi
  const formGonder = async (e) => {
    e.preventDefault();

    // doğrulama
    if (!formVeri.tamAd || !formVeri.kullaniciAdi || !formVeri.eposta || !formVeri.sifre) {
      setHata('Lütfen tüm alanları doldurun.');
      return;
    }

    if (!formVeri.eposta.includes('@')) {
      setHata('Geçerli bir e-posta adresi girin.');
      return;
    }

    if (formVeri.sifre.length < 6) {
      setHata('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (formVeri.sifre !== formVeri.sifreTekrar) {
      setHata('Şifreler eşleşmiyor.');
      return;
    }

    if (!sartlarKabul) {
      setHata('Kullanım şartlarını kabul etmeniz gerekiyor.');
      return;
    }

    setYukleniyor(true);
    setHata('');

    try {
      const yanit = await kayitOlServisi(
        formVeri.kullaniciAdi,
        formVeri.eposta,
        formVeri.sifre,
        formVeri.tamAd
      );
      kayitOl(yanit.jeton || yanit.token, yanit.kullanici || yanit.user);
      yonlendir('/panel');
    } catch (err) {
      setHata(err.message || 'Kayıt başarısız. Lütfen tekrar deneyin.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="kayit-sayfa giris-sayfa izgara-arkaplan">
      <div className="giris-arkaplan">
        <div className="giris-isik giris-isik-1" />
        <div className="giris-isik giris-isik-2" />
      </div>

      <div className="kayit-kart cam-kart">
        <div className="giris-baslik">
          <div className="giris-logo">
            <Shield size={32} className="giris-logo-ikon" />
            <span className="giris-logo-metin">Salus AI</span>
          </div>
          <h2>Hesap Oluştur</h2>
          <p>Güvenlik yolculuğunuza başlayın</p>
        </div>

        {hata && <div className="giris-hata">{hata}</div>}

        <form className="kayit-form" onSubmit={formGonder}>
          <div className="kayit-satir">
            <div className="form-grubu">
              <label className="form-etiketi">Tam Ad</label>
              <div className="form-girisi-ikon">
                <User size={18} className="giris-ikon" />
                <input
                  type="text"
                  name="tamAd"
                  className="form-girisi"
                  placeholder="Ad Soyad"
                  value={formVeri.tamAd}
                  onChange={degisiklikIsle}
                />
              </div>
            </div>

            <div className="form-grubu">
              <label className="form-etiketi">Kullanıcı Adı</label>
              <div className="form-girisi-ikon">
                <AtSign size={18} className="giris-ikon" />
                <input
                  type="text"
                  name="kullaniciAdi"
                  className="form-girisi"
                  placeholder="kullanici_adi"
                  value={formVeri.kullaniciAdi}
                  onChange={degisiklikIsle}
                />
              </div>
            </div>
          </div>

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
                placeholder="En az 6 karakter"
                value={formVeri.sifre}
                onChange={degisiklikIsle}
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
            {/* şifre güç göstergesi */}
            {formVeri.sifre && (
              <div className="sifre-guc">
                <div className="sifre-guc-cubuklar">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`sifre-guc-cubuk ${i <= sifreGuc.seviye ? `dolu ${sifreGuc.sinif}` : ''}`}
                    />
                  ))}
                </div>
                <span className={`sifre-guc-metin ${sifreGuc.sinif}`}>
                  {sifreGuc.metin}
                </span>
              </div>
            )}
          </div>

          <div className="form-grubu">
            <label className="form-etiketi">Şifre Tekrar</label>
            <div className="form-girisi-ikon">
              <Lock size={18} className="giris-ikon" />
              <input
                type="password"
                name="sifreTekrar"
                className="form-girisi"
                placeholder="Şifrenizi tekrar girin"
                value={formVeri.sifreTekrar}
                onChange={degisiklikIsle}
              />
            </div>
          </div>

          {/* şartlar kutusu */}
          <div className="sartlar-kutu">
            <input
              type="checkbox"
              id="sartlar"
              checked={sartlarKabul}
              onChange={(e) => setSartlarKabul(e.target.checked)}
            />
            <label htmlFor="sartlar">
              <a href="#">Kullanım Şartları</a> ve <a href="#">Gizlilik Politikası</a>'nı
              okudum ve kabul ediyorum.
            </label>
          </div>

          <button
            type="submit"
            className="buton buton-birincil"
            disabled={yukleniyor}
          >
            {yukleniyor ? (
              <>
                <span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} />
                Kayıt yapılıyor...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Kayıt Ol
              </>
            )}
          </button>
        </form>

        <div className="giris-altBaglanti">
          Zaten hesabınız var mı?{' '}
          <Link to="/giris">Giriş Yapın</Link>
        </div>
      </div>
    </div>
  );
};

export default KayitOl;
