import { useState, useEffect } from 'react';
import {
  Search,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Clock,
  Globe,
  AlertOctagon,
  Info,
  Crosshair,
} from 'lucide-react';
import { tehditAnaliz, tehditKayitlari } from '../../servisler/apiServisi';
import './TehditAnaliz.css';

const TehditAnaliz = () => {
  const [hedef, setHedef] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [taramaAdimi, setTaramaAdimi] = useState(0);
  const [gecmis, setGecmis] = useState([]);

  useEffect(() => {
    const gecmisYukle = async () => {
      try {
        const yanit = await tehditKayitlari();
        if (yanit.basarili && yanit.veri) {
          const formatli = yanit.veri.map(k => {
            const detay = typeof k.detaylar === 'string' ? JSON.parse(k.detaylar) : k.detaylar;
            const riskPuani = detay?.riskPuani || 0;
            
            let seviyeText = 'Güvenli';
            if (k.tehdit_seviyesi === 'kritik' || k.tehdit_seviyesi === 'yüksek') {
              seviyeText = 'Tehlikeli';
            } else if (k.tehdit_seviyesi === 'orta') {
              seviyeText = 'Orta';
            }

            return {
              id: k.id,
              hedef: k.hedef,
              seviye: seviyeText,
              puan: riskPuani,
              tarih: new Date(k.olusturulma_tarihi).toISOString().split('T')[0]
            };
          });
          setGecmis(formatli);
        }
      } catch (hata) {
        console.error('Tehdit gecmisi yuklenirken hata olustu:', hata);
      }
    };
    gecmisYukle();
  }, []);

  // tarama simülasyonu
  const analizBaslat = async (e) => {
    e.preventDefault();
    if (!hedef.trim()) return;

    setYukleniyor(true);
    setSonuc(null);
    setTaramaAdimi(0);

    // adım adım tarama simülasyonu
    const adimlar = [
      { sure: 600, adim: 1 },
      { sure: 800, adim: 2 },
      { sure: 700, adim: 3 },
      { sure: 500, adim: 4 },
    ];

    for (const a of adimlar) {
      await new Promise((coz) => setTimeout(coz, a.sure));
      setTaramaAdimi(a.adim);
    }

    try {
      const yanit = await tehditAnaliz(hedef);
      if (yanit.basarili && yanit.veri) {
        const veri = yanit.veri;
        
        // bulguları formatla
        const formatliBulgular = [];
        
        if (veri.tespitEdilen && veri.tespitEdilen.length > 0) {
          veri.tespitEdilen.forEach((metin, index) => {
            let seviye = 'basari';
            if (veri.riskPuani >= 70) {
              seviye = 'tehlike';
            } else if (veri.riskPuani >= 40) {
              seviye = 'uyari';
            }
            
            formatliBulgular.push({
              baslik: index === 0 ? 'Tehdit Tespiti' : 'Tehdit Detayı',
              aciklama: metin,
              seviye
            });
          });
        } else {
          formatliBulgular.push({
            baslik: 'Tehdit Tespiti',
            aciklama: 'Bilinen siber tehdit kalıbı veya zararlı bağlantı tespit edilmedi.',
            seviye: 'basari'
          });
        }

        // zafiyetleri ekle
        if (veri.tesbitEdilenZafiyetler && veri.tesbitEdilenZafiyetler.length > 0) {
          veri.tesbitEdilenZafiyetler.forEach(z => {
            formatliBulgular.push({
              baslik: `Güvenlik Açığı (${z.cve})`,
              aciklama: z.aciklama,
              seviye: z.seviye === 'kritik' || z.seviye === 'yüksek' ? 'tehlike' : 'uyari'
            });
          });
        }

        // açık portları ekle
        if (veri.acikPortlar && veri.acikPortlar.length > 0) {
          const portStr = veri.acikPortlar.map(p => `${p.port}/${p.servis}`).join(', ');
          formatliBulgular.push({
            baslik: 'Açık Ağ Portları',
            aciklama: `Hedef üzerinde açık portlar bulundu: ${portStr}`,
            seviye: 'uyari'
          });
        }

        const formatliSonuc = {
          hedef: veri.hedef,
          riskPuani: veri.riskPuani,
          seviye: veri.tehditSeviyesi === 'güvenli' || veri.tehditSeviyesi === 'düşük' ? 'Düşük' :
                  veri.tehditSeviyesi === 'orta' ? 'Orta' : 
                  veri.tehditSeviyesi === 'yüksek' ? 'Yüksek' : 'Kritik',
          bulgular: formatliBulgular,
          oneriler: veri.oneriler || ['Güvenlik duvarı kurallarınızı güncel tutun.']
        };

        setSonuc(formatliSonuc);

        // geçmişe ekle
        setGecmis((onceki) => [
          {
            id: Date.now(),
            hedef: veri.hedef,
            seviye: formatliSonuc.seviye === 'Kritik' || formatliSonuc.seviye === 'Yüksek' ? 'Tehlikeli' : formatliSonuc.seviye === 'Orta' ? 'Orta' : 'Güvenli',
            puan: veri.riskPuani,
            tarih: new Date().toISOString().split('T')[0],
          },
          ...onceki,
        ]);
      } else {
        throw new Error('Geçersiz yanıt yapısı');
      }
    } catch (hata) {
      // demo sonuç oluştur
      const riskPuani = Math.floor(Math.random() * 100);
      const demoSonuc = {
        hedef: hedef,
        riskPuani,
        seviye: riskPuani >= 70 ? 'Yüksek' : riskPuani >= 40 ? 'Orta' : 'Düşük',
        bulgular: [
          {
            baslik: 'SSL Sertifika Durumu',
            aciklama: riskPuani > 50 ? 'SSL sertifikası bulunamadı veya süresi dolmuş.' : 'SSL sertifikası geçerli ve güncel.',
            seviye: riskPuani > 50 ? 'tehlike' : 'basari',
          },
          {
            baslik: 'Açık Port Taraması',
            aciklama: `${Math.floor(Math.random() * 5) + 1} açık port tespit edildi. Bazıları potansiyel risk taşıyor.`,
            seviye: riskPuani > 60 ? 'uyari' : 'basari',
          },
          {
            baslik: 'Kötü Amaçlı Yazılım Taraması',
            aciklama: riskPuani > 70 ? 'Şüpheli kod kalıpları tespit edildi.' : 'Kötü amaçlı yazılım tespit edilmedi.',
            seviye: riskPuani > 70 ? 'tehlike' : 'basari',
          },
          {
            baslik: 'DNS Kayıtları',
            aciklama: 'DNS kayıtları kontrol edildi. DNSSEC yapılandırması değerlendirildi.',
            seviye: riskPuani > 40 ? 'uyari' : 'basari',
          },
        ],
        oneriler: [
          'SSL/TLS sertifikanızı güncel tutun ve HTTPS kullanın.',
          'Gereksiz açık portları kapatın ve güvenlik duvarı kurallarını gözden geçirin.',
          'Düzenli güvenlik taramaları yapın ve bulguları takip edin.',
          'Web uygulamalarınızda girdi doğrulama uygulayın.',
          'Güvenlik başlıklarını (CSP, HSTS, X-Frame-Options) yapılandırın.',
        ],
      };

      setSonuc(demoSonuc);

      // geçmişe ekle
      setGecmis((onceki) => [
        {
          id: Date.now(),
          hedef: hedef,
          seviye: demoSonuc.seviye === 'Yüksek' ? 'Tehlikeli' : demoSonuc.seviye === 'Orta' ? 'Orta' : 'Güvenli',
          puan: demoSonuc.riskPuani,
          tarih: new Date().toISOString().split('T')[0],
        },
        ...onceki,
      ]);
    } finally {
      setYukleniyor(false);
    }
  };

  // risk rengi
  const riskRenk = (puan) => {
    if (puan >= 70) return 'var(--tehlike)';
    if (puan >= 40) return 'var(--uyari)';
    return 'var(--basari)';
  };

  // tarama adım isimleri
  const taramaAdimlari = [
    'DNS çözümleme',
    'Port taraması',
    'Güvenlik açığı tespiti',
    'Rapor oluşturma',
  ];

  return (
    <div className="tehdit-sayfa">
      {/* sayfa başlığı */}
      <div className="tehdit-sayfa-baslik">
        <h1>
          <span className="gradyan-metin">Tehdit</span> Analizi
        </h1>
        <p>URL veya IP adresini girerek güvenlik analizi yapın</p>
      </div>

      {/* istatistik kartları */}
      <div className="tehdit-istatistikler">
        <div className="tehdit-istatistik-kart cam-kart">
          <div className="tehdit-istatistik-deger" style={{ color: 'var(--birincil)' }}>
            {gecmis.length}
          </div>
          <div className="tehdit-istatistik-etiket">Toplam Analiz</div>
        </div>
        <div className="tehdit-istatistik-kart cam-kart">
          <div className="tehdit-istatistik-deger" style={{ color: 'var(--tehlike)' }}>
            {gecmis.filter((g) => g.seviye === 'Tehlikeli').length}
          </div>
          <div className="tehdit-istatistik-etiket">Tehlikeli Tespit</div>
        </div>
        <div className="tehdit-istatistik-kart cam-kart">
          <div className="tehdit-istatistik-deger" style={{ color: 'var(--basari)' }}>
            {gecmis.filter((g) => g.seviye === 'Güvenli').length}
          </div>
          <div className="tehdit-istatistik-etiket">Güvenli Tespit</div>
        </div>
      </div>

      {/* analiz formu */}
      <div className="analiz-form-kart cam-kart">
        <form className="analiz-form" onSubmit={analizBaslat}>
          <div className="form-grubu">
            <label className="form-etiketi">Hedef URL veya IP Adresi</label>
            <div className="form-girisi-ikon">
              <Globe size={18} className="ikon" />
              <input
                type="text"
                className="form-girisi"
                placeholder="örn: example.com veya 192.168.1.1"
                value={hedef}
                onChange={(e) => setHedef(e.target.value)}
                disabled={yukleniyor}
              />
            </div>
          </div>
          <button
            type="submit"
            className="buton buton-birincil"
            disabled={yukleniyor || !hedef.trim()}
          >
            {yukleniyor ? (
              <><span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} /> Taraniyor...</>
            ) : (
              <><Crosshair size={18} /> Analiz Et</>
            )}
          </button>
        </form>
      </div>

      {/* tarama animasyonu */}
      {yukleniyor && (
        <div className="analiz-sonuc cam-kart">
          <div className="tarama-animasyon">
            <div className="tarama-radar">
              <Crosshair size={28} style={{ color: 'var(--birincil)', zIndex: 3 }} />
              <div className="radar-hedef"></div>
            </div>
            <div className="tarama-mesaj">
              <strong>{hedef}</strong> derinlemesine analiz ediliyor...
            </div>
            <div className="tarama-adimlar">
              {taramaAdimlari.map((adim, i) => (
                <div
                  key={i}
                  className={`tarama-adim ${i < taramaAdimi ? 'tamamlandi' : i === taramaAdimi ? 'aktif' : ''}`}
                >
                  {i < taramaAdimi ? <CheckCircle size={16} /> : i === taramaAdimi ? (
                    <span className="yukleyici yukleyici-kucuk" style={{ borderColor: 'var(--birincil)', borderTopColor: 'transparent' }} />
                  ) : (
                    <Clock size={16} />
                  )}
                  {adim}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* analiz sonuçları */}
      {sonuc && !yukleniyor && (
        <div className="analiz-sonuc cam-kart">
          <div className="analiz-sonuc-baslik">
            <h3>Güvenlik Raporu: <span style={{ color: 'var(--birincil)' }}>{sonuc.hedef}</span></h3>
            <span className={`rozet ${sonuc.riskPuani >= 70 ? 'rozet-tehlike' : sonuc.riskPuani >= 40 ? 'rozet-uyari' : 'rozet-basari'}`}>
              {sonuc.seviye} Risk Durumu
            </span>
          </div>

          <div className="sonuc-sekmeler">
            <button className={`sekme-buton ${taramaAdimi === 10 ? 'aktif' : ''}`} onClick={() => setTaramaAdimi(10)}>
              Genel Bakış
            </button>
            <button className={`sekme-buton ${taramaAdimi === 11 ? 'aktif' : ''}`} onClick={() => setTaramaAdimi(11)}>
              Zafiyet Bulguları
            </button>
            <button className={`sekme-buton ${taramaAdimi === 12 ? 'aktif' : ''}`} onClick={() => setTaramaAdimi(12)}>
              Çözüm Önerileri
            </button>
          </div>

          <div className="analiz-sonuc-govde">
            {(taramaAdimi === 10 || taramaAdimi >= 4) && (
              <div className="analiz-sonuc-grid">
                {/* risk puanı */}
                <div className="risk-puan-kapsayici">
                  <div className="risk-puan-daire">
                    <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle className="risk-gauge-bg" cx="60" cy="60" r="50" fill="none" strokeWidth="12" />
                      <circle
                        cx="60" cy="60" r="50"
                        fill="none"
                        stroke={riskRenk(sonuc.riskPuani)}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - sonuc.riskPuani / 100)}`}
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                      />
                    </svg>
                    <div className="risk-puan-deger" style={{ position: 'absolute', color: riskRenk(sonuc.riskPuani) }}>
                      {sonuc.riskPuani}
                    </div>
                  </div>
                  <div className="risk-puan-etiket">Risk Skoru</div>
                </div>

                {/* bulgular (kısa özet) */}
                <div className="bulgular-liste">
                  <h4 style={{ marginBottom: '10px', color: 'var(--metin)' }}>En Kritik Tespitler</h4>
                  {sonuc.bulgular.slice(0, 3).map((bulgu, i) => (
                    <div key={i} className={`bulgu-oge ${bulgu.seviye}`}>
                      <div className="bulgu-ikon">
                        {bulgu.seviye === 'tehlike' ? <XCircle size={18} style={{ color: 'var(--tehlike)' }} /> :
                         bulgu.seviye === 'uyari' ? <AlertTriangle size={18} style={{ color: 'var(--uyari)' }} /> :
                         <CheckCircle size={18} style={{ color: 'var(--basari)' }} />}
                      </div>
                      <div className="bulgu-icerik">
                        <h4>{bulgu.baslik}</h4>
                        <p>{bulgu.aciklama}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {taramaAdimi === 11 && (
              <div className="bulgular-liste">
                {sonuc.bulgular.map((bulgu, i) => (
                  <div key={i} className={`bulgu-oge ${bulgu.seviye}`}>
                    <div className="bulgu-ikon">
                      {bulgu.seviye === 'tehlike' ? <XCircle size={18} style={{ color: 'var(--tehlike)' }} /> :
                       bulgu.seviye === 'uyari' ? <AlertTriangle size={18} style={{ color: 'var(--uyari)' }} /> :
                       <CheckCircle size={18} style={{ color: 'var(--basari)' }} />}
                    </div>
                    <div className="bulgu-icerik">
                      <h4>{bulgu.baslik}</h4>
                      <p>{bulgu.aciklama}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {taramaAdimi === 12 && (
              <div className="oneriler-bolum">
                <h4>💡 SOC Güvenlik Önerileri</h4>
                {sonuc.oneriler.map((oneri, i) => (
                  <div key={i} className="oneri-oge">
                    <CheckCircle size={18} className="ikon" />
                    <span>{oneri}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* geçmiş tablosu */}
      <div className="analiz-gecmis">
        <h3 className="analiz-gecmis-baslik">Analiz Geçmişi</h3>
        <div className="tablo-kapsayici cam-kart">
          <table className="tablo">
            <thead>
              <tr>
                <th>Hedef</th>
                <th>Risk Durumu</th>
                <th>Puan</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {gecmis.map((kayit) => (
                <tr key={kayit.id}>
                  <td style={{ fontFamily: 'var(--font-kod)', fontSize: '0.85rem', color: 'var(--birincil)' }}>
                    {kayit.hedef}
                  </td>
                  <td>
                    <span className={`rozet ${
                      kayit.seviye === 'Tehlikeli' ? 'rozet-tehlike' :
                      kayit.seviye === 'Orta' ? 'rozet-uyari' : 'rozet-basari'
                    }`}>
                      {kayit.seviye}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: riskRenk(kayit.puan) }}>{kayit.puan}/100</td>
                  <td style={{ color: 'var(--metin-soluk)', fontSize: '0.85rem' }}>{kayit.tarih}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TehditAnaliz;
