const jwt = require('jsonwebtoken');

// yetkilendirme ara katmanı - bearer token doğrulama
const yetkilendirmeAraci = (istek, yanit, sonraki) => {
  try {
    // authorization başlığını al
    const yetkilendirmeBasligi = istek.headers.authorization;

    // başlık yoksa hata döndür
    if (!yetkilendirmeBasligi) {
      return yanit.status(401).json({
        basarili: false,
        mesaj: 'erişim reddedildi, jeton bulunamadı'
      });
    }

    // bearer token formatını kontrol et
    if (!yetkilendirmeBasligi.startsWith('Bearer ')) {
      return yanit.status(401).json({
        basarili: false,
        mesaj: 'geçersiz jeton formatı'
      });
    }

    // jetonu ayıkla
    const jeton = yetkilendirmeBasligi.split(' ')[1];

    // jetonu doğrula
    const cozumlenmisVeri = jwt.verify(jeton, process.env.JWT_GIZLI_ANAHTAR);

    // kullanıcı bilgisini isteğe ekle
    istek.kullanici = {
      kullanici_id: cozumlenmisVeri.kullanici_id,
      kullanici_adi: cozumlenmisVeri.kullanici_adi,
      eposta: cozumlenmisVeri.eposta
    };

    sonraki();
  } catch (hata) {
    // jeton süresi dolmuşsa
    if (hata.name === 'TokenExpiredError') {
      return yanit.status(401).json({
        basarili: false,
        mesaj: 'jeton süresi dolmuş, lütfen tekrar giriş yapın'
      });
    }

    // geçersiz jeton
    return yanit.status(401).json({
      basarili: false,
      mesaj: 'geçersiz jeton'
    });
  }
};

module.exports = yetkilendirmeAraci;
