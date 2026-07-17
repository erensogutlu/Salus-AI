const { knex } = require('../yapilandirma/veritabani');
const { guvenlikKaydet } = require('./guvenlikAraci');

const adminYetkisiAraci = async (istek, yanit, sonraki) => {
  try {
    // oturum kontrolü
    if (!istek.kullanici || !istek.kullanici.kullanici_id) {
      return yanit.status(401).json({
        basarili: false,
        mesaj: 'yetkilendirme hatası: oturum açılmamış'
      });
    }

    const kullaniciId = istek.kullanici.kullanici_id;
    const kullanici = await knex('kullanicilar').where({ id: kullaniciId }).first();

    if (kullanici && kullanici.rol === 'admin') {
      // rol bilgisini ekle
      istek.kullanici.rol = kullanici.rol;
      sonraki();
    } else {
      const ip = istek.ip || istek.headers['x-forwarded-for'] || istek.socket.remoteAddress;
      // yetkisiz erisim denemesi
      await guvenlikKaydet(kullaniciId, 'unauthorized_access_attempt', istek.originalUrl, 'admin olmayan kullanıcı yetkili sayfaya erişmeye çalıştı', ip);

      return yanit.status(403).json({
        basarili: false,
        mesaj: 'yetkisiz erişim: bu işlem için yönetici yetkisi gereklidir'
      });
    }
  } catch (hata) {
    sonraki(hata);
  }
};

module.exports = adminYetkisiAraci;
