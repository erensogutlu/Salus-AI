import { useState, useEffect } from 'react';
import {
  Key,
  Lock,
  ShieldAlert,
  Check,
  AlertCircle,
  Settings as SettingsIcon,
  Bell,
  Monitor,
  Download,
  Smartphone
} from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import { sifreDegistir, hesapSil } from '../servisler/apiServisi';
import './Profil.css'; // aynı css'i kullanabiliriz

const Ayarlar = () => {
  const { kullanici, cikisYap } = useYetkilendirme();

  const [mevcutSifre, setMevcutSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');

  const [sifreHata, setSifreHata] = useState('');
  const [sifreBasari, setSifreBasari] = useState('');
  
  const [yukleniyor, setYukleniyor] = useState(false);

  // tema ve bildirim durumları (mock)
  const [tema, setTema] = useState('koyu');
  const [bildirimler, setBildirimler] = useState({ eposta: true, tarayici: true, guvenlik: true });

  // temayı yükle
  useEffect(() => {
    const kayitliTema = localStorage.getItem('salus-tema') || 'koyu';
    setTema(kayitliTema);
  }, []);

  // tema değiştirici
  const temaDegistir = (yeniTema) => {
    setTema(yeniTema);
    localStorage.setItem('salus-tema', yeniTema);
    document.documentElement.setAttribute('data-theme', yeniTema);
  };

  // şifre değiştirme işlemi
  const sifreGuncelle = async (e) => {
    e.preventDefault();
    setSifreHata('');
    setSifreBasari('');

    if (yeniSifre !== yeniSifreTekrar) {
      setSifreHata('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (yeniSifre.length < 6) {
      setSifreHata('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    setYukleniyor(true);

    try {
      const yanit = await sifreDegistir(mevcutSifre, yeniSifre);
      if (yanit.basarili) {
        setSifreBasari('Şifreniz başarıyla değiştirildi.');
        setMevcutSifre('');
        setYeniSifre('');
        setYeniSifreTekrar('');
      }
    } catch (hata) {
      setSifreHata(hata.message || 'Şifre değiştirilirken bir hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  const hesabiSil = async () => {
    const onay = window.confirm('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinir.');
    if (!onay) return;

    setYukleniyor(true);
    try {
      const yanit = await hesapSil();
      if (yanit.basarili) {
        alert('Hesabınız başarıyla silindi.');
        cikisYap();
      }
    } catch (hata) {
      alert(hata.message || 'Hesap silinirken bir hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  const veriIndir = () => {
    alert('Hesap verileriniz (JSON formatında) hazırlanıyor. İndirme işlemi birazdan başlayacaktır.');
  };

  return (
    <div className="profil-sayfa">
      <div className="profil-baslik">
        <h1>Sistem Ayarları</h1>
        <p>Arayüz tercihlerinizi, bildirimlerinizi ve hesabınızın genel güvenlik standartlarını yönetin.</p>
      </div>

      <div className="profil-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="cam-kart profil-sag-kart">
          
          <section className="profil-form-bolumu">
            <h3>
              <SettingsIcon size={18} />
              Sistem Tercihleri
            </h3>
            <p style={{ color: 'var(--metin-soluk)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Şu anda <strong>{kullanici?.kullanici_adi}</strong> ({kullanici?.eposta}) olarak oturum açtınız.
            </p>
          </section>

          {/* görünüm ayarları */}
          <section className="profil-form-bolumu">
            <h3>
              <Monitor size={18} />
              Arayüz ve Görünüm
            </h3>
            <div className="form-grubu" style={{ marginBottom: '16px' }}>
              <label className="form-etiketi">Tema Seçimi</label>
              <select 
                className="form-girisi" 
                value={tema} 
                onChange={(e) => temaDegistir(e.target.value)}
                style={{ cursor: 'pointer', appearance: 'auto' }}
              >
                <option value="koyu">Koyu (Dark Mode)</option>
                <option value="matrix">Matrix Hacker (Yeşil Terminal)</option>
                <option value="acik">Açık (Light Mode - Önerilmez)</option>
              </select>
            </div>
          </section>

          {/* bildirim ayarları */}
          <section className="profil-form-bolumu">
            <h3>
              <Bell size={18} />
              Bildirim ve Uyarılar
              <span className="rozet rozet-uyari" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>BETA</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={bildirimler.eposta} 
                  onChange={(e) => setBildirimler({...bildirimler, eposta: e.target.checked})} 
                />
                E-Posta Bülteni ve Güncellemeler
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={bildirimler.tarayici} 
                  onChange={(e) => setBildirimler({...bildirimler, tarayici: e.target.checked})} 
                />
                Tarayıcı İçi Sistem Bildirimleri
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--uyari)' }}>
                <input 
                  type="checkbox" 
                  checked={bildirimler.guvenlik} 
                  onChange={(e) => setBildirimler({...bildirimler, guvenlik: e.target.checked})} 
                />
                Acil Güvenlik Tehditleri (Zorunlu Önerilir)
              </label>
            </div>
          </section>

          {/* şifre değiştirme */}
          <section className="profil-form-bolumu" style={{ borderTop: '1px solid var(--sinir)', paddingTop: '24px' }}>
            <h3>
              <Key size={18} />
              Şifre Değiştir
            </h3>

            {sifreHata && (
              <div className="form-geribildirim hata">
                <AlertCircle size={16} />
                <span>{sifreHata}</span>
              </div>
            )}
            {sifreBasari && (
              <div className="form-geribildirim basarili">
                <Check size={16} />
                <span>{sifreBasari}</span>
              </div>
            )}

            <form onSubmit={sifreGuncelle}>
              <div className="form-grubu" style={{ marginBottom: '16px' }}>
                <label className="form-etiketi">Mevcut Şifre</label>
                <input
                  type="password"
                  value={mevcutSifre}
                  onChange={(e) => setMevcutSifre(e.target.value)}
                  className="form-girisi"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="profil-form-satir">
                <div className="form-grubu">
                  <label className="form-etiketi">Yeni Şifre</label>
                  <input
                    type="password"
                    value={yeniSifre}
                    onChange={(e) => setYeniSifre(e.target.value)}
                    className="form-girisi"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="form-grubu">
                  <label className="form-etiketi">Yeni Şifre Tekrar</label>
                  <input
                    type="password"
                    value={yeniSifreTekrar}
                    onChange={(e) => setYeniSifreTekrar(e.target.value)}
                    className="form-girisi"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={yukleniyor}
                className="buton buton-ikincil"
                style={{ marginTop: '8px' }}
              >
                <Lock size={16} />
                Şifreyi Güncelle
              </button>
            </form>
          </section>

          {/* veri ve gizlilik */}
          <section className="profil-form-bolumu" style={{ borderTop: '1px solid var(--sinir)', paddingTop: '24px' }}>
            <h3>
              <Smartphone size={18} />
              Veri Gizliliği
              <span className="rozet rozet-uyari" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>BETA</span>
            </h3>
            <p style={{ color: 'var(--metin-soluk)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Sisteme kaydettiğiniz tüm tehdit logları ve hesap ayarlarınızın yedeğini şifreli JSON formatında bilgisayarınıza indirebilirsiniz.
            </p>
            <button
                type="button"
                onClick={veriIndir}
                className="buton buton-hayalet"
              >
                <Download size={16} /> Verilerimi İndir
            </button>
          </section>

          {/* tehlike bölgesi */}
          <div className="tehlike-bolgesi" style={{ marginTop: '32px' }}>
            <h3>
              <ShieldAlert size={18} />
              Tehlikeli Bölge
            </h3>
            <p>Hesabınızı sildiğinizde, tüm verileriniz (sohbet geçmişi, tehdit kayıtları, analizler) kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={cikisYap}
                className="buton buton-hayalet"
                style={{ border: '1px solid var(--sinir)' }}
              >
                Oturumu Kapat
              </button>
              <button
                type="button"
                onClick={hesabiSil}
                disabled={yukleniyor}
                className="buton buton-tehlike"
              >
                Hesabı Sil
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Ayarlar;
