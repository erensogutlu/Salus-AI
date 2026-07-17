import { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  Database,
  Cpu,
  Clock,
  Trash2,
  Edit2,
  Search,
  AlertCircle,
  CheckCircle,
  Server,
  UserCheck,
  X,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { useYetkilendirme } from '../baglam/YetkilendirmeBaglami';
import {
  yonetimKullanicilariListele,
  yonetimKullaniciGuncelle,
  yonetimKullaniciSil,
  yonetimSistemSagligi
} from '../servisler/apiServisi';
import YuklemeSpinner from '../bilesenler/YuklemeSpinner';
import SiberGuvenlikLoglari from '../bilesenler/SiberGuvenlikLoglari';
import './YoneticiPaneli.css';

const YoneticiPaneli = () => {
  const { kullanici: girisYapanKullanici } = useYetkilendirme();
  const [aktifSekme, setAktifSekme] = useState('kullanicilar'); // 'kullanicilar' veya 'saglik'
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [sistemSaglik, setSistemSaglik] = useState(null);
  const [aramaSorgusu, setAramaSorgusu] = useState('');

  // bildirimler
  const [mesaj, setMesaj] = useState(null); // { tip: 'basari' | 'hata', metin: '' }

  // modal state
  const [duzenlenenKullanici, setDuzenlenenKullanici] = useState(null);
  const [modalForm, setModalForm] = useState({
    kullanici_adi: '',
    eposta: '',
    tam_ad: '',
    rol: 'kullanici'
  });

  // verileri yukle
  const verileriYukle = async () => {
    setYukleniyor(true);
    try {
      if (aktifSekme === 'kullanicilar') {
        const yanit = await yonetimKullanicilariListele();
        if (yanit.basarili) {
          setKullanicilar(yanit.kullanicilar);
        }
      } else {
        const yanit = await yonetimSistemSagligi();
        if (yanit.basarili) {
          setSistemSaglik(yanit.saglik);
        }
      }
    } catch (hata) {
      bildirimGoster('hata', hata.message || 'Veriler yüklenirken hata oluştu');
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    verileriYukle();
  }, [aktifSekme]);

  // bildirim goster
  const bildirimGoster = (tip, metin) => {
    setMesaj({ tip, metin });
    setTimeout(() => {
      setMesaj(null);
    }, 4000);
  };

  // arama filtreleme
  const filtrelenmisKullanicilar = kullanicilar.filter(k =>
    k.kullanici_adi?.toLowerCase().includes(aramaSorgusu.toLowerCase()) ||
    k.eposta?.toLowerCase().includes(aramaSorgusu.toLowerCase()) ||
    k.tam_ad?.toLowerCase().includes(aramaSorgusu.toLowerCase()) ||
    k.rol?.toLowerCase().includes(aramaSorgusu.toLowerCase())
  );

  // kullanici sil
  const kullaniciSil = async (id, adi) => {
    if (id === girisYapanKullanici?.id) {
      bildirimGoster('hata', 'Kendi hesabınızı silemezsiniz!');
      return;
    }

    if (window.confirm(`"${adi}" adlı kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      setIslemYapiliyor(true);
      try {
        const yanit = await yonetimKullaniciSil(id);
        if (yanit.basarili) {
          bildirimGoster('basari', 'Kullanıcı başarıyla silindi.');
          setKullanicilar(kullanicilar.filter(k => k.id !== id));
        }
      } catch (hata) {
        bildirimGoster('hata', hata.message || 'Kullanıcı silinirken hata oluştu');
      } finally {
        setIslemYapiliyor(false);
      }
    }
  };

  // modal ac
  const duzenlemeModaliniAc = (k) => {
    setDuzenlenenKullanici(k);
    setModalForm({
      kullanici_adi: k.kullanici_adi || '',
      eposta: k.eposta || '',
      tam_ad: k.tam_ad || '',
      rol: k.rol || 'kullanici'
    });
  };

  // kullanici guncelle
  const kullaniciGuncelle = async (e) => {
    e.preventDefault();
    if (!duzenlenenKullanici) return;

    setIslemYapiliyor(true);
    try {
      const yanit = await yonetimKullaniciGuncelle(duzenlenenKullanici.id, modalForm);
      if (yanit.basarili) {
        bildirimGoster('basari', 'Kullanıcı başarıyla güncellendi.');
        // listeyi güncelle
        setKullanicilar(kullanicilar.map(k =>
          k.id === duzenlenenKullanici.id ? { ...k, ...modalForm } : k
        ));
        setDuzenlenenKullanici(null); // modali kapat
      }
    } catch (hata) {
      bildirimGoster('hata', hata.message || 'Kullanıcı güncellenirken hata oluştu');
    } finally {
      setIslemYapiliyor(false);
    }
  };

  // tarih formatla
  const tarihBicimlendir = (tarihStr) => {
    if (!tarihStr) return 'Giriş Yapılmadı';
    const tarih = new Date(tarihStr);
    return tarih.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // uptime formatla
  const uptimeBicimlendir = (saniye) => {
    if (!saniye) return '0sn';
    const gun = Math.floor(saniye / (3600 * 24));
    const saat = Math.floor((saniye % (3600 * 24)) / 3600);
    const dakika = Math.floor((saniye % 3600) / 60);
    const sn = Math.floor(saniye % 60);

    let sonuc = '';
    if (gun > 0) sonuc += `${gun}g `;
    if (saat > 0) sonuc += `${saat}s `;
    if (dakika > 0) sonuc += `${dakika}dk `;
    sonuc += `${sn}sn`;
    return sonuc;
  };

  return (
    <div className="yonetici-sayfa sayfa-gecisi">
      {/* bildirim toast */}
      {mesaj && (
        <div className={`bildirim bildirim-${mesaj.tip}`}>
          {mesaj.tip === 'basari' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{mesaj.metin}</span>
        </div>
      )}

      {/* karsilama */}
      <div className="yonetici-karsilama">
        <div className="karsilama-sol">
          <h1>
            Yönetici <span className="gradyan-metin">Komuta Merkezi</span>
          </h1>
          <p>Sistem sağlığı, aktif servisler ve kullanıcı rolleri yönetimi paneli.</p>
        </div>
        <button className="buton buton-hayalet yenile-buton" onClick={verileriYukle} disabled={yukleniyor}>
          <RefreshCw size={16} className={yukleniyor ? 'dönen-ikon' : ''} />
          {yukleniyor ? 'Yükleniyor...' : 'Verileri Yenile'}
        </button>
      </div>

      {/* sekmeler */}
      <div className="yonetici-sekmeler">
        <button
          className={`sekme-buton ${aktifSekme === 'kullanicilar' ? 'aktif' : ''}`}
          onClick={() => setAktifSekme('kullanicilar')}
        >
          <Users size={18} />
          Kullanıcı Yönetimi ({kullanicilar.length})
        </button>
        <button
          className={`sekme-buton ${aktifSekme === 'saglik' ? 'aktif' : ''}`}
          onClick={() => setAktifSekme('saglik')}
        >
          <Activity size={18} />
          Sistem Sağlığı & Metrikler
        </button>
      </div>

      {/* ana icerik */}
      {yukleniyor ? (
        <div className="yonetici-yukleniyor-kapsayici">
          <YuklemeSpinner boyut="buyuk" metin="Veriler getiriliyor..." />
        </div>
      ) : (
        <div className="yonetici-sekme-icerik">
          {aktifSekme === 'kullanicilar' ? (
            /* kullanıcı yönetimi */
            <div className="kullanici-yonetim-alani">
              {/* arama bari */}
              <div className="arama-filtre-bar cam-kart">
                <div className="form-girisi-ikon w-full">
                  <Search size={18} className="ikon" />
                  <input
                    type="text"
                    className="form-girisi"
                    placeholder="Kullanıcı adı, e-posta, isim veya rol ile ara..."
                    value={aramaSorgusu}
                    onChange={(e) => setAramaSorgusu(e.target.value)}
                  />
                </div>
              </div>

              {/* kullanicilar tablosu */}
              <div className="tablo-kapsayici cam-kart">
                <table className="tablo">
                  <thead>
                    <tr>
                      <th>Profil</th>
                      <th>Kullanıcı Adı</th>
                      <th>E-Posta</th>
                      <th>Adı Soyadı</th>
                      <th>Rol</th>
                      <th>Kayıt Tarihi</th>
                      <th>Son Giriş</th>
                      <th style={{ textAlignment: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrelenmisKullanicilar.length > 0 ? (
                      filtrelenmisKullanicilar.map((k) => (
                        <tr key={k.id} className={k.id === girisYapanKullanici?.id ? 'kendi-satiri' : ''}>
                          <td>
                            {k.profil_resmi ? (
                              <img src={k.profil_resmi} alt="Profil" className="tablo-avatar" />
                            ) : (
                              <div className="tablo-avatar tablo-avatar-placeholder">
                                {(k.tam_ad || k.kullanici_adi || 'K').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="kullanici-adi-metin">{k.kullanici_adi}</span>
                            {k.id === girisYapanKullanici?.id && <span className="aktif-kullanici-etiket">Siz</span>}
                          </td>
                          <td>{k.eposta}</td>
                          <td>{k.tam_ad || <span className="soluk-metin">Belirtilmemiş</span>}</td>
                          <td>
                            <span className={`rozet ${k.rol === 'admin' ? 'rozet-tehlike' : 'rozet-bilgi'}`}>
                              {k.rol === 'admin' ? 'Admin' : 'Kullanıcı'}
                            </span>
                          </td>
                          <td className="tarih-td">{tarihBicimlendir(k.olusturulma_tarihi)}</td>
                          <td className="tarih-td">{tarihBicimlendir(k.son_giris)}</td>
                          <td>
                            <div className="islem-butonlar">
                              <button
                                className="islem-buton duzenle"
                                title="Düzenle"
                                onClick={() => duzenlemeModaliniAc(k)}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="islem-buton sil"
                                title="Sil"
                                disabled={k.id === girisYapanKullanici?.id || islemYapiliyor}
                                onClick={() => kullaniciSil(k.id, k.kullanici_adi)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--metin-soluk)' }}>
                          Herhangi bir kullanıcı kaydı bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* sistem sağlığı & metrikler */
            <div className="sistem-sagligi-alani">
              {sistemSaglik ? (
                <>
                  {/* durum kartlari */}
                  <div className="yonetici-istatistik-grid">
                    <div className="istatistik-kart cam-kart">
                      <div className="istatistik-kart-ikon birincil">
                        <Users size={22} />
                      </div>
                      <div className="istatistik-kart-bilgi">
                        <div className="istatistik-kart-deger">{sistemSaglik.istatistikler.toplamKullanici}</div>
                        <div className="istatistik-kart-etiket">Kayıtlı Kullanıcı Sayısı</div>
                      </div>
                    </div>

                    <div className="istatistik-kart cam-kart">
                      <div className="istatistik-kart-ikon uyari">
                        <ShieldAlert size={22} />
                      </div>
                      <div className="istatistik-kart-bilgi">
                        <div className="istatistik-kart-deger">{sistemSaglik.istatistikler.toplamTehdit}</div>
                        <div className="istatistik-kart-etiket">Taranan Toplam Tehdit</div>
                      </div>
                    </div>

                    <div className="istatistik-kart cam-kart">
                      <div className="istatistik-kart-ikon ikincil">
                        <Activity size={22} />
                      </div>
                      <div className="istatistik-kart-bilgi">
                        <div className="istatistik-kart-deger">{sistemSaglik.istatistikler.toplamTarama}</div>
                        <div className="istatistik-kart-etiket">Yapılan IP/Ağ Taraması</div>
                      </div>
                    </div>

                    <div className="istatistik-kart cam-kart">
                      <div className="istatistik-kart-ikon basari">
                        <UserCheck size={22} />
                      </div>
                      <div className="istatistik-kart-bilgi">
                        <div className="istatistik-kart-deger">{sistemSaglik.istatistikler.toplamSohbet}</div>
                        <div className="istatistik-kart-etiket">AI Sohbet Kayıt Sayısı</div>
                      </div>
                    </div>
                  </div>

                  {/* servisler ve kaynaklar */}
                  <div className="sistem-detay-grid">
                    {/* altyapi ve veritabanlari */}
                    <div className="cam-kart servis-kartlari">
                      <h3>Bağlantılar ve Servis Durumları</h3>
                      <div className="servis-listesi">
                        {/* postgresql */}
                        <div className="servis-satir">
                          <div className="servis-bilgi">
                            <Database size={20} className="servis-ikon database-renk" />
                            <div>
                              <div className="servis-ad">PostgreSQL Veritabanı</div>
                              <div className="servis-aciklama">İşlem havuzu (Knex Pool) aktif durumda</div>
                            </div>
                          </div>
                          <span className={`rozet ${sistemSaglik.veritabani.durum === 'aktif' ? 'rozet-basari' : 'rozet-tehlike'}`}>
                            {sistemSaglik.veritabani.durum === 'aktif' ? 'BAĞLI' : 'ÇEVRİMDIŞI'}
                          </span>
                        </div>

                        {/* redis */}
                        <div className="servis-satir">
                          <div className="servis-bilgi">
                            <HardDrive size={20} className="servis-ikon cache-renk" />
                            <div>
                              <div className="servis-ad">Önbellek (Cache) Katmanı</div>
                              <div className="servis-aciklama">Aktif Yöntem: {sistemSaglik.onbellek.tip}</div>
                            </div>
                          </div>
                          <span className={`rozet ${sistemSaglik.onbellek.aktif ? 'rozet-basari' : 'rozet-uyari'}`}>
                            {sistemSaglik.onbellek.aktif ? 'REDIS READY' : 'FALLBACK AKTİF'}
                          </span>
                        </div>

                        {/* isletim sistemi */}
                        <div className="servis-satir">
                          <div className="servis-bilgi">
                            <Server size={20} className="servis-ikon server-renk" />
                            <div>
                              <div className="servis-ad">İşletim Sistemi Platformu</div>
                              <div className="servis-aciklama">{sistemSaglik.isletimSistemi}</div>
                            </div>
                          </div>
                        </div>

                        {/* node surumu */}
                        <div className="servis-satir">
                          <div className="servis-bilgi">
                            <Cpu size={20} className="servis-ikon node-renk" />
                            <div>
                              <div className="servis-ad">Çalışma Ortamı & Node.js</div>
                              <div className="servis-aciklama">Node runtime versiyonu: {sistemSaglik.nodeSurumu}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* sistem kaynaklari */}
                    <div className="cam-kart kaynak-kullanimi">
                      <h3>Sunucu Kaynak Kullanımı</h3>
                      <div className="kaynak-istatistikleri">
                        {/* cpu model */}
                        <div className="kaynak-oge">
                          <div className="kaynak-etiket">Sunucu İşlemcisi</div>
                          <div className="kaynak-deger">{sistemSaglik.cpuModel} ({sistemSaglik.cpuCekirdekSayisi} Çekirdek)</div>
                        </div>

                        {/* cpu yuk */}
                        <div className="kaynak-oge">
                          <div className="kaynak-etiket">Ortalama CPU Yükü (1 / 5 / 15 dk)</div>
                          <div className="kaynak-load-bar">
                            <span className="load-deger">{sistemSaglik.cpuLoad1Min}</span>
                            <span className="load-ayrac">/</span>
                            <span className="load-deger">{sistemSaglik.cpuLoad5Min}</span>
                            <span className="load-ayrac">/</span>
                            <span className="load-deger">{sistemSaglik.cpuLoad15Min}</span>
                          </div>
                        </div>

                        {/* ram */}
                        <div className="kaynak-oge">
                          <div className="kaynak-baslik-alan">
                            <span className="kaynak-etiket">Sistem Belleği (RAM) Kullanımı</span>
                            <span className="kaynak-bellek-deger">{sistemSaglik.bellek.kullanilan} / {sistemSaglik.bellek.toplam} ({sistemSaglik.bellek.yuzde}%)</span>
                          </div>
                          <div className="kaynak-bar">
                            <div
                              className="kaynak-bar-dolgu"
                              style={{
                                width: `${sistemSaglik.bellek.yuzde}%`,
                                backgroundColor: sistemSaglik.bellek.yuzde > 80 ? 'var(--tehlike)' : sistemSaglik.bellek.yuzde > 50 ? 'var(--uyari)' : 'var(--basari)'
                              }}
                            />
                          </div>
                          <div className="kaynak-bar-bilgi">Boş Bellek: {sistemSaglik.bellek.bos}</div>
                        </div>

                        {/* uptime */}
                        <div className="kaynak-oge" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                          <div className="uptime-grid">
                            <div className="uptime-kutu">
                              <Clock size={16} />
                              <div>
                                <div className="uptime-etiket">Sunucu Çalışma Süresi</div>
                                <div className="uptime-deger">{uptimeBicimlendir(sistemSaglik.sunucuUptime)}</div>
                              </div>
                            </div>
                            <div className="uptime-kutu">
                              <Server size={16} />
                              <div>
                                <div className="uptime-etiket">Makine Çalışma Süresi</div>
                                <div className="uptime-deger">{uptimeBicimlendir(sistemSaglik.uptime)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* siber guvenlik audit loglari */}
                  <SiberGuvenlikLoglari sonGuvenlikOlaylari={sistemSaglik.sonGuvenlikOlaylari} />
                </>
              ) : (
                <div className="sistem-bos-mesaj cam-kart">
                  Sistem sağlığı verileri yüklenemedi. Sunucu bağlantısını veya günlükleri kontrol edin.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* duzenleme modali */}
      {duzenlenenKullanici && (
        <div className="yonetici-modal-arka">
          <div className="yonetici-modal cam-kart-parlak animasyon-yukari">
            <div className="modal-baslik">
              <h3>Kullanıcı Profilini Düzenle</h3>
              <button className="modal-kapat" onClick={() => setDuzenlenenKullanici(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={kullaniciGuncelle} className="modal-form">
              <div className="form-grubu">
                <label className="form-etiketi">Kullanıcı Adı</label>
                <input
                  type="text"
                  required
                  className="form-girisi"
                  value={modalForm.kullanici_adi}
                  onChange={(e) => setModalForm({ ...modalForm, kullanici_adi: e.target.value })}
                />
              </div>

              <div className="form-grubu">
                <label className="form-etiketi">E-Posta Adresi</label>
                <input
                  type="email"
                  required
                  className="form-girisi"
                  value={modalForm.eposta}
                  onChange={(e) => setModalForm({ ...modalForm, eposta: e.target.value })}
                />
              </div>

              <div className="form-grubu">
                <label className="form-etiketi">Adı Soyadı</label>
                <input
                  type="text"
                  className="form-girisi"
                  placeholder="Belirtilmemiş"
                  value={modalForm.tam_ad}
                  onChange={(e) => setModalForm({ ...modalForm, tam_ad: e.target.value })}
                />
              </div>

              <div className="form-grubu">
                <label className="form-etiketi">Sistem Yetki Rolü</label>
                <select
                  className="form-girisi select-rol"
                  value={modalForm.rol}
                  onChange={(e) => setModalForm({ ...modalForm, rol: e.target.value })}
                >
                  <option value="kullanici">Normal Kullanıcı (kullanici)</option>
                  <option value="admin">Sistem Yöneticisi (admin)</option>
                </select>
              </div>

              <div className="modal-aksiyonlar">
                <button
                  type="button"
                  className="buton buton-hayalet"
                  onClick={() => setDuzenlenenKullanici(null)}
                  disabled={islemYapiliyor}
                >
                  İptal Et
                </button>
                <button
                  type="submit"
                  className="buton buton-birincil"
                  disabled={islemYapiliyor}
                >
                  {islemYapiliyor ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default YoneticiPaneli;
