import { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  Shield,
  AlertOctagon,
  Clock,
  Server,
  AlertTriangle,
  CheckCircle,
  Globe
} from 'lucide-react';
import { tehditKayitlari, tehditKayitSil } from '../servisler/apiServisi';
import './Raporlar.css';

const Raporlar = () => {
  const [raporlar, setRaporlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [silinecekId, setSilinecekId] = useState(null);
  const [silOnayModalAcik, setSilOnayModalAcik] = useState(false);

  // raporları yükle
  const raporlariYukle = async () => {
    try {
      setYukleniyor(true);
      const yanit = await tehditKayitlari();
      if (yanit.basarili && yanit.veri) {
        // verileri formatla
        const formatli = yanit.veri.map(k => {
          let detay;
          try {
            detay = typeof k.detaylar === 'string' ? JSON.parse(k.detaylar) : k.detaylar;
          } catch (e) {
            detay = {};
          }
          
          return {
            ...k,
            detay
          };
        });
        setRaporlar(formatli);
      }
    } catch (hata) {
      console.error('Raporlar yüklenemedi:', hata);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    raporlariYukle();
  }, []);

  // rapor sil butonuna tıklandığında
  const silButonunaTiklandi = (id) => {
    setSilinecekId(id);
    setSilOnayModalAcik(true);
  };

  // rapor sil işlemini onayla
  const raporSilOnayla = async () => {
    if (!silinecekId) return;
    
    try {
      const yanit = await tehditKayitSil(silinecekId);
      if (yanit.basarili) {
        setRaporlar(onceki => onceki.filter(r => r.id !== silinecekId));
        setSilOnayModalAcik(false);
        setSilinecekId(null);
      }
    } catch (hata) {
      alert('Rapor silinirken bir hata oluştu: ' + hata.message);
    }
  };

  // modal iptal
  const modalIptal = () => {
    setSilOnayModalAcik(false);
    setSilinecekId(null);
  };

  // tarih formatlayıcı
  const tarihFormatla = (tarihString) => {
    const tarih = new Date(tarihString);
    return tarih.toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="raporlar-sayfa">
      <div className="raporlar-sayfa-baslik">
        <h1>
          <span className="gradyan-metin">Güvenlik</span> Raporları
        </h1>
        <p>Tüm analiz ve tarama geçmişiniz (Son 24 saat)</p>
      </div>

      {yukleniyor ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <span className="yukleyici" />
        </div>
      ) : raporlar.length === 0 ? (
        <div className="raporlar-bos">
          <FileText size={48} className="raporlar-bos-ikon" />
          <h3>Henüz Rapor Bulunmuyor</h3>
          <p>Tehdit Analizi veya Ağ Taraması yaparak ilk raporunuzu oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="raporlar-grid">
          {raporlar.map((rapor) => {
            const riskPuani = rapor.detay?.riskPuani || 0;
            const seviyeTuru = 
              rapor.tehdit_seviyesi === 'kritik' || rapor.tehdit_seviyesi === 'yüksek' ? 'tehlike' :
              rapor.tehdit_seviyesi === 'orta' ? 'uyari' : 'basari';

            return (
              <div key={rapor.id} className="rapor-kart cam-kart">
                <button 
                  className="rapor-sil-buton" 
                  onClick={() => silButonunaTiklandi(rapor.id)}
                  title="Raporu Sil"
                >
                  <Trash2 size={18} />
                </button>

                <div className="rapor-baslik">
                  <div>
                    <div className="rapor-hedef">
                      <Globe size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--metin-soluk)' }} />
                      {rapor.hedef}
                    </div>
                    <div className="rapor-tarih">
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {tarihFormatla(rapor.olusturulma_tarihi)}
                    </div>
                  </div>
                </div>

                <div className="rapor-istatistikler">
                  <div className="rapor-stat">
                    <div className="rapor-stat-deger" style={{ color: `var(--${seviyeTuru})` }}>
                      {riskPuani}/100
                    </div>
                    <div className="rapor-stat-etiket">Risk Puanı</div>
                  </div>
                  <div className="rapor-stat">
                    <div className="rapor-stat-deger">
                      {rapor.detay?.acikPortlar?.length || 0}
                    </div>
                    <div className="rapor-stat-etiket">Açık Port</div>
                  </div>
                  <div className="rapor-stat">
                    <div className="rapor-stat-deger" style={{ color: rapor.detay?.tesbitEdilenZafiyetler?.length > 0 ? 'var(--tehlike)' : 'var(--metin)' }}>
                      {rapor.detay?.tesbitEdilenZafiyetler?.length || 0}
                    </div>
                    <div className="rapor-stat-etiket">Zafiyet</div>
                  </div>
                </div>

                <div className="rapor-detaylar">
                  <div className="rapor-detay-baslik">
                    <AlertOctagon size={14} /> Önemli Bulgular
                  </div>
                  <ul className="rapor-detay-liste">
                    {rapor.detay?.tespitEdilen?.slice(0, 3).map((bulgu, index) => (
                      <li key={index} className="rapor-detay-oge">
                        {riskPuani >= 70 ? (
                          <AlertTriangle size={14} className="ikon" style={{ color: 'var(--tehlike)' }} />
                        ) : riskPuani >= 40 ? (
                          <AlertTriangle size={14} className="ikon" style={{ color: 'var(--uyari)' }} />
                        ) : (
                          <CheckCircle size={14} className="ikon" style={{ color: 'var(--basari)' }} />
                        )}
                        <span>{bulgu}</span>
                      </li>
                    ))}
                    {rapor.detay?.tespitEdilen?.length > 3 && (
                      <li className="rapor-detay-oge" style={{ color: 'var(--birincil)', fontSize: '0.8rem', marginTop: '4px' }}>
                        + {rapor.detay.tespitEdilen.length - 3} bulgu daha...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* silme onay modalı */}
      {silOnayModalAcik && (
        <div className="modal-arkaplan">
          <div className="cam-kart modal-icerik" style={{ padding: '32px', textAlign: 'center', maxWidth: '400px' }}>
            <AlertTriangle size={48} style={{ color: 'var(--tehlike)', margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem' }}>Raporu Sil</h3>
            <p style={{ color: 'var(--metin-soluk)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Bu raporu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={modalIptal}
                className="buton" 
                style={{ background: 'transparent', border: '1px solid var(--sinir)', color: 'var(--metin)' }}
              >
                İptal
              </button>
              <button 
                onClick={raporSilOnayla}
                className="buton" 
                style={{ background: 'var(--tehlike)', color: '#fff', border: 'none' }}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Raporlar;
