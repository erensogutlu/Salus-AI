import { ShieldAlert } from 'lucide-react';

const tarihBicimlendir = (tarihStr) => {
  if (!tarihStr) return '-';
  const tarih = new Date(tarihStr);
  return tarih.toLocaleString('tr-TR');
};

const SiberGuvenlikLoglari = ({ sonGuvenlikOlaylari }) => {
  return (
    <div className="cam-kart guvenlik-loglari-kart" style={{ marginTop: '25px', padding: '20px' }}>
      <div className="guvenlik-log-baslik" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <ShieldAlert size={20} style={{ color: 'var(--tehlike)' }} />
        <h3 style={{ color: '#fff', margin: 0 }}>Siber Güvenlik Denetim Günlükleri (Audit Logs)</h3>
      </div>
      
      <div className="tablo-kapsayici">
        <table className="tablo">
          <thead>
            <tr>
              <th>Olay Tipi</th>
              <th>Yapan Kullanıcı</th>
              <th>IP Adresi</th>
              <th>Hedef</th>
              <th>Detay</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {sonGuvenlikOlaylari && sonGuvenlikOlaylari.length > 0 ? (
              sonGuvenlikOlaylari.map((log) => {
                let rozetSinifi = 'rozet-bilgi';
                let olayEtiketi = log.olay_tipi;
                
                if (log.olay_tipi === 'failed_login' || log.olay_tipi === 'unauthorized_access_attempt' || log.olay_tipi === 'admin_user_delete' || log.olay_tipi === 'user_delete') {
                  rozetSinifi = 'rozet-tehlike';
                } else if (log.olay_tipi === 'password_change' || log.olay_tipi === 'admin_user_update') {
                  rozetSinifi = 'rozet-uyari';
                } else if (log.olay_tipi === 'user_register' || log.olay_tipi === 'successful_login') {
                  rozetSinifi = 'rozet-basari';
                }
                
                const etiketler = {
                  'failed_login': 'Hatalı Giriş',
                  'successful_login': 'Başarılı Giriş',
                  'user_register': 'Yeni Kayıt',
                  'password_change': 'Şifre Değişimi',
                  'user_delete': 'Hesap Silme',
                  'admin_user_update': 'Admin Edit',
                  'admin_user_delete': 'Admin Silme',
                  'unauthorized_access_attempt': 'Yetkisiz Erişim'
                };
                olayEtiketi = etiketler[log.olay_tipi] || log.olay_tipi;

                return (
                  <tr key={log.id}>
                    <td>
                      <span className={`rozet ${rozetSinifi}`}>
                        {olayEtiketi}
                      </span>
                    </td>
                    <td>{log.yapan_kullanici || <span className="soluk-metin">Bilinmeyen</span>}</td>
                    <td className="tarih-td">{log.ip_adresi || '0.0.0.0'}</td>
                    <td>{log.hedef || <span className="soluk-metin">-</span>}</td>
                    <td style={{ color: 'var(--metin-soluk)' }}>{log.detay}</td>
                    <td className="tarih-td">{tarihBicimlendir(log.olusturulma_tarihi)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--metin-soluk)' }}>
                  Herhangi bir güvenlik olayı kaydedilmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SiberGuvenlikLoglari;
