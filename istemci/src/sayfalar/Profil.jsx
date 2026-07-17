import { useState, useEffect } from 'react';
import {
  User,
  Check,
  AlertCircle,
  Save,
  Terminal,
  Activity,
  Shield,
  Clock,
  Key
} from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import { profilGuncelle, panelVerisi } from '../servisler/apiServisi';
import './Profil.css';

const Profil = () => {
  const { kullanici, setKullanici } = useYetkilendirme();

  // form durumları
  const [tamAd, setTamAd] = useState(kullanici?.tam_ad || '');
  const [profilResmi, setProfilResmi] = useState(kullanici?.profil_resmi || '');
  const [departman, setDepartman] = useState(kullanici?.departman || 'Siber Güvenlik');
  const [rol, setRol] = useState(kullanici?.rol || 'Güvenlik Analisti');
  
  // apı anahtarı mock
  const [apiAnahtariGoster, setApiAnahtariGoster] = useState(false);
  const [apiKey] = useState('sls_' + Math.random().toString(36).substr(2, 24));

  // geribildirim durumları
  const [profilHata, setProfilHata] = useState('');
  const [profilBasari, setProfilBasari] = useState('');

  // istatistik durumları
  const [istatistikler, setIstatistikler] = useState({
    toplamTarama: 0,
    toplamTehdit: 0,
  });

  const [yukleniyor, setYukleniyor] = useState(false);

  // panel verilerini yükle (istatistikler için)
  useEffect(() => {
    const verileriYukle = async () => {
      try {
        const yanit = await panelVerisi();
        if (yanit.basarili && yanit.veri) {
          setIstatistikler({
            toplamTarama: yanit.veri.toplamTarama || 0,
            toplamTehdit: yanit.veri.tespitEdilenTehdit || 0,
          });
        }
      } catch (hata) {
        console.error('istatistikler yüklenemedi:', hata);
      }
    };
    
    if (kullanici) {
      verileriYukle();
    }
  }, [kullanici]);

  // profil güncelleme işlemi
  const profilKaydet = async (e) => {
    e.preventDefault();
    setProfilHata('');
    setProfilBasari('');
    setYukleniyor(true);

    try {
      const yanit = await profilGuncelle({
        tam_ad: tamAd,
        profil_resmi: profilResmi,
      });

      if (yanit.basarili) {
        setProfilBasari('Profil bilgileriniz başarıyla güncellendi.');
        // departman ve rol genelde db'den gelir ama ui için localde güncelliyoruz
        setKullanici({ ...yanit.kullanici, departman, rol });
      }
    } catch (hata) {
      setProfilHata(hata.message || 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  const tarihFormatla = (tarihStr) => {
    if (!tarihStr) return '-';
    return new Date(tarihStr).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const apiKopyala = () => {
    navigator.clipboard.writeText(apiKey);
    alert('API Anahtarı kopyalandı!');
  };

  return (
    <div className="profil-sayfa">
      <div className="profil-baslik">
        <h1>Kullanıcı Profili</h1>
        <p>Salus AI hesap bilgilerinizi, yetki rollerinizi ve sistem API erişimlerinizi yönetin.</p>
      </div>

      <div className="profil-grid">
        {/* sol sütun: avatar ve hızlı bilgiler */}
        <div className="cam-kart profil-sol-kart">
          <div className="profil-avatar-kapsayici">
            <img
              src={profilResmi || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
              alt="Avatar"
              className="profil-avatar-resim"
            />
          </div>
          <h3 className="profil-kullanici-adi">@{kullanici?.kullanici_adi}</h3>
          <p className="profil-eposta">{kullanici?.eposta}</p>
          <span className="rozet rozet-bilgi" style={{ marginTop: '8px' }}>{rol}</span>

          <div className="profil-hizli-istatistikler" style={{ marginTop: '24px' }}>
            <div className="profil-istatistik-satir">
              <span><Shield size={14} style={{ display: 'inline', marginRight: '4px' }}/> Yetki Seviyesi</span>
              <span style={{ color: 'var(--birincil)' }}>Seviye 3 (Analist)</span>
            </div>
            <div className="profil-istatistik-satir">
              <span><Terminal size={14} style={{ display: 'inline', marginRight: '4px' }}/> Toplam Analiz</span>
              <span>{istatistikler.toplamTarama}</span>
            </div>
            <div className="profil-istatistik-satir">
              <span><Activity size={14} style={{ display: 'inline', marginRight: '4px' }}/> Tespit (Tehdit)</span>
              <span style={{ color: istatistikler.toplamTehdit > 0 ? 'var(--tehlike)' : 'var(--basari)' }}>
                {istatistikler.toplamTehdit}
              </span>
            </div>
            <div className="profil-istatistik-satir">
              <span><Clock size={14} style={{ display: 'inline', marginRight: '4px' }}/> Sisteme Katılım</span>
              <span>{tarihFormatla(kullanici?.olusturulma_tarihi)}</span>
            </div>
          </div>
        </div>

        {/* sağ sütun: ayarlar */}
        <div className="cam-kart profil-sag-kart">
          
          <section className="profil-form-bolumu">
            <h3>
              <User size={18} />
              Sistem Profil Bilgileri
            </h3>
            
            {profilHata && (
              <div className="form-geribildirim hata">
                <AlertCircle size={16} />
                <span>{profilHata}</span>
              </div>
            )}
            {profilBasari && (
              <div className="form-geribildirim basarili">
                <Check size={16} />
                <span>{profilBasari}</span>
              </div>
            )}

            <form onSubmit={profilKaydet}>
              <div className="profil-form-satir">
                <div className="form-grubu">
                  <label className="form-etiketi">Kullanıcı Adı (Kimlik ID)</label>
                  <input
                    type="text"
                    value={kullanici?.kullanici_adi || ''}
                    disabled
                    className="form-girisi"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-grubu">
                  <label className="form-etiketi">E-Posta Adresi</label>
                  <input
                    type="email"
                    value={kullanici?.eposta || ''}
                    disabled
                    className="form-girisi"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="profil-form-satir">
                <div className="form-grubu">
                  <label className="form-etiketi">Ad Soyad</label>
                  <input
                    type="text"
                    value={tamAd}
                    onChange={(e) => setTamAd(e.target.value)}
                    className="form-girisi"
                    placeholder="Adınızı ve soyadınızı girin"
                  />
                </div>
                <div className="form-grubu">
                  <label className="form-etiketi">Profil Resmi (URL)</label>
                  <input
                    type="text"
                    value={profilResmi}
                    onChange={(e) => setProfilResmi(e.target.value)}
                    className="form-girisi"
                    placeholder="Resim URL adresi girin"
                  />
                </div>
              </div>

              <div className="profil-form-satir">
                <div className="form-grubu">
                  <label className="form-etiketi">Bağlı Departman (BETA)</label>
                  <input
                    type="text"
                    value={departman}
                    onChange={(e) => setDepartman(e.target.value)}
                    className="form-girisi"
                  />
                </div>
                <div className="form-grubu">
                  <label className="form-etiketi">Sistem Rolü (BETA)</label>
                  <input
                    type="text"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="form-girisi"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={yukleniyor}
                className="buton buton-birincil"
                style={{ marginTop: '8px' }}
              >
                <Save size={16} />
                Profil Değişikliklerini Uygula
              </button>
            </form>
          </section>

          {/* apı erişimi bölümü */}
          <section className="profil-form-bolumu" style={{ marginTop: '32px', borderTop: '1px solid var(--sinir)', paddingTop: '24px' }}>
            <h3>
              <Key size={18} />
              Geliştirici API Erişimi
              <span className="rozet rozet-uyari" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>BETA</span>
            </h3>
            <p style={{ color: 'var(--metin-soluk)', marginBottom: '16px', fontSize: '0.9rem' }}>
              Salus AI özelliklerini kendi uygulamalarınızda veya CLI üzerinden kullanmak için kişisel API anahtarınızı kullanabilirsiniz.
            </p>
            <div className="form-grubu">
              <label className="form-etiketi">Gizli API Anahtarı (Secret Key)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type={apiAnahtariGoster ? "text" : "password"}
                  value={apiKey}
                  readOnly
                  className="form-girisi"
                  style={{ fontFamily: 'monospace' }}
                />
                <button type="button" className="buton buton-hayalet" onClick={() => setApiAnahtariGoster(!apiAnahtariGoster)}>
                  {apiAnahtariGoster ? 'Gizle' : 'Göster'}
                </button>
                <button type="button" className="buton buton-ikincil" onClick={apiKopyala}>
                  Kopyala
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Profil;
