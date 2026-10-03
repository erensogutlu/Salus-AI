import { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Globe,
  Camera,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  Sliders,
  Sparkles,
  RefreshCw,
  Search,
  Lock,
  Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aracCagir } from '../../servisler/apiServisi';
import YuklemeSpinner from '../../bilesenler/YuklemeSpinner';
import './GorselMetadata.css';

const ORNEK_METADATA = [
  {
    baslik: 'iPhone 15 Pro (GPS & Konum Açık)',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
    demoVeri: {
      format: 'JPEG',
      boyut_kb: 482.5,
      risk_puani: 85,
      seviye: 'Kritik',
      gps: {
        enlem: 41.0082,
        boylam: 28.9784,
        rakim: 38.5,
        mevcut: true
      },
      etiketler: {
        Make: 'Apple',
        Model: 'iPhone 15 Pro Max',
        Software: 'iOS 17.4.1',
        DateTimeOriginal: '2024:05:18 14:32:05',
        ExposureTime: 0.002,
        FNumber: 1.78,
        ISOSpeedRatings: 50,
        FocalLength: 6.86,
        ImageWidth: 4032,
        ImageHeight: 3024,
        Artist: 'Eren S.',
        UserComment: 'İstanbul Gezi Fotoğrafı'
      },
      anomaliler: [
        'Konum Sızıntısı: Görsel içerisinde tam GPS enlem/boylam koordinatları bulunuyor.'
      ]
    }
  },
  {
    baslik: 'Sony A7 IV (Profesyonel Çekim)',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    demoVeri: {
      format: 'JPEG',
      boyut_kb: 1250.0,
      risk_puani: 40,
      seviye: 'Orta',
      gps: { mevcut: false },
      etiketler: {
        Make: 'SONY',
        Model: 'ILCE-7M4',
        Software: 'Adobe Photoshop Lightroom Classic 13.0',
        DateTimeOriginal: '2024:02:10 18:45:12',
        ExposureTime: 0.004,
        FNumber: 2.8,
        ISOSpeedRatings: 200,
        FocalLength: 85.0,
        ImageWidth: 6000,
        ImageHeight: 4000,
        Copyright: 'Creative Studio 2024'
      },
      anomaliler: []
    }
  }
];

const GorselMetadata = () => {
  const [girdiModu, setGirdiModu] = useState('dosya'); // dosya | url | ornek
  const [dosya, setDosya] = useState(null);
  const [onizlemeUrl, setOnizlemeUrl] = useState(null);
  const [girdiUrl, setGirdiUrl] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);
  const [markdownRapor, setMarkdownRapor] = useState('');
  const [hata, setHata] = useState('');
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [aktifSekme, setAktifSekme] = useState('ozet'); // ozet | exif | gps | rapor
  const [aramaMetni, setAramaMetni] = useState('');
  const [temizlemeBasarili, setTemizlemeBasarili] = useState(false);

  const dosyaGirdiRef = useRef(null);

  // Dosya seçildiğinde
  const dosyaSecildi = (e) => {
    const secilenDosya = e.target.files?.[0];
    if (!secilenDosya) return;
    dosyayiHazirla(secilenDosya);
  };

  const dosyayiHazirla = (file) => {
    if (!file.type.startsWith('image/')) {
      setHata('Lütfen geçerli bir görsel dosyası seçin (JPEG, PNG, WEBP, vb.).');
      return;
    }
    setDosya(file);
    setHata('');
    setSonuc(null);
    setMarkdownRapor('');
    setTemizlemeBasarili(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOnizlemeUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Sürükle bırak olayları
  const surukleBitti = (e) => {
    e.preventDefault();
    setSurukleniyor(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      dosyayiHazirla(e.dataTransfer.files[0]);
    }
  };

  // Analizi çalıştır
  const analiziBaslat = async () => {
    setHata('');
    setYukleniyor(true);
    setSonuc(null);
    setMarkdownRapor('');

    try {
      let gonderilecekVeri = '';

      if (girdiModu === 'dosya') {
        if (!onizlemeUrl) {
          setHata('Lütfen önce bir görsel yükleyin.');
          setYukleniyor(false);
          return;
        }
        gonderilecekVeri = onizlemeUrl;
      } else if (girdiModu === 'url') {
        if (!girdiUrl.trim()) {
          setHata('Lütfen analiz edilecek görselin URL adresini girin.');
          setYukleniyor(false);
          return;
        }
        gonderilecekVeri = girdiUrl.trim();
        setOnizlemeUrl(girdiUrl.trim());
      }

      const yanit = await aracCagir('gorselMetadata', gonderilecekVeri);

      if (yanit.basarili) {
        setMarkdownRapor(yanit.sonuc);
        // İstemci tarafında hızlı görsel veri özeti oluştur
        let sonucVerisi = {
          format: dosya?.type?.split('/')[1]?.toUpperCase() || 'JPEG',
          boyut_kb: dosya ? Math.round(dosya.size / 1024) : 250,
          risk_puani: 20,
          seviye: 'Düşük',
          gps: { mevcut: false },
          etiketler: {},
          anomaliler: []
        };

        // Eğer python raporundan GPS / Make / Model bilgileri geldiyse parse et
        const md = yanit.sonuc || '';
        if (md.includes('Enlem (Latitude):') || md.includes('GPS')) {
          const latMatch = md.match(/Enlem \(Latitude\):\s*`([^`]+)`/);
          const lonMatch = md.match(/Boylam \(Longitude\):\s*`([^`]+)`/);
          if (latMatch && lonMatch) {
            sonucVerisi.gps = {
              enlem: parseFloat(latMatch[1]),
              boylam: parseFloat(lonMatch[1]),
              mevcut: true
            };
            sonucVerisi.risk_puani = 85;
            sonucVerisi.seviye = 'Kritik';
          }
        }

        if (md.includes('Cihaz Markası')) {
          const modelMatch = md.match(/Cihaz Markası \/ Modeli\*\*\s*\|\s*([^\|]+)\|/);
          if (modelMatch && modelMatch[1].trim() !== '-') {
            sonucVerisi.etiketler.Make = modelMatch[1].trim();
            if (sonucVerisi.risk_puani < 50) {
              sonucVerisi.risk_puani = 50;
              sonucVerisi.seviye = 'Orta';
            }
          }
        }

        setSonuc(sonucVerisi);
      } else {
        setHata(yanit.mesaj || 'Görsel analiz edilirken bir hata oluştu.');
      }
    } catch (err) {
      setHata(err.message || 'Sunucu ile iletişim kurulamadı.');
    } finally {
      setYukleniyor(false);
    }
  };

  // Örnek Seçimi
  const ornekSec = (ornek) => {
    setOnizlemeUrl(ornek.url);
    setSonuc(ornek.demoVeri);
    setMarkdownRapor(`### 📸 Örnek Görsel Analiz Raporu: ${ornek.baslik}\n\nAnaliz tamamlandı. Tespit edilen kamera ve konum bilgileri aşağıda listelenmiştir.`);
    setHata('');
    setTemizlemeBasarili(false);
  };

  // Metadata Temizleyici (EXIF Stripper & Güvenli İndir)
  const metadataTemizleVeIndir = () => {
    if (!onizlemeUrl) return;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `salus_temiz_${dosya?.name || 'guvenli_gorsel.jpg'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setTemizlemeBasarili(true);
        }, 'image/jpeg', 0.95);
      };
      img.src = onizlemeUrl;
    } catch (e) {
      alert('Görsel temizlenirken hata oluştu: ' + e.message);
    }
  };

  return (
    <div className="gorsel-metadata-sayfa">
      <div className="tehdit-sayfa-baslik">
        <h1>
          <span className="gradyan-metin">Görsel Metadata</span> & EXIF Analiz Aracı
        </h1>
        <p>
          Fotoğraf ve görsellerdeki gizli EXIF bilgilerini, GPS konumunu, çekim parametrelerini ve gizlilik/OSINT güvenlik risklerini analiz edin.
        </p>
      </div>

      {/* Giriş Modu Seçimi */}
      <div className="sekme-butonlar" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          className={`sekme-buton ${girdiModu === 'dosya' ? 'aktif' : ''}`}
          onClick={() => { setGirdiModu('dosya'); setHata(''); }}
        >
          <UploadCloud size={16} /> Dosya Yükle
        </button>
        <button
          className={`sekme-buton ${girdiModu === 'url' ? 'aktif' : ''}`}
          onClick={() => { setGirdiModu('url'); setHata(''); }}
        >
          <Globe size={16} /> URL ile Analiz
        </button>
        <button
          className={`sekme-buton ${girdiModu === 'ornek' ? 'aktif' : ''}`}
          onClick={() => { setGirdiModu('ornek'); setHata(''); }}
        >
          <Sparkles size={16} /> Hazır Örnekler
        </button>
      </div>

      {/* Girdi Alanı */}
      <div className="cam-kart" style={{ padding: '24px', marginBottom: '24px' }}>
        {girdiModu === 'dosya' && (
          <div>
            <input
              type="file"
              ref={dosyaGirdiRef}
              onChange={dosyaSecildi}
              accept="image/*,.heic,.tiff"
              style={{ display: 'none' }}
            />
            <div
              className={`yukleme-alani ${surukleniyor ? 'surukleniyor' : ''}`}
              onClick={() => dosyaGirdiRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setSurukleniyor(true); }}
              onDragLeave={() => setSurukleniyor(false)}
              onDrop={surukleBitti}
            >
              <UploadCloud size={44} className="yukleme-ikon" />
              <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--metin)' }}>
                {dosya ? dosya.name : 'Görseli buraya sürükleyin veya seçmek için tıklayın'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--metin-soluk)' }}>
                Desteklenen formatlar: JPEG, PNG, WEBP, TIFF, HEIC (Maksimum 15 MB)
              </div>
            </div>
          </div>
        )}

        {girdiModu === 'url' && (
          <div className="form-grubu" style={{ marginBottom: 0 }}>
            <label className="form-etiketi">Görsel URL Adresi</label>
            <div className="form-girisi-ikon">
              <Globe size={18} className="ikon" />
              <input
                type="text"
                className="form-girisi"
                placeholder="https://ornek.com/fotograf.jpg"
                value={girdiUrl}
                onChange={(e) => setGirdiUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        {girdiModu === 'ornek' && (
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--metin-soluk)', marginBottom: '12px' }}>
              EXIF ve GPS analizini denemek için aşağıdaki hazır örneklerden birini seçin:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {ORNEK_METADATA.map((o, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="buton buton-hayalet"
                  onClick={() => ornekSec(o)}
                  style={{ justifyContent: 'flex-start', textAlign: 'left', padding: '12px 14px' }}
                >
                  <Camera size={18} style={{ color: 'var(--birincil)' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.baslik}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--metin-soluk)' }}>{o.demoVeri.seviye} Gizlilik Riski</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {hata && (
          <div className="giris-hata" style={{ marginTop: '16px', marginBottom: 0 }}>
            {hata}
          </div>
        )}

        {girdiModu !== 'ornek' && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="buton buton-birincil"
              onClick={analiziBaslat}
              disabled={yukleniyor || (girdiModu === 'dosya' && !onizlemeUrl) || (girdiModu === 'url' && !girdiUrl)}
              style={{ minWidth: '180px' }}
            >
              {yukleniyor ? (
                <>
                  <span className="yukleyici yukleyici-kucuk" style={{ borderTopColor: '#000' }} />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Search size={18} /> Metadata Analiz Et
                </>
              )}
            </button>

            {onizlemeUrl && (
              <button
                type="button"
                className="buton buton-hayalet"
                onClick={() => {
                  setDosya(null);
                  setOnizlemeUrl(null);
                  setGirdiUrl('');
                  setSonuc(null);
                  setMarkdownRapor('');
                }}
              >
                <Trash2 size={16} /> Temizle
              </button>
            )}
          </div>
        )}
      </div>

      {/* Analiz Yükleniyor Durumu */}
      {yukleniyor && (
        <div style={{ margin: '40px 0' }}>
          <YuklemeSpinner metin="Görsel EXIF etiketleri, GPS verisi ve güvenlik anomalileri taranıyor..." />
        </div>
      )}

      {/* Sonuç Alanı */}
      {sonuc && !yukleniyor && (
        <div>
          {/* Risk Durum Kartı */}
          <div className={`risk-karti ${sonuc.seviye === 'Kritik' ? 'kritik' : sonuc.seviye === 'Orta' ? 'orta' : 'dusuk'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {sonuc.seviye === 'Kritik' ? (
                <AlertTriangle size={36} />
              ) : sonuc.seviye === 'Orta' ? (
                <Sliders size={36} />
              ) : (
                <Shield size={36} />
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'inherit' }}>
                  Gizlilik & OSINT Riski: {sonuc.seviye} ({sonuc.risk_puani}/100)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', opacity: 0.9 }}>
                  {sonuc.gps?.mevcut
                    ? '⚠️ KRİTİK: Bu fotoğrafta fiziksel konum (GPS koordinatları) açıkta! Paylaşılırsa konumunuz tespit edilebilir.'
                    : 'Görselde doğrudan GPS konum sızıntısı tespit edilmedi.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sekmeler */}
          <div className="sonuc-sekmeler" style={{ marginBottom: '20px' }}>
            <button
              className={`sekme-buton ${aktifSekme === 'ozet' ? 'aktif' : ''}`}
              onClick={() => setAktifSekme('ozet')}
            >
              <Eye size={16} /> Genel Özet & Kamera
            </button>
            {sonuc.gps?.mevcut && (
              <button
                className={`sekme-buton ${aktifSekme === 'gps' ? 'aktif' : ''}`}
                onClick={() => setAktifSekme('gps')}
              >
                <MapPin size={16} /> GPS & Coğrafi Konum
              </button>
            )}
            <button
              className={`sekme-buton ${aktifSekme === 'exif' ? 'aktif' : ''}`}
              onClick={() => setAktifSekme('exif')}
            >
              <Layers size={16} /> Tüm EXIF Etiketleri
            </button>
            {markdownRapor && (
              <button
                className={`sekme-buton ${aktifSekme === 'rapor' ? 'aktif' : ''}`}
                onClick={() => setAktifSekme('rapor')}
              >
                <FileCheck size={16} /> Adli Bilişim Raporu
              </button>
            )}
          </div>

          <div className="gorsel-metadata-grid">
            {/* Sol Sütun: Görsel Önizleme & Temizleme Butonu */}
            <div>
              <div className="cam-kart" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '1rem' }}>Görsel Önizleme</h4>
                {onizlemeUrl && (
                  <div className="onizleme-kapsayici">
                    <img src={onizlemeUrl} alt="Önizleme" className="onizleme-gorsel" />
                  </div>
                )}

                <div className="dosya-bilgi-cubuk">
                  <span><strong>Format:</strong> {sonuc.format || 'JPEG'}</span>
                  <span><strong>Boyut:</strong> {sonuc.boyut_kb} KB</span>
                  <span><strong>EXIF:</strong> {Object.keys(sonuc.etiketler || {}).length > 0 ? 'Mevcut' : 'Temiz'}</span>
                </div>

                {/* Metadata Temizleyici Aksiyonu */}
                <div className="temizle-buton-alani">
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--basari)', fontSize: '0.9rem' }}>
                      🛡️ EXIF Temizle & Güvenli İndir
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--metin-soluk)' }}>
                      Tüm konum ve kamera etiketlerini sıfırlayıp güvenli görseli indirin.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="buton buton-birincil"
                    onClick={metadataTemizleVeIndir}
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <Download size={16} /> Temiz Görseli İndir
                  </button>
                </div>

                {temizlemeBasarili && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--basari-acik)', color: 'var(--basari)', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}>
                    ✅ Metadata bilgileri temizlendi ve güvenli görsel bilgisayarınıza indirildi!
                  </div>
                )}
              </div>
            </div>

            {/* Sağ Sütun: Detaylı Bilgiler */}
            <div>
              {aktifSekme === 'ozet' && (
                <div className="cam-kart" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Camera size={18} style={{ color: 'var(--birincil)' }} /> Kamera & Cihaz Parametreleri
                  </h4>

                  <div className="kamera-kartlari">
                    <div className="kamera-stat">
                      <div className="kamera-stat-etiket">Cihaz Markası</div>
                      <div className="kamera-stat-deger">{sonuc.etiketler?.Make || '-'}</div>
                    </div>
                    <div className="kamera-stat">
                      <div className="kamera-stat-etiket">Model</div>
                      <div className="kamera-stat-deger">{sonuc.etiketler?.Model || '-'}</div>
                    </div>
                    <div className="kamera-stat">
                      <div className="kamera-stat-etiket">Çözünürlük</div>
                      <div className="kamera-stat-deger">
                        {sonuc.etiketler?.ImageWidth ? `${sonuc.etiketler.ImageWidth} x ${sonuc.etiketler.ImageHeight} px` : '-'}
                      </div>
                    </div>
                    <div className="kamera-stat">
                      <div className="kamera-stat-etiket">Çekim Tarihi</div>
                      <div className="kamera-stat-deger">{sonuc.etiketler?.DateTimeOriginal || sonuc.etiketler?.DateTime || '-'}</div>
                    </div>
                    <div className="kamera-stat">
                      <div className="kamera-stat-etiket">Diyafram</div>
                      <div className="kamera-stat-deger">{sonuc.etiketler?.FNumber ? `f/${sonuc.etiketler.FNumber}` : '-'}</div>
                    </div>
                    <div className="kamera-stat">
                      <div className="kamera-stat-etiket">Enstantane</div>
                      <div className="kamera-stat-deger">{sonuc.etiketler?.ExposureTime ? `${sonuc.etiketler.ExposureTime} s` : '-'}</div>
                    </div>
                    <div className="kamera-stat">
                      <div className="kamera-stat-etiket">ISO Değeri</div>
                      <div className="kamera-stat-deger">{sonuc.etiketler?.ISOSpeedRatings || '-'}</div>
                    </div>
                    <div className="kamera-stat">
                      <div className="kamera-stat-etiket">Odak Uzaklığı</div>
                      <div className="kamera-stat-deger">{sonuc.etiketler?.FocalLength ? `${sonuc.etiketler.FocalLength} mm` : '-'}</div>
                    </div>
                  </div>

                  {sonuc.etiketler?.Software && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--yuzey-secili)', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <strong>Düzenleme Yazılımı / Firmware:</strong> {sonuc.etiketler.Software}
                    </div>
                  )}
                </div>
              )}

              {aktifSekme === 'gps' && sonuc.gps?.mevcut && (
                <div className="cam-kart" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 14px', fontSize: '1rem', color: 'var(--tehlike)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} /> Coğrafi Konum (GPS Koordinatları)
                  </h4>

                  <div className="gps-harita-kutu">
                    <div className="gps-koordinatlar">
                      <div className="gps-oge">
                        <strong>Enlem (Lat):</strong> {sonuc.gps.enlem}
                      </div>
                      <div className="gps-oge">
                        <strong>Boylam (Lon):</strong> {sonuc.gps.boylam}
                      </div>
                      {sonuc.gps.rakim && (
                        <div className="gps-oge">
                          <strong>Rakım:</strong> {sonuc.gps.rakim} m
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <a
                        href={`https://www.google.com/maps?q=${sonuc.gps.enlem},${sonuc.gps.boylam}`}
                        target="_blank"
                        rel="noreferrer"
                        className="buton buton-birincil"
                        style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      >
                        <ExternalLink size={14} /> Google Maps'te Aç
                      </a>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${sonuc.gps.enlem}&mlon=${sonuc.gps.boylam}#map=16/${sonuc.gps.enlem}/${sonuc.gps.boylam}`}
                        target="_blank"
                        rel="noreferrer"
                        className="buton buton-hayalet"
                        style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      >
                        <Globe size={14} /> OpenStreetMap
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {aktifSekme === 'exif' && (
                <div className="cam-kart" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Ham EXIF Veri Tablosu</h4>
                    <div className="form-girisi-ikon" style={{ maxWidth: '220px' }}>
                      <Search size={14} className="ikon" />
                      <input
                        type="text"
                        className="form-girisi"
                        placeholder="Etiket ara..."
                        value={aramaMetni}
                        onChange={(e) => setAramaMetni(e.target.value)}
                        style={{ padding: '6px 10px 6px 30px', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  <div className="tablo-kapsayici">
                    <table className="tablo">
                      <thead>
                        <tr>
                          <th>Etiket (Tag)</th>
                          <th>Değer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(sonuc.etiketler || {})
                          .filter(([k, v]) => !aramaMetni || k.toLowerCase().includes(aramaMetni.toLowerCase()) || String(v).toLowerCase().includes(aramaMetni.toLowerCase()))
                          .map(([anahtar, deger]) => (
                            <tr key={anahtar}>
                              <td style={{ fontWeight: 600, color: 'var(--birincil)', fontSize: '0.85rem', fontFamily: 'var(--font-kod)' }}>
                                {anahtar}
                              </td>
                              <td style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                {String(deger)}
                              </td>
                            </tr>
                          ))}
                        {Object.keys(sonuc.etiketler || {}).length === 0 && (
                          <tr>
                            <td colSpan={2} style={{ textAlign: 'center', color: 'var(--metin-soluk)', padding: '20px' }}>
                              Görselde EXIF metadata etiketi bulunamadı (Temiz).
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {aktifSekme === 'rapor' && markdownRapor && (
                <div className="cam-kart markdown-icerik" style={{ padding: '24px' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdownRapor}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GorselMetadata;
